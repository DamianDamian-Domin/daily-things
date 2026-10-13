// ==========================================================================
// Generator awatarów pixel-art (w całości po stronie klienta).
//
// Awatar to mała, wersjonowana konfiguracja (AvatarConfig), z której
// składamy postać „głowa + ramiona” na siatce 32×32 warstwa po warstwie:
//   tło → włosy (tył) → szyja → ubranie → głowa → twarz → włosy (przód) → dodatek
// Każda warstwa dostaje automatyczny 1-pikselowy kontur i cieniowanie
// (światło z lewej-góry) — tak samo jak ikony habitów. Wynik to SVG jako
// data URL, cache'owany per konfiguracja.
// ==========================================================================

export const AVATAR_GRID = 32;
const N = AVATAR_GRID;
const OUTLINE = "#4b3528";

interface Pal {
	f: string; // wypełnienie
	h: string; // światło
	s: string; // cień
	o?: string; // kontur (domyślnie OUTLINE)
}

// ---------------------------------------------------------------------------
// OPCJE
// ---------------------------------------------------------------------------
export const SKINS = {
	porcelain: { label: "Porcelain", f: "#ffe3cc", h: "#fff3e6", s: "#f2c4a2" },
	peach: { label: "Peach", f: "#f9cda6", h: "#ffe2c6", s: "#e6a97c" },
	honey: { label: "Honey", f: "#e6ae7c", h: "#f5c99d", s: "#c98a58" },
	caramel: { label: "Caramel", f: "#c68856", h: "#dca372", s: "#a46a3d" },
	cocoa: { label: "Cocoa", f: "#966043", h: "#b07a59", s: "#784830" },
	espresso: { label: "Espresso", f: "#6d442d", h: "#87593d", s: "#53321f", o: "#35221a" },
} satisfies Record<string, Pal & { label: string }>;

export const HAIR_COLORS = {
	black: { label: "Black", f: "#3e3532", h: "#625753", s: "#2b2422", o: "#201a18" },
	espresso: { label: "Dark brown", f: "#5c3b2a", h: "#7f5841", s: "#432a1d", o: "#2e1d14" },
	chestnut: { label: "Chestnut", f: "#8d5b37", h: "#b37d51", s: "#6b4228" },
	ginger: { label: "Ginger", f: "#d2703a", h: "#ef9b5f", s: "#a9532b" },
	honey: { label: "Blonde", f: "#e9c066", h: "#f8de98", s: "#c99b41" },
	silver: { label: "Silver", f: "#cbc5c1", h: "#ece8e4", s: "#a39c97" },
	rose: { label: "Rose", f: "#ee95b2", h: "#ffc2d6", s: "#c96f8e" },
	lilac: { label: "Lilac", f: "#a690e2", h: "#cfc2ff", s: "#7d68bd" },
} satisfies Record<string, Pal & { label: string }>;

// Kolory ubrań (spójne z paletami ikon habitów)
export const TOP_COLORS = {
	orange: { label: "Orange", f: "#f2994a", h: "#ffc98b", s: "#d0703a" },
	red: { label: "Red", f: "#e8676b", h: "#ffa6a0", s: "#bf4650" },
	pink: { label: "Pink", f: "#ef8fb8", h: "#ffc4dc", s: "#c86592" },
	purple: { label: "Purple", f: "#9d88e3", h: "#d0c2ff", s: "#7160b9" },
	blue: { label: "Blue", f: "#62a8ea", h: "#b1d9ff", s: "#3f7cc4" },
	teal: { label: "Teal", f: "#4fbfad", h: "#9fe8d8", s: "#2f9186" },
	green: { label: "Green", f: "#7cc46b", h: "#bfeaa0", s: "#4f9a4b" },
	yellow: { label: "Yellow", f: "#f3c64f", h: "#fff0a0", s: "#cf9b2e" },
	sand: { label: "Sand", f: "#dcae7a", h: "#f5d6a8", s: "#b7844f" },
	gray: { label: "Gray", f: "#9ba5b0", h: "#d3dae1", s: "#717b86" },
} satisfies Record<string, Pal & { label: string }>;

export const BACKGROUNDS = {
	peach: { label: "Peach", c: "#ffdcc0", d: "#ffcfa8" },
	butter: { label: "Butter", c: "#fff0b8", d: "#ffe591" },
	mint: { label: "Mint", c: "#cdeedc", d: "#b5e5cb" },
	sky: { label: "Sky", c: "#d3e8fb", d: "#bcdaf7" },
	lavender: { label: "Lavender", c: "#e4dbfb", d: "#d4c7f7" },
	rose: { label: "Rose", c: "#fbd7e2", d: "#f8c2d3" },
	sage: { label: "Sage", c: "#e2eacb", d: "#d3dfb4" },
	cream: { label: "Cream", c: "#f7ecdf", d: "#efdcc8" },
} satisfies Record<string, { label: string; c: string; d: string }>;

export const HAIR_STYLES = {
	short: "Short",
	swoop: "Swoop",
	bob: "Bob",
	long: "Long",
	curly: "Curly",
	bun: "Bun",
	ponytail: "Ponytail",
	spiky: "Spiky",
	bald: "Bald",
	beanie: "Beanie",
	hijab: "Head scarf",
} as const;

export const EYES = {
	round: "Round",
	sparkle: "Sparkly",
	happy: "Happy",
	sleepy: "Sleepy",
	wink: "Wink",
	lashes: "Lashes",
} as const;

export const MOUTHS = {
	smile: "Smile",
	grin: "Grin",
	calm: "Calm",
	ooh: "Ooh",
	tongue: "Cheeky",
} as const;

export const TOPS = {
	tee: "T-shirt",
	hoodie: "Hoodie",
	collar: "Shirt",
	sweater: "Turtleneck",
} as const;

export const ACCESSORIES = {
	none: "None",
	glasses: "Glasses",
	sunglasses: "Sunglasses",
	cap: "Cap",
	headphones: "Headphones",
	flower: "Flower",
} as const;

export type SkinKey = keyof typeof SKINS;
export type HairKey = keyof typeof HAIR_STYLES;
export type HairColorKey = keyof typeof HAIR_COLORS;
export type EyesKey = keyof typeof EYES;
export type MouthKey = keyof typeof MOUTHS;
export type TopKey = keyof typeof TOPS;
export type TopColorKey = keyof typeof TOP_COLORS;
export type AccessoryKey = keyof typeof ACCESSORIES;
export type BackgroundKey = keyof typeof BACKGROUNDS;

export interface AvatarConfig {
	v: 1;
	skin: SkinKey;
	hair: HairKey;
	hairColor: HairColorKey;
	eyes: EyesKey;
	mouth: MouthKey;
	top: TopKey;
	topColor: TopColorKey;
	accessory: AccessoryKey;
	bg: BackgroundKey;
}

export type AvatarPart = Exclude<keyof AvatarConfig, "v">;

// Kolejność i źródła opcji dla edytora oraz losowania
export const AVATAR_PARTS: Record<AvatarPart, readonly string[]> = {
	skin: Object.keys(SKINS),
	hair: Object.keys(HAIR_STYLES),
	hairColor: Object.keys(HAIR_COLORS),
	eyes: Object.keys(EYES),
	mouth: Object.keys(MOUTHS),
	top: Object.keys(TOPS),
	topColor: Object.keys(TOP_COLORS),
	accessory: Object.keys(ACCESSORIES),
	bg: Object.keys(BACKGROUNDS),
};

export function optionLabel(part: AvatarPart, key: string): string {
	const table: Record<AvatarPart, Record<string, string | { label: string }>> = {
		skin: SKINS,
		hair: HAIR_STYLES,
		hairColor: HAIR_COLORS,
		eyes: EYES,
		mouth: MOUTHS,
		top: TOPS,
		topColor: TOP_COLORS,
		accessory: ACCESSORIES,
		bg: BACKGROUNDS,
	};
	const entry = table[part][key];
	if (!entry) return key;
	return typeof entry === "string" ? entry : entry.label;
}

// Kolor próbki w edytorze (dla opcji kolorystycznych)
export function optionSwatch(part: AvatarPart, key: string): string | null {
	if (part === "skin") return SKINS[key as SkinKey]?.f ?? null;
	if (part === "hairColor") return HAIR_COLORS[key as HairColorKey]?.f ?? null;
	if (part === "topColor") return TOP_COLORS[key as TopColorKey]?.f ?? null;
	if (part === "bg") return BACKGROUNDS[key as BackgroundKey]?.c ?? null;
	return null;
}

// ---------------------------------------------------------------------------
// WALIDACJA / LOSOWANIE
// ---------------------------------------------------------------------------
const FALLBACK: AvatarConfig = {
	v: 1,
	skin: "peach",
	hair: "short",
	hairColor: "chestnut",
	eyes: "round",
	mouth: "smile",
	top: "tee",
	topColor: "orange",
	accessory: "none",
	bg: "peach",
};

// Dane z Firestore traktujemy jako niezaufane — nieznane wartości zastępujemy
export function normalizeAvatar(raw: unknown): AvatarConfig | null {
	if (!raw || typeof raw !== "object") return null;
	const input = raw as Record<string, unknown>;
	const out = { ...FALLBACK };
	for (const part of Object.keys(AVATAR_PARTS) as AvatarPart[]) {
		const value = input[part];
		if (typeof value === "string" && AVATAR_PARTS[part].includes(value)) {
			(out as Record<string, unknown>)[part] = value;
		}
	}
	return out;
}

// Prosty, deterministyczny PRNG (mulberry32) + hash napisu
function hashString(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export function seededRandom(seed: string): () => number {
	let a = hashString(seed) || 1;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(list: readonly T[], rand: () => number): T {
	return list[Math.floor(rand() * list.length) % list.length];
}

// Ważone losowanie — nakrycia głowy i dodatki rzadziej, żeby galeria była różnorodna
function pickWeighted<T extends string>(weights: Record<T, number>, rand: () => number): T {
	const entries = Object.entries(weights) as Array<[T, number]>;
	const total = entries.reduce((sum, [, w]) => sum + w, 0);
	let roll = rand() * total;
	for (const [key, w] of entries) {
		roll -= w;
		if (roll < 0) return key;
	}
	return entries[0][0];
}

export function randomAvatar(rand: () => number = Math.random): AvatarConfig {
	const hair = pickWeighted<HairKey>(
		{
			short: 3,
			swoop: 3,
			bob: 3,
			long: 3,
			curly: 3,
			bun: 2,
			ponytail: 2,
			spiky: 2,
			bald: 1,
			beanie: 1.5,
			hijab: 1,
		},
		rand,
	);
	const topColor = pick(AVATAR_PARTS.topColor, rand) as TopColorKey;
	// Tło inne niż „podobne” do koloru ubrania
	let bg = pick(AVATAR_PARTS.bg, rand) as BackgroundKey;
	if (BG_CLASH[topColor]?.includes(bg)) bg = pick(AVATAR_PARTS.bg, rand) as BackgroundKey;
	return {
		v: 1,
		skin: pick(AVATAR_PARTS.skin, rand) as SkinKey,
		hair,
		hairColor: pickWeighted<HairColorKey>(
			{ black: 3, espresso: 3, chestnut: 3, ginger: 2, honey: 2, silver: 1, rose: 1, lilac: 1 },
			rand,
		),
		eyes: pickWeighted<EyesKey>(
			{ round: 3, sparkle: 3, happy: 2, sleepy: 1, wink: 1, lashes: 2 },
			rand,
		),
		mouth: pickWeighted<MouthKey>({ smile: 4, grin: 2, calm: 2, ooh: 1, tongue: 1 }, rand),
		top: pick(AVATAR_PARTS.top, rand) as TopKey,
		topColor,
		accessory: pickWeighted<AccessoryKey>(
			{
				none: 9,
				glasses: 2,
				sunglasses: 1,
				cap: hair === "hijab" || hair === "beanie" ? 0 : 1,
				headphones: 1,
				flower: 1,
			},
			rand,
		),
		bg,
	};
}

const BG_CLASH: Partial<Record<TopColorKey, BackgroundKey[]>> = {
	orange: ["peach"],
	pink: ["rose"],
	purple: ["lavender"],
	blue: ["sky"],
	green: ["mint", "sage"],
	teal: ["mint"],
	yellow: ["butter"],
	sand: ["cream", "peach"],
};

// Domyślny awatar wyliczony z UID — każdy od razu ma „swoją” postać
export function defaultAvatar(seed: string): AvatarConfig {
	return randomAvatar(seededRandom(`avatar:${seed}`));
}

export function sameAvatar(a: AvatarConfig | null | undefined, b: AvatarConfig | null | undefined) {
	if (!a || !b) return a === b;
	return (Object.keys(AVATAR_PARTS) as AvatarPart[]).every((p) => a[p] === b[p]);
}

// ---------------------------------------------------------------------------
// RYSOWANIE
// ---------------------------------------------------------------------------
// Maska: wiersze od `y`. Wiersz 16-znakowy to lewa połowa, odbijana
// symetrycznie; wiersz 32-znakowy jest brany dosłownie. Znaki:
//   '.' pusto, '#' wypełnienie (auto-cieniowanie), 'f' wypełnienie bez
//   cieniowania, 'h' światło, 's' cień, 'o' kontur, inne → `extra` kolory.
interface Mask {
	y: number;
	rows: string[];
	x?: number; // przesunięcie w poziomie (tylko dla wierszy 32-znakowych)
}

type Cell = { x: number; y: number; ch: string };

function maskCells(mask: Mask): Cell[] {
	const out: Cell[] = [];
	mask.rows.forEach((row, i) => {
		const y = mask.y + i;
		if (y < 0 || y >= N) return;
		if (row.length === N / 2) {
			for (let x = 0; x < N / 2; x++) {
				const ch = row[x];
				if (ch === ".") continue;
				out.push({ x, y, ch });
				// lustro: znaki kierunkowe zostają, cieniowanie liczymy później
				out.push({ x: N - 1 - x, y, ch: MIRROR[ch] ?? ch });
			}
		} else {
			for (let x = 0; x < row.length; x++) {
				const ch = row[x];
				const px = x + (mask.x ?? 0);
				if (ch === "." || px < 0 || px >= N) continue;
				out.push({ x: px, y, ch });
			}
		}
	});
	return out;
}

// Odbicie lustrzane: światło pada z lewej, więc prawa połowa dostaje cień
const MIRROR: Record<string, string> = { h: "#", L: "R", R: "L" };

class Canvas {
	color: Array<string | null> = new Array(N * N).fill(null);
	mat: Array<string | null> = new Array(N * N).fill(null);

	get(x: number, y: number) {
		if (x < 0 || y < 0 || x >= N || y >= N) return null;
		return this.mat[y * N + x];
	}
	set(x: number, y: number, color: string, mat: string) {
		if (x < 0 || y < 0 || x >= N || y >= N) return;
		this.color[y * N + x] = color;
		this.mat[y * N + x] = mat;
	}
}

interface LayerOptions {
	outline?: boolean;
	shade?: boolean;
	extra?: Record<string, string>;
}

const NEIGHBOURS = [
	[0, -1],
	[-1, 0],
	[1, 0],
	[0, 1],
] as const;

function drawLayer(cv: Canvas, mask: Mask | Mask[], pal: Pal, mat: string, opts: LayerOptions = {}) {
	const { outline = true, shade = true, extra = {} } = opts;
	const cells = (Array.isArray(mask) ? mask : [mask]).flatMap(maskCells);
	const inMask = new Set(cells.filter((c) => c.ch !== "o").map((c) => c.y * N + c.x));
	const solid = (x: number, y: number) =>
		x >= 0 && y >= 0 && x < N && y < N && (inMask.has(y * N + x) || cv.get(x, y) === mat);

	if (outline) {
		const ring = new Set<number>();
		for (const c of cells) {
			if (c.ch === "o") continue;
			for (const [dx, dy] of NEIGHBOURS) {
				const nx = c.x + dx;
				const ny = c.y + dy;
				if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
				const key = ny * N + nx;
				if (inMask.has(key) || cv.get(nx, ny) === mat) continue;
				ring.add(key);
			}
		}
		for (const key of ring) cv.set(key % N, Math.floor(key / N), pal.o ?? OUTLINE, `${mat}:o`);
	}

	for (const c of cells) {
		let color: string;
		switch (c.ch) {
			case "#": {
				if (!shade) {
					color = pal.f;
					break;
				}
				const lit = !solid(c.x, c.y - 1) || !solid(c.x - 1, c.y);
				const dark = !solid(c.x, c.y + 1) || !solid(c.x + 1, c.y);
				color = lit && !dark ? pal.h : dark ? pal.s : pal.f;
				break;
			}
			case "f":
				color = pal.f;
				break;
			case "h":
				color = pal.h;
				break;
			case "s":
				color = pal.s;
				break;
			case "o":
				color = pal.o ?? OUTLINE;
				break;
			default:
				color = extra[c.ch] ?? pal.f;
		}
		cv.set(c.x, c.y, color, c.ch === "o" ? `${mat}:o` : mat);
	}
}

// Piksele „na sztywno” (oczy, usta) — bez konturu
function drawPixels(cv: Canvas, mask: Mask, colors: Record<string, string>, mat = "face") {
	for (const c of maskCells(mask)) {
		const color = colors[c.ch];
		if (color) cv.set(c.x, c.y, color, mat);
	}
}

// ---------------------------------------------------------------------------
// KSZTAŁTY (siatka 32×32; środek między kolumnami 15 i 16)
// ---------------------------------------------------------------------------
const HEAD: Mask = {
	y: 6,
	rows: [
		"..........######", // 6
		"........########", // 7
		".......#########", // 8
		".......#########", // 9
		".......#########", // 10
		".......#########", // 11
		".......#########", // 12
		".....###########", // 13 uszy
		".....s##########", // 14
		"......##########", // 15
		".......#########", // 16
		".......#########", // 17
		"........########", // 18
		".........#######", // 19
		"...........#####", // 20
	],
};

const NECK: Mask = {
	y: 19,
	rows: [
		".............sss",
		".............sss",
		".............sss",
		".............sss",
		".............sss",
		".............sss",
		".............sss",
	],
};

function bodyMask(top: TopKey): Mask {
	switch (top) {
		case "hoodie":
			return {
				y: 20,
				rows: [
					"............ss..", // 20 kaptur za szyją
					"..........#ss...", // 21
					"........###ss...", // 22
					".......####ss...", // 23
					".....#########w#", // 24 sznurki
					"....##########w#", // 25
					"...###########w#", // 26
					"...####s########", // 27
					"...####s#ooooooo", // 28 kieszeń
					"...####s#o######", // 29
					"...####s#o######", // 30
					"...####s########", // 31
				],
			};
		case "collar":
			return {
				y: 22,
				rows: [
					"..........##w...", // 22 kołnierzyk
					".......####www..", // 23
					".....#######ww..", // 24
					"....##########..", // 25
					"...#############", // 26
					"...####s#######k", // 27 guziki
					"...####s########", // 28
					"...####s#######k", // 29
					"...####s########", // 30
					"...####s########", // 31
				],
			};
		case "sweater":
			return {
				y: 20,
				rows: [
					".............hhh", // 20 golf
					".............f#f",
					"..........######",
					".......#########",
					".....###########",
					"....############",
					"...#############",
					"...#############",
					"...####s########",
					"...####s########",
					"...####s########",
					"...####s########",
				],
			};
		default:
			return {
				y: 22,
				rows: [
					"..........###...", // 22
					".......#######..", // 23
					".....###########", // 24
					"....############", // 25
					"...#############", // 26
					"...#############", // 27
					"...####s########", // 28
					"...####s########", // 29
					"...####s########", // 30
					"...####s########", // 31
				],
			};
	}
}

// --- Włosy: tył (przed ciałem) i przód (po głowie)
interface HairShape {
	back?: Mask[];
	front?: Mask[];
}

const HAIR: Record<HairKey, HairShape> = {
	bald: {
		front: [{ y: 7, rows: ["..........hh...."] }],
	},
	short: {
		front: [
			{
				y: 2,
				rows: [
					"...........#####", // 2
					".........#######", // 3
					"........########", // 4
					".......#########", // 5
					"......##########", // 6
					"......##########", // 7
					"......##########", // 8
					"......####.##.##", // 9
					"......##........", // 10
					"......#.........", // 11
				],
			},
		],
	},
	swoop: {
		front: [
			{
				y: 2,
				rows: [
					"..........##########............",
					"........##############..........",
					".......#################........",
					"......####################......",
					"......#####################.....",
					"......######################....",
					"......####...########..#####....",
					"......##.......####.....####....",
					"......#.........##.......###....",
					"......#...................##....",
				],
			},
		],
	},
	bob: {
		front: [
			{
				y: 2,
				rows: [
					"...........#####",
					".........#######",
					"........########",
					".......#########",
					"......##########",
					".....###########",
					".....###########",
					".....###########",
					".....####.#.#.#.", // 10 grzywka
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....####.......",
					".....####.......",
				],
			},
		],
	},
	long: {
		back: [
			{
				y: 12,
				rows: [
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....############",
					"....####........",
					"....####........",
					"....###.........",
				],
			},
		],
		front: [
			{
				y: 2,
				rows: [
					"...........#####",
					".........#######",
					"........########",
					".......#########",
					"......##########",
					".....###########",
					".....###########",
					".....######o####",
					".....#####...##.",
					".....####.......",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					".....###........",
					"....####........",
					"....####........",
					"....####........",
					"....####........",
					".....###........",
				],
			},
		],
	},
	curly: {
		front: [
			{
				y: 1,
				rows: [
					"........##..##..",
					"......#########.",
					".....###########",
					"....####s####s##",
					"...##s#####s####",
					"...#####s#####s#",
					"..###s#####s####",
					"..#####s##s##s##",
					"...##s###.#.##.#",
					"..######........",
					"...##s##........",
					"..#####.........",
					"...##s#.........",
					"..#####.........",
					"...###..........",
				],
			},
		],
	},
	bun: {
		front: [
			{
				y: 0,
				rows: [
					".............###",
					"............####",
					"............####",
					".............sss",
					"..........######",
					"........########",
					".......#########",
					"......##########",
					"......##########",
					"......######.###",
					"......##........",
					"......#.........",
				],
			},
		],
	},
	ponytail: {
		back: [
			{
				y: 4,
				rows: [
					".......................###......",
					"......................######....",
					".......................######...",
					"........................#####...",
					".........................####...",
					".........................#####..",
					"..........................####..",
					"..........................####..",
					"..........................####..",
					"..........................###...",
					".........................####...",
					".........................###....",
					"........................###.....",
				],
			},
		],
		front: [
			{
				y: 2,
				rows: [
					"...........#####",
					".........#######",
					"........########",
					".......#########",
					"......##########",
					"......##########",
					"......##########",
					"......####.#####",
					"......##........",
					"......#.........",
				],
			},
		],
	},
	spiky: {
		front: [
			{
				y: 0,
				rows: [
					"..........#....#",
					"..........##..##",
					"......#...######",
					"......##.#######",
					".......#########",
					"......##########",
					"......##########",
					"......##########",
					"......##########",
					"......##.###.###",
					"......#...#.....",
					"......#.........",
				],
			},
		],
	},
	beanie: {
		front: [{ y: 10, rows: ["......##........", "......#........."] }],
	},
	hijab: {
		front: [
			{
				y: 3,
				rows: [
					"..........######", // 3
					"........########", // 4
					".......#########", // 5
					"......##########", // 6
					".....###########", // 7
					".....######.....", // 8
					".....#####......", // 9
					"....#####.......", // 10
					"....#####.......", // 11
					"....#####.......", // 12
					"....#####.......", // 13
					"....#####.......", // 14
					"....#####.......", // 15
					"....#####.......", // 16
					"....#####.......", // 17
					"....#####.......", // 18
					"....######......", // 19
					"....########....", // 20
					"....############", // 21
					"...#############", // 22
					"..##############", // 23
					"..##############", // 24
					"...#############", // 25
					".....###########", // 26
					"........########", // 27
				],
			},
		],
	},
};

const BEANIE: Mask[] = [
	{
		y: 2,
		rows: [
			"..........######", // 2
			"........########", // 3
			".......#########", // 4
			"......##########", // 5
			"......##########", // 6
			"......##########", // 7
			".....fsfsfsfsfsf", // 8 ściągacz
			".....fsfsfsfsfsf", // 9
		],
	},
];
const POMPOM: Mask = { y: 0, rows: ["..............##", ".............###"] };

const CAP: Mask = {
	y: 2,
	rows: [
		"...........#####...............",
		".........#########..............",
		"........###########.............",
		".......#############............",
		"......###############...........",
		"......################..........",
		"......sssssssssssssssssssssss...",
	],
};

// --- Oczy: lewe oko w kolumnach 11–12, prawe 19–20, wiersze 13–14
type FacePart = { rows: string[]; y: number };

const EYE_SHAPES: Record<EyesKey, FacePart> = {
	round: { y: 12, rows: ["................", "...........kk...", "...........kk..."] },
	sparkle: { y: 12, rows: ["...........kk...", "...........wk...", "...........kk..."] },
	happy: { y: 12, rows: ["................", "...........kk...", "..........k..k.."] },
	sleepy: { y: 12, rows: ["................", "................", "..........kkkk.."] },
	wink: {
		y: 12,
		rows: [
			"................................",
			"...........kk......kk...........",
			"...........kk.....k..k..........",
		],
	},
	lashes: { y: 12, rows: ["..........k.....", "...........kk...", "...........kk..."] },
};

const MOUTH_SHAPES: Record<MouthKey, FacePart> = {
	smile: { y: 17, rows: ["..............k.", "...............k"] },
	grin: { y: 17, rows: ["..............kk", "...............r"] },
	calm: { y: 17, rows: ["................", "...............k"] },
	ooh: { y: 17, rows: ["...............k", "...............k"] },
	tongue: { y: 17, rows: ["..............kk", "...............t"] },
};

const FACE_COLORS = {
	k: "#3b2a20",
	w: "#ffffff",
	r: "#c94f4f",
	t: "#ef7f8f",
};

// ---------------------------------------------------------------------------
// SKŁADANIE
// ---------------------------------------------------------------------------
function compose(cfg: AvatarConfig): Canvas {
	const cv = new Canvas();
	const skin = SKINS[cfg.skin];
	const hairPal = HAIR_COLORS[cfg.hairColor];
	const topPal = TOP_COLORS[cfg.topColor];
	const bg = BACKGROUNDS[cfg.bg];
	const hair = HAIR[cfg.hair];

	// Tło: jednolite + delikatna „aureola” za głową
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const dx = x - 15.5;
			const dy = y - 13;
			cv.set(x, y, dx * dx + dy * dy < 150 ? bg.c : bg.d, "bg");
		}
	}

	// Chusta ma kolor „włosów” (jak tkanina), czapka — kolor ubrania
	const scarfPal = hairPal;

	if (hair.back) drawLayer(cv, hair.back, cfg.hair === "hijab" ? scarfPal : hairPal, "hair");
	if (cfg.top !== "sweater") drawLayer(cv, NECK, skin, "skin", { shade: false });
	drawLayer(cv, bodyMask(cfg.top), topPal, "top", {
		extra: { w: "#fffaf2", k: OUTLINE },
	});
	drawLayer(cv, HEAD, skin, "skin");

	// Twarz
	drawPixels(cv, EYE_SHAPES[cfg.eyes], FACE_COLORS);
	drawPixels(cv, MOUTH_SHAPES[cfg.mouth], FACE_COLORS);
	// Rumieńce
	const blush = cfg.skin === "espresso" || cfg.skin === "cocoa" ? "#c46a5e" : "#f7a39b";
	drawPixels(cv, { y: 15, rows: ["..........k....."] }, { k: blush });

	if (hair.front) {
		drawLayer(cv, hair.front, cfg.hair === "hijab" ? scarfPal : hairPal, "hair");
	}
	if (cfg.hair === "beanie") {
		drawLayer(cv, BEANIE, topPal, "hat");
		drawLayer(cv, POMPOM, { f: "#fffaf2", h: "#ffffff", s: "#efe3d6" }, "pompom");
	}
	if (cfg.hair === "ponytail") {
		// gumka do włosów w kolorze ubrania
		drawPixels(cv, { y: 5, rows: ["........................##......"] }, { "#": topPal.s }, "acc");
	}

	drawAccessory(cv, cfg, topPal);
	return cv;
}

function drawAccessory(cv: Canvas, cfg: AvatarConfig, topPal: Pal) {
	switch (cfg.accessory) {
		case "glasses":
			drawPixels(
				cv,
				{
					y: 12,
					rows: [
						".........oooo...",
						".........o..o...",
						".........o..oooo",
						".........oooo...",
					],
				},
				{ o: OUTLINE },
				"acc",
			);
			drawPixels(cv, { y: 13, rows: ["..........w....."] }, { w: "#ffffff" }, "acc");
			break;
		case "sunglasses":
			drawPixels(
				cv,
				{
					y: 12,
					rows: [
						"........ooooooo.",
						".........ohkkoo.",
						".........okkkooo",
						"..........oooo..",
					],
				},
				{ o: "#2b2321", k: "#3d3532", h: "#7a6e69" },
				"acc",
			);
			break;
		case "cap":
			drawLayer(cv, CAP, topPal, "hat");
			break;
		case "headphones":
			drawLayer(
				cv,
				[
					{
						y: 3,
						rows: [
							"........########",
							"......##........",
							".....#..........",
							"....#...........",
							"....#...........",
							"....#...........",
							"....#...........",
							"....#...........",
						],
					},
				],
				{ f: "#6e6460", h: "#958a85", s: "#4f4744" },
				"acc",
				{ shade: false },
			);
			drawLayer(
				cv,
				{
					y: 11,
					rows: ["...##...........", "..####..........", "..####..........", "..####..........", "...##..........."],
				},
				topPal,
				"acc2",
			);
			break;
		case "flower":
			drawLayer(
				cv,
				{
					y: 3,
					rows: [
						".......#........................",
						"......###.......................",
						".....##y##......................",
						"......###.......................",
						".......#........................",
					],
				},
				{ f: "#f48fb1", h: "#ffc1d8", s: "#d0698d" },
				"acc",
				{ extra: { y: "#ffd54f" } },
			);
			break;
		default:
			break;
	}
}

function toSvg(cv: Canvas): string {
	const paths = new Map<string, string>();
	for (let y = 0; y < N; y++) {
		let x = 0;
		while (x < N) {
			const color = cv.color[y * N + x];
			let run = 1;
			while (x + run < N && cv.color[y * N + x + run] === color) run++;
			if (color) paths.set(color, (paths.get(color) ?? "") + `M${x} ${y}h${run}v1h-${run}z`);
			x += run;
		}
	}
	let body = "";
	for (const [color, d] of paths) body += `<path fill="${color}" d="${d}"/>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${body}</svg>`;
}

const cache = new Map<string, string>();

export function avatarKey(cfg: AvatarConfig): string {
	return (Object.keys(AVATAR_PARTS) as AvatarPart[]).map((p) => cfg[p]).join("|");
}

export function avatarUrl(cfg: AvatarConfig): string {
	const key = avatarKey(cfg);
	const cached = cache.get(key);
	if (cached) return cached;
	const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(compose(cfg)))}`;
	// Prosty limit, żeby edytor (dużo podglądów) nie zapychał pamięci
	if (cache.size > 400) cache.clear();
	cache.set(key, url);
	return url;
}
