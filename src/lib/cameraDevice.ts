import { BrowserMultiFormatReader } from '@zxing/browser'

const REAR_CAMERA_PATTERN = /back|rear|environment|rück|arrière|traseir/i

export async function getRearCameraDeviceId(): Promise<string | undefined> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return undefined
  }

  let devices = await BrowserMultiFormatReader.listVideoInputDevices()

  if (devices.length === 0) {
    // Permission may be required before labels/deviceIds are available
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    })
    tempStream.getTracks().forEach((track) => track.stop())
    devices = await BrowserMultiFormatReader.listVideoInputDevices()
  }

  if (devices.length === 0) return undefined

  const labeledRear = devices.find((d) => REAR_CAMERA_PATTERN.test(d.label))
  if (labeledRear) return labeledRear.deviceId

  // Mobile browsers often expose unlabeled devices until after permission;
  // the last device is commonly the rear camera.
  if (devices.length > 1) return devices[devices.length - 1].deviceId

  return devices[0].deviceId
}

export function buildRearCameraConstraints(): MediaStreamConstraints {
  return {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  }
}
