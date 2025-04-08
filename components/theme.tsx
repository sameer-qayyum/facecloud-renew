'use client';

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { dmSans } from "../app/theme/theme";
import ThemeRegistry from "../app/theme/registry";
import { ReactNode } from "react";

export function Theme({ children }: { children: ReactNode }) {
  return (
    <ThemeRegistry>
      <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className={dmSans.className}>
          {children}
        </div>
      </NextThemeProvider>
    </ThemeRegistry>
  );
}
