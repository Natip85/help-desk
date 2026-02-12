"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseDebouncedValueOptions<T> = {
  initialValue: T;
  delay: number;
  onDebouncedChange?: (value: T) => void;
};

export function useDebouncedValue<T>({
  initialValue,
  delay,
  onDebouncedChange,
}: UseDebouncedValueOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  // Keep the callback ref up to date
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Sync with initialValue when it changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onChange = useCallback(
    (newValue: T) => {
      setValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onDebouncedChangeRef.current?.(newValue);
      }, delay);
    },
    [delay]
  );

  const clear = useCallback((resetValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setValue(resetValue);
    onDebouncedChangeRef.current?.(resetValue);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    onChange,
    clear,
  };
}
