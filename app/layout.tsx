import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESCAPE.HTML — An Interactive Digital Entity",
  description:
    "You opened a website. Something else opened you. A cinematic interactive WebGL experience.",
  keywords: [
    "interactive cinema",
    "WebGL",
    "digital art",
    "experimental web",
    "ESCAPE.HTML",
  ],
  openGraph: {
    title: "ESCAPE.HTML",
    description: "You opened a website. Something else opened you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
