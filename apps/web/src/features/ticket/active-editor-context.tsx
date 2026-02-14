"use client";

import type { Editor } from "@tiptap/react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type ActiveEditorContextValue = {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const ActiveEditorContext = createContext<ActiveEditorContextValue>({
  editor: null,
  setEditor: noop,
});

export function ActiveEditorProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditorState] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const setEditor = useCallback((newEditor: Editor | null) => {
    editorRef.current = newEditor;
    setEditorState(newEditor);
  }, []);

  return (
    <ActiveEditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </ActiveEditorContext.Provider>
  );
}

export function useActiveEditor() {
  return useContext(ActiveEditorContext);
}
