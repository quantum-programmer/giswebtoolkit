<template>
    <v-container class="gwtk-main-container mb-4">
        <v-container class="mb-10">
            <v-row>
                <v-col>
                    <v-row :class="!isDistanceTypeOfSearch?'mb-6':'mb-3'">
                        <v-select
                            :value="firstSearchItemId"
                            :items="searchFirstItemGroupList"
                            item-value="id"
                            item-text="name"
                            dense
                            flat
                            hide-details
                            :no-data-text="$t('featuresamples.No lists found')"
                            :label="$t('featuresamples.First list')"
                            outlined
                            :disabled="searchProgress!==null"
                            @change="setFirstSearchItemId"
                        />
                    </v-row>
                    <v-row
                        v-if="isCrossTypeOfSearch"
                        class="mb-6"
                    >
                        <v-select
                            :value="selectedOperators"
                            :items="searchOperatorList"
                            :label="$t('featuresamples.Relation')"
                            outlined
                            multiple
                            hide-details
                            :menu-props="{ bottom: true, offsetY: true }"
                            :disabled="searchProgress!==null"
                            @change="setSelectedOperators"
                        >
                            <template #selection="{ item, index }">
                                <v-chip
                                    v-if="index < 3"
                                    close
                                    @click:close="removeOperator(item.value)"
                                >
                                    {{ item.text }}
                                </v-chip>
                                <span
                                    v-if="index === 3"
                                    class="grey--text text-caption"
                                >
                                    {{ `(+${selectedOperators.length - 3} ${$t('featuresamples.more')})` }}
                                </span>
                            </template>
                        </v-select>
                    </v-row>
                    <v-row
                        v-else-if="isDistanceTypeOfSearch"
                        class="mb-6"
                    >
                        <v-col class="text-subtitle-2 pa-0 mb-2">
                            {{ $t('featuresamples.At a distance') }}
                        </v-col>
                        <v-row
                            justify="space-between"
                            dense
                        >
                            <v-col
                                cols="3"
                                class="gwtk-feature-sample-search-distance-params"
                            >
                                <v-select
                                    dense
                                    :value="conditionOperatorId"
                                    :items="conditionOperatorList"
                                    item-value="value"
                                    item-text="text"
                                    hide-details
                                    outlined
                                    :label="$t('phrases.Condition')"
                                    @change="setConditionOperatorId"
                                />
                            </v-col>
                            <v-col
                                cols="4"
                                class="gwtk-feature-sample-search-distance-params"
                            >
                                <v-text-field
                                    :value="distanceValue"
                                    type="number"
                                    :label="$t('phrases.Value')"
                                    hide-spin-buttons
                                    hide-details
                                    outlined
                                    @change="setDistanceValue"
                                />
                            </v-col>
                            <v-col
                                cols="3"
                                class="gwtk-feature-sample-search-distance-params"
                            >
                                <v-select
                                    dense
                                    hide-details
                                    :label="$t('phrases.Units')"
                                    :value="searchLengthUnit"
                                    :items="lengthUnitList"
                                    outlined
                                    :menu-props="{ bottom: true, offsetY: true }"
                                    @change="setSearchLengthUnit"
                                >
                                    <template #selection="{ item }">
                                        <div class="v-select__selection v-select__selection--comma">
                                            {{ getUnitText(item) }}
                                        </div>
                                    </template>
                                    <template #item="{ item }">
                                        <div class="v-list-item__content">
                                            <div class="v-list-item__title">
                                                {{ getUnitText(item) }}
                                            </div>
                                        </div>
                                    </template>
                                </v-select>
                            </v-col>
                        </v-row>
                    </v-row>
                    <v-row class="mb-3">
                        <v-select
                            :value="secondSearchItemId"
                            :items="searchSecondItemGroupList"
                            item-value="id"
                            item-text="name"
                            dense
                            flat
                            hide-details
                            :no-data-text="$t('featuresamples.No lists found')"
                            :label="$t('featuresamples.Second list')"
                            outlined
                            :disabled="searchProgress!==null"
                            @change="setSecondSearchItemId"
                        />
                    </v-row>
                    <v-row justify="end">
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    class="gwtk-operator-button"
                                    clean
                                    :selected="isCrossTypeOfSearch"
                                    icon="crossing-icon"
                                    v-on="on"
                                    @click="setCrossingOperator"
                                />
                            </template>
                            <div>{{ $t('featuresamples.Search crossing') }}</div>
                        </v-tooltip>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    class="gwtk-operator-button ml-3"
                                    clean
                                    :selected="isDistanceTypeOfSearch"
                                    icon="distance-icon"
                                    v-on="on"
                                    @click="setSearchByDistance"
                                />
                            </template>
                            <div>{{ $t('featuresamples.Search by distance') }}</div>
                        </v-tooltip>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    class="gwtk-operator-button ml-3"
                                    clean
                                    :selected="isStartTypeOfSearch"
                                    icon="starting-icon"
                                    v-on="on"
                                    @click="setSearchByStart"
                                />
                            </template>
                            <div>{{ $t('featuresamples.Search starting') }}</div>
                        </v-tooltip>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    class="gwtk-operator-button ml-3"
                                    clean
                                    :selected="isEndTypeOfSearch"
                                    icon="ending-icon"
                                    v-on="on"
                                    @click="setSearchByEnd"
                                />
                            </template>
                            <div>{{ $t('featuresamples.Search ending') }}</div>
                        </v-tooltip>
                    </v-row>
                </v-col>
            </v-row>
        </v-container>
        <v-row>
            <v-col class="d-flex justify-center">
                <gwtk-button
                    v-if="searchProgress===null"
                    primary
                    width-available
                    :title="$t('phrases.Execute')"
                    :disabled="!enabled"
                    @click="runSearch"
                />
                <gwtk-button
                    v-else
                    secondary
                    :title="$t('phrases.Cancel')"
                    :disabled="!enabled"
                    @click="abortSearch"
                >
                    <v-progress-circular
                        class="mx-1"
                        :width="2"
                        indeterminate
                    >
                        {{ searchProgress }}
                    </v-progress-circular>
                </gwtk-button>
            </v-col>
        </v-row>
        <v-row
            no-gutters
            class="mt-6"
        >
            <v-divider />
        </v-row>
        <template v-if="searchResult">
            <v-row>
                <v-col>{{ $t('phrases.Result') }}</v-col>
            </v-row>
            <template v-if="searchResult.totalObjectsCount > 0">
                <v-row>
                    <gwtk-list-item
                        icon="map"
                        :icon-size="24"
                        bordered
                        class="mb-4"
                    >
                        <v-text-field
                            :value="searchResult.layer.alias"
                            @change="changeLayerName"
                        />
                        <template #right-slot>
                            <gwtk-icon-button
                                :icon="searchResult.layer.visible? 'visibility-on':'visibility-off'"
                                clean
                                :icon-color="!searchResult.layer.visible?' var(--v-primary-lighten1)':' var(--v-primary-base)'"
                                :icon-size="18"
                                :ripple="false"
                                @click.stop="toggleLayerVisibility(searchResult.layer.xId)"
                            />
                            <gwtk-icon-button
                                icon="mdi-download"
                                :icon-size="16"
                                :ripple="false"
                                class="tooltip-icon-color"
                                @click.stop="downloadLayer(searchResult.layer.xId)"
                            />
                        </template>
                    </gwtk-list-item>
                    <gwtk-list-item
                        v-if="isCrossTypeOfSearch"
                        icon="file-csv"
                        :icon-size="24"
                        bordered
                    >
                        <v-text-field
                            :value="searchResult.file.fileName"
                            @change="changeCSVFileName"
                        />
                        <template #right-slot>
                            <gwtk-icon-button
                                v-if="!csvCreation"
                                icon="mdi-download"
                                :icon-size="16"
                                :ripple="false"
                                class="tooltip-icon-color"
                                @click.stop="downloadDocument()"
                            />
                            <v-progress-circular
                                v-else
                                class="ml-2 mr-3"
                                size="16"
                                :width="2"
                                indeterminate
                            />
                        </template>
                    </gwtk-list-item>
                </v-row>
                <v-row justify="center">
                    <v-col
                        cols="auto"
                        class="pr-2"
                    >
                        <gwtk-button
                            secondary
                            icon="mdi-plus"
                            :title="`${$t('featuresamples.Create list')} (${searchResult.totalObjectsCount})`"
                            @click="createGroup"
                        />
                    </v-col>
                </v-row>
            </template>
            <v-row v-else>
                <v-col>
                    {{ $t('featuresamples.There are no objects matching the search criteria') }}
                </v-col>
            </v-row>
        </template>
    </v-container>
</template>

<script lang="ts" src="./GwtkFeatureSamplesSearchWidget.ts" />

<style scoped>
.gwtk-main-container {
    height: 100%;
}

.v-item-group {
    column-count: 2;
}

.gwtk-operator-button {
    width: 4em;
    border-radius: var(--border-radius-xs);
    border: 1px solid var(--v-secondary-lighten5);
}

.theme--dark.gwtk-operator-button {
    background-color: var(--v-secondary-darken2);
}
::v-deep .v-text-field--outlined > .v-input__control {
    height: 100%;
}
::v-deep .v-text-field--outlined > .v-input__control > .v-input__slot {
    min-height: var(
        --text-field-filled-full-width-outlined-single-line-slot-min-height
    );
    height: inherit;
}
.v-chip.v-size--default {
    height: var(--v-chip-height);
}

.gwtk-feature-sample-search-distance-params {
    display: flex;
    align-items: stretch;
}
</style>
