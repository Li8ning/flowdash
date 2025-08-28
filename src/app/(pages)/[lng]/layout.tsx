import type { Metadata } from "next";
import { languages } from "../../i18n/settings";
import "../../globals.css";

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export const metadata: Metadata = {
  title: "Flowdash",
  description: "Sanitaryware Inventory Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
