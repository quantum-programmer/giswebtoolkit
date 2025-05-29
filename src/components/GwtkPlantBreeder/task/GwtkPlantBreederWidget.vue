<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :title-background-color="$vuetify.breakpoint.xs? 'var(--color-orange)':undefined"
        :title-text-color="$vuetify.breakpoint.xs?'var(--color-white)':undefined"
    >
        <v-container
            :style="showEditPanel ? 'display:none;':'display:block;'"
            class="pa-0"
            style="height: 100%"
        >
            <v-sheet outlined rounded class="pa-2" style="height: 97%;">
                <v-row class="ma-1">
                    <v-tooltip
                        v-if="linkPanelActiveState === 'edit'"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-button
                                clean
                                icon="list"
                                :icon-size="28"
                                :selected="false"
                                :disabled="false"
                                class="ma-2 no-focus-button"
                                v-on="on"
                                @click="updateActualObjectsList"
                            />
                        </template>
                        <div>{{ $t('plantbreeder.Update list of objects') }}</div>
                    </v-tooltip>
                </v-row>
                <v-divider />
                <v-row class="my-2" style="height: 86%">
                    <v-col v-if="mapObjects.length === 0 && showMapObjectsUpdateOverlay === false">
                        {{ result }}
                    </v-col>
                    <v-col v-if="mapObjects.length !== 0 || showMapObjectsUpdateOverlay !== false" style="height: 100%">
                        <gwtk-plant-breeder-map-object-widget
                            :set-state="setState"
                            :map-vue="mapVue"
                            :map-objects="mapObjects"
                            :found-map-objects-number="foundMapObjectsNumber"
                            :selected-map-object="selectedMapObject"
                            :show-map-objects-update-overlay="showMapObjectsUpdateOverlay"
                            class="gwtk-flex-1"
                        />
                    </v-col>
                </v-row>
            </v-sheet>
        </v-container>
        <v-container
            :style="showEditPanel ? 'display:block;':'display:none;'"
            class="pa-0"
            style="min-height: 300px"
        >
            <v-container>
                <template
                    v-if="organizationName.value !== ''"
                >
                    <v-row dense>
                        <v-col class="pl-2">
                            {{ organizationName.name }}
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col>
                            <v-textarea
                                :value="organizationName.value"
                                :readonly="true"
                                auto-grow
                                outlined
                                dense
                                hide-details="auto"
                                rows="1"
                            />
                        </v-col>
                    </v-row>
                </template>
                <template
                    v-if="fieldAreaName.value !== ''"
                >
                    <v-row dense>
                        <v-col class="pl-2">
                            {{ fieldAreaName.name }}
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col>
                            <v-textarea
                                :value="fieldAreaName.value"
                                :readonly="true"
                                auto-grow
                                outlined
                                dense
                                hide-details="auto"
                                rows="1"
                            />
                        </v-col>
                    </v-row>
                </template>
                <template
                    v-if="mapFieldNumber.value !== ''"
                >
                    <v-row dense>
                        <v-col class="pl-2">
                            {{ mapFieldNumber.name }}
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col>
                            <v-textarea
                                :value="mapFieldNumber.value"
                                :readonly="true"
                                auto-grow
                                outlined
                                dense
                                hide-details="auto"
                                rows="1"
                            />
                        </v-col>
                    </v-row>
                </template>
                <template
                    v-if="mapFieldSectionNumber.value !== ''"
                >
                    <v-row dense>
                        <v-col class="pl-2">
                            {{ mapFieldSectionNumber.name }}
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col>
                            <v-textarea
                                :value="mapFieldSectionNumber.value"
                                :readonly="true"
                                auto-grow
                                outlined
                                dense
                                hide-details="auto"
                                rows="1"
                            />
                        </v-col>
                    </v-row>
                </template>
                <v-divider
                    v-if="organizationName.value !== '' || fieldAreaName.value !== '' || mapFieldNumber.value !== '' || mapFieldSectionNumber.value !== ''"
                    class="ma-2"
                />
                <v-row dense>
                    <v-col cols="auto">
                        <gwtk-button
                            v-if="fieldInfo !== undefined"
                            primary
                            icon="plus"
                            icon-size="28"
                            style="height: 44px"
                            @click="createRecord"
                        />
                    </v-col>
                    <v-col cols="10">
                        <v-tabs
                            v-model="selectedDataInDBItem"
                            hide-slider
                            show-arrows
                            align-with-title
                            class="pagination_tabs"
                        >
                            <v-tab
                                v-for="(item, index) in currentMapObjectDataFromDB.result"
                                :key="index"
                            >
                                {{ index }}
                            </v-tab>
                        </v-tabs>
                    </v-col>
                </v-row>
                <v-tabs-items
                    v-model="selectedDataInDBItem"
                >
                    <v-tab-item
                        v-for="(resultItem, resultIndex) in currentMapObjectDataFromDB.result"
                        :key="resultIndex"
                        :transition="false"
                        class="pt-2"
                    >
                        <template
                            v-for="(item, index) in resultItem"
                        >
                            <v-row
                                v-if="!item.hidden && item.key !== 'id_Organ' && item.key !== 'id_Field'"
                                :key="'fieldName_' + index"
                                dense
                            >
                                <v-col class="pl-3">
                                    {{ item.name }}
                                </v-col>
                            </v-row>
                            <v-row
                                v-if="!item.hidden && item.key !== 'id_Organ' && item.key !== 'id_Field'"
                                :key="'fieldValue_' + index"
                                dense
                            >
                                <v-col class="d-flex px-2" cols="12">
                                    <gwtk-date-time-picker
                                        v-if="item.type === 17"
                                        :datetime="item.value"
                                        time-format="HH:mm:ss"
                                        :ok-text="$t('phrases.Select')"
                                        :date-picker-props="datePickerProps"
                                        :time-picker-props="timePickerProps"
                                        @input="(value) => setDateValue(item.key, value, resultIndex)"
                                    />
                                    <v-autocomplete
                                        v-else-if="item.type === 16"
                                        v-model="item.value"
                                        :items="getAdditionalInformation( item.key )"
                                        item-text="value"
                                        item-value="key"
                                        outlined
                                        dense
                                        hide-details
                                        :menu-props="{ bottom: true, offsetY: true }"
                                        @input="(value) => setValue(item.key, value, resultIndex)"
                                    />
                                    <v-text-field
                                        v-else
                                        :value="item.value"
                                        :type="item.type === 0 ? 'text' : 'number'"
                                        :disabled="item.disabled"
                                        outlined
                                        dense
                                        hide-details="auto"
                                        @input="(value) => setValue(item.key, value, resultIndex)"
                                    />
                                </v-col>
                            </v-row>
                        </template>
                        <v-row dense justify="end">
                            <v-col cols="auto" class="pr-2">
                                <gwtk-button
                                    secondary
                                    :title="$t('phrases.Delete')"
                                    icon="trash-can"
                                    :selected="false"
                                    @click="deleteObjetRecord(resultIndex)"
                                />
                            </v-col>
                        </v-row>
                    </v-tab-item>
                </v-tabs-items>
            </v-container>
            <v-container class="pt-0">
                <v-row dense justify="space-between">
                    <v-col
                        v-if="fieldInfo !== undefined"
                        cols="auto"
                    >
                        <gwtk-button
                            secondary
                            :title="$t('phrases.Save')"
                            icon="mdi-check"
                            class="mt-1 ml-1"
                            @click="save"
                        />
                    </v-col>
                    <v-col cols="auto">
                        <gwtk-button
                            secondary
                            :title="$t('phrases.Cancel')"
                            class="mt-1 ml-2 mr-1"
                            @click="cancel"
                        />
                    </v-col>
                </v-row>
                <v-overlay
                    :value="showEditPanelOverly"
                    absolute
                    z-index="100"
                >
                    <v-row no-gutters dense align="center" justify="center">
                        <v-progress-circular active indeterminate size="64" />
                    </v-row>
                </v-overlay>
            </v-container>
        </v-container>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkPlantBreederWidget.ts" />

<style>
    .pagination_tabs .v-tab {
        width: auto;
        height: auto;
        min-width: 48px;
        min-height: 42px;
        font-size: 1rem;
        padding: 0;
        margin: 0 4px;
        border: 1px solid rgba(192, 192, 192, 1);
        border-radius: var(--border-radius-s);
    }

    .pagination_tabs .v-tab--active {
        border: 1px solid #1976d2;
        border-radius: var(--border-radius-s);
        background-color: var(--color-blue-02);
    }

    .pagination_tabs .v-tabs-bar {
        height: auto;
    }

    .pagination_tabs .v-slide-group__prev, .pagination_tabs .v-slide-group__next {
        min-width: 42px;
    }

    .no-focus-button:before {
        opacity: 0 !important;
    }
</style>