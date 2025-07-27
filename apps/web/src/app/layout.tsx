import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/Header";
import { promises as fs } from 'fs';
import path from 'path';

const inter = Inter({ subsets: ["latin"] });

async function getPortfolioData() {
  const file = await fs.readFile(path.join(process.cwd(), 'data/portfolio-data.json'), 'utf8');
  return JSON.parse(file);
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPortfolioData();
  return {
    title: `${data.personalInfo.name} | Portfolio`,
    description: data.personalInfo.intro,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getPortfolioData();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header contact={data.resume.contact} name={data.personalInfo.name} />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
