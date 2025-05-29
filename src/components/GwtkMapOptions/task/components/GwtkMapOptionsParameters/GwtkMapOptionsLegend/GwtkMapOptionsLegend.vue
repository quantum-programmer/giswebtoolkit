<template>
    <gwtk-expansion-panel :title="$t('mapoptions.Legend formation')">
        <v-container class="pa-0">
            <v-checkbox
                :input-value="mapLegend.withMapExtent"
                :label="$t('mapoptions.With map extent')"
                @change="toggleMapExtentCheckbox"
            />
        </v-container>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsLegend.ts" />