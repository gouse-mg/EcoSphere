# EcoSphere: ESG Management Platform

This document serves as the comprehensive guide for the EcoSphere platform, covering execution instructions, project architecture, system requirements, and database schemas.

---

## 1. Quick Start & Execution Guide

The project consists of a Node/Express/MongoDB API backend and a vanilla HTML/CSS/JS frontend with three dashboards: **Admin**, **Department**, and **Employee**.

### 1.1 Project Structure
*   `ecosphere-backend/`: Node/Express/MongoDB API.
*   `frontend/`: Vanilla HTML/CSS/JS frontend.
*   `frontend/index.html`: Landing page, links to all 3 portals.
*   `frontend/admin/`: Admin Console (no login).
*   `frontend/department/`: Department Portal (JWT login).
*   `frontend/employee/`: Employee Portal (JWT login).
*   `frontend/assets/`: Shared style.css + api.js (fetch helper).

### 1.2 Running the Backend
Ensure Docker is running on your machine, then execute the following commands to spin up the database and backend server:

1. `cd ecosphere-backend`
2. `cp .env.example .env` (edit values if needed)
3. `docker compose up -d` (starts MongoDB)
4. `npm install`
5. `npm run dev` (or: `npm start`)

The API will listen on `http://localhost:5000` (from `.env` `PORT`).

### 1.3 Running the Frontend
The frontend is static HTML/CSS/JS and requires no build step. It communicates with the backend at `http://<same-hostname-you-open-the-page-on>:5000/api`.

From the `frontend` folder, run a simple local server:
1. `cd frontend`
2. `python3 -m http.server 8080`

Open `http://localhost:8080` in your browser. Opening the HTML files directly via `file://` also works if the backend is running locally on port 5000.

### 1.4 Logging In
*   **Admin**: No login required. Open `admin/index.html` directly to access the open `/api/admin/*` routes.
*   **Department**: Log in with a department's `code` and `password`. Create a department from the Admin Console → Departments → **+ New Department**.
*   **Employee**: Log in with an employee's `email` and `password`. Create new employee from the Admin Console → Employee → **+ New Employee**.
---

## 2. Project Overview & Modules

EcoSphere is an ESG (Environmental, Social, and Governance) management platform that integrates sustainability into everyday ERP operations.

### Objectives
*   Measure and reduce environmental impact[cite: 2].
*   Promote employee participation in CSR initiatives[cite: 2].
*   Track governance policies, audits, and compliance[cite: 2].
*   Provide real-time ESG dashboards and reports[cite: 2].
*   Encourage sustainability through gamification[cite: 2].

### Platform Modules
*   **Environmental**: Focuses on carbon accounting, emission factor management, sustainability goals, and tracking department-wise emissions (e.g., from utility bills or fleet management)[cite: 2]. 
    *   *Calculation:* Carbon Emission = Activity Quantity * Emission Factor[cite: 2].
*   **Social**: Fosters community via CSR activity management, tracking volunteer hours, and monitoring diversity metrics[cite: 2].
*   **Governance**: Ensures compliance through ESG policy management, policy acknowledgements, and internal audit tracking[cite: 2].
*   **Gamification**: Incentivizes behavior using sustainability challenges, an XP system, badges, and leaderboards[cite: 2].

### Business Workflow
```text
Master Configuration (Departments, Factors, Goals)
        ▼
Daily ERP Operations (Purchases, Fleet, Manufacturing)
        ▼
Carbon Transactions & Employee Engagement (CSR, Policies, Audits)
        ▼
Department ESG Scores
        ▼
Management Dashboard & Analytics
