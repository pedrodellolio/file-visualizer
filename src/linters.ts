import type { EditorView } from "@uiw/react-codemirror";

export const jsonLinter = () => {
  return (view: EditorView) => {
    const diagnostics: any[] = [];
    const text = view.state.doc.toString();
    try {
      JSON.parse(text);
    } catch (e: any) {
      const message = e.message || "Invalid JSON format";
      diagnostics.push({
        from: 0,
        to: text.length,
        severity: "error",
        message,
      });
    }
    return diagnostics;
  };
};

export const xmlLinter = () => {
  return (view: EditorView) => {
    const diagnostics: any[] = [];
    const text = view.state.doc.toString();

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "application/xml");

      const parserErrors = xmlDoc.getElementsByTagName("parsererror");
      if (parserErrors.length > 0) {
        const message = parserErrors[0].textContent || "Invalid XML format";
        diagnostics.push({
          from: 0,
          to: text.length,
          severity: "error",
          message,
        });
      }
    } catch (e: any) {
      const message = e.message || "Invalid XML format";
      diagnostics.push({
        from: 0,
        to: text.length,
        severity: "error",
        message,
      });
    }

    return diagnostics;
  };
};
