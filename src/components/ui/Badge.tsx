// src/components/ui/Badge.tsx
"use client";

import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-neutral-300",
        success: "bg-emerald-500/15 text-emerald-400",
        warning: "bg-yellow-500/15 text-yellow-400",
        error: "bg-red-500/15 text-red-400",
        info: "bg-blue-500/15 text-blue-400",
        purple: "bg-purple-500/15 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export default function Badge({ 
  className, 
  variant, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props}>
      {children}
    </div>
  );
}