// Przenosi nasz kod i zasoby Androida do projektu natywnego.
// Folder android/ jest w .gitignore (generuje go `npx cap add android`),
// więc źródła trzymamy w native/android:
//   res/   → android/app/src/main/res   (ikona powiadomień, widżet)
//   java/  → android/app/src/main/java  (MainActivity, widżet „Today”)
// oraz dopisujemy widżet do AndroidManifest.xml. Skrypt można uruchamiać
// wielokrotnie — każde kolejne uruchomienie niczego nie dubluje.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const APP = "android/app/src/main";
const MANIFEST = `${APP}/AndroidManifest.xml`;
const MAIN_ACTIVITY = "app/dailythings/MainActivity.java";

if (!existsSync("android")) {
	console.log("android/ not found — run `npx cap add android` first, then `npm run android`.");
	process.exit(0);
}

cpSync("native/android/res", `${APP}/res`, { recursive: true });
console.log(`Copied native/android/res → ${APP}/res`);

// Własną MainActivity (rejestruje wtyczkę widżetu) wstawiamy tylko w miejsce
// domyślnej z szablonu Capacitora — ręcznych zmian nie nadpisujemy po cichu.
const targetActivity = `${APP}/java/${MAIN_ACTIVITY}`;
const keepActivity =
	existsSync(targetActivity) &&
	!/extends BridgeActivity\s*\{\s*\}/.test(readFileSync(targetActivity, "utf8")) &&
	!readFileSync(targetActivity, "utf8").includes("HabitsWidgetPlugin");
cpSync("native/android/java", `${APP}/java`, {
	recursive: true,
	filter: (src) => !(keepActivity && src.replaceAll("\\", "/").endsWith(MAIN_ACTIVITY)),
});
console.log(`Copied native/android/java → ${APP}/java`);
if (keepActivity) {
	console.warn(
		`! ${targetActivity} was customised — add registerPlugin(HabitsWidgetPlugin.class) before super.onCreate() yourself.`,
	);
}

const RECEIVER = `
        <!-- Widżet „Today” (native/android/java/app/dailythings/widget) -->
        <receiver
            android:name=".widget.HabitsWidgetProvider"
            android:exported="false">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/habits_widget_info" />
        </receiver>
`;

const manifest = readFileSync(MANIFEST, "utf8");
if (manifest.includes(".widget.HabitsWidgetProvider")) {
	console.log("AndroidManifest.xml already has the widget");
} else if (!manifest.includes("</application>")) {
	console.warn("! AndroidManifest.xml has no </application> — add the widget receiver by hand.");
} else {
	writeFileSync(MANIFEST, manifest.replace("</application>", `${RECEIVER}    </application>`));
	console.log("Added the widget to AndroidManifest.xml");
}
