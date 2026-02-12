// copied in awe from https://github.com/nkzw-tech/create-context-hook/tree/main
import type { FunctionComponent, ReactNode } from "react";
import { createContext, useContext } from "react";

export function createContextHook<T>(
  contextInitializer: () => Partial<T>,
  defaultValue?: T
): [Context: FunctionComponent<{ children: ReactNode; value?: Partial<T> }>, useHook: () => T] {
  const Context = createContext<T | undefined>(defaultValue);

  return [
    ({ children, value }: { children: ReactNode; value?: Partial<T> }) => {
      const defaultContextValue = contextInitializer();
      const mergedValue = value ? { ...defaultContextValue, ...value } : defaultContextValue;

      return <Context.Provider value={mergedValue as T}>{children}</Context.Provider>;
    },
    () => useContext(Context) as T,
  ];
}
