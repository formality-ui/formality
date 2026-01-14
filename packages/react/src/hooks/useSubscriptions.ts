// @formality-ui/react - useSubscriptions Hook
// Manages field subscriptions in the Form's inverted index

import { useEffect, useRef } from "react";
import { useFormContext } from "../context/FormContext";

/**
 * Manages field subscriptions
 *
 * This hook registers the current field as a subscriber to the target fields,
 * and cleans up subscriptions when the component unmounts or subscriptions change.
 *
 * Subscriptions are stored in the Form's inverted index (target → subscribers),
 * which allows target fields to know who is watching them (for optimization).
 *
 * @param fieldName - The subscribing field's name
 * @param subscriptions - Array of field names to subscribe to
 *
 * @example
 * ```tsx
 * // Contact field subscribes to client field
 * useSubscriptions('contact', ['client']);
 *
 * // When client changes, its watchers can be notified
 * // This enables features like passSubscriptions
 * ```
 */
export function useSubscriptions(
  fieldName: string,
  subscriptions: string[],
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // PATTERN: Per-effect subscription tracking (similar to executionVersionRef in Form.tsx)
  // Track the current effect run ID
  const runIdRef = useRef<number>(0);

  // Store subscriptions added in each effect run
  // Key: run ID, Value: subscriptions array for that run
  const runSubscriptionsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    // Increment run ID for this effect invocation
    const currentRunId = ++runIdRef.current;

    // CRITICAL: Store subscriptions for THIS specific effect run
    // Use [...subscriptions] to create a copy (prevent reference sharing)
    runSubscriptionsRef.current.set(currentRunId, [...subscriptions]);

    // Add all subscriptions
    subscriptions.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Cleanup only removes subscriptions added in THIS run
    return () => {
      // Get subscriptions for THIS specific run (not current subscriptions value)
      const thisRunSubscriptions = runSubscriptionsRef.current.get(currentRunId);

      if (thisRunSubscriptions) {
        // PATTERN: LIFO cleanup (Last In, First Out)
        // Reverse order for dependent subscriptions
        [...thisRunSubscriptions].reverse().forEach((target) => {
          removeSubscription(target, fieldName);
        });

        // CRITICAL: Clean up tracking map to prevent memory leaks
        runSubscriptionsRef.current.delete(currentRunId);
      }
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
