import { initializeApp } from "firebase/app";
import {
	browserLocalPersistence,
	connectAuthEmulator,
	indexedDBLocalPersistence,
	initializeAuth,
} from "firebase/auth";
import {
	connectFirestoreEmulator,
	initializeFirestore,
	memoryLocalCache,
	persistentLocalCache,
	persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

const app = initializeApp(firebaseConfig);

// initializeAuth zamiast getAuth: nie ładujemy skryptów Google (gapi/iframe)
// przy każdym starcie — resolver popupów podajemy dopiero przy logowaniu
// przez Google. To też znany fix na „wieszanie się” Auth w WebView Capacitora.
export const auth = initializeAuth(app, {
	persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
// Maile (reset hasła, weryfikacja) w języku przeglądarki użytkownika
auth.useDeviceLanguage();

// Trwały cache: aplikacja startuje z danymi z IndexedDB i działa offline,
// a zapisy są kolejkowane do czasu powrotu sieci.
export const db = initializeFirestore(app, {
	ignoreUndefinedProperties: true,
	localCache: useEmulators
		? memoryLocalCache()
		: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
	connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
	connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default app;
