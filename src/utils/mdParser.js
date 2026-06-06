/**
 * Parses a RecipeMD markdown string into BlockNote-compatible blocks.
 * Handles the RecipeMD ingredient syntax: - *amount unit* name, notes
 */

// Regex: - *amount unit* name, optional notes
const INGREDIENT_RE = /^-\s+\*([^*]+)\*\s+(.+)$/;
// Also handle: - name (no amount)
const INGREDIENT_BARE_RE = /^-\s+(?!\*)(.+)$/;

/**
 * Convert a RecipeMD markdown body (no front matter) into BlockNote blocks.
 * We parse manually to preserve ingredient structure.
 */
export function parseRecipeMDToBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // H1 heading
    if (line.startsWith("# ")) {
      blocks.push({
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: line.slice(2).trim() }],
      });
      i++; continue;
    }

    // H2 heading
    if (line.startsWith("## ")) {
      blocks.push({
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: line.slice(3).trim() }],
      });
      i++; continue;
    }

    // H3 heading
    if (line.startsWith("### ")) {
      blocks.push({
        type: "heading",
        props: { level: 3 },
        content: [{ type: "text", text: line.slice(4).trim() }],
      });
      i++; continue;
    }

    // Horizontal rule --- (section separator in RecipeMD)
    if (line.trim() === "---") { i++; continue; }

    // Ingredient: - *amount unit* name, notes
    const ingMatch = line.match(INGREDIENT_RE);
    if (ingMatch) {
      const amountUnit = ingMatch[1].trim();
      const rest = ingMatch[2].trim();

      // Split amount and unit: first token is amount, rest is unit
      const [amount, ...unitParts] = amountUnit.split(" ");
      const unit = unitParts.join(" ");

      // Split name and notes at first comma
      const commaIdx = rest.indexOf(",");
      const name = commaIdx === -1 ? rest : rest.slice(0, commaIdx).trim();
      const notes = commaIdx === -1 ? "" : rest.slice(commaIdx + 1).trim();

      blocks.push({
        type: "ingredient",
        props: { amount, unit, name, notes },
      });
      i++; continue;
    }

    // Bare ingredient (no amount): - name
    if (line.match(/^-\s+/) && !line.match(/^-\s+\[/)) {
      const bare = line.replace(/^-\s+/, "").trim();
      blocks.push({
        type: "ingredient",
        props: { amount: "", unit: "", name: bare, notes: "" },
      });
      i++; continue;
    }

    // Italics-only line (RecipeMD tags): *tag1, tag2*
    if (line.match(/^\*[^*]+\*$/) && !line.startsWith("**")) {
      blocks.push({
        type: "paragraph",
        content: [{ type: "text", text: line, styles: { italic: true } }],
      });
      i++; continue;
    }

    // Bold line (RecipeMD yield): **4 servings**
    if (line.match(/^\*\*[^*]+\*\*$/)) {
      blocks.push({
        type: "paragraph",
        content: [{ type: "text", text: line.replace(/\*\*/g, ""), styles: { bold: true } }],
      });
      i++; continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    let text = line;
    blocks.push({
      type: "paragraph",
      content: text.trim() ? [{ type: "text", text: text.trim() }] : [],
    });
    i++;
  }

  return blocks;
}

/**
 * Strip YAML front matter from a markdown string.
 */
export function stripFrontMatter(md) {
  if (!md || !md.trimStart().startsWith("---")) return { body: md, frontMatter: {} };
  const rest = md.trimStart().slice(3);
  const end = rest.indexOf("\n---");
  if (end === -1) return { body: md, frontMatter: {} };
  const fmRaw = rest.slice(0, end).trim();
  const body = rest.slice(end + 4).trimStart();

  // Parse front matter key: value pairs
  const frontMatter = {};
  fmRaw.split("\n").forEach(line => {
    const colon = line.indexOf(":");
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    // Handle YAML arrays: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map(v => v.trim()).join(", ");
    }
    frontMatter[key] = value;
  });

  return { body, frontMatter };
}
