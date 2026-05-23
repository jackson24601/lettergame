# Letter Lagoon for iOS

This folder contains a native Xcode wrapper for the static Letter Lagoon game.
The iOS app uses SwiftUI and `WKWebView` to load the same bundled `index.html`,
`game.js`, and `styles.css` files that power the web version. No network access
is required for gameplay.

## Open in Xcode

1. Install Xcode 15 or newer on macOS.
2. Open `ios/LetterLagoon/LetterLagoon.xcodeproj`.
3. Select the `LetterLagoon` target.
4. In **Signing & Capabilities**, choose your Apple Developer Team.
5. Change the Bundle Identifier from `com.example.letterlagoon` to one you own,
   such as `com.yourname.letterlagoon`.
6. Choose an iPhone or iPad simulator and press **Run**.

## App Store checklist

Before archiving for App Store Connect:

- Confirm the display name, bundle identifier, version, and build number.
- Replace or refine the generated app icon if desired.
- Test on physical iPhone and iPad devices.
- Prepare screenshots, privacy answers, age rating, and app metadata in App
  Store Connect. The included privacy manifest declares no tracking and no
  collected data.
- Use **Product > Archive** in Xcode, then distribute the archive to App Store
  Connect.

## Updating the game

The Xcode project references the root web files directly as bundled resources.
When `index.html`, `game.js`, or `styles.css` changes, rebuild the iOS target to
include the latest game.
