<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="200"
    >
        <v-container class="px-2 gwtk-full-height">
            <gwtk-tabs v-model="tabOptions">
                <gwtk-tab
                    v-if="isDefaultUserSettings"
                    key="tab_parameters"
                    :title="$t('projectoptions.Application options')"
                />
                <gwtk-tab
                    v-else
                    key="tab_project_parameters"
                    :title="$t('projectoptions.Project options')"
                />
                <gwtk-tab
                    key="tab_projects"
                    :title="$t('projectoptions.Project composition')"
                />
            </gwtk-tabs>
            <div class="gwtk-main-container">
                <v-tabs-items :value="tabOptions" class="gwtk-tab-container">
                    <v-tab-item
                        value="tab_parameters"
                        transition="false"
                        class="gwtk-full-height"
                    >
                        <gwtk-map-options-parameters
                            :set-state="setState"
                            :refresh-interval="userParameters.refreshInterval"
                            :cursor-coordinate-params="userParameters.cursorCoordinateParams"
                            :units="userParameters.units"
                            :object-selection="userParameters.objectSelection"
                            :object-search="userParameters.objectSearch"
                            :measurements="userParameters.measurements"
                            :ui="userParameters.ui"
                            :search-filter-settings="projectParameters.searchFilterSettings"
                            :sort-types="projectParameters.sortTypes"
                            :map-legend="projectParameters.mapLegend"
                            :initial-extent="projectParameters.initialExtent"
                            :map-log="projectParameters.mapLog"
                        />
                    </v-tab-item>
                    <v-tab-item
                        value="tab_projects"
                        transition="false"
                        class="gwtk-full-height"
                    >
                        <gwtk-map-options-projects
                            :set-state="setState"
                            :current-map-layer-item="currentMapLayerItem"
                            :project-map-layers="projectMapLayers"
                            @mapLayerItemClick="onMapLayerItemClicked"
                            @backClick="onBackButtonClicked"
                        />
                    </v-tab-item>
                    <v-tab-item
                        value="tab_project_parameters"
                        transition="false"
                        class="gwtk-full-height"
                    >
                        <gwtk-map-options-parameters
                            :set-state="setState"
                            :refresh-interval="projectParameters.refreshInterval"
                            :cursor-coordinate-params="projectParameters.cursorCoordinateParams"
                            :units="projectParameters.units"
                            :object-selection="projectParameters.objectSelection"
                            :object-search="projectParameters.objectSearch"
                            :measurements="projectParameters.measurements"
                            :ui="projectParameters.ui"
                            :search-filter-settings="projectParameters.searchFilterSettings"
                            :sort-types="projectParameters.sortTypes"
                            :map-legend="projectParameters.mapLegend"
                            :initial-extent="projectParameters.initialExtent"
                            :map-log="projectParameters.mapLog"
                        />
                    </v-tab-item>
                </v-tabs-items>
            </div>
            <v-row
                class="mt-3 px-3"
            >
                <gwtk-button
                    v-if="isDefaultUserSettings"
                    secondary
                    width-available
                    :title="$t('projectoptions.Add project parameters')"
                    @click="formProjectUserSettings"
                />
                <gwtk-button
                    v-else
                    secondary
                    width-available
                    :title="$t('projectoptions.Delete project parameters')"
                    @click="deleteParameters"
                />
            </v-row>
            <v-row class="mt-4">
                <v-col>
                    <gwtk-button
                        primary
                        width-available
                        :title="$t('phrases.Apply')"
                        @click="settingsApply"
                    />
                </v-col>
                <v-col>
                    <gwtk-button
                        secondary
                        width-available
                        :title="$t('phrases.Cancel')"
                        @click="settingsReset"
                    />
                </v-col>
            </v-row>
        </v-container>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapOptionsMain.ts" />

<style scoped>
    .gwtk-main-container {
        height: calc(100% - 12em);
    }

    .gwtk-tab-container {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .gwtk-full-height {
        height: 100%;
    }

</style>
