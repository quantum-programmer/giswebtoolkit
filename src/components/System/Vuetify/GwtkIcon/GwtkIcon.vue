<template>
    <v-icon
        v-if="isMaterialDesignIcon"
        :size="size"
        :style="{color:color?color+'!important':''}"
        :class="{
            'gwtk-primary-icon': primary!==false,
            'gwtk-mdi-icon-color' : true
        }"
        v-on="$listeners"
    >
        {{ name }}
    </v-icon>
    <svg
        v-else
        :width="size"
        :height="size"
        class="gwtk-svg-icon"
        :class="{
            'gwtk-primary-icon': primary!==false
        }"
        :style="{color}"
        v-on="$listeners"
    >
        <use :href="iconSrc" />
    </svg>
</template>

<script lang="ts" src="./GwtkIcon.ts"></script>

<style scoped>
    .gwtk-svg-icon {
        fill: currentColor;
    }

    .theme--light .gwtk-primary-icon {
        color: var(--v-primary-lighten1);
    }

    .theme--dark .gwtk-primary-icon {
        color: var(--v-primary-darken1);
    }

    .gwtk-mdi-icon-color {
        color: inherit;
    }
</style>