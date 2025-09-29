import React, { createContext } from "react";

export interface FileUploadContextValue {
  error: string | null;
  file: File | null;
  content: string | null;
  parsedJSON: Record<string, unknown> | null;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploadContext = createContext<
  FileUploadContextValue | undefined
>(undefined);
