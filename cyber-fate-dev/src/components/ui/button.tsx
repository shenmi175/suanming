import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-aurora disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-cinnabar text-paper shadow-seal hover:bg-[#ef5a43]",
          variant === "secondary" &&
            "border border-brass/50 bg-paper/8 text-paper hover:border-brass hover:bg-paper/12",
          variant === "ghost" &&
            "text-bone hover:bg-paper/10 hover:text-paper",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
