# EcoSphere — Backend Build Specification
### Node.js + Express + MongoDB (Docker) + JWT — 3 portals: Admin (no auth), Department, Employee

This document is written so you can build the backend top-to-bottom without guessing. Follow it in order. Every section that needs code shows the exact shape to write.

---

## 1. Big picture — what you're building

Three separate "front doors" into the same database:

| Portal | Who uses it | Auth? | What they can do |
|---|---|---|---|
| **Admin** | ESG/HR admin (internal, trusted) | **None** — no login, no JWT, open access | Full CRUD on everything: departments, categories, emission factors, policies, CSR activities, challenges, badges, rewards. Approves/rejects employee & department submissions (views proof files). Configures toggles and ESG weights. Views all reports. |
| **Department** | Department head / manager | JWT required | Submits Carbon Transactions (Factor + Value) for their own department. Views their own department's E/S/G scores, ranking vs other departments, and their employees' Social scores. Cannot approve anything, cannot touch other departments. |
| **Employee** | Regular staff | JWT required | Joins CSR Activities & Challenges, uploads proof, views their own participation status (Pending/Approved/Rejected), views their XP, badges, leaderboard position, acknowledges policies, redeems rewards. Cannot approve their own or anyone else's submissions. |

**Important on "Admin has no auth":** this is fine for a prototype/internal tool but means anyone who can reach that URL has full control. Before this goes anywhere near production, put the admin routes behind at minimum a shared static token or basic auth at the reverse-proxy level — don't expose it on the open internet as-is. Noting this once; not repeating it — you asked for no auth on admin, so the spec below implements exactly that.

---

## 2. Tech stack

- **Runtime:** Node.js (v20 LTS)
- **Framework:** Express.js
- **Database:** MongoDB, run as a Docker container
- **ODM:** Mongoose
- **Auth:** JWT (`jsonwebtoken`) + `bcrypt` for password hashing — Department and Employee portals only
- **File uploads (proof images/PDFs):** `multer`, stored to local disk (`/uploads`) for now — swap for S3-compatible storage later if needed
- **Validation:** `express-validator` or `zod`
- **Env config:** `dotenv`

---

## 3. MongoDB via Docker — do this first

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    container_name: ecosphere-mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ecosphere_admin
      MONGO_INITDB_ROOT_PASSWORD: change_this_password
      MONGO_INITDB_DATABASE: ecosphere
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
```

Run it:
```
docker compose up -d
```

Connection string for your `.env`:
```
MONGO_URI=mongodb://ecosphere_admin:change_this_password@localhost:27017/ecosphere?authSource=admin
```

Verify it's running: `docker ps` should show `ecosphere-mongo` as healthy.

---

## 4. Project folder structure

```
ecosphere-backend/
├── docker-compose.yml
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Department.js
│   │   ├── Employee.js
│   │   ├── Category.js
│   │   ├── EmissionFactor.js
│   │   ├── ProductESGProfile.js
│   │   ├── EnvironmentalGoal.js
│   │   ├── ESGPolicy.js
│   │   ├── Badge.js
│   │   ├── Reward.js
│   │   ├── CarbonTransaction.js
│   │   ├── CSRActivity.js
│   │   ├── EmployeeParticipation.js
│   │   ├── Challenge.js
│   │   ├── ChallengeParticipation.js
│   │   ├── PolicyAcknowledgement.js
│   │   ├── Audit.js
│   │   ├── ComplianceIssue.js
│   │   └── ESGConfig.js
│   ├── middleware/
│   │   ├── authEmployee.js
│   │   ├── authDepartment.js
│   │   └── upload.js          (multer config)
│   ├── routes/
│   │   ├── admin/              (no auth applied)
│   │   │   ├── departments.js
│   │   │   ├── categories.js
│   │   │   ├── environmental.js
│   │   │   ├── social.js
│   │   │   ├── governance.js
│   │   │   ├── gamification.js
│   │   │   ├── reports.js
│   │   │   └── settings.js
│   │   ├── department/         (authDepartment applied)
│   │   │   ├── auth.js
│   │   │   ├── carbonTransactions.js
│   │   │   └── dashboard.js
│   │   └── employee/           (authEmployee applied)
│   │       ├── auth.js
│   │       ├── csr.js
│   │       ├── challenges.js
│   │       ├── rewards.js
│   │       ├── policies.js
│   │       └── dashboard.js
│   ├── controllers/            (one file per route file above, same names)
│   ├── services/
│   │   ├── scoring.service.js  (all E/S/G/Total/Overall score math lives here)
│   │   └── badge.service.js    (auto-award check logic)
│   └── uploads/                (proof files land here)
```

---

## 5. Environment variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb://ecosphere_admin:change_this_password@localhost:27017/ecosphere?authSource=admin
JWT_SECRET_EMPLOYEE=replace_with_long_random_string
JWT_SECRET_DEPARTMENT=replace_with_a_different_long_random_string
JWT_EXPIRES_IN=8h
UPLOAD_DIR=./src/uploads
```

Use two different JWT secrets for Employee vs Department tokens — this stops an employee token from ever being valid on a department route even if someone tampers with the payload's role field.

---

## 6. Data models (Mongoose schemas)

Build these in this exact order — later ones reference earlier ones by `ObjectId`.

### 6.1 Department
```js
{
  name: String, required,
  code: String, required, unique,
  head: String,
  parentDepartment: { type: ObjectId, ref: 'Department', default: null },
  employeeCount: Number, default: 0,
  status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
  passwordHash: String,   // department portal login
  createdAt, updatedAt (timestamps: true)
}
```

### 6.2 Employee
```js
{
  name: String, required,
  email: String, required, unique,
  passwordHash: String, required,
  department: { type: ObjectId, ref: 'Department', required: true },
  xp: { type: Number, default: 0 },        // running wallet, denormalized cache — recompute-able from EmployeeParticipation + ChallengeParticipation
  status: { type: String, enum: ['Active','Inactive'], default: 'Active' },
  timestamps: true
}
```

### 6.3 Category
```js
{
  name: String, required,
  type: { type: String, enum: ['CSR Activity','Challenge'], required: true },
  status: { type: String, enum: ['Active','Inactive'], default: 'Active' }
}
```

### 6.4 EmissionFactor
```js
{
  activity: String, required,       // e.g. "Grid Electricity"
  scope: { type: String, enum: ['Scope 1','Scope 2','Scope 3'] },
  unit: String,                     // "kWh", "litre", "kg"
  co2ePerUnit: Number, required,
  source: String,
  status: { type: String, enum: ['Active','Draft','Inactive'], default: 'Active' },
  timestamps: true
}
```

### 6.5 ProductESGProfile
```js
{
  productName: String, required,
  linkedEmissionFactor: { type: ObjectId, ref: 'EmissionFactor' },
  notes: String
}
```

### 6.6 EnvironmentalGoal
```js
{
  name: String, required,
  department: { type: ObjectId, ref: 'Department', required: true },
  metric: String,             // "Total CO2e (tons)"
  baseline: Number, required,
  target: Number, required,
  current: Number, default: function(){ return this.baseline },
  dueDate: Date,
  status: { type: String, enum: ['Active','On Track','At Risk','Completed'], default: 'Active' },
  timestamps: true
}
```

### 6.7 ESGPolicy
```js
{
  title: String, required,
  category: { type: String, enum: ['Environmental','Social','Governance'] },
  version: String,
  effectiveDate: Date,
  applicableDepartments: [{ type: ObjectId, ref: 'Department' }],  // empty array = applies to all
  documentUrl: String,
  status: { type: String, enum: ['Active','Draft','Archived'], default: 'Active' },
  timestamps: true
}
```

### 6.8 Badge
```js
{
  name: String, required,
  description: String,
  icon: String,
  unlockRule: {
    type: { type: String, enum: ['xp','challenges','csr','policies'] },
    min: Number
  }
}
```

### 6.9 Reward
```js
{
  name: String, required,
  description: String,
  pointsRequired: Number, required,
  stock: Number, required,
  status: { type: String, enum: ['Active','Inactive'], default: 'Active' }
}
```

### 6.10 CarbonTransaction
```js
{
  department: { type: ObjectId, ref: 'Department', required: true },
  emissionFactor: { type: ObjectId, ref: 'EmissionFactor', required: true },
  sourceDescription: String,   // "Manufacturing Run #4471" — free text, dept enters this
  quantity: Number, required,  // the "Value" the department submits
  co2eCalculated: Number,      // auto-computed = quantity * emissionFactor.co2ePerUnit
  submittedBy: { type: ObjectId, ref: 'Department' },
  date: { type: Date, default: Date.now },
  timestamps: true
}
```
**Business rule:** on save, always compute `co2eCalculated = quantity * emissionFactor.co2ePerUnit` server-side in a pre-save hook — never trust a client-sent CO2e value.

### 6.11 CSRActivity
```js
{
  title: String, required,
  category: { type: ObjectId, ref: 'Category', required: true },
  description: String,
  date: Date,
  department: { type: ObjectId, ref: 'Department', default: null }, // null = open to all
  evidenceRequired: { type: Boolean, default: true },
  status: { type: String, enum: ['Draft','Active','Completed'], default: 'Draft' },
  timestamps: true
}
```

### 6.12 EmployeeParticipation
```js
{
  employee: { type: ObjectId, ref: 'Employee', required: true },
  activity: { type: ObjectId, ref: 'CSRActivity', required: true },
  proofFileUrl: String,       // set by multer upload
  approval: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' },
  pointsEarned: { type: Number, default: 0 },  // set only on Approve
  completionDate: Date,
  timestamps: true
}
```

### 6.13 Challenge
```js
{
  title: String, required,
  category: { type: ObjectId, ref: 'Category', required: true },
  description: String,
  xp: Number, required,
  difficulty: { type: String, enum: ['Easy','Medium','Hard'] },
  evidenceRequired: { type: Boolean, default: true },
  deadline: Date,
  status: { type: String, enum: ['Draft','Active','Under Review','Completed','Archived'], default: 'Draft' },
  timestamps: true
}
```

### 6.14 ChallengeParticipation
```js
{
  challenge: { type: ObjectId, ref: 'Challenge', required: true },
  employee: { type: ObjectId, ref: 'Employee', required: true },
  progress: { type: Number, default: 0 },   // 0-100
  proofFileUrl: String,
  approval: { type: String, enum: ['In progress','Pending','Under review','Approved','Rejected'], default: 'In progress' },
  xpAwarded: { type: Number, default: 0 },  // set only on Approve
  timestamps: true
}
```

### 6.15 PolicyAcknowledgement
```js
{
  policy: { type: ObjectId, ref: 'ESGPolicy', required: true },
  employee: { type: ObjectId, ref: 'Employee', required: true },
  status: { type: String, enum: ['Pending','Acknowledged'], default: 'Pending' },
  acknowledgedDate: Date
}
```

### 6.16 Audit
```js
{
  title: String, required,
  department: { type: ObjectId, ref: 'Department', required: true },
  auditor: String,
  date: Date,
  findings: String,
  status: { type: String, enum: ['Scheduled','Under Review','Completed'], default: 'Scheduled' }
}
```

### 6.17 ComplianceIssue
```js
{
  audit: { type: ObjectId, ref: 'Audit', required: true },
  description: String, required,
  severity: { type: String, enum: ['Low','Medium','High'], required: true },
  department: { type: ObjectId, ref: 'Department', required: true },
  owner: String, required,       // Compliance Issue Ownership rule — mandatory
  dueDate: Date, required,       // mandatory
  status: { type: String, enum: ['Open','Resolved'], default: 'Open' },
  timestamps: true
}
```

### 6.18 ESGConfig (singleton document — only ever one row)
```js
{
  weights: {
    environmental: { type: Number, default: 40 },
    social: { type: Number, default: 30 },
    governance: { type: Number, default: 30 }
  },
  toggles: {
    autoEmissionCalculation: { type: Boolean, default: true },
    evidenceRequiredForCSR: { type: Boolean, default: true },
    badgeAutoAward: { type: Boolean, default: true }
  },
  notificationSettings: {
    newComplianceIssue: { type: Boolean, default: true },
    approvalDecisions: { type: Boolean, default: true },
    policyReminders: { type: Boolean, default: true },
    badgeUnlocks: { type: Boolean, default: true }
  }
}
```
On server startup, check if this collection is empty — if so, insert one default document. All scoring/toggle logic reads from this single document.

---

## 7. Authentication — Department & Employee only (Admin has none)

### 7.1 Department login
`POST /api/department/auth/login`
Body: `{ code, password }` (department logs in with its Department Code + password set by admin)
- Look up `Department` by `code`
- `bcrypt.compare(password, department.passwordHash)`
- On success, sign JWT: `jwt.sign({ id: department._id, role: 'department' }, JWT_SECRET_DEPARTMENT, { expiresIn: '8h' })`
- Return `{ token, department: { id, name, code } }`

### 7.2 Employee login
`POST /api/employee/auth/login`
Body: `{ email, password }`
- Look up `Employee` by `email`
- `bcrypt.compare`
- Sign JWT: `jwt.sign({ id: employee._id, department: employee.department, role: 'employee' }, JWT_SECRET_EMPLOYEE, { expiresIn: '8h' })`
- Return `{ token, employee: { id, name, department } }`

### 7.3 Middleware — `authEmployee.js`
```js
function authEmployee(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_EMPLOYEE);
    if (decoded.role !== 'employee') return res.status(403).json({ error: 'Wrong token type' });
    req.employee = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```
`authDepartment.js` is identical but checks `JWT_SECRET_DEPARTMENT` and `role === 'department'`.

### 7.4 Admin routes
Mount admin routers with **no middleware at all**. Just `app.use('/api/admin', adminRouter)` directly — no token check anywhere under `/api/admin/*`.

---

## 8. Score calculation — exact formulas to implement

Put all of this in `services/scoring.service.js` so it's testable and reused everywhere (dashboards, reports).

### 8.1 Environmental Score — department-level, direct from Environmental Goals
```
For each Active/On Track EnvironmentalGoal belonging to a department:
  goalScore = clamp( ((baseline - current) / (baseline - target)) * 100, 0, 100 )

departmentEnvironmentalScore = average(goalScore) across that department's goals
  → if a department has zero goals, default to 50 (neutral) until goals exist
```

### 8.2 Social Score — employee-level first, then aggregated to department
```
For each employee:
  approvedPoints = sum of pointsEarned from their Approved EmployeeParticipation records
  approvedXP     = sum of xpAwarded from their Approved ChallengeParticipation records
  employeeSocialScore = clamp( ((approvedPoints + approvedXP) / TARGET_PER_EMPLOYEE) * 100, 0, 100 )
  // TARGET_PER_EMPLOYEE is a constant, e.g. 200 — store it in ESGConfig if you want it configurable

departmentSocialScore = average(employeeSocialScore) across all employees in that department
```

### 8.3 Governance Score — department-level, hybrid
```
policyAckRate = (acknowledged PolicyAcknowledgement docs for that dept's employees)
                / (total applicable PolicyAcknowledgement docs for that dept's employees) * 100

complianceClosureRate = (Resolved ComplianceIssue docs for that dept)
                       / (total ComplianceIssue docs for that dept) * 100
                       → if a department has zero issues, default to 100 (nothing wrong = full marks)

departmentGovernanceScore = average(policyAckRate, complianceClosureRate)
```

### 8.4 Department Total Score
```
weights = ESGConfig.weights   // e.g. {environmental: 40, social: 30, governance: 30}

departmentTotalScore =
  (departmentEnvironmentalScore * weights.environmental / 100) +
  (departmentSocialScore        * weights.social        / 100) +
  (departmentGovernanceScore    * weights.governance     / 100)
```

### 8.5 Overall Organization ESG Score
```
overallESGScore = average(departmentTotalScore) across all Active departments
```

**Implementation note:** don't store scores as static fields that go stale — recompute them on-demand in a `GET /dashboard` style endpoint, or recompute on a schedule (e.g. every time a relevant document changes, or nightly via a cron job) and cache the result in a `DepartmentScore` collection with a `calculatedAt` timestamp. For a first build, on-demand calculation is simpler and fine.

---

## 9. Business rule enforcement — where each toggle actually gets checked

| Toggle | Enforced where |
|---|---|
| `autoEmissionCalculation` | If **on**: department portal only submits `{ emissionFactor, quantity, sourceDescription }` and the backend calculates `co2eCalculated`. If **off**: allow department to also directly type a `co2eCalculated` override value. Either way, calculation always happens server-side in the pre-save hook — the toggle only decides whether manual override is *allowed*. |
| `evidenceRequiredForCSR` | In the `PATCH /api/admin/social/participation/:id/approve` controller: if this is `true`, reject the approve action (`400`) unless `proofFileUrl` is set on that participation record. Same rule applies to Challenge Participation approval. |
| `badgeAutoAward` | Run `badge.service.js`'s `checkAndAwardBadges(employeeId)` function automatically inside the same transaction/step whenever: (a) an EmployeeParticipation is Approved, (b) a ChallengeParticipation is Approved, (c) a PolicyAcknowledgement is marked Acknowledged. If the toggle is off, skip calling this function — admin can badge manually via a separate `POST /api/admin/gamification/badges/award` endpoint instead. |

`badge.service.js` logic:
```
function checkAndAwardBadges(employeeId):
  employee = load employee
  for each badge in Badge collection:
    if employee already has this badge → skip
    switch badge.unlockRule.type:
      'xp'         → if employee.xp >= badge.unlockRule.min → award
      'challenges' → if count(Approved ChallengeParticipation for employee) >= min → award
      'csr'        → if count(Approved EmployeeParticipation for employee) >= min → award
      'policies'   → if count(Acknowledged PolicyAcknowledgement for employee) >= min → award
```
You'll need an `EmployeeBadge` join collection (`employee`, `badge`, `awardedDate`) to track who has what — add this to your models list.

---

## 10. API endpoints — full list by portal

### 10.1 Admin — `/api/admin/*` — NO auth middleware on any of these

**Departments** (`/api/admin/departments`)
- `GET /` — list all
- `POST /` — create `{ name, code, head, parentDepartment, employeeCount, password }` (hash password before save)
- `PUT /:id` — edit
- `DELETE /:id` — remove

**Categories** (`/api/admin/categories`) — same CRUD pattern

**Environmental** (`/api/admin/environmental`)
- `GET /emission-factors` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /goals` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /carbon-transactions` — view all departments' submissions (read-only here, departments submit via their own portal)
- `GET /product-profiles` / `POST` / `PUT /:id` / `DELETE /:id`

**Social** (`/api/admin/social`)
- `GET /csr-activities` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /participation` — approval queue (all Pending shown first)
- `PATCH /participation/:id/approve` — enforces evidence-required rule, sets pointsEarned, triggers badge check
- `PATCH /participation/:id/reject`
- `GET /diversity` — returns diversity metrics (you'll need a simple aggregate or a manually-maintained `DiversityMetric` collection — the source images don't show where this data originates, so add a small admin-editable collection: `{ label, value, target }`)

**Governance** (`/api/admin/governance`)
- `GET /policies` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /acknowledgements` — view status across all employees
- `GET /audits` / `POST` / `PUT /:id`
- `GET /compliance-issues` / `POST` (must include owner + dueDate — reject if missing) / `PATCH /:id/resolve`

**Gamification** (`/api/admin/gamification`)
- `GET /challenges` / `POST` / `PUT /:id` (status transitions Draft→Active→Under Review→Completed, or →Archived anytime)
- `GET /challenge-participation` — approval queue
- `PATCH /challenge-participation/:id/approve` — enforces evidence rule, sets xpAwarded, triggers badge check
- `PATCH /challenge-participation/:id/reject`
- `GET /badges` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /rewards` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /leaderboard` — sorted employees/departments by XP

**Reports** (`/api/admin/reports`)
- `GET /environmental`, `GET /social`, `GET /governance`, `GET /esg-summary`
- `POST /custom` — body takes `{ department, dateRange, module, employee, challenge, esgCategory }`, returns filtered dataset
- `GET /custom/export?format=pdf|excel|csv` — generate and stream file

**Settings** (`/api/admin/settings`)
- `GET /config` / `PUT /config` — updates weights + toggles (single ESGConfig doc)
- `GET /notifications` / `PUT /notifications`

**Dashboard** (`/api/admin/dashboard`)
- `GET /overview` — calls `scoring.service.js`, returns overall score, all department scores/rankings, recent activity feed

### 10.2 Department portal — `/api/department/*` — `authDepartment` middleware applied

- `POST /auth/login` (no middleware — this IS the login endpoint)
- `GET /dashboard` — returns: this department's E/S/G/Total scores, rank among all departments, list of employees with their individual Social scores
- `GET /carbon-transactions` — this department's own submissions only
- `POST /carbon-transactions` — body `{ emissionFactor, quantity, sourceDescription }` — `department` field auto-filled from `req.department.id`, never trust a department-supplied department ID
- `GET /goals` — this department's Environmental Goals and progress

### 10.3 Employee portal — `/api/employee/*` — `authEmployee` middleware applied

- `POST /auth/login` (no middleware)
- `GET /dashboard` — XP, badges earned, current leaderboard rank
- `GET /csr-activities` — list open activities
- `POST /csr-activities/:id/join` — creates EmployeeParticipation with `employee = req.employee.id`
- `POST /participation/:id/upload-proof` — multer upload, sets `proofFileUrl`
- `GET /challenges` — list Active challenges
- `POST /challenges/:id/join` — creates ChallengeParticipation
- `PATCH /challenge-participation/:id/progress` — employee updates their own progress %
- `POST /challenge-participation/:id/upload-proof`
- `GET /policies` — list applicable policies + this employee's ack status
- `POST /policies/:id/acknowledge`
- `GET /rewards` — catalog with current XP shown
- `POST /rewards/:id/redeem` — server checks `xp >= pointsRequired && stock > 0` atomically (use a MongoDB transaction or `findOneAndUpdate` with a `stock: {$gt: 0}` filter to avoid race conditions), deducts stock, records the redemption (add a `RewardRedemption` collection: `{employee, reward, pointsSpent, date}`)

**Every route above that reads/writes "this employee's" or "this department's" data must pull the ID from the verified JWT (`req.employee.id` / `req.department.id`) — never from a request body or URL param the client could tamper with.**

---

## 11. File uploads (proof)

`middleware/upload.js`:
```js
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});
module.exports = upload;
```
Use `upload.single('proof')` on the upload-proof routes. Serve uploaded files statically: `app.use('/uploads', express.static(process.env.UPLOAD_DIR))` — but note this makes proof files publicly readable by URL; if that's a concern, add an admin-only auth check on file access instead of static serving.

---

## 12. Build order (do it in this sequence, don't jump ahead)

1. Docker Compose up, confirm Mongo connects via a throwaway script (`mongoose.connect(...)`, log "connected")
2. Scaffold Express app, `server.js`, health check route `GET /api/health`
3. Build every Mongoose model from Section 6, one file each
4. Build Department + Employee auth (login, JWT sign, middleware) — test with Postman before building anything else
5. Build Admin CRUD routes for all master data (Departments, Categories, Emission Factors, Policies, Badges, Rewards) — no auth, straightforward CRUD
6. Build Department portal: carbon transaction submission
7. Build Employee portal: CSR join + challenge join + proof upload
8. Build Admin approval queues (participation approve/reject) — wire in the evidence-required toggle check here
9. Build `scoring.service.js` and wire it into Admin dashboard, Department dashboard
10. Build `badge.service.js`, wire into the three approval points listed in Section 9
11. Build Rewards redemption with the atomic stock check
12. Build Reports endpoints (start with the 4 fixed reports, custom builder last)
13. Build Settings endpoints (config + toggles)
14. Add notification records (simplest version: just a `Notification` collection with `{ recipientType, recipientId, message, read, createdAt }` — populate it at the same points badges/approvals/overdue checks happen; you can skip actual email sending for v1)
15. Add a daily cron job (use `node-cron`) that scans `ComplianceIssue` for `status: 'Open'` and `dueDate < now`, and creates a Notification for each newly-overdue one

---

## 13. Quick sanity checklist before you call it done

- [ ] Admin routes work with zero auth headers
- [ ] Department/Employee routes return 401 with no token, 403 with wrong-role token
- [ ] Submitting a Carbon Transaction with a bad `emissionFactor` id fails cleanly, not a 500
- [ ] Approving participation without proof fails when `evidenceRequiredForCSR` is on, succeeds when off
- [ ] Redeeming a reward twice in quick succession never oversells stock (test with two simultaneous requests)
- [ ] Changing ESGConfig weights changes the scores returned by `/dashboard` immediately, no restart needed
- [ ] A Compliance Issue cannot be created without `owner` and `dueDate`
- [ ] Badge auto-award actually fires the moment an employee crosses an unlock threshold, not just on next login
