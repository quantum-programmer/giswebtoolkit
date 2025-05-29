<template>
    <v-container v-if="!showHistory" class="pt-0">
        <v-row dense>
            <v-col>
                {{ $t('phrases.Object number') }}
            </v-col>
        </v-row>
        <v-row dense>
            <v-col align-self="center">
                <v-text-field
                    :value="objectNumberSearchParams.inputValue"
                    outlined
                    dense
                    hide-details
                    type="number"
                    :min="0"
                    :disabled="disabled"
                    @input="changeObjectNumber"
                />
            </v-col>
            <v-col cols="auto" align-self="center">
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            :disabled="objectNumberSearchParams.searchHistory.length === 0"
                            class="ma-2 gwtk-test-searchbynumber-history"
                            secondary
                            :selected="false"
                            icon="search_history"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleHistory"
                        />
                    </template>
                    <span>{{ $t('phrases.Search history') }}</span>
                </v-tooltip>
            </v-col>
        </v-row>
        <v-row dense>
            <v-col>
                <gwtk-checkbox
                    class="gwtk-test-searchbynumber-byallmaps"
                    :value="objectNumberSearchParams.byAllLayersFlag"
                    :label="$t('phrases.Search across all maps')"
                    @change="selectSearchByAll"
                />
            </v-col>
        </v-row>
    </v-container>
    <gwtk-component-history
        v-else
        class="pt-0"
        :search-history="objectNumberSearchParams.searchHistory"
        @close="toggleHistory"
        @clear="clearSearchHistory"
        @select="selectHistory"
    />
</template>

<script lang="ts" src="./GwtkSearchByObjectNumber.ts" />

<style scoped>
.gwtk-search-by-semantic .gwtk-main-container .v-btn:not(.v-btn--round).v-size--default {
    height: var(--v-btn-height--small);
    padding-right: 0.25rem !important;
    padding-left: 0.25rem !important;
    padding-top: 0.25rem !important;
    padding-bottom: 0.25rem !important;
}
</style>