# Low-Level Code Architecture & Component Spec
## BizReels Marketplace Platform

---

## 1. Frontend Component Architecture

The React 19 client is organized into modular directories under `/src/`, separating core page views from reusable UI widgets and business state stores.

```mermaid
graph TD
  Root[src/main.jsx] --> App[src/App.jsx]
  App --> Store[src/store/index.js]
  App --> Routes[src/routes/index.jsx]
  
  subgraph Routing & Security Guards
    Routes --> PrivateRoute[PrivateRoute]
    Routes --> RoleRoute[RoleRoute]
    Routes --> PublicRoute[PublicRoute]
  end

  subgraph State Manager (Redux Toolkit)
    Store --> AuthSlice[authSlice]
    Store --> ApiSlice[apiSlice / RTK Query]
  end

  subgraph Page Viewports & Modules
    PrivateRoute --> Feed[pages/Feed.jsx]
    PrivateRoute --> Search[pages/Search.jsx]
    PrivateRoute --> ChatPage[pages/Chats.jsx]
    RoleRoute --> VendorDash[pages/VendorDashboard.jsx]
    RoleRoute --> CreatorDash[pages/CreatorDashboard.jsx]
  end

  subgraph Reusable Components
    VendorDash --> Button[components/common/Button.jsx]
    VendorDash --> Input[components/common/Input.jsx]
    VendorDash --> Modal[components/common/Modal.jsx]
  end
```

---

## 2. Backend Layered Architecture (MVC + Repository)

The Express backend decouples network interfaces from database adapters, dividing execution logic into 5 distinct layers:

```
[ HTTP REQUEST ] ──> Routes Layer (validates headers & JSON body schemas)
                           │
                           ▼
                     Controllers Layer (unwraps parameters, sets HTTP statuses)
                           │
                           ▼
                     Services Layer (performs business checks, escrow locks, triggers sockets)
                           │
                           ▼
                     Repositories Layer (executes aggregation, database queries)
                           │
                           ▼
                     Models Layer (asserts Mongoose structures, indexes, soft-deletes)
```

### 2.1 Micro-Module Organization (Domain Boundaries)

BizReels is structured around eight discrete business domains:
1. **Auth & Identity**: Handles password signups, Google logins, phone/email OTP verification, and JWT session refresh cookies.
2. **Reels Media**: Manages upload streams, Cloudinary CDN integrations, views counter, likes counts, and nested comment drawings.
3. **Listings Catalog**: Oversees Vendor/Creator product & service listings geolocated with proximity radius matching.
4. **Custom Requirements**: Supports customer post briefs, deadline validation, and geospatial indexing for local leads display.
5. **Ledger Billing & Subscriptions**: Executes double-entry wallet recharges, escrow locks, and BullMQ-backed subscription monitoring.
6. **Campaign Collaborations**: Governs Creator-Vendor HireRequests, escrow deposits, deliverables delivery, and payout releases.
7. **Direct Messaging**: Relays user-to-user conversation logs, unreads indicators, and socket events.
8. **Real-time Live Streaming**: Tracks streamer broadcasts, socket scrolls, and interactive viewers metrics.

---

## 3. Real-Time Socket.io Room Architecture

The real-time layer ensures state parity between active clients and the database.

```mermaid
graph TD
  ClientSocket[Client Socket Connection] --> Namespace[/]
  Namespace --> UserRoom["Room: 'user:<userId>' (system alerts, quote changes)"]
  Namespace --> ChatRoom["Room: 'conversation:<conversationId>' (typing state, new DMs)"]
  Namespace --> StreamRoom["Room: 'stream:<streamId>' (live scroll, hearts count)"]
  
  subgraph Real-Time Relays
    NewDM[New Message Service] -->|Emit 'message'| ChatRoom
    Bidding[Escrow Settlement Service] -->|Emit 'quote_update'| UserRoom
    LikeStream[Stream Interaction] -->|Emit 'stream_message'| StreamRoom
  end
```

### 3.1 WebSockets Protocol Flow
- **Authentication**: Sockets handshake parses JWT query strings. Unauthorized sockets are rejected immediately.
- **Connection Registry**: On connection, the user is joined to their private `user:<userId>` room automatically.
- **State Cleanup**: Disconnect hooks track user presence and broadcast seen updates for conversation streams.
