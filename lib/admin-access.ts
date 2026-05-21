const DEFAULT_ADMIN_EMAILS = ['mrcheriftrading@gmail.com']

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function configuredAdminEmails() {
  const configured = [
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_EMAILS,
    process.env.VESSELSURGE_ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map(normalizeEmail)
    .filter(Boolean)

  return new Set([...DEFAULT_ADMIN_EMAILS, ...configured])
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false
  return configuredAdminEmails().has(normalizeEmail(email))
}
