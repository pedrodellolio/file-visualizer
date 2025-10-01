import { createContext, type Dispatch, type SetStateAction } from "react";

export interface FileUploadContextValue {
  error: string | null;
  content: string;
  parsedObject: Record<string, unknown> | null;
  setContent: Dispatch<SetStateAction<string>>;
  mode: "json" | "xml";
  setMode: Dispatch<SetStateAction<"json" | "xml">>;
}

export const FileUploadContext = createContext<
  FileUploadContextValue | undefined
>(undefined);
