<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :options="{title:$t('phrases.Map Marks')}" 
        :map-vue="mapVue"
        min-height="500"
        class="gwtk-map-marks-widget"
    >
        <!-- {{ $t('mapmarks.Mark Set') }} -->
        <v-row dense class="mark-set-row mx-2 mt-0">
            <gwtk-button
                secondary
                class="mark-set-button-size"
                icon="mdi-plus"
                :disabled="createMarkActive"
                @click="createMarkSetToggle()"
            />
            <v-select
                :items="markSetIdList"
                :value="selectedSetId"
                item-value="id"
                item-text="name"
                dense
                flat
                outlined
                hide-details
                solo
                class="mb-2"
                @change="changeMarkSet"
            />
        </v-row>
        <v-row
            v-if="selectedSetId"
            dense
            class="mark-set-row mx-2 mb-4"
            justify="end"
        >
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        clean
                        icon="mdi-bookmark-outline"
                        secondary
                        class="mr-2"
                        :selected="createMarkActive" 
                        :disabled="createMarkSetActive || selectedSetId == '0'"
                        v-on="on"
                        @click="createMarkToggle"
                    >
                        {{ $t('mapmarks.Create mark') }}
                    </gwtk-button>
                </template>
                <div>{{ $t('mapmarks.Create mark') }}</div>
            </v-tooltip>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        clean
                        icon="mdi-format-list-bulleted"
                        secondary
                        :selected="showMarkList"
                        :disabled="createMarkSetActive || selectedSetId == '0'"
                        v-on="on"
                        @click="showMarkListToggle"
                    >
                        {{ $t('mapmarks.Display mark set') }}
                    </gwtk-button>
                </template>
                <div>{{ $t('mapmarks.Display mark set') }}</div>
            </v-tooltip>

            <v-spacer />
            <v-tooltip bottom> 
                <template #activator="{ on }">
                    <gwtk-icon-button
                        :selected="selectedMarkSetVisible"
                        :icon="selectedMarkSetVisible? 'visibility-on':'visibility-off'"
                        v-on="on"
                        @click="changeMarkSetVisibility"
                    />
                </template>
                <div>{{ $t('mapmarks.Mark set visibility') }}</div>
            </v-tooltip>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        :disabled="createMarkActive"
                        icon="trash-can"
                        v-on="on"
                        @click="removeMarkSet"
                    />
                </template>
                <div>{{ $t('mapmarks.Remove') }}</div>
            </v-tooltip>
        </v-row>
        <v-card v-if="createMarkSetActive" flat dense class="create-mark-set-active mx-2">
            <v-container>
                <div class="mb-1">
                    <div class="text-overline mb-5">
                        {{ $t('mapmarks.New mark set') }}
                    </div>
                    <div class="mb-1">
                        <v-text-field 
                            v-model="currentMarkSetName"
                            :label="$t('phrases.Name')"
                            :rules="namesRule" 
                            required 
                            clearable 
                            dense
                            :counter="100"
                        />
                    </div>
                </div>
            </v-container>
            <v-spacer />
            <v-card-actions class="create-mark-set-active-action px-0">
                <gwtk-button
                    primary
                    width="45%"
                    :disabled="!markSetName||markSetName.length==0"
                    @click="createMarkSet"
                >
                    {{ $t('phrases.Save') }}
                </gwtk-button>
                <v-spacer />
                <gwtk-button
                    secondary
                    width="45%"
                    @click="createMarkSetActive=false"
                >
                    {{ $t('phrases.Cancel') }}
                </gwtk-button>
            </v-card-actions>
        </v-card>
        <template v-if="createMarkActive">
            <!-- <v-divider /> -->
            <div class="mx-2 gwtk-map-mark-widget-active">
                <gwtk-map-mark-widget 
                    :set-state="setState"
                    :mark-coordinates="markCoordinates"
                    :mark-name="markName"
                    :marker-color="markerColor"
                    :marker-list="markerList"
                    :selected-marker-id="selectedMarkerId"
                    :commentary="commentary"
                    class="gwtk-flex-1" 
                />
            </div>
        </template>
        <template v-if="markListActive">
            <!-- <v-divider /> -->
            <div class="mx-2 gwtk-map-mark-list-widget-active">
                <gwtk-map-mark-list-widget 
                    :set-state="setState"
                    :map-vue="mapVue"
                    :map-objects="mapObjects"
                    :selected-map-objects="selectedMapObjects"
                    class="gwtk-flex-1" 
                />
            </div>
        </template>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapMarksWidget.ts"></script>

<style scoped>


    .mark-set-row {
        gap: .4em;
        flex-wrap: nowrap;
    }

    .create-mark-set-active {
        height: calc(100% - 125px);
    }

    .create-mark-set-active-action {
        position: absolute;
        bottom: 0;
        height: 60px;
        width: 100%;
    }

    .gwtk-map-mark-widget-active {
        height: calc(100% - 125px);
    }

    .gwtk-map-mark-list-widget-active {
        height: calc(100% - 125px);
    }

    .mark-set-row .v-btn:not(.v-btn--round).v-size--default {
        height: var(--v-btn-height--default) !important;
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
        padding-top: var(--py-2) !important;
        padding-bottom: var(--py-2) !important;
    }

    .mark-set-row .v-btn--icon.v-size--default {
        height: var(--v-btn-height--default) !important;
        width: var(--v-btn-height--default) !important;
    }

</style>