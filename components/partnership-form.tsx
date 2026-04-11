"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, CheckCircle2, User, Target, Mail, Loader2, Ship, Package, Globe, Anchor } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [formData, setFormData] = useState<PartnershipFormData>({
    userType: "",
    companyName: "",
    goals: [],
    email: "",
    name: "",
    urgency: "",
  })

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
      <div className="glass rounded-2xl p-8 md:p-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">You&apos;re in the network!</h3>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Welcome to VesselSurge, <strong className="text-foreground">{formData.name}</strong>.
          Our team will personally match you with verified partners within 24–48 hours.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
          📧 Confirmation sent to <strong className="text-foreground">{formData.email}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < step ? "bg-primary text-primary-foreground" :
                  s === step ? "bg-primary text-primary-foreground ring-4 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-0.5 transition-all ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Your Role</span>
          <span>Your Goals</span>
          <span>Contact</span>
        </div>
      </div>

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">What best describes you?</h3>
            <p className="text-sm text-muted-foreground">We&apos;ll match you with the right partners.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {USER_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFormData(prev => ({ ...prev, userType: value }))}
                className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                  formData.userType === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${formData.userType === value ? "text-primary" : ""}`} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g. Nordic Maritime Ltd."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">What are you looking for?</h3>
            <p className="text-sm text-muted-foreground">Select all that apply.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleGoal(value)}
                className={`p-3 rounded-xl border text-left text-sm transition-all hover:scale-[1.01] ${
                  formData.goals.includes(value)
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {formData.goals.includes(value) && <span className="mr-1">✓</span>}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Your contact details</h3>
            <p className="text-sm text-muted-foreground">We&apos;ll reach out within 24–48 hours.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Work Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Timeline</label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map(({ value, label, sub }) => (
                  <button
                    key={value}
                    onClick={() => setFormData(prev => ({ ...prev, urgency: value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.urgency === value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card/30 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Join VesselSurge</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
