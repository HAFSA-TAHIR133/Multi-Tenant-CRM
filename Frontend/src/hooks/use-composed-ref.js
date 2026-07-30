import { useCallback } from "react";

/**
 * Assigns a value to a given ref object or invokes a ref callback function.
 * Handles cleanup logic if a callback ref returns a cleanup function (React 19 support).
 */
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

/**
 * React hook that composes multiple refs into a single ref callback function.
 * Works with useRef objects, callback refs, and null/undefined values.
 *
 * @param {...(import('react').Ref<any> | undefined | null)} refs - List of refs to compose
 * @returns {import('react').RefCallback<any>} - Combined ref callback
 */
export function useComposedRef(...refs) {
  // useCallback ensures the ref callback remains stable across renders unless a ref reference changes
  return useCallback(
    (node) => {
      const cleanups = [];

      for (const ref of refs) {
        const cleanup = setRef(ref, node);
        if (typeof cleanup === "function") {
          cleanups.push(cleanup);
        }
      }

      // Return cleanup function for ref callback lifecycle (React 19 compat)
      return () => {
        for (const cleanup of cleanups) {
          cleanup();
        }
        for (const ref of refs) {
          setRef(ref, null);
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...refs]
  );
}