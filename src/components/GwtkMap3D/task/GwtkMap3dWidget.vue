<template>
    <div class="map-3d-panel mr-15">
        <v-tooltip left>
            <template #activator="{ on }">
                <gwtk-button
                    icon="3d-up"
                    class="mb-2 map-3d-panel-button map-3d-panel-item-border"
                    v-on="on"
                    @mousedown="toggleUp"
                    @mouseup="toggleUpStop"
                    @mouseout="toggleUpStop"
                />
            </template>
            <div>{{ $t('phrases.Tilt forward') }}</div>
        </v-tooltip>
        <v-tooltip left>
            <template #activator="{ on }">
                <gwtk-button
                    icon="3d-down"
                    class="mb-2 map-3d-panel-button map-3d-panel-item-border"
                    v-on="on"
                    @mousedown="toggleDown"
                    @mouseup="toggleUpStop"
                    @mouseout="toggleUpStop"
                />
            </template>
            <div>{{ $t('phrases.Tilt back') }}</div>
        </v-tooltip>
        <v-sheet class="mb-2 map-3d-panel-compound map-3d-panel-item-border">
            <v-tooltip left no-click-animation>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        icon="3d-arrow-cw"
                        class="map-3d-panel-compound-button"
                        v-on="on"
                        @mousedown="toggleCw"
                        @mouseup="toggleCwStop"
                        @mouseout="toggleCwStop"
                    />
                </template>
                <div>{{ $t('phrases.Rotate right') }}</div>
            </v-tooltip>
            <v-tooltip left>
                <template #activator="{ on }">
                    <div
                        class="map-3d-panel-compass-arrow"
                        :style="'transform: rotate3d(0, 0, 1, '+params3d.rotate+'rad)'"
                        v-on="on"
                        @click="toggleCompass"
                    />
                </template>
                <div>{{ $t('phrases.Reset rotation angle') }}</div>
            </v-tooltip>
            <v-tooltip left no-click-animation>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        icon="3d-arrow-ccw"
                        class="map-3d-panel-compound-button"
                        v-on="on"
                        @mousedown="toggleCcw"
                        @mouseup="toggleCwStop"
                        @mouseout="toggleCwStop"
                    />
                </template>
                <div>{{ $t('phrases.Rotate left') }}</div>
            </v-tooltip>
        </v-sheet>
        <v-tooltip left>
            <template #activator="{ on }">
                <gwtk-button
                    :icon="params3d.lightSource === 0? '3d-light-source-projector' : '3d-light-source-sun'"
                    class="mb-2 map-3d-panel-button map-3d-panel-item-border"
                    v-on="on"
                    @click="toggleLightSource"
                />
            </template>
            <div>{{ $t('phrases.Light source') }}</div>
        </v-tooltip>
        <v-tooltip left>
            <template #activator="{ on }">
                <gwtk-button
                    :primary="params3d.viewMode === 1"
                    icon="3d-wireframe-view"
                    class="mb-2 map-3d-panel-button map-3d-panel-item-border"
                    v-on="on"
                    @click="toggleViewMode"
                />
            </template>
            <div>{{ $t('phrases.Wireframe object view') }}</div>
        </v-tooltip>
        <gwtk-menu
            :close-on-content-click="false"
            top left
        >
            <template #trigger="{ on, attrs, value }">
                <v-sheet style="border-radius: 20%">
                    <gwtk-tool-button
                        icon="3d-tools"
                        :tooltip-text="$t('phrases.3D tools')"
                        :selected="value"
                        v-bind="attrs"
                        v-on="on"
                    />
                </v-sheet>
            </template>
            <v-list>
                <template v-for="(item,index) in taskDescriptionList">
                    <gwtk-list-item
                        :key="index"
                        :title="$t(item.options.title)"
                        :icon="item.options.icon"
                        :disabled="!item.enabled"
                        :selected="item.active"
                        @click="toggleTools3d(item)"
                    />
                    <v-divider
                        v-if="index === 3"
                        :key="index+taskDescriptionList.length"
                    />
                </template>
            </v-list>
        </gwtk-menu>
    </div>
</template>

<script lang="ts" src="./GwtkMap3dWidget.ts" />

<style scoped>
    .map-3d-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .map-3d-panel > * {
        pointer-events: all;
    }

    .map-3d-panel-button {
        max-width: 3em;

    }

    .map-3d-panel-compound {
        display: flex;
        padding-top: 1em;
        padding-bottom: 1em;
        border-radius: 50%;
    }

    .theme--light .map-3d-panel-item-border {
        border: 0.1em solid var(--v-secondary-lighten5)
    }

    .theme--dark .map-3d-panel-item-border {
        border: 0.1em solid var(--v-secondary-darken4);
    }

    .v-btn--icon.v-size--default.map-3d-panel-compound-button {
        height: 2.2em;
        width: 1.6em
    }

    .map-3d-panel-compound-button:hover {
        cursor: pointer;
    }

    .map-3d-panel-compound-button:focus {
        outline: none;
    }

    .map-3d-panel-compass-arrow {
        height: 2.2em;
        width: 1.6em;
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAxMCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTIwMjggMS4yNDc1Nkw4LjM5ODIzIDEySDEuNDQyMzRMNC45MjAyOCAxLjI0NzU2WiIgZmlsbD0iIzI4QTFEMSIgc3R5bGU9ImZpbGw6ICMyOEExRDE7Ii8+CjxwYXRoIGQ9Ik00LjkyMDI4IDIyLjc1MjRMOC4zOTgyMyAxMkgxLjQ0MjM0TDQuOTIwMjggMjIuNzUyNFoiIGZpbGw9IiNFMzI1MkUiIHN0eWxlPSJmaWxsOiAjRTMyNTJFOyIvPgo8L3N2Zz4K);
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
    }

</style>

<style>
    .map-3d-panel-compound-button * {
        height: 2.5em;
    }


</style>
