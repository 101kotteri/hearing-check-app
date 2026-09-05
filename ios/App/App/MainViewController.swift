import Capacitor
import UIKit

// This app is a fixed-size canvas that JS scales to exactly fit the
// viewport (see App.ts's fitToScreen) — there is no legitimate scrolling
// anywhere on any screen. But WKWebView hosts its content in its own
// native UIScrollView, entirely separate from the page's own CSS
// `overflow:hidden` (already set in style.css, and irrelevant here since
// it only governs the page's own internal scrolling, not this outer
// native container) — that scroll view still rubber-bands on touch by
// default. Confirmed via real-device/simulator testing: EXIT and the
// language-switcher button visibly "shook" on press, most likely this
// native bounce reacting to the small amount of finger movement any real
// touch has, even when tapping a fixed button rather than dragging.
// Disabling bounce (and scrolling outright, since none is ever wanted)
// removes the effect at its source.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.scrollView.bounces = false
        webView?.scrollView.isScrollEnabled = false
    }

    // SavePhotoPlugin is a local plugin (no npm package, just this Xcode
    // project — see project.pbxproj), not something `npx cap sync` knows to
    // wire up automatically. Explicit registration here removes any
    // dependence on CAPBridgedPlugin's own auto-discovery actually firing.
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SavePhotoPlugin())
    }
}
