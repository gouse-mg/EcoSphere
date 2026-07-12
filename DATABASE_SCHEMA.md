# EcoSphere: Database Schema & Data Dictionary

## 1. Master Data Models
These models store the core configuration and structural data of the organization[cite: 1].

*   **Department:** Organizational hierarchy and ESG ownership (Fields: Name, Code, Head, Parent Department, Employee Count, Status)[cite: 1].
*   **Category:** Shared categorizations for Social and Gamification (Fields: Name, Type, Status)[cite: 1].
*   **Emission Factor:** Carbon values used for automated calculations[cite: 1].
*   **Product ESG Profile:** ESG data linked to specific products[cite: 1].
*   **Environmental Goal:** Corporate sustainability targets[cite: 1].
*   **ESG Policy:** Corporate governance policies requiring acknowledgement[cite: 1].
*   **Badge:** Employee achievements (Fields: Name, Description, Unlock Rule, Icon)[cite: 1].
*   **Reward:** Redeemable incentives (Fields: Name, Description, Points Required, Stock Status)[cite: 1].

## 2. Transactional Data Models
These models store the daily operational and employee activity data[cite: 1].

*   **Carbon Transaction:** Calculated emissions derived from ERP operations[cite: 1].
*   **CSR Activity:** Corporate social initiatives[cite: 1].
*   **Employee Participation:** Tracking CSR involvement (Fields: Employee, Activity, Proof, Approval Status, Points Earned, Completion Date)[cite: 1].
*   **Challenge:** Gamified sustainability tasks (Fields: Title, Category, Description, XP, Difficulty, Evidence Required, Deadline, Status)[cite: 1].
*   **Challenge Participation:** Employee progress on challenges (Fields: Challenge, Employee, Progress, Proof, Approval, XP Awarded)[cite: 1].
*   **Policy Acknowledgement:** Records of employee policy acceptance[cite: 1].
*   **Audit:** Governance audit records[cite: 1].
*   **Compliance Issue:** Governance violations (Fields: Audit, Severity, Description, Owner, Due Date, Status)[cite: 1].
*   **Department Score:** Aggregated ESG performance (Fields: Department, Environmental Score, Social Score, Governance Score, Total Score)[cite: 1].
