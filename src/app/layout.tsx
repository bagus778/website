import type { Metadata } from "next";
import { Varela } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { MinecraftUserProvider } from "@/contexts/MinecraftUserContext";
import SetupGuard from "@/components/SetupGuard";

const vt323 = Varela({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-minecraft",
});

export const metadata: Metadata = {
  title: "Moonchunk Store",
  description: "Sell in minecraft the right way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${vt323.variable} antialiased font-minecraft`}
        style={{ fontFamily: 'var(--font-minecraft), monospace' }}
      >
        <SetupGuard>
          <MinecraftUserProvider>
            <CartProvider>{children}</CartProvider>
          </MinecraftUserProvider>
        </SetupGuard>
      </body>
    </html>
  );
}