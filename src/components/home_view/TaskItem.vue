<template>
    <div :class="taskStyle" class="w-12 h-12 flex justify-center items-center rounded-md shadow-sm">
        <i class="material-icons">{{ data.icon }}</i>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    data: Object
})

const taskStyle = computed(() => {
    switch (props.data.severity) {
        case 'success':
            return 'surface-success'
        case 'danger':
            return 'surface-danger'
        case 'warning':
            return 'surface-warning'
        case 'empty':
            return 'border-secondary border border-dashed'
        default:
            return 'surface-content-a'
    }
})

</script>

<style  scoped>

</style>