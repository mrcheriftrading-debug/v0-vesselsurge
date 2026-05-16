"use client"

import { useEffect } from "react"

export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ""))
    if (params.get("type") !== "recovery" || !params.get("access_token") || !params.get("refresh_token")) {
      return
    }

    if (window.location.pathname === "/auth/reset-password") return
    window.location.replace(`/auth/reset-password${hash}`)
  }, [])

  return null
}
