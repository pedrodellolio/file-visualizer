import FileForm from "./components/file-form";
import Alert from "./components/alert";
import JSONVisualizer from "./components/file-visualizer";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { useFileUpload } from "./hooks/use-file-upload";

function App() {
  const { parsedJSON, content, error } = useFileUpload();

  return (
    <>
      {!parsedJSON && (
        <div className="flex flex-col justify-center items-center h-screen">
          <FileForm />
          {error && <Alert type="danger" message={error} className="mt-4" />}
        </div>
      )}

      {parsedJSON && (
        <section className="flex h-screen flex-col lg:flex-row items-center justify-center gap-4">
          <div className="h-full w-[900px]">
            <CodeMirror
              value={content ?? ""}
              height="100%"
              width="100%"
              extensions={[json()]}
              theme={"dark"}
              className="h-full w-full"
            />
          </div>
          <div className="w-full h-full">
            <JSONVisualizer json={parsedJSON} />
          </div>
        </section>
      )}
    </>
  );
}

export default App;
