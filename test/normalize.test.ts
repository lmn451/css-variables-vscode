import {
  normalizeStringArray,
  normalizePathDisplay,
  normalizePathDisplayLength,
  normalizeUndefinedVarFallback,
} from "../src/utils";

describe("utils: normalizeStringArray", () => {
  const fallback = ["**/*.css", "**/*.scss"];

  test("returns fallback for undefined", () => {
    expect(normalizeStringArray(undefined, fallback)).toStrictEqual(fallback);
  });

  test("filters non-strings and trims strings", () => {
    const input = [" a ", 123, "b", "", "   ", "c "];
    expect(normalizeStringArray(input, fallback)).toStrictEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("empty array yields empty array", () => {
    expect(normalizeStringArray([], fallback)).toStrictEqual([]);
  });
});

describe("utils: normalizePathDisplay", () => {
  test("accepts valid values (case-insensitive)", () => {
    expect(normalizePathDisplay("relative")).toBe("relative");
    expect(normalizePathDisplay("RELATIVE")).toBe("relative");
    expect(normalizePathDisplay("Absolute")).toBe("absolute");
    expect(normalizePathDisplay("abbreviated")).toBe("abbreviated");
  });

  test("rejects invalid types and values", () => {
    expect(normalizePathDisplay(123)).toBeUndefined();
    expect(normalizePathDisplay("not-a-mode")).toBeUndefined();
    expect(normalizePathDisplay(undefined)).toBeUndefined();
  });
});

describe("utils: normalizePathDisplayLength", () => {
  test("accepts finite non-negative numbers and floors", () => {
    expect(normalizePathDisplayLength(5)).toBe(5);
    expect(normalizePathDisplayLength(5.9)).toBe(5);
    expect(normalizePathDisplayLength(0)).toBe(0);
  });

  test("rejects negative, non-number or non-finite values", () => {
    expect(normalizePathDisplayLength(-1)).toBeUndefined();
    expect(
      normalizePathDisplayLength(Number.POSITIVE_INFINITY)
    ).toBeUndefined();
    // @ts-ignore - intentionally passing wrong type
    expect(normalizePathDisplayLength("10" as any)).toBeUndefined();
  });
});

describe("utils: normalizeUndefinedVarFallback", () => {
  test("maps synonyms to canonical values", () => {
    expect(normalizeUndefinedVarFallback("warning")).toBe("warning");
    expect(normalizeUndefinedVarFallback("warn")).toBe("warning");
    expect(normalizeUndefinedVarFallback(" information ")).toBe("info");
    expect(normalizeUndefinedVarFallback("info")).toBe("info");
    expect(normalizeUndefinedVarFallback("disabled")).toBe("off");
    expect(normalizeUndefinedVarFallback("disable")).toBe("off");
    expect(normalizeUndefinedVarFallback("none")).toBe("off");
    expect(normalizeUndefinedVarFallback("omit")).toBe("off");
  });

  test("is case-insensitive and trims whitespace", () => {
    expect(normalizeUndefinedVarFallback("  Warn  ")).toBe("warning");
    expect(normalizeUndefinedVarFallback("InFo")).toBe("info");
  });

  test("returns undefined for unexpected values or non-strings", () => {
    expect(normalizeUndefinedVarFallback("unknown")).toBeUndefined();
    // @ts-ignore - intentionally passing wrong type
    expect(normalizeUndefinedVarFallback(123 as any)).toBeUndefined();
    expect(normalizeUndefinedVarFallback(undefined)).toBeUndefined();
  });
});
