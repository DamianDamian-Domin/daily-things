/**
 * Generator ikon pixel-art dla habitów.
 *
 * Bierze wypełnione (fill) glify Material Symbols, rasteryzuje je na siatkę
 * 24×24, dodaje 1-pikselowy kontur i cieniowanie (światło z lewej-góry),
 * a wynik zapisuje jako kompaktowy RLE w `src/assets/pixelIcons.json`.
 * Kolory nakładane są dopiero w runtime (`src/utils/pixelIcons.ts`),
 * więc jeden sprite może mieć różne palety.
 *
 * Uruchomienie (zależności instalujemy tymczasowo, nie ma ich w package.json):
 *   npm i --no-save @material-symbols/svg-400 @resvg/resvg-js
 *   node scripts/generate-pixel-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG_DIR = path.join(
	ROOT,
	"node_modules/@material-symbols/svg-400/rounded",
);
const OUT = path.join(ROOT, "src/assets/pixelIcons.json");

const GLYPH = 24; // rozmiar rasteryzacji glifu
const PAD = 1; // miejsce na kontur
const SIZE = GLYPH + PAD * 2;
const ALPHA_THRESHOLD = 0.5;

// Ikony spoza katalogu habitów: własne habity + dekoracje UI
const EXTRA_ICONS = [
	"star",
	"favorite",
	"bolt",
	"local_florist",
	"eco",
	"water_drop",
	"self_improvement",
	"fitness_center",
	"menu_book",
	"music_note",
	"brush",
	"pets",
	"restaurant",
	"bedtime",
	"sunny",
	"mood",
	"code",
	"savings",
	"home",
	"school",
	"work",
	"directions_run",
	"spa",
	"emoji_objects",
	"flag",
	"trophy",
	"celebration",
	"potted_plant",
	"coffee",
	"cake",
	"rocket_launch",
	"diamond",
	"local_fire_department",
	"psychology",
	"star_shine",
	"check_circle",
	"add",
	"park",
	"forest",
	"cloud",
	"nightlight",
];

function glyphMask(name) {
	let file = path.join(SVG_DIR, `${name}-fill.svg`);
	if (!fs.existsSync(file)) file = path.join(SVG_DIR, `${name}.svg`);
	if (!fs.existsSync(file)) throw new Error(`Brak ikony: ${name}`);

	const svg = fs.readFileSync(file, "utf8");
	const rendered = new Resvg(svg, {
		fitTo: { mode: "width", value: GLYPH },
	}).render();

	const mask = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
	for (let y = 0; y < GLYPH; y++) {
		for (let x = 0; x < GLYPH; x++) {
			const alpha = rendered.pixels[(y * GLYPH + x) * 4 + 3] / 255;
			if (alpha >= ALPHA_THRESHOLD) mask[y + PAD][x + PAD] = true;
		}
	}
	return mask;
}

// '.' tło, 'o' kontur, 'f' wypełnienie, 'h' światło, 's' cień
function shade(mask) {
	const inside = (x, y) =>
		y >= 0 && y < SIZE && x >= 0 && x < SIZE && mask[y][x];
	const grid = [];
	for (let y = 0; y < SIZE; y++) {
		let row = "";
		for (let x = 0; x < SIZE; x++) {
			if (mask[y][x]) {
				const lit = !inside(x, y - 1) || !inside(x - 1, y);
				const dark = !inside(x, y + 1) || !inside(x + 1, y);
				row += lit ? "h" : dark ? "s" : "f";
			} else if (
				inside(x - 1, y) ||
				inside(x + 1, y) ||
				inside(x, y - 1) ||
				inside(x, y + 1)
			) {
				row += "o";
			} else {
				row += ".";
			}
		}
		grid.push(row);
	}
	return grid.join("");
}

function rle(cells) {
	let out = "";
	for (let i = 0; i < cells.length; ) {
		let j = i;
		while (j < cells.length && cells[j] === cells[i]) j++;
		const run = j - i;
		out += cells[i] + (run > 1 ? run : "");
		i = j;
	}
	return out;
}

const catalog = JSON.parse(
	fs.readFileSync(path.join(ROOT, "src/assets/habbitList.json"), "utf8"),
);
const names = [...new Set([...catalog.map((h) => h.icon), ...EXTRA_ICONS])].sort();

const icons = {};
for (const name of names) icons[name] = rle(shade(glyphMask(name)));

fs.writeFileSync(OUT, JSON.stringify({ size: SIZE, icons }) + "\n");
console.log(
	`Zapisano ${names.length} ikon (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB) → ${path.relative(ROOT, OUT)}`,
);
