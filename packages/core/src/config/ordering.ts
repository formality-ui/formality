// @formality-ui/core - Config Ordering
// Pure functions for field ordering (config-driven rendering).
// ZERO framework dependencies.
//
// (Mode A) This is the canonical location for ordering utilities per PRD
// §1.3.1/§1.3.2. `labels/resolve.ts` re-exports these for backwards
// compatibility with code importing from labels/.

import type { FieldConfig } from "../types";

/**
 * Sort fields by their order property
 *
 * Canonical location: `config/ordering.ts` (PRD §1.3.1/§1.3.2).
 *
 * @param fieldNames - Array of field names
 * @param fieldConfigs - Map of field configs
 * @returns Sorted array of field names
 */
export function sortFieldsByOrder(
  fieldNames: string[],
  fieldConfigs: Record<string, FieldConfig>,
): string[] {
  return [...fieldNames].sort((a, b) => {
    const orderA = fieldConfigs[a]?.order ?? Infinity;
    const orderB = fieldConfigs[b]?.order ?? Infinity;
    return orderA - orderB;
  });
}

/**
 * Get fields that are not in the declared set
 *
 * Canonical location: `config/ordering.ts` (PRD §1.3.1/§1.3.2).
 *
 * @param allFields - All field names from config
 * @param declaredFields - Set of explicitly declared field names
 * @returns Array of unused field names
 */
export function getUnusedFields(
  allFields: string[],
  declaredFields: Set<string>,
): string[] {
  return allFields.filter((name) => !declaredFields.has(name));
}

/**
 * Get ordered unused fields
 *
 * Canonical location: `config/ordering.ts` (PRD §1.3.1/§1.3.2).
 *
 * @param allFields - All field names from config
 * @param declaredFields - Set of explicitly declared field names
 * @param fieldConfigs - Map of field configs
 * @returns Sorted array of unused field names
 */
export function getOrderedUnusedFields(
  allFields: string[],
  declaredFields: Set<string>,
  fieldConfigs: Record<string, FieldConfig>,
): string[] {
  const unused = getUnusedFields(allFields, declaredFields);
  return sortFieldsByOrder(unused, fieldConfigs);
}
