<template>
    <v-chip
        v-blur
        class="gwtk-chip"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <slot />
        <gwtk-icon-button
            v-if="withClose!==false"
            v-blur
            class="ml-1"
            icon="close-icon"
            :icon-size="20"
            icon-color="var(--v-primary-base)"
            @mousedown="$emit('close')"
        />
    </v-chip>
</template>

<script lang="ts" src="./GwtkChip.ts"></script>
<style scoped>
    .gwtk-chip {
        min-height: 40px;
        padding: var(--space-s) var(--space-l);
        line-height: var(--line-height-m);
        border: 1px solid transparent;
        border-radius: var(--border-radius-l);
    }
</style>