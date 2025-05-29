<template>
    <gwtk-page
        :title="currentLayerItem.layerName"
        :without-header="currentLayerItem.isRootElement"
        class="gwtk-scrollable-container"
        icon="mdi-arrow-left"
        @leftButtonClicked="onBackButtonClicked"
    >
        <template
            v-if="currentLayerItem.isVirtualFolder"
            #afterTitle
        >
            <v-btn
                class="pa-0 mr-3"
                icon
                small
                @click="(e)=>{currentLayerItem.update(); e.stopPropagation(); e.preventDefault();}"
            >
                <gwtk-icon
                    v-if="!currentLayerItem.updateProcess"
                    name="mdi-sync"
                />
                <v-progress-circular
                    v-else
                    size="18"
                    width="2"
                    indeterminate
                />
            </v-btn>
        </template>
        <v-list
            class="gwtk-scrollable-container"
        >
            <!-- Замена :key="index" на :key="childLayerItem.layerGUID" по причине неправильного порядка прокрисовки компонентов -->
            <gwtk-list-item
                v-for="childLayerItem in currentLayerItem.childLayerItems"
                :key="childLayerItem.layerGUID"
                :class="'gwtk-test-mapContent-layer-' + childLayerItem.layerName"
                :title="childLayerItem.layerName"
                :title-class="childLayerItem.disabled? 'text--disabled' : ''"
                @click="(e)=>onMapLayerItemClicked(childLayerItem, e)"
            >
                <template #left-slot>
                    <gwtk-icon-button
                        :icon="childLayerItem.isGroupItem? getDisabled(childLayerItem) : getItemVisibilityCheckedIcon(childLayerItem)"
                        :icon-color="childLayerItem.visibility==='hidden'?' var(--v-primary-lighten1)':' var(--v-primary-base)'"
                        :icon-size="18"
                        class="pr-1"
                        clean
                        @click.stop="toggleItem(childLayerItem);"
                    />

                    <v-img
                        v-if="childLayerItem.getItemImgUrl"
                        :src="childLayerItem.getItemImgUrl"
                        :width="18"
                        :height="18"
                    >
                        <template #placeholder>
                            <v-progress-circular
                                indeterminate
                                color="var(--v-secondary-lighten1)"
                                :size="18/1.5"
                                width="2"
                            />
                        </template>
                    </v-img>
                    <gwtk-icon
                        v-else
                        :name="childLayerItem.getItemIconName||'mdi-folder-outline'"
                        :size="18"
                    />
                </template>

                <template #right-slot>
                    <v-tooltip
                        v-if="!childLayerItem.isGroupItem&&childLayerItem.isEditable"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="childLayerItem.isEditable"
                                class="tooltip-icon-color"
                                icon="mdi-pencil-outline"
                                :ripple="false"
                                :icon-size="16"
                                v-on="on"
                                @click.stop="()=>{}"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Editing available') }}</div>
                    </v-tooltip>
                    <v-tooltip
                        v-if="!childLayerItem.isGroupItem&&childLayerItem.isTooltipMap"
                        bottom
                    >
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
                    <v-tooltip
                        v-if="!childLayerItem.isGroupItem&&childLayerItem.isAdditionalSld"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                v-if="childLayerItem.isAdditionalSld"
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
                    <gwtk-map-content-item-menu-widget
                        v-if="!childLayerItem.isGroupItem"
                        :map-vue="mapVue"
                        :set-state="setState"
                        :content-tree-item="childLayerItem.contentTreeItem"
                        :dynamic-label-data="dynamicLabelData"
                        :is-user-logged="isUserLogged"
                        :user-login="userLogin"
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
    </gwtk-page>
</template>

<script src="./GwtkMapContentGroup.ts" lang="ts" />

<style scoped>
    .tooltip-icon-color {
        --icon-color: var(--v-secondary-lighten3) !important;
        cursor: default;
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

    ::v-deep .gwtk-list-item-left-slot-content {
        display: flex;
        align-items: center;
    }

</style>

<style>
    .tooltip-icon-color:hover::before {
        opacity: 0 !important;
    }
</style>
