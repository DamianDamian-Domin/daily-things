// Kopiuje własne zasoby Androida (np. ikonę powiadomień) do projektu natywnego.
// Folder android/ jest w .gitignore, więc źródło trzymamy w native/android/res.
import { cpSync, existsSync } from "node:fs";

const from = "native/android/res";
const to = "android/app/src/main/res";

if (!existsSync("android")) {
	console.log("android/ not found — run `npx cap add android` first, then `npm run android`.");
	process.exit(0);
}
cpSync(from, to, { recursive: true });
console.log(`Copied ${from} → ${to}`);
