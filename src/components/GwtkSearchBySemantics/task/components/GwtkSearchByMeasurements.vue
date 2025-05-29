<template>
    <div style="height: 100%">
        <v-container class="pt-0">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Search conditions') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :items="searchConditionList"
                        :value="measurementSearchParams.searchCondition"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="selectSearchCondition"
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <gwtk-checkbox
                        class="gwtk-test-searchbyname-byallmaps"
                        :value="measurementSearchParams.byAllLayersFlag"
                        :label="$t('phrases.Search across all maps')"
                        @change="selectSearchByAll"
                    />
                </v-col>
            </v-row>
        </v-container>
        <v-container class="pt-0 overflow-y-auto overflow-x-hidden">
            <template v-for="(selectedItem, index) in measurementSearchParams.selectedSearchMeasurementList">
                <v-sheet
                    :key="index"
                    elevation="0"
                    outlined
                    rounded
                    class="mb-2"
                >
                    <v-row
                        dense
                        justify="center"
                        align-content="center"
                        class="my-1 mx-0"
                    >
                        <v-col
                            cols="auto"
                            class="font-weight-black"
                        >
                            {{ selectedItem.text }}
                        </v-col>
                    </v-row>
                    <v-row
                        dense
                        class="my-1 mx-0"
                    >
                        <v-col cols="auto" class="px-1">
                            <v-select
                                :value="selectedItem.searchUnitsList.selected"
                                :items="selectedItem.searchUnitsList.unitsList"
                                :label="$t('phrases.Units')"
                                dense
                                outlined
                                hide-details
                                style="width: 105px;"
                                :menu-props="{ bottom: true, offsetY: true }"
                                @change="(value) => setSelectedSearchMeasurementUnit(selectedItem, value)"
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
                        <v-spacer />
                        <v-col cols="auto" class="px-1 pt-3">
                            <gwtk-checkbox
                                :value="isRangeOperator(selectedItem)"
                                :label="$t('searchbysemantic.Range')"
                                @change="(value) => setRangeOperator(selectedItem, value)"
                            />
                        </v-col>
                        <v-spacer />
                        <v-col cols="auto" class="px-1">
                            <gwtk-button
                                secondary
                                icon="trash-can"
                                :icon-size="20"
                                :title="$t('phrases.Delete') "
                                class="px-2"
                                @click="deleteSelectedSearchMeasurement(selectedItem)"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        dense
                        class="my-1 mx-0"
                    >
                        <v-col cols="auto" class="px-1">
                            <v-select
                                :value="selectedItem.searchOperatorsList.selected"
                                :items="selectedItem.searchOperatorsList.operatorsList"
                                :label="$t('searchbysemantic.Condition')"
                                :disabled="isRangeOperator(selectedItem)"
                                dense
                                outlined
                                hide-details
                                style="width: 105px;"
                                :menu-props="{ bottom: true, offsetY: true }"
                                @change="(value) => setSelectedSearchMeasurementOperator(selectedItem, value)"
                            />
                        </v-col>
                        <v-col class="px-1">
                            <v-text-field
                                :value="selectedItem.searchValue[0]"
                                class="pa-0 ma-0"
                                type="number"
                                hide-details="auto"
                                dense
                                outlined
                                :min="selectedItem.value === 'HEIGHT' ? '' : 0"
                                @input="(value)=>updateFirstValue(selectedItem, value)"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="isRangeOperator(selectedItem)"
                        dense
                        class="my-1 mx-0"
                    >
                        <v-col cols="auto" class="px-1">
                            <v-select
                                :value="'<='"
                                :items="selectedItem.searchOperatorsList.operatorsList"
                                :label="$t('searchbysemantic.Condition')"
                                :disabled="isRangeOperator(selectedItem)"
                                dense
                                outlined
                                hide-details
                                style="width: 105px;"
                                :menu-props="{ bottom: true, offsetY: true }"
                                @change="(value) => setSelectedSearchMeasurementOperator(selectedItem, value)"
                            />
                        </v-col>
                        <v-col class="px-1">
                            <v-text-field
                                :value="selectedItem.searchValue[1]"
                                class="pa-0 ma-0"
                                type="number"
                                hide-details="auto"
                                dense
                                outlined
                                :min="selectedItem.value === 'HEIGHT' ? '' : 0"
                                @input="(value)=>updateSecondValue(selectedItem, value)"
                            />
                        </v-col>
                    </v-row>
                </v-sheet>
            </template>
            <v-row
                justify="center"
                align-content="center"
            >
                <v-col cols="auto" class="gwtk-menu-dropdown-arrow">
                    <gwtk-menu
                        icon="mdi-plus"
                        :disabled="disabled"
                        max-height="250"
                        :title="$t('phrases.Add New')"
                        is-dropdown
                    >
                        <v-list>
                            <v-list-item
                                v-for="(item, index) in availableMeasurementType"
                                :key="index"
                                link
                                @click="addSelectedSearchMeasurement(item)"
                            >
                                <v-list-item-title>
                                    {{ item.text }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </gwtk-menu>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkSearchByMeasurements.ts" />
<style scoped>

::v-deep .gwtk-menu-dropdown-arrow .gwtk-button svg {
    margin-top: 0.25rem;
    width: 1rem!important;
    height: 1rem!important;
}

</style>
