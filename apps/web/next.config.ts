import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Add the basePath for GitHub Pages deployment.
  // This is the name of the repository.
  basePath: isGithubActions ? "/portfolio" : "",
};

export default nextConfig;
