import { createReactBlockSpec } from "@blocknote/react";

export const RecipeStepBlock = createReactBlockSpec(
  {
    type: "recipeStep",
    propSchema: {
      text: { default: "" },
      duration: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { text, duration } = block.props;

      const update = (field) => (e) => {
        editor.updateBlock(block, {
          props: { ...block.props, [field]: e.target.value },
        });
      };

      return (
        <div className="step-block">
          <span className="step-number">→</span>
          <textarea className="step-text" placeholder="Describe this step..." value={text} onChange={update("text")} rows={2} />
          <input className="step-duration" placeholder="time (e.g. 10 min)" value={duration} onChange={update("duration")} />
        </div>
      );
    },
  }
)(); // <-- called with ()
