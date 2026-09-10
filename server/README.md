# VaultPay — Financial Billing & Payment Core

VaultPay is a secure B2B billing backend for Nexus Corporate Services. It provides JWT authentication, role-based authorization, IDOR protection, invoice management, payment processing, signed webhooks, PDF receipt generation, Cloudinary storage, and automated email delivery.

## Project

- **Client:** Evelyn Croft, CFO
- **Company:** Nexus Corporate Services, New York
- **Track:** Track B — Fullstack Engineer (Node.js / Express / Stripe)

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT / bcryptjs
- Zod
- Stripe SDK / provider abstraction
- PDFKit
- Cloudinary
- Resend
- Helmet / CORS
- Render

## Architecture

```text
HTTP Request
  -> Express
  -> Security Middleware
  -> JWT Authentication
  -> RBAC / Ownership Authorization
  -> Controller
  -> Service
  -> Mongoose
  -> MongoDB Atlas
```

Payment lifecycle:

```text
Client
  -> Checkout Session
  -> Payment Provider
  -> Signed Webhook
  -> Signature Verification
  -> Payment Service
  -> Invoice = PAID
  -> PDFKit Receipt
  -> Cloudinary
  -> Resend Email
```

## Project Structure

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── email/
│   │   ├── payment/
│   │   └── receipt/
│   ├── validators/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Authentication & Authorization

The API uses JWT bearer authentication:

```http
Authorization: Bearer <JWT_TOKEN>
```

Roles:

```text
ADMIN
CLIENT
```

Passwords are hashed with bcrypt.

Client authorization is enforced server-side. For invoice and receipt access, the backend verifies that the requested resource belongs to the authenticated client. A client attempting to access another client's invoice receives `403 Forbidden`.

## API Endpoints

### Authentication

```http
POST /api/auth/login
GET  /api/auth/me
```

### Admin

```http
GET   /api/admin/dashboard
GET   /api/admin/clients
POST  /api/admin/invoices
GET   /api/admin/invoices
GET   /api/admin/invoices/:id
PATCH /api/admin/invoices/:id
```

### Client

```http
GET /api/client/dashboard
GET /api/client/invoices
GET /api/client/invoices/:id
GET /api/client/invoices/:id/receipt
```

### Payments

```http
POST /api/payments/create-checkout-session
POST /api/payments/mock/complete
```

The checkout endpoint requires an `Idempotency-Key` header.

### Webhook

The deployed demonstration uses:

```http
POST /api/webhooks/mock
```

The mock provider signs webhook payloads with HMAC-SHA256. The signature is verified before payment state is changed.

## Invoice Design

Invoices use readable sequential identifiers such as:

```text
INV-2026-000001
INV-2026-000002
INV-2026-000003
```

Invoice states include:

```text
DRAFT
PENDING
PAID
OVERDUE
CANCELLED
```

The backend prevents clients from modifying invoice payment state.

## Payment Security

The client is never trusted to mark an invoice as paid.

The payment state transition occurs only after the backend verifies the signed webhook and validates:

- event identity
- invoice
- client
- amount
- currency
- payment status

Persistent idempotency prevents duplicate checkout sessions from the same request key.

Webhook processing also checks existing payment/event records to support retry-safe receipt processing.

## PDF Receipt

After successful payment confirmation, PDFKit generates a professional receipt containing:

- Nexus Corporate Services branding
- Invoice number
- Client details
- Payment details
- Amount and currency
- Paid status
- Payment date
- Receipt footer

The PDF is uploaded to:

```text
Cloudinary/vaultpay/receipts
```

The resulting URL is stored on the invoice.

## Email Delivery

The production email service uses the Resend API.

The generated PDF is attached to the email sent to the registered client address.

Secrets are stored as environment variables and are not committed to Git.

## Environment Variables

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=your_client_url

PAYMENT_PROVIDER=mock
MOCK_WEBHOOK_SECRET=your_mock_webhook_secret

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Never commit real credentials.

## Local Development

```bash
npm install
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm start
```

## Production Deployment

Backend deployment:

```text
https://vaultpay-gpnq.onrender.com
```

Health endpoint:

```text
https://vaultpay-gpnq.onrender.com/api/health
```

The production service uses Render environment variables and MongoDB Atlas.

## Production Verification

The deployed system was verified through:

| Test | Result |
|---|---|
| Admin login | Passed |
| Client login | Passed |
| Admin invoice creation | Passed |
| Client sees own invoice | Passed |
| Cross-client invoice access | Rejected with 403 |
| Client accessing Admin API | Rejected with 403 |
| Missing JWT | Rejected with 401 |
| Checkout creation | Passed |
| Payment idempotency | Passed |
| Signed webhook | Passed |
| Invalid webhook signature | Rejected |
| Invoice marked PAID | Passed |
| PDF generation | Passed |
| Cloudinary upload | Passed |
| Receipt email | Passed |

## Stripe Integration Note

The original Track B specification calls for Stripe Checkout and Stripe signed webhooks.

Live Stripe onboarding was not available for the India-based development environment, so the deployed demonstration uses a transparent provider abstraction with a cryptographically signed mock provider.

No fake Stripe credentials or fake live Stripe transaction were used.

The mock provider demonstrates the backend payment lifecycle, including idempotency, webhook verification, payment state transition, PDF generation, cloud storage, and email delivery. The provider abstraction allows a real Stripe adapter to be connected when valid Stripe credentials and webhook configuration are available.

## AI Transparency

AI assistance was used for architecture discussions, implementation guidance, debugging, security review, testing guidance, and documentation.

Generated suggestions were reviewed and adapted to the project's architecture. The implementation was type-checked, built, tested through API requests, security-tested, and verified after production deployment.

See `Prompts.md` for the AI assistance record.

## Author

**Sriniketh Vangipuram**

Developed as part of the Prodesk IT Solutions Internship — Final Client Delivery Phase.
