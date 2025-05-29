<template>
    <gwtk-task-container-item
        class="gwtk-my-maps"
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
        min-height="450"
    >
        <!--        {{ $t('phrases.Server') }}-->
        <!--        <v-select-->
        <!--            :items="serviceList"-->
        <!--            :value="selectedService"-->
        <!--            :disabled="serviceList.length<2"-->
        <!--            dense-->
        <!--            flat-->
        <!--            hide-details-->
        <!--            outlined-->
        <!--            solo-->
        <!--            class="mb-2"-->
        <!--            @change="changeServiceUrl"-->
        <!--        />-->
        <!--        {{ $t('phrases.Virtual folder') }}-->
        <!--        <v-select-->
        <!--            :items="virtualFolderList"-->
        <!--            :value="selectedVirtualFolderId"-->
        <!--            dense-->
        <!--            item-value="id"-->
        <!--            item-text="text"-->
        <!--            flat-->
        <!--            hide-details-->
        <!--            outlined-->
        <!--            solo-->
        <!--            class="mb-2"-->
        <!--            @change="changeVirtualFolder"-->
        <!--        />-->
        <v-container>
            <v-row dense class="layer-row">
                <gwtk-button
                    secondary
                    class="layer-button-size"
                    icon="mdi-plus"
                    @click="createLayer"
                />
                <v-select
                    :items="layerList"
                    :value="selectedLayerId"
                    item-value="id"
                    item-text="text"
                    dense
                    flat
                    :label="$t('phrases.Layer')"
                    outlined
                    solo
                    hide-details
                    class="mb-2"
                    @change="changeLayer"
                >
                    <template #selection="{item}">
                        <!--                    <Button-->
                        <!--                        icon-mode-->
                        <!--                        icon-color="grey-03"-->
                        <!--                        :icon="'pencil'"-->
                        <!--                        :icon-size="20"-->
                        <!--                        theme="clean"-->
                        <!--                        @click="changeLayerName"-->
                        <!--                    />-->
                        {{ item.text }}
                    </template>
                </v-select>
            </v-row>
            <template v-if="layerList.length">
                <v-row
                    v-if="selectedLayerId"
                    dense
                    class="layer-row"
                    justify="end"
                >
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :selected="selectedLayerVisibility"
                                :icon="selectedLayerVisibility? 'visibility-on':'visibility-off'"
                                v-on="on"
                                @click="changeLayerVisibility"
                            />
                        </template>
                        <div>{{ $t('mymaps.Toggle visibility') }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="undoButton.options.icon"
                                v-on="on"
                                @click="()=>setState(undoButton.id,!undoButton.active)"
                            />
                        </template>
                        <div>{{ $t(undoButton.options.title) }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                icon="trash-can"
                                v-on="on"
                                @click="removeLayer"
                            />
                        </template>
                        <div>{{ $t('mymaps.Remove') }}</div>
                    </v-tooltip>
                </v-row>
                <v-row
                    v-if="selectedLayerId && !selectedPointObjectsCount && !selectedLineObjectsCount && !selectedPolygonObjectsCount"
                    class="pa-4 pb-7"
                >
                    {{ $t('mymaps.Select the required objects on the map') }}
                </v-row>
                <div
                    v-if="selectedLayerId"
                >
                    <gwtk-templates-gallery
                        :marker-list="markerList"
                        :line-list="lineList"
                        :polygon-list="polygonList"
                        :selected-point-objects-count="selectedPointObjectsCount"
                        :selected-line-objects-count="selectedLineObjectsCount"
                        :selected-polygon-objects-count="selectedPolygonObjectsCount"
                        :set-state="setState"
                        :selected-marker-id="selectedMarkerId"
                        :selected-line-id="selectedLineId"
                        :selected-polygon-id="selectedPolygonId"
                        :selected-tab="selectedTab"
                    />
                </div>
            </template>
        </v-container>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMyMapsWidget.ts"></script>

<style scoped>

    .layer-row {
        gap: .4em;
        flex-wrap: nowrap;
    }

    .gwtk-my-maps .container .v-btn:not(.v-btn--round).v-size--default {
        height: var(--v-btn-height--default);
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
        padding-top: var(--py-2) !important;
        padding-bottom: var(--py-2) !important;
    }

    .gwtk-my-maps .layer-row .v-btn--icon.v-size--default {
        height: var(--v-btn-height--default) !important;
        width: var(--v-btn-height--default) !important;
    }
</style>