# Swagger UI & OpenAPI Specification Plan
## BizReels Marketplace Platform

---

## 1. Swagger Setup & Configuration Plan

To expose interactive, testable API schemas to developers and admin partners, BizReels uses `swagger-jsdoc` and `swagger-ui-express`.

### 1.1 Installation Guide
Run the following dependencies installation command in the `backend/` directory:
```bash
npm install swagger-ui-express swagger-jsdoc
```

### 1.2 Express Integration Layout
Mount the interactive API endpoint docs in the main Express `src/app.js` file:
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BizReels API Documentation',
      version: '1.0.0',
      description: 'AI-Powered Local Business Marketplace + Reels Video Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Scan routes and models for annotations
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## 2. OpenAPI 3.0 API Schema Definition (JSON Draft)

Save this draft configuration file at `docs/swagger-spec.json` to bootstrap Swagger UI manually:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "BizReels API Specification",
    "version": "1.0.0"
  },
  "paths": {
    "/auth/login": {
      "post": {
        "summary": "Log in a user session",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Successfully logged in user." },
          "401": { "description": "Authentication credentials failed." }
        }
      }
    },
    "/listings": {
      "get": {
        "summary": "Query proximity listings catalog",
        "parameters": [
          { "name": "lat", "in": "query", "schema": { "type": "number" } },
          { "name": "lng", "in": "query", "schema": { "type": "number" } },
          { "name": "distance", "in": "query", "schema": { "type": "number", "default": 10 } }
        ],
        "responses": {
          "200": { "description": "Returned list of proximity matching listings." }
        }
      }
    }
  }
}
```
Using this config ensures frontend developer teams can mock and test APIs directly.
