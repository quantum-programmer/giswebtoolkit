<template>
    <gwtk-page
        without-header
        class="gwtk-page-full-width"
    >
        <div>
            <v-row no-gutters justify="space-between">
                <v-col
                    cols="6"
                    align-self="center"
                >
                    <v-img
                        :src="previewImageSrc"
                        class="gwtk-preview-image mx-6"
                        :class="isTypePoint?'gwtk-image-center':''"
                    />
                </v-col>
                <v-spacer />
                <v-btn-toggle
                    :value="activeTab"
                >
                    <v-col cols="auto">
                        <v-row>
                            <v-col>
                                <gwtk-button
                                    class="gwtk-operator-button"
                                    clean
                                    :value="0"
                                    icon="graphic-object-line"
                                    :disabled="lineTabDisabled"
                                    @click="setGraphicObjectTypeLine"
                                />
                            </v-col>
                            <v-col>
                                <gwtk-button
                                    class="gwtk-operator-button"
                                    clean
                                    :value="1"
                                    icon="graphic-object-polygon"
                                    :disabled="polygonTabDisabled"
                                    @click="setGraphicObjectTypePolygon"
                                />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col>
                                <gwtk-button
                                    class="gwtk-operator-button"
                   
                                    clean
                                    :value="2"
                                    icon="graphic-object-point"
                                    :disabled="pointTabDisabled"
                                    @click="setGraphicObjectTypePoint"
                                />
                            </v-col>
                            <v-col>
                                <gwtk-button
                                    class="gwtk-operator-button"
                                    clean
                                    :value="3"
                                    icon="graphic-object-text"
                                    :disabled="textTabDisabled"
                                    @click="setGraphicObjectTypeText"
                                />
                            </v-col>
                        </v-row>
                    </v-col>
                </v-btn-toggle>
            </v-row>
        </div>
        <div>
            <v-divider />
        </div>
        <div class="gwtk-scrollable-container mx-3">
            <!--            <v-select-->
            <!--                v-if="!isClassifierObject"-->
            <!--                :items="legendLayers"-->
            <!--                :value="legendLayers[0]"-->
            <!--                class="pb-4"-->
            <!--                dense-->
            <!--                flat-->
            <!--                hide-details-->
            <!--                outlined-->
            <!--                solo-->
            <!--                :disabled="true"-->
            <!--            />-->
            <v-container class="pa-0">
                <draggable
                    v-if="!isTypeText&&!isTypePoint"
                    handle=".gwtk-map-content-handle"
                    :list="styleOptions.slice()"
                    @update="updateOrder"
                >
                    <v-expansion-panels
                        v-for="({fill, stroke, hatch}, index) in styleOptions"
                        :key="ver+'_'+index"
                        class="d-block"
                    >
                        <gwtk-expansion-panel
                            v-if="fill || stroke || hatch"
                            :title="getTitle(index)"
                            class="my-2"
                        >
                            <template #prefix>
                                <gwtk-icon
                                    class="gwtk-map-content-handle"
                                    name="math-equal"
                                    size="18"
                                />
                            </template>
                            <gwtk-fill-editor
                                v-if="fill"
                                :item="fill"
                                :update-item="value=>updateFill(value,index)"
                            />
                            <gwtk-stroke-editor
                                v-else-if="stroke"
                                :item="stroke"
                                :update-item="value=>updateStroke(value,index)"
                            />
                            <gwtk-hatch-editor
                                v-else-if="hatch"
                                :item="hatch"
                                :update-item="value=>updateHatch(value,index)"
                            />
                            <v-row justify="center" class="mt-2 pb-1">
                                <gwtk-button
                                    class="gwtk-operator-button-delete"
                                    clean
                                    icon="mdi-delete-outline"
                                    :title="$t('legend.Remove')"
                                    align-content="center"
                                    min-width="130"
                                    @click="removeStyle(index)"
                                />
                            </v-row>
                        </gwtk-expansion-panel>
                    </v-expansion-panels>
                </draggable>
                <div v-else-if="isTypePoint" class="ma-1">
                    <gwtk-marker-editor
                        v-for="({marker}, index) in styleOptions"
                        v-if="marker"
                        :key="'marker_'+index"
                        :item="marker"
                        :set-state="setState"
                        :marker-image-list="markerImageList"
                        :marker-category-list="markerCategoryList"
                        :map-markers-commands="mapMarkersCommands"
                    />
                </div>
                <div v-else-if="isTypeText" class="ma-1 mt-3">
                    <gwtk-text-style-editor
                        v-for="({text}, index) in styleOptions"
                        v-if="text"
                        :key="'text_'+index"
                        :item="text"
                        :update-item="value=>updateText(value,index)"
                    />
                </div>
            </v-container>
            <v-container v-if="availableStyles.length>0" class="d-flex justify-space-around">
                <gwtk-menu
                    theme="secondary"
                    :title="$t('legend.Add style')"
                    icon="mdi-plus"
                    :icon-color="!$vuetify.theme.dark?' var(--v-primary-base)':'var(--color-white)'"
                    width-available
                >
                    <v-list>
                        <gwtk-list-item
                            v-for="(item, index) in availableStyles"
                            :key="index"
                            :title="item.text"
                            @click="addStyle(item.value)"
                        />
                    </v-list>
                </gwtk-menu>
            </v-container>
        </div>
    </gwtk-page>
</template>

<script lang="ts" src="./GwtkGraphicObjectParamsWidget.ts" />

<style scoped>
    .gwtk-page-full-width {
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
    }

    .gwtk-map-content-handle {
        flex: unset;
    }

    .gwtk-graphic-object-params-container {
        overflow-y: auto;
        overflow-x: hidden;
        max-height: 25.9em
    }

    .gwtk-legend-btn-image {
        border: solid .1em #E0E0E0;
        border-radius: .25em;
        min-width: 2em;
        max-width: 4em;
    }

    .gwtk-legend-btn-image-active {
        border: solid .1em var(--v-primary-base);
        background-color: var(--v-primary-lighten4);
        border-radius: .25em;
        min-width: 2em;
        box-shadow: 0 5px 5px -3px #616161;
    }

    @media (max-width: 600px) {
        .gwtk-graphic-object-page-container {
            max-width: initial;
            overflow-y: auto;
            overflow-x: hidden;
            height: 52vh;
        }

        .gwtk-graphic-object-params-container {
            overflow-y: auto;
            overflow-x: hidden;
            height: 16em
        }
    }

    .gwtk-preview-image {
        max-width: fit-content;
    }

    .gwtk-image-center {
        background: linear-gradient(90deg, rgba(0, 0, 0, 0) calc(50% - 2px), #E0E0E0FF calc(50%), rgba(0, 0, 0, 0) calc(50% + 1px)), linear-gradient(180deg, rgba(0, 0, 0, 0) calc(50% - 1px), #E0E0E0FF calc(50%), rgba(0, 0, 0, 0) calc(50% + 1px));
    }

    .v-expansion-panel-header > *:not(.v-expansion-panel-header__icon) {
        flex: 0 0 auto;
        margin-left: 0.786em;
        margin-right: 0.786em
    }

    .theme--dark.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn {
        border-color:  var(--v-secondary-base)!important;
    }

    .container{
        padding-left: 0;
        padding-right: 0;
    }
    .theme--dark.gwtk-operator-button-delete {
        background-color: var(--v-secondary-darken2);
    }
</style>