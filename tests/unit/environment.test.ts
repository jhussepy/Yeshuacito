import { describe, expect, it } from "vitest";
import { isEnabled } from "../../lib/environment";

describe("isEnabled", () => {
  it.each(["true", "TRUE", " true ", "1", "yes", "on"])("accepts %j", (value) => {
    expect(isEnabled(value)).toBe(true);
  });

  it.each([undefined, "", "false", "0", "disabled"])("rejects %j", (value) => {
    expect(isEnabled(value)).toBe(false);
  });
});
