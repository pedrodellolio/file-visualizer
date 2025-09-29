import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import { FileUploadProvider } from "./hooks/use-file-upload.provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FileUploadProvider>
      <App />
    </FileUploadProvider>
  </StrictMode>
);
