<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Localization')"
        :extra-head-data="filtersLocalizationExtraHeadData"
    >
        <v-sheet
            v-for="(item,index) in filterManager.localizationFilters"
            :key="index"
        >
            <gwtk-checkbox
                :value="item.selected"
                @input="(value)=>onCheckboxChanged(item,value)"
            >
                <v-col
                    cols="11"
                >
                    {{ $t('phrases.' + item.name) }}
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

<script type="ts" src="./GwtkMapObjectFiltersLocalizations.ts" />