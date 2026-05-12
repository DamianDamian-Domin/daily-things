// Konfetti z czystego CSS/JS — zero zewnętrznych paczek

const COLORS = [
	"#fb923c", // orange-400
	"#fcd34d", // yellow-300
	"#86efac", // green-300
	"#67e8f9", // cyan-300
	"#f9a8d4", // pink-300
	"#a5b4fc", // indigo-300
	"#fdba74", // orange-300
];

const SHAPES = ["square", "circle", "strip"];

// Wstrzyknięcie stylu keyframes raz
function injectStyles() {
	if (document.getElementById("confetti-styles")) return;
	const style = document.createElement("style");
	style.id = "confetti-styles";
	style.textContent = `
		@keyframes confetti-fall {
			0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
			80%  { opacity: 1; }
			100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
		}
		@keyframes confetti-sway {
			0%   { margin-left: 0; }
			25%  { margin-left: 60px; }
			75%  { margin-left: -60px; }
			100% { margin-left: 0; }
		}
		.confetti-particle {
			position: fixed;
			top: 0;
			pointer-events: none;
			z-index: 9999;
			animation: confetti-fall linear forwards, confetti-sway ease-in-out infinite;
		}
		.confetti-particle.square  { border-radius: 2px; }
		.confetti-particle.circle  { border-radius: 50%; }
		.confetti-particle.strip   { border-radius: 2px; width: 4px !important; }
	`;
	document.head.appendChild(style);
}

export function useConfetti() {
	function launch(count = 120) {
		injectStyles();

		for (let i = 0; i < count; i++) {
			const el = document.createElement("div");
			const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
			const color = COLORS[Math.floor(Math.random() * COLORS.length)];
			const size = 6 + Math.random() * 8; // 6–14px
			const left = Math.random() * 100; // % szerokości ekranu
			const duration = 1.8 + Math.random() * 1.6; // 1.8–3.4s
			const swayDuration = 1.2 + Math.random() * 1.2;
			const delay = Math.random() * 0.6; // lekkie opóźnienie

			el.className = `confetti-particle ${shape}`;
			el.style.cssText = `
				left: ${left}vw;
				width: ${size}px;
				height: ${size}px;
				background: ${color};
				animation-duration: ${duration}s, ${swayDuration}s;
				animation-delay: ${delay}s, ${delay}s;
			`;

			document.body.appendChild(el);

			// Usunięcie po zakończeniu animacji
			setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
		}
	}

	return { launch };
}
