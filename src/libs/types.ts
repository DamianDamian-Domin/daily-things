export interface Habbit {
	name: string;
	icon: string;
	severity: string;
	id?: string;
	tags: string[];
	origin: string;
	display_name: string;
}

export interface UserHabbits {
	date: string;
	habbits: Habbit[];
}

export interface Goal {
	name: string;
	severity: string;
	icon: string;
	id?: string;
	tags: string[];
	origin: string;
	display_name: string;
}
