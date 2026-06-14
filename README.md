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
```bash
cp .env.template .env
```

Review and adjust the AI provider (`Ollama` or `Gemini`), Database, and Supabase keys as needed.

3. Run the following command from the root of the project to build and start the containers:

`docker-compose up -d`

4. Once the containers are running, you can access the portfolio website at [http://localhost:3000](http://localhost:3000) and the API at http://localhost:5000.

### Tech Stack

This project is built with the following technologies:

**Frontend (apps/web):**
* **Framework:** Next.js 16 (App Router with React 19)
* **Language:** TypeScript
* **Styling & Icons:** Tailwind CSS v4, Lucide React
* **Animations:** Framer Motion
* **Authentication:** Supabase Auth & SSR client
* **Testing:** Jest, React Testing Library, and Playwright (E2E)

**Backend (apps/api):**
* **Framework:** .NET 10 Web API
* **Language:** C#
* **Database:** PostgreSQL with EF Core
* **AI Integration:** Drop-in `IAiChatService` architecture supporting both local **Ollama** and cloud **Google Gemini**.
* **Real-time Streaming:** Server-Sent Events (SSE) implemented via raw `HttpClient` chunk parsing.
* **Analytics & GDPR:** Custom data migrations that scrub PII (hashing IPs) into secure `VisitorSessionId` tokens for Page Views, Link Clicks, and AI Queries.
* **Security:** `Microsoft.AspNetCore.RateLimiting` sliding window policies to prevent API abuse.
* **PDF Compilation:** QuestPDF (ATS-compliant layouts)
* **Cloud Storage:** S3-compatible object storage via AWS SDK
* **API Documentation:** OpenAPI / Swagger

**DevOps & Automation:**
* **Containerization:** Docker, Docker Compose
* **CI/CD:** GitHub Actions running lint, backend tests, and frontend Unit/E2E suites.
* **Code Review:** Automated AI PR Reviewer via Google Gemini API in GitHub Actions.
* **Hosting:** Configured for automated continuous deployment to Render.

### About This Project

This project serves as a practical demonstration of my skills and experience as a software developer. It is a fully dynamic, full-stack application that handles content management via a live database instead of local static files. 

Key features include:
1. **Interactive Bash Terminal CLI**: A retro-themed interactive CLI shell on the homepage supporting commands like `ls`, `cat [dir]`, `open blog/[slug]`, and `clear`.
2. **Dynamic PDF Resumes**: An integrated PDF compiler using QuestPDF that generates a professional, ATS-friendly PDF download in real-time.
3. **Resume AI Chatbot (RAG)**: A highly defensive AI Assistant that dynamically pulls the active Resume Profile from the database and injects it into a strict system prompt. 
    - Supports hot-swapping between **Ollama** (e.g. `gemma4:e2b` for local testing) and **Google Gemini** in production.
    - Uses Server-Sent Events (SSE) to stream responses chunk-by-chunk to the frontend UI.
    - Locked down with IP-based rate limiting (5 requests per minute).
4. **GDPR-Compliant Analytics Tracker**: A robust analytics engine that tracks page views, link clicks, and AI queries. To protect user privacy, it uses custom SQL migrations to securely hash the user's IP Address and User Agent into an anonymous `VisitorSessionId`. 
5. **Supabase-Authenticated Admin Panel**: A secure management portal (`/admin`) to update experience logs, link profiles, view traffic analytics, upload media files directly to cloud storage, and view application audit trails.

All resume data, images, and posts are managed dynamically through our REST API rather than checked-in JSON or markdown files.

### Development Phases Completed

This project was built iteratively across several milestone phases:
- **Phase 1 (Setup & Architecture):** Established the containerized monorepo, .NET API with Entity Framework, Next.js frontend, and Supabase auth integration.
- **Phase 2 (Interactive Resumes & CLI):** Built the homepage bash terminal and integrated QuestPDF for on-the-fly, ATS-compliant PDF resume generation.
- **Phase 3 (GDPR Analytics & Webhooks):** Implemented strict privacy-first analytics using hashed IP/UA sessions (`VisitorSessionId`) for tracking traffic and clicks.
- **Phase 4 (AI Chatbot & Admin Panel):** Integrated the interactive RAG AI assistant (supporting Ollama and Gemini with SSE streaming) and built the authenticated Admin portal for data management.

### Render Continuous Deployment Configuration

To ensure zero-downtime deployments and that only fully tested builds reach production, configure your Render service settings as follows:
1. In your **Render Dashboard**, select your web service and go to **Settings**.
2. Set **Auto Deploy** to **No**.
3. Use the deployment webhook URL provided by Render in your GitHub Actions secrets as `RENDER_DEPLOY_HOOK_API` and `RENDER_DEPLOY_HOOK_WEB`.
4. In your GitHub Repository, set up a branch protection rule on `main` that requires all status checks (`Backend Test Suite (C# / .NET 10)`, `Frontend Build & Lint (Next.js)`, `Frontend Unit Tests (Jest / RTL)`, and `Frontend E2E Tests (Playwright)`) to pass before merging.
5. The `deploy-render` job in our CI/CD pipeline will automatically trigger the Render deployment webhook via `curl` once all tests pass on commits pushed to `main`.