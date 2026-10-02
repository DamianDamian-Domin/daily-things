<template>
	<div class="pw-wrap">
		<input
			:id="id"
			v-model="model"
			:type="visible ? 'text' : 'password'"
			class="dt-input pw-input"
			:autocomplete="autocomplete"
			:aria-describedby="describedBy"
			:placeholder="placeholder"
			required />
		<button
			type="button"
			class="dt-icon-btn pw-toggle"
			:aria-label="visible ? 'Hide password' : 'Show password'"
			:aria-pressed="visible"
			@click="visible = !visible">
			<i
				:class="visible ? 'pi pi-eye-slash' : 'pi pi-eye'"
				aria-hidden="true"></i>
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

withDefaults(
	defineProps<{
		id: string;
		autocomplete?: string;
		describedBy?: string;
		placeholder?: string;
	}>(),
	{ autocomplete: "current-password", placeholder: "••••••••" },
);

const model = defineModel<string>({ default: "" });
const visible = ref(false);
</script>

<style scoped>
.pw-wrap {
	position: relative;
}
.pw-input {
	padding-right: 3rem;
}
.pw-toggle {
	position: absolute;
	right: 0.2rem;
	top: 50%;
	transform: translateY(-50%);
	width: 2.4rem;
	height: 2.4rem;
}
.pw-toggle:active:not(:disabled) {
	transform: translateY(-50%) scale(0.92);
}
</style>
