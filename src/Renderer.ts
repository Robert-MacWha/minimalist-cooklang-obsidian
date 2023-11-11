import { Ingredient, Timer } from "cooklang"

// RenderTimer renders a Timer object to a string. Optionally reformats the durration to be more human-readable.
export function RenderTimer(t: Timer, reformatTime: boolean): string {
	if (!t.quantity || !t.units) return t.raw ?? ""

	if (reformatTime && t.seconds) {
		return formatTime(t.seconds)
	} else {
		return t.quantity + " " + t.units
	}
}

// RenderIngredient renders an ingredient object to a string.
export function RenderIngredient(i: Ingredient, showIngredientAmounts: boolean): string {
	if (!i.name) return ""
	let str = i.name

	if (!showIngredientAmounts) return str

	if (i.amount && i.units) {
		str += " (" + i.amount + " " + i.units + ")"
	} else if (i.amount && i.amount != '1') {
		str += " (" + i.amount + ")"
	}

	return str
}

// SpanString wraps the provided string in a span html element, allowing it to be highlighted.
// Optionally adds the `plugin-mc-high-contrast` class, making the span high contrast.
export function SpanString(str: string, highContrast: boolean): string {
	let sStr = ""
	if (highContrast) {
		sStr = "<span class='plugin-mc-highlight plugin-mc-high-contrast'>" + str + "</span>"
	} else {
		sStr = "<span class='plugin-mc-highlight'>" + str + "</span>"
	}

	return sStr
}

// formatTime reformats a duration in seconds to a more human-readable number
function formatTime(seconds) {
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