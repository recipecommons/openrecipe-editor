import { createReactBlockSpec } from "@blocknote/react";

export const IngredientBlock = createReactBlockSpec(
  {
    type: "ingredient",
    propSchema: {
      amount: { default: "" },
      unit: { default: "" },
      name: { default: "" },
      notes: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { amount, unit, name, notes } = block.props;

      const update = (field) => (e) => {
        editor.updateBlock(block, {
          props: { ...block.props, [field]: e.target.value },
        });
      };

      return (
        <div className="ingredient-block">
          <span className="ingredient-bullet">–</span>
          <input className="ing-input ing-amount" placeholder="qty" value={amount} onChange={update("amount")} />
          <input className="ing-input ing-unit" placeholder="unit" value={unit} onChange={update("unit")} />
          <input className="ing-input ing-name" placeholder="ingredient" value={name} onChange={update("name")} />
          <input className="ing-input ing-notes" placeholder="notes (optional)" value={notes} onChange={update("notes")} />
        </div>
      );
    },
  }
)(); // <-- called with ()
