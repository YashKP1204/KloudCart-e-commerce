ADR-002: Separate Application Responsibilities into Independent Services

Status : Accepted

Date   : 2026-10-06

Context

The original application contains multiple responsibilities including:

HTTP/API request handling

frontend presentation

background job processing

persistent data storage

asynchronous job queuing

Running all application logic in a single process or container would couple unrelated workloads and make independent scaling, deployment, troubleshooting, and resource management more difficult.

The backend API and background worker also have different runtime characteristics.

The backend is primarily request-driven, while the worker is queue-driven and may consume CPU or memory independently of HTTP traffic.

Decision

CloudCart will separate the application into independently running services:

Frontend

Backend API

Worker

MongoDB

Redis

The frontend will communicate with the backend API.

The backend will communicate with MongoDB and Redis.

The worker will consume asynchronous jobs from Redis and communicate with MongoDB when required.

Architecture

Frontend
    |
    v
Backend
   / \
  v   v
Mongo Redis
       |
       v
     Worker
       |
       v
     Mongo

Alternatives Considered

Single Application Container

Rejected because it couples frontend/API/background processing and prevents independent scaling.

Backend + Worker in the Same Process

Rejected because HTTP traffic and asynchronous workloads have different scaling and failure characteristics.

Separate Worker Service

Selected because it allows the worker to eventually be:

independently scaled

independently monitored

independently restarted

independently resource-limited

independently deployed

Consequences

Positive

Clear separation of responsibilities.

Independent scaling.

Independent failure domains.

Easier troubleshooting.

Better Kubernetes deployment model.

Better observability.

Enables queue-based asynchronous processing.

Provides a realistic distributed-system architecture for DevOps/SRE practices.

Negative

More containers.

More networking.

More deployment configuration.

More health checks.

More operational complexity.

Operational Impact

The platform must monitor:

Backend availability.

Worker availability.

Redis connectivity.

Queue depth.

MongoDB availability.

Frontend availability.

Worker failure may not immediately cause the backend to fail, but it can cause queue backlog and delayed processing.

Therefore queue depth and worker health will eventually become important operational signals.

Future Considerations

When deployed to Kubernetes, the frontend, backend, and worker will be represented as independently managed workloads.

The worker may be scaled independently from the backend based on queue depth and workload requirements.