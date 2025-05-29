<template>
    <gwtk-task-container-item
        class="gwtk-search-by-semantic"
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <div class="gwtk-main-container">
            <v-container class="pt-0">
                <v-row dense>
                    <v-col>
                        {{ $t('phrases.Layer') }}
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col>
                        <v-select
                            :items="layersList"
                            :value="selectedLayerId"
                            :placeholder="$t('phrases.Select layer')"
                            outlined
                            dense
                            hide-details
                            :menu-props="{ bottom: true, offsetY: true }"
                            @change="selectLayer"
                        />
                    </v-col>
                </v-row>
            </v-container>
            <v-card
                class="gwtk-tab-container"
                elevation="0"
            >
                <v-tabs
                    :value="searchTab"
                    @change="selectSearchTab"
                >
                    <v-tab key="Numbers">
                        {{ $t('searchbysemantic.Numbers') }}
                    </v-tab>
                    <v-tab key="Semantic">
                        {{ $t('searchbysemantic.Semantic') }}
                    </v-tab>
                    <v-tab key="Measurements">
                        {{ $t('searchbysemantic.Measurements') }}
                    </v-tab>
                </v-tabs>

                <v-card-text class="pa-2">
                    <v-tabs-items :value="searchTab">
                        <v-tab-item key="Numbers">
                            <gwtk-search-by-object-number
                                :set-state="setState"
                                :selected-layer-id="selectedLayerId"
                                :object-number-search-params="objectNumberSearchParams"
                            />
                        </v-tab-item>
                        <v-tab-item key="Semantic">
                            <gwtk-search-by-semantics
                                v-if="selectedLayerId"
                                :set-state="setState"
                                :semantic-search-params="semanticSearchParams"
                            />
                            <v-col v-else>
                                {{ $t('phrases.Select layer') }}
                            </v-col>
                        </v-tab-item>
                        <v-tab-item key="Measurements">
                            <gwtk-search-by-measurements
                                :set-state="setState"
                                :selected-layer-id="selectedLayerId"
                                :measurement-search-params="measurementSearchParams"
                            />
                        </v-tab-item>
                    </v-tabs-items>
                </v-card-text>
            </v-card>
        </div>
        <v-col>
            <gwtk-checkbox
                :disabled="isDisabled"
                :value="visibleOnCurrentScale"
                :label="$t('phrases.Search only visible objects')"
                @change="checkVisibleOnCurrentScale"
            />
        </v-col>
        <v-row no-gutters>
            <v-spacer />
            <gwtk-button
                primary
                width="45%"
                :disabled="isDisabled"
                :title="$t('phrases.Find')"
                @click="performSearch"
            />
            <v-spacer />
            <gwtk-button
                secondary
                width="45%"
                :disabled="isDisabled"
                :title="$t('phrases.Reset all')"
                @click="resetAll"
            />
            <v-spacer />
        </v-row>
        <v-overlay
            :value="!!activeRequestCancelHandler"
            absolute
            z-index="100"
        >
            <v-row
                no-gutters
                dense
                align="center"
                justify="center"
            >
                <v-progress-circular
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="activeRequestCancelHandler()"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkSearchBySemanticsWidget.ts" />

<style scoped>
    .gwtk-main-container {
        height: calc(100% - 84px);
        overflow-x: hidden;
        overflow-y: auto;
    }

    .gwtk-tab-container {
        height: calc(100% - 132px);
        min-height: 300px;
    }

    .gwtk-tab-container .v-card__text {
        height: 100%;
    }

    .gwtk-tab-container .v-card__text .v-tabs-items {
        height: 100%;
    }

    .gwtk-tab-container .v-card__text .v-tabs-items .v-window-item {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }
</style>

