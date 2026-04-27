"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronLeft, CheckCircle2, User, Target, Loader2, Ship, Package, Globe, Anchor, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type PartnershipFormData = {
  userType: string
  companyName: string
  goals: string[]
  email: string
  name: string
  urgency: string
}

const USER_TYPES = [
  { value: "vessel-owner", label: "Vessel Owner / Fleet Operator", icon: Ship },
  { value: "cargo-owner", label: "Cargo Owner / Shipper", icon: Package },
  { value: "logistics", label: "Logistics / Freight Forwarder", icon: Globe },
  { value: "broker", label: "Ship Broker", icon: Anchor },
  { value: "charterer", label: "Charterer", icon: Target },
  { value: "other", label: "Other", icon: User },
]

const GOALS = [
  { value: "find-cargo", label: "Find Cargo / Customers" },
  { value: "find-vessel", label: "Find Shipping Capacity" },
  { value: "spot-charter", label: "Spot Charter" },
  { value: "time-charter", label: "Time Charter" },
  { value: "contract-rates", label: "Contract of Affreightment" },
  { value: "tanker", label: "Tanker Shipping" },
  { value: "bulk", label: "Bulk Cargo" },
  { value: "container", label: "Container Shipping" },
]

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate", sub: "Less than 1 month" },
  { value: "short", label: "Short-term", sub: "1–3 months" },
  { value: "planning", label: "Planning", sub: "3–6 months" },
  { value: "exploring", label: "Just exploring", sub: "No timeline" },
]

export function PartnershipForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [emailError, setEmailError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<PartnershipFormData>({
    userType: "",
    companyName: "",
    goals: [],
    email: "",
    name: "",
    urgency: "",
  })

  // Auto-focus first input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [step])

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return null
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    if (email.endsWith('@gmail.com') || email.endsWith('@yahoo.com') || email.endsWith('@hotmail.com')) {
      return "Please use your work email for faster verification"
    }
    return null
  }

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }))
    setEmailError(validateEmail(email))
  }

  const goToStep = (newStep: number) => {
    if (newStep === step) return
    setSlideDirection(newStep > step ? 'right' : 'left')
    setIsAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setIsAnimating(false)
    }, 200)
  }

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const canProceed = () => {
    if (step === 1) return !!(formData.userType && formData.companyName.trim())
    if (step === 2) return formData.goals.length > 0
    if (step === 3) return !!(formData.email.trim() && formData.name.trim() && formData.urgency)
    return false
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Save to Supabase leads table
      const { error: dbError } = await supabase.from("leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.companyName.trim(),
        user_type: formData.userType,
        goals: formData.goals,
        urgency: formData.urgency,
        source: "homepage",
      })

      if (dbError) {
        console.error("[form] Supabase insert error:", dbError)
        // Still complete — don't block user if DB fails
      }

      // Also send mailto as backup notification
      const subject = `[VesselSurge] New Lead — ${formData.companyName}`
      const body = [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        `Company: ${formData.companyName}`,
        `Type: ${USER_TYPES.find(u => u.value === formData.userType)?.label || formData.userType}`,
        `Goals: ${formData.goals.join(", ")}`,
        `Urgency: ${formData.urgency}`,
      ].join("\n")

      window.open(
        `mailto:mrcheriftrading@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        "_blank"
      )

      setIsComplete(true)
    } catch (err) {
      console.error("[form] submit error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="glass-premium rounded-2xl p-8 md:p-12 text-center animate-scale-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 animate-scale-in" style={{ animationDelay: '100ms' }}>
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          You&apos;re in the network!
        </h3>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          Welcome to VesselSurge, <strong className="text-foreground">{formData.name}</strong>.
          Our team will personally match you with verified partners within 24-48 hours.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          Confirmation sent to <strong className="text-foreground">{formData.email}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-premium rounded-2xl p-6 md:p-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => s < step && goToStep(s)}
                disabled={s >= step}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  s < step && "bg-primary text-primary-foreground cursor-pointer hover:scale-110",
                  s === step && "bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110",
                  s > step && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </button>
              {s < 3 && (
                <div className={cn(
                  "flex-1 h-0.5 transition-all duration-500",
                  s < step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span className={cn(step === 1 && "text-primary font-medium")}>Your Role</span>
          <span className={cn(step === 2 && "text-primary font-medium")}>Your Goals</span>
          <span className={cn(step === 3 && "text-primary font-medium")}>Contact</span>
        </div>
      </div>

      {/* Step 1: Role */}
      {step === 1 && (
        <div className={cn(
          "space-y-5 transition-all duration-300",
          isAnimating && slideDirection === 'right' && "opacity-0 translate-x-4",
          isAnimating && slideDirection === 'left' && "opacity-0 -translate-x-4",
          !isAnimating && "opacity-100 translate-x-0"
        )}>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">What best describes you?</h3>
            <p className="text-sm text-muted-foreground">We&apos;ll match you with the right partners.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {USER_TYPES.map(({ value, label, icon: Icon }, index) => (
              <button
                key={value}
                onClick={() => setFormData(prev => ({ ...prev, userType: value }))}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] group",
                  formData.userType === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-2 transition-transform duration-200 group-hover:scale-110",
                  formData.userType === value ? "text-primary" : ""
                )} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Company Name</label>
            <input
              ref={firstInputRef}
              type="text"
              value={formData.companyName}
              onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g. Nordic Maritime Ltd."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className={cn(
          "space-y-5 transition-all duration-300",
          isAnimating && slideDirection === 'right' && "opacity-0 translate-x-4",
          isAnimating && slideDirection === 'left' && "opacity-0 -translate-x-4",
          !isAnimating && "opacity-100 translate-x-0"
        )}>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">What are you looking for?</h3>
            <p className="text-sm text-muted-foreground">Select all that apply. <span className="text-primary">{formData.goals.length} selected</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleGoal(value)}
                className={cn(
                  "p-3 rounded-xl border text-left text-sm transition-all duration-200 hover:scale-[1.01]",
                  formData.goals.includes(value)
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                <span className={cn(
                  "inline-block w-5 h-5 rounded border mr-2 text-center text-xs leading-5 transition-all duration-200",
                  formData.goals.includes(value)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}>
                  {formData.goals.includes(value) && <CheckCircle2 className="h-3 w-3 inline" />}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 3 && (
        <div className={cn(
          "space-y-5 transition-all duration-300",
          isAnimating && slideDirection === 'right' && "opacity-0 translate-x-4",
          isAnimating && slideDirection === 'left' && "opacity-0 -translate-x-4",
          !isAnimating && "opacity-100 translate-x-0"
        )}>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Your contact details</h3>
            <p className="text-sm text-muted-foreground">We&apos;ll reach out within 24-48 hours.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
              <input
                ref={firstInputRef}
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="name@company.com"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 text-sm transition-all duration-200",
                    emailError && formData.email ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/30" : "border-border focus:border-primary focus:ring-primary/30"
                  )}
                />
                {emailError && formData.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                )}
              </div>
              {emailError && formData.email && (
                <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Timeline</label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map(({ value, label, sub }) => (
                  <button
                    key={value}
                    onClick={() => setFormData(prev => ({ ...prev, urgency: value }))}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all duration-200",
                      formData.urgency === value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => goToStep(step - 1)}
          disabled={step === 1 || isAnimating}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => goToStep(step + 1)}
            disabled={!canProceed() || isAnimating}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 btn-glow group"
          >
            Continue <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting || (emailError !== null && formData.email !== '')}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 
                <span>Joining...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> 
                <span>Join VesselSurge</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
