<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="350"
    >
        <v-overlay
            v-model="isBlocked"
            absolute
        >
            <v-tooltip
                top
            >
                <template
                    #activator="{on}"
                >
                    <v-progress-circular
                        indeterminate
                        v-on="on"
                        @click="unlock"
                    >
                        <v-icon>
                            mdi-close
                        </v-icon>
                    </v-progress-circular>
                </template>
                <template
                    #default
                >
                    {{ cancelText }}
                </template>
            </v-tooltip>
        </v-overlay>
        <div
            class="progress-container"
        >
            <gwtk-progress
                v-bind="progress"
                class="progress-element"
            />
        </div>
        <div
            v-if="isTabPublishMap"
            class="gwtk-content-publish"
        >
            <gwtk-map-content-publish-map
                :map-vue="mapVue"
                :set-state="setState"
                :publish-map-object="publishMapObject"
                :sld-object="sldObject"
                :marker-image-list="markerImageList"
                :map-markers-commands="mapMarkersCommands"
                :marker-category-list="markerCategoryList"
            />
        </div>
        <div
            v-else-if="isTabLayerStylesSettings"
            class="gwtk-content-publish"
        >
            <gwtk-map-content-layer-styles-settings
                :map-vue="mapVue"
                :set-state="setState"
                :selected-legend-object-list="selectedLegendObjectList"
                :sld-object="sldObject"
                :marker-image-list="markerImageList"
                :map-markers-commands="mapMarkersCommands"
                :marker-category-list="markerCategoryList"
                :layer-node-id="layerNodeId"
                :search-value="searchValue"
            />
        </div>
        <div v-else class="gwtk-content-container">
            <gwtk-map-content-toolbar
                class="mb-1 mx-1 gwtk-map-content-toolbar"
                :map-vue="mapVue"
                :view-mode="currentMode"
                :set-state="setState"
                :show-search="showSearch"
                :search-value="searchValue"
                @open:layer="openLayerButtonHandler"
                @create:layer="createLayerButtonHandler"
            />
            <gwtk-tags
                v-if="allTags.length"
                :map-vue="mapVue"
                :tags="allTags"
                :selected-tags="selectedTags"
                :set-state="setState"
                class="mb-3 gwtk-map-content-tags gwtk-map-content-toolbar"
            />
            <gwtk-map-content-visible-control
                :map-vue="mapVue"
                :set-state="setState"
                :view-mode="currentMode"
            />
            <div
                class="gwtk-content"
                :class="allTags.length? '' : 'gwtk-content-notags'"
            >
                <gwtk-map-content-filter
                    v-if="isTabByFilter"
                    class="gwtk-map-content-widget"
                    :map-vue="mapVue"
                    :set-state="setState"
                    :current-map-layer-item="currentMapLayerItem"
                    :search-list-items="searchListItems"
                    :view-mode="viewMode"
                    :is-user-logged="isUserLogged"
                    :user-login="userLogin"
                    :dynamic-label-data="dynamicLabelData"
                    :menu-list-items="menuListItems"
                />

                <gwtk-map-content-tree
                    v-if="isTabByTree"
                    class="gwtk-map-content-tree"
                    :map-vue="mapVue"
                    :current-map-layer-item="currentMapLayerItem"
                    :set-state="setState"
                    :tree-item-statistics="treeItemStatistics"
                    :tree-view-item="treeViewItem"
                    :open-tree-element="openTreeElement"
                    :dynamic-label-data="dynamicLabelData"
                    :is-user-logged="isUserLogged"
                    :user-login="userLogin"
                    :menu-list-items="menuListItems"
                />

                <gwtk-map-content-group
                    v-if="isTabByGroups"
                    class="gwtk-map-content-group gwtk-map-content-widget"
                    :map-vue="mapVue"
                    :set-state="setState"
                    :current-map-layer-item="currentMapLayerItem"
                    :dynamic-label-data="dynamicLabelData"
                    :ver="ver"
                    :is-user-logged="isUserLogged"
                    :user-login="userLogin"
                    :menu-list-items="menuListItems"
                />

                <gwtk-map-content-order
                    v-if="isTabByOrder"
                    class="gwtk-map-content-widget"
                    :map-vue="mapVue"
                    :set-state="setState"
                    :list-items="listItems"
                    :dynamic-label-data="dynamicLabelData"
                    :ver="ver"
                    :is-user-logged="isUserLogged"
                    :user-login="userLogin"
                    :menu-list-items="menuListItems"
                />
                <gwtk-drag-and-drop-area
                    v-if="isTabPublishMapDnd"
                    @onDrop="onDrop"
                />
            </div>
        </div>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapContentWidget.ts" />

<style scoped>
.gwtk-content-container{
    display: flex;
    flex-direction: column;
    height: 100%;
}

.gwtk-content {
    height: calc(100% - 56px - 55px);
    margin-left: 0.6em;
    margin-right: 0.6em;
    overflow: auto;
}

.gwtk-content-publish {
    height: 100%;
    margin-left: 0.6em;
    margin-right: 0.6em;
}
.gwtk-content-notags {
    height: calc(100% - 56px);
    overflow: auto;
}

.progress-container {
    position: relative;
}

.progress-element {
    position: absolute;
    margin-top: -8px;
}
</style>
