<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        class="gwtk-search-by-name"
    >
        <div
            v-if="!openHistory"
            class="outer-container"
        >
            <v-container class="pa-5 gwtk-main-container">
                <v-row dense>
                    <v-col align-self="center">
                        <v-textarea
                            class="gwtk-test-searchbyname-textfield"
                            rows="5"
                            :label="$t('phrases.Search')"
                            :value="searchText"
                            outlined
                            dense
                            max-height="10"
                            hide-details
                            @input="onInput"
                        />
                    </v-col>
                    <v-col
                        cols="auto"
                        class="mt-3 ml-2"
                    >
                        <v-row>
                            <v-tooltip right>
                                <template #activator="{ on, attrs }">
                                    <gwtk-button
                                        secondary
                                        :selected="false"
                                        :disabled="!searchText"
                                        icon-size="18"
                                        icon="mdi-close"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="onInput('')"
                                    />
                                </template>
                                <span>{{ $t('phrases.Clear') }}</span>
                            </v-tooltip>
                        </v-row>
                        <v-row class="mt-6">
                            <v-tooltip right>
                                <template #activator="{ on, attrs }">
                                    <gwtk-button
                                        :disabled="searchHistory.length === 0"
                                        secondary
                                        :selected="false"
                                        icon="search_history"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="onOpenHistory"
                                    />
                                </template>
                                <span>{{ $t('phrases.Search history') }}</span>
                            </v-tooltip>
                        </v-row>
                    </v-col>
                </v-row>
                <v-row class="mt-0">
                    <v-divider class="my-3" />
                </v-row>
                <v-container class="pa-0">
                    <v-autocomplete
                        ref="autocompleteMap"
                        :items="layers"
                        item-value="xId"
                        item-text="text"
                        :value="layerInputValue"
                        :label="$t('searchbyname.Map')"
                        :menu-props="{contentClass: 'gwtk-search-by-name-map-list'}"
                        outlined
                        hide-no-data
                        dense
                        class="mt-3 gwtk-test-searchbyname-selectlayer"
                        @change="setMap"
                        @blur="updateEmptyMapSelector"
                    >
                        <template #item="{ item }">
                            <span>
                                {{ item.text + ' (' + item.semanticName + ')' }}
                            </span>
                        </template>
                    </v-autocomplete>
                    <v-autocomplete
                        ref="autocompleteSemantic"
                        :items="semantics"
                        item-value="shortname"
                        item-text="name"
                        :value="semanticShortName"
                        :label="$t('searchbyname.Semantic')"
                        outlined
                        hide-no-data
                        dense
                        :loading="semantics.length === 0 && currentLayerXId"
                        :disabled="semantics.length === 0"
                        class="mt-n2 gwtk-test-searchbyname-selectsemantic"
                        @change="setSearchSemantic"
                        @blur="updateEmptySemanticSelector"
                    />
                    <v-row>
                        <v-divider class="my-1 mt-1 mb-0" />
                    </v-row>
                    <v-row
                        justify="space-between"
                        align-content="center"
                    >
                        <v-col>
                            <gwtk-checkbox
                                class="gwtk-test-searchbyname-byallmaps"
                                :value="checkedAllLayer"
                                :label="$t('phrases.Search across all maps')"
                                @change="selectSearchByAll"
                            />
                            <gwtk-checkbox
                                class="mt-4 gwtk-test-searchbyname-visibleonly"
                                :value="visibleOnCurrentScale"
                                :label="$t('phrases.Visible only')"
                                @click="changeVisibleOnCurrentScale"
                            />
                            <gwtk-checkbox
                                class="mt-4 gwtk-test-searchbyname-complatematch"
                                :value="exact"
                                :label="$t('searchbyname.Complate match')"
                                @change="selectExact"
                            />
                        </v-col>
                    </v-row>
                </v-container>
            </v-container>
            <v-row no-gutters>
                <v-spacer />
                <gwtk-button
                    :disabled="!searchText"
                    primary
                    class="gwtk-test-searchbyname-searchbutton"
                    width="45%"
                    :title="$t('phrases.Search')"
                    @click="search()"
                />
                <v-spacer />
                <gwtk-button
                    secondary
                    width="45%"
                    :title="$t('phrases.Reset all')"
                    @click="resetAll()"
                />
                <v-spacer />
            </v-row>
            <v-overlay
                :value="searchProgressBar"
                :absolute="searchProgressBar"
                z-index="100"
            >
                <v-row
                    no-gutters
                    dense
                    align="center"
                    justify="center"
                >
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
        </div>
        <gwtk-search-by-name-search-history
            v-else
            :set-state="setState"
            :search-history="searchHistory"
        />
    </gwtk-task-container-item>
</template>

<script src="./GwtkSearchByNameWiget.ts" />

<style scoped>
.gwtk-main-container {
    height: calc(100% - 36px);
    overflow-x: hidden;
    overflow-y: auto;
}

.outer-container {
    overflow-y: hidden;
    height: 100%;
}

.gwtk-search-by-name
    .gwtk-main-container
    .v-btn:not(.v-btn--round).v-size--default {
    height: var(--v-btn-height--small);
    padding-right: 0.25rem !important;
    padding-left: 0.25rem !important;
    padding-top: 0.25rem !important;
    padding-bottom: 0.25rem !important;
}
</style>
