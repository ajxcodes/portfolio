## Alvin Jorrel Pascual's Portfolio & Resume

This repository contains the source code for my personal portfolio and interactive resume, which you can view live at [ajx.codes](https://ajx.codes).

This project is a full-stack application built with a modern tech stack, showcasing my skills in both frontend and backend development. The frontend is a Next.js application, and the backend is a .NET API. The entire application is containerized with Docker for easy setup and deployment.

### Running Locally with Docker

You can run the entire application on your local machine using Docker and Docker Compose.

**Prerequisites:**
* Docker
* Docker Compose

**Instructions:**
1. Clone the repository to your local machine.
2. Create a `.env` file in the root of the project and add the following environment variables:

```env
ASPNETCORE_ENVIRONMENT=Development
DB_HOST=db
DB_NAME=portfolio
DB_USER=user
DB_PASSWORD=password
```

3. Run the following command from the root of the project to build and start the containers:

`docker-compose up -d`

4. Once the containers are running, you can access the portfolio website at [http://localhost:3000](http://localhost:3000) and the API at http://localhost:5000.

### Tech Stack

This project is built with the following technologies:

**Frontend (apps/web):**
* **Framework:** Next.js (with React)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion

**Backend (apps/api):**
* **Framework:** .NET 9
* **Language:** C#
* **Database:** PostgreSQL
* **API:** RESTful API with Swagger/OpenAPI documentation

**DevOps:**
* **Containerization:** Docker, Docker Compose
* **CI/CD & Hosting:** Configured for deployment on Render.

### About This Project

This project serves as a practical demonstration of my skills and experience as a software developer. It's a living document that I update with my latest projects and professional experience.

The frontend is a server-side rendered (SSR) application built with Next.js, allowing for dynamic, up-to-date content on every request. The interactive resume allows users to filter my work experience by skills, providing a more engaging and informative experience than a traditional PDF resume.

The backend is a .NET API that serves all portfolio and blog data from a PostgreSQL database. This demonstrates my ability to build and containerize a full-stack application.