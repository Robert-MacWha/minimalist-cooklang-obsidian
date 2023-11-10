import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang, { IsRecipe, RenderIngredient } from "../main";

export async function PrependIngredientsHeader(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!plugin.settings.showIngredientsInReading) return
    if (!IsRecipe(context.frontmatter.tags)) return
    if (!element.querySelector("pre.frontmatter")) return   

    const fileContents = plugin.app.workspace.activeEditor?.editor?.getValue()
    if (!fileContents) return
    
    const recipe = await plugin.loadRecipe(fileContents)
    if (!recipe) return

    let ingredientsHTML = element.createEl("div")
    ingredientsHTML.addClass("mc-plugin-ingredients")
    ingredientsHTML.createEl("h1", {text: "Ingredients"})
    const ingredientsList = ingredientsHTML.createEl("ul")

    recipe.ingredients.forEach(i => {
        // let liText = i.name

        // if (i.units && i.amount) {
        //     liText += " (" + i.amount + " " + i.units + ")"
        // } else if (i.amount) {
        //     liText += " (" + i.amount + ")"
        // }

        let ingredient = RenderIngredient(i, plugin.settings.highContrast, false)
        let li = ingredientsList.createEl("li", {text: ingredient})
    });

    ingredientsHTML.createEl("h1", {text: "Steps"})
}

export function HighlightRecipeKeywords(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {
    if (!IsRecipe(context.frontmatter.tags)) return

    element.querySelectorAll('p').forEach(p => {
        let line = p.innerHTML
        const lineRecipe = new Recipe(line)
        
        const ingredients = lineRecipe.ingredients
        ingredients.forEach(e => {
            if (!e.raw) return
            line = line.replace(e.raw, RenderIngredient(e, plugin.settings.highContrast, true))
        })

        const timers = lineRecipe.timers
        timers.forEach(e => {
            if (!e.amount || !e.units) return

            let replacement: string
            if (plugin.settings.highContrast) {
                replacement = "<span class='plugin-mc-highlight  plugin-mc-high-contrast'>" + e.amount + " " + e.units + "</span>"
            } else {
                replacement = "<span class='plugin-mc-highlight'>" + e.amount + " " + e.units + "</span>"
            }

            if (!e.raw) return
            line = line.replace(e.raw, replacement)
        })

        p.innerHTML = line
    });
}