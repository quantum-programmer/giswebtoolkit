<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Measurements')"
    >
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Fill color') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="measurements.fillColor"
                        outlined
                        dense
                        hide-details
                        readonly
                        @change="changeFillColor"
                    >
                        <template #append>
                            <v-menu
                                top
                                nudge-bottom="-30"
                                nudge-left="244"
                                :close-on-content-click="false"
                                z-index="999"
                            >
                                <template #activator="{ on }">
                                    <div
                                        :style="fillColorStyle"
                                        v-on="on"
                                    />
                                </template>
                                <v-card>
                                    <v-card-text class="pa-0">
                                        <v-color-picker
                                            v-model="measurements.fillColor"
                                            class="gwtk-test-color-picker-measurements-1"
                                            mode="hexa"
                                            hide-mode-switch
                                            width="278"
                                        />
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Stroke color') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="measurements.lineColor"
                        outlined
                        dense
                        hide-details
                        readonly
                        @change="changeLineColor"
                    >
                        <template #append>
                            <v-menu
                                top
                                nudge-bottom="-30"
                                nudge-left="244"
                                :close-on-content-click="false"
                                z-index="999"
                            >
                                <template #activator="{ on }">
                                    <div
                                        :style="lineColorStyle"
                                        v-on="on"
                                    />
                                </template>
                                <v-card>
                                    <v-card-text class="pa-0">
                                        <v-color-picker
                                            v-model="measurements.lineColor"
                                            class="gwtk-test-color-picker-measurements-2"
                                            mode="hexa"
                                            hide-mode-switch
                                            width="278"
                                        />
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset>
            <v-row>
                <v-col class="ml-1 mr-1">
                    {{ $t('phrases.Opacity') }}
                    <v-slider
                        :value="opacityValue"
                        :thumb-label="true"
                        :thumb-size="32"
                        min="0"
                        max="100"
                        hide-details
                        @change="changeOpacity"
                    >
                        <template #thumb-label="item">
                            {{ item.value }}%
                        </template>
                    </v-slider>
                </v-col>
            </v-row>
        </fieldset>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersMeasurements.ts" />