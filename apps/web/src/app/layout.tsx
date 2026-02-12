import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "../index.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { Providers } from "@/components/providers";
import { Header } from "@/features/nav/header";
import { ourFileRouter } from "./api/uploadthing/core";

async function UploadThingSSR() {
  await connection();
  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Help Desk",
  description: "Help Desk - Track your projects effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground selection:bg-primary/50 selection:text-primary-foreground flex h-dvh flex-col overflow-hidden antialiased`}
      >
        <NuqsAdapter>
          <Providers>
            <Suspense>
              <UploadThingSSR />
            </Suspense>
            <Header />
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
