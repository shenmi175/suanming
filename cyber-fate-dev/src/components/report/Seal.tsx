import { cn } from "@/lib/utils";

export function Seal({
  label,
  intensity = "medium",
  className,
}: {
  label: string;
  intensity?: "low" | "medium" | "high";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "seal-border grid aspect-square w-24 place-items-center rounded-[6px] p-2 text-center font-serif text-sm font-bold leading-tight text-cinnabar",
        intensity === "high" && "bg-cinnabar/10",
        intensity === "medium" && "bg-cinnabar/5",
        intensity === "low" && "border-cinnabar/45 text-cinnabar/75",
        className,
      )}
      aria-label={label}
    >
      {label}
    </div>
  );
}
