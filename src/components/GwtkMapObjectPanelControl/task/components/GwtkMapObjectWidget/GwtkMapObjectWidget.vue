<template>
    <div
        v-if="isShowObjectsList||isShowSelectedObjectsList"
        v-show="!showProgressBar"
        class="gwtk-panel-objects"
    >
        <gwtk-tabs
            v-model="tabOptions"
            class="gwtk-tabs-toolbar"
        >
            <gwtk-tab
                key="tab_objects"
                :title="`${$t('phrases.Objects')}${showLoadedObjectsCount}`"
            />
            <gwtk-tab
                v-if="!isShowSelectedObjectsList&&!isShowSelectedObjectsPage"
                key="tab_filters"
                :title="`${$t('phrases.Filters')}${filterManager.appliedFilterItems.length ? ' (' + filterManager.appliedFilterItems.length + ')' : ''}`"
            />
        </gwtk-tabs>
        <gwtk-map-object-filters-selected
            v-if="$vuetify.breakpoint.smAndUp&&filterManager.appliedFilterItems.length!==0"
            :selected-filters-types="filterManager.appliedFilterItems"
            class="gwtk-mapobjects-filter"
            @deleteSelectedFiltersTypes="deleteSelectedFiltersTypes"
        />
        <v-tabs-items
            :value="tabOptions"
            class="gwtk-flex-1"
        >
            <v-tab-item
                value="tab_objects"
                :transition="false"
                class="gwtk-object-panel-tab"
                :style="{height: containerHeight}"
            >
                <template v-if="foundObjectsNumber===0">
                    <v-col v-if="changeSearchValue!==''" class="gwtk-flex-unset">
                        <v-text-field
                            v-model="changeSearchValue"
                            :placeholder="$t('phrases.Value')"
                            :class="isReducedSizeInterface?'v-text-field-placeholder-reduce':''"
                            dense
                            paused
                            outlined
                            clearable
                            hide-details
                            @click:clear="findObjectsBySearchValueClearClick"
                            @keyup="findObjectsBySearchValueKeyDownEnter"
                        >
                            <template #append>
                                <gwtk-icon
                                    name="search"
                                    @click="findObjectsBySearchValue"
                                />
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col class="gwtk-flex-unset">
                        {{ $t('phrases.No items found') }}
                    </v-col>
                </template>
                <template v-else>
                    <v-row class="pa-1 pb-0 gwtk-flex-unset" justify="space-between">
                        <v-col cols="auto" :class="[isReducedSizeInterface?'pt-2 pb-0 gwtk-menu':'']">
                            <v-tooltip
                                v-if="$vuetify.breakpoint.width > 1280"
                                bottom
                            >
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        :class="isReducedSizeInterface?'mx-2 my-1':'ma-2'"
                                        :icon="isShowObjectListType?'mdi-table-large':'mdi-format-list-bulleted'"
                                        :icon-size="isReducedSizeInterface?14:18"
                                        :selected="true"
                                        v-on="on"
                                        @click="changeShowListType"
                                    />
                                </template>
                                <div>
                                    {{ isShowObjectListType ? $t('phrases.Miniature') : $t('featuresamples.List') }}
                                </div>
                            </v-tooltip>
                            <gwtk-menu
                                v-if="mapObjects.length!==0 || mapObjectsSelected.length>0"
                                class="gwtk-menu"
                                theme="secondary"
                                icon="mdi-microsoft-excel"
                                :icon-size="isReducedSizeInterface?14:24"
                                icon-color="var(--v-primary-base)"
                                is-dropdown
                                :close-on-content-click="false"
                            >
                                <v-list>
                                    <v-list-group
                                        v-for="(item, index) in buttonsExportActions"
                                        :key="'itemIndex_'+index"
                                        :append-icon="null"
                                    >
                                        <template #activator>
                                            <v-list-item-content>
                                                <v-list-item-title>{{ item.title }}</v-list-item-title>
                                            </v-list-item-content>
                                        </template>
                                        <v-list-item
                                            v-for="(buttonSubMenu, bIndex) in item.subItems"
                                            :key="'buttonIndex_'+bIndex"
                                            class="ml-6"
                                            :disabled="!item.enabled && selectedObjects.length === 0"
                                            @click="processItem(item.value, buttonSubMenu.value)"
                                        >
                                            <v-list-item-icon>
                                                <v-progress-circular
                                                    v-if="buttonSubMenu.isWaitingExport"
                                                    indeterminate
                                                    color="primary"
                                                    size="16"
                                                    width="2"
                                                />
                                                <v-icon v-else>
                                                    {{ getListItemIcon(buttonSubMenu.value) }}
                                                </v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                <v-list-item-title>{{ buttonSubMenu.text }}</v-list-item-title>
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list-group>
                                </v-list>
                            </gwtk-menu>
                        </v-col>
                        <v-col
                            v-if="selectedSortType"
                            :class="[$vuetify.breakpoint.width > 1280 ? 'mt-n1' : 'mt-n3 pt-2',isReducedSizeInterface?'pt-2 pb-0 gwtk-menu':'']"
                            style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
                        >
                            <v-col class="d-flex justify-end">
                                <div
                                    v-if="showSemanticValueSelect && semantics.length > 0"
                                    style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
                                    class="mt-2 mr-2"
                                >
                                    {{ currentSemantic ? currentSemantic.name : '' }}
                                </div>
                                <v-tooltip bottom>
                                    <template #activator="{ on }">
                                        <span v-on="on">
                                            <gwtk-menu
                                                v-if="showSemanticValueSelect && semantics.length > 0"
                                                theme="secondary"
                                                icon="mdi-sort-alphabetical-variant"
                                                :icon-size="isReducedSizeInterface?14:24"
                                                icon-color="var(--v-primary-base)"
                                                is-dropdown
                                                :close-on-content-click="true"
                                            >
                                                <v-list class="gwtk-test-map-object-semantic-list" style="max-height: 500px; overflow: auto;">
                                                    <v-list-item
                                                        v-for="(item, index) in semantics"
                                                        :key="index"
                                                        @click="setSemanticFilter(item.value)"
                                                    >
                                                        <v-list-item-content>
                                                            <v-list-item-title>{{ item ? item.name : '' }}</v-list-item-title>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                </v-list>
                                            </gwtk-menu>
                                        </span>
                                    </template>
                                    <span>{{ $t('searchbyname.Semantic') }}</span>
                                </v-tooltip>
                                <span style="padding: 6px;" />
                                <v-tooltip v-if="selectedSortType" bottom>
                                    <template #activator="{ on }">
                                        <span
                                            class="gwtk-test-map-object-sort"
                                            :class="isReducedSizeInterface?'gwtk-map-object-reduce':''"
                                            v-on="on"
                                        >
                                            <gwtk-menu
                                                theme="secondary"
                                                :icon="sortButtonIcon? 'sort-ascending' : 'sort-descending' "
                                                :icon-size="isReducedSizeInterface?14:24"
                                                icon-color="var(--v-primary-base)"
                                                is-dropdown
                                                :close-on-content-click="true"
                                            >
                                                <v-list>
                                                    <v-list-item
                                                        v-for="(item, index) in sortTypes"
                                                        :key="index"
                                                        @click="setSearchFilter(item.value)"
                                                    >
                                                        <v-list-item-content>
                                                            <v-list-item-title>{{ item.text }}</v-list-item-title>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                </v-list>
                                            </gwtk-menu>
                                        </span>
                                    </template>
                                    <span>{{ $t('phrases.Sorting') }}</span>
                                </v-tooltip>
                            </v-col>
                        </v-col>
                    </v-row>
                    <div
                        v-if="selectedSortType"
                        class="d-flex justify-end"
                        :class="isReducedSizeInterface? 'mt-1':'mb-1'"
                    >
                        {{ selectedSortType.text }}
                    </div>
                    <v-progress-linear
                        :active="foundObjectsNumber===null||stateSearchObject"
                        class="mt-1"
                        color="grey"
                        rounded
                        bottom
                        indeterminate
                        height="4"
                    />
                    <template v-if="mapObjects.length>0 || mapObjectsSelected.length>0">
                        <gwtk-map-object-list-widget
                            v-if="isShowObjectListType"
                            :task-id="taskId"
                            :set-state="setState"
                            :found-objects-number="foundObjectsNumber"
                            :map-objects="mapObjects"
                            :map-objects-selected="mapObjectsSelected"
                            :really-selected-objects="reallySelectedObjects"
                            :map-objects-state="mapObjectsState"
                            :drawn-object-id="drawnObjectId"
                            :selected-map-objects="selectedObjects"
                            :table-params="tableParams"
                            :is-reduced-size-interface="isReducedSizeInterface"
                            :editing-mode="editingMode"
                            class="gwtk-flex-1"
                        />
                        <gwtk-map-object-table-widget
                            v-else
                            class="pb-5"
                            :task-id="taskId"
                            :set-state="setState"
                            :map-objects="mapObjects"
                            :map-objects-selected="mapObjectsSelected"
                            :really-selected-objects="reallySelectedObjects"
                            :map-objects-state="mapObjectsState"
                            :filter-manager="filterManager"
                            :table-params="tableParams"
                            :drawn-object-id="drawnObjectId"
                            :selected-objects="selectedObjects"
                            :show-selected-objects-page="showSelectedObjectsPage"
                            :table-map-objects="tableMapObjects"
                            :is-reduced-size-interface="isReducedSizeInterface"
                            :map-vue="mapVue"
                            :editing-mode="editingMode"
                        />
                    </template>
                </template>
                <div
                    v-if="!isShowSelectedObjectsList"
                    class="gwtk-object-panel-buttons pt-3 px-3"
                >
                    <v-layout justify-center>
                        <v-spacer />
                        <gwtk-button
                            primary
                            class="gwtk-test-mapOnjectPanelControl-select"
                            width="29%"
                            :title="$t('phrases.Select')"
                            :disabled="selectedObjects.length === 0"
                            @click="setActiveObjectCommand"
                        />
                        <gwtk-button
                            secondary
                            class="mx-2"
                            icon="double-check"
                            width="42%"
                            :disabled="foundObjectsNumber===0"
                            :title="$t('phrases.Select all')"
                            @click="paintSelectedObjectsAll"
                        />
                        <gwtk-button
                            secondary
                            width="29%"
                            :title="$t('phrases.Cancel')"
                            @click="closeMapObjectsWindow"
                        />
                        <v-spacer />
                    </v-layout>
                </div>
            </v-tab-item>
            <v-tab-item
                value="tab_filters"
                :transition="false"
            >
                <template v-if="mapObjects.length>0||filterManager.appliedFilterItems.length>0 || mapObjectsSelected.length>0">
                    <v-progress-linear
                        :active="filtersProgressBar"
                        color="grey"
                        rounded
                        bottom
                        indeterminate
                        height="4"
                    />
                    <gwtk-map-object-filters
                        :set-state="setState"
                        :found-objects-number="foundObjectsNumber"
                        :filter-manager="filterManager"
                        :is-reduced-size-interface="isReducedSizeInterface"
                        @filterApply="tabOptions='tab_objects'"
                    />
                </template>
                <v-col
                    v-else
                    class="gwtk-flex-unset"
                >
                    {{ $t('phrases.No items found') }}
                </v-col>
            </v-tab-item>
        </v-tabs-items>
        <v-overlay
            :value="showProgressBar"
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
                />
            </v-row>
        </v-overlay>
    </div>
    <gwtk-map-object-item-gallery
        v-else-if="isShowGallery"
        :set-state="setState"
        :map-object="currentMapObject"
        :request-queue="requestQueue"
        :object-all-documents="objectAllDocuments"
    />
    <gwtk-map-object-item-information
        v-else-if="isShowObjectInfo"
        :set-state="setState"
        :is-get-route-enabled="isGetRouteEnabled"
        :map-object="currentMapObject"
        :request-queue="requestQueue"
        :external-functions="externalFunctions"
        :show-progress-bar="showProgressBar"
        :found-objects-number="foundObjectsNumber"
        :current-object-index="currentObjectIndex"
        :has-documents="objectAllDocuments.length>0"
        :only-filled="onlyFilled"
    />
    <gwtk-map-object-item-editor
        v-else-if="isShowObjectEditing"
        :set-state="setState"
        :map-object="currentMapObject"
        :coordinate-display-format-value="coordinateDisplayFormatValue"
        :show-semantic-file-upload-overlay="showSemanticFileUploadOverlay"
        :map-object-editor-tab-options="editorTabOptions"
        :preview-image-src="previewImageSrc"
        :semantic-view-flags="semanticViewFlags"
        :coordinate-display-format="coordinateDisplayFormat"
        :map-vue="mapVue"
        :found-objects-number="foundObjectsNumber"
        :current-object-index="currentObjectIndex"
        :is-reduced-size-interface="isReducedSizeInterface"
    />
</template>

<script lang="ts" src="./GwtkMapObjectWidget.ts" />


<style scoped>
    .gwtk-panel-objects {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .gwtk-object-panel-tab {
        display: flex;
        flex-direction: column;
    }

    .gwtk-tabs-toolbar {
        height: 48px;
        flex: unset;
    }

    .gwtk-mapobjects-filter {
        height: 64px !important;
        flex: unset;
    }

    .gwtk-flex-1 {
        flex: 1;
    }

    .gwtk-flex-unset {
        flex: unset;
    }

    .gwtk-object-panel-buttons {
        width: 100%;
        height: 60px;
        position: absolute;
        bottom: 0;
    }
    ::v-deep .gwtk-menu .gwtk-button {
        height: unset;
        padding: 0.25rem !important;
    }
     ::v-deep .gwtk-map-object-reduce .gwtk-button {
        height: unset;
        padding: 0.25rem !important;
    }

</style>

<style>
    .gwtk-panel-objects > .v-item-group {
        height: 100%;
    }
</style>

