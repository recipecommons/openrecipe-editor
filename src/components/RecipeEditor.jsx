import { useEffect, useCallback, useState } from "react";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { IngredientBlock } from "./blocks/IngredientBlock";
import { RecipeStepBlock } from "./blocks/RecipeStepBlock";
import { FrontMatterPanel, useFrontMatterData } from "./FrontMatterPanel";
import { serializeToOpenRecipe } from "../utils/serializer";
import { getRecipeContext, getSectionEndIndex } from "../utils/recipeContext";
import { parseRecipeMDToBlocks, stripFrontMatter } from "../utils/mdParser";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ingredient: IngredientBlock,
    recipeStep: RecipeStepBlock,
  },
});

function triggerUndo() {
  const el = document.querySelector(".bn-editor");
  if (!el) return;
  el.focus();
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
}

function triggerRedo() {
  const el = document.querySelector(".bn-editor");
  if (!el) return;
  el.focus();
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true }));
}

export default function RecipeEditor({ onChange, initialMarkdown }) {
  const editor = useCreateBlockNote({ schema });
  const [context, setContext] = useState({ hasRecipes: false });
  const [ready, setReady] = useState(false);
  const frontMatter = useFrontMatterData();

  // Load initial markdown into editor once it's ready
  useEffect(() => {
    if (!initialMarkdown || !editor || ready) return;

    const timer = setTimeout(() => {
      try {
        const { body, frontMatter: fm } = stripFrontMatter(initialMarkdown);
        const blocks = parseRecipeMDToBlocks(body);
        if (blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }
        // Populate front matter panel if present
        if (fm && Object.keys(fm).length > 0) {
          window.__openrecipe_import_fm__ = fm;
          window.dispatchEvent(new CustomEvent("openrecipe:import-fm", { detail: fm }));
        }
        setReady(true);
      } catch (e) {
        console.warn("Import parse error:", e);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [initialMarkdown, editor, ready]);

  const updateContext = useCallback(() => {
    try {
      const ctx = getRecipeContext(editor);
      setContext(ctx);
    } catch {
      setContext({ hasRecipes: false });
    }
  }, [editor]);

  const handleChange = useCallback(() => {
    updateContext();
    const md = serializeToOpenRecipe(editor, frontMatter);
    onChange(md);
  }, [editor, onChange, updateContext, frontMatter]);

  useEffect(() => {
    handleChange();
    const unsub = editor.onSelectionChange(() => updateContext());
    return unsub;
  }, [handleChange, editor, updateContext]);

  const insertInSection = (sectionTitle, block) => {
    const ctx = getRecipeContext(editor);
    if (!ctx.hasRecipes) return;
    const blocks = editor.document;
    const recipeIdx = ctx.recipeIndex;
    const normalized = sectionTitle.toLowerCase();
    let sectionIdx = -1;

    for (let i = recipeIdx + 1; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === "heading" && b.props?.level === 1) break;
      if (b.type === "heading" && b.props?.level === 2) {
        const text = (b.content || []).map((n) => n.text || "").join("").toLowerCase().trim();
        if (text === normalized) { sectionIdx = i; break; }
      }
    }

    if (sectionIdx === -1) {
      const endIdx = getSectionEndIndex(editor, recipeIdx, 1);
      const anchor = blocks[endIdx];
      editor.insertBlocks([
        { type: "heading", props: { level: 2 }, content: [{ type: "text", text: sectionTitle }] },
        block,
      ], anchor, "after");
    } else {
      const endIdx = getSectionEndIndex(editor, sectionIdx, 2);
      const anchor = blocks[endIdx];
      editor.insertBlocks([block], anchor, "after");
    }
  };

  const addIngredient = () => insertInSection("Ingredients", {
    type: "ingredient", props: { amount: "", unit: "", name: "", notes: "" },
  });
  const addStep = () => insertInSection("Instructions", {
    type: "recipeStep", props: { text: "", duration: "" },
  });
  const addNotes = () => insertInSection("Notes", {
    type: "paragraph", content: [],
  });
  const addRecipe = () => {
    const blocks = editor.document;
    const last = blocks[blocks.length - 1];
    editor.insertBlocks([
      { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "New Recipe" }] },
      { type: "paragraph", content: [{ type: "text", text: "A short description." }] },
      { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Ingredients" }] },
      { type: "ingredient", props: { amount: "", unit: "", name: "", notes: "" } },
      { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Instructions" }] },
      { type: "recipeStep", props: { text: "", duration: "" } },
    ], last, "after");
  };

  const disabled = !context.hasRecipes;

  // Custom slash menu items
  const slashMenuItems = useCallback(async (query) => {
    const items = [];

    if (!disabled) {
      items.push({
        title: "Ingredient",
        subtext: "Add an ingredient with amount and unit",
        onItemClick: addIngredient,
        group: "Recipe",
        icon: "–",
        aliases: ["ing", "ingredient"],
      });
      items.push({
        title: "Step",
        subtext: "Add an instruction step",
        onItemClick: addStep,
        group: "Recipe",
        icon: "→",
        aliases: ["step", "instruction"],
      });
      items.push({
        title: "Notes",
        subtext: "Add a notes section",
        onItemClick: addNotes,
        group: "Recipe",
        icon: "📝",
        aliases: ["note", "notes", "tip"],
      });
    }

    items.push({
      title: "New Recipe",
      subtext: "Add a new recipe to this book",
      onItemClick: addRecipe,
      group: "Recipe",
      icon: "🍳",
      aliases: ["recipe", "new"],
    });

    return items.filter(item =>
      !query ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.aliases?.some(a => a.includes(query.toLowerCase()))
    );
  }, [disabled, addIngredient, addStep, addNotes, addRecipe]);

  return (
    <div className="recipe-editor">
      <FrontMatterPanel onChange={handleChange} />
      <div className="editor-toolbar">
        <button className="toolbar-btn toolbar-icon-btn" title="Undo (Ctrl+Z)" onClick={triggerUndo}>↩</button>
        <button className="toolbar-btn toolbar-icon-btn" title="Redo (Ctrl+Y)" onClick={triggerRedo}>↪</button>
        <div className="toolbar-divider" />
        <span className="toolbar-label">Insert</span>
        <button className="toolbar-btn ingredient-btn" onClick={addIngredient} disabled={disabled}>+ Ingredient</button>
        <button className="toolbar-btn step-btn" onClick={addStep} disabled={disabled}>+ Step</button>
        <button className="toolbar-btn note-btn" onClick={addNotes} disabled={disabled}>+ Notes</button>
        <button className="toolbar-btn recipe-btn" onClick={addRecipe}>+ Recipe</button>
      </div>
      <div className="editor-body">
        {!context.hasRecipes && (
          <div className="empty-state">
            <span>🍳</span>
            <p>Start by adding your first recipe</p>
            <button className="empty-add-btn" onClick={addRecipe}>+ Add Recipe</button>
          </div>
        )}
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
          slashMenu={false}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => {
              const defaults = getDefaultReactSlashMenuItems(editor);
              const recipeItems = [];
              if (context.hasRecipes) {
                recipeItems.push({
                  title: "Ingredient",
                  subtext: "Add to Ingredients section",
                  onItemClick: addIngredient,
                  group: "Recipe",
                  icon: "–",
                  aliases: ["ing", "ingredient"],
                });
                recipeItems.push({
                  title: "Step",
                  subtext: "Add to Instructions section",
                  onItemClick: addStep,
                  group: "Recipe",
                  icon: "→",
                  aliases: ["step", "instruction"],
                });
                recipeItems.push({
                  title: "Notes",
                  subtext: "Add a Notes section",
                  onItemClick: addNotes,
                  group: "Recipe",
                  icon: "📝",
                  aliases: ["note", "notes", "tip"],
                });
              }
              recipeItems.push({
                title: "New Recipe",
                subtext: "Add a new recipe to this book",
                onItemClick: addRecipe,
                group: "Recipe",
                icon: "🍳",
                aliases: ["recipe", "new"],
              });
              const all = [...recipeItems, ...defaults];
              if (!query) return all;
              const q = query.toLowerCase();
              return all.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.aliases?.some(a => a.includes(q))
              );
            }}
          />
        </BlockNoteView>
      </div>
    </div>
  );
}
