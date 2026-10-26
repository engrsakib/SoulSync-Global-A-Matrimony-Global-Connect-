# Safety on SoulSync

Last updated: October 2026

SoulSync Global helps members discover marriage partners with strong privacy defaults and respectful communication. This page explains how we protect **private chat**, biodata, and your account—not operational secrets or key material.

## 1. Overview

Safety on SoulSync combines:

- **End-to-end encrypted private chat** between members who are connected in the app
- **Layered biodata protection** (visibility, grants, and encryption for sensitive fields)
- **Clear limits** on what the platform and staff can see in each context

We design the service so discovery can happen on SoulSync while contact details and private conversations stay under your control.

## 2. Private messaging and end-to-end encryption

When you use **private member-to-member chat** on SoulSync, message **content** is protected with **end-to-end encryption (E2E)**—similar in principle to widely used messaging apps you may already know.

What that means in practice:

- Messages are **encrypted on your device** before they are sent.
- Only **you and the other participant(s)** in that chat can read the decrypted content.
- SoulSync servers handle **ciphertext** (encrypted payloads) for delivery and sync. We do **not** design the chat system so platform operators can read your message bodies.

This applies to **private chat** in the messaging experience. It does **not** automatically apply to every text field on the platform (for example, optional notes on proposals or public community posts may use different storage and visibility rules—see our Privacy Policy).

## 3. Keys and devices

Encryption keys for private chat are tied to **your account and devices/sessions** in the app. When you sign in on a new device, chat history may be restored only when your client can access the keys required for that conversation (for example, after you are authenticated on that device).

If you **log out**, lose a device, or suspect compromise, treat the device as untrusted: change your password, review active sessions where available, and avoid continuing sensitive conversations on that device until you are satisfied it is secure.

## 4. What end-to-end encryption does not cover

E2E protects **message content** in private chat. Other data may still be visible to SoulSync or other members according to product rules and law:

| Area | Typical handling |
| ---- | ---------------- |
| **Metadata** | Delivery timestamps, read receipts, or connection status may be processed to operate the service. |
| **Biodata & photos** | Governed by section visibility, access requests, and public biodata settings—not chat E2E. |
| **Communities** | Posts and comments follow community visibility and moderation rules. |
| **Support email** | Messages you send to **hello@soulsync.global** are not E2E chat. |
| **Legal & safety** | We may preserve and disclose information when required by law or to address serious abuse reports, consistent with our Terms and Privacy Policy. |

For personal data processing details, see the Privacy Policy.

## 5. Biodata and marriage registry security

Highly sensitive biodata and marriage registry fields (for example spouse contact details and selected encrypted JSON blobs) use **application-layer encryption** before storage, with keys available only to the API tier—not embedded in client apps.

**Visibility:** You control section-level biodata visibility. Viewers without permission see redacted content or must use approved access flows.

**Editor grants:** Delegated biodata editing requires explicit grants from the owner.

**Public biodata:** Public member views respect photo visibility, section gates, partner display preferences, and never expose draft registry contact fields.

## 6. Reporting abuse and blocking

If another member behaves inappropriately, use in-app **report** and **block** tools where available. Our safety team reviews reports under our policies. Because private chat content is end-to-end encrypted, investigations rely on **reports, metadata, account signals, and member-provided context**—not routine reading of message bodies by staff.

## 7. Infrastructure and incident response

Production traffic uses TLS in transit. Databases and object storage use provider encryption at rest. We patch runtimes, isolate networks, and manage secrets for credentials and encryption keys. We investigate suspected incidents, rotate credentials when needed, and notify affected users or regulators when required by law.

## 8. Your responsibilities

- Use a **strong, unique password** and keep your email secure.
- Protect your **phone and laptop**; lock screens and avoid sharing unlocked devices.
- Review **biodata visibility** before publishing.
- Be cautious sharing **phone numbers, addresses, or payment details** outside SoulSync until you trust the other party.
- Report suspicious accounts or coercion promptly.

## 9. Contact

Safety and security questions: **hello@soulsync.global**
