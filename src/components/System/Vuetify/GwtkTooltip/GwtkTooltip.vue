<template>
    <v-tooltip
        content-class="gwtk-tooltip"
        :disabled="!text"
        :bottom="bottomValue"
        :top="topValue"
        :left="leftValue"
        :right="rightValue"
        v-bind="$attrs"
    >
        <template #activator="{ on, attrs }">
            <slot name="activator" v-bind="{ on, attrs }" />
        </template>

        <span class="gwtk-tooltip-text">
            {{ text }}
            <slot name="tooltip-content" />
        </span>
    </v-tooltip>
</template>

<script lang="ts" src="./GwtkTooltip.ts"></script>

<style scoped>
    .gwtk-tooltip {
        padding: var(--space-m) var(--space-l);
        background: var(--v-secondary-base);
        border-radius: var(--border-radius-m);
    }
</style>