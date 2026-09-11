# BizReels Android Native Integration & API Developer Guide

> **Platform Version:** 1.4.0  
> **Target Platform:** Android (Native Kotlin, Android 8.0+ / API Level 26+)  
> **Network Libraries:** Retrofit 2, OkHttp 4, Kotlin Coroutines, Gson / Kotlinx.serialization  
> **Backend Source of Truth:** `backend/src/`  

---

## 1. Quick Integration Checklist for Android Developers

This guide provides everything an Android engineer needs to build the native BizReels mobile application without needing to inspect the backend Node.js codebase.

| Parameter | Value / Implementation Note |
|---|---|
| **Production Base URL** | `https://bizreels.in/api/v1/` *(Always include trailing slash in Retrofit)* |
| **Development Base URL** | `http://10.0.2.2:5000/api/v1/` *(Android Emulator localhost alias)* |
| **Authentication Scheme** | Bearer JWT Token (`Authorization: Bearer <token>`) |
| **Token Storage** | `EncryptedSharedPreferences` / Jetpack Security DataStore |
| **Custom App Scheme** | `bizreel://` (Deep linking for OAuth & Shared Reels) |
| **Payment Gateway** | Razorpay Android Standard Checkout SDK |
| **Media Hosting** | Cloudinary Android SDK / Multipart Direct Upload |

---

## 2. Android Manifest & Network Security Configuration

### 2.1 `AndroidManifest.xml` Deep Links & Permissions
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <application
        android:networkSecurityConfig="@xml/network_security_config"
        android:theme="@style/Theme.BizReels">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            
            <!-- Deep linking for Google OAuth and Share links -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                
                <data android:scheme="bizreel" android:host="auth" android:pathPrefix="/callback" />
                <data android:scheme="bizreel" android:host="reels" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 3. OkHttp Client & Token Lifecycle Management

### 3.1 Token Interceptor & Authenticator (Automatic 401 Recovery)
When an access token expires (after 15 minutes), OkHttp intercepts the `401 Unauthorized` response, executes a synchronized single-flight call to `/auth/refresh-token`, saves the new token pair, and retries the original request seamlessly.

```kotlin
package in.bizreels.android.network

import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class TokenManager(private val secureStorage: SecureStorage) : Interceptor, Authenticator {

    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .header("x-client-platform", "android")
            .header("x-client-version", "1.4.0")

        secureStorage.getAccessToken()?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }

        return chain.proceed(requestBuilder.build())
    }

    @Synchronized
    override fun authenticate(route: Route?, response: Response): Request? {
        // Prevent infinite loops if refresh token itself failed
        if (responseCount(response) >= 3) return null

        val currentRefreshToken = secureStorage.getRefreshToken() ?: return null

        // Execute synchronous refresh request
        val refreshClient = OkHttpClient()
        val refreshBody = RequestBody.create(
            MediaType.parse("application/json"),
            JSONObject().put("refreshToken", currentRefreshToken).toString()
        )
        val refreshRequest = Request.Builder()
            .url("https://bizreels.in/api/v1/auth/refresh-token")
            .post(refreshBody)
            .build()

        return try {
            val refreshResponse = refreshClient.newCall(refreshRequest).execute()
            if (refreshResponse.isSuccessful) {
                val json = JSONObject(refreshResponse.body()?.string() ?: "")
                val data = json.getJSONObject("data")
                val newAccessToken = data.getString("accessToken")
                val newRefreshToken = data.optString("refreshToken", currentRefreshToken)

                secureStorage.saveTokens(newAccessToken, newRefreshToken)

                // Retry original request with fresh access token
                response.request().newBuilder()
                    .header("Authorization", "Bearer $newAccessToken")
                    .build()
            } else {
                // Session expired: Clear tokens and broadcast logout
                secureStorage.clearTokens()
                null
            }
        } catch (e: IOException) {
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var prior = response.priorResponse()
        while (prior != null) {
            result++
            prior = prior.priorResponse()
        }
        return result
    }
}
```

---

## 4. Retrofit API Interface Definition

```kotlin
package in.bizreels.android.network

import in.bizreels.android.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface BizReelsApiService {

    // ── 1. Authentication ─────────────────────────────────────
    @POST("auth/otp/send")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<ApiResponse<OtpDispatchData>>

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<ApiResponse<AuthData>>

    @POST("auth/google/token")
    suspend fun googleTokenExchange(@Body request: GoogleTokenRequest): Response<ApiResponse<AuthData>>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<ApiResponse<User>>

    @PATCH("auth/switch-role")
    suspend fun switchRole(@Body request: SwitchRoleRequest): Response<ApiResponse<SwitchRoleData>>

    // ── 2. Feeds & Video Reels ───────────────────────────────
    @GET("feed/reels")
    suspend fun getReelsFeed(
        @Query("page") page: Int,
        @Query("limit") limit: Int
    ): Response<PaginatedResponse<Reel>>

    @POST("reels/{id}/like")
    suspend fun toggleLikeReel(@Path("id") reelId: String): Response<ApiResponse<LikeResult>>

    @POST("reels/{id}/comments")
    suspend fun postComment(
        @Path("id") reelId: String,
        @Body request: CommentRequest
    ): Response<ApiResponse<Comment>>

    // ── 3. Catalog Listings ──────────────────────────────────
    @GET("listings")
    suspend fun getListings(
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("category") category: String?,
        @Query("lat") lat: Double?,
        @Query("lng") lng: Double?,
        @Query("radius") radiusKm: Int?
    ): Response<PaginatedResponse<Listing>>

    @GET("listings/{id}")
    suspend fun getListingDetails(@Path("id") listingId: String): Response<ApiResponse<Listing>>

    // ── 4. Cart & Checkout ────────────────────────────────────
    @GET("cart")
    suspend fun getCart(): Response<ApiResponse<Cart>>

    @POST("cart/add")
    suspend fun addToCart(@Body request: AddToCartRequest): Response<ApiResponse<Cart>>

    @PATCH("cart/items/{listing_id}")
    suspend fun updateCartQuantity(
        @Path("listing_id") listingId: String,
        @Body request: UpdateQuantityRequest
    ): Response<ApiResponse<Cart>>

    @POST("cart/checkout")
    suspend fun checkout(@Body request: CheckoutRequest): Response<ApiResponse<CheckoutData>>

    // ── 5. Orders & Tracking ──────────────────────────────────
    @GET("orders")
    suspend fun getOrders(@Query("page") page: Int): Response<PaginatedResponse<Order>>

    @GET("orders/{id}")
    suspend fun getOrderDetails(@Path("id") orderId: String): Response<ApiResponse<Order>>

    // ── 6. Wallet & Balances ──────────────────────────────────
    @GET("wallet/balance")
    suspend fun getWalletBalance(): Response<ApiResponse<WalletBalance>>

    @GET("wallet/transactions")
    suspend fun getTransactions(@Query("page") page: Int): Response<PaginatedResponse<Transaction>>

    // ── 7. Identity & KYC ─────────────────────────────────────
    @POST("identity/verification/pan")
    suspend fun verifyPan(@Body request: PanVerificationRequest): Response<ApiResponse<PanResult>>

    @POST("identity/verification/aadhaar/initiate")
    suspend fun initiateAadhaar(@Body request: AadhaarInitiateRequest): Response<ApiResponse<AadhaarInitiateResult>>

    @POST("identity/verification/aadhaar/verify-otp")
    suspend fun verifyAadhaarOtp(@Body request: AadhaarVerifyRequest): Response<ApiResponse<AadhaarVerifyResult>>
}
```

---

## 5. Razorpay Android Checkout Integration Flow

```kotlin
// Android Checkout Activity / Fragment
class CheckoutActivity : AppCompatActivity(), PaymentResultListener {

    private fun startRazorpayPayment(checkoutData: CheckoutData) {
        val checkout = Checkout()
        checkout.setKeyID("rzp_test_YourKeyHere") // Injected from remote config or BuildConfig

        try {
            val options = JSONObject().apply {
                put("name", "BizReels Marketplace")
                put("description", "Payment for Order #${checkoutData.orderIds.first()}")
                put("order_id", checkoutData.razorpayOrder.id) // e.g. "order_NXz89Abc12345"
                put("currency", "INR")
                put("amount", checkoutData.razorpayOrder.amount) // In Paise
                put("prefill", JSONObject().apply {
                    put("contact", currentUser.phone)
                    put("email", currentUser.email)
                })
                put("theme", JSONObject().apply {
                    put("color", "#F59E0B") // BizReels Brand Amber
                })
            }
            checkout.open(this, options)
        } catch (e: Exception) {
            Toast.makeText(this, "Payment Initiation Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onPaymentSuccess(razorpayPaymentID: String?) {
        // Order is automatically transitioned to 'paid' via backend webhook!
        // Client transitions to Order Success screen
        navigateToOrderSuccess()
    }

    override fun onPaymentError(code: Int, response: String?) {
        // Show payment failure modal with retry option
        showPaymentFailureDialog(response)
    }
}
```

---

## 6. Critical Invariants & Gotchas for Android

1. **Do NOT Use `/auth/google/session-exchange`:** Older guides reference this. It does not exist in backend routes. Native Android apps must use `POST /api/v1/auth/google/token` passing Google Sign-In `idToken`.
2. **Handle Non-Array JSON Envelopes:** All listing and reel collections are wrapped in `{ "success": true, "data": [ ... ], "pagination": { ... } }`. Always deserialize into `PaginatedResponse<T>`.
3. **Indian Phone Number Sanitization:** Users can enter 10 digits (`9876543210`). The backend automatically normalizes to `+919876543210`. Do not send double country prefixes (`+91+91`).
4. **Currency Handling:** Display amounts in Rupees (`data.total_amount`), but remember Razorpay SDK expects Paise (`data.razorpay_order.amount`).
5. **Image URL Formatting:** Cloudinary URLs are returned. Use Coil or Glide with memory caching enabled.
