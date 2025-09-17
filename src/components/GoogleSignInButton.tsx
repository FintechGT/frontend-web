// src/components/GoogleSignInButton.tsx
"use client";

import * as React from "react";

declare global {
  interface Window {
    google?: any;
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

    // Carga script GIS
    const id = "google-identity-services";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.id = id;
      s.onload = initialize;
      s.onerror = () => onError?.(new Error("No se pudo cargar Google SDK"));
      document.head.appendChild(s);
    } else {
      initialize();
    }

    function initialize() {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
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
    }
  }, [onSuccess, onError, text, theme, size]);

  return <div ref={divRef} />;
}
