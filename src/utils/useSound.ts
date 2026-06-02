import { usePreferencesStore } from "@/stores/userPreferences";

// Composable do odtwarzania dźwięków przy interakcjach użytkownika
// Używa Web Audio API — zero plików zewnętrznych

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	return ctx;
}

// Pomocnik: odgrywa serię oscylatorów z envelopą
function playTone(
	frequency: number,
	duration: number,
	type: OscillatorType = "sine",
	gainPeak = 0.18,
	delay = 0,
) {
	const ac = getCtx();
	const osc = ac.createOscillator();
	const gain = ac.createGain();

	osc.connect(gain);
	gain.connect(ac.destination);

	osc.type = type;
	osc.frequency.setValueAtTime(frequency, ac.currentTime + delay);

	const start = ac.currentTime + delay;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

	osc.start(start);
	osc.stop(start + duration);
}

export function useSound() {
	// Podłączamy nasz nowy store z preferencjami
	const preferencesStore = usePreferencesStore();

	// Dźwięk zaznaczenia todo / habbitu — przyjemny "ding" w górę
	function playCheck() {
		if (!preferencesStore.soundEnabled) return;

		playTone(520, 0.12, "sine", 0.15);
		playTone(780, 0.18, "sine", 0.1, 0.07);
	}

	// Dźwięk odznaczenia — krótkie opadające "pop"
	function playUncheck() {
		if (!preferencesStore.soundEnabled) return;

		playTone(440, 0.08, "sine", 0.12);
		playTone(330, 0.12, "sine", 0.08, 0.05);
	}

	// Dźwięk dodania nowego elementu — lekki "bip"
	function playAdd() {
		if (!preferencesStore.soundEnabled) return;

		playTone(600, 0.1, "sine", 0.12);
	}

	// Dźwięk kliknięcia habbitu (zaznaczenie) — szybki "pop" z lekkim przytłumieniem
	function playHabitCheck() {
		if (!preferencesStore.soundEnabled) return;

		playTone(660, 0.08, "sine", 0.13);
		playTone(880, 0.14, "sine", 0.09, 0.05);
	}

	// Dźwięk zwycięstwa — fanfara przy ukończeniu wszystkich celów
	function playVictory() {
		if (!preferencesStore.soundEnabled) return;

		const melody = [523, 659, 784, 1047];
		melody.forEach((freq, i) => {
			playTone(freq, 0.22, "sine", 0.18, i * 0.12);
		});
		// Dodatkowy akord na końcu
		playTone(1047, 0.4, "sine", 0.14, melody.length * 0.12);
		playTone(784, 0.4, "sine", 0.1, melody.length * 0.12);
	}

	return { playCheck, playUncheck, playAdd, playHabitCheck, playVictory };
}
