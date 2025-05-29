<template>
    <v-btn
        v-blur
        class="gwtk-button py-2"
        :class="{
            'v-btn--active': selected!==false && disabled===false,
            'px-2':icon&&!title,
            [`align-${alignContent}`]:true,
            [currentClass]:true
        }"
        depressed
        :block="widthAvailable"
        :outlined="secondary!==false||clean!==false"
        :text="clean!==false"
        :disabled="disabled!==false"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <gwtk-icon
            v-if="icon"
            :class="title? 'mr-2':''"
            :name="icon"
            :size="iconSize"
            :color="iconColor"
        />
        <span
            v-if="title"
            class="gwtk-button-title"
        >
            {{ title }}
        </span>
        <div>
            <slot />
        </div>
    </v-btn>
</template>

<script lang="ts" src="./GwtkButton.ts"></script>

<style scoped>

    .gwtk-button {
        line-height: var(--line-height-m);
        letter-spacing: 0.05em;
        text-transform: none;
        text-indent: 0;
        border-radius: var(--border-radius-s);
        transition: background-color .6s;
        max-width: 100%;
    }

    .gwtk-button.v-btn.v-size--default {
        min-width: unset;
    }

    .gwtk-button.v-btn[class*='theme--']:hover:before {
        opacity: 0.25;
    }

    .gwtk-button.v-btn[class*='theme--'].v-btn--active:before {
        opacity: 0;
    }

    /* align */
    .gwtk-button.align-left {
        justify-content: flex-start;
    }

    .gwtk-button.align-center {
        justify-content: center;
    }

    .gwtk-button.align-right {
        justify-content: flex-end;
    }

    /* theme == 'primary' */
    .gwtk-primary.v-btn.v-btn--has-bg {
        background-color: var(--v-primary-base);
    }

    .gwtk-primary.v-btn.v-btn--has-bg.v-btn--active {
        background: var(--v-primary-base) linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3));
    }


    /* theme == 'secondary' */
    .gwtk-secondary {
        border-color: var(--v-secondary-lighten5);
    }

    .gwtk-secondary.theme--light {
        background-color: var(--color-white);
    }

    .gwtk-secondary.theme--light.v-btn--active {
        background: var(--v-primary-lighten1);
    }

    .gwtk-secondary.theme--dark {
        background-color: #1e1e1e;
        border-color: var(--v-secondary-base);
    }

    .gwtk-secondary.theme--dark.v-btn--active {
        background: var(--v-primary-darken1);
    }

    /* theme == 'clean' */
    .gwtk-clean.theme--light.v-btn--active {
        background: var(--v-primary-lighten1);
    }

    .gwtk-clean.theme--dark.v-btn--active {
        background: var(--v-primary-darken3);
    }


    .gwtk-clean.v-btn:not(.v-btn--round).v-size--default {
        height: unset;
    }

    .gwtk-button-title {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
</style>

<style>
    .gwtk-button.theme--light {
        background: white;
    }

    .gwtk-button.theme--dark {
        background: black;
    }

    .gwtk-button > .v-btn__content {
        max-width: 100%;
    }

    .gwtk-primary.v-btn > .v-btn__content > * {
        color: var(--color-white);
    }

    .gwtk-secondary.theme--light:not(.v-btn--disabled) > .v-btn__content * {
        color: var(--v-primary-base);
    }

    .gwtk-secondary.theme--dark:not(.v-btn--disabled) > .v-btn__content * {
        color: var(--color-white);
    }

    .gwtk-secondary.theme--light.v-btn--active > .v-btn__content * {
        color: var(--color-white);
    }

    .gwtk-secondary.theme--dark.v-btn--active > .v-btn__content * {
        color: var(--color-white);
    }

    .gwtk-clean.theme--light.v-btn--active > .v-btn__content * {
        color: var(--color-white);
    }
</style>