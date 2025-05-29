<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :options="{ title:$t('phrases.Area search') }"
        :min-height="40"
    >
        <div
            v-for="button in regimes"
            v-show="button.id !== 'gwtksearcharea.selectobjectaction' && button.id !== 'gwtksearcharea.selectlineaction'"
            :key="button.id"
            class="mx-2"
        >
            <gwtk-button
                clean
                :disabled="!button.enabled"
                :title="$t(button.options.title)"
                :icon="button.options.icon"
                align-content="left"
                width-available
                :selected="button.active && !isAdvancedSearch"
                class="my-2"
                @click="toggleRegime(button.id)"
            />
            <v-card v-if="button.id === 'gwtksearcharea.selectmapobjectaction' && button.active && !isAdvancedSearch" outlined>
                <v-card-text class="mt-n2 mb-n2">
                    {{ $t('phrases.Select map object') }}
                </v-card-text>
            </v-card>
            <v-sheet v-if="button.active&&modePanelDescriptions.length!==0 && !isAdvancedSearch" outlined rounded class="pa-2">
                <div
                    v-for="(modePanelDescription, modePanelDescriptionIndex) in modePanelDescriptions"
                    :key="modePanelDescriptionIndex"
                    :hidden="!modePanelDescription.visible"
                >
                    <div
                        v-if="modePanelDescription.title"
                        class="text-body-1"
                    >
                        {{ $t('phrases.' + modePanelDescription.title) }}
                    </div>
                    <div class="gwtk-actions-buttons pt-3">
                        <v-tooltip
                            v-for="modePanelButton in modePanelDescription.buttons"
                            :key="modePanelButton.id"
                            :disabled="!modePanelButton.enabled||!modePanelButton.options.title"
                            bottom
                        >
                            <template #activator="{ on }">
                                <gwtk-icon-button
                                    v-if="modePanelButton.options.theme!=='primary'&&modePanelButton.options.theme!=='secondary'"
                                    :disabled="!modePanelButton.enabled"
                                    :icon="modePanelButton.options.icon"
                                    :selected="modePanelButton.active"
                                    :icon-size="32"
                                    :title="$t(modePanelButton.options.label)"
                                    width-available
                                    v-on="on"
                                    @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                />
                                <gwtk-button
                                    v-else
                                    :disabled="!modePanelButton.enabled"
                                    :icon="modePanelButton.options.icon"
                                    :selected="modePanelButton.active"
                                    :primary="modePanelButton.options.theme==='primary'"
                                    :secondary="modePanelButton.options.theme==='secondary'"
                                    :icon-size="32"
                                    :title="$t(modePanelButton.options.label)"
                                    width-available
                                    v-on="on"
                                    @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                />
                            </template>
                            <div>{{ $t(modePanelButton.options.title ) }}</div>
                        </v-tooltip>
                    </div>
                </div>
            </v-sheet>
        </div>
        <div class="mx-2">
            <gwtk-button
                clean
                :title="$t('phrases.Advanced search')"
                icon="mdi-magnify-expand"
                align-content="left"
                width-available
                class="my-2"
                :selected="isAdvancedSearch"
                @click="onSelectAdvancedSearch"
            />
            <v-card v-if="isAdvancedSearch" outlined>
                <v-card-text v-if="!mapObjectSelected" class="mt-n2 mb-n2">
                    <v-row>
                        <v-col 
                            v-for="button in SelectObjectTypeButtonList"
                            :key="button.id"
                        >
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-button
                                        class="ml-3"
                                        clean
                                        :icon="button.icon"
                                        :selected="button.id === selectObjectType"
                                        v-on="on"
                                        @click="setObjectType(button.id)"
                                    />
                                </template>
                                <div>{{ button.text }}</div>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                    <div v-if="selectObjectType === 3" class="mt-4" style="text-align: center;">
                        <v-divider class="mb-2" />
                        {{ $t('phrases.Select map object') }}
                    </div>
                    <div 
                        v-if="modePanelDescriptions.length && (selectObjectType === 1 || selectObjectType === 2) " 
                        class="mt-4"
                    >
                        <span 
                            v-for="button in modePanelDescriptions[0].buttons"
                            :key="button.id"
                        >
                            <gwtk-button
                                :disabled="!button.enabled"
                                :icon="button.options.icon"
                                :selected="button.active"
                                :primary="button.options.theme==='primary'"
                                :secondary="button.options.theme==='secondary'"
                                :icon-size="32"
                                :title="$t(button.options.label)"
                                width-available
                                @click="()=>setState(button.id,!button.active)"
                            />
                        </span>
                    </div>
                </v-card-text>
                <div v-else>
                    <v-row v-if="isCrossTypeOfSearch" class="ma-0">
                        <v-col>
                            <v-row>
                                <v-col class="text--disabled">
                                    {{ $t('searcharea.Selected object') }}
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col>
                                    <v-select
                                        :value="selectedSearchCrossOperators"
                                        :items="searchCrossOperators"
                                        :label="$t('searcharea.Relation')"
                                        outlined
                                        multiple
                                        hide-details="auto"
                                        clearable
                                        :menu-props="{ bottom: true, offsetY: true }"
                                        @change="setCrossingOperator"
                                    >
                                        <template #selection="{ item, index }">
                                            <v-chip
                                                v-if="index < 2"
                                                close
                                                small
                                                @click:close="removeCrossOperator(index)"
                                            >
                                                {{ item.text }}
                                            </v-chip>
                                            <span
                                                v-if="index === 2"
                                                class="grey--text text-caption"
                                            >
                                                {{ `(+${selectedSearchCrossOperators.length - 2} ${$t('searcharea.more')})` }}
                                            </span>
                                        </template>
                                    </v-select>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col class="text--disabled">
                                    {{ $t('searcharea.Objects of selected layers') }}
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                    <v-row 
                        v-else-if="isDistanceTypeOfSearch"  
                        class="ma-0"
                        justify="space-around"
                    >
                        <v-col cols="auto">
                            <v-text-field 
                                type="number"
                                :value="distanceSearch"
                                outlined
                                hide-details
                                :label="$t('phrases.Value')"
                                @input="inputDistanceSearch"
                            />
                        </v-col>
                        <v-col cols="5">
                            <v-select
                                :value="selectedUnitType"
                                :items="unitsList"
                                outlined
                                hide-details
                                :label="$t('phrases.Units')"
                                @change="selectUnitType"
                            />
                        </v-col>
                    </v-row>
                    <v-row  
                        justify="space-around" 
                        align="center" 
                        class="ma-0"
                    >
                        <v-col cols="auto">
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-button
                                        clean
                                        :selected="isCrossTypeOfSearch"
                                        icon="crossing-icon"
                                        v-on="on"
                                        @click="setSearchByCross"
                                    />
                                </template>
                                <div>{{ $t('searcharea.Search crossing') }}</div>
                            </v-tooltip>
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-button
                                        class="ml-3"
                                        clean
                                        :selected="isDistanceTypeOfSearch"
                                        icon="distance-icon"
                                        v-on="on"
                                        @click="setSearchByDistance"
                                    />
                                </template>
                                <div>{{ $t('searcharea.Search by distance') }}</div>
                            </v-tooltip>
                        </v-col>
                        <v-col cols="auto">
                            <gwtk-button
                                primary
                                icon="search"
                                width="150"
                                :disabled="checkDisabled || !selectedLayers.length"
                                :title="$t('phrases.Search')"
                                @click="startAdvancedSearch"
                            />
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-button
                                        class="ml-3"
                                        secondary
                                        :icon="'mdi-select'"
                                        v-on="on"
                                        @click="showActiveObject"
                                    />
                                </template>
                                <div>{{ $t('phrases.Display object') }}</div>
                            </v-tooltip>
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-button
                                        class="ml-3"
                                        secondary
                                        icon="mdi-close"
                                        v-on="on"
                                        @click="cancelSelectObject"
                                    />
                                </template>
                                <div>{{ $t('searcharea.Select another object') }}</div>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                </div>
                <div v-if="!selectedLayers.length" class="mt-4 mb-2" style="text-align: center;">
                    <v-divider class="mb-2" />
                    {{ $t('phrases.There are no available map layers to perform the operation') }}
                </div>
            </v-card>
        </div>
        <v-divider class="mt-3 mx-2" />
        <div v-if="!onlyMainServise">
            <v-row class="ma-0">
                <v-col>
                    <v-alert
                        outlined
                        type="warning"
                    >
                        <v-row>
                            {{ $t('searcharea.Only main service layers object search') }}
                        </v-row>
                    </v-alert>
                </v-col>
            </v-row>
            <v-divider class="mx-2" />
        </div>
        <div class="mx-2">
            <gwtk-button
                clean
                :title="$t('phrases.Options')"
                :selected="activeOptionsValue"
                icon="settings"
                align-content="left"
                width-available
                class="my-2 gwtk-svg-icon"
                @click="expandOptions"
            />
        </div>
        <v-sheet
            v-if="activeOptionsValue"
            outlined
            rounded
            class="pa-2 mx-2 gwtk-sheet"
        >
            <gwtk-checkbox
                :value="visibleFlag"
                :label="$t('phrases.Search only visible objects')"
                @change="visibleFlag = !visibleFlag"
            />
            <v-divider class="mt-2" />
            <v-card flat class="mt-1 gwtk-card">
                <v-data-table
                    v-model="selected"
                    :headers="headers"
                    :single-select="false"
                    :items="layerRows"
                    item-key="id"
                    class="table-row-style"
                    checkbox-color="primary"
                    show-select
                    :hide-default-footer="layerRows.length<=10"
                    :footer-props="{
                        showFirstLastPage: false,
                        itemsPerPageOptions:[10,15,20,-1],
                        itemsPerPageText:'',
                        itemsPerPageAllText: $t('phrases.All')
                    }"
                    :header-props="{ sortByText: '' }"
                />
            </v-card>
        </v-sheet>
        <v-overlay
            :value="searchProgressBar"
            :absolute="searchProgressBar"
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    :active="searchProgressBar"
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="closeOverlay"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkSearchAreaWidget.ts" />

<style scoped>
    .gwtk-actions-buttons {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }

    .gwtk-sheet {
        height: calc(100% - 224px);
    }

    .gwtk-card {
        overflow-x: hidden;
        overflow-y: auto;
        height: calc(100% - 40px);
    }

    .table-row-style {
        elevation: 0;
    }

</style>

<style>
    .theme--light > .table-row-style .v-data-table-header {
        background-color: var(--v-secondary-lighten5);
    }

    .theme--dark > .table-row-style .v-data-table-header {
        background-color: var(--v-secondary-base);
    }
</style>