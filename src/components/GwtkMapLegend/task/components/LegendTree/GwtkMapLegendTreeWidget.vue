<template>
    <div style="height:calc(100% - var(--gwtk-task-card-title-height))">
        <div class="border pa-1 gwtk-scrollable-container" :style="{ height: layerStyleSettingsMode ? 'calc(100% - 76px)' : 'calc(100% - 8px)' }">
            <v-treeview
                :open="openTreeElement.length? openTreeElement : []"
                :dense="!layerStyleSettingsMode ? true:false"
                hoverable
                open-on-click
                :items="!allActiveLayers? items : allItems"
                item-key="key"
                @update:open="inputTree"
            >
                <template #prepend="{item, open}">
                    <gwtk-icon
                        v-if="item.icon === ''"
                        :name="open? 'mdi-folder-open-outline' : 'mdi-folder-outline'"
                        size="18"
                    />
                    <v-row
                        v-else-if="item.icon !== '' && layerStyleSettingsMode"
                        align="center"
                        class="treeview-prepend"
                    >
                        <gwtk-icon-button
                            :icon="getDisabled(item)"
                            :icon-size="18"
                            clean
                            @click.stop="toggleItem(item)"
                        />
                        <v-img
                            :src="item.icon"
                            class="legend-icon mr-2"
                        />
                    </v-row>
                    <v-img
                        v-else
                        :src="item.icon"
                        class="legend-icon"
                    />
                </template>
                <template v-if="isVisibilityAvailable" #append="{item}">
                    <gwtk-icon-button
                        v-if="item.isToggleVisibilityEnabled"
                        :icon="getItemVisibilityIcon(item)"
                        :selected="item.visible && item.children.length === 0"
                        icon-size="18"
                        @click="enableClick(item)? updateVisibility(item) : null"
                    />
                    <v-menu
                        v-if="getMenuItems(item).length"
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
                                v-for="(item1, index) in getMenuItems(item)"
                                :key="index"
                                @click="toggleMenuItem(item, item1.value)"
                            >
                                {{ item1.text }}
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
                <template #label="{item}">
                    <v-tooltip bottom>
                        <template #activator="{ on, attrs }">
                            <span 
                                v-bind="attrs" 
                                v-on="on"
                            >
                                {{ item.name }}
                            </span>
                        </template>
                        {{ item.name }}
                    </v-tooltip>
                </template>
            </v-treeview>
            <div v-if="isNoItems()" class="pl-2 pt-2">
                {{ $t('legend.No visible legend layers') }}
            </div>
        </div>
        <v-row v-if="layerStyleSettingsMode" class="mt-4">
            <v-col>
                <gwtk-button
                    primary
                    width-available
                    :title="$t('legend.Select')"
                    :disabled="false"
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
    </div>
</template>

<script lang="ts" src="./GwtkMapLegendTreeWidget.ts" />

<style scoped>
    .gwtk-scrollable-container {
        overflow-y: auto;
    }

    .legend-icon {
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      border: 1px solid var(--v-secondary-lighten5);
      box-sizing: border-box;
      width: var(--editor-icon-width);
    }
     .treeview-prepend {
        padding-right: 0.5rem;
    }
</style>
