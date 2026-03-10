import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var didInstallNativeInteractionGuards = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DispatchQueue.main.async {
            self.configureNativeWebViewInteractions()
            self.setNativeBackgroundColor()
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        configureNativeWebViewInteractions()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func setNativeBackgroundColor() {
        guard let bridgeViewController = findBridgeViewController(from: window?.rootViewController),
              let webView = bridgeViewController.webView else {
            return
        }
        // Set white background on WebView and its scroll view so the status bar area
        // and scroll-bounce regions show white instead of the default black.
        webView.isOpaque = false
        webView.backgroundColor = .white
        webView.scrollView.backgroundColor = .white
        bridgeViewController.view.backgroundColor = .white
    }

    private func configureNativeWebViewInteractions() {
        guard let bridgeViewController = findBridgeViewController(from: window?.rootViewController),
              let webView = bridgeViewController.webView else {
            return
        }
        webView.allowsLinkPreview = false
        guard !didInstallNativeInteractionGuards else {
            return
        }

        let scriptSource = """
        (function() {
          if (window.__pixframeNativeGuardApplied) return;
          window.__pixframeNativeGuardApplied = true;
          function isEditable(target) {
            if (!(target instanceof Element)) return false;
            return !!target.closest('input, textarea, [contenteditable="true"], [contenteditable=""], .allow-text-selection');
          }
          document.addEventListener('contextmenu', function(event) {
            if (!isEditable(event.target)) event.preventDefault();
          }, { capture: true });
          document.addEventListener('selectstart', function(event) {
            if (!isEditable(event.target)) event.preventDefault();
          }, { capture: true });
        })();
        """

        let script = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        webView.configuration.userContentController.addUserScript(script)
        didInstallNativeInteractionGuards = true
    }

    private func findBridgeViewController(from root: UIViewController?) -> CAPBridgeViewController? {
        guard let root = root else {
            return nil
        }
        if let bridgeViewController = root as? CAPBridgeViewController {
            return bridgeViewController
        }
        if let navigationController = root as? UINavigationController {
            return findBridgeViewController(from: navigationController.visibleViewController ?? navigationController.topViewController)
        }
        if let tabBarController = root as? UITabBarController {
            return findBridgeViewController(from: tabBarController.selectedViewController)
        }
        for child in root.children {
            if let bridgeViewController = findBridgeViewController(from: child) {
                return bridgeViewController
            }
        }
        return findBridgeViewController(from: root.presentedViewController)
    }

}
