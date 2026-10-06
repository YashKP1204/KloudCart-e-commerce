# CloudCart

CloudCart is a small e-commerce/order-processing application used as the workload for a production-grade DevOps/SRE platform project.

## Application architecture

```text
Frontend (React/Vite)
        |
        | HTTP
        v
Backend (Node/Express) -----> MongoDB
        |
        | enqueue order job
        v
      Redis
        |
        | consume
        v
Worker (Node)
        |
        +---------------------> MongoDB
```

## Service boundaries

- `frontend/` — React UI and browser-side API calls.
- `backend/` — stateless HTTP API, health/readiness endpoints, metrics and order/product/auth routes.
- `worker/` — asynchronous order processing. It consumes jobs from Redis and updates order state in MongoDB.
- `shared/` — infrastructure/domain primitives shared by backend and worker: MongoDB access, Redis queue and TypeScript domain types.

The backend does **not** import or start the worker. Worker status is exposed through the shared Redis queue state.

## Local development

Run each service from its own directory. MongoDB and Redis should be available locally or through an external development environment.

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
cd worker && npm install && npm run dev
```

Containerization is intentionally not included in this application refactor. Dockerfiles and Docker Compose will be added as a separate step.
