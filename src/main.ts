import { MarkdownView, Plugin, TFile } from 'obsidian';
import { Recipe, Ingredient, Timer } from 'cooklang';

import { MinimalCooklangSettings, DEFAULT_SETTINGS, MinimalCooklangSettingsTab } from './Settings'
import { IngredientSuggestModal } from './IngredientSuggest';
import { HighlightRecipeKeywords, PrependIngredientsHeader } from './MarkdownPostProcessor';
import { EditorPlugin } from './Editor';

// TODO: fix bug where, when calling the `refreshMarkdown` method, the frontmatter and document header are removed.

// TODO: Sort the editor extension decorations so we can show multiple types of widgets at the same time (ingredients and timers)

// TODO: Switch to a state editor extension / find a way to render the ingredients in preview mode

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

		this.registerEditorExtension(EditorPlugin(this));

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
		const recipe = LoadRecipe(fileContents);
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

// loadRecipe loads the contents of a string and returns the parsed 
// cooklang recipe.
export function LoadRecipe(content: string): Recipe {
	const frontMatterRegex = /^---[\s\S]+?---\s*/;
	content = content.replace(frontMatterRegex, '');

	const recipe = new Recipe(content)
	return recipe
}