// @formality-ui/core - Label Resolution
// Pure functions for resolving field labels
// ZERO framework dependencies

import type { FieldConfig } from "../types";

/**
 * Convert a camelCase or PascalCase field name to a human-readable label
 *
 * @param fieldName - The field name to humanize
 * @returns Human-readable label
 *
 * @example
 * humanizeLabel("clientContact") // → "Client Contact"
 * humanizeLabel("minGrossMarginPercent") // → "Min Gross Margin Percent"
 * humanizeLabel("CCIP/CCOP") // → "CCIP/CCOP" (preserved)
 * humanizeLabel("firstName") // → "First Name"
 * humanizeLabel("HTMLParser") // → "Html Parser"
 * humanizeLabel("userID") // → "User Id"
 */
export function humanizeLabel(fieldName: string): string {
  // Empty string
  if (!fieldName) {
    return "";
  }

  // Handle special characters (preserve as-is with first letter capitalized)
  if (/[^a-zA-Z0-9]/.test(fieldName)) {
    // Contains special chars - might be intentional (e.g., "CCIP/CCOP")
    // Just capitalize first letter if needed
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  // Split on camelCase boundaries
  // "clientContact" → ["client", "Contact"]
  // "HTMLParser" → ["HTML", "Parser"]
  const words = fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase: clientContact → client Contact
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // acronyms: HTMLParser → HTML Parser
    .split(" ");

  // Capitalize each word
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Resolve the label for a field
 *
 * Priority order (highest to lowest):
 * 1. Component prop (label from JSX props)
 * 2. Field config props.label
 * 3. Evaluated selectProps.label (field-level selectProps)
 * 4. Field config label
 * 5. Field config title (legacy alias)
 * 6. Evaluated form-level selectDefaultFieldProps.label
 * 7. Evaluated provider-level selectDefaultFieldProps.label
 * 8. Auto-generated from field name
 *
 * The provider/form `selectDefaultFieldProps` layers are documented as label
 * sources in PRD §16.1 (`providerConfig.selectDefaultFieldProps: { label:
 * "props.name" }` works; same for `formConfig`). They sit below the field-level
 * sources (matching their lower precedence in the 8-layer `mergeFieldProps`
 * pipeline — layers 5 and 7 vs. the field-level layers 2/3) but above the
 * humanized fallback, so a global label convention applies unless the field
 * itself overrides it.
 *
 * **PRD deviation note (accepted, gap_analysis G5).** PRD §1.3.2's table
 * summarizes this export as `resolveLabel(config, fieldName)`. The implemented
 * signature is a richer superset —
 * `(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?,
 * providerSelectProps?, formSelectProps?)` — because it resolves the full
 * priority chain above in one call, which requires the pre-evaluated
 * `selectProps`/`selectDefaultFieldProps` and the JSX `componentProps`. This
 * is an internal API consumed by the framework adapters (e.g.
 * `@formality-ui/react`'s `Field` calls
 * `resolveLabel(name, fieldConfig, fieldSelectProps, restProps,
 * providerSelectProps, formSelectProps)`), not a simplified end-user entry
 * point; the PRD literal form is a condensed representation. No code change is
 * planned.
 *
 * @param fieldName - Field name
 * @param fieldConfig - Field configuration
 * @param evaluatedSelectProps - Pre-evaluated field-level selectProps
 * @param componentProps - Props from JSX
 * @param providerSelectProps - Pre-evaluated provider-level
 *   selectDefaultFieldProps (PRD §16.1)
 * @param formSelectProps - Pre-evaluated form-level selectDefaultFieldProps
 *   (PRD §16.1)
 * @returns Resolved label string
 */
export function resolveLabel(
  fieldName: string,
  fieldConfig?: FieldConfig,
  evaluatedSelectProps?: Record<string, unknown>,
  componentProps?: Record<string, unknown>,
  providerSelectProps?: Record<string, unknown>,
  formSelectProps?: Record<string, unknown>,
): string {
  // Priority 1: Component prop
  if (componentProps?.label !== undefined) {
    return String(componentProps.label);
  }

  // Priority 2: Field config props.label
  if (fieldConfig?.props?.label !== undefined) {
    return String(fieldConfig.props.label);
  }

  // Priority 3: Evaluated selectProps.label
  if (evaluatedSelectProps?.label !== undefined) {
    return String(evaluatedSelectProps.label);
  }

  // Priority 4: Field config label
  if (fieldConfig?.label !== undefined) {
    return fieldConfig.label;
  }

  // Priority 5: Field config title (legacy alias)
  if (fieldConfig?.title !== undefined) {
    return fieldConfig.title;
  }

  // Priority 6: Evaluated form-level selectDefaultFieldProps.label (PRD §16.1)
  if (formSelectProps?.label !== undefined) {
    return String(formSelectProps.label);
  }

  // Priority 7: Evaluated provider-level selectDefaultFieldProps.label (§16.1)
  if (providerSelectProps?.label !== undefined) {
    return String(providerSelectProps.label);
  }

  // Priority 8: Auto-generate from field name
  return humanizeLabel(fieldName);
}

/**
 * Resolve the title for a form
 *
 * @param formTitle - Static form title
 * @param evaluatedSelectTitle - Pre-evaluated selectTitle
 * @returns Resolved title string or undefined
 */
export function resolveFormTitle(
  formTitle?: string,
  evaluatedSelectTitle?: unknown,
): string | undefined {
  // Evaluated selectTitle takes precedence
  if (evaluatedSelectTitle !== undefined && evaluatedSelectTitle !== null) {
    return String(evaluatedSelectTitle);
  }

  // Static title
  return formTitle;
}

/**
 * Check if a label is auto-generated (matches the humanized field name)
 *
 * @param fieldName - Field name
 * @param label - Current label
 * @returns true if label appears to be auto-generated
 */
export function isAutoGeneratedLabel(
  fieldName: string,
  label: string,
): boolean {
  return humanizeLabel(fieldName) === label;
}

/**
 * Create a label with a unit suffix
 *
 * @param baseLabel - Base label text
 * @param unit - Unit to append (e.g., '%', '$', 'kg')
 * @returns Label with unit in parentheses
 *
 * @example
 * createLabelWithUnit("Min Gross Margin", "%") // → "Min Gross Margin (%)"
 * createLabelWithUnit("Weight", "kg") // → "Weight (kg)"
 */
export function createLabelWithUnit(baseLabel: string, unit: string): string {
  return `${baseLabel} (${unit})`;
}

/**
 * Extract the base label and unit from a label with unit suffix
 *
 * @param label - Label potentially containing unit
 * @returns Object with base label and optional unit
 *
 * @example
 * parseLabelWithUnit("Min Gross Margin (%)") // → { base: "Min Gross Margin", unit: "%" }
 * parseLabelWithUnit("Client Contact") // → { base: "Client Contact", unit: undefined }
 */
export function parseLabelWithUnit(label: string): {
  base: string;
  unit?: string;
} {
  const match = label.match(/^(.+)\s*\(([^)]+)\)$/);
  if (match) {
    return {
      base: match[1].trim(),
      unit: match[2],
    };
  }
  return { base: label };
}

// Ordering functions live in config/ordering.ts (PRD §1.3.1/§1.3.2).
// Re-exported here for backwards compatibility with code importing from labels/.
export {
  sortFieldsByOrder,
  getUnusedFields,
  getOrderedUnusedFields,
} from "../config/ordering";
