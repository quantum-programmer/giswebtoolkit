<template>
    <v-data-table
        dense
        :headers="tableParams.tableHeaders"
        :disable-sort="true"
        :items="tableParams.tableBody"
        item-key="showMapObjectInMap"
        :items-per-page="tableParams.recordsOnPage.records"
        :page="tableParams.recordsOnPage.page"
        :value="selectedItems"
        :height="isReducedSizeInterface?'calc(100% - 64px)':'calc(100% - 120px)'"
        fixed-header
        hide-default-footer
        class="px-1 mt-2 gwtk-data-table"
        :class="isReducedSizeInterface?'gwtk-data-table-reduce':''"
        @pagination="showTableOptions"
        @click:row="tableSelectedItemsList"
    >
        <template #top>
            <v-row dense>
                <v-col
                    cols="10" class="px-2"
                    :class="isReducedSizeInterface?'v-text-field-placeholder-reduce':''"
                >
                    <v-text-field
                        v-model="tableSearchValue"
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
                                name="search"
                                :size="isReducedSizeInterface?14:24"
                                @click="findObjectsBySearchValue"
                            />
                        </template>
                    </v-text-field>
                </v-col>
                <v-col cols="2" align-self="center">
                    <v-menu
                        v-model="isShowSettings"
                        :attach="attachParam"
                        :close-on-click="false"
                        :close-on-content-click="false"
                        :min-width="'98% !important'"
                        :nudge-left="'458'"
                        :rounded="'0'"
                        offset-y
                        transition="slide-y-transition"
                        z-index="10"
                        content-class="gwtk-param-container"
                    >
                        <template #activator="{ on: menu, attr }">
                            <v-tooltip bottom>
                                <template #activator="{ on: tooltip }">
                                    <gwtk-button
                                        secondary
                                        class="mr-2"
                                        icon="settings"
                                        :icon-size="isReducedSizeInterface?14:26"
                                        v-bind="attr"
                                        v-on="{ ...tooltip, ...menu }"
                                    />
                                </template>
                                <div>{{ $t('phrases.Options') }}</div>
                            </v-tooltip>
                        </template>
                        <v-sheet :width="'100%'" class="gwtk-height-limiter">
                            <v-container class="gwtk-height-limiter">
                                <v-row
                                    justify="space-between"
                                    align-content="center"
                                >
                                    <v-col
                                        cols="4"
                                        class="mt-n1 subtitle-2"
                                    >
                                        <v-btn
                                            dense
                                            text
                                            color="secondary"
                                            depressed
                                            class="mt-0 text-none text--primary"
                                            @click="closeSettingsMenu"
                                        >
                                            <v-icon
                                                dark
                                                class="mr-4"
                                            >
                                                mdi-arrow-left
                                            </v-icon>
                                            {{ $t('phrases.Options') }}
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <v-row class="ma-1 pt-0 gwtk-height-limiter">
                                    <v-col class="pt-0 gwtk-height-limiter">
                                        <v-row
                                            justify="center"
                                            align-content="center"
                                        >
                                            <v-col
                                                cols="auto"
                                                align-self="center"
                                            >
                                                <v-row
                                                    justify="space-between"
                                                    align-content="center"
                                                >
                                                    <v-col
                                                        cols="auto"
                                                        class="mt-4 align-center row_line_height"
                                                    >
                                                        {{ $t('mapdb.Only filled in') }}
                                                    </v-col>
                                                    <v-col class="d-flex justify-end">
                                                        <v-switch
                                                            v-model="isShowNotEmptyFields"
                                                            hide-details
                                                            dense
                                                        />
                                                    </v-col>
                                                </v-row>
                                            </v-col>
                                        </v-row>
                                        <v-divider class="mt-3 mb-2" />
                                        <v-row justify="center" align-self="center">
                                            <v-col
                                                cols="auto"
                                                align-self="center"
                                            >
                                                <v-row
                                                    justify="space-between"
                                                    align-content="center"
                                                >
                                                    <v-col
                                                        cols="auto"
                                                        class="mt-2 mr-8"
                                                    >
                                                        {{ $t('phrases.Items per page') }}
                                                    </v-col>
                                                    <v-col
                                                        cols="auto"
                                                        class="mr-n4"
                                                    >
                                                        <v-select
                                                            :items="tableParams.recordsOnPage.recordsSelect"
                                                            :value="tableParams.recordsOnPage.records"
                                                            dense
                                                            flat
                                                            solo
                                                            hide-details
                                                            style="max-width: 100px"
                                                            @change="onSelectRecordsOnPageWidget"
                                                        />
                                                    </v-col>
                                                </v-row>
                                            </v-col>
                                        </v-row>
                                        <v-divider class="mt-3 mb-2" />
                                        <v-row dense class="gwtk-height-limiter">
                                            <v-col
                                                cols="12"
                                                align-self="center"
                                                class="gwtk-height-limiter"
                                            >
                                                <v-row>
                                                    <v-col cols="auto">
                                                        {{ $t('mapdb.Settings show fields') }}
                                                    </v-col>
                                                </v-row>
                                                <v-divider class="mt-3 mb-2" />
                                                <v-row class="gwtk-height-limiter">
                                                    <v-col cols="12" class="gwtk-height-limiter">
                                                        <v-list
                                                            dense
                                                            flat
                                                            class="gwtk-field-list"
                                                        >
                                                            <v-list-item-group
                                                                v-model="settingsShowFieldsHeaders"
                                                                multiple
                                                                active-class=""
                                                            >
                                                                <template
                                                                    v-for="(item, index) in tableParams.tableAllHeaders"
                                                                >
                                                                    <v-list-item
                                                                        v-if="index > 1"
                                                                        :key="item.value"
                                                                        :value="item.value"
                                                                        link
                                                                        :disabled="item.empty"
                                                                    >
                                                                        <template #default="{ active }">
                                                                            <v-list-item-action>
                                                                                <v-checkbox :input-value="active" />
                                                                            </v-list-item-action>
                                                                            <v-list-item-content
                                                                                style="max-width: 50px;"
                                                                            >
                                                                                {{ index - 1 }}
                                                                            </v-list-item-content>
                                                                            <v-list-item-content>
                                                                                {{ item.text }}
                                                                            </v-list-item-content>
                                                                        </template>
                                                                    </v-list-item>
                                                                    <v-divider
                                                                        v-if="index === tableParams.mapMetadataLength"
                                                                        :key="index"
                                                                        style="border-width: thin 0 5px; border-color: black"
                                                                    />
                                                                </template>
                                                            </v-list-item-group>
                                                        </v-list>
                                                    </v-col>
                                                </v-row>
                                            </v-col>
                                        </v-row>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-sheet>
                    </v-menu>
                </v-col>
            </v-row>
        </template>
        <template #footer>
            <v-pagination
                v-model="paginationPageNumber"
                :length="paginationLength"
                class="pt-1"
            />
        </template>
        <template #[`item.showMapObjectInMap`]="{item}">
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        v-if="checkClusterObject(item.showMapObjectInMap)"
                        :key="'geolocation_'+item.showMapObjectInMap"
                        icon="target"
                        :icon-size="isReducedSizeInterface?14:18"
                        class="my-1"
                        secondary
                        v-on="on"
                        @click.stop="toggleMapObject(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ $t('mapcontent.Show object') }}</div>
            </v-tooltip>
            <v-tooltip v-if="!isShowSelectedObjects()" bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        v-if="!checkClusterObject(item.showMapObjectInMap)"
                        :key="'geolocation_'+item.showMapObjectInMap"
                        :selected="getIsReallySelected(item.showMapObjectInMap)"
                        icon="flashlight-plus"
                        :icon-size="isReducedSizeInterface?14:18"
                        class="my-1"
                        secondary
                        v-on="on"
                        @click.stop="toggleSelectOrUnselect(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ getIsReallySelected(item.showMapObjectInMap)? $t('mapobjectpanel.Remove from selected') : $t('mapobjectpanel.Add to selected') }}</div>
            </v-tooltip>
            <v-tooltip v-else bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        :key="'remove_'+item.showMapObjectInMap"
                        icon="mdi-select-remove"
                        :icon-size="isReducedSizeInterface?14:18"
                        class="my-1"
                        v-on="on"
                        @click.stop="toggleSelectOrUnselect(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ $t('mapobjectpanel.Remove from selected') }}</div>
            </v-tooltip>
        </template>
        <template #[`item.showMapObjectInfo`]="{item}">
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        v-if="checkClusterObject(item.showMapObjectInMap )"
                        :key="'information_'+item.mapObjectId"
                        secondary
                        icon="mdi-format-list-bulleted-square"
                        :icon-size="isReducedSizeInterface?14:18"
                        icon-mode
                        v-on="on"
                        @click.stop="toggleMapObjectInformation(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ $t('phrases.Object information') }}</div>
            </v-tooltip>
            <v-tooltip v-if="editingMode" bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        v-if="!checkClusterObject(item.showMapObjectInMap )"
                        :key="'information_'+item.mapObjectId"
                        secondary
                        icon="mdi-square-edit-outline"
                        :icon-size="isReducedSizeInterface?14:18"
                        icon-mode
                        v-on="on"
                        @click.stop="toggleMapObjectInformation(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ $t('phrases.Edit object') }}</div>
            </v-tooltip>
            <v-tooltip v-else bottom>
                <template #activator="{ on }">
                    <gwtk-button
                        v-if="!checkClusterObject(item.showMapObjectInMap )"
                        :key="'information_'+item.mapObjectId"
                        secondary
                        icon="mdi-information-variant"
                        :icon-size="isReducedSizeInterface?14:18"
                        icon-mode
                        v-on="on"
                        @click.stop="toggleMapObjectInformation(item.showMapObjectInMap)"
                    />
                </template>
                <div>{{ $t('phrases.Object information') }}</div>
            </v-tooltip>
        </template>
        <template #no-data>
            {{ $t('phrases.No items found') }}
        </template>
        <template #no-results>
            {{ $t('phrases.No items found') }}
        </template>
        <template
            v-if="tableLoading"
            #[`body.prepend`]="{headers}"
        >
            <tr>
                <td :colspan="headers.length" style="height: 24px;">
                    <v-progress-linear
                        :active="tableLoading"
                        color="grey"
                        rounded
                        bottom
                        indeterminate
                        height="4"
                    />
                </td>
            </tr>
        </template>
    </v-data-table>
</template>

<script lang="ts" src="./GwtkMapObjectTableWidget.ts" />

<style>
    .gwtk-data-table {
        height: calc(100% - 78px);
    }

    .v-data-table__wrapper tbody tr td {
        padding: 0 8px !important;
    }

    .v-data-table-header tr th {
        padding: 0 8px !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
    }

    .gwtk-draggable-task-card .v-data-table__wrapper .v-menu__content {
        top: 5px !important;
        left: 1% !important;
    }

    .row_line_height {
        line-height: 30px;
    }

    .gwtk-field-list {
        height: calc(100% - 3.1em);
        overflow: auto;
    }

    .gwtk-height-limiter {
        height: calc(100% - 1em);
    }

    .gwtk-param-container {
        height: 98%;
        overflow: hidden;
    }

    .theme--dark .gwtk-param-container {
        border: 1px solid var(--v-secondary-base);
    }
    .gwtk-data-table-reduce .v-data-table__wrapper table > tbody > tr > td {
        max-width: 3rem ;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>
<style scoped>

.gwtk-data-table .v-btn:not(.v-btn--round).v-size--default {
    height: var(--v-btn-height--default);
    padding-right: var(--px-2) !important;
    padding-left: var(--px-2) !important;
    padding-top: var(--py-2) !important;
    padding-bottom: var(--py-2) !important;
}

</style>
