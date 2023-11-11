import { syntaxTree } from "@codemirror/language";
import { Extension, RangeSetBuilder, EditorState, RangeSet, StateField, Transaction } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType,
} from "@codemirror/view";

import MinimalCooklang, { LoadRecipe } from "./main"
import { Ingredient, Timer } from "cooklang";
import { RenderIngredient, SpanString } from "./Renderer";
import { MinimalCooklangSettings } from "./Settings";

export function CreateEditorPlugin(plugin: MinimalCooklang) {
    return StateField.define<DecorationSet>({
        create(state): DecorationSet {
            return Decoration.none;
        },
        update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
            return buildDecorations(transaction.state, plugin)
        },
        provide(field: StateField<DecorationSet>): Extension {
            return EditorView.decorations.from(field);
        },
    });
}

function buildDecorations(state: EditorState, plugin: MinimalCooklang): RangeSet<Decoration> {
    const builder = new RangeSetBuilder<Decoration>();

    syntaxTree(state).iterate({
        enter(node) {
            if (node.name != "Document") return

            const text = state.doc.sliceString(node.from, node.to);
            const recipe = LoadRecipe(text)

            //* Prepend ingredients


            //* Render highlights
            // Render ingredients
            recipe.ingredients.forEach((i) => {
                if (!i.raw) return
                const from = text.indexOf(i.raw)
                const to = from + i.raw.length

                if (inSelectionRange(state, from, to)) return

                builder.add(
                    from,
                    to,
                    Decoration.replace({
                        widget: new ingredientWidget(i, plugin.settings)
                    })
                )
            })

            // Render timers
            recipe.timers.forEach((t) => {
                if (!t.raw) return
                const from = text.indexOf(t.raw)
                const to = from + t.raw.length

                if (inSelectionRange(state, from, to)) return

                builder.add(
                    from,
                    to,
                    Decoration.replace({
                        widget: new timerWidget(t)
                    })
                )
            })
        }
    });

    return builder.finish()
}

function inSelectionRange(state: EditorState, from: number, to: number): boolean {
    for (const range of state.selection.ranges) {
        if (from <= range.to && range.from < to) {
            return true;
        }
    }

    return false
}

class ingredientWidget extends WidgetType {
    ingredient: Ingredient
    settings: MinimalCooklangSettings
    constructor(i: Ingredient, settings: MinimalCooklangSettings) {
        super();
        this.ingredient = i;
        this.settings = settings
    }

    toDOM(view: EditorView): HTMLElement {
        const ingredientText = RenderIngredient(this.ingredient, this.settings.showIngredientAmounts)
        const ingredientHTML = SpanString(ingredientText, this.settings.highContrast)

        // Attach an event listener to the ingredientHTML element
        ingredientHTML.addEventListener('click', (e) => openOnClick(view, e));

        return ingredientHTML;
    }
}

class timerWidget extends WidgetType {
    timer: Timer

    constructor(t: Timer) {
        super()
        this.timer = t
    }

    toDOM(view: EditorView): HTMLElement {
        const span = document.createElement("span");
        span.className = "timer";
        span.textContent = this.timer.name ?? "timer";
        return span;
    }
}

function openOnClick(view: EditorView, event: MouseEvent) {
    event.preventDefault();

    // Find the position in the document that corresponds to this widget
    if (!event.targetNode) return
    const pos = view.posAtDOM(event.targetNode, 0);

    // Set the editor's cursor to that position
    view.dispatch(view.state.update({
        selection: { anchor: pos }
    }));
}
