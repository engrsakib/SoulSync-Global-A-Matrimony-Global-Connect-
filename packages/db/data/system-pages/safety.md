# Safety & Data Security

Last updated: October 2026

SoulSync Global is designed so respectful discovery and strong data protection work together. This page summarizes our security architecture—not operational secrets.

## 1. Security principles

- **Least privilege:** Access to biodata and marriage registry data is scoped by role, grant, and visibility settings.
- **Encryption in transit:** Browser and API traffic uses TLS in production.
- **Encryption at rest:** Database and object storage rely on provider-level encryption; selected biodata fields use application-layer encryption with `BIODATA_MASTER_KEY`.
- **Auditability:** Sensitive actions can be logged for security and compliance review.

## 2. Application-layer encryption

Highly sensitive biodata and marriage registry fields (for example spouse contact details and encrypted JSON blobs) are encrypted before persistence using a dedicated master key available only to the API tier. Keys are not embedded in client applications.

## 3. Access controls

### 3.1 Biodata visibility

Members control section-level visibility. Viewers without permission see redacted or request-based flows—not raw private fields.

### 3.2 Editor grants and access requests

Delegated biodata editing requires explicit grants. Access requests are owner-approved and time-bound where applicable.

### 3.3 Marriage records

Private marriage history on your biodata is distinct from public SoulSync marriage confirmations. Registry contact fields are never shown on public member biodata views.

## 4. Data sharing

We do not share biodata with advertisers. Community moderators see only what their role requires. Public biodata surfaces respect `photoVisibility`, section gates, and partner display preferences.

## 5. Infrastructure

Production workloads run on managed services with patched runtimes, network isolation, and secret management for credentials and encryption keys. Redis caches public marketing content separately from encrypted biodata stores.

## 6. Incident response

We investigate suspected breaches, rotate credentials when needed, and notify affected users or regulators when required by law.

## 7. Your role

Use strong passwords, enable available security features, report suspicious accounts, and review visibility settings before publishing biodata.

## 8. Contact

Security questions: **hello@soulsync.global**
