<template>
    <Button class="w-12 h-12 border-dashed" severity="secondary" variant="outlined" v-if="props.data.severity === 'empty'">
        <span class="material-icons material-symbols-outlined">{{ data.icon}}</span>
    </Button>
    <Button :severity="props.data.severity" class="w-12 h-12" v-else>
            <span class="material-icons material-symbols-outlined">{{ data.icon}}</span>
    </Button>
</template>

<script setup>
import { computed } from "vue";
import { Button } from 'primevue';

const props = defineProps({
	data: Object,
});

const emit = defineEmits(["select", "click"]);

function handleClick() {
	emit("select", props.data);
	emit("click", props.data);
}


</script>

<style scoped></style>
