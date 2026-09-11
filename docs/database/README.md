# Database Architecture & Storage Specifications

This module details the MongoDB database architecture, Mongoose schemas (50 models), indexing strategies, and aggregation query pipelines.

---

## Documents Index

| Document | Scope |
|---|---|
| [**SCHEMA.md**](./SCHEMA.md) | Comprehensive breakdown of collections: Users, Listings, Reels, Orders, Cart, Wallet, Subscriptions, KYC, and Admin models. |
| [**SCHEMA_DESIGN.md**](./SCHEMA_DESIGN.md) | Relational design in MongoDB: embedding vs referencing tradeoffs, cascade delete rules, and transactional consistency. |
| [**INDEXING_QUERIES.md**](./INDEXING_QUERIES.md) | Indexing specifications: 2dsphere geospatial indexes, text search indexes, TTL expiration indexes, and performance benchmarks. |
