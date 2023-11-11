import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang, { IsRecipe, LoadRecipe } from "./main";
import {RenderIngredient, RenderTimer, SpanString} from "./Renderer"

export async function PrependIngredientsHeader(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!context.frontmatter) return
    if (!plugin.settings.showIngredientsList) return
    if (!IsRecipe(context.frontmatter.tags)) return
    if (!element.querySelector("pre.frontmatter")) return   

    const fileContents = plugin.app.workspace.activeEditor?.editor?.getValue()
    if (!fileContents) return
    
    const recipe = LoadRecipe(fileContents)
    if (!recipe) return

    let ingredientsHTML = element.createEl("div")
    ingredientsHTML.addClass("mc-plugin-ingredients")
    ingredientsHTML.createEl("h1", {text: "Ingredients"})
    const ingredientsList = ingredientsHTML.createEl("ul")

    recipe.ingredients.forEach(i => {
        let ingredient = RenderIngredient(i, true)
        ingredientsList.createEl("li", {text: ingredient})
    });

    ingredientsHTML.createEl("h1", {text: "Steps"})
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
            line = line.replace(e.raw, SpanString(RenderIngredient(e, plugin.settings.showIngredientAmounts), plugin.settings.highContrast))
        })

        const timers = lineRecipe.timers
        timers.forEach(e => {
            if (!e.raw) return
            line = line.replace(e.raw, SpanString(RenderTimer(e, true), plugin.settings.highContrast))
        })

        p.innerHTML = line
    });
}