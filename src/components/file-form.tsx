import { useFileUpload } from "../hooks/use-file-upload";

export default function FileForm() {
  const { handleUpload } = useFileUpload();

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
