export default function RecipePreview({ markdown }) {
  return (
    <div className="recipe-preview">
      <div className="preview-header">
        <span>Markdown output</span>
      </div>
      <pre className="markdown-output">{markdown || "Start writing to see the output..."}</pre>
    </div>
  );
}
