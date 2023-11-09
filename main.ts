import { MarkdownView, Plugin, TFile } from 'obsidian';
import { Recipe, Ingredient } from 'cooklang';

import { MinimalCooklangSettings, DEFAULT_SETTINGS, MinimalCooklangSettingsTab } from './src/Settings'
import { IngredientSuggestModal } from './src/IngredientSuggest';
import { PostProcessRecipeMarkdown } from './src/MarkdownPostProcessor';

export default class MinimalCooklang extends Plugin {
	settings: MinimalCooklangSettings
	ingredientDatabase: Set<Ingredient> = new Set()

	inRecipeFile: boolean = false
	recipe: Recipe

	async onload() {
		await this.loadSettings()

		this.registerEvent(this.app.workspace.on('file-open', this.handleFileOpen.bind(this)))
		this.registerEditorSuggest(new IngredientSuggestModal(this.app, this))
		this.registerMarkdownPostProcessor((element, context) => {
			PostProcessRecipeMarkdown(element, context, this)
		})
	}

	async loadSettings() {
		// Object.assign lets you clone the data, so defaults are not overidden
		this.settings = Object.assign(
			{}, 
			DEFAULT_SETTINGS,
			await this.loadData(),
		)

		this.addSettingTab(new MinimalCooklangSettingsTab(this.app, this))
	}

	async saveSettings() {
		this.saveData(this.settings)
	}

	// handleFileOpen handels the app.workspace.on('file-open') event.
	async handleFileOpen(file: TFile) {
		this.inRecipeFile = false
		if (!file) return;
		if (!this.isRecipe(file)) return;

		this.inRecipeFile = true
		let fileContent: string = await this.app.vault.read(file)
		const recipe = this.parseRecipe(fileContent);
		this.addIngredientsToDatabase(recipe)
	}

	// isRecipe returns whether a given file counts as a recipe.
	isRecipe(file: TFile): boolean {
		let tags = this.getTags(file)
		return tags.contains("#Recipe")
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

	// parseRecipe accepts the contents of a file, from which a cooklang structure 
	// is created.
	parseRecipe(content: string): Recipe {
		// This regular expression checks if "---" is at the very start of the 
		// content (^---) followed by any content until it reaches another "---" 
		// on a new line, followed by optional whitespace (\s*)
		const frontMatterRegex = /^---[\s\S]+?---\s*/;
		content = content.replace(frontMatterRegex, '');

		const recipe = new Recipe(content)
		return recipe
	}

	// addIngredientsToDatabase adds all of a recipe's ingredients to the ingredients database
	addIngredientsToDatabase(recipe: Recipe) {
		recipe.ingredients.forEach(e => {
			if (!e.name) return
			this.ingredientDatabase.add(e)
		})
	}

	refreshMarkdown() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return
		view.previewMode.rerender(true);
	}
}