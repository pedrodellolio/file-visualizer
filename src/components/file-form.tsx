import type { ChangeEvent } from "react";

interface Props {
  onSubmit: (parsedObject: Record<string, unknown> | null) => void;
}

export default function FileForm({ onSubmit }: Props) {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    try {
      const text = await selectedFile.text();
      const result = safeParseJSON(text);
      onSubmit(result);
    } catch (err) {
      console.error("File reading error:", err);
    }
  };

  const safeParseJSON = (
    jsonString: string
  ): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(jsonString);

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      } else {
        console.error("Parsed JSON is not a plain object.");
        return null;
      }
    } catch (error) {
      console.error("Invalid JSON:", error);
      return null;
    }
  };

  return (
    <form>
      <input
        type="file"
        accept=".json,.xml"
        className="file-input"
        onChange={handleUpload}
      ></input>
    </form>
  );
}
