import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    PluginValue,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { editorLivePreviewField, livePreviewState } from "obsidian";

import MinimalCooklang, { LoadRecipe } from "./main"
import { Ingredient, Timer } from "cooklang";
import { RenderIngredient, SpanString } from "./Renderer";
import { MinimalCooklangSettings } from "./Settings";

export function EditorPlugin(plugin: MinimalCooklang) {
    function createEditorPlugin(view: EditorView) {
        return new editorPlugin(view, plugin);
    }

    const vp = ViewPlugin.define(createEditorPlugin, {
        decorations: v => v.decorations
    });

    return vp
}

class editorPlugin implements PluginValue {
    decorations: DecorationSet
    plugin: MinimalCooklang

    constructor(view: EditorView, plugin: MinimalCooklang) {
        this.plugin = plugin
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        //? only active when in LP mode
        if (!update.state.field(editorLivePreviewField)) {
            this.decorations = Decoration.none;
            return;
        }

        if (update.view.composing || update.view.plugin(livePreviewState)?.mousedown) {
            this.decorations = this.decorations.map(update.changes);
            return
        }

        if (
            update.selectionSet ||
            update.viewportChanged ||
            update.docChanged
        ) {
            this.decorations = this.buildDecorations(update.view);
            return
        }
    }

    private buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        for (const { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from, to, enter: (node) => {
                    if (node.name != "Document") return

                    const text = view.state.sliceDoc(node.from, node.to);
                    const recipe = LoadRecipe(text)

                    // Render ingredients
                    recipe.ingredients.forEach((i) => {
                        if (!i.raw) return
                        const from = text.indexOf(i.raw)
                        const to = from + i.raw.length

                        if (this.inSelectionRange(view, from, to)) return

                        builder.add(
                            from,
                            to,
                            Decoration.replace({
                                widget: new IngredientWidget(i, this.plugin.settings)
                            })
                        )
                    })

                }
            });
        }

        return builder.finish();
    }

    private inSelectionRange(view: EditorView, from: number, to: number): boolean {
        for (const range of view.state.selection.ranges) {
            if (from <= range.to && range.from < to) {
                return true;
            }
        }

        return false
    }
}

class IngredientWidget extends WidgetType {
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

        const div = document.createElement("span");
        div.innerHTML = ingredientHTML;
        return div;
    }
}

class TimerWidget extends WidgetType {
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