Setup instructions
-------------------

You can run the application in two ways.
	1. With docker.
	2. with localhost.

for testing, set up locally. Playwright for end to end testing and jest for unit and integration testing are used. After setting locally, jump to testing section

1. With docker.
---------------

(Please make sure docker is installed and the docker engine is running. please keep the ports, 3000, 5000 and 6543 free because they will be required to run the frontend, backend and the DB respectively)

1.1. Clone the git repository with the given link
	1.1.1. open a folder with terminal.
	1.1.2. type "git clone https://github.com/NaveenSandaru/CoverageX.git" and press enter.
	1.1.3. Wait till the process is finished.

1.2. Open the projects root folder in a terminal.
1.3. type "docker compose up" and press enter.
1.4. Wait till the process is finished.
1.5. Open the browser and go to the URL: "http://localhost:3000".


2. With localhost.
------------------

(please make sure node.js is installed and please keep the ports, 3000 and 5000 free for the frontend and the backend)
(Please create a postreSQL database and get the connection string. Currently it is connected to a hosted neon postgreSQL database).

2.1. Clone the git repository with the given link
	1.1.1. open a folder with terminal.
	1.1.2. type "git clone https://github.com/NaveenSandaru/CoverageX.git" and press enter.
	1.1.3. Wait till the process is finished.

2.2. Go to the projects root folder/backend and open .env with your preferred IDE.
2.3. Replace the value of "DATABASE_URL" with your database connection string (e.g.: DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@localhost:<PORT>/<DATABASE_NAME>")
2.4. Go back to the root folder and open backend folder with a terminal
2.5. In the terminal type "npm install" and press enter.
2.6. Wait till the installation is finished.
2.7. After that type "npx prisma generate" and press enter.
2.8. After the generation is finished, type "npx prisma db push" and press enter.
2.9. Then, type "npm run dev" and press enter. The backend server will start. Keep the terminal alive.
2.10. Go back to the root folder and open frontend folder with a terminal.
2.11. type "npm install" and press enter.
2.12. wait till the installation is finished.
2.13. Type "npm run build" and press enter.
2.14. Wait till the project is built.
2.15. Type "npm start" and press enter.
2.16. Open the browser and go to the URL: "http://localhost:3000"

Testing
--------
Please setup the project locally.

1. open the backend with the terminal and type "npm test"
2. Unit and integration testing will execute and the result will be displayed in the terminal.
3. Go to the root folder and open the root folder with a terminal.
4. Type "npm install" and press enter.
5. Wait till the installation is done.
6. Type "npx install playwright" and press enter to install playwright.
7. Wait till the installation is done.
8. Type "npx playwright test end-to-end-test.spec.ts --project=chromium --headed" and press enter
