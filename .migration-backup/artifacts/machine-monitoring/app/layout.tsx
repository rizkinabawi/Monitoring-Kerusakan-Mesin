import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: {
    default: "Monitoring Kerusakan Mesin",
    template: "%s | Monitoring Kerusakan Mesin",
  },
  description:
    "Catat kerusakan mesin, tindakan maintenance, downtime, dan riwayat produksi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}