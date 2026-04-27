"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  features?: string[]
  accentColor?: "primary" | "accent" | "success" | "warning"
  className?: string
  animationDelay?: number
}

const accentStyles = {
  primary: {
    border: "border-primary/20",
    gradient: "from-primary/5",
    iconBg: "bg-primary/20",
    iconText: "text-primary",
    checkIcon: "text-primary",
  },
  accent: {
    border: "border-accent/20",
    gradient: "from-accent/5",
    iconBg: "bg-accent/20",
    iconText: "text-accent",
    checkIcon: "text-accent",
  },
  success: {
    border: "border-[#00E676]/20",
    gradient: "from-[#00E676]/5",
    iconBg: "bg-[#00E676]/20",
    iconText: "text-[#00E676]",
    checkIcon: "text-[#00E676]",
  },
  warning: {
    border: "border-[#FFB800]/20",
    gradient: "from-[#FFB800]/5",
    iconBg: "bg-[#FFB800]/20",
    iconText: "text-[#FFB800]",
    checkIcon: "text-[#FFB800]",
  },
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  accentColor = "primary",
  className,
  animationDelay = 0,
}: FeatureCardProps) {
  const styles = accentStyles[accentColor]

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-gradient-to-br to-transparent p-6 card-hover opacity-0 animate-fade-in-up",
        styles.border,
        styles.gradient,
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          styles.iconBg,
          styles.iconText
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {features && features.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <svg
                className={cn("h-4 w-4 flex-shrink-0", styles.checkIcon)}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
