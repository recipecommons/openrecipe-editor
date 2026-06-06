import { useState, useRef } from "react";
import RecipeEditor from "./components/RecipeEditor";
import RecipePreview from "./components/RecipePreview";
import { validateOpenRecipe } from "./utils/validator";
import "./App.css";

export default function App() {
  const [markdown, setMarkdown] = useState("");
  const [view, setView] = useState("editor");
  const [importError, setImportError] = useState(null);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importedMd, setImportedMd] = useState(null);
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipe.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportWarnings([]);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.endsWith(".md")) {
      setImportError("Only .md files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const result = validateOpenRecipe(content);

      if (!result.valid) {
        setImportError(result.errors.join(" "));
        return;
      }

      setImportWarnings(result.warnings);
      setImportedMd(content);
      setEditorKey((k) => k + 1);
    };
    reader.readAsText(file);
  };

  const dismissBanner = () => {
    setImportError(null);
    setImportWarnings([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🍳</span>
          <span className="brand-name">OpenRecipe</span>
          <span className="brand-sub">by Recipe Commons</span>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${view === "editor" ? "active" : ""}`} onClick={() => setView("editor")}>Editor</button>
          <button className={`nav-btn ${view === "preview" ? "active" : ""}`} onClick={() => setView("preview")}>Preview</button>
          <button className={`nav-btn ${view === "split" ? "active" : ""}`} onClick={() => setView("split")}>Split</button>
        </nav>
        <div className="header-actions">
          <input ref={fileInputRef} type="file" accept=".md" style={{ display: "none" }} onChange={handleFileChange} />
          <button className="action-btn" onClick={handleImportClick}>↑ Import MD</button>
          <button className="action-btn action-btn-primary" onClick={handleExport}>↓ Export MD</button>
        </div>
      </header>

      {importError && (
        <div className="banner banner-error">
          <span>⚠ {importError}</span>
          <button className="banner-close" onClick={dismissBanner}>✕</button>
        </div>
      )}
      {importWarnings.length > 0 && (
        <div className="banner banner-warning">
          <span>ℹ {importWarnings.join(" ")}</span>
          <button className="banner-close" onClick={dismissBanner}>✕</button>
        </div>
      )}

      <main className={`app-main view-${view}`}>
        {(view === "editor" || view === "split") && (
          <div className="editor-pane">
            <RecipeEditor
              key={editorKey}
              onChange={setMarkdown}
              initialMarkdown={importedMd}
            />
          </div>
        )}
        {(view === "preview" || view === "split") && (
          <div className="preview-pane">
            <RecipePreview markdown={markdown} />
          </div>
        )}
      </main>
    </div>
  );
}
