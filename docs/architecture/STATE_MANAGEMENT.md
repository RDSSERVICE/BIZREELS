# State Management

BizReels utilizes React 19's Context API to manage global session states, combined with localStorage caches for tokens and Socket.IO event registrations to keep client states synchronized with the server in real-time.

---

## 1. Global Auth Context (`AuthContext.js`)

The application is wrapped in `<AuthProvider>` at the root index level. Components access state and triggers by calling the custom hook: `const { user, loading, applyAuthResponse, logout, refreshMe, updateLocalUser } = useAuth();`.

### Context State Variables

* `user`: The current authenticated user JSON object. Initialized synchronously on startup from `tokenStore.getUser()`.
* `loading`: A boolean flag checking if a profile fetch is active. Initialized to `true` if an access token is found in localStorage.

### Core Context Actions

1. **`refreshMe()`**  
   Sends a GET `/v1/users/me` request to verify token validity. On success, updates `user` states. On failure (e.g. invalid credentials), invokes `tokenStore.clear()` and clears the session.
2. **`applyAuthResponse(data)`**  
   Invoked when OTP logins or Google session exchanges complete. Caches the access token, refresh token, and user profile data.
3. **`logout()`**  
   Triggers a background POST `/v1/auth/logout` API call, calls `tokenStore.clear()`, nulls out the active user state, and disconnects WebSockets.
4. **`updateLocalUser(u)`**  
   Dynamically merges and caches profile updates (e.g. role switches, profile changes) without full page reloads.

---

## 2. Token Storage Controller (`tokenStore`)

A utility layer implemented in `frontend/src/lib/api.js` to manage browser-side persistence:

* **Keys Managed**:
  * `bizreels_access_token` (Short-lived session access token)
  * `bizreels_refresh_token` (Long-lived session refresh token)
  * `bizreels_user` (JSON string representation of the active profile)
* **API Interface**:
  * `getAccess()` / `getRefresh()` / `getUser()`: Fetch cached parameters.
  * `set({ access_token, refresh_token, user })`: Batch caches variables.
  * `setUser(user)`: Caches updated user JSON strings.
  * `clear()`: Wipes all keys from browser storage during logouts.

---

## 3. Real-time Socket.IO Listeners

When a user logs in, `AuthContext` triggers connection events in `frontend/src/lib/socket.js`. The context sets up listeners to display push-style notifications via the `sonner` toast system:

| WebSocket Event | Handler Action | In-App Toast Alert Behavior |
| :--- | :--- | :--- |
| **`message:new`** | Registers new incoming chat messages. | Triggers a message preview toast with a clickable "Reply" button that routes to `/chat/:thread_id` (suppressed if the user is already viewing that thread). |
| **`deal:updated`** | Intercepts updates to negotiator deals. | Prompts details on new counter-offer values with a clickable "View" link (suppressed if the user is currently on the chat or deals page). |
| **`notification:new`** | Processes custom user notification events. | Triggers a popup displaying titles, bodies, and redirect actions (suppressed if the user is viewing the notifications dashboard page). |
| **`wallet:updated`** | Updates wallet credit balances. | Notifies the user of new credit scores or balance changes with a "View" button routing to the wallet page (suppressed if viewing the wallet page). |
