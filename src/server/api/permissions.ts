import type { ProjectRole } from "../../../generated/prisma";

export function canReview(role: ProjectRole): boolean {
  return role === "LEAD" || role === "REVIEWER";
}

export function canImport(role: ProjectRole): boolean {
  return role === "LEAD" || role === "REVIEWER";
}
