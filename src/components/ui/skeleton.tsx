
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/70", className)} // Adjusted opacity for better visibility on some backgrounds
      {...props}
    />
  )
}

export { Skeleton }
