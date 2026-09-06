import Capacitor
import StoreKit

// A minimal local Capacitor plugin (no npm package — registered directly in
// this Xcode project, see project.pbxproj and MainViewController.swift,
// same pattern as SavePhotoPlugin) wrapping StoreKit 2's async/await API
// (available from iOS 15, this project's deployment target).
//
// Product IDs are defined once in src/constants.ts and must match both
// ios/App/App/Products.storekit (local Simulator/Xcode testing — see that
// file's own comments) and, later, the real in-app purchase records in App
// Store Connect.
//
// StoreKit's `Transaction.currentEntitlements` is the source of truth for
// what a user owns — this plugin never caches ownership itself, it just
// asks StoreKit fresh every time (getEntitlements, and again after every
// purchase/restore) and hands the raw product ID list back to JS, which
// derives the effective Plan from it (see constants.ts's planFromEntitlements).
@objc(StoreKitPurchasePlugin)
public class StoreKitPurchasePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPurchasePlugin"
    public let jsName = "StoreKitPurchase"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            call.resolve(["productIds": await Self.currentEntitlementIds()])
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.reject("Transaction could not be verified")
                        return
                    }
                    await transaction.finish()
                    call.resolve(["productIds": await Self.currentEntitlementIds(), "cancelled": false])
                case .userCancelled, .pending:
                    // Not an error — the caller distinguishes this via
                    // `cancelled` and shows no error message for it.
                    call.resolve(["productIds": await Self.currentEntitlementIds(), "cancelled": true])
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                call.resolve(["productIds": await Self.currentEntitlementIds()])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    private static func currentEntitlementIds() async -> [String] {
        var ids: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                ids.append(transaction.productID)
            }
        }
        return ids
    }
}
