# EcoSphere - ESG Management Platform (Backend)

A Node.js + Express + MongoDB backend for managing Environmental, Social, and
Governance (ESG) data: ERP operations, carbon accounting, CSR, gamification,
governance, and reporting.

## Tech Stack
- Node.js / Express.js
- MongoDB / Mongoose
- JWT authentication
- bcrypt password hashing
- dotenv for configuration

## Getting Started

### 1. Install dependencies
```
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your values:
```
cp .env.example .env
```

### 3. Start MongoDB
Make sure MongoDB is running locally, or update `MONGO_URI` in `.env` to point
to a MongoDB Atlas cluster.

### 4. Run the server
```
npm run dev     # development, with auto-reload (nodemon)
npm start       # production
```

The API will be available at `http://localhost:5000`.

## Folder Structure
```
backend/
│
├── server.js          # entry point - connects DB and starts the server
├── app.js              # express app setup, middleware, route mounting
├── package.json
├── .env.example
│
├── config/
│   └── db.js            # MongoDB connection
│
├── models/              # Mongoose schemas (20 collections)
├── controllers/         # request handlers - one file per module
├── routes/               # Express routers - one file per module
├── middleware/
│   ├── authMiddleware.js    # JWT protect + role-based authorize
│   └── errorMiddleware.js   # centralized error handling
├── services/
│   ├── carbonService.js     # emission factor lookup + carbon math
│   ├── scoreService.js       # department ESG score updates
│   ├── challengeService.js   # XP, badges, leaderboard
│   └── reportService.js      # report data aggregation
└── uploads/               # static files (e.g. CSR participation proof)
```

## Modules & Key Endpoints

| Module | Base Route | Notes |
|---|---|---|
| Auth | `/auth` | register, login, me |
| Departments | `/departments` | full CRUD |
| Categories | `/categories` | full CRUD |
| Emission Factors | `/emission-factors` | full CRUD |
| Goals | `/goals` | full CRUD |
| Policies | `/policies` | CRUD + `/:id/acknowledge`, `/acknowledgements` |
| Badges | `/badges` | full CRUD |
| Rewards | `/rewards` | CRUD + `/:id/redeem` |
| Purchases | `/purchases` | create auto-generates a Carbon Transaction |
| Manufacturing | `/manufacturing` | create auto-generates a Carbon Transaction |
| Fleet | `/fleet` | create auto-generates a Carbon Transaction |
| Expenses | `/expenses` | create auto-generates Carbon Transaction(s) |
| Carbon Transactions | `/carbon` | **GET only** - system generated |
| CSR | `/csr` | CRUD + `/:id/participate`, `/participation/:id/approve` |
| Challenges | `/challenges` | CRUD + `/:id/participate`, `/participation/:id/approve`, `/leaderboard` |
| Audits | `/audits` | full CRUD |
| Compliance | `/compliance` | CRUD + `/:id/resolve` |
| Reports | `/reports` | `/environmental`, `/social`, `/governance`, `/summary` |
| Dashboard | `/dashboard` | overall ESG score, department scores, emissions, CSR, compliance, leaderboard |

## Automatic Business Logic

- **Purchase / Manufacturing / Fleet / Expense created** → `carbonService` looks
  up the matching `EmissionFactor`, calculates emission, creates a
  `CarbonTransaction`, and calls `scoreService.updateEnvironmentalScore()`.
- **CSR participation approved** → employee gets points, department
  `socialScore` increases.
- **Challenge participation approved** → employee gets XP,
  `challengeService.checkAndUnlockBadges()` auto-unlocks any earned badges,
  leaderboard is always computed live from `User.xp`.
- **Policy acknowledged** → department `governanceScore` increases.
- **Compliance issue resolved** → department `governanceScore` increases
  (weighted by issue severity).
- **Department Total Score** = average of `environmentalScore`,
  `socialScore`, and `governanceScore` (auto-recalculated by
  `scoreService.recalcTotalScore()` after every update).

## Authentication

All routes except `/auth/register` and `/auth/login` require a JWT in the
`Authorization` header:
```
Authorization: Bearer <token>
```
Some routes are further restricted by role (`admin`, `manager`, `employee`)
via the `authorize()` middleware.
