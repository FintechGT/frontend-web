"use client";

import { useEffect } from "react";

/** Tipos mínimos para Google One Tap (GSI) */
type GoogleCredentialResponse = {
  clientId: string;
  credential: string;           // <-- el ID token
  select_by: string;
};

type Gsi = {
  accounts: {
    id: {
      initialize: (opts: {
        client_id: string | undefined;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement | null,
        opts: {
          theme?: "outline" | "filled" | "filled_black" | "standard";
          size?: "large" | "medium" | "small";
          shape?: "rectangular" | "pill" | "circle" | "square";
          width?: number | string;
          text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          logo_alignment?: "left" | "center";
        }
      ) => void;
      prompt: (listener?: (res: unknown) => void) => void;
    };
  };
};

declare global {
  interface Window {
    google?: Gsi;
  }
}

type Props = {
  onSuccess?: (token: string) => void;
  onError?: (err: unknown) => void;
};

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  useEffect(() => {
    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    ensureScript().then(() => {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (resp) => {
          try {
            const idToken = resp.credential;
            if (!idToken) throw new Error("Sin token de Google");
            onSuccess?.(idToken);
          } catch (e) {
            onError?.(e);
          }
        },
      });

      window.google?.accounts.id.renderButton(
        document.getElementById("gsi-btn"),
        { theme: "outline", size: "large", shape: "pill", width: 320 }
      );
    });
  }, [onSuccess, onError]);

  return <div id="gsi-btn" className="w-full flex justify-center" />;
}
