<template>
    <v-container fluid class="gwtk-full-height">
        <gwtk-page
            icon="mdi-arrow-left"
            :title="currentMapLayerItem.layerName"
            :without-header="currentMapLayerItem.isRootElement"
            class="gwtk-full-height"
            @leftButtonClicked="$emit('backClick')"
        >
            <v-list class="gwtk-item-list gwtk-map-options-projects">
                <gwtk-list-item
                    v-for="childLayerItem in currentMapLayerItem.childLayerItems"
                    :key="childLayerItem.layerGUID"
                    :icon="childLayerItem.getItemIconName"
                    :icon-size="18"
                    :title="childLayerItem.layerName"
                    @click="$emit('mapLayerItemClick', childLayerItem)"
                >
                    <template #right-slot>
                        <v-checkbox
                            v-if="!childLayerItem.isGroupItem"
                            dense
                            :input-value="checkThePresenceOfLayer(childLayerItem.layerGUID)"
                            @change="(value) => { onChangeLayerState(childLayerItem.layerGUID, childLayerItem.layerName, value); }"
                        />
                    </template>
                </gwtk-list-item>
            </v-list>
        </gwtk-page>
    </v-container>
</template>

<script lang="ts" src="./GwtkMapOptionsProjects.ts" />

<style scoped>
    .gwtk-full-height {
        height: 100%;
    }

    .gwtk-item-list {
        max-height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }
    .gwtk-map-options-projects ::v-deep .v-messages {
        min-height: 0;
    }
    .gwtk-map-options-projects ::v-deep .v-input--selection-controls {
        margin: var(--space-xs);
    }
</style>