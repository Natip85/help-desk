import { useEffect } from "react";

type Options = {
  withMeta?: boolean;
};

export const useKeypress = (
  callback: () => void,
  keys: string[] | string,
  { withMeta = false }: Options = { withMeta: false }
) => {
  useEffect(() => {
    const handleKeypress = (event: KeyboardEvent) => {
      if (
        (Array.isArray(keys) ? keys : [keys]).includes(event.key) &&
        (!withMeta || event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeypress);
    return () => window.removeEventListener("keydown", handleKeypress);
  }, [keys, callback, withMeta]);
};
