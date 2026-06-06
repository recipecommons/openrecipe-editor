/**
 * Utilities to detect recipe context from BlockNote editor state.
 * A "recipe" is defined by an H1 block. Sections within a recipe
 * are defined by H2 blocks: Ingredients, Instructions, Notes, etc.
 */

/**
 * Returns all blocks as a flat array with their index.
 */
function getIndexedBlocks(editor) {
  return editor.document.map((block, index) => ({ block, index }));
}

/**
 * Finds the index of the block where the cursor currently is.
 */
function getCursorBlockIndex(editor) {
  const cursorBlock = editor.getTextCursorPosition().block;
  const blocks = editor.document;
  return blocks.findIndex((b) => b.id === cursorBlock.id);
}

/**
 * Returns the context of the cursor position:
 * - recipeBlock: the H1 block that starts the current recipe (or null)
 * - recipeIndex: index of that H1 in the document
 * - sectionBlock: the H2 block of the current section (or null)
 * - sectionName: normalized name of the section ("ingredients", "instructions", "notes", etc.)
 * - hasRecipes: whether the document has any H1 blocks
 */
export function getRecipeContext(editor) {
  const indexed = getIndexedBlocks(editor);
  const cursorIndex = getCursorBlockIndex(editor);

  const hasRecipes = indexed.some(
    ({ block }) => block.type === "heading" && block.props?.level === 1
  );

  if (!hasRecipes) {
    return { recipeBlock: null, recipeIndex: -1, sectionBlock: null, sectionName: null, hasRecipes: false };
  }

  // Walk backwards from cursor to find the nearest H1 (recipe) and H2 (section)
  let recipeBlock = null;
  let recipeIndex = -1;
  let sectionBlock = null;
  let sectionName = null;

  for (let i = cursorIndex; i >= 0; i--) {
    const { block } = indexed[i];

    if (block.type === "heading") {
      if (block.props?.level === 2 && !sectionBlock) {
        sectionBlock = block;
        const text = blockText(block).toLowerCase().trim();
        sectionName = text;
      }
      if (block.props?.level === 1 && !recipeBlock) {
        recipeBlock = block;
        recipeIndex = i;
        break;
      }
    }
  }

  return { recipeBlock, recipeIndex, sectionBlock, sectionName, hasRecipes };
}

/**
 * Finds the index just before the next H1 or H2 at the same or higher level,
 * i.e., the end of the current section.
 */
export function getSectionEndIndex(editor, fromIndex, currentLevel) {
  const blocks = editor.document;
  for (let i = fromIndex + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "heading" && b.props?.level <= currentLevel) {
      return i - 1;
    }
  }
  return blocks.length - 1;
}

/**
 * Finds or creates the Ingredients H2 section within the current recipe,
 * returns the index of the last block in that section.
 */
export function findOrCreateSection(editor, recipeIndex, sectionTitle) {
  const blocks = editor.document;
  const normalized = sectionTitle.toLowerCase();

  // Find the H2 with matching title within this recipe
  let sectionIndex = -1;
  for (let i = recipeIndex + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "heading" && b.props?.level === 1) break; // next recipe
    if (b.type === "heading" && b.props?.level === 2) {
      if (blockText(b).toLowerCase().trim() === normalized) {
        sectionIndex = i;
        break;
      }
    }
  }

  if (sectionIndex !== -1) {
    // Return last block of this section
    return getSectionEndIndex(editor, sectionIndex, 2);
  }

  // Section doesn't exist — create it at end of recipe
  const endIndex = getSectionEndIndex(editor, recipeIndex, 1);
  const insertAfter = blocks[endIndex];
  editor.insertBlocks(
    [{ type: "heading", props: { level: 2 }, content: [{ type: "text", text: sectionTitle }] }],
    insertAfter,
    "after"
  );
  // Now it's at endIndex + 1
  return endIndex + 1;
}

/**
 * Extracts plain text from a block's content array.
 */
function blockText(block) {
  if (!block.content || !Array.isArray(block.content)) return "";
  return block.content.map((n) => n.text || "").join("");
}
