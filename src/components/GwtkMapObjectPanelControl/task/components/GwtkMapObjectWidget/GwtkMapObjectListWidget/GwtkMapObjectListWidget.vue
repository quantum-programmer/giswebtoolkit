<template>
    <v-container ref="container" class="pa-1 gwtk-map-object-list-widget">
        <v-row dense>
            <v-col cols="12" class="mb-3">
                <v-text-field
                    v-model="changeSearchValue"
                    :class="isReducedSizeInterface?'v-text-field-placeholder-reduce':''"
                    :placeholder="$t('phrases.Value')"
                    dense
                    paused
                    outlined
                    clearable
                    hide-details
                    @click:clear="findObjectsBySearchValueClearClick"
                    @keyup="findObjectsBySearchValueKeyDownEnter"
                >
                    <template #append>
                        <gwtk-icon
                            :size="isReducedSizeInterface?14:24"
                            name="search"
                            @click="findObjectsBySearchValue"
                        />
                    </template>
                </v-text-field>
            </v-col>
        </v-row>
        <v-container
            class="pa-0 pb-2"
            :style="{height: containerHeight}"
            fluid
        >
            <v-virtual-scroll
                ref="virtualScroll"
                bench="1"
                :items="mapObjectsList"
                :item-height="itemHeight"
            >
                <template #default="{ item }">
                    <gwtk-map-object-item
                        :key="item.id"
                        :map-object-content="createMapObjectContent(item)"
                        :show-in-map="item.id === drawnObjectId"
                        :selected="selectedMapObjects.indexOf(item.guid) !== -1"
                        :really-selected-objects="reallySelectedObjects"
                        :map-objects-state="mapObjectsState"
                        :clustered-objects-count="getClusteredObjectsCount(item)"
                        :is-reduced-size-interface="isReducedSizeInterface"
                        :editing-mode="editingMode"
                        class="pl-1 pr-2"
                        @mapobject:click="selectMapObjects"
                        @mapobject:showInMap="toggleMapObject(item.id)"
                        @mapobject:info="toggleMapObjectInformation(item)"
                        @mapobject:select="toggleSelectOrUnselect(item)"
                    />
                </template>
            </v-virtual-scroll>
        </v-container>
        <v-row
            v-if="isLoadMore"
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
    </v-container>
</template>

<script lang="ts" src="./GwtkMapObjectListWidget.ts" />
<style scoped>
    .gwtk-map-object-list-widget {
        overflow-y: hidden;
    }
</style>

