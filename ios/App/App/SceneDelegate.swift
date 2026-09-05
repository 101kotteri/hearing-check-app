import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        // MainViewController, not the bare CAPBridgeViewController — it
        // carries the scroll-bounce fix (see that file) and now also
        // registers SavePhotoPlugin via capacitorDidLoad(). This line had
        // reverted to plain CAPBridgeViewController() at some point (most
        // likely a `cap sync`/Capacitor-version-change regenerating this
        // boilerplate file from its own template), which silently dropped
        // both — found via a from-scratch os_log diagnostic after
        // MainViewController's own logging never appeared at all.
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
