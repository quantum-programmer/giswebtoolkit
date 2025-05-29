<template>
    <v-btn
        :rounded="$attrs.tile===false"
        icon
        :outlined="secondary!==false"
        :style="{background:backgroundColor}"
        :class="{
            'v-btn--active': selected!==false && disabled===false,
            [currentClass]:true
        }"
        :disabled="disabled!==false"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <gwtk-icon
            :name="icon"
            :size="iconSize"
            :color="iconColor"
        />
        <slot />
    </v-btn>
</template>

<script lang="ts" src="./GwtkIconButton.ts"></script>

<style scoped>
    .gwtk-primary {
        background-color: var(--v-primary-base);
    }

    .gwtk-primary.v-btn--active {
        background: var(--v-primary-base) linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3));
    }

    .gwtk-primary.v-btn--icon > .v-btn__content * {
        color: var(--color-white);
    }

    .gwtk-secondary {
        border-color: var(--v-secondary-lighten5);
    }

    .gwtk-secondary.theme--light {
        background-color: var(--color-white);
    }

    .gwtk-secondary.theme--light.v-btn--active {
        background: var(--v-primary-lighten4);
    }

    .gwtk-secondary.theme--light.v-btn--active:before {
        background: unset;
    }

    .gwtk-secondary.theme--dark {
        background-color: #1e1e1e;
    }

    .gwtk-secondary.theme--dark.v-btn--active {
        background: var(--v-primary-base);
    }

    .gwtk-secondary.v-btn--icon.theme--light:not(.v-btn--disabled) > .v-btn__content * {
        color: var(--v-primary-base);
    }

    .gwtk-secondary.v-btn--icon.theme--dark:not(.v-btn--disabled) > .v-btn__content * {
        color: var(--color-white);
    }

    .gwtk-clean.theme--light.v-btn--active {
        background: var(--v-primary-lighten4);
    }

    .gwtk-clean.theme--dark.v-btn--active {
        background: var(--v-primary-base);
    }

    .gwtk-clean.theme--light.v-btn--active:before {
        background: unset;
    }

    .gwtk-clean.v-btn--icon.theme--light > .v-btn__content * {
        color: var(--v-primary-base);
    }

    .gwtk-empty.v-btn--icon.v-btn--active:before {
        background: unset;
    }

    .gwtk-empty.v-btn--icon.v-btn--active > .v-btn__content * {
        color: var(--v-primary-base);
    }
</style>
