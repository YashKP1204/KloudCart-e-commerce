ADR-003: Frontend Container Runtime Hardening

Status : Accepted

Context

The CloudCart frontend is served by Nginx inside a Docker container.

During the initial security assessment, the frontend runtime container was found to be running as the root user:

uid=0(root) gid=0(root)

Running a production workload as root increases the potential impact of a successful container compromise because an attacker initially inherits root privileges inside the container.

The frontend container also used port 80, which introduces a privileged-port requirement for a non-root process.

Decision

The frontend runtime container will run Nginx as a dedicated non-root user named cloudcart.

The following controls were implemented:

Created a dedicated cloudcart group and user.

Changed the runtime container to execute as cloudcart.

Changed Nginx from port 80 to unprivileged port 8080.

Created dedicated writable runtime directories for Nginx.

Assigned ownership of required runtime directories to cloudcart.

Moved the Nginx PID file to /var/run/nginx/nginx.pid.

Kept static frontend files available for reading without granting unnecessary write access.

Avoided broad permissions such as chmod 777.

Result

The container runtime identity changed from:

root / UID 0

to:

cloudcart / UID 100

The Nginx configuration was successfully validated after the changes.

The resulting runtime model is:

Frontend Container
        |
        v
    Nginx
        |
        v
 cloudcart user
    UID 100
        |
        +---- :8080
        |
        +---- read frontend files
        |
        +---- write required runtime directories

Security Benefit

This implements the principle of least privilege at the container level.

If an attacker compromises the frontend runtime, the compromised process does not automatically receive root privileges.

The security boundary is therefore improved from:

Application
     |
     v
   root

to:

Application
     |
     v
 cloudcart
     |
     v
limited privileges

This reduces the potential impact of application or Nginx vulnerabilities.

Trade-offs

Running Nginx as a non-root user required additional configuration for:

Nginx runtime directories

PID file location

Listening port

The container therefore has slightly more configuration than the default Nginx image.

This complexity is accepted because the security benefit of removing unnecessary root privileges outweighs the additional configuration.

Verification

The runtime identity was verified using:

docker compose run --rm frontend id

Expected result:

uid=100(cloudcart) gid=102(cloudcart) groups=102(cloudcart)

Nginx configuration was verified using:

docker compose run --rm frontend nginx -t

The configuration passed syntax validation successfully.

Future Security Controls

This ADR only covers frontend container privilege hardening.

Future security controls will address:

Image vulnerability scanning

Dependency/SCA scanning

Secret detection

SBOM generation

Image signing

Read-only root filesystem

Linux capability reduction

Seccomp/AppArmor

Kubernetes Pod Security

Kubernetes RBAC

NetworkPolicy

AWS IAM and workload identity

Runtime security monitoring