<template>
    <v-expansion-panel
        class="gwtk-expansion-panel"
        :class="themeClass"
    >
        <v-expansion-panel-header
            class="gwtk-expansion-panel-header"
            :class="activeClass"
            :hide-actions="hideActions"
            :expand-icon="expandIcon"
            @click="$emit('click:header')"
        >
            <div
                v-if="icon"
                class="gwtk-expansion-panel-header-folder-wrap"
            >
                <gwtk-icon
                    :name="icon"
                    :size="18"
                />
            </div>
            <template v-else>
                <slot name="prefix" />
            </template>

            <div class="gwtk-expansion-panel-header-inner">
                <slot
                    v-if="headSlot"
                    name="expansion-panel-header"
                />
                <template v-else>
                    <span class="gwtk-expansion-panel-header-title">{{ title }}</span>
                    <span
                        v-if="extraHeadData!=='' "
                        class="gwtk-expansion-panel-header-extra-data text-caption text--secondary"
                    >
                        {{ extraHeadData }}
                    </span>
                </template>
            </div>
        </v-expansion-panel-header>

        <v-expansion-panel-content
            v-if="!hideContent"
            :style="{maxHeight: maxContentHeight}"
            class="gwtk-expansion-panel-content"
        >
            <slot />
        </v-expansion-panel-content>
    </v-expansion-panel>
</template>

<script lang="ts" src="./GwtkExpansionPanel.ts"></script>

<style>
    .gwtk-expansion-panel {
        border: 1px solid var(--v-secondary-lighten5);
        overflow: hidden;
    }

    .theme--dark .gwtk-expansion-panel {
        border: 1px solid var(--v-secondary-base);
        overflow: hidden;
    }

    .v-expansion-panels > .gwtk-expansion-panel {
        border-radius: var(--border-radius-s);
    }

    .gwtk-expansion-panel:not(:last-child) {
        margin-bottom: 16px;
    }

    .gwtk-expansion-panel.v-expansion-panel::before {
        content: none;
    }

    /* head */

    .gwtk-expansion-panel .gwtk-expansion-panel-header {
        padding: 10px var(--space-l);
        min-height: var(--expansion-panel-header-height);
    }

    .gwtk-expansion-panel-header {
        justify-content: space-between;
        text-align: left;
    }

    .gwtk-expansion-panel .gwtk-expansion-panel-header .gwtk-expansion-panel-header-folder-wrap {
        flex: 0 0 40px;
    }

    .gwtk-expansion-panel-header-folder-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 12px;
    }

    .gwtk-expansion-panel-header-inner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-right: 15px;
    }

    .gwtk-expansion-panel-header-extra-data {
        display: block;
        margin-top: 5px;
        line-height: var(--line-height-s);
    }

    .gwtk-expansion-panel-header-title {
        line-height: normal;
    }

    /* content */

    .gwtk-expansion-panel-content {
        border-top: 1px solid var(--v-secondary-lighten5);
        overflow-y: auto;
    }

    .theme--dark .gwtk-expansion-panel-content {
        border-top: 1px solid var(--v-secondary-base);
        overflow-y: auto;
    }

    /* styles redefinition */

    .gwtk-expansion-panel .v-expansion-panel-content__wrap {
        padding: var(--space-l);
    }

    .gwtk-expansion-panel.v-expansion-panel--active:not(:first-child),
    .gwtk-expansion-panel.v-expansion-panel--active + .v-expansion-panel {
        margin-top: 0;
    }

    .gwtk-expansion-panel.v-expansion-panel:not(:first-child)::after {
        border-top: none;
    }

    /* clean theme */
    .gwtk-expansion-panel.gwtk-expansion-panel-theme-clean.v-expansion-panel {
        border: none;
        padding: 0;
        min-height: auto;
    }
</style>