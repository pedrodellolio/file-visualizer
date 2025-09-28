import { useState } from "react";
import FileForm from "./components/file-form";
import Alert from "./components/alert";
import Card from "./components/card";
import JSONVisualizer from "./components/file-visualizer";

function App() {
  const [parsedObject, setParsedObject] = useState<Record<
    string,
    unknown
  > | null>();
  const [error, setError] = useState<string | null>("");

  const handleFormSubmit = (parsedObject: Record<string, unknown> | null) => {
    try {
      if (parsedObject) {
        setParsedObject(parsedObject);
        setError(null);
      } else {
        setParsedObject(null);
        setError("The file does not contain a valid JSON object or array.");
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error.");
    }
  };

  return (
    <>
      {!parsedObject && (
        <div className="flex flex-col justify-center items-center h-screen">
          <FileForm onSubmit={handleFormSubmit} />
          {error && <Alert type="danger" message={error} className="mt-4" />}
        </div>
      )}

      {parsedObject && (
        // Object.entries(parsedObject as Record<string, unknown>).map(
        //   ([key, value]) => (
        //     <Card key={key} prop={key} value={value} />
        //     //   <div key={key}>
        //     //     <strong>{key}:</strong> {JSON.stringify(value)}
        //     //   </div>
        //   )
        // )
        <JSONVisualizer json={parsedObject} />
      )}
    </>
  );
}

export default App;
