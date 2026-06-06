import { useState, useCallback, useEffect } from "react";

const CC_LICENSES = [
  { value: "CC0-1.0", label: "CC0 — Public Domain" },
  { value: "CC-BY-4.0", label: "CC BY 4.0 — Attribution" },
  { value: "CC-BY-SA-4.0", label: "CC BY-SA 4.0 — Share Alike" },
  { value: "CC-BY-NC-4.0", label: "CC BY-NC 4.0 — Non-Commercial" },
  { value: "CC-BY-NC-SA-4.0", label: "CC BY-NC-SA 4.0 — Non-Commercial + Share Alike" },
];

// Shared state outside component so RecipeEditor can read it
let _meta = {
  title: "", author: "", license: "CC-BY-SA-4.0",
  lang: "en", origin: "", tags: "",
};
let _onChange = null;

export function useFrontMatterData() {
  return _meta;
}

export function FrontMatterPanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState(_meta);

  _onChange = onChange;

  // Listen for imported front matter from file
  useEffect(() => {
    const handler = (e) => {
      const fm = e.detail;
      const updated = {
        title: fm.title || "",
        author: fm.author || "",
        license: fm.license || "CC-BY-SA-4.0",
        lang: fm.lang || "en",
        origin: fm.origin || "",
        tags: Array.isArray(fm.tags) ? fm.tags.join(", ") : (fm.tags || ""),
      };
      setMeta(updated);
      _meta = updated;
      setOpen(true); // auto-open so user sees the imported metadata
    };
    window.addEventListener("openrecipe:import-fm", handler);
    return () => window.removeEventListener("openrecipe:import-fm", handler);
  }, []);

  const update = useCallback((field) => (e) => {
    const updated = { ...meta, [field]: e.target.value };
    setMeta(updated);
    _meta = updated;
    if (_onChange) _onChange();
  }, [meta]);

  return (
    <div className="frontmatter-panel">
      <button className="frontmatter-toggle" onClick={() => setOpen(v => !v)}>
        <span>📋 Book Metadata</span>
        <span className={`toggle-arrow ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="frontmatter-fields">
          <div className="fm-row">
            <div className="fm-field">
              <label>Title *</label>
              <input value={meta.title} onChange={update("title")} placeholder="My Recipe Book" />
            </div>
            <div className="fm-field">
              <label>Author *</label>
              <input value={meta.author} onChange={update("author")} placeholder="Your name" />
            </div>
          </div>
          <div className="fm-row">
            <div className="fm-field">
              <label>License <span className="recommended">(recommended)</span></label>
              <select value={meta.license} onChange={update("license")}>
                <option value="">— none —</option>
                {CC_LICENSES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="fm-field">
              <label>Language</label>
              <input value={meta.lang} onChange={update("lang")} placeholder="en" />
            </div>
          </div>
          <div className="fm-row">
            <div className="fm-field">
              <label>Origin</label>
              <input value={meta.origin} onChange={update("origin")} placeholder="Oaxaca, México" />
            </div>
            <div className="fm-field">
              <label>Tags</label>
              <input value={meta.tags} onChange={update("tags")} placeholder="mexican, vegan, traditional" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
