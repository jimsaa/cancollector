export type CameraErrorKind =
  | 'permission_denied'
  | 'not_found'
  | 'in_use'
  | 'unsupported'
  | 'secure_context'
  | 'unknown'

export interface CameraErrorInfo {
  kind: CameraErrorKind
  title: string
  message: string
}

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}

export function getCameraErrorInfo(err: unknown): CameraErrorInfo {
  if (!isSecureContext()) {
    return {
      kind: 'secure_context',
      title: 'Secure connection required',
      message:
        'Camera access requires HTTPS or localhost. Open this app via https:// or http://localhost — not a plain IP address or file URL.',
    }
  }

  if (!isCameraSupported()) {
    return {
      kind: 'unsupported',
      title: 'Camera not supported',
      message:
        'This browser does not support camera access. Enter the barcode manually below.',
    }
  }

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          kind: 'permission_denied',
          title: 'Camera permission denied',
          message:
            'Allow camera access in your browser or device settings, then tap Start Scan again. You can also enter the barcode manually below.',
        }
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          kind: 'not_found',
          title: 'No camera found',
          message:
            'This device has no usable camera. Enter the barcode number manually below.',
        }
      case 'NotReadableError':
      case 'TrackStartError':
        return {
          kind: 'in_use',
          title: 'Camera unavailable',
          message:
            'The camera may be in use by another app. Close other camera apps and try again, or use manual entry.',
        }
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return {
          kind: 'unsupported',
          title: 'Rear camera unavailable',
          message:
            'Could not open the rear camera on this device. Try Start Scan again or enter the barcode manually.',
        }
      case 'SecurityError':
        return {
          kind: 'secure_context',
          title: 'Camera blocked',
          message:
            'Camera access is blocked by browser security settings. Use HTTPS/localhost or enter the barcode manually.',
        }
      default:
        return {
          kind: 'unknown',
          title: 'Camera error',
          message: err.message || 'Something went wrong opening the camera. Use manual entry below.',
        }
    }
  }

  if (err instanceof Error) {
    const lower = err.message.toLowerCase()
    if (lower.includes('permission') || lower.includes('denied')) {
      return getCameraErrorInfo(new DOMException(err.message, 'NotAllowedError'))
    }
    return {
      kind: 'unknown',
      title: 'Camera error',
      message: err.message,
    }
  }

  return {
    kind: 'unknown',
    title: 'Camera error',
    message: 'Could not start the camera. Enter the barcode manually below.',
  }
}
