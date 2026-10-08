import { MMK_PER_USDT } from './currency'

export const WHEEL_MINIMUM_BALANCE = 20 * MMK_PER_USDT
export const WHEEL_MAX_AMOUNT = 99_999_999_999
export const WHEEL_INTERVAL_MS = 24 * 60 * 60 * 1000

export function isWheelAmount(value) {
  return (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value)))
    && Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= WHEEL_MAX_AMOUNT
}

export function wheelRotation(rotation, prizeIndex, itemCount, reducedMotion = false) {
  const current = ((rotation % 360) + 360) % 360
  const target = (360 - prizeIndex * 360 / itemCount) % 360
  return rotation + (reducedMotion ? 0 : 360 * 6) + (target - current + 360) % 360
}
