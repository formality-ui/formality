// @formality-ui/react - UnusedFields Component
// Renders fields declared in config but not explicitly rendered

import { type ReactNode, useMemo } from 'react';
import { sortFieldsByOrder } from '@formality-ui/core';
import { useFormContext } from '../context/FormContext';
import { Field } from './Field';

/**
 * UnusedFields component props
 */
export interface UnusedFieldsProps {
  /** Custom render function for each unused field */
  children?: (field: { name: string; component: ReactNode }) => ReactNode;
}

/**
 * UnusedFields component - Renders config-driven fields
 *
 * Renders fields that are declared in the Form's config but have not
 * been explicitly rendered using <Field> components. This enables
 * config-driven forms where not all fields need to be declared in JSX.
 *
 * Fields are tracked via the Form's field registry. When a <Field>
 * component mounts, it registers itself. UnusedFields renders all
 * fields that haven't been registered.
 *
 * @example
 * ```tsx
 * // All fields from config rendered automatically
 * <Form config={config}>
 *   <UnusedFields />
 * </Form>
 *
 * // Mix explicit and automatic fields
 * <Form config={config}>
 *   <Field name="name" /> {/* Explicit with custom props *\/}
 *   <Field name="email" /> {/* Explicit with custom props *\/}
 *   <UnusedFields /> {/* Renders remaining fields *\/}
 * </Form>
 *
 * // Custom wrapper for unused fields
 * <Form config={config}>
 *   <UnusedFields>
 *     {({ name, component }) => (
 *       <div key={name} className="auto-field">
 *         {component}
 *       </div>
 *     )}
 *   </UnusedFields>
 * </Form>
 * ```
 */
export function UnusedFields({ children }: UnusedFieldsProps): JSX.Element {
  const { unusedFields, config } = useFormContext();

  // Sort unused fields by order property (PRD Section 15)
  const sortedFields = useMemo(() => {
    return sortFieldsByOrder(unusedFields, config);
  }, [unusedFields, config]);

  if (children) {
    // Custom render function
    return (
      <>
        {sortedFields.map((name) =>
          children({
            name,
            // CRITICAL: shouldRegister={false} prevents infinite loop (PRD 5.5, 18.9)
            component: <Field key={name} name={name} shouldRegister={false} />,
          })
        )}
      </>
    );
  }

  // Default render
  return (
    <>
      {sortedFields.map((name) => (
        // CRITICAL: shouldRegister={false} prevents infinite loop (PRD 5.5, 18.9)
        <Field key={name} name={name} shouldRegister={false} />
      ))}
    </>
  );
}
