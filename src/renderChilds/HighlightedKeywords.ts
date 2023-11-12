import { MarkdownRenderChild } from "obsidian";
import MinimalCooklang from "../main";
import { RenderCookware, RenderIngredient, RenderTimer } from "../Renderer";
import { Cookware, Ingredient, Recipe } from "cooklang";

export class RecipeKeywordHighlighterMDRC extends MarkdownRenderChild {
    plugin: MinimalCooklang;
    textNode: ChildNode
    private textContent: string | null

    constructor(containerEl: HTMLElement, plugin: MinimalCooklang, textNode: ChildNode) {
        super(containerEl)
        this.plugin = plugin
        this.textNode = textNode

        this.textContent = this.textNode.textContent
    }

    onload(): void {
        if (!this.textContent) return
        const settings = this.plugin.settings
        const recipe = new Recipe(this.textContent)

        // reset the textNode
        this.textNode.textContent = this.textContent
        let element = this.textNode
        let elementTextContent = element.textContent ?? ""

        let allItems = [...recipe.timers, ...recipe.ingredients, ...recipe.cookware]
            .filter(item => item.raw) // Ensure they have a 'raw' property
            .map(item => ({
                type: item instanceof Cookware ? 'cookware' : item instanceof Ingredient ? 'ingredient' : 'timer',
                item,
                pos: elementTextContent.indexOf(item.raw ?? "")
            }));

        // Sort the combined items based on their position
        allItems.sort((a, b) => a.pos - b.pos);

        // Render widgets for each item in sorted order
        allItems.forEach(({ type, item, pos }) => {
            let lineHTML
            switch (type) {
                case 'timer':
                    lineHTML = RenderTimer(item, settings.showIngredientAmounts, settings.highContrast)
                    break;
                case 'ingredient':
                    lineHTML = RenderIngredient(item, settings.reformatTime, settings.highContrast)
                    break;
                case 'cookware':
                    lineHTML = RenderCookware(item, settings.highContrast)
                    break;
                default:
                    return
            }

            if (!element.textContent) return
            if (!item.raw) return
            const [before, after] = element.textContent.split(item.raw);
            const afterNode = document.createTextNode(after)
            element.replaceWith(document.createTextNode(before), lineHTML, afterNode);
            element = afterNode
        });
    }

    onunload(): void {
        this.containerEl.empty();
    }

    refresh(): void {
        // this.onload()

        if (!this.textContent) return

        // reset the textNode
        this.containerEl.empty()
        this.textNode.empty()
        this.textNode.textContent = this.textContent
        console.log(this.textContent)
    }
}