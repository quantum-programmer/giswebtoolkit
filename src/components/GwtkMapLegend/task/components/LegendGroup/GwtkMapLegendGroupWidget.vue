<template>
    <div>
        <gwtk-page
            v-if="!showSearch"
            class="gwtk-page-full"
            :style="{ maxHeight: layerStyleSettingsMode ? 'calc(100% - 15%)' : '100%' }"
            icon="mdi-arrow-left"
            :title="currentMapLegendItem !== null? currentMapLegendItem.itemName : ''"
            :without-header="isWithoutHeader(currentMapLegendItem)"
            @leftButtonClicked="onBackButtonClicked"
        >
            <v-list class="gwtk-scrollable-container">
                <template v-for="(childLegendItem, index) in sortCurrentMapLegendItem">
                    <gwtk-list-item
                        v-if="isAvailable(childLegendItem)"
                        :key="index"
                        :class="getActiveChildClass(childLegendItem)"
                        :title="childLegendItem.itemName"
                        @click="onMapLegendItemClicked(childLegendItem)"
                    >
                        <template #left-slot>
                            <gwtk-icon
                                v-if="currentMapLegendItem.isRootElement"
                                name="mdi-folder-outline"
                                size="24"
                            />
                            <v-row v-else-if="!currentMapLegendItem.isRootElement && layerStyleSettingsMode" align="center" class="gwtk-list-item-left-slot-icon">
                                <gwtk-icon-button
                                    :icon="getDisabled(childLegendItem)"
                                    :icon-size="18"
                                    clean
                                    @click.stop="toggleItem(childLegendItem)"
                                />
                                <v-img
                                    :src="childLegendItem.itemIcon"
                                    class="editor-icon"
                                />
                            </v-row>
                            <v-img
                                v-else
                                :src="childLegendItem.itemIcon"
                                class="editor-icon"
                            />
                        </template>
                        <template #right-slot>
                            <gwtk-icon-button
                                v-if="isVisibilityAvailable&&childLegendItem.isToggleVisibilityEnabled&&!buttonMode"
                                :icon="getItemVisibilityIcon(childLegendItem)"
                                :selected="getItemSelected(childLegendItem) && getItemVisibilityIcon(childLegendItem) === 'visibility-on'"
                                icon-size="20"
                                @click.stop="enableClick(childLegendItem)? toggleVisibility(childLegendItem) : null"
                            />
                            <v-menu
                                v-if="isVisibilityAvailable&&getMenuItems(childLegendItem).length"
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
                                        v-for="(item1, index1) in getMenuItems(childLegendItem)"
                                        :key="index1"
                                        @click="toggleMenuItem(childLegendItem, item1.value)"
                                    >
                                        {{ item1.text }}
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                    </gwtk-list-item>
                </template>
                <div v-if="isNoItems()" class="pl-3 pt-1">
                    {{ $t('legend.No visible legend layers') }}
                </div>
            </v-list>
        </gwtk-page>
        <v-list
            v-else
            :style="{ maxHeight: layerStyleSettingsMode ? 'calc(100% - 15%)' : '100%' }"
            class="gwtk-scrollable-container"
        >
            <gwtk-list-item
                v-for="(childLegendItem, index) in searchResult"
                :key="index"
                :class="getActiveChildClass(childLegendItem)"
                :title="childLegendItem.itemName"
                @click="onSearchMapLegendItemClicked(childLegendItem)"
            >
                <template #left-slot>
                    <gwtk-icon
                        v-if="childLegendItem.parentItem.isRootElement"
                        name="mdi-folder-outline"
                        size="24"
                    />
                    <v-row v-else-if="!currentMapLegendItem.isRootElement && layerStyleSettingsMode" align="center" class="gwtk-list-item-left-slot-icon">
                        <gwtk-icon-button
                            :icon="getDisabled(childLegendItem)"
                            :icon-size="18"
                            clean
                            @click.stop="toggleItem(childLegendItem)"
                        />
                        <v-img
                            :src="childLegendItem.itemIcon"
                            class="editor-icon"
                        />
                    </v-row>
                    <v-img
                        v-else
                        :src="childLegendItem.itemIcon"
                        class="editor-icon"
                    />
                </template>
            </gwtk-list-item>
        </v-list>
        <v-row
            v-if="searchResult.length < 1 && showSearch"
            justify="center"
            align-content="center"
        >
            <v-col
                cols="auto"
            >
                {{ $t('phrases.No items found') }}
            </v-col>
        </v-row>
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

<script lang="ts" src="./GwtkMapLegendGroupWidget.ts" />

<style scoped>

    .gwtk-page-full {
        width: 100%;
        height: 100%;
    }

    .custom-icon {
        width: 24px;
        height: 24px;
    }

    .editor-icon {
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        border: 1px solid var(--v-secondary-lighten5);
        box-sizing: border-box;
        width: var(--editor-icon-width);
    }

    .hide-item {
        display: none
    }

    .gwtk-scrollable-container {
        max-height: 100%;
        overflow-y: auto;
    }
    .gwtk-list-item-left-slot-icon {
        padding-left: 1rem;
        padding-right: 0.5rem;
    }
</style>
