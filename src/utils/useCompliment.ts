// Losowe komplementy wyświetlane jako animowany toast
const COMPLIMENTS = [
	"Not bad! 💪",
	"Keep it up! 🔥",
	"Well done! ✨",
	"One step forward! 🚀",
	"Excellent! 🌟",
	"Great work! 👏",
	"On a roll! ⚡",
	"Awesome! 🎉",
	"You got this! 💫",
	"Beautiful! 🌸",
	"Spot on! 🎯",
	"You deserve a coffee! ☕",
	"Another habit done! 🌿",
	"Looking great! 🍀",
];

function injectStyles() {
	if (document.getElementById("compliment-styles")) return;
	const style = document.createElement("style");
	style.id = "compliment-styles";
	style.textContent = `
		@keyframes compliment-in {
			0%   { opacity: 0; transform: translate(-50%, 14px) scale(0.88); }
			65%  { opacity: 1; transform: translate(-50%, -3px) scale(1.04); }
			100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
		}
		@keyframes compliment-out {
			0%   { opacity: 1; transform: translate(-50%, 0) scale(1); }
			100% { opacity: 0; transform: translate(-50%, -12px) scale(0.92); }
		}
		.compliment-toast {
			position: fixed;
			bottom: 96px;
			left: 50%;
			transform: translateX(-50%);
			background: white;
			color: #92400e;
			font-family: 'Lora', serif;
			font-size: 0.88rem;
			font-weight: 600;
			padding: 0.42rem 1.1rem;
			border-radius: 999px;
			box-shadow: 0 4px 18px rgba(251, 146, 60, 0.22);
			border: 1.5px solid rgba(251, 146, 60, 0.28);
			pointer-events: none;
			z-index: 9998;
			white-space: nowrap;
			animation: compliment-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		}
		.compliment-toast.leaving {
			animation: compliment-out 0.28s ease forwards;
		}
		:where(.my-app-dark) .compliment-toast {
			background: #1f2937;
			color: #fcd34d;
			border-color: rgba(251, 146, 60, 0.2);
			box-shadow: 0 4px 18px rgba(0,0,0,0.3);
		}
	`;
	document.head.appendChild(style);
}

export function useCompliment() {
	function show() {
		injectStyles();
		const text = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
		const el = document.createElement("div");
		el.className = "compliment-toast";
		el.textContent = text;
		// Ciemny motyw
		if (document.documentElement.classList.contains("my-app-dark")) {
			el.classList.add("dark");
		}
		document.body.appendChild(el);

		setTimeout(() => {
			el.classList.add("leaving");
			setTimeout(() => el.remove(), 280);
		}, 1600);
	}

	return { show };
}
