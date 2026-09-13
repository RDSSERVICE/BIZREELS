# Reels Feature Directory

## Purpose
This feature houses the core Instagram Reels module for the BizReels application. It handles video uploads directly to Cloudinary CDN, vertical feed playback snapping, hashtag parsing, geospatial nearby matching, comment threads, and optimistic like states.

## Files
*   `reelsApi.js` - RTK Query endpoints for fetching feed, toggling likes, comments list loading, posting comments, and video publishing.
*   `ReelsFeed.jsx` - Main player page rendering vertical items with swiping snapping.
*   `ReelsUpload.jsx` - Wizard wizard allowing vendors/creators to publish new short clips.

## Dependencies
*   `framer-motion` - Animations for double-tap heart pop.
*   `react-icons` - Layout widgets (like, comment, share, speaker icons).
*   `react-hot-toast` - Banners alerting link copy success.

## Coding Conventions
1.  **Optimistic Updates**: For like status changes, always apply optimistic query updates to immediately modify `likesCount` and `hasLiked` locally, reverting only if the server transaction errors out.
2.  **Direct CDN Stream Uploads**: Videos and images are streamed directly to Cloudinary via `mediaApi.uploadMediaStream(file, onProgress, folder)` using signed tokens from `POST /api/v1/media/sign`. Never encode large media files as Base64 strings inside JSON requests. Always pass the resulting permanent CDN URL (`https://res.cloudinary.com/...`) in the JSON payload to keep requests under `< 1 KB`.

## How to Extend
To add a "boost reel" payment check before showing the Sponsor badge:
1.  Extend query parameters mapping inside `reelsApi.js`.
2.  Update `ReelsFeed.jsx` render checks to show action prompts.
