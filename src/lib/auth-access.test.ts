import { describe, expect, it } from "vitest";
import { isEmailAllowed } from "./auth-access";

describe("authentication access rules", () => {
  it("allows a valid OAuth email when no allowlist is configured", () => {
    expect(isEmailAllowed("owner@example.com")).toBe(true);
    expect(isEmailAllowed(null)).toBe(false);
  });

  it("matches explicit emails without case sensitivity", () => {
    expect(isEmailAllowed("Owner@Example.com", "owner@example.com")).toBe(true);
    expect(isEmailAllowed("other@example.com", "owner@example.com")).toBe(false);
  });

  it("matches only complete allowed domains", () => {
    expect(isEmailAllowed("person@bestarion.com", "", "bestarion.com")).toBe(true);
    expect(isEmailAllowed("person@fakebestarion.com", "", "bestarion.com")).toBe(false);
  });
});

