const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);

/** Accept common dashboard values while keeping an unset variable disabled. */
export function isEnabled(value: string | undefined): boolean {
  return value !== undefined && ENABLED_VALUES.has(value.trim().toLowerCase());
}
