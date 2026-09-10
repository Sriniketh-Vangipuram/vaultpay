Prompts.md — VaultPay AI Assistance Disclosure

Purpose

This document records AI assistance used during VaultPay development.

AI was used as an engineering assistant for architecture discussion, implementation guidance, debugging, security review, testing strategy, and documentation. Suggestions were reviewed, adapted, and tested before being included.

Architecture

Act as a senior backend engineer and help design a production-grade B2B billing backend using Node.js, Express, TypeScript, MongoDB, JWT, and a payment-provider abstraction. The system must support Admin and Client roles, secure invoice access, payments, webhooks, PDF receipts, cloud storage, and email delivery.

Used for: Initial architecture and service boundaries.

Authentication and RBAC

Design JWT authentication and role-based authorization for an Express TypeScript API with ADMIN and CLIENT roles. The backend must independently enforce authorization.

Used for: JWT middleware, RBAC, password hashing, and authenticated request handling.

IDOR Prevention

Review an invoice API for IDOR vulnerabilities. A client must only access invoices where invoice.clientId matches the authenticated user's ID. Explain where ownership checks should occur.

Used for: Invoice, receipt, and payment ownership checks.

Invoice Design

Design a B2B invoice model containing invoice number, client, description, amount, currency, due date, payment provider identifiers, status, paid timestamp, and receipt URL.

Used for: Invoice model and validation design.

Sequential Invoice Numbers

Design a MongoDB-safe approach for sequential invoice numbers such as INV-2026-000001 without relying on random UUID-style business identifiers.

Used for: Invoice counter implementation.

Payment Idempotency

Explain persistent payment idempotency. The same Idempotency-Key must not create duplicate checkout sessions, while reuse of a key with a different request payload must be rejected.

Used for: Payment idempotency model and checkout service.

Payment Provider Abstraction

Design a provider-neutral payment interface so business logic can support Stripe or a mock provider without coupling the service layer to provider-specific behavior.

Used for: Payment provider abstraction.

Webhook Security

Design a secure payment webhook where the client cannot mark an invoice as paid. Verify a cryptographic signature, validate invoice/client ownership, amount, and currency before changing payment state.

Used for: Signed webhook implementation.

Webhook Retry Safety

Review a payment webhook processor for retry safety. It should handle duplicate events, duplicate payment IDs, receipt generation failures, Cloudinary failures, and email delivery failures without creating duplicate payments.

Used for: Retry-safe webhook behavior.

PDF Receipt

Design a professional PDF payment receipt using PDFKit with company branding, invoice number, client details, payment details, amount, paid status, and footer.

Used for: Receipt PDF implementation.

Cloudinary

Design a Cloudinary service for dynamically generated PDF receipts. Upload PDFs as raw resources under a dedicated vaultpay/receipts folder and return the secure URL.

Used for: Receipt storage implementation.

Email Delivery

Design an email service that sends a generated PDF receipt as an attachment to the registered client's email address.

Used for: Initial Nodemailer implementation and later migration to Resend API when Render SMTP connectivity caused production delivery problems.

Production Debugging

Analyze Render logs and determine whether payment, PDF generation, Cloudinary upload, or email delivery is failing.

Used for: Diagnosing SMTP connectivity and the later invalid Resend API key.

TypeScript Debugging

Explain the TypeScript error and provide the smallest architecture-preserving fix without changing unrelated services.

Used for: Resolving the email-service input mismatch.

Security Audit

Create a Postman security audit for a role-based invoice API covering missing JWT, client access to admin endpoints, cross-client invoice access, cross-client receipt access, invalid IDs, and invalid webhook signatures.

Used for: Production security testing.

Documentation

Create production-grade README documentation for a billing backend covering architecture, API endpoints, environment variables, security, payment flow, deployment, testing, and limitations.

Used for: Final project documentation.

AI Usage Statement

AI assistance was not treated as automatically correct. Code and suggestions were reviewed, adapted to the project, type-checked, built, tested, and verified in production.

Payment Integration Disclosure

The original requirement specifies Stripe. Live Stripe onboarding was not available for the India-based development environment.

Therefore:

No fake Stripe credentials were used.

No live Stripe transaction is claimed.

A provider abstraction and cryptographically signed mock provider were implemented.

The deployed demo exercises payment idempotency, webhook verification, invoice state transition, receipt generation, cloud storage, and email delivery.

A real Stripe adapter can be connected when valid Stripe credentials and webhook configuration are available.

This limitation is intentionally disclosed rather than misrepresented.