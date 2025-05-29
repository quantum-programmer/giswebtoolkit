<template>
    <div>
        <div
            class="gwtk-map-objects-filter-list"
        >
            <v-expansion-panels multiple :class="isReducedSizeInterface?'gwtk-map-objects-filter-list-reduced':''">
                <gwtk-map-object-filters-types
                    :filter-manager="filterManager"
                />
                <gwtk-map-object-filters-objects
                    :filter-manager="filterManager"
                />
                <gwtk-map-object-filters-localizations
                    :filter-manager="filterManager"
                />
                <gwtk-map-object-filters-semantics
                    :filter-manager="filterManager"
                />
            </v-expansion-panels>
        </div>
        <v-layout
            justify-center
            class="py-3 gwtk-filter-layout"
        >
            <v-spacer />
            <gwtk-badge
                :count="filterManager.totalSelectedFiltersNumber-filterManager.appliedFilterItems.length"
            >
                <gwtk-button
                    primary
                    :title="$t('phrases.Apply')"
                    @click="filterApply"
                />
            </gwtk-badge>
            <v-spacer />
            <gwtk-button
                secondary
                :title="$t('phrases.Clear')"
                :disabled="filterManager.appliedFilterItems.length===0&&foundObjectsNumber!==0"
                @click="clearSelectedFiltersTypes"
            />
            <v-spacer />
        </v-layout>
    </div>
</template>

<script lang="ts" src="./GwtkMapObjectFilters.ts" />

<style scoped>
    .gwtk-filter-layout {
        position: absolute;
        bottom: 0;
        width: 100%;
    }

    .gwtk-map-objects-filter-list {
        overflow-y: auto;
        position: absolute;
        top: 0;
        bottom: 68px;
    }
    ::v-deep .gwtk-map-objects-filter-list-reduced .gwtk-checkbox-slot div {
        padding-top: var(--space-xs) ;
        padding-bottom: var(--space-xs) ;
    }
    @media (max-width: 600px) {

        .gwtk-map-objects-filter-list {
            max-height: 25em;
            overflow-y: auto
        }

    }
</style>