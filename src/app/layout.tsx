import type { Metadata } from "next";
import { fraunces, plexSans, jetbrainsMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student360",
  description: "Visa consultancy case management prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${plexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
