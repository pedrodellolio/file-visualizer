import React, {
  useState,
  useCallback,
  useEffect,
  type ChangeEvent,
} from "react";
import { FileUploadContext } from "./use-file-upload.context";

export const FileUploadProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [error, setError] = useState<string | null>("");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [parsedJSON, setParsedJSON] = useState<Record<string, unknown> | null>(
    null
  );

  const safeParseJSON = useCallback(
    /**
     * Safely parse JSON to a plain object.
     */
    (jsonString: string): Record<string, unknown> | null => {
      try {
        const parsed = JSON.parse(jsonString);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return parsed;
        }
        console.error("Parsed JSON is not a plain object.");
        return null;
      } catch (err) {
        console.error("Invalid JSON:", err);
        return null;
      }
    },
    []
  );

  const handleUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    /**
     * Handle file input change
     */
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  }, []);

  useEffect(() => {
    if (!file) {
      setContent(null);
      setParsedJSON(null);
      return;
    }

    const readFile = async () => {
      try {
        const text = await file.text();
        setContent(text);
        setParsedJSON(safeParseJSON(text));
      } catch (err) {
        setContent(null);
        setParsedJSON(null);
        setError("Error reading file:" + err);
      }
    };

    readFile();
  }, [file, safeParseJSON]);

  return (
    <FileUploadContext.Provider
      value={{ error, file, content, parsedJSON, handleUpload }}
    >
      {children}
    </FileUploadContext.Provider>
  );
};
