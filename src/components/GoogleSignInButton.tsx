"use client";

import { useEffect } from "react";

declare global {
  interface Window { google: any }
}

type Props = {
  onSuccess?: (token: string) => void;
  onError?: (err: unknown) => void;
};

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  useEffect(() => {
    const ensure = () =>
      new Promise<void>((resolve) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    ensure().then(() => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (resp: any) => {
          try {
            const id_token = resp?.credential as string;
            if (!id_token) throw new Error("Sin token de Google");
            onSuccess?.(id_token);
          } catch (e) {
            onError?.(e);
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("gsi-btn"),
        { theme: "outline", size: "large", shape: "pill", width: 320 }
      );
    });
  }, [onSuccess, onError]);

  return <div id="gsi-btn" className="w-full flex justify-center" />;
}
