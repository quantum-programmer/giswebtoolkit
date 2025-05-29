<template>
    <v-container class="gwtk-main-container">
        <v-sheet :width="'100%'">
            <v-container>
                <v-row>
                    <v-col cols="4">
                        <v-btn
                            dense
                            text
                            color="secondary"
                            depressed
                            class="mt-0 text-none text--primary"
                            @click="closeSldEditor"
                        >
                            <v-icon
                                dark
                                class="mr-4"
                            >
                                mdi-arrow-left
                            </v-icon>
                            {{ $t('mapcontent.Setup template') }}
                        </v-btn>
                    </v-col>
                </v-row>
            </v-container>
        </v-sheet>
        <div class="gwtk-legend-container-view-mode">
            <v-row
                class="gwtk-legend-container-creation-mode mt-0 mx-0"
            >
                <gwtk-page
                    without-header
                    class="gwtk-full-size gwtk-page-full-width"
                >
                    <div>
                        <v-row
                            no-gutters
                            justify="space-between"
                        >
                            <v-col
                                cols="6"
                                align-self="center"
                            >
                                <v-img
                                    :src="sldObject.previewImageSrc"
                                    class="gwtk-preview-image mx-6"
                                    :class="isTypePoint?'gwtk-image-center':''"
                                />
                            </v-col>
                            <v-spacer />
                            <v-btn-toggle :value="activeTab">
                                <v-col cols="auto">
                                    <v-row>
                                        <v-col>
                                            <gwtk-button
                                                class="gwtk-operator-button"
                                                clean
                                                :value="0"
                                                icon="graphic-object-line"
                                                @click="setGraphicObjectTypeLine"
                                            />
                                        </v-col>
                                        <v-col>
                                            <gwtk-button
                                                class="gwtk-operator-button"
                                                clean
                                                :value="1"
                                                icon="graphic-object-polygon"
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
                                                @click="setGraphicObjectTypePoint"
                                            />
                                        </v-col>
                                        <v-col>
                                            <gwtk-button
                                                class="gwtk-operator-button"
                                                clean
                                                :value="3"
                                                icon="graphic-object-text"
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
                        <v-container class="pa-0">
                            <draggable
                                v-if="!isTypeText&&!isTypePoint"
                                :list="sldObject.styleOptions[sldObjectTypeString].slice()"
                                handle=".gwtk-map-content-handle"
                                @start="dragStart"
                                @end="dragEnd"
                                @update="updateOrder"
                            >
                                <v-expansion-panels
                                    v-for="({fill, stroke, hatch}, index) in sldObject.styleOptions[sldObjectTypeString]"
                                    :key="version+'_'+index+sldObjectTypeString"
                                    class="d-block"
                                >
                                    <gwtk-expansion-panel
                                        v-if="fill || stroke || hatch"
                                        :title="getTitle(index, stroke)"
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
                                        <v-row
                                            justify="center"
                                            class="mt-2 pb-1"
                                        >
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
                            <div
                                v-else-if="isTypePoint"
                                class="ma-1"
                            >
                                <gwtk-marker-editor
                                    v-for="({marker}, index) in sldObject.styleOptions.marker"
                                    v-if="marker"
                                    :key="'marker_'+index"
                                    :item="marker"
                                    :set-state="setState"
                                    :marker-image-list="markerImageList"
                                    :marker-category-list="markerCategoryList"
                                    :map-markers-commands="mapMarkersCommands"
                                />
                            </div>
                            <div
                                v-else-if="isTypeText"
                                class="ma-1 mt-3"
                            >
                                <gwtk-text-style-editor
                                    v-for="({text}, index) in sldObject.styleOptions.text"
                                    v-if="text"
                                    :key="'text_'+index"
                                    :item="text"
                                    :update-item="value=>updateText(value,index)"
                                />
                            </div>
                        </v-container>
                        <v-container
                            v-if="availableStyles.length>0"
                            class="d-flex justify-space-around"
                        >
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
            </v-row>
            <v-row>
                <v-col>
                    <gwtk-button
                        primary
                        width-available
                        :title="$t('mapcontent.Save template')"
                        :disabled="false"
                        @click="saveSldTemplate"
                    />
                </v-col>
                <v-col>
                    <gwtk-button
                        secondary
                        width-available
                        :title="$t('mapcontent.Reset parameters')"
                        @click="resetSldTemplate"
                    />
                </v-col>
            </v-row>
        </div>
    </v-container>
</template>

<script src="./GwtkMapContentPublishMapAddSldScheme.ts" lang="ts" />

<style scoped>
    .gwtk-preview-image {
        max-width: fit-content;
    }

    .gwtk-image-center {
        background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0) calc(50% - 2px),
            #e0e0e0ff calc(50%),
            rgba(0, 0, 0, 0) calc(50% + 1px)
        ),
        linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) calc(50% - 1px),
            #e0e0e0ff calc(50%),
            rgba(0, 0, 0, 0) calc(50% + 1px)
        );
    }
    .gwtk-main-container {
        height: 100%;
    }

    .gwtk-full-size {
        height: 100%;
        width: 100%;
    }
    .gwtk-page-full-width {
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
    }
    .gwtk-legend-container-view-mode {
        height: calc(100% - 60px);
    }

    .gwtk-legend-container-creation-mode {
        height: calc(100% - 110px);
    }
    .theme--dark.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn {
        border-color:  var(--v-secondary-base)!important;
    }
</style>
