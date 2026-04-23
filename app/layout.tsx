import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "HolidaySaver 🏖️",
    template: "%s | HolidaySaver",
  },
  description: "Save together, holiday together. Track your group holiday fund with friends.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#ea580c" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pass the session to the client provider to avoid an extra round-trip
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
