export type DinoRole = "admin" | "unidad";

export function getRoleFromMetadata(
  metadata: Record<string, unknown> | undefined
): DinoRole | null {
  const role = metadata?.role;
  return role === "admin" || role === "unidad" ? role : null;
}
