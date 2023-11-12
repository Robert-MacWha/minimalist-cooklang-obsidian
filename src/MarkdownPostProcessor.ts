import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang, { IsRecipe, LoadRecipe } from "./main";
import { RenderCookware, RenderIngredient, RenderIngredientsList, RenderTimer } from "./Renderer"

export async function PrependIngredientsHeader(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!context.frontmatter) return
    if (!plugin.settings.showIngredientsList) return
    if (!IsRecipe(context.frontmatter.tags)) return
    if (!element.querySelector("pre.frontmatter")) return

    const fileContents = plugin.app.workspace.activeEditor?.editor?.getValue()
    if (!fileContents) return

    const recipe = LoadRecipe(fileContents)
    if (!recipe) return

    element.append(RenderIngredientsList(recipe))
}

export function HighlightRecipeKeywords(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!context.frontmatter) return
    if (!IsRecipe(context.frontmatter.tags)) return

    highlightRecipeKeywords(element, plugin)
}

function highlightRecipeKeywords(element: HTMLElement | ChildNode, plugin: MinimalCooklang) {
    const settings = plugin.settings
    if (element.nodeType === Node.ELEMENT_NODE) {
        // @ts-ignore Typescript warns that classList does not exist on either types.  It does, I want freedom from the error
        if (element.classList && element.classList.contains('frontmatter')) {
            return
        }

        element.childNodes.forEach(node => {
            highlightRecipeKeywords(node, plugin);
        })

        return
    }


    if (element.nodeType === Node.TEXT_NODE) {
        if (!element.textContent) return
        const recipe = new Recipe(element.textContent)

        recipe.ingredients.forEach(i => {
            if (!element.textContent) return
            if (!i.raw) return
            const lineHTML = RenderIngredient(i, settings.showIngredientAmounts, settings.highContrast)

            const [before, after] = element.textContent.split(i.raw);
            const afterNode = document.createTextNode(after)
            element.replaceWith(document.createTextNode(before), lineHTML, afterNode);

            element = afterNode
        })

        recipe.timers.forEach(t => {
            if (!element.textContent) return
            if (!t.raw) return
            const lineHTML = RenderTimer(t, settings.reformatTime, settings.highContrast)

            const [before, after] = element.textContent.split(t.raw);
            const afterNode = document.createTextNode(after)
            element.replaceWith(document.createTextNode(before), lineHTML, afterNode);

            element = afterNode
        })

        recipe.cookware.forEach(c => {
            if (!element.textContent) return
            if (!c.raw) return
            const lineHTML = RenderCookware(c, settings.highContrast)

            const [before, after] = element.textContent.split(c.raw);
            const afterNode = document.createTextNode(after)
            element.replaceWith(document.createTextNode(before), lineHTML, afterNode);

            element = afterNode
        })

        return
    }
}