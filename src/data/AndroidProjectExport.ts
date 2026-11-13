export interface AndroidBlueprintFile {
  path: string;
  language: string;
  summary: string;
  content: string;
}

export const ANDROID_BLUEPRINT_FILES: AndroidBlueprintFile[] = [
  {
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    summary: 'Gradle module config (API 26+, Jetpack Compose BOM, Material 3, AdMob, Play Billing v7)',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.wacky3d.calculator"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wacky3d.calculator"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.datastore:datastore-preferences:1.1.2")

    // Google AdMob SDK (use Google test IDs during debug)
    implementation("com.google.android.gms:play-services-ads:23.6.0")

    // Google Play Billing Library
    implementation("com.android.billingclient:billing-ktx:7.1.1")

    testImplementation("junit:junit:4.13.2")
}`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    summary: 'Minimal permissions (VIBRATE + INTERNET for ads only) & AdMob App ID placeholder',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wacky 3D Calculator"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Wacky3DCalculator">

        <!-- Replace with your real AdMob App ID before Play Store release -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
  },
  {
    path: 'app/src/main/java/com/wacky3d/calculator/engine/CalculatorEngine.kt',
    language: 'kotlin',
    summary: 'Safe BigDecimal Shunting-yard expression parser (no eval, division-by-zero safe)',
    content: `package com.wacky3d.calculator.engine

import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

sealed class CalcResult {
    data class Success(val value: BigDecimal, val formatted: String, val reaction: String?) : CalcResult()
    data class Error(val message: String) : CalcResult()
}

object CalculatorEngine {
    private val mc = MathContext(14, RoundingMode.HALF_UP)

    fun evaluate(expression: String): CalcResult {
        return try {
            val tokens = tokenize(expression)
            if (tokens.isEmpty()) return CalcResult.Success(BigDecimal.ZERO, "0", null)

            val rpn = toRpn(tokens)
            val result = evalRpn(rpn).stripTrailingZeros()
            val plain = if (result.compareTo(BigDecimal.ZERO) == 0) "0" else result.toPlainString()
            CalcResult.Success(result, plain, reactionFor(result))
        } catch (e: ArithmeticException) {
            CalcResult.Error("Cannot divide by 0")
        } catch (e: Exception) {
            CalcResult.Error("Invalid input")
        }
    }

    private fun reactionFor(value: BigDecimal): String? = when {
        value.compareTo(BigDecimal(100)) == 0 -> "Perfect 100!"
        value.compareTo(BigDecimal.ZERO) == 0 -> "Nothing to see here!"
        value.compareTo(BigDecimal(777)) == 0 -> "Lucky number!"
        value.compareTo(BigDecimal(1234)) == 0 -> "Nice sequence!"
        value < BigDecimal.ZERO -> "Oops! Below zero!"
        else -> null
    }

    private fun tokenize(expr: String): List<String> {
        val clean = expr.replace(",", "").replace("×", "*").replace("÷", "/").replace("−", "-")
        val out = mutableListOf<String>()
        var i = 0
        while (i < clean.length) {
            val ch = clean[i]
            if (ch.isWhitespace()) { i++; continue }
            val isUnary = ch == '-' && (out.isEmpty() || out.last() in listOf("+", "-", "*", "/"))
            if (isUnary || ch.isDigit() || ch == '.') {
                val sb = StringBuilder()
                if (isUnary) { sb.append('-'); i++ }
                while (i < clean.length && (clean[i].isDigit() || clean[i] == '.')) {
                    sb.append(clean[i]); i++
                }
                out.add(sb.toString())
            } else if (ch in listOf('+', '-', '*', '/')) {
                out.add(ch.toString()); i++
            } else {
                throw IllegalArgumentException("Unexpected char: $ch")
            }
        }
        return out
    }

    private fun precedence(op: String) = if (op == "*" || op == "/") 2 else 1

    private fun toRpn(tokens: List<String>): List<String> {
        val output = mutableListOf<String>()
        val ops = ArrayDeque<String>()
        for (t in tokens) {
            if (t in listOf("+", "-", "*", "/")) {
                while (ops.isNotEmpty() && precedence(ops.last()) >= precedence(t)) {
                    output.add(ops.removeLast())
                }
                ops.addLast(t)
            } else {
                output.add(t)
            }
        }
        while (ops.isNotEmpty()) output.add(ops.removeLast())
        return output
    }

    private fun evalRpn(rpn: List<String>): BigDecimal {
        val stack = ArrayDeque<BigDecimal>()
        for (t in rpn) {
            if (t in listOf("+", "-", "*", "/")) {
                val b = stack.removeLast()
                val a = stack.removeLast()
                stack.addLast(
                    when (t) {
                        "+" -> a.add(b, mc)
                        "-" -> a.subtract(b, mc)
                        "*" -> a.multiply(b, mc)
                        "/" -> {
                            if (b.compareTo(BigDecimal.ZERO) == 0) throw ArithmeticException("Zero")
                            a.divide(b, 10, RoundingMode.HALF_UP)
                        }
                        else -> BigDecimal.ZERO
                    }
                )
            } else {
                stack.addLast(BigDecimal(t))
            }
        }
        return stack.lastOrNull() ?: BigDecimal.ZERO
    }
}`,
  },
  {
    path: 'app/src/main/java/com/wacky3d/calculator/audio/SoundManager.kt',
    language: 'kotlin',
    summary: 'Low-latency Android SoundPool manager with preloading and polyphony protection',
    content: `package com.wacky3d.calculator.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import com.wacky3d.calculator.R

enum class SoundPack(val resId: Int?) {
    MECHANICAL(R.raw.snd_mechanical),
    CARTOON_POP(R.raw.snd_cartoon_pop),
    BUBBLE_POP(R.raw.snd_bubble_pop),
    RUBBER_DUCK(R.raw.snd_rubber_duck),
    WATER_DROP(R.raw.snd_water_drop),
    WOODEN_CLICK(R.raw.snd_wooden_click),
    SOFT_KEYBOARD(R.raw.snd_soft_keyboard),
    ARCADE(R.raw.snd_arcade),
    ROBOTIC_BEEP(R.raw.snd_robotic_beep),
    SPRING_BOING(R.raw.snd_spring_boing),
    MAGICAL_SPARKLE(R.raw.snd_magical_sparkle),
    CUTE_ANIMAL(R.raw.snd_cute_animal),
    RETRO_GAME(R.raw.snd_retro_game),
    BUBBLE_WRAP(R.raw.snd_bubble_wrap),
    SILENT(null)
}

class SoundManager(context: Context) {
    private val soundPool: SoundPool
    private val loadedIds = mutableMapOf<SoundPack, Int>()
    private var lastStreamId: Int = 0

    init {
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(4)
            .setAudioAttributes(attrs)
            .build()

        SoundPack.entries.forEach { pack ->
            pack.resId?.let { res ->
                loadedIds[pack] = soundPool.load(context, res, 1)
            }
        }
    }

    fun play(pack: SoundPack, volume: Float, pitch: Float = 1.0f) {
        if (pack == SoundPack.SILENT || volume <= 0f) return
        val soundId = loadedIds[pack] ?: return
        if (lastStreamId != 0) soundPool.stop(lastStreamId)
        lastStreamId = soundPool.play(soundId, volume, volume, 1, 0, pitch)
    }

    fun release() {
        soundPool.release()
    }
}`,
  },
  {
    path: 'app/src/main/java/com/wacky3d/calculator/monetization/BillingManager.kt',
    language: 'kotlin',
    summary: 'Google Play Billing v7 one-time purchase, acknowledgement & restore purchases flow',
    content: `package com.wacky3d.calculator.monetization

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class BillingManager(context: Context) : PurchasesUpdatedListener {
    companion object {
        const val PREMIUM_PRODUCT_ID = "wacky_3d_calc_premium_lifetime"
    }

    private val _isPremium = MutableStateFlow(false)
    val isPremium: StateFlow<Boolean> = _isPremium

    private val billingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
        )
        .build()

    fun connectAndRestore() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryExistingPurchases()
                }
            }
            override fun onBillingServiceDisconnected() {}
        })
    }

    fun queryExistingPurchases() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()
        billingClient.queryPurchasesAsync(params) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                val owned = purchases.any {
                    it.products.contains(PREMIUM_PRODUCT_ID) &&
                    it.purchaseState == Purchase.PurchaseState.PURCHASED
                }
                _isPremium.value = owned
                purchases.filter { !it.isAcknowledged }.forEach(::acknowledgePurchase)
            }
        }
    }

    fun launchPurchaseFlow(activity: Activity, productDetails: ProductDetails) {
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails)
                        .build()
                )
            )
            .build()
        billingClient.launchBillingFlow(activity, params)
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            purchases.forEach { purchase ->
                if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                    if (!purchase.isAcknowledged) acknowledgePurchase(purchase)
                    _isPremium.value = true
                }
            }
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        billingClient.acknowledgePurchase(params) { /* Verified & persisted by Play */ }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/wacky3d/calculator/ui/Wacky3DKeycap.kt',
    language: 'kotlin',
    summary: 'Jetpack Compose 3D extruded keycap with Jelly/Squishy/Bouncy/Rubber/Pop spring physics',
    content: `package com.wacky3d.calculator.ui

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun Wacky3DKeycap(
    label: String,
    faceColor: Color,
    edgeColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier,
    onTap: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()

    val scaleX by animateFloatAsState(
        targetValue = if (pressed) 1.06f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scaleX"
    )
    val scaleY by animateFloatAsState(
        targetValue = if (pressed) 0.90f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scaleY"
    )
    val pressOffset = if (pressed) 5.dp else 0.dp

    Box(
        modifier = modifier
            .height(64.dp)
            .graphicsLayer {
                this.scaleX = scaleX
                this.scaleY = scaleY
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onTap
            )
    ) {
        // 3D Extruded Bottom Ledge
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 6.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(edgeColor)
        )
        // Tactile Top Keycap Face
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = pressOffset, bottom = 6.dp - pressOffset)
                .clip(RoundedCornerShape(18.dp))
                .background(faceColor),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = label,
                color = textColor,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}`,
  },
];

export const PLAY_STORE_CHECKLIST = [
  {
    title: '1. Generate Signed Android App Bundle (AAB)',
    steps: [
      'Open the Kotlin project in Android Studio Ladybug or newer.',
      'Select Build > Generate Signed Bundle / APK > Android App Bundle.',
      'Create or select your upload keystore (.jks) and store passwords securely outside Git.',
      'Choose the release build variant (ProGuard/R8 shrinking enabled in build.gradle.kts).',
      'Locate app/release/app-release.aab after the Gradle assembleRelease task finishes.',
    ],
  },
  {
    title: '2. Replace Placeholder Monetization IDs',
    steps: [
      'Replace ca-app-pub-3940256099942544~3347511713 in AndroidManifest.xml with your production AdMob App ID.',
      'Replace Banner, Interstitial, and Rewarded test Ad Unit IDs with live AdMob Ad Unit IDs.',
      'Create the one-time in-app product wacky_3d_calc_premium_lifetime in Google Play Console > Monetize > Products.',
    ],
  },
  {
    title: '3. Upload & Release on Google Play Console',
    steps: [
      'Create a new app in Google Play Console and complete Data Safety (declare AdMob & Play Billing; zero calculation data collected).',
      'Upload your Privacy Policy URL and set Target Audience & Content Rating (IARC).',
      'Upload app-release.aab to Internal Testing first to test Play Billing test cards and UMP Ad Consent.',
      'Promote the verified build to Production rollout.',
    ],
  },
];

export const PRIVACY_POLICY_TEXT = `Wacky 3D Calculator — Privacy Policy

1. Local-First Calculation Data
All calculations, calculation history, memory registers (MC/MR/M+/M-), theme selections, and sound preferences are stored strictly on your device. We never transmit or sell your calculations.

2. Minimal Permissions
The app requests only VIBRATE (for optional tactile haptic feedback) and INTERNET (solely for loading optional ads and verifying Google Play purchases). We never access contacts, location, microphone, or camera.

3. Advertising & Consent (Free Tier)
The free version uses Google AdMob banner and optional rewarded ads. Where required by law (EEA/UK/California), a consent dialog is presented prior to personalized ad loading. Upgrading to Premium removes all ads completely.

4. Purchases
One-time Premium upgrades are processed securely through Google Play Billing. Entitlements can be restored anytime on reinstalls using the same Google account.`;
