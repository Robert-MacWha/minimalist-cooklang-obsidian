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
        let ingredients =  Array.from(this.plugin.settings.ingredients.values())
        if (!ingredients) return []

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
                if (filteredSet.has(e.name + e.units)) return
                filteredSet.add(e.name + e.units)
            } else {
                if (filteredSet.has(e.name)) return
                filteredSet.add(e.name)
            }

            uniqueFiltered.push(e)
        })

        uniqueFiltered = uniqueFiltered.sort((a, b) => {
            if (!a.name) return 1
            if (!b.name) return -1

            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();

            if (nameA < nameB) {
            return -1;
            }
            if (nameA > nameB) {
            return 1;
            }

            // names must be equal
            return 0;
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
        let cursorPos: EditorPosition = {line: this.context.end.line, ch: this.context.start.ch}
        if (this.plugin.settings.autocompleteWithUnits && suggestion.units) {
            cursorPos.ch += ingredientStr.length + 1
            ingredientStr += "{%" + suggestion.units + "}"
        } else {
            ingredientStr += "{}"
            cursorPos.ch += ingredientStr.length
        }
        activeView.editor.replaceRange(ingredientStr, this.context.start, this.context.end);

        activeView.editor.setCursor(cursorPos)
    } 
}