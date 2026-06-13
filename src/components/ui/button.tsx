import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "touch-target",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "bg-foreground text-background hover:opacity-90",
        variant === "outline" &&
          "border border-foreground bg-transparent text-foreground hover:bg-muted",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-muted",
        variant === "destructive" &&
          "bg-destructive text-white hover:bg-red-700",
        size === "sm" && "h-10 rounded-lg px-4 text-sm",
        size === "md" && "h-12 rounded-xl px-6 text-base",
        size === "lg" && "h-14 rounded-2xl px-8 text-lg",
        size === "icon" && "size-14 rounded-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
