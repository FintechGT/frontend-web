"use client";

import * as React from "react";


type GoogleCredentialResponse = { credential: string };

type GoogleIdApi = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: string | number;
    }
  ): void;
  prompt?(callback?: () => void): void;
};

type GoogleApi = {
  accounts: { id: GoogleIdApi };
};

declare global {
  interface Window {
    google?: GoogleApi;
  }
}

type Props = {
  onSuccess: (id_token: string) => void;
  onError?: (err: unknown) => void;
  text?: "signin_with" | "continue_with" | "signup_with";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
};

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = "signin_with",
  theme = "filled_blue",
  size = "large",
}: Props) {
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const SCRIPT_ID = "google-identity-services";
    const initialize = () => {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) onSuccess(response.credential);
          else onError?.(new Error("Sin credencial de Google"));
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        type: "standard",
        theme,
        size,
        text,
        shape: "pill",
      });
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = initialize;
      s.onerror = () => onError?.(new Error("No se pudo cargar Google SDK"));
      document.head.appendChild(s);
    } else {
      initialize();
    }
  }, [onSuccess, onError, text, theme, size]);

  return <div ref={divRef} />;
}
