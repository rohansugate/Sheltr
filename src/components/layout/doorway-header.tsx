import { cn } from "@/lib/utils";

interface DoorwayHeaderProps {
  subtitle?: string;
  className?: string;
}

export function DoorwayHeader({ subtitle, className }: DoorwayHeaderProps) {
  return (
    <header className={cn("flex flex-col items-center px-6 pt-8 pb-2 text-center", className)}>
      <h1 className="font-serif text-[2rem] leading-none tracking-tight">Doorway</h1>
      {subtitle && (
        <p className="mt-3 text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          {subtitle}
        </p>
      )}
    </header>
  );
}
