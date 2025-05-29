<template>
    <gwtk-menu
        theme="clean"
        icon="dots"
        icon-color=" var(--v-primary-base)"
        icon-size="18"
        :close-on-content-click="closeOnContentClick"
        top
    >
        <div ref="layerMenuItemsList">
            <v-list>
                <gwtk-list-item
                    icon="target"
                    icon-size="18"
                    :title="targetIconTitle"
                    @click="viewEntireLayer"
                />
                <gwtk-list-item
                    v-if="canShowExport"
                    theme="clean"
                    icon="download"
                    icon-size="18"
                    :title="downloadTitle"
                    @click="toggleDownloadMenuItem"
                >
                    <template #right-slot>
                        <v-progress-circular
                            v-if="isLoadingLayer"
                            size="18"
                            :width="2"
                            indeterminate
                        />
                    </template>
                </gwtk-list-item>
                <template v-if="showExportMenu">
                    <v-divider />
                    <div :style="needScrollToDownloadMenuItem? 'max-height: 80px; overflow-y: auto' : ''">
                        <v-list class="py-0">
                            <gwtk-list-item
                                v-for="(item, index) in exportItems"
                                :key="index"
                                class="ml-6"
                                :title="item"
                                @click="toggleDownLoadLayer(item)"
                            />
                        </v-list>
                    </div>
                    <v-divider />
                </template>
                <gwtk-list-item
                    v-if="layerTreeItem.isCloseEnabled"
                    icon="close-icon"
                    icon-size="18"
                    :title="closeBtnTitle"
                    @click="closeLayer"
                />

                <gwtk-menu
                    :close-on-content-click="false"
                    transition="slide-y-transition"
                    offset-y
                    left
                >
                    <template #trigger="{ on, attrs }">
                        <gwtk-list-item
                            v-blur
                            icon="settings"
                            icon-size="18"
                            :title="settingsBtnTitle"
                            :disabled="!layerTreeItem.visible"
                            v-bind="attrs"
                            v-on="on"
                        />
                    </template>
                    <v-card
                        class="opacity-card"
                    >
                        <v-card-subtitle
                            class="subtitle-2"
                        >
                            {{ $t('phrases.Opacity') }}
                        </v-card-subtitle>
                        <v-card-text>
                            <v-slider
                                :value="layerTreeItem.opacity"
                                :label="opacityLabel"
                                hide-details
                                thumb-label
                                inverse-label
                                @change="setOpacityLayer"
                            />
                        </v-card-text>
                    </v-card>
                </gwtk-menu>






                <gwtk-list-item
                    v-if="layerTreeItem.isLegendViewEnabled"
                    icon="mdi-map-legend"
                    icon-size="18"
                    :title="$t('legend.Map legend')"
                    :disabled="!layerTreeItem.visible"
                    @click="openMapLegend"
                />
                <gwtk-list-item
                    v-if="layerTreeItem.isLegendViewEnabled"
                    icon="filter-settings"
                    icon-size="18"
                    :title="$t('mapcontent.Layer style settings')"
                    :disabled="!layerTreeItem.visible"
                    @click="openLayerStylesSettings"
                />
                <!--            <gwtk-list-item-->
                <!--                v-if="isInfoEnabled"-->
                <!--                icon="information"-->
                <!--                icon-size="18"-->
                <!--                :title="informationIconTitle"-->
                <!--            />-->
                <gwtk-list-item
                    v-if="layerTreeItem.isObjectListEnabled"
                    icon="list"
                    icon-size="18"
                    :title="$t('phrases.Objects on a layer')"
                    @click="getObjectList"
                />
                <gwtk-list-item
                    v-if="layerTreeItem.isRemoveEnabled"
                    icon="trash-can"
                    icon-size="18"
                    :title="$t('phrases.Remove')"
                    @click="layerTreeItem.remove()"
                />
                <gwtk-list-item
                    v-if="isEditorAvailable && layerTreeItem.isEditable"
                    icon="mdi-pencil-outline"
                    icon-size="18"
                    :title="$t('phrases.Editing')"
                    :disabled="!layerTreeItem.visible"
                    @click="openMapEditor"
                />
                <gwtk-list-item
                    v-if="isDynamicLayer"
                    :icon="dynamicLayerIcon"
                    icon-size="18"
                    :title="$t('phrases.Signatures')"
                    @click="setDynamicLabel"
                />
                <gwtk-list-item
                    v-if="isCopyStoredAvailable"
                    :title="titleForCopyStored"
                    :icon="iconForCopyStored"
                    icon-size="18"
                    @click="copyToOtherStorage"
                />
                <gwtk-list-item
                    v-if="isDeleteStoredAvailable"
                    :title="$t('mapcontent.Delete from storage')"
                    icon="mdi-trash-can-outline"
                    icon-size="18"
                    @click="deleteFromStorage"
                />





                <gwtk-list-item
                    v-for="(menuItem, index) in menuListItems"
                    v-show="menuItem.vIf(layerTreeItem)"
                    :key="index"
                    :title="typeof menuItem.title === 'string' ? menuItem.title : menuItem.title(layerTreeItem)"
                    :icon="typeof menuItem.icon === 'string' ? menuItem.icon : menuItem.icon(layerTreeItem)"
                    :icon-size="menuItem.iconSize"
                    :disabled="menuItem.disabled? menuItem.disabled(layerTreeItem) : false"
                    @click="menuItem.click(layerTreeItem)"
                />
            </v-list>
        </div>
    </gwtk-menu>
</template>

<script lang="ts" src="./GwtkMapContentItemMenuWidget.ts" />

<style scoped>
.opacity-card {
    min-width: 220px;
}
</style>
