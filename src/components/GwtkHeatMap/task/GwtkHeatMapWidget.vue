<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
    >
        <v-container v-if="mapLayersWithLegendDescriptions.length===0">
            {{ errorMessage }}
        </v-container>
        <v-container v-else>
            <v-row>
                <v-col>
                    {{ $t('phrases.Layer') }}
                    <v-select
                        :value="selectedMapLayerId"
                        :items="mapLayersWithLegendDescriptions"
                        item-text="layerAlias"
                        item-value="LayerName"
                        dense
                        flat
                        hide-details
                        outlined
                        solo
                        class="gwtk-test-heatmap-selectLayer"
                        :placeholder="$t( 'phrases.Select layer' )"
                        @change="onLayerChange"
                    />
                </v-col>
            </v-row>
            <v-row class="my-2">
                <v-col>
                    {{ $t( 'phrases.Map name' ) }}
                    <v-text-field
                        v-model="heatMapName"
                        dense
                        hide-details
                        required
                        clearable
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <gwtk-button
                        primary
                        class="gwtk-test-heatmap-buildButton"
                        width-available
                        :title="$t('phrases.Build')"
                        :disabled="!heatMapName"
                        @click="buildMap"
                    />
                </v-col>
            </v-row>
        </v-container>

        <v-overlay
            :value="buildMapProgressBar"
            :absolute="buildMapProgressBar"
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    :active="buildMapProgressBar"
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        name="close-icon"
                        @click="cancelRequest"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>

<script src="./GwtkHeatMapWidget.ts" />