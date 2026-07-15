# Emergent — Local Social Commerce Platform (MERN Stack Refactor)

Emergent is a production-ready, highly secure local social commerce platform tailored for the Indian marketplace. Discover local vendors, chat directly, make fair deals, submit and view requirements, and browse localized content reels.

This project has been fully refactored from its legacy Python (FastAPI) and Create React App (Webpack) architecture into a modern, unified MERN Stack application.

---

## 🏗️ Project Architecture & Structure

```
ecommerce-app/
├── backend/                  # Node.js/Express Backend Server
│   ├── src/
│   │   ├── config/           # Database connections and platform configurations
│   │   ├── middleware/       # JWT auth, role validation, rate limiters, security
│   │   ├── models/           # Mongoose schemas (22 database models)
│   │   ├── routes/           # Express router endpoints mirroring original API
│   │   ├── services/         # Business logic & integrations (Razorpay, SMS, AI)
│   │   ├── utils/            # Sliding-window rate limiters, test data exclusions, helpers
│   │   └── app.js            # Express application setup, security headers, file gates
│   ├── uploads/              # Local storage uploads proxy folder
│   ├── server.js             # HTTP server, socket.io gateways and cron intervals
│   └── package.json          # Node dependencies (Mongoose, Socket.IO, Winston, Joi)
│
└── frontend/                 # React 19 Frontend Web Application
    ├── src/
    │   ├── components/       # UI elements and page components
    │   ├── context/          # React Auth and Theme context providers
    │   ├── hooks/            # Custom utility hooks
    │   ├── lib/              # API clients and socket configurations
    │   ├── locales/          # Localization resources (English/Hindi translations)
    │   ├── pages/            # Application pages
    │   ├── App.js            # Frontend Routing and application layout
    │   └── index.js          # App entry point
    ├── index.html            # Vite HTML template entry point
    ├── vite.config.js        # Vite configurations (alias support, Visual Edits plugin)
    └── package.json          # Modern frontend dependencies (React 19, Lucide, Tailwind)
```

---

## ⚡ Key Technical Implementations

1. **Role-Based Gated Middleware**: Endpoints are secure against unauthorized actions using verified JWT tokens and flexible customer/vendor/creator/admin role scopes.
2. **Scraper-Resistant Contact Reveal**: Phone numbers are hidden by default. Access is rate-limited (max 5/day) and gated by active chats, trust badge verification, or wallet credits.
3. **Atomic Wallet Credit Transactions**: Condition-locked WALLET payouts (e.g. KYC bonuses) avoid concurrency race conditions.
4. **Google Gemini multimodal prompts**: Content helpers, category detections, and coaching tools dynamically parse listings metadata and media attachments.
5. **Sliding-window Rate Limiter**: Custom sliding timestamp arrays stored in memory provide fine-grained API throttling.
6. **Vite Bundler**: Complete build migration from Craco/CRA, compiling in seconds with custom JSX-in-JS loaders.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (version >= 18.0.0)
- MongoDB running locally or remotely

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` configuration file from the template:
   ```bash
   copy .env.example .env
   ```
3. Install package dependencies:
   ```bash
   npm install
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   *The backend will boot up, run startup database migrations, seed initial admin/categories/reels mock data, and listen on port `8001`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Create your `.env` configuration file:
   ```bash
   copy .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Run the local development server:
   ```bash
   npm run dev
   ```
   *The React app will boot up on Vite and open on `http://localhost:3000` (or the next available port).*

---

## 🧪 Verification & Building

- **Compile production bundle (Frontend)**:
  ```bash
  cd frontend
  npm run build
  ```
- **Run backend tests**:
  ```bash
  cd backend
  npm test
  ```

---

## 🤖 AI Guidelines & Architecture Cheat Sheet
*This section is specifically tailored to guide any AI agent working on this codebase in the future.*

### 💾 1. Database Model & Collection Mappings
To avoid duplicate collections, all Mongoose models in `backend/src/models/` enforce explicit, lowercase collection names matching the legacy schema:
- **`User`**: Collection `users`. Stores roles (`customer`, `vendor`, `creator`, `admin`), `kyc_status`, average response rates.
- **`Listing`**: Collection `listings`. Uses `2dsphere` index on `location.geo` coordinates. Stores title/desc text indexes, boost settings.
- **`Deal`**: Collection `deals`. Manages negotiations, counteroffers, and completion statuses.
- **`ChatThread` / `Message`**: Collections `chat_threads` and `messages`. Tracks active chats and text/image/offer payloads.
- **`KycDocument` / `Payment` / `Subscription` / `Wallet` / `WalletTransaction`**: Stored in `backend/src/models/Phase4.js`.
- **`AuditLog` / `OTPRequest` / `RefreshToken`**: Stored in `backend/src/models/Misc.js`.

### 🛡️ 2. Security Checkpoints & Gated Logic
- **Phone Reveals (SEC-002)**: Implemented in `backend/src/services/contact-reveal.service.js`. Unlocking a vendor's contact is restricted to 5/day. Gated by relationship verification: allowed if there is an active chat/deal, if the caller is a verified Pro subscriber, or by spending 5 credits.
- **KYC Trust+ Bonus (SEC-101)**: Implemented in `backend/src/services/trust-plus.service.js`. Uses conditional database updates `findOneAndUpdate({ user_id, bonus_flag: { $ne: true } })` to ensure bonuses are awarded atomically exactly once.
- **Static Assets Gate (SEC-003)**: Handled in `backend/src/app.js`. Serves listing media public, but gates KYC and private profile uploads with JWT and ownership check queries.

### 🔌 3. External Integrations
- **AI Service (`backend/src/services/ai.service.js`)**: Direct HTTP calls to Google Gemini API using structured JSON output prompts, daily token usage caps, and conversational negotation guidelines.
- **Razorpay Service (`backend/src/services/razorpay.service.js`)**: Handles order tokens creation and signature verifications. Webhook raw body parses inside `app.js` using `req.rawBody` buffer capture.
- **MSG91 SMS Service (`backend/src/services/msg91.service.js`)**: Routes OTP sends and transactional fallback SMS notifications.
- **FCM Push Service (`backend/src/services/fcm.service.js`)**: Logs pushes in dev mode, initialises real firebase-admin client in production.

### ⚙️ 4. Build Configurations & Path Resolution
- **Frontend Path Aliasing**: Vite handles paths starting with `@/` matching `frontend/src/` folder.
- **JSX compilation in `.js` files**: Enforced inside `frontend/vite.config.js` via the `esbuild.loader` options. Do not rename files to `.jsx` unless they are new.
- **Visual Edits (`@emergentbase/visual-edits`)**: Condition loaded in development mode only inside `vite.config.js` to avoid runtime dependencies in production.
