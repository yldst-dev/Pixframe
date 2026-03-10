import Foundation
import Capacitor
import PhotosUI
import UniformTypeIdentifiers

@objc(PhotoLibraryPickerPlugin)
public class PhotoLibraryPickerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhotoLibraryPickerPlugin"
    public let jsName = "PhotoLibraryPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickFromLibrary", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickFromFiles", returnType: CAPPluginReturnPromise)
    ]

    private var savedCall: CAPPluginCall?

    // MARK: - Pick from Photo Library (PHPicker)

    @objc func pickFromLibrary(_ call: CAPPluginCall) {
        savedCall = call

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let viewController = self.bridge?.viewController else {
                call.reject("Unable to present picker: no view controller available")
                return
            }

            self.showPhotoLibraryPicker(on: viewController)
        }
    }

    // MARK: - Pick from Files (UIDocumentPicker)

    @objc func pickFromFiles(_ call: CAPPluginCall) {
        savedCall = call

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let viewController = self.bridge?.viewController else {
                call.reject("Unable to present picker: no view controller available")
                return
            }

            self.showDocumentPicker(on: viewController)
        }
    }

    // MARK: - Photo Library (PHPicker)

    private func showPhotoLibraryPicker(on viewController: UIViewController) {
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.selectionLimit = 0 // unlimited
        config.filter = .images

        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        picker.modalPresentationStyle = .fullScreen

        viewController.present(picker, animated: true)
    }

    // MARK: - Document Picker

    private func showDocumentPicker(on viewController: UIViewController) {
        let supportedTypes: [UTType] = [.image, .jpeg, .png, .gif, .bmp, .tiff, .webP, .heic, .heif]
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: supportedTypes, asCopy: true)
        picker.delegate = self
        picker.allowsMultipleSelection = true
        picker.modalPresentationStyle = .fullScreen

        viewController.present(picker, animated: true)
    }

    // MARK: - Helpers

    private func resolveWithFileData(_ fileDataArray: [[String: String]]) {
        guard let call = savedCall else { return }
        savedCall = nil
        call.resolve(["files": fileDataArray])
    }

    private func rejectWithError(_ message: String) {
        guard let call = savedCall else { return }
        savedCall = nil
        call.reject(message)
    }

    private func resolveEmpty() {
        guard let call = savedCall else { return }
        savedCall = nil
        call.resolve(["files": []])
    }

    private func loadImageData(from url: URL) -> (data: Data, mimeType: String, filename: String)? {
        guard let data = try? Data(contentsOf: url) else { return nil }

        let filename = url.lastPathComponent
        let ext = url.pathExtension.lowercased()
        let mimeType: String
        switch ext {
        case "jpg", "jpeg": mimeType = "image/jpeg"
        case "png": mimeType = "image/png"
        case "gif": mimeType = "image/gif"
        case "webp": mimeType = "image/webp"
        case "bmp": mimeType = "image/bmp"
        case "tiff", "tif": mimeType = "image/tiff"
        case "heic": mimeType = "image/heic"
        case "heif": mimeType = "image/heif"
        default: mimeType = "image/jpeg"
        }

        return (data, mimeType, filename)
    }
}

// MARK: - PHPickerViewControllerDelegate

extension PhotoLibraryPickerPlugin: PHPickerViewControllerDelegate {
    public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)

        if results.isEmpty {
            resolveEmpty()
            return
        }

        let group = DispatchGroup()
        var fileDataArray: [[String: String]] = []
        let lock = NSLock()

        for result in results {
            let provider = result.itemProvider

            guard provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else {
                continue
            }

            group.enter()
            provider.loadFileRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] url, error in
                defer { group.leave() }

                if let error = error {
                    CAPLog.print("⚡️ PhotoLibraryPicker: Error loading image: \(error.localizedDescription)")
                    return
                }

                guard let sourceURL = url,
                      let result = self?.loadImageData(from: sourceURL) else {
                    return
                }

                let base64 = result.data.base64EncodedString()
                let entry: [String: String] = [
                    "base64": base64,
                    "mimeType": result.mimeType,
                    "filename": result.filename
                ]

                lock.lock()
                fileDataArray.append(entry)
                lock.unlock()
            }
        }

        group.notify(queue: .main) { [weak self] in
            if fileDataArray.isEmpty {
                self?.rejectWithError("Failed to load any images")
            } else {
                self?.resolveWithFileData(fileDataArray)
            }
        }
    }
}

// MARK: - UIDocumentPickerDelegate

extension PhotoLibraryPickerPlugin: UIDocumentPickerDelegate {
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        var fileDataArray: [[String: String]] = []

        for url in urls {
            let accessing = url.startAccessingSecurityScopedResource()
            defer {
                if accessing {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            guard let result = loadImageData(from: url) else {
                CAPLog.print("⚡️ PhotoLibraryPicker: Could not read file: \(url.lastPathComponent)")
                continue
            }

            let base64 = result.data.base64EncodedString()
            let entry: [String: String] = [
                "base64": base64,
                "mimeType": result.mimeType,
                "filename": result.filename
            ]
            fileDataArray.append(entry)
        }

        if fileDataArray.isEmpty {
            rejectWithError("Failed to load any images from documents")
        } else {
            resolveWithFileData(fileDataArray)
        }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        resolveEmpty()
    }
}
