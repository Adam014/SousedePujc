const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertValidUUID(value: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`Invalid UUID format: ${value}`)
  }
}
