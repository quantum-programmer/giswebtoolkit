<template>
    <v-card
        flat
        height="100%"
    >
        <v-container class="pa-1 gwtk-container-object-list">
            <v-container
                class="pa-0"
                :style="{height:'100%'}"
                fluid
            >
                <v-row dense justify="space-between">
                    <v-col cols="5" class="py-1 pr-3">
                        <v-list-item-title class="text-subtitle-1 unset-whitespace gwtk-object-title" style="font-size: 16px;">
                            {{ ' ' + $t('mapmarks.Total') + ' ' + mapObjects.length }}
                        </v-list-item-title>
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col cols="12" />
                </v-row>
                <v-virtual-scroll
                    :items="mapObjects"
                    :item-height="isReducedSizeInterface?'72px':'100px'"
                    class="gwtk-object-list-virtual_scroll"
                >
                    <template #default="{ item }">
                        <gwtk-map-object-item
                            :set-state="setState"
                            :map-object-content="createMapObjectContent(item)"
                            :selected="isSelected(item)"
                            class="pl-0 pr-2"
                            @mapobject:click="selectMapObject"
                            @mapobject:remove="removeMapObject"
                        />
                    </template>
                </v-virtual-scroll>
            </v-container>
        </v-container>
        <v-card-actions class="pa-0 mt-2 mb-n3 gwtk-map-mark-list-widget-container-action">
            <gwtk-button
                secondary
                class="py-2 my-2"
                style="width:100%"
                :disabled="selectedMapObjects.length===0"
                @click="removeMapObject"
            >
                {{ $t('phrases.Delete') }}
                {{ selectedObjectsCountTitle() }}
            </gwtk-button>
        </v-card-actions>
    </v-card>
</template>

<script type="ts" src="./GwtkMapMarkListWidget.ts" />
<style scoped>
    .gwtk-container-object-list {
        height: calc(100% - 50px);
        overflow-y: auto;
    }

    .gwtk-object-list-virtual_scroll {
        height: calc(100% - 45px);
    }

    .gwtk-map-mark-list-widget-container-action {
        position: absolute;
        bottom: 0;
        height: 60px;
        width: calc(100% - 24px);
        z-index: 20;
        background-color: #FFFFFF;
        left: 12px;
    }
</style> 