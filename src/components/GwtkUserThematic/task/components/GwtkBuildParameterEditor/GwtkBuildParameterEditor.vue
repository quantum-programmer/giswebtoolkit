<template>
    <div class="gwtk-main-container">
        <v-text-field
            class="my-2"
            :label="$t('userthematic.Parameter name')"
            :value="parameterName"
            outlined
            dense
            hide-details
            @change="changeParameterName"
        />
        <v-row class="align-center mt-2">
            <v-col>
                <v-text-field
                    :label="$t('userthematic.Gradations')"
                    :value="rangesCount"
                    type="number"
                    :min="1"
                    outlined
                    dense
                    hide-details
                    @input="updateRangesCount"
                />
            </v-col>
            <v-col cols="auto" class="gwtk-build-parameter-editor-button">
                <gwtk-button
                    secondary
                    :title="$t('userthematic.Update')"
                    @click="updateUserThematicRanges"
                />
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            secondary
                            class="mx-2"
                            icon="upload"
                            icon-size="18"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleExportUnit"
                        />
                    </template>
                    {{ $t('userthematic.Export parameters to file') }}
                </v-tooltip>
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            secondary
                            icon="download"
                            icon-size="18"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleImportUnit"
                        />
                    </template>
                    {{ $t('userthematic.Import parameters from file') }}
                </v-tooltip>
            </v-col>
        </v-row>
        <v-row dense class="align-center">
            <v-col>
                {{ $t('userthematic.Minimum') + ': ' }}
            </v-col>
            <v-col class="text-body-1 font-weight-bold">
                {{ minValue }}
            </v-col>
        </v-row>
        <v-row dense class="align-center">
            <v-col>
                {{ $t('userthematic.Maximum') + ': ' }}
            </v-col>
            <v-col class="text-body-1 font-weight-bold">
                {{ maxValue }}
            </v-col>
        </v-row>
        <v-row>
            <v-divider />
        </v-row>
        <div
            v-if="showParameterOptions"
            ref="rangeList"
            class="my-4 gwtk-user-thematic-parameter-options"
        >
            <v-expansion-panels
                :value="rangeIndex"
                class="gwtk-user-thematic-view-panel"
            >
                <v-list>
                    <gwtk-list-item
                        v-for="(item, index) in buildParametersOptionsTemp.userThematicRangeList"
                        :key="index"
                    >
                        <gwtk-expansion-panel
                            :title="$t('userthematic.From').toLowerCase() + ' ' + parseFloat(item.range.min).toFixed(fractionDigits) + ' '+ $t('userthematic.To').toLowerCase() + ' ' + parseFloat(item.range.max).toFixed(fractionDigits)"
                            :class="isReducedSizeInterface?'my-0':'my-2'"
                        >
                            <template #prefix>
                                <div class="mr-4">
                                    <v-col>
                                        <v-row class="py-1">
                                            <v-img
                                                :src="item.icons.line"
                                                class="gwtk-my-maps-icon border"
                                            />
                                        </v-row>
                                        <v-row class="py-1">
                                            <v-img
                                                :src="item.icons.polygon"
                                                class="gwtk-my-maps-icon border"
                                                contain
                                            />
                                        </v-row>
                                        <v-row class="py-1">
                                            <v-img
                                                :src="item.icons.marker.includes('data:image/png;base64,')? item.icons.marker : 'data:image/png;base64,' + item.icons.marker"
                                                contain
                                                class="gwtk-my-maps-icon border"
                                            />
                                        </v-row>
                                    </v-col>
                                </div>
                            </template>
                            <v-row
                                justify="space-between"
                                class="ma-0 text-caption"
                            >
                                <div class="gwtk-user-thematic-div">
                                    {{ $t('userthematic.Linear') }}
                                    <div
                                        class="gwtk-user-thematic-button-type"
                                        @click="toggleRangeLocaleType(index, 0)"
                                    >
                                        <v-img
                                            v-if="item.icons.line"
                                            class="gwtk-user-thematic-image-type"
                                            :src="item.icons.line"
                                        />
                                        <div
                                            v-else
                                            class="gwtk-user-thematic-div-type"
                                            :style="'background-color: ' + item.styles.line[0].stroke.stroke"
                                        />
                                    </div>
                                </div>
                                <div class="gwtk-user-thematic-div">
                                    {{ $t('userthematic.Areal') }}
                                    <div
                                        class="gwtk-user-thematic-button-type"
                                        @click="toggleRangeLocaleType(index, 1)"
                                    >
                                        <v-img
                                            v-if="item.icons.polygon"
                                            class="gwtk-user-thematic-image-type"
                                            :src="item.icons.polygon"
                                        />
                                        <div
                                            v-else
                                            class="gwtk-user-thematic-div-type"
                                            :style="getStyleButtonPolygon(index)"
                                        />
                                    </div>
                                </div>
                                <div class="gwtk-user-thematic-div">
                                    {{ $t('userthematic.Points') }}
                                    <div
                                        class="gwtk-user-thematic-button-type"
                                        @click="toggleRangeLocaleType(index, 2)"
                                    >
                                        <v-img
                                            v-if="item.icons.marker"
                                            class="gwtk-user-thematic-image-type"
                                            contain
                                            :src="item.icons.marker.includes('data:image/png;base64,')? item.icons.marker : 'data:image/png;base64,' + item.icons.marker"
                                        />
                                    </div>
                                </div>
                            </v-row>
                            <v-row class="mt-2">
                                <v-col cols="6">
                                    {{ $t('userthematic.From') }}
                                    <v-text-field
                                        :value="item.range.min"
                                        type="number"
                                        :min="0"
                                        outlined
                                        dense
                                        hide-details
                                        @input="value=>item.range.min= +value"
                                    />
                                </v-col>
                                <v-col>
                                    {{ $t('userthematic.To') }}
                                    <v-text-field
                                        :value="item.range.max"
                                        type="number"
                                        :min="0"
                                        outlined
                                        dense
                                        hide-details
                                        @input="value=>item.range.max= +value"
                                    />
                                </v-col>
                            </v-row>
                        </gwtk-expansion-panel>
                    </gwtk-list-item>
                </v-list>
            </v-expansion-panels>
        </div>
        <v-row class="mt-4">
            <v-col class="py-0">
                <gwtk-button
                    primary
                    :title="$t('userthematic.Add')"
                    width-available
                    @click="addBuildParameter"
                />
            </v-col>
            <v-col class="py-0">
                <gwtk-button
                    secondary
                    :title="$t('userthematic.Cancel')"
                    width-available
                    @click="cancelAddBuildParameter"
                />
            </v-col>
        </v-row>
    </div>
</template>

<script src="./GwtkBuildParameterEditor.ts" type="ts" />

<style scoped>
    .gwtk-main-container {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .gwtk-user-thematic-parameter-options {
        height: calc(100% - 262px);
        min-height: 196px;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .gwtk-user-thematic-view-panel {
        display: block;
    }

    .gwtk-my-maps-icon {
        max-width: 24px;
        max-height: 1em;
        margin-left: auto;
        margin-right: auto;
    }

    .gwtk-user-thematic-div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .gwtk-user-thematic-button-type {
        margin-top: 0.3em;
        width: 4.7em;
    }

    .gwtk-user-thematic-button-type:hover {
        cursor: pointer;
    }

    .gwtk-user-thematic-div-type {
        height: 3em;
        width: 100%;
    }

    .gwtk-user-thematic-image-type {
        height: var(--gwtk-user-thematic-image-type-height);
    }

    .gwtk-build-parameter-editor-button .v-btn:not(.v-btn--round).v-size--default {
        height: var(--v-btn-height--default);
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
        padding-top: var(--py-2) !important;
        padding-bottom: var(--py-2) !important;
    }
    ::v-deep .gwtk-user-thematic-view-panel .v-list-item__content {
        padding-top: var(--list-item-padding-top);
        padding-bottom: var(--list-item-padding-bottom);
    }

</style>