import { App, MarkdownView, EditorSuggest, EditorSuggestContext, EditorPosition, Editor, TFile, EditorSuggestTriggerInfo, Instruction } from "obsidian";
import MinimalCooklang from "../main";
import { Ingredient } from "cooklang";

export class IngredientSuggestModal extends EditorSuggest<Ingredient> {
    plugin: MinimalCooklang;

    constructor(app: App, plugin: MinimalCooklang) {
        super(app);
        this.app = app
        this.plugin = plugin
    }

    getSuggestions(context: EditorSuggestContext): Ingredient[] {
        if (!this.plugin.ingredientDatabase) return []

        const ingredients = Array.from(this.plugin.ingredientDatabase.values())
        const query = context.query

        // filter out ingredients not starting with the prefix
        const filtered = ingredients.filter((ingredient) => {
            if (!ingredient.name) return false
            return ingredient.name.startsWith(query)
        });

        // filter out duplicate ingredients
        let uniqueFiltered: Ingredient[] = []
        let filteredSet: Set<string> = new Set<string>()

        filtered.forEach(e => {
            if (!e.name) return

            if (this.plugin.settings.autocompleteWithUnits) {
                if (!e.raw) return
                if (filteredSet.has(e.raw)) return
                filteredSet.add(e.raw)
            } else {
                if (filteredSet.has(e.name)) return
                filteredSet.add(e.name)
            }

            uniqueFiltered.push(e)
        })

        return uniqueFiltered
    }

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
        if (!this.plugin.settings.autocomplete) return null
        
        //? Ensure the trigger is correct
        const triggerPhrase = "@"
        const startPos = this.context?.start || {
            line: cursor.line,
            ch: cursor.ch - triggerPhrase.length,
        };
        
        if (!editor.getRange(startPos, cursor).startsWith(triggerPhrase)) {
            return null;
        }

        //? Ensure the trigger has preceding whitespace
        const precedingChar = editor.getRange(
            {
                line: startPos.line,
                ch: startPos.ch - 1,
            },
            startPos
        );
      
        if (precedingChar && /[`a-zA-Z0-9]/.test(precedingChar)) {
            return null;
        }

        return {
            start: startPos,
            end: cursor,
            query: editor.getRange(startPos, cursor).substring(triggerPhrase.length),
        };
    }

    renderSuggestion(suggestion: Ingredient, el: HTMLElement) {
        if (!suggestion.name) return
        el.setText(suggestion.name)

        if (this.plugin.settings.autocompleteWithUnits) {
            if (!suggestion.units) return
            el.setText(suggestion.name + " (" + suggestion.units + ")")
        }
    }

    selectSuggestion(suggestion: Ingredient, event: KeyboardEvent | MouseEvent) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            return;
        }

        if (!this.context) {
            return;
        }

        let ingredientStr = "@" + suggestion.name 
        if (this.plugin.settings.autocompleteWithUnits && suggestion.units) {
            ingredientStr += "{%" + suggestion.units + "}"
        } else {
            ingredientStr += "{}"
        }
        activeView.editor.replaceRange(ingredientStr, this.context.start, this.context.end);
    } 
}