import { describe, expect, it } from "vitest";
import { cleanNote, NOTE_MAX_LENGTH } from "@/utils/logNote";

describe("cleanNote", () => {
	it("trims and collapses whitespace", () => {
		expect(cleanNote("  changed   the filter\n model X ")).toBe("changed the filter model X");
	});

	it("treats blank input as no note", () => {
		expect(cleanNote("   ")).toBe("");
		expect(cleanNote(undefined)).toBe("");
	});

	it("caps the length", () => {
		expect(cleanNote("a".repeat(500))).toHaveLength(NOTE_MAX_LENGTH);
	});
});
