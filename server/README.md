# TradeLink Server

Express MVC backend scaffold for the TradeLink member skill exchange application.

## Purpose

The server currently provides application setup, MongoDB connection handling, security middleware, route mounting, health checks, and global error handling. Feature endpoints are intentionally scaffolded but not implemented yet.

## Important Files

- `server.js`: validates environment variables, connects to MongoDB, starts the HTTP server, and handles graceful shutdown.
- `app.js`: configures Express middleware, `/api/health`, API routes, 404 handling, and global error handling.
- `config/env.js`: loads `.env`, validates required variables, and exports normalized config.
- `config/db.js`: connects Mongoose to MongoDB and logs connection state.
- `routes/index.js`: mounts feature routers under `/api`.
- `middleware/errorHandler.js`: converts operational, validation, duplicate key, cast, and token errors into consistent JSON responses.
- `middleware/notFound.js`: returns JSON for unmatched routes.
- `utils/ApiError.js`: operational error helper.
- `utils/ApiResponse.js`: success response helper for future controllers.
- `utils/logger.js`: console-backed logger wrapper.

## Route Modules

Mounted routes:

- `/api/auth`
- `/api/users`
- `/api/projects` - legacy placeholder; replace with skills/listings when implementing the backend domain.
- `/api/procurement` - legacy placeholder; replace with collaboration requests if needed.
- `/api/commercial` - legacy placeholder; replace with payments, proposals, or reviews if needed.

The route modules exist, but feature handlers are not wired yet.

## Model Placeholders

- `User.model.js`: planned members and admin users.
- `Project.model.js`: legacy placeholder; replace with skill listing or collaboration request records.
- `ProcurementPackage.model.js`: legacy placeholder; replace with request/workflow tracking if needed.
- `CommercialItem.model.js`: legacy placeholder; replace with proposal/payment metadata if needed.
- `Review.model.js`: planned member feedback.

## Scripts

```bash
npm run dev
npm start
npm run lint
npm run lint:fix
npm run format
```

## Known TODOs

- Implement authentication middleware, controllers, services, validations, and schemas.
- Add skill listing CRUD and dashboard summary endpoints.
- Add member request, message, review, and optional proposal persistence.
- Add request validation middleware.
- Add automated tests for route behavior and error handling.
