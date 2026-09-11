# Database Indexing, Search, & Aggregation Spec
## BizReels Marketplace Platform

---

## 1. Indexing Strategy

To support proximity calculations, text search, and rapid sorting on metrics, BizReels implements the following index configurations.

### 1.1 Geospatial Indexes (`2dsphere`)
- **Listing location index**: `listingSchema.index({ location: "2dsphere" })`
- **Requirement location index**: `requirementSchema.index({ location: "2dsphere" })`
- **User vendorProfile location index**: `userSchema.index({ "vendorProfile.location": "2dsphere" })`
- **Purpose**: Enables MongoDB proximity searches using operators like `$geoNear`, `$near`, and `$nearSphere` inside coordinate grids.

### 1.2 Compound & Unique Indexes
- **Single-bid uniqueness**: `quoteSchema.index({ requirement: 1, vendor: 1 }, { unique: true })`
  - *Purpose*: Blocks a vendor from posting multiple quotes for a single customer requirement.
- **Listing discovery optimization**: `listingSchema.index({ category: 1, type: 1, isDeleted: 1 })`
  - *Purpose*: Speeds up catalog filters combining category selection and active catalog checks.
- **Audit Logs Sorting**: `auditLogSchema.index({ userId: 1, createdAt: -1 })`
  - *Purpose*: Fast recovery of user action history logs in descending order.

### 1.3 Time-To-Live (TTL) Indexes
- **OTP expiration**: `otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`
  - *Purpose*: Automatically purges expired OTP verification logs from the collection.

---

## 2. Proximity & Text Search Queries

### 2.1 Hyperlocal Proximity Search Query
Query template to load products or services within 10 kilometers of a user's coordinates, sorted with boosted listings appearing first:

```javascript
Listing.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [77.2090, 28.6139] }, // [lng, lat] (New Delhi example)
      distanceField: "distance",
      maxDistance: 10000, // 10 kilometers in meters
      query: { isDeleted: false, type: "product" },
      spherical: true
    }
  },
  {
    // Sort boosted listings to the top, then sort by proximity distance
    $sort: { isBoosted: -1, distance: 1 }
  }
]);
```

### 2.2 Wildcard Text Search Index & Query
To support keyword queries across title and description:
- **Index creation**:
  ```javascript
  listingSchema.index({ title: "text", description: "text" }, { weights: { title: 10, description: 2 } });
  ```
- **Fuzzy Search Query**:
  ```javascript
  Listing.find(
    { $text: { $search: "wireless headphones" }, isDeleted: false },
    { score: { $meta: "textScore" } }
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(20);
  ```

---

## 3. Advanced Aggregation Pipelines

### 3.1 Aggregating Nearby Leads for Vendor Category
Used when a vendor requests matching customer requirements within 25 kilometers matching their business category:

```javascript
Requirement.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [vendorLng, vendorLat] },
      distanceField: "distance",
      maxDistance: 25000, // 25 kilometers
      query: { category: vendorCategory, status: "open", isDeleted: false },
      spherical: true
    }
  },
  {
    $project: {
      title: 1,
      budget: 1,
      deadline: 1,
      distance: 1,
      quotesCount: 1
    }
  },
  { $sort: { deadline: 1, distance: 1 } }
]);
```

### 3.2 Calculating Vendor Dynamic Ratings
Aggregate pipeline to calculate ratings whenever a review is posted:

```javascript
Review.aggregate([
  { $match: { targetVendorId: vendorId } },
  {
    $group: {
      _id: "$targetVendorId",
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }
  }
]);
// Results are written back to update 'vendorProfile.rating' and 'vendorProfile.totalReviews'
```

---

## 4. Soft Delete Enforcement Hook

To protect database referential integrity, BizReels isolates deleted documents using Mongoose query middleware pre-hooks:

```javascript
// Excludes soft deleted rows by default on find, findOne, update, and count operations
userSchema.pre(/^find/, function (next) {
  // Allow explicit exclusions if query options override the default soft-delete rule
  if (this.getOptions().includeSoftDeleted) return next();
  
  this.where({ isDeleted: { $ne: true } });
  next();
});
```
This strategy optimizes indexing speed because compound queries include `isDeleted: 1` variables.
