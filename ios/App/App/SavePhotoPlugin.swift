import Capacitor
import Photos
import UIKit

// A minimal local Capacitor plugin (no npm package — registered directly in
// this Xcode project, see project.pbxproj) that saves an image straight to
// the Photos library. Per explicit direction: routing "save as image"
// through the OS share sheet (Share.share, like the PDF path still does)
// surfaced "Add to Shared Album" — an iCloud Shared Albums action that needs
// an Apple ID signed in — ahead of/alongside the plain "Save Image" action,
// which was confusing and, on this un-signed-in simulator, didn't work at
// all. PHPhotoLibrary writes to the local Photos library directly, with no
// account and no share sheet involved.
@objc(SavePhotoPlugin)
public class SavePhotoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SavePhotoPlugin"
    public let jsName = "SavePhoto"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveImage", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveImage(_ call: CAPPluginCall) {
        guard let base64 = call.getString("data"),
              let data = Data(base64Encoded: base64),
              let image = UIImage(data: data) else {
            call.reject("Invalid image data")
            return
        }
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                call.reject("Photo library access denied")
                return
            }
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }, completionHandler: { success, error in
                if success {
                    call.resolve()
                } else {
                    call.reject(error?.localizedDescription ?? "Failed to save image")
                }
            })
        }
    }
}
