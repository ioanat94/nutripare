"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

type Status = "loading" | "success" | "error";

type Messages = {
  verifying: string;
  verifyingDescription: string;
  verified: string;
  verifiedDescription: string;
  goToApp: string;
  linkInvalid: string;
  linkInvalidDescription: string;
  goToSignIn: string;
};

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] === "fi" ? "fi" : "en";
}

const EN_MESSAGES: Messages = {
  verifying: "Verifying…",
  verifyingDescription: "Just a moment while we confirm your email address.",
  verified: "Email verified",
  verifiedDescription: "Your email address has been confirmed. You're all set.",
  goToApp: "Go to app",
  linkInvalid: "Link invalid",
  linkInvalidDescription:
    "This verification link has expired or already been used. Sign in and request a new one from the verification screen.",
  goToSignIn: "Go to sign in",
};

const FI_MESSAGES: Messages = {
  verifying: "Vahvistetaan…",
  verifyingDescription: "Odota hetki, vahvistamme sähköpostiosoitettasi.",
  verified: "Sähköposti vahvistettu",
  verifiedDescription: "Sähköpostiosoitteesi on vahvistettu. Olet valmis.",
  goToApp: "Siirry sovellukseen",
  linkInvalid: "Linkki virheellinen",
  linkInvalidDescription:
    "Tämä vahvistuslinkki on vanhentunut tai se on jo käytetty. Kirjaudu sisään ja pyydä uutta vahvistusnäytöltä.",
  goToSignIn: "Siirry kirjautumiseen",
};

function ActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshEmailVerified } = useAuth();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const [status, setStatus] = useState<Status>(
    mode === "verifyEmail" && !!oobCode ? "loading" : "error",
  );
  const [msgs, setMsgs] = useState<Messages>(EN_MESSAGES);

  useEffect(() => {
    const locale = getLocaleFromCookie();
    setMsgs(locale === "fi" ? FI_MESSAGES : EN_MESSAGES);
  }, []);

  useEffect(() => {
    if (!oobCode || mode !== "verifyEmail") return;

    applyActionCode(auth, oobCode)
      .then(() => refreshEmailVerified())
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
    // After success, redirect to localized home
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, oobCode]);

  function handleGoToApp() {
    const locale = getLocaleFromCookie();
    router.push(`/${locale}/`);
  }

  function handleGoToSignIn() {
    const locale = getLocaleFromCookie();
    router.push(`/${locale}/login`);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto w-full max-w-sm">
        <Card className="gap-6 bg-transparent py-10">
          {status === "loading" && (
            <CardHeader className="px-10 text-center">
              <CardTitle className="text-xl font-bold">
                {msgs.verifying}
              </CardTitle>
              <CardDescription>{msgs.verifyingDescription}</CardDescription>
            </CardHeader>
          )}
          {status === "success" && (
            <>
              <CardHeader className="px-10 text-center">
                <CardTitle className="text-xl font-bold">
                  {msgs.verified}
                </CardTitle>
                <CardDescription>{msgs.verifiedDescription}</CardDescription>
              </CardHeader>
              <CardContent className="px-10">
                <Button className="w-full" onClick={handleGoToApp}>
                  {msgs.goToApp}
                </Button>
              </CardContent>
            </>
          )}
          {status === "error" && (
            <>
              <CardHeader className="px-10 text-center">
                <CardTitle className="text-xl font-bold">
                  {msgs.linkInvalid}
                </CardTitle>
                <CardDescription>{msgs.linkInvalidDescription}</CardDescription>
              </CardHeader>
              <CardContent className="px-10">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoToSignIn}
                >
                  {msgs.goToSignIn}
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <ActionContent />
    </Suspense>
  );
}
