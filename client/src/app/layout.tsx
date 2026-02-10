import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ChatFlow",
  description: "Real-time chat app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${rubik.className} antialiased`}>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
