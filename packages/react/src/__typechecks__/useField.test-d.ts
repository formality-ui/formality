// Type-level assertion: `UseFieldReturn` ≡ `FieldRenderAPI` (the central S1
// design claim — see PRP P2.M1.T1.S1 / research-notes §1–§2).
//
// This file is NOT a runtime test (vitest's `include` only picks up
// `*.test.{ts,tsx}`; this file is named `*.test-d.ts` and is excluded from
// vitest). It is a pure type-check file consumed by `tsc --build` (the root
// `pnpm typecheck` gate).
//
// What is being proved:
//   `UseFieldReturn` (from `../hooks/useField`) is structurally identical to
//   `FieldRenderAPI` (from `../components/Field`). This is verified via
//   BIDIRECTIONAL assignability: if `UseFieldReturn` is assignable to
//   `FieldRenderAPI` AND `FieldRenderAPI` is assignable to `UseFieldReturn`,
//   the two interfaces have the same set of fields with the same types.
//
// Why this matters:
//   `useField.ts` deliberately does NOT import `FieldRenderAPI` (that would
//   create a Field ↔ useField module cycle once S2 makes Field import useField).
//   So the equivalence is established structurally and LOCKED here. S2/S3 may
//   later alias `type FieldRenderAPI = UseFieldReturn`; until then, this file
//   is the guard that the field-for-field contract has not drifted.

import type { UseFieldReturn } from "../hooks/useField";
import type { FieldRenderAPI } from "../components/Field";

// ---------------------------------------------------------------------------
// Bidirectional assignability = structural equivalence.
// (Using `null as unknown as X` so no real values are constructed; these are
//  erased at compile time.)
// ---------------------------------------------------------------------------
const _returnIsFieldRenderAPI: FieldRenderAPI =
  null as unknown as UseFieldReturn;
const _fieldRenderAPIIsReturn: UseFieldReturn =
  null as unknown as FieldRenderAPI;

void _returnIsFieldRenderAPI;
void _fieldRenderAPIIsReturn;
