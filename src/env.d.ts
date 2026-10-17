/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_FIREBASE_API_KEY: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN: string;
	readonly VITE_FIREBASE_DATABASE_URL: string;
	readonly VITE_FIREBASE_PROJECT_ID: string;
	readonly VITE_FIREBASE_STORAGE_BUCKET: string;
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
	readonly VITE_FIREBASE_APP_ID: string;
	readonly VITE_USE_EMULATORS?: string;
	// Publiczny adres aplikacji (linki z zaproszeniem do znajomych, np. z aplikacji natywnej)
	readonly VITE_PUBLIC_URL?: string;
	readonly VITE_EMULATOR_AUTH_PORT?: string;
	readonly VITE_EMULATOR_FIRESTORE_PORT?: string;
	// "true" = emulatory z trwałym cache Firestore (test trybu offline)
	readonly VITE_EMULATOR_PERSISTENT_CACHE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
