# Technical Implementation

The Ecosphere project is built as a monolithic application with a decoupled frontend and backend, utilizing the **MEN (MongoDB, Express, Node.js)** stack with a Vanilla JS/HTML/CSS frontend[cite: 1].

## 1. Architecture Overview
The solution follows the **MVC (Model-View-Controller)** design pattern[cite: 1]:
*   **Backend (`ecosphere-backend/`)**: Serves as a RESTful API.
*   **Frontend (`frontend/`)**: Consists of static HTML, CSS, and JS files communicating with the backend via API calls (`frontend/assets/api.js`)[cite: 1].

## 2. Backend Structure
The backend is highly modular, separating concerns into distinct directories[cite: 1]:
*   **Controllers (`src/controllers/`)**: Contains the business logic, separated by user roles (`admin/`, `employee/`, `department/`)[cite: 1]. It utilizes a `crudFactory.js` to DRY (Don't Repeat Yourself) up standard CRUD operations across models[cite: 1].
*   **Routes (`src/routes/`)**: Maps HTTP endpoints to specific controllers. Route files are indexed via `admin.index.js`, `employee.index.js`, and `department.index.js` for clean registration in `server.js`[cite: 1].
*   **Middlewares (`src/middleware/`)**: Handles request interception. Includes `authDepartment.js` and `authEmployee.js` for role-based access control, `upload.js` for multipart file data, and `errorHandler.js` / `asyncHandler.js` for robust error management[cite: 1].
*   **Services (`src/services/`)**: Contains reusable, complex business logic that spans multiple controllers, such as `badge.service.js`, `notification.service.js`, and `scoring.service.js`[cite: 1].
*   **Jobs (`src/jobs/`)**: Contains automated background tasks, such as `overdueComplianceCheck.js`, which likely runs on a cron schedule to flag missed ESG targets[cite: 1].

## 3. Frontend Structure
The frontend provides three distinct user portals, strictly separated by access level[cite: 1]:
*   **Admin Portal (`frontend/admin/`)**: Dashboard for overall ESG tracking, governance configuration, and employee management[cite: 1].
*   **Department Portal (`frontend/department/`)**: Interface for department heads to log carbon transactions and view department-specific dashboards[cite: 1].
*   **Employee Portal (`frontend/employee/`)**: Interface for staff to log in, view their CSR participation, participate in challenges, and redeem gamification rewards[cite: 1].
*   **Shared Assets (`frontend/assets/`)**: Contains global styling (`style.css`) and a centralized API wrapper (`api.js`) to handle backend communication uniformly[cite: 1].

## 4. Key Features Implemented
*   **Role-Based Access Control (RBAC)**: Strict segregation between Admin, Department, and Employee actions enforced via JWT middleware[cite: 1].
*   **Gamification Engine**: Utilizing the `scoring.service.js` and `badge.service.js`, employees earn points for CSR activities and challenges, which can be exchanged using the Rewards system[cite: 1].
*   **Containerization**: The system is fully dockerized. Running `docker-compose up` using the included `docker-compose.yml` spins up the application and its database environment automatically[cite: 1].