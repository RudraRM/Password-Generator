import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "Keyform — Good passwords. Zero guesswork.",
    template: "%s | Keyform",
  },
  description:
    "Create strong, cryptographically random passwords entirely in your browser. Free, private, customizable. No account or password storage.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header />
          <div className="site-content">{children}</div>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
