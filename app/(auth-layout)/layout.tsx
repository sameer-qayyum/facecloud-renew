import Link from "next/link";
import DeployButton from "@/components/deploy-button";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuthClient from "@/components/header-auth-client";
import ClientLayout from "./client-layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold">
                <Link href={"/"}>FaceCloud Renew</Link>
                <div className="flex items-center gap-2">
                  <DeployButton />
                </div>
              </div>
              {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuthClient />}
            </div>
          </nav>
          <div className="flex flex-col gap-20 max-w-5xl p-5">
            {children}
          </div>

          <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
            <p>
              <a
                href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                target="_blank"
                className="font-bold hover:underline"
                rel="noreferrer"
              >
                A Better Way for Clinics to Operate
              </a>
            </p>
          </footer>
        </div>
      </div>
    </ClientLayout>
  );
}
