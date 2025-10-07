# CoverageX

A full-stack application built with **Next.js**, **Node.js (Express)**, **PostgreSQL**, and **Docker**.  
Includes **Jest** for unit/integration testing and **Playwright** for end-to-end (E2E) testing.

---

## Setup Instructions

You can run the application in two ways:
1. With Docker
2. With Localhost

For testing, set up locally first.  
Playwright is used for E2E testing and Jest is used for unit and integration testing.  
After setting up locally, jump to the **Testing** section.

---

## 1. With Docker

Please make sure Docker is installed and the Docker engine is running.  
Keep the ports **3000**, **5000**, and **6543** free because they will be required to run the frontend, backend, and database respectively.

### Steps

1. Clone the git repository with the given link  
   - Open a folder with terminal.  
   - Type:
     ```
     git clone https://github.com/NaveenSandaru/CoverageX.git
     ```
   - Wait till the process is finished.

2. Open the project’s root folder in a terminal.  
3. Type:
   ```
   docker compose up
   ```
   and press Enter.
4. Wait till the process is finished.  
5. Open the browser and go to:
   ```
   http://localhost:3000
   ```

---

## 2. With Localhost

Please make sure Node.js is installed.  
Keep the ports **3000** and **5000** free for the frontend and backend.  
Create a PostgreSQL database and get the connection string (currently it is connected to a hosted Neon PostgreSQL database).

### Steps

1. Clone the git repository with the given link  
   - Open a folder with terminal.  
   - Type:
     ```
     git clone https://github.com/NaveenSandaru/CoverageX.git
     ```
   - Wait till the process is finished.

2. Go to the project’s root folder and navigate to the backend folder:  
   ```
   cd CoverageX/backend
   ```

3. Open the `.env` file with your preferred IDE.  
   Replace the value of `DATABASE_URL` with your database connection string, e.g.:
   ```
   DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@localhost:<PORT>/<DATABASE_NAME>"
   ```

4. Install backend dependencies:  
   ```
   npm install
   ```

5. Generate Prisma client:  
   ```
   npx prisma generate
   ```

6. Push schema to your database:  
   ```
   npx prisma db push
   ```

7. Start the backend server:  
   ```
   npm run dev
   ```
   Keep this terminal running.

8. Open a new terminal and navigate to the frontend:  
   ```
   cd ../frontend
   ```

9. Install frontend dependencies:  
   ```
   npm install
   ```

10. Build the project:  
    ```
    npm run build
    ```

11. Start the frontend:  
    ```
    npm start
    ```

12. Open the browser and go to:  
    ```
    http://localhost:3000
    ```

---

## Testing

Please set up the project locally before running tests.

### 1. Unit and Integration Testing (Jest)

1. Open the backend in a terminal:
   ```
   cd backend
   ```
2. Run:
   ```
   npm test
   ```
3. Unit and integration testing will execute and the results will be displayed in the terminal.

---

### 2. End-to-End Testing (Playwright)

1. Go to the project root:
   ```
   cd ../
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Install Playwright:
   ```
   npx install playwright
   ```
4. Run the E2E test:
   ```
   npx playwright test end-to-end-test.spec.ts --project=chromium --headed
   ```

---

## Technologies Used

- **Frontend:** Next.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL, Prisma ORM  
- **Testing:** Jest, Playwright  
- **Containerization:** Docker, Docker Compose

---

## Author

**Naveen Samarawickrama**  
[GitHub Profile](https://github.com/NaveenSandaru)

---

