<template>
    <div style="height: 100%">
        <v-container class="pt-0">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Objects type') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :items="semanticSearchParams.objectsList"
                        :value="semanticSearchParams.selectedObject"
                        :placeholder="$t('phrases.Select map object')"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true, contentClass:'gwtk-search-by-semantic-select-object-type' }"
                        @change="selectObjectType"
                    />
                </v-col>
            </v-row>
        </v-container>
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
                        :value="semanticSearchParams.searchCondition"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="selectSearchCondition"
                    />
                </v-col>
            </v-row>
        </v-container>
        <v-container class="pt-0 gwtk-semantic-container">
            <v-card
                outlined
                class="gwtk-semantic-container-card"
            >
                <v-card-title class="text-body-2">
                    {{ $t('phrases.Semantics') }}
                </v-card-title>
                <v-divider />
                <v-row
                    v-if="semanticSearchParams.semanticsList.length"
                    dense
                    class="mx-2 mb-2"
                >
                    <v-text-field
                        v-model="textSearch"
                        prepend-inner-icon="mdi-magnify"
                        hide-details="auto"
                        clearable
                    >
                        <template #label>
                            {{ $t('searchbysemantic.List filter') }}
                        </template>
                    </v-text-field>
                </v-row>
                <v-row dense class="mx-2">
                    <v-switch
                        dense
                        :disabled="filledSemanticList.length===0 && !semanticSearchParams.onlyFilled"
                        class="py-0 my-0"
                        @change="onlyFilledToggle"
                    />
                    {{ $t('searchbysemantic.Show filled only') }}
                </v-row>
                <div class="gwtk-semantic-list">
                    <v-container
                        v-for="(item,index) in semanticSearchParams.semanticsList"
                        v-show="item.checkContextSearch(textSearch) && checkShowOnlyFilled(item)"
                        :key="index"
                        class="pa-2"
                    >
                        <v-row dense>
                            <v-col>
                                {{ item.semanticName }}
                            </v-col>
                        </v-row>
                        <v-row
                            v-if="item.isListType"
                            dense
                        >
                            <v-col>
                                <v-select
                                    v-model="item.semanticSearchValue[0]"
                                    :items="item.semanticTypeListValues"
                                    hide-details
                                    dense
                                    clearable
                                    :menu-props="{ bottom: true, offsetY: true }"
                                />
                            </v-col>
                        </v-row>
                        <v-row
                            v-else-if="item.isRangeType"
                            dense
                            justify="space-around"
                            align="center"
                        >
                            <v-col cols="5">
                                <v-text-field
                                    v-model="item.semanticSearchValue[0]"
                                    class="pa-0 ma-0"
                                    type="number"
                                    :max="item.semanticMaxValue"
                                    :min="item.semanticMinValue"
                                    hide-details="auto"
                                    dense
                                />
                            </v-col>
                            <v-col
                                cols="2"
                                style="text-align: center;"
                            >
                                {{ $t('phrases.to') }}
                            </v-col>
                            <v-col cols="5">
                                <v-text-field
                                    v-model="item.semanticSearchValue[1]"
                                    class="pa-0 ma-0"
                                    type="number"
                                    :max="item.semanticMaxValue"
                                    :min="item.semanticMinValue"
                                    hide-details="auto"
                                    dense
                                />
                            </v-col>
                        </v-row>
                        <v-row
                            v-else
                            dense
                        >
                            <v-col>
                                <v-text-field
                                    v-model="item.semanticSearchValue[0]"
                                    :hint="$t('phrases.Search conditions') + ' (*)'"
                                    persistent-hint
                                    class="pa-0 ma-0"
                                    dense
                                    clearable
                                />
                            </v-col>
                        </v-row>
                    </v-container>
                </div>
            </v-card>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkSearchBySemantics.ts" />

<style scoped>
    .gwtk-semantic-container {
        height: calc(100% - 170px);
        min-height: 248px;
    }

    .gwtk-semantic-container-card {
        height: 100%;
    }

    .gwtk-semantic-list {
        max-height: calc(100% - 150px);
        overflow: auto;
        overflow-x: hidden;
    }
</style>

