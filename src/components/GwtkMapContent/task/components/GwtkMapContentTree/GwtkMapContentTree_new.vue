<template>
    <div class="border pa-1" style="height: 100%">
        <h1>{{ 'Заголовок' }}</h1>
        <v-row no-gutters>
            <v-col cols="auto" class="ml-2">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon name="mdi-layers-outline" :size="18" v-on="on" />
                    </template>
                    <div>{{ $t('phrases.Layers') }}</div>
                </v-tooltip>
            </v-col>
            <v-col cols="auto">
                {{ treeItemStatistics.layer }}
            </v-col>
            <v-col cols="auto" class="ml-8">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon
                            name="mdi-pencil-outline"
                            :size="18"
                            class="pb-1"
                            v-on="on"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Editing available') }}</div>
                </v-tooltip>
            </v-col>
            <v-col cols="auto">
                {{ treeItemStatistics.editable }}
            </v-col>
            <v-col cols="auto" class="ml-8">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon name="mdi-tooltip-text-outline" :size="18" v-on="on" />
                    </template>
                    <div>{{ $t('mapcontent.Tooltips on the map') }}</div>
                </v-tooltip>
            </v-col>
            <v-col cols="auto">
                {{ treeItemStatistics.tooltip }}
            </v-col>
            <v-col cols="auto" class="ml-8">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <div v-on="on">
                            <gwtk-icon name="visibility-on" :size="18" />
                        </div>
                    </template>
                    <div>{{ $t('phrases.Visible') }}</div>
                </v-tooltip>
            </v-col>
            <v-col cols="auto">
                {{ treeItemStatistics.show }}
            </v-col>
        </v-row>
        <v-treeview
            :open="openTreeElement"
            hoverable
            open-on-click
            :items="treeViewItem"
            class="gwtk-map-content-tree gwtk-scrollable-container"
            @update:open="inputTree"
        >
            <template #prepend="{ item }">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <v-icon
                            v-if="item.legendError"
                            class="warning--text"
                            small
                            v-on="on"
                            @click="toggleLegendError(item.id)"
                        >
                            mdi-alert-outline
                        </v-icon>
                    </template>
                    <span>{{ $t('mapcontent.Failed to load legend') }}</span>
                </v-tooltip>
                <span v-if="!item.isLegendItem" @click.stop="() => {}">
                    <gwtk-icon-button
                        v-show="item.id !== 'legendEmptyChild'"
                        :icon="
                            item.isGroupItem
                                ? getDisabled(item)
                                : getItemVisibilityCheckedIcon(item)
                        "
                        :icon-color="
                            !enableCheckbox(item)
                                ? ' var(--v-primary-lighten2)'
                                : ' var(--v-primary-base)'
                        "
                        :icon-size="18"
                        clean
                        @click.stop="showTreeItem(item)"
                    />
                </span>
                <v-img
                    v-if="item.imgurl"
                    :src="item.imgurl"
                    class="item-icon"
                    :class="item.isLegendItem ? 'legend-icon' : ''"
                >
                    <template #placeholder>
                        <v-progress-circular
                            indeterminate
                            color="var(--v-secondary-lighten1)"
                            :size="18 / 1.5"
                            width="2"
                        />
                    </template>
                </v-img>
                <gwtk-icon v-else-if="!item.isGroupItem" :name="item.icon" :size="16" />
            </template>
            <template #label="{ item }">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <span v-on="on">{{ item.name }}</span>
                    </template>
                    <div>{{ item.name }}</div>
                </v-tooltip>
            </template>
            <template #append="{ item }">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isEditable"
                            :icon="'mdi-pencil-outline'"
                            :icon-size="16"
                            :ripple="false"
                            class="tooltip-icon-color"
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Editing available') }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isTooltipMap"
                            class="tooltip-icon-color"
                            icon="map-tooltip"
                            :ripple="false"
                            :icon-size="16"
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Tooltips on the map') }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-show="checkDynamicLayer(item.id)"
                            class="tooltip-icon-color"
                            icon="subtitles-outline"
                            :ripple="false"
                            :icon-size="16"
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Dynamic label on map') }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isAdditionalSld"
                            class="tooltip-icon-color"
                            icon="filter-settings"
                            :ripple="false"
                            :icon-size="15"
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Layer style settings') }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isFilteredByUser"
                            class="tooltip-icon-color"
                            icon="mdi-table-filter"
                            :ripple="false"
                            :icon-size="15"
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ $t('mapcontent.User filter is set') }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isGroupItem"
                            :icon="getItemVisibilityIcon(item)"
                            :icon-size="16"
                            :ripple="false"
                            class="tooltip-icon-color"
                            :icon-color="
                                getItemVisibilityIcon(item) === 'visibility-off'
                                    ? 'var(--v-secondary-lighten4)'
                                    : ''
                            "
                            v-on="on"
                            @click.stop="() => {}"
                        />
                    </template>
                    <div>{{ getTooltipText(item) }}</div>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-icon-button
                            v-if="item.isVirtualFolder"
                            icon="mdi-sync"
                            :icon-size="16"
                            clean
                            v-on="on"
                            @click.stop="updateVirtualFolder(item)"
                        />
                    </template>
                    <div>{{ $t('mapcontent.Update virtual folder') }}</div>
                </v-tooltip>
                <gwtk-icon-button
                    v-if="item.isLegendItem"
                    :icon="
                        getItemVisibilityIconLegend(item)
                            ? 'visibility-on'
                            : 'visibility-off'
                    "
                    :selected="getItemVisibilityIconLegend(item)"
                    :icon-size="16"
                    @click.stop="setLegendVisible(item)"
                />
                <gwtk-map-content-item-menu-widget
                    v-if="!item.isGroupItem && !item.isLegendItem"
                    :map-vue="mapVue"
                    :set-state="setState"
                    :content-tree-item="item"
                    :dynamic-label-data="dynamicLabelData"
                    :is-user-logged="isUserLogged"
                    :user-login="userLogin"
                    :menu-list-items="menuListItems"
                />
                <gwtk-group-item-menu-widget
                    v-else-if="!item.isLegendItem"
                    :map-vue="mapVue"
                    :set-state="setState"
                    :content-tree-item="item.item"
                    @update="updateTree()"
                />
            </template>
        </v-treeview>
        <sanizones-manager v-if="showSanizonesManager" />
    </div>
</template>

<script src="./GwtkMapContentTree.ts" />
<script>
import SanizonesManager from '@/components/SanizonesManager/SanizonesManager';

export default {
  components: {
    SanizonesManager,
  },
  data() {
    return {
      showSanizonesManager: true,
    };
  },
};
</script>

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
  max-height: calc(100% - 20px);
  overflow-y: auto;
}
/*::v-deep .v-image__image--cover {*/
/*    background-size: auto;*/
/*}*/
::v-deep .v-treeview-node__prepend {
  display: flex;
  align-items: center;
}

.item-icon.legend-icon {
  width: var(--editor-icon-width);
  height: var(--editor-icon-width);
  max-width: none;
  max-height: none;
}

.item-icon {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: 1px solid var(--v-secondary-lighten5);
  box-sizing: content-box;
  width: 16px;
  height: 16px;
  margin-bottom: 1px;
}
</style>
