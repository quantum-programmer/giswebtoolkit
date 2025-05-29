<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        class="gwtk-map-legend"
    >
        <v-container class="gwtk-main-container">
            <v-row dense>
                <v-col
                    cols="auto"
                    class="gwtk-search-layer"
                >
                    <v-tooltip left bottom>
                        <template #activator="{ on }">
                            <gwtk-button
                                :disabled="selectedMapLayerId.length===0&&!allActiveLayers"
                                icon="search"
                                secondary
                                :selected="showSearch"
                                v-on="on"
                                @click.stop="clickShowSearch()"
                            />
                        </template>
                        <div v-if="!showSearch">
                            {{ $t('legend.Enable search') }}
                        </div>
                        <div v-else>
                            {{ $t('legend.Disable search') }}
                        </div>
                    </v-tooltip>
                </v-col>
                <v-col
                    cols="9"
                >
                    <v-select
                        v-if="!showSearch"
                        :value="allActiveLayers? allLayersItem : selectedMapLayerId"
                        :items="layers"
                        item-text="layerName"
                        item-value="layerId"
                        dense
                        flat
                        hide-details
                        outlined
                        solo
                        :placeholder="$t('phrases.Select layer')"
                        :disabled="layerSelectIsDisabled"
                        @change="changeLayerId"
                    />
                    <v-text-field
                        v-else
                        :value="searchValue"
                        outlined
                        dense
                        flat
                        hide-details
                        solo
                        clearable
                        :label="$t( 'phrases.Search' )"
                        @input="onInputSearch"
                    />
                </v-col>
                <v-col
                    v-if="!layerStyleSettingsMode"
                    cols="auto"
                    class="gwtk-search-layer"
                >
                    <v-tooltip left bottom>
                        <template #activator="{ on }">
                            <gwtk-button
                                :disabled="creatingObjectMode||(selectedMapLayerId.length===0&&!allActiveLayers)"
                                icon="mdi-pencil-outline"
                                secondary
                                :selected="!readOnlyMode"
                                v-on="on"
                                @click.stop="toggleReadonlyMode()"
                            />
                        </template>
                        <div v-if="readOnlyMode">
                            {{ $t('legend.Enable editing') }}
                        </div>
                        <div v-else>
                            {{ $t('legend.Disable editing') }}
                        </div>
                    </v-tooltip>
                </v-col>
            </v-row>
            <div
                v-if="currentMapLegendItemWrapper.mapLegendItem || showCreateObject"
                class="gwtk-legend-container-view-mode"
            >
                <template
                    v-if="!creatingObjectMode"
                >
                    <v-row
                        v-if="isClassifierObject&&!showSearch"
                        no-gutters
                    >
                        <gwtk-map-legend-toolbar
                            :set-state="setState"
                            :selected-show-legends-type="selectedShowLegendsType"
                            :is-visibility-available="isVisibilityAvailable"
                        />
                    </v-row>
                    <gwtk-map-legend-group-widget
                        v-if="currentMapLegendItemWrapper.mapLegendItem && (isGroupMode || showSearch)"
                        :set-state="setState"
                        :layer-id="selectedMapLayerId"
                        :search-object="searchObject"
                        :map-legend-item-selected="mapLegendItemSelected"
                        :map-legend-items-selected-list="mapLegendItemsSelectedList"
                        :current-map-legend-item-wrapper="currentMapLegendItemWrapper"
                        :legend-show-mode="legendShowMode"
                        :show-search="showSearch"
                        :search-result="searchResult"
                        :is-visibility-available="isVisibilityAvailable"
                        :all-active-layers="allActiveLayers"
                        class="gwtk-legend-list"
                        @changeCurrentMapLegendItem="changeCurrentLegendItem"
                    />
                    <gwtk-map-legend-list-widget
                        v-else-if="currentMapLegendItemWrapper.mapLegendItem && isListMode"
                        :map-vue="mapVue"
                        :set-state="setState"
                        :map-legend-item-selected="mapLegendItemSelected"
                        :map-legend-items-selected-list="mapLegendItemsSelectedList"
                        :legend-item-wrapper-list="legendItemWrapperList"
                        :legend-show-mode="legendShowMode"
                        :is-visibility-available="isVisibilityAvailable"
                        :all-active-layers="allActiveLayers"
                        :selected-map-layer-id="selectedMapLayerId"
                        class="gwtk-legend-list"
                    />
                    <gwtk-map-legend-tree-widget
                        v-else
                        :set-state="setState"
                        :current-map-legend-item-wrapper="currentMapLegendItemWrapper"
                        :open-tree-element="openTreeElement"
                        :is-visibility-available="isVisibilityAvailable"
                        :selected-map-layer-id="selectedMapLayerId"
                        :map-legend-items-selected-list="mapLegendItemsSelectedList"
                        :map-layers-with-legend-descriptions="mapLayersWithLegendDescriptions"
                        :all-active-layers="allActiveLayers"
                        :legend-show-mode="legendShowMode"
                        :legend-item-wrapper-list="legendItemWrapperList"
                    />
                </template>
                <template v-else>
                    <v-row dense class="mt-2 px-1">
                        <gwtk-tabs
                            v-model="activeTab"
                        >
                            <gwtk-tab
                                v-show="!hasNoLegend"
                                :title="$t('legend.Object of map')"
                                :disabled="disabledTab"
                            />
                            <gwtk-tab
                                :title="$t('legend.Graphic object')"
                            />
                        </gwtk-tabs>
                    </v-row>
                    <v-row v-if="!isClassifierObject" class="gwtk-legend-container-creation-mode mt-0 mx-0">
                        <gwtk-graphic-object-params-widget
                            :map-vue="mapVue"
                            :set-state="setState"
                            :style-options="styleOptions"
                            :map-layer="mapLayer"
                            :creating-object-type="creatingObjectType"
                            :disabled-tab="disabledTab"
                            :marker-image-list="markerImageList"
                            :map-markers-commands="mapMarkersCommands"
                            :marker-category-list="markerCategoryList"
                            :preview-image-src="previewImageSrc"
                            class="gwtk-full-size"
                        />
                    </v-row>
                    <v-row
                        v-if="currentMapLegendItemWrapper.mapLegendItem && isClassifierObject"
                        class="gwtk-legend-container-creation-mode mt-0 mx-0"
                    >
                        <gwtk-map-legend-group-widget
                            :set-state="setState"
                            :layer-id="selectedMapLayerId"
                            :search-object="searchObject"
                            :map-legend-item-selected="mapLegendItemSelected"
                            :current-map-legend-item-wrapper="currentMapLegendItemWrapper"
                            :legend-show-mode="legendShowMode"
                            :show-search="showSearch"
                            :search-result="searchResult"
                            :is-visibility-available="isVisibilityAvailable"
                            :all-active-layers="allActiveLayers"
                            class="gwtk-full-size-list"
                            @changeCurrentMapLegendItem="changeCurrentLegendItem"
                        />
                    </v-row>
                    <v-row class="mx-0" justify="space-around">
                        <v-tooltip
                            v-for="button in buttons"
                            :key="button.id"
                            bottom
                            :disabled="!button.enabled"
                        >
                            <template #activator="{ on }">
                                <v-col cols="auto" class="pa-2">
                                    <gwtk-button
                                        secondary
                                        :icon="button.options.icon"
                                        :disabled="!button.enabled"
                                        :selected="button.active"
                                        v-on="on"
                                        @click="activateDrawingTypeButton(button.id)"
                                    />
                                </v-col>
                            </template>
                            <div>{{ $t(button.options.title) }}</div>
                        </v-tooltip>
                    </v-row>
                    <v-row>
                        <v-col>
                            <gwtk-button
                                primary
                                width-available
                                :title="$t('legend.Select')"
                                :disabled="!selectEnabled"
                                @click="toggleSelect"
                            />
                        </v-col>
                        <v-col>
                            <gwtk-button
                                secondary
                                width-available
                                :title="$t('legend.Finish')"
                                @click="toggleFinish"
                            />
                        </v-col>
                    </v-row>
                </template>
            </div>
        </v-container>
        <v-overlay
            :value="!!activeRequestCancelHandler"
            absolute
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="activeRequestCancelHandler"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapLegendWidget.ts" />

<style scoped>
    .gwtk-search-layer {
        width: 50px;
    }

    .gwtk-main-container {
        height: 100%;
    }

    .gwtk-legend-container-view-mode {
        height: calc(100% - 32px);
    }

    .gwtk-legend-list {
        height: calc(100% - 60px);
        width: 100%;
    }

    .gwtk-legend-container-creation-mode {
        height: calc(100% - 166px);
    }

    .gwtk-full-size-list {
        height: 100%;
        width: 100%;
    }

    .gwtk-full-size {
        height: 100%;
        width: 100%;
    }
</style>

<style>
    .v-slide-group__prev {
        display: contents !important;
    }

    .v-slide-group__next {
        display: contents !important;
    }
</style>

