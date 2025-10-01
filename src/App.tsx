import JSONVisualizer from "./components/file-visualizer";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { useFileUpload } from "./hooks/use-file-upload";
import { linter, lintGutter } from "@codemirror/lint";
import { jsonLinter, xmlLinter } from "./linters";
import { indentRange } from "@codemirror/language";
import { useRef } from "react";
function App() {
  const { parsedObject, content, mode, setContent, setMode } = useFileUpload();
  const editorRef = useRef<EditorView | null>(null);
  const isJSON = mode === "json";

  function formatCode(view: EditorView) {
    const { state, dispatch } = view;
    const transaction = state.changeByRange((range) => {
      const changes = indentRange(state, 0, state.doc.length);
      return { changes, range };
    });
    dispatch(transaction);
  }

  return (
    <>
      <section className="flex h-screen flex-col lg:flex-row items-center justify-center">
        <div className="h-full w-[900px]">
          <div className="h-full flex flex-col items-end">
            <header className="flex flex-row items-center justify-between w-full px-2 py-1">
              <h1>File Visualizer</h1>

              <button
                onClick={() => {
                  if (editorRef.current) {
                    formatCode(editorRef.current);
                  }
                }}
              >
                Format
              </button>
              <select
                className="select-ghost select-xs dark"
                onChange={(e) => setMode(e.target.value as "json" | "xml")}
              >
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            </header>
            <CodeMirror
              value={content}
              height="100%"
              width="100%"
              onCreateEditor={(view) => {
                editorRef.current = view;
              }}
              extensions={[
                isJSON ? json() : xml(),
                lintGutter(),
                linter(isJSON ? jsonLinter() : xmlLinter()),
              ]}
              theme={"dark"}
              className="h-full w-full"
              onChange={setContent}
            />
          </div>
        </div>
        <div className="w-full h-full">
          <JSONVisualizer json={parsedObject} />
        </div>
      </section>
    </>
  );
}

export default App;
