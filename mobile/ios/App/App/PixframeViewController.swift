import UIKit
import Capacitor

class PixframeViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        // Register local plugins BEFORE the WebView loads.
        // This ensures the plugin JS bridge is injected at document start.
        bridge?.registerPluginInstance(PhotoLibraryPickerPlugin())
    }
}
