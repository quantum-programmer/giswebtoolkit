<template>
    <div class="pa-1 gwtk-main-container">
        <div v-if="!isParameterSettingMode" class="align-center">
            <span class="mr-2">{{ $t('userthematic.Parameter') }}</span>
            <v-select
                :items="buildParameterList"
                :value="buildParametersOptionsTemp.id"
                item-text="text"
                item-value="id"
                :disabled="!buildParameterList.length"
                dense
                flat
                hide-details
                outlined
                solo
                @change="changeParameter"
            />
        </div>
        <div class="pt-1 px-12 gwtk-chart-container align-self-center">
            <canvas ref="thematicChart" class="gwtk-chart-container" />
        </div>
        <div>
            {{ $t('userthematic.Description') }}
        </div>
        <div class="ma-1 gwtk-legend-container">
            <v-list>
                <gwtk-list-item
                    v-for="(item, index) in itemsLegend"
                    :key="index"
                    class="my-2"
                    @click="legendItemClick(index)"
                >
                    <v-row class="align-center">
                        <v-col cols="2">
                            <div
                                class="gwtk-select-color-field"
                                :style="'background-color: ' + item.iconLegend"
                            />
                        </v-col>
                        <v-col>
                            {{ item.text }}
                        </v-col>
                        <v-col cols="2">
                            <v-tooltip right>
                                <template #activator="{ on, attrs }">
                                    <v-btn
                                        v-bind="attrs"
                                        icon
                                        small
                                        v-on="on"
                                        @click="toggleGoToObjects(index)"
                                    >
                                        <v-icon>mdi-arrow-right</v-icon>
                                    </v-btn>
                                </template>
                                <span>{{ $t('userthematic.Range objects') }}</span>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                    <v-row class="mt-0 px-10 align-center">
                        <v-col>
                            <v-img
                                :src="item.icon.line"
                                class="gwtk-icon-size"
                            />
                        </v-col>
                        <v-col>
                            <v-img
                                :src="item.icon.square"
                                class="gwtk-icon-size"
                            />
                        </v-col>
                        <v-col>
                            <v-img
                                :src="item.icon.point"
                                class="gwtk-icon-size"
                            />
                        </v-col>
                    </v-row>
                </gwtk-list-item>
            </v-list>
        </div>
    </div>
</template>

<script src="./GwtkChartThematic.ts" type="ts" />

<style scoped>
    .gwtk-main-container {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        overflow-x: hidden;
        overflow-y: auto;
        height: calc(100% - 2em);
    }

    .gwtk-legend-container {
        min-height: 128px;
        overflow-y: auto;
    }

    .gwtk-select-color-field {
        height: 1.5em;
        min-width: 1.5em;
        max-width: 1.5em;
        border-radius: .25em;
    }

    .gwtk-chart-container {
        max-height: 250px;
        min-height: 250px;
        min-width: 250px;
    }

    .gwtk-icon-size {
        max-width: 32px;
    }
</style>