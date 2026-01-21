import "@/app/globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/context/CartContext";

export const metadata: Metadata = {
  title: "RoyaltyMeds - Prescription Platform",
  description: "Order prescriptions online with ease",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
