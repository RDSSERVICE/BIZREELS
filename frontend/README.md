# BizReels Frontend Service

## Purpose
Vite + React 19 web viewport application containing customer reels feed, vendor catalog listings, creator portfolio workspaces, search discovery, and real-time messaging panels.

## Structure & Main Files
*   `vite.config.js` - Vite compiler with code-splitting chunks and local proxy redirections.
*   `src/main.jsx` - Root execution bundle integrating stylesheet layout.
*   `src/App.jsx` - Root layout setting up React Router and checking silent login session validity.
*   `src/styles/index.css` - Custom Tailwind CSS design tokens built from brand logo.
*   `src/store/` - Redux Toolkit central state manager.
*   `src/api/` - RTK Query configuration layer with automatic token rotation headers.
*   `src/layouts/` - Page wrappers (Sidebar layout, header panel, mobile navigation).
*   `src/components/common/` - Modular reusable widgets (Button, Input, Modal, Loader).
*   `src/pages/` - Full screen viewport nodes (Login, Register, Dashboard hubs).
*   `src/routes/` - Main routes hierarchy and security checks.

## Dependencies
*   `react` & `react-dom` - UI library
*   `react-router-dom` - Viewports routing
*   `@reduxjs/toolkit` - Global state
*   `react-hook-form` - Forms handler
*   `framer-motion` - Animated layouts
*   `react-hot-toast` - Simple notification banners

## Coding Conventions
1.  **Strict Pure JavaScript**: Do not introduce any TypeScript files or typing configurations.
2.  **Reusable Components**: Keep styles centralized. Always import `Button` and `Input` from `components/common/` instead of applying raw classes inline.
3.  **Redux Integration**: Perform all async server updates via RTK Query mutations rather than axios promises.
4.  **Premium Aesthetics**: Follow glassmorphic design token structures defined in index.css.

## How to Extend
To add a new screen:
1.  Add new routing nodes in `src/routes/index.jsx`.
2.  Create folder under `src/features/` to house slice components if state sharing is needed.
3.  Implement clean responsive UI views using design system tokens.
