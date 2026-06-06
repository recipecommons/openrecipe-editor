/**
 * Minimal RecipeMD validator.
 * Only checks RecipeMD structure — front matter is optional.
 */
export function validateOpenRecipe(markdown) {
  const errors = [];
  const warnings = [];

  // Must have at least one H1
  if (!markdown.match(/^# .+/m)) {
    errors.push("No recipe title found. A recipe must have at least one # heading.");
  }

  // Must have at least one RecipeMD ingredient: - *amount* name
  if (!markdown.match(/^- \*.+\*.*/m)) {
    errors.push("No ingredients found. Use RecipeMD format: - *amount unit* ingredient name");
  }

  // Soft warning if no instructions separator
  if (!markdown.includes("\n---\n")) {
    warnings.push("No section separator (---) found. Instructions may be missing.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
