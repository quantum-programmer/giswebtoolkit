<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
    >
        <div class="gwtk-shutter-main-panel">
            <div>
                <div>
                    <v-text-field
                        :value="getSearchValue()"
                        outlined
                        hide-details
                        dense
                        clearable
                        class="pt-1"
                        :label="$t('shutter.Search')"
                        @input="onInputSearch"
                    />
                </div>
                <v-row
                    class="pa-1"
                    justify="space-between"
                    align="center"
                    no-gutters
                >
                    <v-col
                        class="pl-1"
                        cols="auto"
                    >
                        <gwtk-checkbox
                            v-model="selectAll"
                            :label="$t('shutter.Select all')"
                            :disabled="!layerListItems.length"
                        />
                    </v-col>
                    <v-col cols="auto" style="font-size: 1rem">
                        {{ $t('shutter.Active layers') + ': ' + activeLayersCount }}
                    </v-col>
                    <v-col cols="auto">
                        <gwtk-tool-button
                            secondary
                            :tooltip-text="$t('shutter.Change shutter position')"
                            :icon="verticalMode ? 'vertical-shutter' : 'horizontal-shutter'"
                            @click="toggleVerticalMode"
                        />
                    </v-col>
                </v-row>
                <v-divider />
            </div>
            <div class="gwtk-shutter-layer-list">
                <v-row
                    v-for="(item, index) in layerListItems"
                    :key="item.xId"
                    :dense="!!isReducedSizeInterface"
                >
                    <v-col>
                        <gwtk-checkbox
                            v-model="layerListItems[index].active"
                            dense
                            class="pt-0 ml-2"
                            :label="item.alias"
                            @change="(value)=>toggleItem(item.xId, value)"
                        />
                    </v-col>
                </v-row>
            </div>
        </div>
    </gwtk-task-container-item>
</template>

<script src="./GwtkShutterWidget.ts" />

<style scoped>
    .gwtk-shutter-main-panel {
        height: calc(100% - 4em);
    }

    .gwtk-shutter-layer-list {
        height: calc(100% - 2em);
        overflow-x: hidden;
        overflow-y: auto;
    }
</style>
