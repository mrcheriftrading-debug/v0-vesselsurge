"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, CheckCircle2, User, Target, Mail, Loader2 } from "lucide-react"

type PartnershipFormData = {
  userType: string
  companyName: string
  goals: string[]
  email: string
  name: string
  urgency: string
}

export function PartnershipForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [formData, setFormData] = useState<PartnershipFormData>({
    userType: "",
    companyName: "",
    goals: [],
    email: "",
    name: "",
    urgency: "",
  })

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const getUserTypeLabel = (value: string) => {
    const labels: Record<string, string> = {
      "vessel-owner": "Vessel Owner / Fleet Operator",
      "cargo-owner": "Cargo Owner / Shipper",
      "logistics": "Logistics / Freight Forwarder",
      "broker": "Ship Broker",
      "charterer": "Charterer",
      "other": "Other"
    }
    return labels[value] || value
  }

  const getGoalLabel = (value: string) => {
    const labels: Record<string, string> = {
      "find-cargo": "Find Cargo / Customers",
      "find-vessel": "Find Shipping Capacity",
      "spot-charter": "Spot Charter",
      "time-charter": "Time Charter",
      "contract-rates": "Contract of Affreightment",
      "tanker": "Tanker Shipping",
      "bulk": "Bulk Cargo",
      "container": "Container Shipping"
    }
    return labels[value] || value
  }

  const getUrgencyLabel = (value: string) => {
    const labels: Record<string, string> = {
      "immediate": "Immediate (less than 1 month)",
      "short": "Short-term (1-3 months)",
      "planning": "Planning phase (3-6 months)",
      "exploring": "Just exploring"
    }
    return labels[value] || value
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const subject = `[VesselSurge] New Partnership Inquiry - ${formData.companyName}`
    let body = `Name: ${formData.name}\n`
    body += `Email: ${formData.email}\n`
    body += `Company: ${formData.companyName}\n`
    body += `Type: ${getUserTypeLabel(formData.userType)}\n`
    body += `Goals: ${formData.goals.map(g => getGoalLabel(g)).join(", ")}\n`
    body += `Urgency: ${getUrgencyLabel(formData.urgency)}\n`

    const mailtoLink = `mailto:mrcheriftrading@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, "_blank")
    
    setTimeout(() => {
      setIsSubmitting(false)
      setIsComplete(true)
    }, 1000)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.userType && formData.companyName
      case 2:
        return formData.goals.length > 0
      case 3:
        return formData.email && formData.name && formData.urgency
      default:
        return false
    }
  }

  if (isComplete) {
    return (
      <div className="glass rounded-2xl p-8 md:p-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#00E676]/20">
          <CheckCircle2 className="h-8 w-8 text-[#00E676]" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Welcome to VesselSurge!</h3>
        <p className="mt-4 text-muted-foreground">
          Your partnership inquiry has been submitted. Our team will contact you within 24-48 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-8 md:p-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${step > 1 ? "bg-[#00E676] text-[#0A1128]" : step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
            </div>
            <div className={`h-1 w-16 md:w-24 mx-2 rounded ${step > 1 ? "bg-[#00E676]" : "bg-muted"}`} />
          </div>
          <div className="flex items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${step > 2 ? "bg-[#00E676] text-[#0A1128]" : step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
            </div>
            <div className={`h-1 w-16 md:w-24 mx-2 rounded ${step > 2 ? "bg-[#00E676]" : "bg-muted"}`} />
          </div>
          <div className="flex items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${step === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {"3"}
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Identity</span>
          <span>Goals</span>
          <span>Contact</span>
        </div>
      </div>

      {/* Step 1: Identity */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Tell us about yourself</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">I am a...</label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select your role</option>
              <option value="vessel-owner">Vessel Owner / Fleet Operator</option>
              <option value="cargo-owner">Cargo Owner / Shipper</option>
              <option value="logistics">Logistics / Freight Forwarder</option>
              <option value="broker">Ship Broker</option>
              <option value="charterer">Charterer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter your company name"
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="text-xl font-semibold text-foreground">What are you looking for?</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => toggleGoal("find-cargo")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("find-cargo") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Find Cargo / Customers
            </button>
            <button type="button" onClick={() => toggleGoal("find-vessel")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("find-vessel") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Find Shipping Capacity
            </button>
            <button type="button" onClick={() => toggleGoal("spot-charter")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("spot-charter") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Spot Charter
            </button>
            <button type="button" onClick={() => toggleGoal("time-charter")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("time-charter") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Time Charter
            </button>
            <button type="button" onClick={() => toggleGoal("contract-rates")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("contract-rates") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Contract of Affreightment
            </button>
            <button type="button" onClick={() => toggleGoal("tanker")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("tanker") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Tanker Shipping
            </button>
            <button type="button" onClick={() => toggleGoal("bulk")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("bulk") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Bulk Cargo
            </button>
            <button type="button" onClick={() => toggleGoal("container")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${formData.goals.includes("container") ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-muted"}`}>
              Container Shipping
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-[#00E676]" />
            <h3 className="text-xl font-semibold text-foreground">Contact Information</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your full name"
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Professional Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Timeline / Urgency</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select urgency level</option>
              <option value="immediate">Immediate (less than 1 month)</option>
              <option value="short">Short-term (1-3 months)</option>
              <option value="planning">Planning phase (3-6 months)</option>
              <option value="exploring">Just exploring</option>
            </select>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-[#00E676] px-6 py-3 text-sm font-semibold text-[#0A1128] transition-all hover:bg-[#00E676]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Join VesselSurge
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
