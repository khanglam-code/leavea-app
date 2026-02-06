import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ProjectProvider } from "@/components/project-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Agentation } from "agentation";

// IBM Plex Mono for code/monospace
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// IBM Plex Sans for body text (optional, pairs well with Mono)
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "neXus - Command Center",
  description: "The Operating System for Autonomous Engineering Teams",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "neXus",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#f59e0b",
};

/** AGT-152: Single unified dashboard — no sidebar, no header; root is full-width dashboard */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} font-mono antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <ConvexClientProvider>
            <ProjectProvider>
              <div className="flex h-screen flex-col">
                {children}
                <Agentation />
              </div>
              <Toaster />
            </ProjectProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
