CloudCart — System Overview

1. Purpose

CloudCart is a containerized e-commerce application designed as a platform for implementing and demonstrating production-oriented DevOps, DevSecOps, GitOps, Kubernetes, observability, and reliability engineering practices.

The application itself consists of multiple independently running services rather than a single application process.

The current application consists of:

Frontend

Backend API

Background Worker

MongoDB

Redis

The application is currently runnable locally using Docker Compose.

The long-term deployment target is AWS EKS with infrastructure provisioned using Terraform, configuration managed through Ansible where appropriate, continuous integration implemented using Jenkins, and Kubernetes deployment managed through GitOps using ArgoCD.

2. Current Architecture

                         User
                           |
                           v
                    +-------------+
                    |  Frontend   |
                    |   React     |
                    +------+------+
                           |
                           | HTTP/API
                           v
                    +-------------+
                    |   Backend   |
                    | Node.js API |
                    +------+------+
                           |
              +------------+------------+
              |                         |
              v                         v
       +-------------+           +-------------+
       |   MongoDB   |           |    Redis    |
       | Persistent  |           | Queue/Cache |
       |    Data     |           +------+------+
       +-------------+                  |
                                        |
                                        v
                                +---------------+
                                |     Worker    |
                                | Background    |
                                |  Processing   |
                                +-------+-------+
                                        |
                                        v
                                   MongoDB

3. Service Responsibilities

Frontend

The frontend is responsible for:

Presenting the CloudCart user interface.

Accepting user interactions.

Sending API requests to the backend.

Displaying API responses.

The frontend does not directly communicate with MongoDB or Redis.

Backend

The backend is the primary API and business-logic service.

Responsibilities include:

Receiving HTTP requests.

Validating requests.

Executing application/business logic.

Reading and writing application data.

Communicating with MongoDB.

Publishing asynchronous jobs to Redis.

Providing health endpoints.

The backend is therefore the primary synchronous entry point into the application.

Redis

Redis provides asynchronous queue functionality between the backend and worker.

The backend can place jobs onto the queue without waiting for the worker to complete the operation.

Conceptually:

Backend
   |
   | enqueue job
   v
 Redis Queue
   |
   | dequeue job
   v
 Worker

This allows background processing to be separated from the HTTP request lifecycle.

Worker

The worker is an independently running process responsible for consuming jobs from Redis.

The worker:

Connects to Redis.

Waits for queued jobs.

Retrieves jobs.

Processes the jobs.

Performs required database operations.

Records relevant processing information.

The worker is intentionally separated from the backend so that background processing can eventually be scaled independently.

MongoDB

MongoDB is the persistent data store for CloudCart.

MongoDB data is stored using a Docker volume during local development.

The application containers do not own the database data lifecycle.

This separation allows application containers to be recreated without intentionally destroying persistent database state.

4. Communication Model

CloudCart currently uses the following communication paths:

User
  |
  | HTTP
  v
Frontend
  |
  | HTTP/API
  v
Backend
  |
  +---- MongoDB
  |
  +---- Redis
           |
           v
         Worker
           |
           v
        MongoDB

The frontend communicates with the backend.

The backend communicates synchronously with MongoDB when persistent data is required.

The backend can communicate asynchronously through Redis when work should be processed by the worker.

The worker consumes Redis jobs and can subsequently interact with MongoDB.

5. Containerization Model

Each application responsibility runs as an independent container:

+------------------------------------------------+
|              Docker Compose                    |
|                                                |
|  +----------+   +----------+   +----------+   |
|  | Frontend |   | Backend  |   |  Worker  |   |
|  +----------+   +----------+   +----------+   |
|                     |  |            |          |
|                     |  |            |          |
|               +-----+  +------------+          |
|               |                                |
|          +---------+      +---------+          |
|          | MongoDB |      |  Redis  |          |
|          +---------+      +---------+          |
|                                                |
+------------------------------------------------+

Containers are treated as replaceable execution units.

Persistent state belongs to dedicated storage rather than the application container filesystem.

6. Current Deployment Environment

The current development environment uses Docker Compose.

Docker Compose is currently responsible for:

Building application images.

Starting application containers.

Providing service discovery between containers.

Managing container dependencies.

Providing persistent volumes for MongoDB and Redis.

Performing container health checks.

Restarting services according to configured policies.

Docker Compose is considered a local development/runtime mechanism rather than the final production deployment platform.

7. Target Production Architecture

The intended production architecture will evolve toward:

                         GitHub
                            |
                            v
                       CI Pipeline
                         Jenkins
                            |
                    Security + Testing
                            |
                            v
                           ECR
                            |
                            v
                    GitOps Repository
                            |
                            v
                          ArgoCD
                            |
                            v
                           EKS
                            |
             +--------------+--------------+
             |              |              |
          Frontend       Backend         Worker
             |              |              |
             |          +---+---+          |
             |          |       |          |
             |          v       v          |
             |       MongoDB   Redis <------+
             |
             v
        Load Balancer

The exact production architecture will be refined as infrastructure and deployment requirements are implemented.

8. Engineering Principles

CloudCart follows these principles:

Separation of concerns
Frontend, API, background processing, database, and queue responsibilities are separated.

Immutable application artifacts
Applications should be packaged into versioned container images rather than modified directly on servers.

Infrastructure as Code
Infrastructure should eventually be reproducible through Terraform.

Automated configuration
Configuration of supporting infrastructure should be automated rather than manually performed.

Security integrated into delivery
Security checks should be part of the CI pipeline rather than a final manual step.

Declarative deployment
Kubernetes desired state should eventually be maintained through GitOps.

Observability
The platform should expose metrics and operational signals necessary to understand system health.

Reliability through automation
Recovery, scaling, rollback, and operational procedures should be automated wherever practical.

Documented architectural decisions
Significant technical decisions should have an associated Architecture Decision Record.

9. Current State

Current implementation:

Application separated into frontend, backend, and worker services.

MongoDB and Redis separated from application services.

Application containerized.

Docker Compose deployment implemented.

Persistent storage configured for MongoDB and Redis.

Container health checks implemented.

Local multi-container execution verified.

10. Future Evolution

The platform will progressively introduce:

Docker
   ↓
GitHub
   ↓
Terraform
   ↓
AWS Infrastructure
   ↓
ECR
   ↓
Jenkins CI
   ↓
DevSecOps
   ↓
EKS
   ↓
Helm
   ↓
ArgoCD
   ↓
Prometheus + Grafana
   ↓
Reliability Engineering

Each stage will be implemented, tested, documented, and associated with the architectural decisions that justify its introduction.