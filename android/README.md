# FitDax Android

The Android package uses Google Android Browser Helper 2.7.4 (Apache 2.0) to open the production FitDax website in a Trusted Web Activity. It requires Android 7.0+ and a compatible browser. It is not a native offline fitness database: Google sign-in and synchronization need internet. The optional encrypted offline training copy works in supported browser storage after activation.

Package: com.ahmedmorgan.fitdax. Version 1.0.0 (1). Target SDK 36.

Build with JDK 17+ and Gradle 8.13: `gradlew assembleRelease bundleRelease`. Install the SDK and configure local.properties. The release signing key is private under .signing and excluded from source control and exports. Preserve an encrypted backup separately; future updates must use the same key. The existing website assetlinks.json contains this certificate's public SHA-256 fingerprint.

Permissions: internet and an AndroidX app-local signature permission. No health, camera, microphone, location, storage or contacts permission. No embedded WebView and no additional OAuth scopes.

APK signature and manifest are checked during release. Device execution and Google sign-in must still be tested on physical Android devices before broad distribution. No device was connected during this build. Google Play publication is not completed; a developer account, store declarations/review and the applicable digital subscription billing requirements are separate release steps. A signed AAB is a build artifact, not approval by Google Play.

Third-party components: Google Android Browser Helper and AndroidX, Apache License 2.0. Sources and licenses: https://github.com/GoogleChrome/android-browser-helper and https://source.android.com/docs/setup/about/licenses. Gradle's dependency report identifies the exact included versions.
