import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "success" && "bg-primary text-primary-foreground",
        variant === "outline" &&
          "border border-border bg-background text-foreground",
        variant === "default" && "bg-muted text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
