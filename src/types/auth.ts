export type AuthErrorLabel =
  | 'SIGNUP_ERROR'
  | 'PROFILE_ERROR'
  | 'IMPORT_ERROR'
  | 'IMPORT_LOCAL_CANS_ERROR'
  | 'REDIRECT_ERROR'

export type SignUpWarningCode = 'profile' | 'auto_sign_in' | 'email_confirm'

export interface SignUpWarning {
  code: SignUpWarningCode
  message: string
}

export interface SignUpResult {
  authCreated: true
  userId: string
  signedIn: boolean
  warnings: SignUpWarning[]
}

export class SignUpAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignUpAuthError'
  }
}
