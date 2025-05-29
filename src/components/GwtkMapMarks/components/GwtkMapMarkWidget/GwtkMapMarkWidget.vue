<template>
    <v-card
        flat
        height="100%"
    >
        <v-container class="gwtk-map-mark-widget-container">
            <div class="mb-1">
                <div class="mb-1">
                    <v-text-field
                        v-model="currentMarkName"
                        :label="$t('phrases.Name')"
                        :rules="namesRule"
                        required
                        clearable
                        dense
                        flat
                        autofocus
                        :counter="48"
                    />
                </div>
                <div class="mb-1">
                    <v-text-field
                        :label="$t('phrases.Coordinates')"
                        readonly
                        dense
                        solo
                        flat
                        hide-details
                        prepend-icon="mdi-bookmark-outline"
                        :value="markCoordinates"
                    />
                </div>
            </div>
            <div>
                <template v-if="markerList.length > 0">
                    <gwtk-icons-gallery
                        :marker-list="markerList"
                        :set-state="setState"
                        :selected-marker-id="selectedMarkerId"
                        :marker-color="markerColor"
                    />
                    <v-expansion-panels class="mt-3">
                        <gwtk-expansion-panel :title="$t('phrases.Color')">
                            <div class="v-color-picker__edit">
                                <v-color-picker
                                    mode="hexa"
                                    hide-inputs
                                    hide-mode-switch
                                    :value="markerColor"
                                    @update:color="changeMarkerColor"
                                />
                            </div>
                        </gwtk-expansion-panel>
                    </v-expansion-panels>
                </template>
                <v-textarea
                    class="mt-4"
                    :value="commentary"
                    hide-details
                    :label="$t( 'phrases.Comment' )"
                    outlined
                    single-line
                    rows="2"
                    row-height="15"
                    @change="changeComments"
                />
            </div>
        </v-container>
        <v-card-actions class="pa-0 mt-2 mb-n3 gwtk-map-mark-widget-container-action">
            <gwtk-button
                :disabled="!markReady()"
                class="py-2 my-2"
                style="width:100%"
                primary
                @click="saveMark"
            >
                {{ $t('phrases.Save') }}
            </gwtk-button>
        </v-card-actions>
    </v-card>
</template>

<script type="ts" src="./GwtkMapMarkWidget.ts" />

<style>
    .gwtk-map-mark-widget-container {
        height: calc(100% - 50px);
        overflow-y: auto;
    }

    .gwtk-map-mark-widget-container-action {
        position: absolute;
        bottom: 5px;
        height: 60px;
        width: calc(100% - 24px);
        z-index: 20;
        left: 12px;
    }
</style>
