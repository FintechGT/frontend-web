"use client";

import * as React from "react";

/** Contexto para compartir el valor actual del tab */
type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsCtx | null>(null);

function useTabsCtx(): TabsCtx {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
}

/** Contenedor principal de Tabs */
export function Tabs(props: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { value, defaultValue, onValueChange, className, children } = props;
  const isControlled = typeof value === "string";
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "");

  const current = isControlled ? (value as string) : internal;

  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange]
  );

  // Si no hay valor inicial, toma el primero TabsTrigger que aparezca
  const firstTrigger = React.useRef<string | null>(null);
  const registerTrigger = React.useCallback((v: string) => {
    if (firstTrigger.current == null) firstTrigger.current = v;
  }, []);
  React.useEffect(() => {
    if (!current && firstTrigger.current) setValue(firstTrigger.current);
  }, [current, setValue]);

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className} data-tabs="">
        {/* registro de primer trigger "invisible" */}
        <span style={{ display: "none" }} aria-hidden>
          {registerTrigger.toString()}
        </span>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/** Contenedor para la lista de triggers */
export function TabsList(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      role="tablist"
      className={className ?? "inline-flex rounded-md bg-black/30 p-1"}
      {...rest}
    />
  );
}

/** Botón Trigger de cada Tab */
export function TabsTrigger(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
) {
  const { value, className, children, ...rest } = props;
  const { value: current, setValue } = useTabsCtx();

  const isActive = current === value;

  const base =
    "px-4 py-2 text-sm rounded-md transition-colors focus:outline-none";
  const inactive = "text-neutral-400 hover:text-white";
  const active = "bg-blue-600 text-white";

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={`${base} ${isActive ? active : inactive} ${className ?? ""}`}
      onClick={() => setValue(value)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Contenido visible solo cuando su value coincide */
export function TabsContent(
  props: React.HTMLAttributes<HTMLDivElement> & { value: string }
) {
  const { value, className, children, ...rest } = props;
  const { value: current } = useTabsCtx();
  const isActive = current === value;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      className={className ?? ""}
      data-state={isActive ? "active" : "inactive"}
      {...rest}
    >
      {isActive ? children : null}
    </div>
  );
}

export default Tabs;
