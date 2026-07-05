import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Алтын Орда, Уақыт Саяхаты — Golden Horde: A Journey Through Time",
  description:
    "An interactive time-based heritage map of the Golden Horde (Ulus Jochi) — its cities, routes, and stories across the centuries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
