// @formality/react - useSubscriptions Hook
// Manages field subscriptions in the Form's inverted index

import { useEffect, useRef } from 'react';
import { useFormContext } from '../context/FormContext';

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
  subscriptions: string[]
): void {
  const { addSubscription, removeSubscription } = useFormContext();

  // Track previous subscriptions to properly cleanup on change
  const prevSubscriptionsRef = useRef<string[]>([]);

  useEffect(() => {
    const prevSubscriptions = prevSubscriptionsRef.current;

    // Find subscriptions to remove (in prev but not in current)
    const toRemove = prevSubscriptions.filter(
      (target) => !subscriptions.includes(target)
    );

    // Find subscriptions to add (in current but not in prev)
    const toAdd = subscriptions.filter(
      (target) => !prevSubscriptions.includes(target)
    );

    // Remove old subscriptions
    toRemove.forEach((target) => {
      removeSubscription(target, fieldName);
    });

    // Add new subscriptions
    toAdd.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Update ref for next comparison
    prevSubscriptionsRef.current = subscriptions;

    // Cleanup on unmount - remove all current subscriptions
    return () => {
      subscriptions.forEach((target) => {
        removeSubscription(target, fieldName);
      });
    };
  }, [fieldName, subscriptions, addSubscription, removeSubscription]);
}
