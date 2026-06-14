# Implementation Plan - Dynamic Portfolio Administration System

## Goal & System Summary
We are building a data-driven, AI-integrated portfolio management system that transitions a static JSON portfolio website into a telemetry-rich, relational-backed web application. 
Key elements of the system include:
1. **Relational Database**: Storing multiple resume profiles, skills, experiences, and analytics logs in PostgreSQL.
2. **Secure Administration**: An authenticated admin dashboard with OAuth (GitHub, Google, Magic Link) secured by an email claiming whitelist (`ADMIN_EMAIL`), and EF Core audit logs of all changes.
3. **AI Chatbot & RAG Analyzer**: A client-side chatbot and server-side parser scoring candidate profiles against uploaded job descriptions.
4. **Traffic Attribution**: Geolocation-aware logging of page views and outbound link clicks matching session UTM referral parameters.
5. **Quality Gatekeeping**: Fully automated test suites executing on every pull request, integrated with GitHub Actions and Render's deployment status checks (Option A: Auto-deploying after checks pass).

This plan is ordered specifically to establish the databases, testing frameworks, and GitHub Actions pipelines first, ensuring that all subsequent logic, endpoints, and UI elements are checked in, tested, and visualized on GitHub.

---

## Proposed Changes

### Phase 1: Database and Relational Migrations
* **Goal**: Establish the relational model and apply tables to the PostgreSQL database.
* **Actions**:
  1. Generate EF Core migrations in `src/Portfolio.Infrastructure`.
  2. Implement tables:
     * `ResumeProfile`: Holds name, title, intro text, and stock photo URLs with `UQ_ActiveResumeProfile` (partial index enforcing single active version).
     * `ResumeProfileLinkType` & `ResumeProfileLink`: Connects profiles to urls with unique constraints.
     * `SkillCategory` & `Skill`: Order-indexable technologies hierarchy.
     * `WorkExperience`, `ExperienceHighlight`, & `WorkExperienceSkill`: Junction tables linking experiences to applied skills.
     * `LinkClickLog` & `PageViewLog`: Captures IP address, user agent, referrer source, and geolocations.
     * `AuditLog`: Admin change audit logs storing action names, timestamps, actor emails, and JSON changes diffs.
  3. Apply migration to local development PostgreSQL database.

---

### Phase 2: Backend CI/CD & Testing Infrastructure
* **Goal**: Define the CI pipeline and set up the C# testing suite so backend validation checks run on every push.
* **Actions**:
  1. **GitHub Actions CI/CD (`.github/workflows/ci.yml`)**:
     * Create the workflow file.
     * Define the `backend-tests` job running on ubuntu-latest.
     * Configure steps: checkout, dotnet setup, docker daemon initialization (required for Testcontainers).
  2. **xUnit Test Project (`tests/Portfolio.Tests`)**:
     * Create the project referencing `Portfolio.Api` and `Portfolio.Infrastructure`.
     * Add dependencies: `xunit`, `NSubstitute` (mocking), `Shouldly` (assertions), `Microsoft.AspNetCore.Mvc.Testing` (web factory), `Testcontainers.PostgreSql` (integration testing).
  3. **Verification**: Push to GitHub and verify that the `backend-tests` status check compiles and executes in Actions.

---

### Phase 3: Backend Endpoints & Services
* **Goal**: Implement business logic, API routing, authentication claims, and auditing.
* **Actions**:
  1. **Authentication claims**:
     * Local development: configure `MockAuthHandler` middleware to bypass authentication when `LOCAL_DEV_BYPASS_AUTH` is active.
     * Production: configure JWT validator validating Supabase auth tokens and verifying email claims against `ADMIN_EMAIL`.
  2. **EF Core Auditing Filter**:
     * Write DbContext interceptor checking database state changes and logging actor emails + field diffs to `AuditLog`.
  3. **Resume Controller (`GET /api/resume`, `GET /api/resume/active`, `POST /api/resume/{id}/activate`)**:
     * Write endpoints to query profiles and toggle active status.
  4. **Analytics Controller (`POST /api/analytics/clicks`, `POST /api/analytics/views`, `GET /api/analytics/summary`)**:
     * Save telemetry records matching referrer session parameters and output unique/total counts.
  5. **Unit & Integration Tests**:
     * Write tests asserting database constraints (single active profile) and analytics logging.
     * Verify that tests pass locally and run cleanly in the GitHub Actions runner.

---

### Phase 4: Frontend CI/CD & Testing Infrastructure
* **Goal**: Incorporate frontend validation checks (Jest unit tests + Playwright E2E browser tests) into the CI pipeline.
* **Actions**:
  1. **GitHub Actions Update**:
     * Add the `frontend-tests` and `playwright-e2e` jobs in `.github/workflows/ci.yml`.
     * Configure steps: checkout, setup Node, npm install, cache configuration.
  2. **Jest & React Testing Library (`apps/web`)**:
     * Install dependencies and create `apps/web/jest.config.js` and test scripts in `package.json`.
  3. **Playwright E2E Configuration (`apps/web`)**:
     * Initialize `@playwright/test` configurations.
  4. **Verification**: Push changes to GitHub and confirm all three status checks (`backend-tests`, `frontend-tests`, `playwright-e2e`) run and pass on Actions.

---

### Phase 5: Frontend Components & Pages
* **Goal**: Construct components, hooks, chatbot layouts, dashboard tools, and deployment statuses.
* **Actions**:
  1. **Theme-Aware Profile Photos**:
     * Implement `ResumeHeaderPhoto` using dual light/dark image URLs and opacity cross-fades without layout shifts.
  2. **Traffic Tracker Hook (`useTrafficTracker`)**:
     * Capture query parameter `?ref=` and save to `sessionStorage`. Track outbound anchor clicks and POST to the analytics API.
  3. **Job Fit Analyzer Component**:
     * Add PDF file parsing proxy on Next.js, scoring active resumes against job text using Gemini or Ollama models.
     * Render contextual Lucide CTA buttons (Mail, LinkedIn, Download) depending on scoring thresholds.
  4. **Admin Image Syncer & Global Footer Status Bar**:
     * Build profile dashboard forms supporting GitHub picture extraction and Supabase session avatar pulling.
     * Build global `Footer` component containing public GitHub/Render status capsules and a subtle lock redirect icon.
  5. **Frontend Unit & E2E Specs**:
     * Write unit tests for the theme-aware header and E2E specs for the interactive skills collapsible and UTM tracking.
  6. **Deployment Pipeline & Rules**:
     * Set up branch protection rules on main requiring status checks to pass.
     * Configure Render Dashboard setting to **"Auto Deploy: Yes"** and **"After CI Checks Pass"**.
     * Append the `deploy-render` job to the CI workflow to register deployment status directly to GitHub Environments on commit pushes.

---

## Verification Plan

### Automated Tests
* Run C# backend tests:
  ```bash
  dotnet test tests/Portfolio.Tests/Portfolio.Tests.csproj
  ```
* Run frontend unit tests:
  ```bash
  cd apps/web && npm run test
  ```
* Run frontend E2E specs:
  ```bash
  cd apps/web && npx playwright install --with-deps && npm run test:e2e
  ```

### Manual Verification
* Navigate to the Admin Dashboard, toggle resume profiles, and verify that the active flag is shifted and audited in `AuditLog`.
* Land on the site with `?ref=ig_story`, click outbound social links, and verify that the `LinkClickLog` entry attributes the click to the referrer.
* Swap themes and confirm profile photos cross-fade.
* Verify the environments/deployments sidebar on the GitHub repository page successfully updates to success when the CI passes and Render compiles.
