<template>
    <v-expansion-panels multiple class="gwtk-map-options-parameters">
        <gwtk-map-options-parameters-refresh-interval
            :set-state="setState"
            :refresh-interval="refreshInterval"
        />
        <gwtk-map-options-parameters-cursor-units
            :set-state="setState"
            :cursor-coordinate-params="cursorCoordinateParams"
        />
        <gwtk-map-options-parameters-units
            :set-state="setState"
            :units="units"
        />
        <gwtk-map-options-parameters-object-selection
            :set-state="setState"
            :object-selection="objectSelection"
        />
        <gwtk-map-options-parameters-object-search
            :set-state="setState"
            :object-search="objectSearch"
            :search-filter-settings="searchFilterSettings"
            :sort-types="sortTypes"
        />
        <gwtk-map-options-parameters-measurements
            :set-state="setState"
            :measurements="measurements"
        />
        <gwtk-map-options-parameters-theme
            :set-state="setState"
            :ui="ui"
        />
        <gwtk-map-options-legend
            :set-state="setState"
            :map-legend="mapLegend"
        />
        <gwtk-map-options-initial-extent
            :set-state="setState"
            :initial-extent="initialExtent"
        />
        <gwtk-map-options-map-log
            :set-state="setState"
            :map-log="mapLog"
        />
    </v-expansion-panels>
</template>

<script lang="ts" src="./GwtkMapOptionsParameters.ts" />

<style>
    /* Remove Arrows/Spinners */
    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    input[type=number] {
        -moz-appearance: textfield;
    }
</style>
