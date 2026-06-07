const MAX_DESCRIPTION_LENGTH = 2000
const MAX_TITLE_LENGTH = 120
const MAX_ASKING_FOR_LENGTH = 500

export function sanitizeDescription(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH)
}

export function sanitizeTitle(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, MAX_TITLE_LENGTH)
}

export function sanitizeAskingFor(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, MAX_ASKING_FOR_LENGTH)
}

export function sanitizeLocation(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, 80)
}
