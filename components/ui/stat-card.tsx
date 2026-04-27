"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  value: string
  label: string
  color?: "primary" | "accent" | "success" | "warning"
  className?: string
  animateNumber?: boolean
}

const colorStyles = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-[#00E676]",
  warning: "text-[#FFB800]",
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return isInView
}

function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [end, duration, start])

  return count
}

export function StatCard({
  value,
  label,
  color = "primary",
  className,
  animateNumber = true,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref)
  
  // Extract numeric part from value
  const numericMatch = value.match(/^([\d.]+)/)
  const numericPart = numericMatch ? parseFloat(numericMatch[1]) : 0
  const suffix = value.replace(/^[\d.]+/, "")
  
  const animatedValue = useCountUp(numericPart, 1500, isInView && animateNumber)
  
  const displayValue = animateNumber && numericPart > 0
    ? `${animatedValue}${suffix}`
    : value

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-background/50 p-6 text-center transition-all duration-300 hover:bg-background/70",
        className
      )}
    >
      <div className={cn("text-4xl font-bold", colorStyles[color])}>
        {displayValue}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
