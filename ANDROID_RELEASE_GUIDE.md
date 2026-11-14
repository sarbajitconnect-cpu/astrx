# ASTRA AI — OFFICIAL ANDROID APPLICATION GUIDE

This document provides complete instructions for the **Official Astra AI Android Application**, built with Capacitor and native Android Studio tooling, preserving the exact visual identity, branding, and features of the live Astra AI website ([https://astrxai.com/](https://astrxai.com/)).

---

## 1. Deliverables Summary

All generated production binaries are organized in `dist-android/` and root:

| Deliverable | File Path | Size | Description |
|---|---|---|---|
| **Release APK** | `dist-android/Astra-AI-Release.apk` | ~7.05 MB | Release APK ready for direct sideloading and testing on any Android device |
| **Debug APK** | `dist-android/Astra-AI-Debug.apk` | ~8.62 MB | Debug APK with Chrome remote webview inspection enabled |
| **Release App Bundle (AAB)** | `dist-android/Astra-AI-Release.aab` | ~6.23 MB | Official release bundle for Google Play Console upload |
| **Android Studio Project** | `android/` | Full directory | Complete Gradle-based Android Studio project with native Java & Kotlin code |
| **Web Assets Bundle** | `www/` | Full directory | Production-bundled web assets with `config.js` and relative static linking |
| **Automated Build Script** | `scripts/build_android.py` | Executable | 1-command build script that bundles, syncs, compiles, and packages all targets |

---

## 2. Architecture & Design Preservation

### Visual & Functional Parity with Website
- **Cosmic Theme Preserved**: Status bar, navigation bar, and window background use Astra's signature `#0B0F17` / `#05070C` dark cosmic theme.
- **Identical UI Components**: Floating composer capsule, pill buttons, squircle action buttons, models/modes menu, file upload dashed card, and silk wave background wallpaper.
- **All Operational Modes**: Quick mode, Extended mode, and Code mode are fully functional and synchronized.
- **Mobile Responsive Drawer**: On mobile screens, the left sidebar becomes a fixed slide-out drawer accessible via the top-left hamburger menu.
- **Keyboard Protection**: `windowSoftInputMode="adjustResize"` in `AndroidManifest.xml` prevents the software keyboard from obscuring the chat composer.

### Native Android Features Implemented
1. **Camera & Photos**: Native Android camera intent, gallery image selection, and `getUserMedia` integration.
2. **Document Picker**: Multi-format document selection for PDF, DOCX, XLSX, TXT, CSV, JSON, and code files.
3. **Microphone & Voice**: Speech recognition and voice dictation with granted `RECORD_AUDIO` permission.
4. **Hardware Back Button**: Intelligent back navigation in `MainActivity.java` that closes open modals or the sidebar drawer before navigating web history.
5. **Astra Branding**: Official Astra logo formatted across all mipmap densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) and dark cosmic splash screens for portrait and landscape.

---

## 3. Website & App Synchronization

Both the live website and the Android application communicate with the same backend at **`https://astrxai.com`**:
- **Endpoint Configuration**: Defined in `www/config.js` (`window.ASTRA_API_BASE_URL`).
- **Synchronized Data**:
  - User accounts and login sessions.
  - Chat history and conversation IDs.
  - Uploaded documents and vector search indices.
  - Daily token quotas and rate limits.

---

## 4. Installation Instructions (Testing on Device)

### Option A: Direct Device Install via ADB
Connect your Android phone with USB Debugging enabled:
```bash
adb install -r dist-android/Astra-AI-Release.apk
# or install the debug variant:
adb install -r dist-android/Astra-AI-Debug.apk
```

### Option B: Sideloading via Download / Drive
1. Copy `dist-android/Astra-AI-Release.apk` to your phone via USB, Google Drive, or local server.
2. On your phone, tap the APK to install.
3. If prompted, allow "Install from unknown sources" for your file manager.

---

## 5. Building From Source

### Prerequisites
- JDK 21: `/opt/homebrew/opt/openjdk@21`
- Android SDK: Command Line Tools & Platforms 34/36
- Node.js & npm

### Automated 1-Command Build
Run the build script from the project root:
```bash
python3 scripts/build_android.py
```
This script automatically:
1. Re-bundles production web assets into `www/`.
2. Synchronizes Capacitor plugins.
3. Compiles `assembleDebug`, `assembleRelease`, and `bundleRelease`.
4. Copies deliverables to `dist-android/`.

### Manual Gradle Commands
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export ANDROID_SDK_ROOT=$ANDROID_HOME

cd android
./gradlew assembleDebug      # Creates app-debug.apk
./gradlew assembleRelease    # Creates app-release.apk
./gradlew bundleRelease      # Creates app-release.aab
```

---

## 6. Opening in Android Studio

1. Launch **Android Studio**.
2. Select **Open** and choose the `android/` directory inside `astrx share`.
3. Allow Gradle to sync.
4. Select a connected physical device or Android Virtual Device (AVD).
5. Click **Run** (`Shift + F10`) to build, deploy, and launch directly.

---

## 7. Google Play Publishing Instructions

To publish Astra AI on Google Play:

### Step 1: Create Google Play Console Account
- Sign in to [Google Play Console](https://play.google.com/console).
- Click **Create App** -> Name: `Astra AI` -> Default Language -> App / Free.

### Step 2: Prepare Release Keystore (Production Signing)
For production store releases, generate a dedicated private keystore:
```bash
keytool -genkey -v -keystore astra-release-key.jks -alias astra -keyalg RSA -keysize 2048 -validity 10000
```
Update `android/app/build.gradle` signing configuration with your production keystore.

### Step 3: Upload the App Bundle (.aab)
1. In Google Play Console, go to **Production** (or **Internal Testing**).
2. Click **Create new release**.
3. Upload `dist-android/Astra-AI-Release.aab`.
4. Add release notes detailing Astra AI's multimodal features and modes.

### Step 4: Store Listing & Privacy Policy
- **Short Description**: Advanced Multimodal AI assistant with live intelligence, document RAG, and coding capabilities.
- **Full Description**: Astra AI delivers autonomous reasoning across Quick, Extended, and Code modes with real-time web intelligence, academic research, and document understanding.
- **Privacy Policy URL**: `https://astrxai.com/privacy`
- **Category**: Productivity / Tools.
- **Target Audience**: 13+ (or per regional standards).
- **Data Safety Declaration**: State that user messages and documents are encrypted in transit via HTTPS and used solely for providing AI responses.

### Step 5: Review and Rollout
Click **Review release** -> **Start rollout to Production**!
