import { App, PluginSettingTab, Setting } from "obsidian"
import MinimalCooklang from "../main"
import { Ingredient } from "cooklang"

export interface MinimalCooklangSettings {
    autocomplete: boolean
    autocompleteWithUnits: boolean
    highContrast: boolean
    showIngredientsInReading: boolean
    ingredients: Map<string, Ingredient>
}

export const DEFAULT_SETTINGS: MinimalCooklangSettings = {
    autocomplete: true,
    autocompleteWithUnits: false,
    highContrast: false,
    showIngredientsInReading: true,
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
        containerEl.createEl("h1", {text: "Minimal Cooklang"})

        new Setting(containerEl)
        .setName("Autocomplete")
        .setDesc("Autocomplete ingredients while writing recipes.")
        .addToggle((cb) => {
           cb.setValue(this.plugin.settings.autocomplete).onChange(v => {
                this.plugin.settings.autocomplete = v
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
            // if general spaces are off it doesn't make sense to change the setting
            // to show or hide single spaces between words
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
        .setName("Ingredients List")
        .setDesc("Show a list of all ingredients used in a recipe while in the reading view.")
        .addToggle(cb => {
            cb.setValue(this.plugin.settings.showIngredientsInReading).onChange(v => {
                this.plugin.settings.showIngredientsInReading = v
                this.plugin.saveSettings()
                this.plugin.refreshMarkdown()
            })
        })
    }
}