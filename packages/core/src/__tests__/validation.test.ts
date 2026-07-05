import { describe, it, expect, vi } from "vitest";
import type { ValidationResult, ValidatorSpec } from "../../types";
import {
  runValidator,
  runValidatorSync,
  isValid,
  composeValidators,
  required,
  minLength,
  maxLength,
  pattern,
  resolveErrorMessage,
  formatTypeAsMessage,
  createErrorMessages,
  getErrorType,
  createValidationError,
} from "../index";

describe("Validation", () => {
  describe("runValidator", () => {
    it("should run inline validator function", async () => {
      const validator = (value: unknown) =>
        value === "valid" || "Must be valid";

      expect(await runValidator(validator, "valid", {})).toBe(true);
      expect(await runValidator(validator, "invalid", {})).toBe(
        "Must be valid",
      );
    });

    it("should run named validator", async () => {
      const validators = {
        notEmpty: (value: unknown) => Boolean(value) || "Required",
      };

      expect(await runValidator("notEmpty", "value", {}, validators)).toBe(
        true,
      );
      expect(await runValidator("notEmpty", "", {}, validators)).toBe(
        "Required",
      );
    });

    it("should run array of validators", async () => {
      const validators = {
        notEmpty: (value: unknown) => Boolean(value) || "Required",
        minFive: (value: unknown) =>
          (typeof value === "string" && value.length >= 5) || "Too short",
      };

      expect(
        await runValidator(["notEmpty", "minFive"], "hello", {}, validators),
      ).toBe(true);
      expect(
        await runValidator(["notEmpty", "minFive"], "hi", {}, validators),
      ).toBe("Too short");
      expect(
        await runValidator(["notEmpty", "minFive"], "", {}, validators),
      ).toBe("Required");
    });

    it("should handle async validators", async () => {
      const asyncValidator = async (value: unknown) => {
        await new Promise((r) => setTimeout(r, 10));
        return value === "valid" || "Invalid";
      };

      expect(await runValidator(asyncValidator, "valid", {})).toBe(true);
      expect(await runValidator(asyncValidator, "invalid", {})).toBe("Invalid");
    });

    it("should short-circuit on first failure", async () => {
      let secondCalled = false;
      const validators = [
        () => "First fails",
        () => {
          secondCalled = true;
          return true;
        },
      ];

      await runValidator(validators, "value", {});
      expect(secondCalled).toBe(false);
    });

    it("should pass formValues to validator", async () => {
      const validator = (value: unknown, formValues: Record<string, unknown>) =>
        value === formValues.password || "Passwords must match";

      expect(
        await runValidator(validator, "secret", { password: "secret" }),
      ).toBe(true);
      expect(
        await runValidator(validator, "wrong", { password: "secret" }),
      ).toBe("Passwords must match");
    });

    it("should handle missing named validator gracefully", async () => {
      expect(await runValidator("nonExistent", "value", {}, {})).toBe(true);
    });

    // Region A — runSingleValidator catch block (validate.ts:29-35), both ternary arms
    it("should treat a throwing validator as a validation failure (Error)", async () => {
      const throwing = () => {
        throw new Error("boom");
      };
      await expect(runValidator(throwing, "x", {})).resolves.toEqual({
        type: "validation_error",
        message: "boom",
      });
    });

    it("should treat a throwing validator as a validation failure (non-Error)", async () => {
      const throwing = () => {
        throw "string error";
      };
      await expect(runValidator(throwing, "x", {})).resolves.toEqual({
        type: "validation_error",
        message: "Validation error",
      });
    });

    // Region B — !namedValidators arm (validate.ts:111-116); OMIT the 4th arg
    it("should pass with a warning when a named validator is requested but no validators provided", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await expect(runValidator("required", "x", {})).resolves.toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("no validators provided"),
      );
      warnSpy.mockRestore();
    });

    // Region C — unknown spec type (validate.ts:135)
    it("should pass for an unknown validator spec type", async () => {
      await expect(
        runValidator(42 as unknown as ValidatorSpec, "x", {}),
      ).resolves.toBe(true);
    });
  });

  describe("runValidatorSync", () => {
    it("should run sync validators", () => {
      const validator = (value: unknown) => value === "valid" || "Invalid";
      expect(runValidatorSync(validator, "valid", {})).toBe(true);
      expect(runValidatorSync(validator, "wrong", {})).toBe("Invalid");
    });

    // Region D — array branch (validate.ts:154-161)
    it("should run an array of sync validators (all pass)", () => {
      const validators = {
        a: (v: unknown) => Boolean(v) || "A",
        b: () => true,
      };
      expect(runValidatorSync(["a", "b"], "v", {}, validators)).toBe(true);
    });

    it("should short-circuit sync arrays on first failure", () => {
      let secondCalled = false;
      expect(
        runValidatorSync(
          [
            () => "nope",
            () => {
              secondCalled = true;
              return true;
            },
          ],
          "v",
          {},
        ),
      ).toBe("nope");
      expect(secondCalled).toBe(false);
    });

    // Region E — string branch (validate.ts:165-178)
    it("should run a named sync validator", () => {
      const validators = {
        notEmpty: (v: unknown) => Boolean(v) || "Required",
      };
      expect(runValidatorSync("notEmpty", "v", {}, validators)).toBe(true);
      expect(runValidatorSync("notEmpty", "", {}, validators)).toBe("Required");
    });

    it("should pass when a named sync validator is requested but no validators provided", () => {
      // Omit the 4th arg so namedValidators is undefined
      expect(runValidatorSync("notEmpty", "v", {})).toBe(true);
    });

    it("should pass when a named sync validator is not found", () => {
      expect(runValidatorSync("missing", "v", {}, {})).toBe(true);
    });

    // Region F — unknown spec type (validate.ts:187)
    it("should pass for an unknown sync validator spec type", () => {
      expect(runValidatorSync(42 as unknown as ValidatorSpec, "x", {})).toBe(
        true,
      );
    });
  });

  describe("isValid", () => {
    it("should return true for valid results", () => {
      expect(isValid(true)).toBe(true);
      expect(isValid(undefined)).toBe(true);
    });

    it("should return false for invalid results", () => {
      expect(isValid(false)).toBe(false);
      expect(isValid("Error message")).toBe(false);
      expect(isValid({ type: "required" })).toBe(false);
    });
  });

  describe("composeValidators", () => {
    it("should compose multiple validators", async () => {
      const validators = {
        notEmpty: (v: unknown) => Boolean(v) || "Required",
      };
      const composed = composeValidators(
        ["notEmpty", minLength(3)],
        validators,
      );

      expect(await composed("hello", {})).toBe(true);
      expect(await composed("hi", {})).toEqual({
        type: "minLength",
        message: "Must be at least 3 characters",
      });
      expect(await composed("", {})).toBe("Required");
    });
  });

  describe("Built-in validators", () => {
    describe("required", () => {
      const validator = required();

      it("should fail for empty values", () => {
        expect(validator(undefined, {})).toEqual({
          type: "required",
          message: "This field is required",
        });
        expect(validator(null, {})).toEqual({
          type: "required",
          message: "This field is required",
        });
        expect(validator("", {})).toEqual({
          type: "required",
          message: "This field is required",
        });
        expect(validator([], {})).toEqual({
          type: "required",
          message: "This field is required",
        });
      });

      it("should pass for non-empty values", () => {
        expect(validator("value", {})).toBe(true);
        expect(validator(0, {})).toBe(true);
        expect(validator(false, {})).toBe(true);
        expect(validator(["item"], {})).toBe(true);
      });
    });

    describe("minLength", () => {
      const validator = minLength(3);

      it("should validate string length", () => {
        expect(validator("ab", {})).toEqual({
          type: "minLength",
          message: "Must be at least 3 characters",
        });
        expect(validator("abc", {})).toBe(true);
        expect(validator("abcd", {})).toBe(true);
      });

      it("should skip non-strings", () => {
        expect(validator(123, {})).toBe(true);
        expect(validator(null, {})).toBe(true);
      });
    });

    describe("maxLength", () => {
      const validator = maxLength(5);

      it("should validate string length", () => {
        expect(validator("abcdef", {})).toEqual({
          type: "maxLength",
          message: "Must be at most 5 characters",
        });
        expect(validator("abcde", {})).toBe(true);
        expect(validator("abc", {})).toBe(true);
      });

      // Region G — skip non-string (validate.ts:276-278)
      it("should skip non-strings", () => {
        expect(validator(123, {})).toBe(true);
        expect(validator(null, {})).toBe(true);
      });
    });

    describe("pattern", () => {
      const emailPattern = pattern(/^[^@]+@[^@]+\.[^@]+$/, "Invalid email");

      it("should validate against pattern", () => {
        expect(emailPattern("test@example.com", {})).toBe(true);
        expect(emailPattern("invalid", {})).toEqual({
          type: "pattern",
          message: "Invalid email",
        });
      });

      // Region H1 — skip non-string (validate.ts:298-300)
      it("should skip non-strings", () => {
        const validator = pattern(/\d/);
        expect(validator(123, {})).toBe(true);
        expect(validator(null, {})).toBe(true);
      });

      // Region H2 — default message fallback (validate.ts:304)
      it("should use a default message when none is provided", () => {
        const validator = pattern(/^[A-Z]/);
        expect(validator("lower", {})).toEqual({
          type: "pattern",
          message: "Invalid format",
        });
      });
    });
  });

  describe("Error Message Resolution", () => {
    describe("resolveErrorMessage", () => {
      it("should return undefined for valid results", () => {
        expect(resolveErrorMessage(true)).toBeUndefined();
        expect(resolveErrorMessage(undefined)).toBeUndefined();
      });

      it("should use string result directly", () => {
        expect(resolveErrorMessage("Custom error")).toBe("Custom error");
      });

      it("should resolve false to generic message", () => {
        expect(resolveErrorMessage(false)).toBe("Invalid value");
        expect(resolveErrorMessage(false, { invalid: "Not valid" })).toBe(
          "Not valid",
        );
      });

      it("should resolve object result", () => {
        expect(
          resolveErrorMessage(
            { type: "required", message: "Field required" },
            {},
          ),
        ).toBe("Field required");

        expect(
          resolveErrorMessage(
            { type: "required" },
            { required: "Is required" },
          ),
        ).toBe("Is required");
      });

      // Region I-c — type-fallback on lookup miss (messages.ts:57-59)
      it("should fall back to a formatted type message when the type has no entry", () => {
        expect(resolveErrorMessage({ type: "customThing" }, {})).toBe(
          "Custom thing",
        );
      });

      // Region I-d — object with no type (messages.ts:61)
      it("should return the generic message for an object result with no type", () => {
        expect(resolveErrorMessage({}, {})).toBe("Invalid value");
        expect(
          resolveErrorMessage({ message: undefined } as unknown as {
            type: string;
            message?: string;
          }),
        ).toBe("Invalid value");
      });

      // Region J — non-object primitive final fallback (messages.ts:64)
      it("should return the generic message for an unhandled primitive", () => {
        expect(resolveErrorMessage(42 as unknown as ValidationResult)).toBe(
          "Invalid value",
        );
      });
    });

    describe("formatTypeAsMessage", () => {
      it("should format camelCase", () => {
        expect(formatTypeAsMessage("minLength")).toBe("Min length");
        expect(formatTypeAsMessage("maxLength")).toBe("Max length");
      });

      it("should format snake_case", () => {
        expect(formatTypeAsMessage("min_length")).toBe("Min length");
      });

      it("should capitalize first letter", () => {
        expect(formatTypeAsMessage("required")).toBe("Required");
      });
    });

    describe("createErrorMessages", () => {
      it("should include default messages", () => {
        const messages = createErrorMessages();
        expect(messages.required).toBe("This field is required");
        expect(messages.invalid).toBe("Invalid value");
      });

      it("should merge overrides", () => {
        const messages = createErrorMessages({ required: "Custom required" });
        expect(messages.required).toBe("Custom required");
        expect(messages.invalid).toBe("Invalid value");
      });
    });

    describe("getErrorType", () => {
      it("should extract error type", () => {
        expect(getErrorType(true)).toBeUndefined();
        expect(getErrorType(false)).toBe("invalid");
        expect(getErrorType("Error")).toBe("validate");
        expect(getErrorType({ type: "required" })).toBe("required");
      });

      // Region K1 — object without type, `||` falsy arm (messages.ts:145)
      it("should return 'validate' for an object result with no type", () => {
        expect(getErrorType({})).toBe("validate");
      });

      // Region K2 — primitive final fallback (messages.ts:148-149)
      it("should return 'validate' for an unhandled primitive", () => {
        expect(getErrorType(42 as unknown as ValidationResult)).toBe(
          "validate",
        );
      });
    });

    describe("createValidationError", () => {
      it("should create error object", () => {
        expect(createValidationError("required", "Custom message")).toEqual({
          type: "required",
          message: "Custom message",
        });
      });

      it("should lookup message from config", () => {
        expect(
          createValidationError("required", undefined, {
            required: "Is needed",
          }),
        ).toEqual({ type: "required", message: "Is needed" });
      });

      it("should format type as fallback", () => {
        expect(createValidationError("minLength")).toEqual({
          type: "minLength",
          message: "Min length",
        });
      });
    });
  });
});
