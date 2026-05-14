import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn("h-2 w-full overflow-hidden rounded-full bg-paper/10", className)}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-aurora transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
