"use client"

import { useState } from "react"
import { Building2, Globe, Shield, ArrowRight, Check, Loader2, TrendingUp, Lock, Database, BarChart3, Ship, Package, AlertCircle, Anchor } from "lucide-react"

type ServiceType = "list-vessel" | "find-freight" | "data-api" | ""

export function PartnershipHub() {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    serviceType: "" as ServiceType,
    vesselNameIMO: "",
    routeDestination: "",
    message: "",
    dashboardAccess: false,
    urgentInquiry: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState("loading")
    
    try {
      // Build form data for Formspree
      const formPayload = new FormData()
      formPayload.append("name", formData.name)
      formPayload.append("company", formData.company)
      formPayload.append("email", formData.email)
      formPayload.append("serviceType", formData.serviceType)
      
      // Include conditional fields based on service type
      if (formData.serviceType === "list-vessel") {
        formPayload.append("vesselNameIMO", formData.vesselNameIMO)
      } else if (formData.serviceType === "find-freight") {
        formPayload.append("routeDestination", formData.routeDestination)
      }
      
      formPayload.append("message", formData.message)
      formPayload.append("dashboardAccess", formData.dashboardAccess ? "Yes" : "No")
      formPayload.append("urgentInquiry", formData.urgentInquiry ? "Yes" : "No")
      
      // Flag urgent inquiries in subject
      if (formData.urgentInquiry) {
        formPayload.append("_subject", `[URGENT] Maritime Marketplace Inquiry from ${formData.company}`)
      } else {
        formPayload.append("_subject", `Maritime Marketplace Inquiry from ${formData.company}`)
      }

      // Build email body
      const subject = formData.urgentInquiry 
        ? `[URGENT] Maritime Marketplace Inquiry from ${formData.company}`
        : `Maritime Marketplace Inquiry from ${formData.company}`
      
      let body = `Name: ${formData.name}\n`
      body += `Company: ${formData.company}\n`
      body += `Email: ${formData.email}\n`
      body += `Service Type: ${formData.serviceType}\n`
      
      if (formData.serviceType === "list-vessel" && formData.vesselNameIMO) {
        body += `Vessel Name/IMO: ${formData.vesselNameIMO}\n`
      }
      if (formData.serviceType === "find-freight" && formData.routeDestination) {
        body += `Route/Destination: ${formData.routeDestination}\n`
      }
      
      body += `Dashboard Access Requested: ${formData.dashboardAccess ? "Yes" : "No"}\n`
      body += `Urgent Inquiry: ${formData.urgentInquiry ? "Yes" : "No"}\n`
      
      if (formData.message) {
        body += `\nMessage:\n${formData.message}`
      }

      // Open mailto link
      const mailtoLink = `mailto:mrcheriftrading@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoLink, "_blank")
      
      setFormState("success")
    } catch {
      setFormState("error")
    }
  }

  const serviceTypes = [
    { value: "list-vessel", label: "List my vessel for freight", icon: Ship },
    { value: "find-freight", label: "Find available freight capacity", icon: Package },
    { value: "data-api", label: "Data/API Partnership", icon: Database },
  ]

  return (
    <section id="partnership" className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1800px] px-4 py-16 lg:px-6 lg:py-24">
        {/* Maritime Marketplace Section */}
        <div className="mb-16 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-8 lg:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
              <Anchor className="h-4 w-4" />
              Maritime Marketplace
            </div>
            
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl text-balance max-w-3xl">
              Optimize Your Logistics Through the Strait of Hormuz
            </h2>
            
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              Whether you are a ship owner looking to fill capacity or a trader needing reliable transport through the Strait, we connect you to the right partners. Our marketplace facilitates freight matching, data partnerships, and strategic logistics planning.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 w-full max-w-3xl">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
                <div className="rounded-md bg-primary/10 p-3 text-primary">
                  <Ship className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Ship Owners</h3>
                <p className="text-xs text-muted-foreground text-center">
                  List your vessel and fill capacity on critical routes
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
                <div className="rounded-md bg-primary/10 p-3 text-primary">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Cargo Owners</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Find reliable freight capacity when you need it most
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
                <div className="rounded-md bg-primary/10 p-3 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Data Partners</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Access high-frequency AIS data and analytics APIs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Info */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit">
              <Globe className="h-3 w-3" />
              Enterprise Intelligence
            </div>
            
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl text-balance">
              Mitigate Supply Chain Risk with High-Frequency Maritime Data
            </h2>
            
            <p className="mt-4 text-muted-foreground leading-relaxed">
              In volatile geopolitical environments, real-time visibility is not optional—it&apos;s critical. Our enterprise API delivers sub-minute AIS data, predictive transit analytics, and automated risk alerts that empower your operations to stay ahead of disruptions.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Predictive Analytics</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ML-powered transit forecasting and anomaly detection
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Risk Intelligence</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Real-time threat assessment and incident alerts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Enterprise API</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    RESTful endpoints with 99.99% uptime SLA
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Custom Dashboards</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    White-label solutions for your organization
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>24/7 Enterprise Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>99.99% Uptime SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>SOC 2 Type II Certified</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 border-t border-border pt-8">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Trusted by Industry Leaders</p>
              <div className="flex flex-wrap items-center gap-8 opacity-60">
                <span className="text-sm font-medium text-muted-foreground">Major Shipping Co.</span>
                <span className="text-sm font-medium text-muted-foreground">Global Insurance Ltd.</span>
                <span className="text-sm font-medium text-muted-foreground">Energy Partners</span>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div id="contact-form" className="glass rounded-xl border border-border p-6 lg:p-8">
            <h3 className="text-lg font-semibold text-foreground">Get Started with Hormuz Watch</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Whether you need freight matching or enterprise data access, we have you covered
            </p>

            {formState === "success" ? (
              <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h4 className="mt-4 text-lg font-medium text-foreground">Request Submitted</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our team will contact you within 24 hours
                </p>
                <button
                  onClick={() => {
                    setFormState("idle")
                    setFormData({
                      name: "",
                      company: "",
                      email: "",
                      serviceType: "",
                      vesselNameIMO: "",
                      routeDestination: "",
                      message: "",
                      dashboardAccess: false,
                      urgentInquiry: false,
                    })
                  }}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Submit another request
                </button>
              </div>
            ) : formState === "error" ? (
              <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-red-500/20 p-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h4 className="mt-4 text-lg font-medium text-foreground">Submission Failed</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please try again or contact us directly
                </p>
                <button
                  onClick={() => setFormState("idle")}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="company" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Acme Logistics"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Work Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="serviceType" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Service Type
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      required
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select service...</option>
                      {serviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional field: Vessel Name/IMO for ship owners */}
                {formData.serviceType === "list-vessel" && (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                    <label htmlFor="vesselNameIMO" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Vessel Name / IMO Number
                    </label>
                    <input
                      type="text"
                      id="vesselNameIMO"
                      name="vesselNameIMO"
                      required
                      value={formData.vesselNameIMO}
                      onChange={(e) => setFormData({ ...formData, vesselNameIMO: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., MV Pacific Star / IMO 9123456"
                    />
                  </div>
                )}

                {/* Conditional field: Route/Destination for cargo owners */}
                {formData.serviceType === "find-freight" && (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                    <label htmlFor="routeDestination" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Route / Destination
                    </label>
                    <input
                      type="text"
                      id="routeDestination"
                      name="routeDestination"
                      required
                      value={formData.routeDestination}
                      onChange={(e) => setFormData({ ...formData, routeDestination: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Dubai to Singapore, Persian Gulf ports"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="resize-none rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Describe your requirements, cargo type, timeline, or any specific needs..."
                  />
                </div>

                {/* Internal Dashboard Access Request */}
                <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <input
                    type="checkbox"
                    id="dashboardAccess"
                    name="dashboardAccess"
                    checked={formData.dashboardAccess}
                    onChange={(e) => setFormData({ ...formData, dashboardAccess: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor="dashboardAccess" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                      <Lock className="h-4 w-4 text-primary" />
                      Request Internal Dashboard Access
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Get access to our secure internal monitoring dashboard with advanced analytics and custom alert configuration
                    </p>
                  </div>
                </div>

                {/* Urgent Inquiry Checkbox */}
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <input
                    type="checkbox"
                    id="urgentInquiry"
                    name="urgentInquiry"
                    checked={formData.urgentInquiry}
                    onChange={(e) => setFormData({ ...formData, urgentInquiry: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border bg-secondary text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="urgentInquiry" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Urgent Inquiry
                    </label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Flag this as time-sensitive for priority response within 4 hours
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formState === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-2 text-center text-xs text-muted-foreground">
                  By submitting, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
