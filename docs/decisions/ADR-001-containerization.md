ADR-001: Containerize CloudCart Services

Status : Accepted

Date : 2026-10-06

Context

CloudCart needs to run consistently across development, CI, staging, and eventually production environments.

Installing application dependencies directly onto individual machines introduces differences between environments and makes application deployment less reproducible.

The application consists of multiple independent services with different runtime requirements.

Decision

CloudCart services will be packaged as Docker container images.

The current local environment uses Docker Compose to orchestrate:

Frontend

Backend

Worker

MongoDB

Redis

Application services use dedicated Dockerfiles.

MongoDB and Redis use official container images.

Persistent application data is stored using Docker-managed volumes rather than relying on the lifecycle of application containers.

Rationale

Containerization provides:

Reproducible runtime environments.

Explicit dependency management.

Consistent local and CI environments.

Portable application artifacts.

Independent service lifecycle management.

A natural transition toward Kubernetes.

Consequences

Positive

Developers can reproduce the complete application environment.

CI can build the same container artifacts used later in deployment.

Application images can be stored in a registry.

Kubernetes can consume the same immutable images.

Negative

Container networking must be managed.

Image size and build time must be controlled.

Container security becomes part of the delivery process.

Persistent data requires explicit storage management.

Future Evolution

Docker Compose is considered the current local orchestration mechanism.

The target production environment will use Kubernetes on AWS EKS.

The same application images will eventually be promoted through the delivery pipeline:

Source Code
    ↓
Jenkins
    ↓
Docker Build
    ↓
Security Scanning
    ↓
ECR
    ↓
EKS