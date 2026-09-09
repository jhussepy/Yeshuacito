import { describe, expect, it } from "vitest";
import { databaseSetupError } from "../../features/setup/database-error";

describe("databaseSetupError", () => {
  it("explains invalid credentials without exposing connection details", () => {
    const message = databaseSetupError({ code: "P1000", meta: { password: "private" } });
    expect(message).toContain("contraseña");
    expect(message).toContain("P1000");
    expect(message).not.toContain("private");
  });

  it("explains a missing table", () => {
    expect(databaseSetupError({ code: "P2021" })).toContain("SQL Editor");
  });

  it("directs unknown failures to sanitized server logs", () => {
    expect(databaseSetupError(new Error("unknown"))).toContain("Runtime Logs");
  });
});
