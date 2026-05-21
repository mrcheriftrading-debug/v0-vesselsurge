"use client"

import { useEffect } from "react"

export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash
    const search = window.location.search
    const params = new URLSearchParams(hash.replace(/^#/, ""))
    const queryParams = new URLSearchParams(search.replace(/^\?/, ""))
    const isRecovery =
      params.get("type") === "recovery" ||
      queryParams.get("type") === "recovery" ||
      queryParams.get("next") === "/auth/reset-password"
    const hasHashSession = Boolean(params.get("access_token") && params.get("refresh_token"))
    const hasCode = Boolean(queryParams.get("code"))

    if (!isRecovery || (!hasHashSession && !hasCode)) {
      return
    }

    if (window.location.pathname === "/auth/reset-password") return
    window.location.replace(`/auth/reset-password${search}${hash}`)
  }, [])

  return null
}
