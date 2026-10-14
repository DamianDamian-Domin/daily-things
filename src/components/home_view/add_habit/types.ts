import type { Habbit } from "@/libs/types";
import type { SuperCategoryKey } from "@/utils/habitCatalog";
import type { PaletteKey } from "@/utils/pixelIcons";

// Filtr: wszystko, złe nawyki („do rzucenia”) albo jedna z kategorii katalogu
export type FilterKey = "all" | "negative" | SuperCategoryKey;

export interface CategoryFilter {
	key: FilterKey;
	label: string;
	short: string;
	icon: string;
	palette: PaletteKey;
}

// Jedna sekcja listy habitów (nagłówek + siatka kafelków)
export interface HabitSection {
	key: string;
	title: string;
	icon: string;
	palette: PaletteKey;
	items: Habbit[];
}
