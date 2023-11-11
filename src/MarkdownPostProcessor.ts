import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang, { IsRecipe, LoadRecipe } from "./main";
import { RenderIngredient, RenderIngredientsList, RenderTimer, SpanString } from "./Renderer"

export async function PrependIngredientsHeader(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!context.frontmatter) return
    if (!plugin.settings.showIngredientsList) return
    if (!IsRecipe(context.frontmatter.tags)) return
    if (!element.querySelector("pre.frontmatter")) return

    const fileContents = plugin.app.workspace.activeEditor?.editor?.getValue()
    if (!fileContents) return

    const recipe = LoadRecipe(fileContents)
    if (!recipe) return

    element.append(RenderIngredientsList(recipe, plugin.settings))
}

export function HighlightRecipeKeywords(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!context.frontmatter) return
    if (!IsRecipe(context.frontmatter.tags)) return

    element.querySelectorAll('p').forEach(p => {
        let line = p.innerHTML
        const lineRecipe = new Recipe(line)

        const ingredients = lineRecipe.ingredients
        ingredients.forEach(e => {
            if (!e.raw) return
            const lineHTML = SpanString(RenderIngredient(e, plugin.settings), plugin.settings.highContrast)
            line = line.replace(e.raw, lineHTML.outerHTML)
        })

        const timers = lineRecipe.timers
        timers.forEach(e => {
            if (!e.raw) return
            const lineHTML = SpanString(RenderTimer(e, plugin.settings), plugin.settings.highContrast)
            line = line.replace(e.raw, lineHTML.outerHTML)
        })

        p.innerHTML = line
    });
}