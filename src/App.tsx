import { useState, type ChangeEvent } from "react";

function App() {
  const [file, setFile] = useState<File | undefined>();
  const [parsedObject, setParsedObject] = useState<Record<
    string,
    unknown
  > | null>({});
  const [error, setError] = useState<string | null>("");

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const result = safeParseJSON(text);
      if (result) {
        setParsedObject(result);
        setError(null);
      } else {
        setParsedObject(null);
        setError("The file does not contain a valid JSON object or array.");
      }
    } catch (err) {
      console.error("File reading error:", err);
      setParsedObject(null);
      setError("Error reading file.");
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
    <>
      <form>
        <input type="file" accept=".json,.xml" onChange={handleUpload}></input>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <main>
        {file && <h1>File Uploaded: {file.name}</h1>}
        {parsedObject && (
          <>
            <pre>{JSON.stringify(parsedObject, null, 2)}</pre>
          </>
        )}
        {parsedObject &&
          Object.entries(parsedObject as Record<string, unknown>).map(
            ([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </div>
            )
          )}
        <button className="btn w-64 rounded-full">Button</button>
      </main>
    </>
  );
}

export default App;
