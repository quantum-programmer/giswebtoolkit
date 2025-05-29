<template>
    <gwtk-task-bottom-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <div
            v-if="!showInfo && !showSettings && !advancedSearch && !onMapObjectSelected && !showSearchSettings"
            style="height: 100%;"
        >
            <div style="display: flex; justify-content: space-between; padding-top: 10px">
                <span style="display: flex; width: auto;">
                    <v-select
                        :items="layerIdList"
                        :value="selectedLayer"
                        :label="$t('phrases.Layer')"
                        dense
                        outlined
                        class="gwtk-test-mapdb-selectLayer mx-2"
                        style="width: 250px;"
                        @change="onSelectLayerWidget"
                    />
                    <v-select
                        :items="tableNameList"
                        :value="selectedDatabase"
                        item-value="tableName"
                        :item-text="item => $te('phrases.' + item.name)? $t('phrases.' + item.name): item.name"
                        :label="$t('phrases.Object type')"
                        :disabled="!selectedLayer && !onRequest"
                        dense
                        outlined
                        class="gwtk-test-mapdb-selectObjectType"
                        style="width: 250px;"
                        :menu-props="{ contentClass:'gwtk-test-mapdb-selectObjectType-list' }"
                        @change="onSelectDatabaseWidget"
                    />
                </span>
                <v-col
                    v-if="onSelectedDatabase"
                    class="ma-0 pa-0"
                    cols="auto"
                >
                    <v-row class="ma-0 pa-0">
                        <v-col class="ma-0 pa-0">
                            <v-tooltip
                                v-if="showElements.length"
                                bottom
                            >
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        clean
                                        icon="mdi-check-all"
                                        small
                                        class="gwtk-test-mapdb-select"
                                        v-on="on"
                                        @click.stop="clickSelectObject"
                                    />
                                </template>
                                <div>{{ $t('phrases.Select all') }}</div>
                            </v-tooltip>
                        </v-col>
                        <v-col class="ma-0 pa-0">
                            <v-tooltip
                                v-if="showElements.length"
                                bottom
                            >
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        clean
                                        icon="mdi-close-outline"
                                        :disabled="!selectedItemsId.length"
                                        small
                                        v-on="on"
                                        @click.stop="clickCancelObject"
                                    />
                                </template>
                                <div>{{ $t('phrases.Reset') }}</div>
                            </v-tooltip>
                        </v-col>
                        <v-col class="ma-0 pa-0 mx-2">
                            <gwtk-icon-button
                                class="gwtk-test-mapdb-mapSearch"
                                icon="mdi-map-search-outline"
                                :disabled="!canSearchObject"
                                small
                                @click="onClickMapSearch"
                            >
                                <span class="text-caption">
                                    {{ canSearchObjectList.length }}
                                </span>
                            </gwtk-icon-button>
                        </v-col>
                    </v-row>
                </v-col>
                <div v-if="showElements.length < totalRecords">
                    <gwtk-button
                        secondary
                        :title="$t('phrases.Load more')"
                        small
                        @click="loadMoreWidget"
                    />
                </div>
            </div>
            <v-row
                justify="space-between"
                class="mt-n5"
            >
                <v-col
                    v-if="onSelectedDatabase"
                    align-content="center"
                    dense
                    class="gwtk-mapdb-row my-0 py-0"
                    cols="5"
                >
                    <v-chip-group
                        v-if="fieldListAdvancedSearch.length > 0"
                        class="mt-n2"
                    >
                        <v-chip
                            v-for="(item, id) in fieldListAdvancedSearch"
                            :key="id"
                            close
                            @click:close="onClickDeleteField(item)"
                        >
                            {{ item.field + ': ' + (item.value1? (item.value2? $t('phrases.' + item.operator) + ': ' + item.value1 + ' - ' + item.value2 : $t('phrases.' + item.operator) + ': ' + item.value1) : '') }}
                        </v-chip>
                    </v-chip-group>
                    <v-text-field
                        v-else
                        :value="inputValueFastSearch"
                        :placeholder="$t('phrases.Value')"
                        style="min-width: 200px; max-width: 400px"
                        dense
                        paused
                        clearable
                        hide-details
                        class="mx-2"
                        @input="onInputFastSearchWidget"
                        @keyup.enter="fastSearchWidget"
                        @click:clear="clearSearchField()"
                    >
                        <template #prepend-inner>
                            <v-menu
                                offset-y
                                max-height="250"
                            >
                                <template #activator="{ on, attrs }">
                                    <gwtk-icon-button
                                        v-blur
                                        clean
                                        class="ml-n3 gwtk-test-mapdb-selectFastSearchFilter"
                                        icon="mdi-chevron-down"
                                        icon-color="var(--v-color-secondary-base)"
                                        v-bind="attrs"
                                        v-on="on"
                                    />
                                </template>
                                <v-list>
                                    <v-list-item
                                        v-for="(item, id) in newFieldsListFast"
                                        :key="id"
                                        class="gwtk-mapdb-list-item"
                                        link
                                        value="field"
                                        @click="onSelectFastSearch(item)"
                                    >
                                        <v-list-item-title v-if="newFieldsListFast[id].field === 'All Fields'">
                                            {{ $t('phrases.' + item.field) }}
                                        </v-list-item-title>
                                        <v-list-item-title v-else>
                                            {{ item.field }}
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                        <template #append>
                            <div class="v-input__icon align-center mr-1 gwtk-test-mapdb-fastSearchButton">
                                <gwtk-icon-button
                                    icon="search"
                                    @click="fastSearchWidget"
                                />
                            </div>
                        </template>
                    </v-text-field>
                </v-col>
                <v-col
                    style="margin: auto"
                    class="ma-0 pa-0"
                    cols="auto"
                >
                    <gwtk-button
                        v-if="showClearFastSearch"
                        secondary
                        class="gwtk-test-mapdb-reset mr-2"
                        :title="$t('phrases.Reset all')"
                        small
                        @click="onSelectDatabaseWidget"
                    />
                    <gwtk-icon-button
                        clean
                        class="gwtk-test-mapdb-advancedSearch"
                        icon="mdi-filter-menu-outline"
                        small
                        @click="onAdvancedSearchWidget"
                    />
                </v-col>
                <v-col
                    v-if="onSelectedDatabase"
                    class="ma-0 pa-0 mr-4"
                    cols="auto"
                >
                    <v-row class="ma-0 pa-0">
                        <v-col class="ma-0 pa-0 mx-2">
                            <gwtk-button
                                clean
                                icon="settings"
                                small
                                @click="onClickShowSearchSettings"
                            />
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <v-row
                style="height: calc(100% - 100px);"
                class="ma-0 pa-0 mt-4"
            >
                <gwtk-mapdb-elements
                    v-if="onSelectedDatabase"
                    :set-state="setState"
                    :fields-list="fieldsList"
                    :only-field-list="onlyFieldList"
                    :show-elements="showElements"
                    :total-records="totalRecords"
                    :selected-item="selectedItem"
                    :show-info="showInfo"
                    :selected-marker-item="selectedMarkerItem"
                    :selected-items-id="selectedItemsId"
                    :object-info="newObjectInfo"
                    :fields="selectShowInfo"
                />
            </v-row>
        </div>

        <div
            v-if="showInfo && !onMapObjectSelected && !showSettings"
            style="height: 100%;"
            class="mx-2"
        >
            <v-toolbar
                class="gwtk-page-toolbar gwtk-test-mapdb-back"
                flat
                @click="onClickBack('showInfo')"
            >
                <gwtk-icon
                    class="mr-3"
                    name="mdi-arrow-left"
                    :size="24"
                />
                <span class="text-subtitle-1">
                    {{ $t('phrases.Object information') }}
                </span>
                <v-spacer />
            </v-toolbar>
            <v-divider />
            <v-container class="showInfo-container mb-1">
                <v-container
                    v-for="(element, elementId) in objectInfo"
                    v-show="element[getShowInfo(element)]"
                    :key="elementId"
                >
                    <v-row>
                        <v-col cols="auto">
                            {{ element[0] }}
                        </v-col>
                        <v-spacer />
                        <v-col
                            cols="auto"
                            align-self="center"
                        >
                            {{ element[1] }}
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-divider />
                    </v-row>
                </v-container>
            </v-container>
        </div>
        <div
            v-if="advancedSearch && !onMapObjectSelected"
            class="ml-4 mr-4"
            style="height: 100%;"
        >
            <v-toolbar
                class="gwtk-page-toolbar"
                flat
                @click="onClickBack('advancedSearch')"
            >
                <gwtk-icon
                    class="mr-3"
                    name="mdi-arrow-left"
                    :size="24"
                />
                <span class="text-subtitle-1">
                    {{ $t('phrases.Advanced search') }}
                </span>
                <v-spacer />
            </v-toolbar>
            <v-container class="main-container">
                <v-row>
                    <v-col
                        v-for="(item, i) in fieldListAdvancedSearch"
                        :key="i"
                        class="pa-0 mb-3 mx-1"
                    >
                        <v-row>
                            <v-divider class="mt-1" />
                        </v-row>
                        <v-row class="font-weight-black ml-3 mt-5">
                            <v-card
                                elevation="0"
                                width="100%"
                            >
                                <v-row
                                    justify="center"
                                    align-content="center"
                                >
                                    <v-col cols="auto">
                                        {{ fieldListAdvancedSearch[i].field }}
                                    </v-col>
                                </v-row>
                            </v-card>
                        </v-row>
                        <v-row>
                            <v-col>
                                <v-row justify="center">
                                    <v-col class="mb-n4">
                                        <v-select
                                            :value="fieldListAdvancedSearch[i].operator"
                                            :items="fieldListAdvancedSearch[i].operations"
                                            class="gwtk-test-mapdb-operator my-1"
                                            item-value="name"
                                            :item-text="item => $t('phrases.' + item.name)"
                                            :label="$t('mapdb.Operator') "
                                            outlined
                                            dense
                                            hide-details
                                            @change="onSelectOperationTypeWidget($event, i)"
                                        />
                                    </v-col>
                                </v-row>
                                <v-row justify="center">
                                    <v-col class="gwtk-test-mapdb-field">
                                        <v-text-field
                                            :value="fieldListAdvancedSearch[i].value1"
                                            :label="$t('phrases.Value')"
                                            class="my-1"
                                            hide-details
                                            dense
                                            outlined
                                            style="min-width: 250px"
                                            @input="onInputValue1Widget($event, i)"
                                        />
                                    </v-col>
                                    <v-col v-if="fieldListAdvancedSearch[i].operator === 'between'">
                                        <v-text-field
                                            :value="fieldListAdvancedSearch[i].value2"
                                            :label="$t('phrases.Value')"
                                            class="my-1"
                                            hide-details
                                            dense
                                            outlined
                                            style="min-width: 250px"
                                            @input="onInputValue2Widget($event, i)"
                                        />
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>
                        <v-row justify="center">
                            <gwtk-button
                                secondary
                                :title="$t('phrases.Delete')"
                                class="mb-2"
                                @click="onClickDeleteField(item)"
                            />
                        </v-row>
                    </v-col>
                </v-row>

                <v-row
                    justify="center"
                    align-content="center"
                >
                    <v-col cols="auto">
                        <gwtk-menu
                            icon="mdi-plus"
                            class="gwtk-test-mapdb-addFilter"
                            :disabled="newFieldsList.length === 0"
                            max-height="250"
                            :title="$t('phrases.Add New')"
                            is-dropdown
                        >
                            <v-list>
                                <v-list-item
                                    v-for="(items, id) in newFieldsList"
                                    v-show="newFieldsList[id].field !== 'All Fields'"
                                    :key="id"
                                    :value="selectedAdvancedSearchField"
                                    :item-value="items => items"
                                    link
                                    @click="selectAdvancedSearchFieldWidget(items)"
                                >
                                    <v-list-item-title>
                                        {{ newFieldsList[id].field }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </gwtk-menu>
                    </v-col>
                </v-row>
            </v-container>
            <v-row
                justify="space-around"
                no-gutters
                class="pt-2"
            >
                <gwtk-button
                    primary
                    :disabled="!activeSearchButton()"
                    class="gwtk-test-mapdb-search"
                    width="45%"
                    :title="$t('phrases.Search')"
                    @click="onClickSearchButtonWidget"
                />
                <v-spacer />
                <gwtk-button
                    secondary
                    :title="$t('phrases.Cancel')"
                    width="45%"
                    @click="onClickBack('advancedSearch')"
                />
            </v-row>
        </div>
        <div
            v-if="showSearchSettings"
            class="ml-3 mr-3 mt-3"
        >
            <v-row class="ml-1 mr-1">
                <v-col cols="auto">
                    <v-toolbar
                        class="gwtk-page-toolbar"
                        flat
                        @click="onClickBack('onClickShowSearchSettings')"
                    >
                        <gwtk-icon
                            class="mr-3"
                            name="mdi-arrow-left"
                            :size="24"
                        />
                        <span class="text-subtitle-1">
                            {{ $t('phrases.Options') }}
                        </span>
                        <v-spacer />
                    </v-toolbar>
                    <v-row align-content="center">
                        <v-col
                            cols="12"
                            align-self="center"
                        >
                            <v-row align-content="center">
                                <v-col
                                    cols="10"
                                    class="mt-4"
                                >
                                    {{ $t('mapdb.Only filled in') }}
                                </v-col>
                                <v-col
                                    cols="2"
                                    class="d-flex justify-end"
                                >
                                    <v-switch
                                        v-model="selectShowInfo"
                                        hide-details
                                        dense
                                        class="mr-n2"
                                        @change="onSelectShowInfo"
                                    />
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                    <v-divider class="mt-3 mb-2" />
                    <v-row align-content="center">
                        <v-col
                            cols="12"
                            align-self="center"
                        >
                            <v-row align-content="center">
                                <v-col
                                    cols="9"
                                    class="mt-2"
                                >
                                    {{ $t('mapdb.Load') + ': ' }}
                                </v-col>
                                <v-col
                                    cols="3"
                                    class="d-flex justify-end"
                                >
                                    <v-select
                                        :items="recordsOnPage.recordsSelect"
                                        :value="recordsOnPage.records"
                                        class="mr-n4"
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
                    <v-divider class="mt-2 mb-5" />
                </v-col>
                <v-col>
                    <gwtk-mapdb-settings
                        v-if="showInfoSettings && !onMapObjectSelected"
                        :fields-list="fieldsList"
                        :set-state="setState"
                        :on-click-back="onClickBack"
                        name="showInfoSettings"
                        :selected-fast-search-filter="newObjectInfo"
                    />
                </v-col>
            </v-row>
        </div>
    </gwtk-task-bottom-container-item>
</template>
<script src="./GwtkMapdbWidget.ts" />
<style scoped>
.main-container {
    height: calc(100% - 120px);
    overflow-y: auto;
    overflow-x: hidden;
}

.element-container {
    overflow-y: auto;
    overflow-x: hidden;
}

.showInfo-container {
    height: calc(100% - 68px);
    overflow-y: auto;
    overflow-x: hidden;
}

.gwtk-page-toolbar.v-sheet {
    cursor: pointer;
}
</style>