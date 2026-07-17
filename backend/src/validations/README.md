# Backend Validations Layer

## Purpose
Configures type check rules, boundary assertions, parameter validations, and regex checks for incoming client body, parameter, or query requests.

## Files
- `authValidation.js` - Rules for user signups, logins, and OTP.
- `reelValidation.js` - Rules for Reels publishing, comments, and views.
- `listingValidation.js` - Rules for product/service catalog creations and search bounds.
- `requirementValidation.js` - Rules for custom posts and bid quotations.

## Dependencies
- `express-validator` - Validation chaining middleware

## Coding Conventions
1. Always validate parameter references before proceeding to query actions.
2. Provide custom readable error statements using `.withMessage()`.
3. Normalize incoming content strings (e.g. `.trim()`).

## How to Extend
To define a validation rule:
1. Append a validation chain array to the exports list (e.g. `create: [body('name').notEmpty()]`).
2. Register the validation rule array inside the route endpoints mapping list.
