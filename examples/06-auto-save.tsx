/**
 * Example 06: Auto-Save System
 * =============================
 * This example demonstrates auto-save features:
 * - autoSave prop: Enable automatic form submission on changes
 * - debounce: Control how long to wait before submitting
 * - Field-level debounce override: Different timing per input type
 * - Immediate submission for certain fields (debounce: false)
 * - Submission state tracking
 */

import React, { memo, useState, useCallback } from "react";
import {
  FormalityProvider,
  Form,
  Field,
  type ReactInputConfig,
  type ReactFormFieldsConfig,
} from "@formality-ui/react";

// =============================================================================
// Mock API for Demonstration
// =============================================================================

const saveToAPI = async (values: Record<string, unknown>): Promise<void> => {
  console.log("Saving to API:", values);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("Saved successfully!");
};

// =============================================================================
// Input Types with Various Debounce Settings
// =============================================================================

const inputs: Record<string, ReactInputConfig> = {
  // Text field with 2-second debounce
  // User can keep typing without triggering saves
  textField: {
    component: memo(({ value, onChange, label, disabled }) => (
      <div className="field">
        <label>{label}</label>
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    )),
    defaultValue: "",
    debounce: 2000, // Wait 2s after user stops typing
  },

  // Text area with longer debounce for longer content
  textArea: {
    component: memo(({ value, onChange, label }) => (
      <div className="field">
        <label>{label}</label>
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      </div>
    )),
    defaultValue: "",
    debounce: 3000, // Wait 3s for longer content
  },

  // Switch with NO debounce - saves immediately on click
  switch: {
    component: memo(({ checked, onChange, label }) => (
      <label className="switch">
        <input
          type="checkbox"
          checked={checked ?? false}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    )),
    defaultValue: false,
    inputFieldProp: "checked",
    debounce: false, // No debounce - submit immediately
  },

  // Select with short debounce
  select: {
    component: memo(({ value, onChange, label, options }) => (
      <div className="field">
        <label>{label}</label>
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {options?.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )),
    defaultValue: "",
    debounce: 500, // Short debounce for selects
  },

  // Number field with medium debounce
  numberField: {
    component: memo(({ value, onChange, label }) => (
      <div className="field">
        <label>{label}</label>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
        />
      </div>
    )),
    defaultValue: null,
    debounce: 1000,
  },
};

// =============================================================================
// Example 1: Basic Auto-Save
// =============================================================================

const basicAutoSaveConfig: ReactFormFieldsConfig = {
  title: {
    type: "textField",
    label: "Title",
  },
  content: {
    type: "textArea",
    label: "Content",
  },
  isPublished: {
    type: "switch",
    label: "Published",
  },
};

export function BasicAutoSaveExample() {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    setIsSaving(true);
    await saveToAPI(values);
    setLastSaved(new Date().toLocaleTimeString());
    setIsSaving(false);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={basicAutoSaveConfig}
        onSubmit={onSubmit}
        autoSave={true} // Enable auto-save
      >
        {({ methods, handleSubmit }) => (
          <div>
            <h3>Basic Auto-Save</h3>
            <div className="save-status">
              {isSaving
                ? "Saving..."
                : lastSaved
                  ? `Last saved: ${lastSaved}`
                  : "Not saved yet"}
            </div>

            <Field name="title" />
            <Field name="content" />
            <Field name="isPublished" />

            {/* No submit button needed - form saves automatically */}
            <p className="hint">
              Changes save automatically. Text fields wait 2-3 seconds, switches
              save immediately.
            </p>
          </div>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 2: Custom Debounce Duration
// =============================================================================

const customDebounceConfig: ReactFormFieldsConfig = {
  name: {
    type: "textField",
    label: "Name",
  },
  email: {
    type: "textField",
    label: "Email",
  },
};

export function CustomDebounceExample() {
  const [saveLog, setSaveLog] = useState<string[]>([]);

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    const timestamp = new Date().toLocaleTimeString();
    setSaveLog((prev) => [
      ...prev.slice(-4),
      `${timestamp}: Saved - ${JSON.stringify(values)}`,
    ]);
    await saveToAPI(values);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={customDebounceConfig}
        onSubmit={onSubmit}
        autoSave={true}
        debounce={5000} // Form-level debounce: 5 seconds
      >
        {({ methods, handleSubmit }) => (
          <div>
            <h3>Custom Debounce (5 seconds)</h3>
            <p>Form-level debounce overrides input defaults</p>

            <Field name="name" />
            <Field name="email" />

            <div className="save-log">
              <strong>Save Log:</strong>
              {saveLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 3: Mixed Debounce Behaviors
// =============================================================================

const mixedDebounceConfig: ReactFormFieldsConfig = {
  quickNote: {
    type: "textField",
    label: "Quick Note (2s debounce)",
  },
  detailedDescription: {
    type: "textArea",
    label: "Detailed Description (3s debounce)",
  },
  priority: {
    type: "select",
    label: "Priority (0.5s debounce)",
    props: {
      options: ["Low", "Medium", "High", "Critical"],
    },
  },
  isUrgent: {
    type: "switch",
    label: "Urgent (immediate)",
  },
  estimatedHours: {
    type: "numberField",
    label: "Estimated Hours (1s debounce)",
  },
};

export function MixedDebounceExample() {
  const [events, setEvents] = useState<string[]>([]);

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    const time = new Date().toLocaleTimeString();
    setEvents((prev) => [...prev.slice(-9), `${time}: Auto-saved`]);
    await saveToAPI(values);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form config={mixedDebounceConfig} onSubmit={onSubmit} autoSave={true}>
        {({ methods, handleSubmit }) => (
          <div>
            <h3>Mixed Debounce Behaviors</h3>
            <p>Different input types have different debounce timings</p>

            <div className="form-layout">
              <div className="form-fields">
                <Field name="quickNote" />
                <Field name="detailedDescription" />
                <Field name="priority" />
                <Field name="isUrgent" />
                <Field name="estimatedHours" />
              </div>

              <div className="event-log">
                <strong>Auto-save events:</strong>
                {events.map((event, i) => (
                  <div key={i}>{event}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 4: Auto-Save with Validation
// =============================================================================
// Auto-save validates only the changed field (and its dependents) before saving

const validatedAutoSaveConfig: ReactFormFieldsConfig = {
  email: {
    type: "textField",
    label: "Email",
    validator: (value) => {
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return "Invalid email format";
      }
      return true;
    },
  },
  age: {
    type: "numberField",
    label: "Age",
    validator: (value) => {
      if (value === null || value === undefined || value === "")
        return "Age is required";
      if (Number(value) < 18) return "Must be 18 or older";
      return true;
    },
  },
};

export function ValidatedAutoSaveExample() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "invalid">(
    "idle",
  );

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    setStatus("saving");
    await saveToAPI(values);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={validatedAutoSaveConfig}
        onSubmit={onSubmit}
        autoSave={true}
      >
        {({ methods, handleSubmit }) => (
          <div>
            <h3>Auto-Save with Validation</h3>
            <p>
              Auto-save saves a change once the edited field (and its
              dependents) validate; an unrelated invalid field won't block it.
            </p>

            <div className="status-badge" data-status={status}>
              {status === "idle" && "Ready"}
              {status === "saving" && "Saving..."}
              {status === "saved" && "Saved!"}
            </div>

            <Field name="email" />
            <Field name="age" />

            <div className="validation-status">
              Manual-submit ready (all fields valid):{" "}
              {methods.formState.isValid ? "Yes" : "No"}
            </div>
          </div>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 5: Conditional Auto-Save
// =============================================================================
// Toggle auto-save on/off at runtime

const conditionalAutoSaveConfig: ReactFormFieldsConfig = {
  autoSaveEnabled: {
    type: "switch",
    label: "Enable Auto-Save",
  },
  title: {
    type: "textField",
    label: "Document Title",
  },
  body: {
    type: "textArea",
    label: "Document Body",
  },
};

export function ConditionalAutoSaveExample() {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveCount, setSaveCount] = useState(0);

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    // Check if auto-save is enabled via form value
    if (!values.autoSaveEnabled) {
      console.log("Auto-save disabled, skipping...");
      return;
    }
    await saveToAPI(values);
    setSaveCount((c) => c + 1);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={conditionalAutoSaveConfig}
        onSubmit={onSubmit}
        autoSave={true}
        record={{ autoSaveEnabled: true }}
      >
        {({ methods, handleSubmit }) => (
          <div>
            <h3>Conditional Auto-Save</h3>
            <p>Toggle auto-save on/off while editing</p>

            <Field name="autoSaveEnabled" />
            <Field name="title" />
            <Field name="body" />

            <div className="stats">
              <p>Total saves: {saveCount}</p>
            </div>
          </div>
        )}
      </Form>
    </FormalityProvider>
  );
}

// =============================================================================
// Example 6: Auto-Save with Manual Save Button
// =============================================================================
// Combine auto-save with option to save immediately

const hybridSaveConfig: ReactFormFieldsConfig = {
  name: {
    type: "textField",
    label: "Name",
  },
  description: {
    type: "textArea",
    label: "Description",
  },
  status: {
    type: "select",
    label: "Status",
    props: {
      options: ["Draft", "In Review", "Published"],
    },
  },
};

export function HybridSaveExample() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = useCallback(async (values: Record<string, unknown>) => {
    setIsSaving(true);
    await saveToAPI(values);
    setLastSaved(new Date());
    setIsSaving(false);
  }, []);

  return (
    <FormalityProvider inputs={inputs}>
      <Form
        config={hybridSaveConfig}
        onSubmit={onSubmit}
        autoSave={true}
        debounce={3000}
      >
        {({ methods, handleSubmit }) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3>Hybrid: Auto-Save + Manual</h3>
            <p>Changes auto-save after 3 seconds, or click Save Now</p>

            <Field name="name" />
            <Field name="description" />
            <Field name="status" />

            <div className="action-bar">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Now"}
              </button>
              {lastSaved && (
                <span className="last-saved">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </form>
        )}
      </Form>
    </FormalityProvider>
  );
}

export default {
  BasicAutoSaveExample,
  CustomDebounceExample,
  MixedDebounceExample,
  ValidatedAutoSaveExample,
  ConditionalAutoSaveExample,
  HybridSaveExample,
};
