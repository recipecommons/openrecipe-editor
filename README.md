# OpenRecipe Editor

> ⚠️ **Alpha** — This editor is in early development. Expect bugs and breaking changes.

A web-based WYSIWYG editor for writing [OpenRecipe](https://github.com/recipecommons/openrecipe-spec) files — the open document format for recipe books maintained by [Recipe Commons](https://github.com/recipecommons).

**[→ Open the editor](https://editor.recipecommons.org)**

---

## What is this?

OpenRecipe Editor lets chefs and food writers create recipe books without knowing Markdown or Git. It exports valid `.md` files following the [OpenRecipe](https://github.com/recipecommons/openrecipe-spec) and [RecipeMD](https://recipemd.org) specifications.

## Features

- **Book metadata** — title, author, license, language, origin, tags
- **Ingredient blocks** — structured fields for amount, unit, name, and notes
- **Step blocks** — instruction steps with optional duration
- **Multi-recipe support** — one file can contain an entire cookbook
- **Context-aware insertion** — ingredients go to Ingredients, steps go to Instructions
- **Slash menu** — type `/` to insert any block type
- **Import / Export** — load and save `.md` files directly
- **Import validation** — checks that imported files follow RecipeMD structure
- **Split view** — edit and preview Markdown output side by side

## Status

| Feature | Status |
|---|---|
| Basic editing | ✅ Working |
| Export to OpenRecipe `.md` | ✅ Working |
| Import `.md` files | ✅ Working |
| Book metadata | ✅ Working |
| Undo / Redo | ⚠️ Via keyboard only (Ctrl+Z / Ctrl+Y) |
| Image upload | 🔜 Planned |
| Mobile support | 🔜 Planned |
| Offline support | 🔜 Planned |

## OpenRecipe format

Files produced by this editor follow the OpenRecipe specification:

```markdown
---
title: My Recipe Book
author: Jane Doe
license: CC-BY-SA-4.0
lang: en
---

# Guacamole

A classic Mexican dip.

*dip, vegan*
**4 servings**

---

- *2* avocados
- *½ tsp* salt
- *1* lime, juiced

---

Mash avocados. Add lime juice and salt. Serve immediately.
```

See the [OpenRecipe specification](https://github.com/recipecommons/openrecipe-spec) for the full format reference.

## Tech stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [BlockNote](https://blocknotejs.org) — block-based editor
- Deployed on GitHub Pages

## Local development

```bash
git clone https://github.com/recipecommons/openrecipe-editor.git
cd openrecipe-editor
npm install
npm run dev
```

## Contributing

This project is in alpha. Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/recipecommons/openrecipe-editor/issues).

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — public domain.
