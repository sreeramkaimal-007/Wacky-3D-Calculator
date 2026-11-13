# Wacky 3D Calculator — Google Play Store Release Checklist

A step-by-step pre-release, signing, store asset, and Play Console submission checklist for **Wacky 3D Calculator** (`com.wacky3d.calculator`).

---

## 1. Project & Packaging Readiness

- [ ] **Choose Android packaging path**
  - **Path A (Capacitor Offline WebView Bundle):** Run `npm run build`, sync into `android/` via `npx cap add android && npx cap sync android`, and wire native AdMob (`@capacitor-community/admob`) + Play Billing (`cordova-plugin-purchase` or RevenueCat).
  - **Path B (Native Kotlin + Jetpack Compose):** Copy the Kotlin/Compose files from the app's **Android Studio Export** drawer, add `.ogg`/`.wav` sound assets to `app/src/main/res/raw/`, and verify all 15 sound packs preload in `SoundPool`.
- [ ] **Verify Gradle & Manifest identifiers** (`app/build.gradle.kts` & `AndroidManifest.xml`)
  - `applicationId = "com.wacky3d.calculator"` (unique reverse-domain ID; cannot be changed after first Play upload)
  - `minSdk = 26` (Android 8.0+)
  - `targetSdk = 35` (meets current Google Play target API level policy)
  - `versionCode = 1` (increment by `+1` on every `.aab` upload)
  - `versionName = "1.0.0"`
- [ ] **Audit Android permissions**
  - Confirm `AndroidManifest.xml` requests **only** `android.permission.VIBRATE` and `android.permission.INTERNET`.
  - Confirm no sensitive permissions (location, contacts, camera, microphone, storage) are declared.
- [ ] **Replace test monetization IDs with live production IDs**
  - Replace Google's test AdMob App ID (`ca-app-pub-3940256099942544~3347511713`) in `AndroidManifest.xml` with your real AdMob App ID.
  - Replace test Banner, Interstitial, and Rewarded Ad Unit IDs with your live AdMob Ad Unit IDs.
  - Integrate Google **UMP (User Messaging Platform) SDK** to display GDPR/EEA/UK ad consent prompts where required.
  - Confirm test ads are disabled in `release` builds and real ads are never clicked during testing (register test devices in AdMob instead).

---

## 2. Generating App Signing Keys & Configuring AAB Signing

Google Play requires apps to be signed with an **Upload Key**, with **Play App Signing** managing the final distribution key.

### A. Generate Your Upload Keystore (`.jks`)

- [ ] **Option 1 — Via Android Studio UI**
  1. Open **Build → Generate Signed App Bundle / APK**.
  2. Select **Android App Bundle** → **Next**.
  3. Under *Key store path*, click **Create new...**
  4. Save the keystore outside your Git repository (e.g., `~/keystores/wacky3d-upload-key.jks`).
  5. Set a strong **Key store password**, **Key alias** (e.g., `wacky3d-upload`), **Key password**, and certificate details (Validity: `25` years).

- [ ] **Option 2 — Via `keytool` CLI**
  ```bash
  keytool -genkeypair -v \
    -keystore wacky3d-upload-key.jks \
    -alias wacky3d-upload \
    -keyalg RSA \
    -keysize 2048 \
    -validity 9125
  ```

- [ ] **Back up your keystore immediately**
  - Store `wacky3d-upload-key.jks`, alias, and both passwords in an encrypted password manager / offline backup.
  - Confirm `*.jks`, `*.keystore`, and `keystore.properties` are listed in `.gitignore` so secrets are never committed.

### B. Configure Gradle Release Signing (`app/build.gradle.kts`)

- [ ] **Create a local `keystore.properties` file** (at project root, untracked by Git):
  ```properties
  storeFile=/absolute/path/to/wacky3d-upload-key.jks
  storePassword=YOUR_STORE_PASSWORD
  keyAlias=wacky3d-upload
  keyPassword=YOUR_KEY_PASSWORD
  ```
- [ ] **Wire `signingConfigs` and shrinking in `app/build.gradle.kts`**:
  ```kotlin
  import java.util.Properties
  import java.io.FileInputStream

  val keystoreProps = Properties().apply {
      val file = rootProject.file("keystore.properties")
      if (file.exists()) load(FileInputStream(file))
  }

  android {
      signingConfigs {
          create("release") {
              storeFile = keystoreProps.getProperty("storeFile")?.let { file(it) }
              storePassword = keystoreProps.getProperty("storePassword")
              keyAlias = keystoreProps.getProperty("keyAlias")
              keyPassword = keystoreProps.getProperty("keyPassword")
          }
      }

      buildTypes {
          release {
              signingConfig = signingConfigs.getByName("release")
              isMinifyEnabled = true
              isShrinkResources = true
              proguardFiles(
                  getDefaultProguardFile("proguard-android-optimize.txt"),
                  "proguard-rules.pro"
              )
          }
      }
  }
  ```

### C. Build & Verify the Signed App Bundle (`.aab`)

- [ ] **Generate the release `.aab`**:
  - Via Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle → release**.
  - Or via Gradle CLI:
    ```bash
    ./gradlew bundleRelease
    ```
  - Output file location: `app/build/outputs/bundle/release/app-release.aab`
- [ ] **Verify the bundle signature** before uploading:
  ```bash
  jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
  ```
  Confirm output includes `jar verified.`
- [ ] **Test the release build on a real device** (optional APK extraction via `bundletool`):
  ```bash
  bundletool build-apks --bundle=app-release.aab --output=app.apks --mode=universal
  ```
  Verify offline math, sound playback, 3D animations, dark/light themes, and ProGuard rules (no stripped AdMob/Billing classes).

---

## 3. Preparing Google Play Store Graphics & Copy Assets

Prepare all required Store Listing assets before submitting your release:

### A. Visual Assets

- [ ] **High-Res App Icon**
  - Size: **`512 × 512 px`**
  - Format: 32-bit PNG (alpha channel allowed, max 1024 KB)
  - Design: Export a crisp render of the 3D toy calculator icon with high contrast and no corner clipping issues (Play Store applies dynamic rounded-square masking).
- [ ] **Feature Graphic (Required)**
  - Size: **`1024 × 500 px`**
  - Format: JPEG or 24-bit PNG (no alpha)
  - Design tips: Showcase the Wacky 3D Calculator chassis and colorful 3D keycaps on a clean studio backdrop; keep important text/visuals away from the outer 15% safe margin.
- [ ] **Phone Screenshots (Required: minimum 2, recommended 5–8)**
  - Aspect ratio: `9:16` or `16:9` (recommended portrait **`1080 × 1920 px`** or **`1080 × 2400 px`**), JPEG or 24-bit PNG, max 8 MB each.
  - Recommended screenshot sequence:
    1. **Main 3D Calculator** (Candy World or Rainbow Pop theme showing glossy display + funny reaction `"Perfect 100!"`)
    2. **Sound Studio** (highlighting 15 playful sound packs + Random Mode + Sound Test)
    3. **Theme Store** (showing all 8 colorful themes + Light/Dark modes)
    4. **3D Button Physics & Settings** (Jelly, Squishy, Bouncy, Rubber, Pop styles)
    5. **Calculation History & Memory** (`MC/MR/M+/M-` and tap-to-reuse history list)
- [ ] **Tablet Screenshots (Recommended if supporting large screens)**
  - 7-inch and 10-inch tablet screenshots (`1200 × 1920 px` or landscape `1920 × 1200 px`).
- [ ] **Optional Promo Video**
  - Public YouTube URL (15–30 seconds demonstrating key squishes, sound effects, and theme switching).

### B. Store Listing Copy

- [ ] **App Name** (max 30 chars): `Wacky 3D Calculator`
- [ ] **Short Description** (max 80 chars):  
  `Playful 3D toy calculator with squishy keys, 15 sound packs & 8 colorful themes.`
- [ ] **Full Description** (max 4,000 chars):
  - Highlight everyday reliability (operator precedence, percentages, memory `MC/MR/M+/M-`, calculation history, offline use).
  - Highlight fun customization (5 tactile 3D button animations, 15 sound packs, Random Mode, 8 themes, optional funny reactions).
  - Clearly disclose optional Ad-Free / all-unlocks one-time Premium upgrade.
- [ ] **Category & Contact Details**
  - Category: **Tools** (or **Productivity**)
  - Tags: Calculator, Utilities
  - Support email, optional website, and public Privacy Policy URL.

---

## 4. Setting Up Google Play Console

- [ ] **Register & Verify Developer Account**
  - Sign up at [Google Play Console](https://play.google.com/console) ($25 one-time fee) and complete identity verification (plus D-U-N-S verification if registering as an organization).
- [ ] **Create the App**
  - Click **Create app** → Name: `Wacky 3D Calculator`, Default language: English, Type: App, Pricing: **Free**.
- [ ] **Configure Play App Signing**
  - Under **Setup → App signing**, opt in to **Play App Signing** (recommended default; Google secures the final signing key while you sign uploads with your `.jks` upload key).
- [ ] **Configure In-App Purchase Product (Google Play Billing)**
  - Go to **Monetize → Products → In-app products → Create product**.
  - Product ID: `wacky_3d_calc_premium_lifetime` (must match `BillingManager.kt` exactly).
  - Name: `Wacky 3D Premium (Lifetime)`
  - Set price (e.g., `$2.99`) and click **Activate**.
- [ ] **Complete Required App Content Declarations** (**Policy → App content**)
  - **Privacy Policy**: Host your Privacy Policy on a public HTTPS URL (use the template from the app's Settings/Export drawer) and paste the link.
  - **Ads**: Declare *"Yes, my app contains ads"* (required for free tier with AdMob).
  - **App Access**: Declare *"All functionality is available without special access"* (no login wall).
  - **Content Rating (IARC)**: Complete the questionnaire (typically rated **Everyone / PEGI 3**).
  - **Target Audience & Content**: Select appropriate age groups (if targeting general users/13+, ensure Families Policy compliance is reviewed if children under 13 are included).
  - **Data Safety**:
    - Declare that calculation inputs, history, and preferences stay local on-device and are not collected.
    - Declare AdMob SDK collection of Advertising ID / Device IDs (for advertising & fraud prevention) and Play Billing purchase tokens (for app functionality).

---

## 5. Testing, Verification & Production Rollout

- [ ] **Internal Testing Release**
  1. Go to **Testing → Internal testing → Create new release**.
  2. Upload `app-release.aab`, add release notes (`1.0.0 Initial release`), and roll out to your internal tester list.
  3. Under **Setup → License testing**, add tester Gmail accounts so you can test the `wacky_3d_calc_premium_lifetime` purchase flow with test cards (no real charge).
  4. Verify on a physical Android phone:
     - Offline calculations, operator precedence, division-by-zero, history & memory persistence across app restarts.
     - Rapid key tapping without audio overlap/stutter.
     - AdMob banner non-obstruction and UMP consent flow.
     - Premium purchase, ad removal immediately after purchase, and **Restore Purchases** after reinstalling.
- [ ] **Closed Testing (Required for New Personal Developer Accounts)**
  - If your Google Play Developer account is a new personal account (created after Nov 2023), run a **Closed test with at least 12 opted-in testers continuously for 14 days** before applying for Production access.
- [ ] **Review Pre-launch Report**
  - Check **Release → Testing → Pre-launch report** for automated crawl crashes, ANRs, contrast warnings, or layout clipping across different Android screen sizes.
- [ ] **Submit to Production**
  1. Go to **Release → Production → Create new release** (or promote your verified tested release).
  2. Review warnings/errors in the **Publishing overview** tab.
  3. Click **Send for review** (standard review takes 1–7 days).
- [ ] **Post-Launch Checks**
  - Confirm `app-ads.txt` is hosted on your developer website domain (linked in Play Console) to protect AdMob revenue.
  - Monitor **Android Vitals** (crash rate / ANR rate) and **Play Console → Order management** for purchase acknowledgements.
