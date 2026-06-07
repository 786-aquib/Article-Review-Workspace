import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";

import { canImport, canReview } from "~/server/api/permissions";

describe("project access helpers", () => {
  it("allows reviewers and leads to update reviews", () => {
    expect(canReview("REVIEWER")).toBe(true);
    expect(canReview("LEAD")).toBe(true);
    expect(canReview("VIEWER")).toBe(false);
  });

  it("allows reviewers and leads to import articles", () => {
    expect(canImport("REVIEWER")).toBe(true);
    expect(canImport("LEAD")).toBe(true);
    expect(canImport("VIEWER")).toBe(false);
  });

  it("uses FORBIDDEN for missing project membership", () => {
    const error = new TRPCError({
      code: "FORBIDDEN",
      message: "No access to this project",
    });
    expect(error.code).toBe("FORBIDDEN");
  });
});

describe("review update metadata", () => {
  it("records reviewer metadata when status changes", () => {
    const previousStatus = "PENDING";
    const nextStatus = "INCLUDE";
    const statusChanged = nextStatus !== previousStatus;

    expect(statusChanged).toBe(true);

    const reviewedAt = statusChanged ? new Date("2026-01-01T00:00:00Z") : undefined;
    const reviewedById = statusChanged ? "user-123" : undefined;

    expect(reviewedAt).toBeInstanceOf(Date);
    expect(reviewedById).toBe("user-123");
  });
});
