<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Semantics')"
        :extra-head-data="filtersSemanticsExtraHeadData"
    >
        <v-row class="pa-2">
            <v-switch
                dense
                class="pa-0 ma-0"
                @change="() => {onlyFilled = !onlyFilled}"
            />
            {{ $t('phrases.Filled only') }}
        </v-row>
        <v-text-field
            v-model="textSearch"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
            clearable
        >
            <template #label>
                {{ $t('phrases.Search') }}
            </template>
        </v-text-field>
        <br>
        <v-sheet
            v-for="(item,index) in filterManager.semanticFilters"
            v-show="item.checkContextSearch(textSearch) && checkShowOnlyFilled(item)"
            :key="index"
        >
            <gwtk-expansion-panel
                :title="item.semanticName"
                :extra-head-data="item.layerNames"
                theme="clean"
                :is-checked-type="item.selected"
            >
                <div>
                    <v-row v-if="item.isRangeType" style="padding: 12px 0;">
                        <v-col cols="5" style="padding: 0">
                            <v-text-field
                                v-model="item.semanticSearchValue[0]"
                                class="mx-3"
                                type="number"
                                style="padding: 0"
                                hide-details="auto"
                                dense
                            />
                        </v-col>
                        <v-col cols="2" class="justify-center" style="padding: 12px 0">
                            {{ $t('phrases.to') }}
                        </v-col>
                        <v-col cols="5" style="padding: 0">
                            <v-text-field
                                v-model="item.semanticSearchValue[1]"
                                class="mx-3"
                                type="number"
                                style="padding: 0"
                                hide-details="auto"
                                dense
                            />
                        </v-col>
                    </v-row>
                    <v-sheet
                        v-for="(semanticTypeValue,semanticTypeIndex) in item.semanticTypeListValues"
                        v-else-if="item.isListType"
                        :key="semanticTypeIndex"
                    >
                        <gwtk-checkbox
                            :value="item.semanticSearchValue.includes(semanticTypeIndex)"
                            :label="semanticTypeValue.text"
                            @input="(value)=>onCheckboxChanged(item,semanticTypeIndex,value)"
                        />
                    </v-sheet>
                    <v-text-field
                        v-else
                        v-model="item.semanticSearchValue[0]"
                        :hint="$t('phrases.Search conditions') + ' (*)'"
                        persistent-hint
                        style="padding: 0;"
                        :placeholder="item.semanticName"
                        persistent-placeholder
                    />
                </div>
            </gwtk-expansion-panel>
        </v-sheet>
    </gwtk-expansion-panel>
</template>

<script type="ts" src="./GwtkMapObjectFiltersSemantics.ts" />
