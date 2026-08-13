import { Capacitor } from "@capacitor/core";

// Platforma jest stała przez cały czas działania aplikacji, dlatego wystarczą
// wspólne, niemutowalne flagi zamiast powielania detekcji w komponentach.
export const isNativePlatform = Capacitor.isNativePlatform();
export const isWebPlatform = !isNativePlatform;
