# Portfolio Web Frontend

This is the frontend application for the Portfolio project, built with [Next.js](https://nextjs.org/) and styled with custom CSS and modern UI components. It serves as the public-facing portfolio website as well as the authenticated admin dashboard.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Custom CSS / Modules
- **Testing:**
  - Unit/Component Tests: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
  - End-to-End Tests: [Playwright](https://playwright.dev/)

## Getting Started

1. Ensure you have the backend `.NET` API running locally on `http://localhost:5000` (or as configured in your `.env.local` file).
2. Install dependencies using `pnpm`:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev`: Starts the Next.js development server.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Runs ESLint to catch code quality issues.
- `pnpm test`: Runs the Jest unit and component tests.
- `pnpm test:e2e`: Runs the Playwright end-to-end tests.

## Environment Variables

To run the application locally with full functionality, create a `.env.local` file in the root of `apps/web` with the necessary configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Add other required environment variables here
```

## Deployment

This application is configured for seamless deployment on [Vercel](https://vercel.com/). Merging code to the `main` branch automatically triggers a production build via the native Vercel GitHub integration. Ensure your environment variables are properly configured in your Vercel project settings.
