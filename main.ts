import { MarkdownView, Plugin, TFile } from 'obsidian';
import { Recipe, Ingredient } from 'cooklang';

import { MinimalCooklangSettings, DEFAULT_SETTINGS, MinimalCooklangSettingsTab } from './src/Settings'
import { IngredientSuggestModal } from './src/IngredientSuggest';
import { HighlightRecipeKeywords, PrependIngredientsHeader } from './src/MarkdownPostProcessor';

// TODO: fix bug where, when calling the `refreshMarkdown` method, the frontmatter and document header are removed.

// TODO: Need to figure out editor extensions so the highlighting can be viewed in the preview mode.

// TODO: Would like to write a better interpreter than cooklang, since it's annoying to write.
// maybe @ingredient (amount unit) with space seperators?  Could also try to be more inteligent with recognising units and such.

// TODO: Automatic unit conversion

// TODO: Update README

export default class MinimalCooklang extends Plugin {
	settings: MinimalCooklangSettings

	async onload() {
		await this.loadSettings()

		this.registerEvent(this.app.workspace.on('file-open', this.handleFileOpen.bind(this)))
		this.registerEditorSuggest(new IngredientSuggestModal(this.app, this))
		this.registerMarkdownPostProcessor(async (element, context) => {
			HighlightRecipeKeywords(element, context, this)
			PrependIngredientsHeader(element, context, this)
		})
	}

	async loadSettings() {
		// Object.assign lets you clone the data, so defaults are not overidden
		this.settings = Object.assign(
			{}, 
			DEFAULT_SETTINGS,
			await this.loadData(),
		)

		this.settings.ingredients = new Map(Object.entries(this.settings.ingredients));
		this.addSettingTab(new MinimalCooklangSettingsTab(this.app, this))
	}

	async saveSettings() {
		this.saveData(this.settings)
	}

	// handleFileOpen handels the app.workspace.on('file-open') event.
	async handleFileOpen(file: TFile) {
		if (!file) return;

		let tags = this.getTags(file)
		if (!IsRecipe(tags)) return;
		
		let fileContents = await this.app.vault.read(file)
		const recipe = this.loadRecipe(fileContents);
		this.addIngredientsToDatabase(recipe)
	}

	// getTags returns an ordered list of all tags present in the file.
	getTags(file: TFile): string[] {
		let cache = this.app.metadataCache.getFileCache(file);
		let tags: string[] = []
		if (!cache) return [];

		if (cache.frontmatter && cache.frontmatter.tags) {
			tags = tags.concat(cache.frontmatter.tags) 
		}

		if (cache.tags) {
			cache.tags.forEach(e => {
				let tag = e.tag
				if (tags.contains(tag)) return

				tags = tags.concat(tag)
			})
		}

		return tags
	}

	// loadRecipe loads the contents of a string and returns the parsed 
	// cooklang recipe.
	loadRecipe(content: string): Recipe {
		const frontMatterRegex = /^---[\s\S]+?---\s*/;
		content = content.replace(frontMatterRegex, '');

		const recipe = new Recipe(content)
		return recipe
	}

	// addIngredientsToDatabase adds all of a recipe's ingredients to the ingredients database
	addIngredientsToDatabase(recipe: Recipe) {
		recipe.ingredients.forEach(e => {
			if (!e.raw) return
			this.settings.ingredients[e.raw] = e
		})

		this.saveSettings()
	}

	refreshMarkdown() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return
		view.previewMode.rerender(true);
	}
}

export function IsRecipe(tags: string[]): boolean {
	const RecipeTag: string = "#Recipe"
	if (tags.contains(RecipeTag) || tags.contains(RecipeTag.replace("#", ""))) {
		return true
	}

	return false
}

export function RenderIngredient(i: Ingredient, highContrast: boolean, spanned: boolean): string {
	if (!i.name) return ""
	let iStr = i.name

	if (i.quantity && i.units) {
		iStr += " (" + i.amount + " " + i.units + ")"
	} else if (i.amount && i.amount != '1') {
		iStr += " (" + i.amount + ")"
	}

	if (!spanned) return iStr

	if (highContrast) {
		iStr = "<span class='plugin-mc-highlight plugin-mc-high-contrast'>" + iStr + "</span>"
	} else {
		iStr = "<span class='plugin-mc-highlight'>" + iStr + "</span>"
	}

	return iStr
}