<template>
    <div v-if="!isOpenSldEditor" class="gwtk-main-container">
        <v-container class="gwtk-main-view px-0">
            <v-row class="mb-3">
                <v-col cols="4">
                    <v-btn
                        dense
                        text
                        color="secondary"
                        depressed
                        class="mt-0 pl-0 text-none text--primary"
                        @click="returnToPreviousView"
                    >
                        <v-icon
                            dark
                            class="mr-4"
                        >
                            mdi-arrow-left
                        </v-icon>
                        {{ $t('mapcontent.Layer style settings') }}
                    </v-btn>
                </v-col>
            </v-row>
            <v-row
                class="my-2 mx-0"
                justify="center"
                align-content-end
            >
                <gwtk-button
                    :primary="!(selectedLegendObjectList && selectedLegendObjectList.length)"
                    :secondary="!!(selectedLegendObjectList && selectedLegendObjectList.length)"
                    :icon="!(selectedLegendObjectList && selectedLegendObjectList.length)?'mdi-plus':'mdi-square-edit-outline'"
                    width="100%"
                    :title="!(selectedLegendObjectList && selectedLegendObjectList.length)?$t('mapcontent.Add map legend elements'):$t('mapcontent.Edit map legend elements list')"
                    @click="openMapLegend"
                />
            </v-row>
            <v-sheet
                outlined
                rounded
            >
                <v-row
                    v-if="selectedLegendObjectList && selectedLegendObjectList.length"
                    justify="start"
                    class="gwtk-selected-legend-object-list"
                >
                    <v-col
                        v-for="selectedLegendObject in selectedLegendObjectList"
                        :key="selectedLegendObject.key"
                        class="shrink"
                    >
                        <v-chip
                            close
                            small
                            @click:close="deleteLegendObject(selectedLegendObject)"
                        >
                            {{ selectedLegendObject.itemName || selectedLegendObject.name }}
                        </v-chip>
                    </v-col>
                </v-row>
                <v-row
                    v-else
                    justify="center"
                    align-content="center"
                    class="gwtk-selected-legend-object-list"
                >
                    <v-col
                        cols="auto"
                    >
                        {{ $t('mapcontent.Map legend elements are not selected') }}
                    </v-col>
                </v-row>
            </v-sheet>
        </v-container>
        <v-row
            v-if="selectedLegendObjectList && selectedLegendObjectList.length"
            class="ma-0"
        >
            <gwtk-button
                secondary
                width="100%"
                :title="$t('mapcontent.Setup template')"
                @click="toggleSldEditorState"
            />
        </v-row>
        <v-row class="gwtk-publish-map-execute">
            <gwtk-button
                primary
                :disabled="!selectedLegendObjectList.length"
                width="35%"
                :title="$t('mapcontent.Apply')"
                @click="settingsApply"
            />
            <gwtk-button
                secondary
                width="35%"
                :title="$t('phrases.Clear')"
                @click="settingsCancel"
            />
        </v-row>
    </div>
    <gwtk-map-content-publish-map-add-sld-scheme
        v-else
        :map-vue="mapVue"
        :set-state="setState"
        :sld-object="sldObject"
        :marker-image-list="markerImageList"
        :map-markers-commands="mapMarkersCommands"
        :marker-category-list="markerCategoryList"
        @close:sldEditor="toggleSldEditorState"
        @save:sldTemplate="saveSldTemplate"
        @reset:sldTemplate="resetSldTemplate"
    />
</template>

<script src="./GwtkMapContentLayerStylesSettings.ts" lang="ts" />

<style scoped>
.gwtk-selected-legend-object-list {
  margin: 0;
  min-height: 90px;
  max-height: 150px;
  overflow-y: auto;
}
.gwtk-selected-legend-object-list .col {
  padding: 6px;
}
.gwtk-publish-map-execute {
  margin: 0.6em 0;
  display: flex;
  justify-content: space-between;
  align-content: flex-end;
}
.gwtk-main-view {
  overflow-y: auto;
  overflow-x: hidden;
}

.gwtk-main-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding-bottom: 0.6em;
}

.gwtk-legend-list {
  height: 100%;
  width: 100%;
}
</style>


