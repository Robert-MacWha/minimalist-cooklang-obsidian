import { Recipe } from "cooklang";
import { MarkdownPostProcessorContext } from "obsidian";
import MinimalCooklang, { IsRecipe, LoadRecipe } from "./main";
import { RenderCookware, RenderIngredient, RenderIngredientsList, RenderTimer } from "./Renderer"
import { RecipeKeywordHighlighterMDRC } from "./renderChilds/HighlightedKeywords";

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

export function HighlightRecipeKeywords(
    element: HTMLElement,
    context: MarkdownPostProcessorContext,
    plugin: MinimalCooklang,
) {
    if (!context.frontmatter) return []
    if (!IsRecipe(context.frontmatter.tags)) return []

    const renderChildren = highlightRecipeKeywords(element, context, plugin)

    plugin.recipeKeywordHighlighterMDRCs = plugin.recipeKeywordHighlighterMDRCs.concat(renderChildren)
}

function highlightRecipeKeywords(
    element: HTMLElement,
    context: MarkdownPostProcessorContext,
    plugin: MinimalCooklang,
    renderChildren: RecipeKeywordHighlighterMDRC[] = [],
): RecipeKeywordHighlighterMDRC[] {
    if (element.nodeType === Node.ELEMENT_NODE && !element.classList.contains('frontmatter')) {
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                if (!node.textContent) return

                const highlighter = new RecipeKeywordHighlighterMDRC(element, plugin, node);
                context.addChild(highlighter);
                renderChildren.push(highlighter);
            } else {
                const recursiveRenderChildren = highlightRecipeKeywords(node as HTMLElement, context, plugin, renderChildren);
                renderChildren = renderChildren.concat(recursiveRenderChildren)

            }
        })
    }

    return renderChildren
}