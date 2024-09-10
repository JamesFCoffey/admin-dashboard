import type { Metadata } from "next";
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "000000",
};

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "App includes dashboard, CRM, and Kanban board",
  openGraph: {
    images: [{ url: "https://refine.dev/img/refine_social.png" }],
  },
  twitter: {
    images: ["https://refine.dev/img/refine_social.png"],
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
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
