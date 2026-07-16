# BizReels Database Design

Details the MongoDB schemas structure and ER relations mappings.

---

## 1. Schema Specifications

```
User (Single Document)
  ├── customerProfile: { interests, savedListings: [ObjectId -> Listing] }
  ├── vendorProfile: { businessName, category, location: GeoJSON Point }
  └── creatorProfile: { bio, skills, pricingTiers: [Package] }

Listing (Products/Services)
  ├── vendor: ObjectId -> User
  ├── type: 'product' | 'service'
  ├── location: GeoJSON Point (2dsphere index)
  └── isDeleted: Boolean

Requirement (Leads Briefs)
  ├── customer: ObjectId -> User
  ├── budget: Number
  └── location: GeoJSON Point (2dsphere index)

Quote (Vendor Proposals)
  ├── requirement: ObjectId -> Requirement
  ├── vendor: ObjectId -> User
  └── status: 'pending' | 'accepted' | 'rejected'

Conversation
  ├── participants: [ObjectId -> User]
  └── lastMessage: ObjectId -> Message

Message
  ├── conversation: ObjectId -> Conversation
  └── sender: ObjectId -> User
```

---

## 2. Query Indexing Strategy

- **`location` (2dsphere)**: Configured on `Listing`, `Requirement`, and `User` (vendorProfile) to support proximity calculations using `$geoNear`.
- **`isDeleted`**: Configured across listing, comment, requirement, quote, and message collections to optimize soft delete exclusions.
- **`requirement` + `vendor` (Unique Compound Index)**: Configured on `Quote` collection to prevent duplicates.
