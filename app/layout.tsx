import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import ThemeRegistry from "./theme/registry";
import SessionProvider from "@/components/providers/session-provider";

export const metadata = {
  title: "FaceCloud - Cosmetic Clinic Management",
  description: "Specialized management solution for cosmetic clinics",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-background text-foreground" style={{ background: '#fff' }}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeRegistry>
              {children}
            </ThemeRegistry>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
