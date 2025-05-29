<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <div class="gwtk-main-container mx-2">
            <div ref="previewContainer" class="gwtk-print-preview-container mb-1">
                <div
                    v-if="isPreviewReady"
                    :style="chessDivStyle"
                    class="gwtk-image-chess-background"
                >
                    <div
                        :style="{backgroundImage: 'url('+imageParams.srcString+')'}"
                        class="gwtk-image-container"
                    />
                </div>
                <div
                    v-else
                    class="gwtk-empty-image-div"
                >
                    <v-progress-circular
                        class="gwtk-progress-icon"
                        size="40"
                        indeterminate
                        color="var(--v-secondary-lighten1)"
                    />
                </div>
            </div>
            <div class="pa-1 gwtk-print-toolbar">
                <v-select
                    v-model="printItemSelected"
                    :items="printItems"
                    class="mb-4"
                    dense
                    hide-details
                    solo
                    outlined
                    flat
                />
                <v-row no-gutters class="gwtk-controls-row my-4" align="center">
                    <v-select
                        :value="printScaleSelected"
                        :items="scales"
                        dense
                        hide-details
                        outlined
                        flat
                        class="gwtk-scale-selector"
                        :label="$t('phrases.Map scale')"
                        @change="printScaleChanged"
                    />
                    <div class="gwtk-controls-row-item">
                        <gwtk-button
                            secondary
                            :disabled="!isPreviewReady"
                            :title="$t('phrases.Print area')"
                            @click="selectFrame()"
                        />
                        <v-switch
                            :label="$t('phrases.Map objects')"
                            class="mt-0"
                            :value="printMapObjectsInfo"
                            :disabled="!printMapObjects"
                            @change="onPrintMapObjectsInfo()"
                        />
                    </div>
                </v-row>
                <v-textarea
                    v-if="showTextArea"
                    :value="printComment"
                    dense
                    hide-details
                    rows="3"
                    :label="$t( 'phrases.Enter comment' )"
                    outlined
                    single-line
                    @change="commentChanged"
                />
            </div>
        </div>
        <div class="mx-2">
            <gwtk-button
                primary
                width-available
                :disabled="!isPreviewReady"
                :title="$t('phrases.Print')"
                @click="printMap()"
            />
        </div>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkPrintMapWidget.ts" />

<style scoped>
    .gwtk-main-container {
        height: calc(100% - 36px);
    }

    .gwtk-empty-image-div {
        height: 100%;
    }

    .gwtk-progress-icon {
        left: calc(50% - 20px);
        top: calc(50% - 20px);
    }

    .gwtk-print-toolbar {
        height: calc(100% - 308px);
        overflow-y: auto;
        overflow-x: hidden;
    }

    .gwtk-scale-selector {
        max-width: 150px;
    }

    .gwtk-controls-row {
        gap: 1em;
        width: calc(100% + 1em);
    }

    .gwtk-controls-row-item {
        display: flex;
        gap: 1em;
    }

    .gwtk-print-preview-container {
        height: 300px;
        width: 100%;

        display: flex;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
    }

    .gwtk-image-container {
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
    }
</style>
