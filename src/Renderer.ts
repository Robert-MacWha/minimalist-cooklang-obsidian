import { Recipe, Ingredient, Timer, Cookware } from "cooklang"

export function RenderIngredientsList(recipe: Recipe): HTMLElement {
	let ingredientsHTML = document.createElement("div")
	ingredientsHTML.classList.add("mc-plugin-ingredients")
	ingredientsHTML.createEl("h1", { text: "Ingredients" })

	const ingredientsList = ingredientsHTML.createEl("ul")
	recipe.ingredients.forEach(i => {
		let ingredient = RenderIngredient(i, true, false, true)
		const li = ingredientsList.createEl("li")
		li.append(ingredient)
	});

	ingredientsHTML.createEl("h1", { text: "Steps" })

	return ingredientsHTML
}

// RenderIngredient renders an ingredient object to a string.
export function RenderIngredient(i: Ingredient, showIngredientAmounts: boolean, highContrast: boolean, noSpan: boolean = false): HTMLElement {
	let ingredientHTML = document.createElement("span")
	if (!noSpan) {
		ingredientHTML.classList.add("plugin-mc-highlight")
		if (highContrast)
			ingredientHTML.classList.add("plugin-mc-high-contrast")
	}

	if (!i.raw) return ingredientHTML
	if (!i.name) {
		ingredientHTML.textContent = i.raw
		return ingredientHTML
	}

	let textContent = i.name
	if (showIngredientAmounts) {
		if (i.amount && i.units) {
			textContent = `${textContent} (${i.amount} ${i.units})`
		} else if (i.amount) {
			textContent = `${textContent} (${i.amount})`
		}
	}

	ingredientHTML.textContent = textContent
	return ingredientHTML
}

// RenderTimer renders a Timer object to a string. Optionally reformats the durration to be more human-readable.
export function RenderTimer(t: Timer, reformatTime: boolean, highContrast: boolean): HTMLElement {
	let timerHTML = document.createElement("span")
	timerHTML.classList.add("plugin-mc-highlight")
	if (highContrast)
		timerHTML.classList.add("plugin-mc-high-contrast")

	if (!t.raw) return timerHTML
	if (!t.quantity || !t.seconds) {
		timerHTML.textContent = t.raw
		return timerHTML
	}

	if (reformatTime && t.seconds) {
		timerHTML.textContent = formatTime(t.seconds)
		return timerHTML
	}

	timerHTML.textContent = `${t.quantity} ${t.units}`
	return timerHTML
}

export function RenderCookware(c: Cookware, highContrast: boolean): HTMLElement {
	let cookwareHTML = document.createElement("span")
	cookwareHTML.classList.add("plugin-mc-highlight")
	if (highContrast)
		cookwareHTML.classList.add("plugin-mc-high-contrast")

	if (!c.raw) return cookwareHTML
	if (!c.name) {
		cookwareHTML.textContent = c.raw
		return cookwareHTML
	}

	cookwareHTML.textContent = c.name
	return cookwareHTML
}

// formatTime reformats a duration in seconds to a more human-readable number
function formatTime(seconds: number): string {
	if (seconds < 60) {
		return `${seconds} seconds`;
	} else if (seconds < 3600) {
		const minutes = (seconds / 60).toFixed(0);
		return `${minutes} minutes`;
	} else {
		const hours = seconds / 3600;
		return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} hour${hours >= 2 ? 's' : ''}`;
	}
}