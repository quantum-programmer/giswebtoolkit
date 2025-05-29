<template>
    <v-card
        flat
    >
        <v-card-subtitle
            class="py-2"
            @click="toggleLayerList"
        >
            <v-icon
                dense
                style="margin: -3px 8px 0 2px;"
            >
                mdi-map
            </v-icon>

            <span style="font-size: 16px; cursor: default;" v-text="$t('exportReport.Maps list')" />

            <v-icon
                small
                class="ml-2"
            >
                mdi-cog
            </v-icon>

            <v-btn
                icon
                small
                style="margin: -2px 0 -2px 2px;"
            >
                <v-icon
                    v-if="showLayerList"
                >
                    mdi-chevron-up
                </v-icon>

                <v-icon
                    v-else
                >
                    mdi-chevron-down
                </v-icon>
            </v-btn>
        </v-card-subtitle>
        <v-card-text
            v-show="isMalformed"
            style="height: 16px; overflow: hidden;"
        >
            <v-text-field
                :value="checkedLayerIndexes.join()"
                :rules="checkedLayersRules"
                style="margin-top: -28px;"
                dense
            />
        </v-card-text>

        <v-expand-transition
            mode="linear"
        >
            <div
                v-show="showLayerList"
                class="pb-2"
            >
                <gwtk-checkbox
                    v-show="layersSelectedFromTemplate.length"
                    :label="$t('exportReport.Use layers from template')"
                    :value="useLayersFromTemplate"
                    class="ml-4"
                    dense
                    @click.stop.prevent="toggleUseLayersFromTemplate"
                />

                <v-list
                    v-if="!isVersionTransneft"
                    max-height="500"
                    class="overflow-y-auto pa-0"
                    dense
                >
                    <v-list-item-group
                        v-model="checkedLayerIndexes"
                        multiple
                        @change="updateLayers"
                    >
                        <div
                            class="d-flex mt-3 mr-2 mb-2 ml-4 align-center"
                        >
                            <gwtk-checkbox
                                :value="isAllLayersChecked"
                                dense
                                @click.stop.prevent="toggleAllLayers"
                            />

                            <v-text-field
                                v-model="filterValue"
                                :label="$t('phrases.Search')"
                                :error="filterIsOver"
                                hide-details
                                dense
                                outlined
                                clearable
                                @click:clear="setFilterValue('')"
                            />
                        </div>

                        <v-divider />

                        <gwtk-list-item
                            v-for="(layerId, index) in layerIds"
                            v-show="layerIdsFiltered.indexOf(layerId) !== -1"
                            :key="'layer-id-' + index"
                            :disabled="disabled"
                            :title="layerNames[layerId]"
                            class="gwtk-export-report-select-layer-item my-1"
                        >
                            <template
                                #left-slot
                            >
                                <v-list-item-action
                                    class="mt-0 mr-0 mb-0 ml-0"
                                >
                                    <gwtk-checkbox
                                        :value="isActive(index)"
                                        dense
                                    />
                                </v-list-item-action>
                            </template>
                        </gwtk-list-item>
                    </v-list-item-group>
                </v-list>
            </div>
        </v-expand-transition>
    </v-card>
</template>

<script src="./GwtkLayersList.ts"></script>
