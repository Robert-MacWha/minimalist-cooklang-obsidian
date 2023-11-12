import { syntaxTree } from "@codemirror/language";
import {
    Extension,
    RangeSetBuilder,
    EditorState,
    RangeSet,
    StateField,
    Transaction
} from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType,
} from "@codemirror/view";

import MinimalCooklang, { LoadRecipe } from "./main"
import { Recipe, Ingredient, Timer as Cookware } from "cooklang";
import { RenderCookware, RenderIngredient, RenderIngredientsList, RenderTimer } from "./Renderer";
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
            if (
                plugin.settings.showIngredientsListPreview &&
                recipe.steps.length > 0 &&
                recipe.steps[0].raw
            ) {
                const from = text.indexOf(recipe.steps[0].raw)
                builder.add(
                    from,
                    from,
                    Decoration.widget({
                        widget: new ingredientsListWidget(recipe, plugin.settings),
                        side: -1
                    })
                )
            }

            //* Render highlights
            // Combine all items into a single array
            let allItems = [...recipe.timers, ...recipe.ingredients, ...recipe.cookware]
                .filter(item => item.raw) // Ensure they have a 'raw' property
                .map(item => ({
                    type: item instanceof Cookware ? 'timer' : item instanceof Ingredient ? 'ingredient' : 'cookware',
                    item,
                    pos: text.indexOf(item.raw ?? "")
                }));

            // Sort the combined items based on their position
            allItems.sort((a, b) => a.pos - b.pos);

            // Render widgets for each item in sorted order
            allItems.forEach(({ type, item, pos }) => {
                if (!item.raw) return
                const length = item.raw.length;
                switch (type) {
                    case 'timer':
                        renderWidget(builder, state, new timerWidget(item, plugin), pos, length);
                        break;
                    case 'ingredient':
                        renderWidget(builder, state, new ingredientWidget(item, plugin), pos, length);
                        break;
                    case 'cookware':
                        renderWidget(builder, state, new cookwareWidget(item, plugin), pos, length);
                        break;
                }
            });
        }
    });

    return builder.finish()
}

function renderWidget(builder: RangeSetBuilder<Decoration>, state: EditorState, widget: WidgetType, from: number, length: number) {
    if (inSelectionRange(state, from, from + length + 1)) return

    builder.add(
        from,
        from + length,
        Decoration.replace({
            widget
        })
    )
}

function inSelectionRange(state: EditorState, from: number, to: number): boolean {
    for (const range of state.selection.ranges) {
        if (from <= range.to && range.from < to) {
            return true;
        }
    }

    return false
}

class ingredientsListWidget extends WidgetType {
    recipe: Recipe
    settings: MinimalCooklangSettings

    constructor(recipe: Recipe, settings: MinimalCooklangSettings) {
        super()
        this.recipe = recipe
        this.settings = settings
    }

    toDOM() {
        return RenderIngredientsList(this.recipe)
    }
}

class ingredientWidget extends WidgetType {
    ingredient: Ingredient
    settings: MinimalCooklangSettings
    constructor(i: Ingredient, plugin: MinimalCooklang) {
        super();
        this.ingredient = i;
        this.settings = plugin.settings
    }

    toDOM(view: EditorView): HTMLElement {
        const ingredientHTML = RenderIngredient(this.ingredient, this.settings.showIngredientAmounts, this.settings.highContrast)
        ingredientHTML.addEventListener('click', (e) => openOnClick(view, e));
        return ingredientHTML;
    }
}

class timerWidget extends WidgetType {
    timer: Cookware
    settings: MinimalCooklangSettings

    constructor(t: Cookware, plugin: MinimalCooklang) {
        super()
        this.timer = t
        this.settings = plugin.settings
    }

    toDOM(view: EditorView): HTMLElement {
        const timerHTML = RenderTimer(this.timer, this.settings.reformatTime, this.settings.highContrast)
        timerHTML.addEventListener('click', (e) => openOnClick(view, e));
        return timerHTML;
    }
}

class cookwareWidget extends WidgetType {
    cookware: Cookware
    settings: MinimalCooklangSettings

    constructor(c: Cookware, plugin: MinimalCooklang) {
        super()
        this.cookware = c
        this.settings = plugin.settings
    }

    toDOM(view: EditorView): HTMLElement {
        const cookwareHTML = RenderCookware(this.cookware, this.settings.highContrast)
        cookwareHTML.addEventListener('click', (e) => openOnClick(view, e));
        return cookwareHTML;
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
