import pixelData from "@/assets/pixelIcons.json";

// Sprite'y generuje scripts/generate-pixel-icons.mjs. Każdy piksel ma jedną
// z ról: '.' tło, 'o' kontur, 'f' wypełnienie, 'h' światło, 's' cień.
// Kolory dokładamy tutaj, dzięki czemu jeden sprite ma wiele palet.

const { size: SIZE, icons } = pixelData as { size: number; icons: Record<string, string> };

export type PaletteKey =
	| "orange"
	| "teal"
	| "red"
	| "purple"
	| "blue"
	| "indigo"
	| "brown"
	| "pink"
	| "green"
	| "sand"
	| "gray"
	| "yellow"
	| "plum"
	| "ghost";

interface Palette {
	f: string;
	h: string;
	s: string;
	o?: string;
}

const OUTLINE = "#4b3528";

export const PALETTES: Record<PaletteKey, Palette> = {
	orange: { f: "#f2994a", h: "#ffc98b", s: "#d0703a" },
	teal: { f: "#4fbfad", h: "#9fe8d8", s: "#2f9186" },
	red: { f: "#e8676b", h: "#ffa6a0", s: "#bf4650" },
	purple: { f: "#9d88e3", h: "#d0c2ff", s: "#7160b9" },
	blue: { f: "#62a8ea", h: "#b1d9ff", s: "#3f7cc4" },
	indigo: { f: "#7b8ce0", h: "#b9c4ff", s: "#5566b8" },
	brown: { f: "#c48d5f", h: "#eac092", s: "#976341" },
	pink: { f: "#ef8fb8", h: "#ffc4dc", s: "#c86592" },
	green: { f: "#7cc46b", h: "#bfeaa0", s: "#4f9a4b" },
	sand: { f: "#dcae7a", h: "#f5d6a8", s: "#b7844f" },
	gray: { f: "#9ba5b0", h: "#d3dae1", s: "#717b86" },
	yellow: { f: "#f3c64f", h: "#fff0a0", s: "#cf9b2e" },
	plum: { f: "#a86f8a", h: "#d4a1b8", s: "#7b4b63" },
	// „Duch” — cel jeszcze niezrobiony
	ghost: { f: "#e9ddd1", h: "#f7efe7", s: "#d6c6b6", o: "#b9a795" },
};

export const PIXEL_ICON_SIZE = SIZE;

export function hasPixelIcon(name: string): boolean {
	return name in icons;
}

const cache = new Map<string, string>();

function buildSvg(rle: string, palette: Palette): string {
	const paths: Record<string, string> = { o: "", f: "", h: "", s: "" };
	let cell = 0;
	// Dekodujemy RLE i od razu składamy poziome odcinki per kolor
	for (const [, ch, count] of rle.matchAll(/([.ofhs])(\d*)/g)) {
		let n = count ? Number(count) : 1;
		while (n > 0) {
			const x = cell % SIZE;
			const y = (cell - x) / SIZE;
			const run = Math.min(n, SIZE - x);
			if (ch !== ".") paths[ch] += `M${x} ${y}h${run}v1h-${run}z`;
			cell += run;
			n -= run;
		}
	}
	const outline = palette.o ?? OUTLINE;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">` +
		`<path fill="${outline}" d="${paths.o}"/>` +
		`<path fill="${palette.f}" d="${paths.f}"/>` +
		`<path fill="${palette.h}" d="${paths.h}"/>` +
		`<path fill="${palette.s}" d="${paths.s}"/>` +
		`</svg>`
	);
}

export function pixelIconUrl(name: string, paletteKey: PaletteKey = "orange"): string {
	const key = `${name}|${paletteKey}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const rle = icons[name] ?? icons.star;
	const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		buildSvg(rle, PALETTES[paletteKey]),
	)}`;
	cache.set(key, url);
	return url;
}
