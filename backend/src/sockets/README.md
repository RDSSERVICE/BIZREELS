# Backend Sockets Layer

## Purpose
Configures Socket.io connections, client handshakes validation, room bindings (personal user rooms & conversation rooms), and event handlers for real-time messaging.

## Files
- `index.js` - Sockets bootstrapper, auth middleware, room attachments, typing state listeners, and global emitter helper methods.

## Dependencies
- `socket.io` - WebSockets server framework
- `jsonwebtoken` - Handshake auth validation

## Coding Conventions
1. Always validate connections using the connection middleware checker.
2. Group users in room blocks to prevent raw broadcasts (e.g. `to('conversation:<id>')`).
3. Leverage `emitToUser` for targeted alerts.

## How to Extend
To add a new socket action:
1. Bind listener on incoming socket inside connection handler (e.g. `socket.on('<event>')`).
2. Add a global broadcast helper to push events from controllers or services.
