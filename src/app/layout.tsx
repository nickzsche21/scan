import type { Metadata } from "next";
import "./globals.css";

const title = "SCAN — watch a reduce actually happen";
const description =
  "A scan is a fold that shows its work. Step through any reduce and see the accumulator change — and change type — one element at a time.";

export const metadata: Metadata = {
  title, description,
  keywords: ["reduce", "fold", "scan", "javascript", "accumulator", "functional programming"],
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
