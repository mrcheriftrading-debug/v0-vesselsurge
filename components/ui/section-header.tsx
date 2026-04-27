"use client"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  label: string
  title: string
  highlight?: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeader({
  label,
  title,
  highlight,
  description,
  centered = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <div className="mb-4 font-mono text-xs tracking-[0.3em] text-accent">
        {label}
      </div>
      <h2 className={cn(
        "text-3xl font-bold tracking-tight text-foreground lg:text-4xl",
        centered && "max-w-3xl mx-auto"
      )}>
        {title}{" "}
        {highlight && <span className="text-primary">{highlight}</span>}
      </h2>
      {description && (
        <p className={cn(
          "mt-4 text-muted-foreground",
          centered && "max-w-2xl mx-auto"
        )}>
          {description}
        </p>
      )}
    </div>
  )
}
