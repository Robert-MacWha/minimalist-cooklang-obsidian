import { App, PluginSettingTab, Setting } from "obsidian"
import MinimalCooklang from "./main"
import { Ingredient } from "cooklang"

export interface MinimalCooklangSettings {
    autocomplete: boolean
    autocompleteWithUnits: boolean
    highContrast: boolean
    showIngredientsList: boolean
    showIngredientsListPreview: boolean
    showIngredientAmounts: boolean
    reformatTime: boolean
    ingredients: Map<string, Ingredient>
}

export const DEFAULT_SETTINGS: MinimalCooklangSettings = {
    autocomplete: true,
    autocompleteWithUnits: false,
    highContrast: false,
    showIngredientsList: true,
    showIngredientsListPreview: true,
    showIngredientAmounts: true,
    reformatTime: true,
    ingredients: new Map<string, Ingredient>(),
}

export class MinimalCooklangSettingsTab extends PluginSettingTab {
    plugin: MinimalCooklang

    constructor(app: App, plugin: MinimalCooklang) {
        super(app, plugin)

        this.plugin = plugin
    }

    display() {
        let { containerEl } = this

        containerEl.empty();
        containerEl.createEl("h1", { text: "Minimal Cooklang" })

        new Setting(containerEl)
            .setName("Autocomplete")
            .setDesc("Autocomplete ingredients while writing recipes.")
            .addToggle((cb) => {
                cb.setValue(this.plugin.settings.autocomplete).onChange(v => {
                    this.plugin.settings.autocomplete = v
                    this.plugin.settings.autocompleteWithUnits = false
                    this.plugin.saveSettings()
                    this.display()
                })
            })

        const autocompleteWithUnitsSetting = new Setting(containerEl)
            .setName("Autocomplete With Units")
            .setDesc("Include ingredient units as options in autocomplete popup.")
            .addToggle((cb) => {
                cb.setValue(this.plugin.settings.autocompleteWithUnits).onChange(v => {
                    this.plugin.settings.autocompleteWithUnits = v
                    this.plugin.saveSettings()
                })
            })

        if (!this.plugin.settings.autocomplete) {
            // if autocomplete is off, this plugin doesn't really make sense
            autocompleteWithUnitsSetting.setClass('plugin-mc-show-whitespace-disabled');
        }

        new Setting(containerEl)
            .setName("High Contrast")
            .setDesc("Make highlighted recipe ingredients and durations high-contrast using the editor's accent colour.")
            .addToggle(cb => {
                cb.setValue(this.plugin.settings.highContrast).onChange(v => {
                    this.plugin.settings.highContrast = v
                    this.plugin.saveSettings()
                    this.plugin.refreshMarkdown()
                })
            })

        new Setting(containerEl)
            .setName("Show Ingredient Amounts")
            .setDesc("Show an ingredient's amount in the step-by-step instructions within a recipe. Ingredient amounts are always shown in the Ingredients List.")
            .addToggle(cb => {
                cb.setValue(this.plugin.settings.showIngredientAmounts).onChange(v => {
                    this.plugin.settings.showIngredientAmounts = v
                    this.plugin.saveSettings()
                    this.plugin.refreshMarkdown()
                })
            })

        new Setting(containerEl)
            .setName("Show Ingredients List")
            .setDesc("Show a list of all ingredients used in a recipe while in the reading view.")
            .addToggle(cb => {
                cb.setValue(this.plugin.settings.showIngredientsList).onChange(v => {
                    this.plugin.settings.showIngredientsList = v
                    this.plugin.settings.showIngredientsListPreview = false
                    this.plugin.saveSettings()
                    this.plugin.refreshMarkdown()
                    this.display()
                })
            })

        const showIngredientListPreviewSetting = new Setting(containerEl)
            .setName("Show Ingredients List in Preview")
            .setDesc("Show the list of ingredients in preview mode as well as reading view.")
            .addToggle((cb) => {
                cb.setValue(this.plugin.settings.showIngredientsListPreview).onChange(v => {
                    this.plugin.settings.showIngredientsListPreview = v
                    this.plugin.saveSettings()
                    this.plugin.refreshMarkdown()
                })
            })

        if (!this.plugin.settings.showIngredientsList) {
            // if the ingredients list is off, this plugin doesn't really make sense
            showIngredientListPreviewSetting.setClass('plugin-mc-show-whitespace-disabled');
        }

        new Setting(containerEl)
            .setName("Reformat Time")
            .setDesc("Standardize the way timers are show.  May result in odd figures for very specific timers.")
            .addToggle(cb => {
                cb.setValue(this.plugin.settings.reformatTime).onChange(v => {
                    this.plugin.settings.reformatTime = v
                    this.plugin.saveSettings()
                    this.plugin.refreshMarkdown()
                })
            })

    }
}