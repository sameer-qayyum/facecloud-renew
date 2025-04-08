'use client';

import { Theme } from "../../components/theme";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Theme>{children}</Theme>;
}
