# Development Guide & Conventions

Developers must adhere to the following naming styles, UI design patterns, and release workflows.

---

## 1. Coding & UI Conventions

* **React Syntax**: Standard React JS (written in `.js` or `.jsx` files). Do not rename legacy `.js` files to `.jsx` unless they are newly created modules.
* **Dark Theme Base**: Implement dark backgrounds using HSL surfaces (#000000, #0A0A0A, #121212) with thin borders (#border-white/10). Accent colors (brand gradient) should be used sparingly.
* **Text Alignments**: Do not center-align body text or form labels. Left-align them to optimize scanning on mobile screens.
* **Micro-Animations**:
  * Define specific target transition properties (e.g. `transition-transform` or `transition-opacity`). Do not use `transition: all`.
  * Use skeleton loader states (`animate-pulse bg-white/10`) for fetching screens instead of spinner graphics.
* **Real Images**: Do not insert mock placeholders (`placehold.it` or `dummyimage.com`). Use assets from Cloudinary or the verified images listed in `design_guidelines.json`.
* **Accessibility**: Every interactive element (buttons, anchor tags, form inputs, toggles) must contain a descriptive `data-testid` attribute (e.g. `data-testid="onboarding-next-button"`).

---

## 2. Naming Conventions

### Backend Codebase
* **Mongoose Models**: Declared in PascalCase, but mapped to explicit lowercase, snake_case collections:
  * Model `KycDocument` -> Collection `'kyc_documents'`
* **Routers**: Filenames must follow `*.routes.js` pattern (e.g., `listing.routes.js`). Registered under `api/v1` routes index.
* **Services**: Modular functions in `*.service.js` files, returning instantiated camelCase exports.
* **Variables & Database Keys**: Use snake_case format (e.g., `user_id`, `referred_user_id`, `is_takendown`).

### Frontend Codebase
* **UI Components**: Filenames and class functions use PascalCase (e.g., `RoleSwitcherChip.jsx`).
* **Page Routes**: Route files match page titles in PascalCase (e.g., `ListingForm.jsx`, `ChatThread.jsx`).
* **Utility Files**: JavaScript files use lower camelCase (e.g. `roleNav.js`, `socket.js`).

---

## 3. Onboarding Workflow Checklist (Ticketing Rule)

Whenever you add, modify, or delete features in this repository, you must execute this checklist before completing the task:

1. **Implement Logic**: Complete backend changes and frontend visual integration.
2. **Verify Correctness**: Run test suites (`npm test` in backend/frontend directories) and check responsiveness.
3. **Check Test IDs**: Ensure new buttons/inputs include `data-testid` attributes.
4. **Update Feature Docs**: Revise relevant files inside `/docs` (e.g. update `API_REFERENCE.md` if routes changed, or `DATABASE_SCHEMA.md` if schema updated).
5. **Update CHANGELOG.md**: Add a concise log of changes under the latest version.
6. **Update AI_CONTEXT.md**: Update the project status, pending features, or changes in this master context file.
