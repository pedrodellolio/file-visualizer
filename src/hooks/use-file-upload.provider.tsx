import React, { useState, useCallback, useEffect } from "react";
import { FileUploadContext } from "./use-file-upload.context";
import { safeParseJSON, safeParseXML } from "../parsers";

export const FileUploadProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [mode, setMode] = useState<"json" | "xml">("json");
  const [error, setError] = useState<string | null>("");
  const [content, setContent] = useState<string>("");
  const [parsedObject, setParsedObject] = useState<Record<
    string,
    unknown
  > | null>(null);

  const safeParseJSONCallback = useCallback(
    (jsonString: string) => safeParseJSON(jsonString),
    []
  );

  const safeParseXMLCallback = useCallback(
    (xmlString: string) => safeParseXML(xmlString),
    []
  );

  const updateParsedObject = (content: string) => {
    const parsed =
      mode === "json"
        ? safeParseJSONCallback(content)
        : safeParseXMLCallback(content);
    parsed && setParsedObject(parsed);
  };

  useEffect(() => {
    setError(null);
    // setContent("");
    updateParsedObject(content);
  }, [content, safeParseJSON]);

  useEffect(() => {
    if (mode === "json") setContent("{}");
    else setContent("<node></node>");
  }, [mode]);

  return (
    <FileUploadContext.Provider
      value={{
        error,
        content,
        parsedObject,
        mode,
        setContent,
        setMode,
      }}
    >
      {children}
    </FileUploadContext.Provider>
  );
};
