<template>
    <v-container class="pa-1 container-object">
        <v-container
            class="pa-0"
            :style="{ height: mapObjects.length < mapVue.getMap().searchManager.responseMapObjectCount ? 'calc(100% - 44px)':'100%' }"
            fluid
        >
            <v-virtual-scroll
                v-if="mapObjects.length > 0 && showMapObjectsUpdateOverlay === false"
                :items="mapObjects"
                item-height="72px"
                class="gwtk-beekeeper-object-virtual_scroll"
            >
                <template #default="{ item }">
                    <gwtk-beekeeper-map-object-item
                        :key="item.id"
                        :map-object-content="createMapObjectContent(item)"
                        :selected="selectedMapObject.indexOf(item.guid) !== -1"
                        style="width: 100%; overflow: hidden"
                        @beekeeper:select="selectAndDrawBeekeeperObject"
                        @beekeeper:edit="openBeekeeperEditPanel"
                    />
                </template>
            </v-virtual-scroll>
            <v-col
                v-if="mapObjects.length === 0 && showMapObjectsUpdateOverlay === false"
            >
                {{ $t('phrases.No items found') }}
            </v-col>
        </v-container>
        <v-row
            v-if="mapObjects.length < mapVue.getMap().searchManager.responseMapObjectCount"
            justify="center"
            align="center"
            no-gutters
            class="mt-1"
        >
            <gwtk-button
                secondary
                :title="$t('phrases.Load more')"
                @click="findNext"
            />
        </v-row>
        <v-overlay
            :value="showMapObjectsUpdateOverlay"
            absolute
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular active indeterminate size="64" />
            </v-row>
        </v-overlay>
    </v-container>
</template>

<script lang="ts" src="./GwtkBeekeeperMapObjectWidget.ts"/>
<style scoped>
    .container-object {
        height: 100%;
        overflow-y: hidden;
    }
    .gwtk-beekeeper-object-virtual_scroll {
        height: 100%;
    }
</style>
