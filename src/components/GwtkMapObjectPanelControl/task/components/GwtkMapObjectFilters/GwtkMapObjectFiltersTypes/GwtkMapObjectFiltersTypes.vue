<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Objects type')"
        :extra-head-data="filtersTypesExtraHeadData"
    >
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
        <v-sheet
            v-for="(item,index) in filterManager.typeFilters"
            v-show="item.checkContextSearch(textSearch)"
            :key="index"
        >
            <gwtk-checkbox
                :value="item.selected"
                @input="(value)=>onCheckboxChanged(item,value)"
            >
                <v-col
                    cols="11"
                >
                    {{ item.name }}
                </v-col>
                <v-col align="right">
                    <span class="showcase-expansion-panel__form-amount">
                        {{ item.objectsNumber }}
                    </span>
                </v-col>
            </gwtk-checkbox>
        </v-sheet>
    </gwtk-expansion-panel>
</template>
<script lang="ts" src="./GwtkMapObjectFiltersTypes.ts" />