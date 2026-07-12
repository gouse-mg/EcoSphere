# System Requirements

To run the Ecosphere platform locally or in a production environment, ensure your system meets the following prerequisites[cite: 1].

## Core Prerequisites
*   **Node.js**: The backend is built on Node.js. Ensure a recent LTS version (v16+ or v18+) is installed[cite: 1].
*   **MongoDB**: A running MongoDB instance is required (local or MongoDB Atlas)[cite: 1].
*   **Docker & Docker Compose**: Used for containerized deployment and running local database instances[cite: 1].
*   **Web Browser**: Any modern web browser to access the frontend interfaces[cite: 1].

## Backend Dependencies
The Node.js backend utilizes the following core packages (defined in `package.json`)[cite: 1]:
*   **Express.js**: For routing and handling HTTP requests[cite: 1].
*   **Mongoose**: For MongoDB object modeling and schema validation[cite: 1].
*   **Dotenv**: For managing environment variables (see `.env.example`)[cite: 1].
*   **Multer / Upload Middleware**: For handling file uploads (configured in `src/middleware/upload.js`)[cite: 1].
*   **Authentication Libraries**: JSON Web Tokens (JWT) and bcrypt for handling authentication in `authEmployee.js` and `authDepartment.js`[cite: 1].

## Environment Variables
Create a `.env` file in the `ecosphere-backend` directory based on the provided `.env.example`. Required keys typically include[cite: 1]:
*   `PORT` (e.g., 3000)
*   `MONGO_URI`
*   `JWT_SECRET`