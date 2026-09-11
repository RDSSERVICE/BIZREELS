# Setup & Deployment Guide

This guide details instructions to run, build, and test the BizReels application in both development and production environments.

---

## 1. Prerequisites

Before setting up the project, verify that the following are installed:
* **Node.js**: Version `>=18.0.0`
* **MongoDB**: A running instance (local MongoDB Community Server or remote MongoDB Atlas connection)
* **Package Manager**: npm (bundled with Node.js) or yarn

---

## 2. Local Environment Execution

Follow these steps to run the application locally:

### Step 1: Start the MongoDB Server
Ensure your local MongoDB daemon is active. If running as a Windows service, it starts automatically. Otherwise, run:
```bash
mongod
```

### Step 2: Configure and Run the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Establish your environment variables file:
   ```bash
   copy .env.example .env
   ```
   *Note: Edit the `.env` parameters if you need custom database URLs or API keys.*
4. Launch the server in development mode (utilizes `nodemon` for auto-reloading):
   ```bash
   npm run dev
   ```
   *The server runs on port `8001` and connects to the `bizreels` database.*

### Step 3: Configure and Run the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Set your environment configuration details:
   ```bash
   copy .env.example .env
   ```
4. Start the Vite local development engine:
   ```bash
   npm run dev
   ```
   *The client boots up and opens at `http://localhost:3000` (or the next available port).*

---

## 3. Production Compilation & Deployment

To build the application for production:

### Frontend Static Compilation
Compile React source files into optimized static HTML, CSS, and JS:
```bash
cd frontend
npm run build
```
Vite outputs the optimized static bundle under the `frontend/dist` directory. These assets can be hosted on static asset hosts (Vercel, Netlify, AWS S3) or served via reverse proxy servers (Nginx).

### Backend Production Execution
To start the production API process (which uses Winston logging rather than developmental console outputs):
```bash
cd backend
npm start
```
*Note: In production environments, use process managers like `pm2` to monitor and manage backend process lifecycles:*
```bash
pm2 start server.js --name "bizreels-backend"
```

---

## 4. Test Verification Suites

* **Run Backend Integration Tests (Jest)**:
  ```bash
  cd backend
  npm test
  ```
  *Executes Jest tests using `--forceExit` and `--detectOpenHandles` flags to ensure server threads close.*
* **Run Frontend Unit Tests (Vitest)**:
  ```bash
  cd frontend
  npm run test
  ```
