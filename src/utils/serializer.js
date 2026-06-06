/**
 * Serializes a BlockNote editor document to OpenRecipe Markdown format.
 * Ingredient and RecipeStep blocks are converted to RecipeMD syntax.
 */

function blockContentToText(content) {
  if (!content || content.length === 0) return "";
  return content
    .map((node) => {
      if (node.type === "text") return node.text;
      if (node.type === "link") return node.content.map((n) => n.text).join("");
      return "";
    })
    .join("");
}

function serializeBlock(block) {
  const lines = [];

  switch (block.type) {
    case "heading": {
      const level = block.props.level || 1;
      const text = blockContentToText(block.content);
      const hashes = "#".repeat(level);
      lines.push(`${hashes} ${text}`);
      break;
    }

    case "paragraph": {
      const text = blockContentToText(block.content);
      if (text.trim()) lines.push(text);
      break;
    }

    case "bulletListItem": {
      const text = blockContentToText(block.content);
      lines.push(`- ${text}`);
      break;
    }

    case "numberedListItem": {
      const text = blockContentToText(block.content);
      lines.push(`1. ${text}`);
      break;
    }

    // RecipeMD ingredient syntax: - *amount unit* name, notes
    case "ingredient": {
      const { amount, unit, name, notes } = block.props;
      if (!name.trim()) break;
      const qty = [amount, unit].filter(Boolean).join(" ");
      const qtyPart = qty ? `*${qty}* ` : "";
      const notesPart = notes ? `, ${notes}` : "";
      lines.push(`- ${qtyPart}${name}${notesPart}`);
      break;
    }

    // RecipeMD step: paragraph with optional duration in italics
    case "recipeStep": {
      const { text, duration } = block.props;
      if (!text.trim()) break;
      const durationPart = duration ? ` — *${duration}*` : "";
      lines.push(`${text}${durationPart}`);
      break;
    }

    case "image": {
      const { url, caption } = block.props;
      const alt = caption || "image";
      if (url) lines.push(`![${alt}](${url})`);
      break;
    }

    default:
      break;
  }

  // Recursively serialize children
  if (block.children && block.children.length > 0) {
    block.children.forEach((child) => {
      const childLines = serializeBlock(child);
      childLines.forEach((l) => lines.push(`  ${l}`));
    });
  }

  return lines;
}

export function serializeToOpenRecipe(editor, frontMatter = null) {
  const blocks = editor.document;
  const lines = [];

  // Front matter — only emit if at least title or author is filled
  const hasMeta = frontMatter && (frontMatter.title || frontMatter.author);
  if (hasMeta) {
    lines.push("---");
    Object.entries(frontMatter).forEach(([key, value]) => {
      if (!value) return;
      if (key === "tags") {
        // Convert comma-separated string to YAML array
        const items = value.split(",").map(t => t.trim()).filter(Boolean);
        if (items.length > 0) lines.push(`tags: [${items.join(", ")}]`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    });
    lines.push("---");
    lines.push("");
  }

  // Body
  let prevType = null;
  blocks.forEach((block) => {
    const blockLines = serializeBlock(block);

    if (blockLines.length > 0) {
      // Add blank line before headings and after ingredient/step groups
      if (
        block.type === "heading" ||
        (prevType === "ingredient" && block.type !== "ingredient") ||
        (prevType === "recipeStep" && block.type !== "recipeStep")
      ) {
        if (lines.length > 0) lines.push("");
      }

      // RecipeMD uses --- to separate ingredient list from instructions
      if (
        prevType === "ingredient" &&
        block.type !== "ingredient" &&
        block.type !== "heading"
      ) {
        lines.push("---");
        lines.push("");
      }

      lines.push(...blockLines);
      prevType = block.type;
    }
  });

  return lines.join("\n");
}
