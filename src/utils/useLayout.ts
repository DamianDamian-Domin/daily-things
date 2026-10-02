import { readonly, ref } from "vue";

// Jeden wspólny „przełącznik” układu mobile/desktop dla całej aplikacji
const MOBILE_QUERY =
	"(max-width: 640px), (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse)";

const isMobile = ref(false);

if (typeof window !== "undefined" && window.matchMedia) {
	const mq = window.matchMedia(MOBILE_QUERY);
	isMobile.value = mq.matches;
	mq.addEventListener("change", () => (isMobile.value = mq.matches));
}

export function useLayout() {
	return { isMobile: readonly(isMobile) };
}
