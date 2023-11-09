import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang from "../main";

export function PostProcessRecipeMarkdown(element: HTMLElement, context: MarkdownPostProcessorContext, plugin: MinimalCooklang) {

    console.log("ProcessMarkdown")

    element.querySelectorAll('p').forEach(p => {
        let line = p.innerHTML
        const lineRecipe = new Recipe(line)
        
        const ingredients = lineRecipe.ingredients
        ingredients.forEach(e => {
            if (!e.name) return
            let replacement = e.name

            if (e.quantity && e.units) {
                replacement += " (" + e.amount + " " + e.units + ")"
            } else if (e.amount && e.amount != '1') {
                replacement += " (" + e.amount + ")"
            }

            if (plugin.settings.highContrast) {
                replacement = "<span class='plugin-mc-highlight plugin-mc-high-contrast'>" + replacement + "</span>"
            } else {
                replacement = "<span class='plugin-mc-highlight'>" + replacement + "</span>"
            }

            if (!e.raw) return
            line = line.replace(e.raw, replacement)
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