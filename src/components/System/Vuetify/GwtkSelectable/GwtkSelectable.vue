<template>
    <div
        class="gwtk-selectable-parent"
        :class="{
            'gwtk-fill': fill!==false,
            'gwtk-border': border!==false,
            'gwtk-disabled': disabled!==false,
        }"
    >
        <slot />
    </div>
</template>

<script lang="ts" src="./GwtkSelectable.ts"></script>

<style scoped>
    .theme--light .gwtk-selectable-parent.gwtk-fill > * {
        background: var(--v-primary-lighten3) !important;
    }

    .theme--dark .gwtk-selectable-parent.gwtk-fill > * {
        background: var(--v-primary-darken3) !important;
    }

    .gwtk-selectable-parent.gwtk-border > * {
        box-shadow: var(--v-primary-base) 0 0 0 2px inset;
    }

    .gwtk-selectable-parent.gwtk-disabled > * {
        pointer-events: none;
        opacity: 0.55;
    }
</style>