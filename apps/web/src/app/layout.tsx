import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPortfolioData } from "@/lib/data";
import { FloatingAiWidget } from "@/components/FloatingAiWidget";

const inter = Inter({ subsets: ["latin"] });

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
          <Header 
            contact={data.resume.contact} 
            name={data.personalInfo.name} 
            downloadUrl={data.resume.downloadUrl} 
            photoUrlLight={data.resume.photoUrlLight}
            photoUrlDark={data.resume.photoUrlDark}
          />
          <main className="container mx-auto px-4 pt-4 pb-28 md:py-8 md:pb-24">{children}</main>
          <Footer />
          <FloatingAiWidget blogPosts={data.blogPosts} resume={data.resume} />
        </ThemeProvider>
      </body>
    </html>
  );
}
