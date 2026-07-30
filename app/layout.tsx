import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "ESCAPE.HTML — An Interactive Digital Entity";
  const description =
    "You opened a website. Something else opened you. Enter a cinematic interactive WebGL experience and discover the identity hidden in your behavior.";

  return {
    metadataBase: new URL(origin),
    title,
    description,
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
      images: [
        {
          url: new URL("/og.png", origin).href,
          width: 1680,
          height: 945,
          alt: "ESCAPE.HTML digital entity opening through a fractured interface",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "ESCAPE.HTML",
      description: "You opened a website. Something else opened you.",
      images: [new URL("/og.png", origin).href],
    },
  };
}

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
