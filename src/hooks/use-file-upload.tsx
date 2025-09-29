import { useContext } from "react";
import {
  FileUploadContext,
  type FileUploadContextValue,
} from "./use-file-upload.context";

export const useFileUpload = (): FileUploadContextValue => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
