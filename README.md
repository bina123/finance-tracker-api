# Finance Tracker API

A fintech-grade REST API for personal finance tracking built with
Node.js, Express.js, PostgreSQL, and Prisma ORM.

## Features

- JWT Authentication
- Transaction management with **idempotency keys**
- **Double-entry ledger** for financial accuracy
- Budget tracking with real-time vs actual spending
- Soft delete with full audit trail
- Input validation, rate limiting, security headers
- Docker + CI/CD with GitHub Actions

## Tech Stack

- **Runtime** — Node.js 20
- **Framework** — Express.js
- **Database** — PostgreSQL
- **ORM** — Prisma 7
- **Auth** — JWT
- **Validation** — Joi
- **Container** — Docker + Docker Compose
- **CI/CD** — GitHub Actions

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Start server
npm run dev
```

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/auth/me | Get current user |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/categories | Create category |
| GET | /api/v1/categories | List all |
| GET | /api/v1/categories/:id | Get one |
| PUT | /api/v1/categories/:id | Update |
| DELETE | /api/v1/categories/:id | Delete |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/transactions | Create with idempotency |
| GET | /api/v1/transactions | List with filters |
| GET | /api/v1/transactions/balance | Account balance |
| GET | /api/v1/transactions/verify-ledger | Ledger integrity check |
| GET | /api/v1/transactions/:id | Get with ledger entries |
| PUT | /api/v1/transactions/:id | Update |
| DELETE | /api/v1/transactions/:id | Soft delete |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/budgets | Create budget |
| GET | /api/v1/budgets | List budgets |
| GET | /api/v1/budgets/summary | Budget vs actual |
| GET | /api/v1/budgets/:id | Get one |
| PUT | /api/v1/budgets/:id | Update |
| DELETE | /api/v1/budgets/:id | Delete |

## Key Design Decisions

### Idempotency
Every transaction requires a unique `idempotencyKey`.
Duplicate requests return the existing transaction without
creating a new record — preventing double charges.

### Double Entry Ledger
Every transaction creates two ledger entries — debit and credit.
`GET /api/v1/transactions/verify-ledger` confirms total debits
always equal total credits.

### Soft Delete
Transactions are never hard deleted — `deletedAt` timestamp
is set instead. Full audit trail is preserved.