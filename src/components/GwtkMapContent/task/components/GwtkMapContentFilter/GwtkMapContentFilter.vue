<template>
    <gwtk-page
        :icon="'mdi-arrow-left'"
        :title="currentLayerItem.layerName"
        without-header
        class="gwtk-scrollable-container overflow-x-hidden"
        @leftButtonClicked="onBackButtonClicked"
    >
        <v-list
            v-if="searchListItems.length !== 0"
        >
            <gwtk-list-item
                v-for="({item:childLayerItem, path}, index) in searchListLayerItems"
                :key="index"
                :class="'gwtk-test-mapContent-layer-' + childLayerItem.layerGUID"
                :icon="childLayerItem.getItemIconName"
                :icon-size="18"
                :subtitle="path"
                :title="childLayerItem.layerName"
                @click.stop="onSearchMapLayerItemClicked(childLayerItem)"
            >
                <template #right-slot>
                    <v-tooltip v-if="childLayerItem.isEditable" bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="childLayerItem.isEditable"
                                :icon="'mdi-pencil-outline'"
                                :icon-size="16"
                                :ripple="false"
                                class="tooltip-icon-color"
                                v-on="on"
                                @click.stop="()=>{}"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Editing available') }}</div>
                    </v-tooltip>
                    <v-tooltip v-if="childLayerItem.isTooltipMap" bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="childLayerItem.isTooltipMap"
                                class="tooltip-icon-color"
                                icon="map-tooltip"
                                :ripple="false"
                                :icon-size="16"
                                v-on="on"
                                @click.stop="()=>{}"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Tooltips on the map') }}</div>
                    </v-tooltip>
                    <v-tooltip v-if="childLayerItem.isAdditionalSld" bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                class="tooltip-icon-color"
                                icon="filter-settings"
                                :ripple="false"
                                :icon-size="15"
                                v-on="on"
                                @click.stop="()=>{}"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Layer style settings') }}</div>
                    </v-tooltip>
                    <v-tooltip v-if="childLayerItem.isGroupItem" bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="childLayerItem.isGroupItem"
                                :icon="getItemVisibilityIcon(childLayerItem)"
                                :icon-size="16"
                                :ripple="false"
                                class="tooltip-icon-color"
                                v-on="on"
                                @click.stop="()=>{}"
                            />
                        </template>
                        <div>{{ getTooltipText(childLayerItem) }}</div>
                    </v-tooltip>
                    <v-tooltip v-if="!childLayerItem.isGroupItem" bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="!childLayerItem.isGroupItem"
                                :icon="getItemVisibilityIcon(childLayerItem)"
                                clean
                                :icon-color="childLayerItem.visibility==='hidden'?' var(--v-primary-lighten1)':' var(--v-primary-base)'"
                                :icon-size="18"
                                :ripple="false"
                                v-on="on"
                                @click.stop="()=>{childLayerItem.visible=childLayerItem.visibility==='hidden'; onVerUpdate()}"
                            />
                        </template>
                        <div>{{ getTooltipText(childLayerItem) }}</div>
                    </v-tooltip>
                    <gwtk-map-content-item-menu-widget
                        v-if="!childLayerItem.isGroupItem"
                        :map-vue="mapVue"
                        :content-tree-item="childLayerItem.contentTreeItem"
                        :is-user-logged="isUserLogged"
                        :user-login="userLogin"
                        :set-state="setState"
                        :dynamic-label-data="dynamicLabelData"
                        :menu-list-items="menuListItems"
                    />
                    <gwtk-group-item-menu-widget
                        v-else
                        :map-vue="mapVue"
                        :content-tree-item="childLayerItem.contentTreeItem"
                        @update="onVerUpdate()"
                    />
                </template>
            </gwtk-list-item>
        </v-list>
        <v-row
            v-else
            justify="center"
            align-content="center"
        >
            <v-col
                cols="auto"
                class="mt-4 mb-4 mx-auto"
            >
                {{ $t('mapcontent.No items found') }}
            </v-col>
        </v-row>
    </gwtk-page>
</template>

<script src="./GwtkMapContentFilter.ts" lang="ts" />

<style scoped>
    .tooltip-icon-color {
        --icon-color: var(--v-secondary-lighten3) !important;
    }

    .tooltip-icon-color:hover {
        background-color: rgba(0, 0, 0, 0) !important;
    }

    .gwtk-scrollable-container {
        height: 100%;
        overflow-y: auto;
    }
    ::v-deep .v-list-item__title {
        text-overflow: ellipsis;
        white-space: nowrap;
    }


</style>
