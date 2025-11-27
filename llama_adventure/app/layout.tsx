import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "./providers/QueryProvider";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
});

export const metadata: Metadata = {
  title: "Llama Hackaton Adventure - Fixed Edition",
  description: "Un juego de plataformas de estilo pixel-art retro",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={pressStart2P.variable}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
