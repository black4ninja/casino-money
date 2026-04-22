export type Role = "player" | "dealer" | "master";

export const ROLES: readonly Role[] = ["player", "dealer", "master"] as const;

/**
 * Hierarchy: master ⊃ dealer. Player is independent (master does NOT implicitly
 * satisfy player — it's a separate context, not a permission tier).
 */
const HIERARCHY: Record<Role, readonly Role[]> = {
  player: ["player"],
  dealer: ["dealer"],
  master: ["master", "dealer"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function roleSatisfies(actual: Role, required: Role): boolean {
  return HIERARCHY[actual].includes(required);
}

export function anyRoleSatisfies(actual: Role, required: readonly Role[]): boolean {
  return required.some((r) => roleSatisfies(actual, r));
}
