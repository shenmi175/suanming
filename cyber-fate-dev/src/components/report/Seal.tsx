import { cn } from "@/lib/utils";

const intensityClass = {
  high: "border-cinnabar bg-cinnabar/10 text-cinnabar shadow-[0_0_34px_rgba(213,68,47,0.24)]",
  medium: "border-cinnabar/80 bg-cinnabar/10 text-cinnabar shadow-[0_0_24px_rgba(213,68,47,0.16)]",
  low: "border-cinnabar/55 bg-cinnabar/5 text-cinnabar/80 shadow-[0_0_18px_rgba(213,68,47,0.10)]",
} as const;

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
        "seal-border group relative grid aspect-square w-24 place-items-center overflow-hidden rounded-[3px] border p-2",
        intensityClass[intensity],
        className,
      )}
      aria-label={label}
    >
      <span className="pointer-events-none absolute inset-1 border border-current/35" />
      <span className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-current/70" />
      <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-current/70" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-current/70" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-current/70" />
      <span className="pointer-events-none absolute h-[145%] w-px rotate-45 bg-current/18" />
      <span className="pointer-events-none absolute h-[145%] w-px -rotate-45 bg-current/12" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_26%,rgba(255,255,255,.18),transparent_12%),radial-gradient(circle_at_70%_74%,rgba(0,0,0,.12),transparent_16%)] mix-blend-multiply" />
      <span className="relative z-10 max-h-full font-serif text-[0.82rem] font-black leading-[1.15] [writing-mode:vertical-rl]">
        {label}
      </span>
    </div>
  );
}
