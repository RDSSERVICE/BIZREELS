# BizReels — Local Social Commerce Platform (MERN Stack)

[![Repository](https://img.shields.io/badge/GitHub-RDSSERVICE%2FBIZREELS-blue?logo=github)](https://github.com/RDSSERVICE/BIZREELS.git)
[![Frontend](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://bizreels.vercel.app)
[![Backend](https://img.shields.io/badge/Render-Deployed-informational?logo=render)](https://render.com)

BizReels is a production-ready, highly secure local social commerce platform tailored for the Indian marketplace. Discover local vendors, chat directly, negotiate fair deals, post requirements, browse localized reels, find nearby creators, and interact via interactive location maps.

---

## 🏗️ Project Architecture & Structure

```
BIZREELS/
├── backend/                  # Node.js & Express API Server
│   ├── src/
│   │   ├── config/           # Database, Passport.js, & integration configs
│   │   ├── controllers/      # Route controllers (Auth, Listings, Hires, Reels, etc.)
│   │   ├── middleware/       # JWT auth, role validation, rate limiters, error handling
│   │   ├── models/           # Mongoose schemas (22+ MongoDB database models)
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # Express routes (/api/v1, /api, /v1, /auth aliases)
│   │   ├── services/         # Business logic & integrations (Razorpay, MSG91, Gemini AI)
│   │   ├── utils/            # ApiError, logger, helpers
│   │   └── app.js            # Express app setup, CORS, security headers, route mounting
│   ├── server.js             # HTTP server & Socket.io real-time gateway
│   └── package.json          # Node.js dependencies
│
├── frontend/                 # Vite + React 19 Frontend Application
│   ├── public/               # Static assets & Netlify _redirects configuration
│   ├── src/
│   │   ├── api/              # RTK Query Central API Slice
│   │   ├── components/       # Common UI elements & Google LocationPicker
│   │   ├── config/           # Environment & API URL configuration
│   │   ├── features/         # Feature-specific Redux slices & API endpoints
│   │   ├── lib/              # Axios client instance, tokenStore & Socket.io client
│   │   ├── pages/            # Application pages (Customer, Vendor, Creator, Admin)
│   │   ├── routes/           # React Router DOM routing
│   │   └── index.css         # Styling with Tailwind CSS
│   ├── vercel.json           # Vercel SPA route rewrite configuration
│   ├── vite.config.js        # Vite bundler, path aliases, & dev server proxy
│   └── package.json          # Frontend dependencies
│
└── vercel.json               # Root Vercel SPA routing configuration
```

---

## ⚡ Key Features & Technical Highlights

1. **Multi-Role User Portals**:
   - **Customer Portal**: Search local listings, view interactive map pins, post requirements, chat with vendors, and browse local reels.
   - **Vendor Studio**: Manage product & service listings, boost visibility, track leads, handle orders, and hire local content creators.
   - **Creator Marketplace**: Showcase portfolio reels/photos, manage booking availability, receive vendor project orders, and manage creator wallet payouts.
   - **Admin Console**: Manage users, approve/takedown listings, moderate reported content, manage KYC queues, set commission rules, and configure platform settings.

2. **Google Maps Integration**:
   - Integrated `LocationPicker` component using Google Maps JS & Places Autocomplete API.
   - Access key configured dynamically via `VITE_GOOGLE_MAPS_API_KEY`.

3. **Dynamic API & Socket Routing for Cloud Deployment**:
   - Zero hardcoding: Frontend connects to backend via `VITE_BACKEND_URL`, `VITE_API_URL`, and `VITE_SOCKET_URL`.
   - Automatic fallback to Vite dev proxy (`/api`, `/uploads`, `/socket.io`) during local development.
   - Multi-path Express route mounting (`/api/v1`, `/api`, `/v1`, `/`, `/auth`) for backwards compatibility and host URL variation support.

4. **Single Page Application (SPA) Deep Linking**:
   - Pre-configured `vercel.json` rewrites (`"source": "/(.*)", "destination": "/index.html"`) and `_redirects` for flawless direct URL navigation and page refresh on Vercel and Netlify.

5. **Real-time WebSockets & Auth Security**:
   - Socket.IO gateway for instant chat messaging, notification triggers, and live updates.
   - Single-flight token refresh interceptor in Axios & RTK Query to gracefully handle 401 token rotations.

---

## 🚀 Local Setup & Development

### Prerequisites
- Node.js (version >= 18.0.0)
- MongoDB instance (local or MongoDB Atlas)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (.env)
# Set PORT=5000, MONGODB_URI, JWT_ACCESS_SECRET, etc.

# Start backend dev server
npm run dev
```
*The backend boots on `http://localhost:5000` with automatic DB initialization and seed options.*

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables (.env)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyB57Xt5rd7C-GtRwzwv_5J1v6zslAIlKzQ
VITE_BACKEND_URL=
# (Leave VITE_BACKEND_URL empty in local dev to use Vite proxy automatically)

# Start frontend dev server
npm run dev
```
*The frontend boots up on `http://localhost:5173`.*

---

## 🌐 Deployment Instructions

### Backend (Render / Railway / Heroku)
1. Deploy the `backend/` folder to your Node.js hosting platform (e.g. Render).
2. Configure Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your-mongodb-connection-string>`
   - `CLIENT_URL=https://bizreels.vercel.app`
   - `JWT_ACCESS_SECRET=<secret>`
   - `JWT_REFRESH_SECRET=<secret>`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (Optional)

### Frontend (Vercel)
1. Import the project repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Build Command: `npm run build` | Output Directory: `dist`.
4. Configure Environment Variables in Vercel Dashboard:
   - `VITE_BACKEND_URL=https://your-backend.onrender.com`
   - `VITE_GOOGLE_MAPS_API_KEY=AIzaSyB57Xt5rd7C-GtRwzwv_5J1v6zslAIlKzQ`
5. Deploy. All SPA routes (`/auth/login`, `/customer`, `/vendor`, `/creator`, `/admin`) will resolve cleanly without 404 errors.

---

## 🧪 Verification & Production Build

- **Build Frontend**:
  ```bash
  cd frontend
  npm run build
  ```
- **Run Backend Tests**:
  ```bash
  cd backend
  npm test
  ```

---

## 📄 Repository Information

- **GitHub Repository**: [https://github.com/RDSSERVICE/BIZREELS.git](https://github.com/RDSSERVICE/BIZREELS.git)
- **Branch**: `main`
