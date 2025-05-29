<template>
    <v-card flat>
        <v-expansion-panels v-if="allActiveLayers&&legendMapList.length">
            <v-list style="width: 100%">
                <gwtk-list-item
                    v-for="(legendMap) in legendMapList"
                    :key="legendMap.layerId"
                >
                    <gwtk-expansion-panel>
                        <template #expansion-panel-header>
                            <v-row align="center">
                                <v-col>
                                    {{ legendMap.mapLegendItem.itemName }}
                                </v-col>
                                <gwtk-icon-button
                                    v-if="!readOnlyMode"
                                    :icon="getItemVisibilityIcon(legendMap.mapLegendItem)"
                                    icon-size="18"
                                />
                                <v-menu
                                    v-if="!readOnlyMode"
                                    offset-y
                                >
                                    <template #activator="{ on: menu, attrs }">
                                        <v-tooltip bottom>
                                            <template #activator="{ on: tooltip }">
                                                <gwtk-icon-button
                                                    icon="dots"
                                                    v-bind="attrs"
                                                    v-on="{ ...tooltip, ...menu }"
                                                />
                                            </template>
                                            <div>{{ $t('legend.Additionally') }}</div>
                                        </v-tooltip>
                                    </template>
                                    <v-list>
                                        <v-list-item
                                            v-for="(item, index) in getMenuItems(legendMap.mapLegendItem)"
                                            :key="index"
                                            @click="toggleMenuItem(legendMap.mapLegendItem, item.value)"
                                        >
                                            {{ item.text }}
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </v-row>
                        </template>
                        <v-list>
                            <gwtk-list-item
                                v-for="(item) in getObjectList(legendMap)"
                                :key="item.key"
                                :title="item.itemName"
                            >
                                <template #left-slot>
                                    <v-img
                                        :src="item.itemIcon"
                                        class="editor-icon"
                                    />
                                </template>
                                <template #right-slot>
                                    <gwtk-icon-button
                                        v-if="isVisibilityAvailable&&item.isToggleVisibilityEnabled&&!buttonMode"
                                        :icon="item.visible?'visibility-on':'visibility-off'"
                                        :icon-size="18"
                                        :selected="item.visible"
                                        @click.stop="item.visible=!item.visible"
                                    />
                                </template>
                            </gwtk-list-item>
                        </v-list>
                    </gwtk-expansion-panel>
                </gwtk-list-item>
            </v-list>
        </v-expansion-panels>
        <v-virtual-scroll
            v-else-if="legendMapSingleObjectList.length > 0"
            :style="{ maxHeight: layerStyleSettingsMode ? 'calc(100% - 15%)' : '100%' }"
            class="gwtk-scrollable-container border"
            :item-height="isReducedSizeInterface?'40px':'60px'"
            :items="legendMapSingleObjectList"
        >
            <template #default="{ item }">
                <v-tooltip top>
                    <template #activator="{ on: tooltip }">
                        <gwtk-list-item
                            :key="item.key"
                            :title="item.text"
                            v-on="tooltip"
                        >
                            <template #left-slot>
                                <v-row v-if="layerStyleSettingsMode" align="center" class="gwtk-list-item-left-slot-icon">
                                    <gwtk-icon-button
                                        :icon="getDisabled(item)"
                                        :icon-size="18"
                                        clean
                                        @click.stop="toggleItem(item)"
                                    />
                                    <v-img
                                        :src="item.itemIcon"
                                        class="editor-icon"
                                    />
                                </v-row>
                                <v-img
                                    v-else
                                    :src="item.itemIcon"
                                    class="editor-icon"
                                />
                            </template>
                            <template #right-slot>
                                <gwtk-icon-button
                                    v-if="isVisibilityAvailable&&item.isToggleVisibilityEnabled&&!buttonMode"
                                    :icon="item.visible?'visibility-on':'visibility-off'"
                                    :icon-size="18"
                                    :selected="item.visible"
                                    @click.stop="item.visible=!item.visible"
                                />
                            </template>
                        </gwtk-list-item>
                    </template>
                    <div>{{ item.text }}</div>
                </v-tooltip>
            </template>
        </v-virtual-scroll>
        <v-container v-else class="border" style="height: 100%">
            {{ $t('legend.No visible legend layers') }}
        </v-container>
        <v-row v-if="layerStyleSettingsMode" class="mt-4">
            <v-col>
                <gwtk-button
                    primary
                    width-available
                    :title="$t('legend.Select')"
                    :disabled="!(mapLegendItemsSelectedList && mapLegendItemsSelectedList.length)"
                    @click="toggleSelect"
                />
            </v-col>
            <v-col>
                <gwtk-button
                    secondary
                    width-available
                    :title="$t('legend.Cancel')"
                    @click="toggleCancel"
                />
            </v-col>
        </v-row>
    </v-card>
</template>

<script lang="ts" src="./GwtkMapLegendListWidget.ts" />

<style scoped>
    .editor-icon {
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        border: 1px solid var(--v-secondary-lighten5);
        box-sizing: border-box;
        width: var(--editor-icon-width);
    }

    .gwtk-scrollable-container {
        max-height: 100%;
        overflow-y: auto;
    }
    .gwtk-list-item-left-slot-icon {
        padding-left: 1rem;
        padding-right: 0.5rem;
    }

    ::v-deep .v-list-item__title {
      text-overflow: ellipsis;
      white-space: nowrap;
    }
</style>