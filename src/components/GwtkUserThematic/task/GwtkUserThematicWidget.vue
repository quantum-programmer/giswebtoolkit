<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :min-height="540"
        :map-vue="mapVue"
    >
        <template v-if="serviceUrlList.length">
            <v-sheet class="mx-2" height="100%">
                <gwtk-tabs v-model="activeTabWidget">
                    <gwtk-tab :title="$t('userthematic.Data')" />
                    <gwtk-tab :title="$t('userthematic.Projects')" />
                </gwtk-tabs>
                <div class="gwtk-tab-container">
                    <v-tabs-items class="gwtk-full-height" :value="activeTabWidget">
                        <v-tab-item class="gwtk-full-height">
                            <template v-if="!showDiagram">
                                <v-container
                                    v-if="!isParameterSettingMode"
                                    class="gwtk-main-view"
                                >
                                    <v-row>
                                        <v-col>
                                            <span class="text-subtitle-1">
                                                {{ projectNamesList[projectSelectedIndex] }}
                                            </span>
                                        </v-col>
                                    </v-row>
                                    <v-row :dense="isReducedSizeInterface">
                                        <v-col class="py-1">
                                            {{ $t('userthematic.Server') }}
                                            <v-select
                                                :items="serviceUrlList"
                                                :value="activeServiceUrl"
                                                dense
                                                flat
                                                hide-details
                                                outlined
                                                solo
                                                @change="changeServiceUrl"
                                            />
                                        </v-col>
                                    </v-row>
                                    <v-row :dense="isReducedSizeInterface">
                                        <v-col class="py-1">
                                            {{ $t('userthematic.Layer') }}
                                            <v-select
                                                :items="layerList"
                                                item-text="alias"
                                                item-value="id"
                                                :value="currentLayer&&currentLayer.id"
                                                :disabled="!layerList.length"
                                                dense
                                                flat
                                                hide-details
                                                outlined
                                                solo
                                                @change="changeLayer"
                                            />
                                        </v-col>
                                    </v-row>
                                    <v-row :dense="isReducedSizeInterface">
                                        <v-col class="py-1">
                                            {{ $t('userthematic.Virtual folder') }}
                                            <v-select
                                                :items="virtualFolderList"
                                                :value="virtualFolderList[currentVirtualFolderIndex]"
                                                :item-text="'alias'"
                                                :item-value="'folder'"
                                                dense
                                                flat
                                                hide-details
                                                outlined
                                                solo
                                                @change="changeVirtualFolder"
                                            />
                                        </v-col>
                                    </v-row>
                                    <v-row class="gwtk-user-thematic-buttons" :dense="isReducedSizeInterface">
                                        <v-col class="py-1">
                                            {{ $t('userthematic.Data source') }}
                                            <v-spacer />
                                            <v-btn-toggle
                                                v-model="currentSource"
                                                mandatory
                                                color="primary"
                                            >
                                                <gwtk-button
                                                    :value="0"
                                                    secondary
                                                    width-available
                                                    :title="$t('userthematic.File')"
                                                />
                                                <gwtk-button
                                                    :value="1"
                                                    secondary
                                                    width-available
                                                    :title="$t('userthematic.Layer')"
                                                />
                                            </v-btn-toggle>
                                        </v-col>
                                    </v-row>
                                    <div class="my-4 py-2" :class="isReducedSizeInterface?'gwtk-parameters-list-reduce':'gwtk-parameters-list'">
                                        <template v-if="cartogramSource===0">
                                            <v-row>
                                                <v-col v-if="!fileName" cols="8" class="py-1 pr-4">
                                                    <gwtk-button
                                                        primary
                                                        width-available
                                                        :title="$t('userthematic.Upload')"
                                                        @click="openFile"
                                                    />
                                                </v-col>
                                                <v-col v-else class="py-2">
                                                    <v-chip
                                                        class="gwtk-user-thematic-filename"
                                                        close
                                                        @click:close="closeFile"
                                                    >
                                                        <v-icon left>
                                                            mdi-file-table-outline
                                                        </v-icon>
                                                        {{ fileName }}
                                                    </v-chip>
                                                </v-col>
                                                <!--                            <v-col v-else style="color: var(&#45;&#45;v-error-base); word-break: break-word">-->
                                                <!--                                <template v-if="needToOpenCsvName">-->
                                                <!--                                    {{ $t('userthematic.Upload file') + ' ' + needToOpenCsvName }}-->
                                                <!--                                </template>-->
                                                <!--                                <template v-else>-->
                                                <!--                                    {{ $t('userthematic.Upload data file') }}-->
                                                <!--                                </template>-->
                                                <!--                            </v-col>-->
                                            </v-row>
                                            <template v-if="fileName">
                                                <v-row>
                                                    <v-col class="py-2">
                                                        <gwtk-checkbox
                                                            :value="hasTitleLine"
                                                            :label="$t('userthematic.With a header record')"
                                                            @change="changeHasTitleLine"
                                                        />
                                                    </v-col>
                                                </v-row>
                                                <v-row>
                                                    <v-col class="py-2">
                                                        {{
                                                            $t('userthematic.Delimiter') + delimitersColsSum
                                                        }}
                                                        <v-select
                                                            :items="delimitersNames"
                                                            :value="delimitersNames[currentDelimiterId]"
                                                            dense
                                                            flat
                                                            hide-details
                                                            outlined
                                                            solo
                                                            item-text="name"
                                                            item-value="id"
                                                            @change="changeDelimiter"
                                                        />
                                                    </v-col>
                                                </v-row>
                                                <v-row>
                                                    <v-col class="py-2">
                                                        {{
                                                            `${$t('userthematic.Link semantic')} (${$t('userthematic.Layer').toLowerCase()})`
                                                        }}
                                                        <v-text-field
                                                            :value="semLinkName"
                                                            readonly
                                                            outlined
                                                            dense
                                                            hide-details
                                                        />
                                                    </v-col>
                                                </v-row>
                                                <v-row>
                                                    <v-col class="py-2">
                                                        {{
                                                            `${$t('userthematic.Link semantic')} (${$t('userthematic.Data').toLowerCase()})`
                                                        }}
                                                        <v-select
                                                            :items="semanticValueCol"
                                                            item-text="name"
                                                            item-value="index"
                                                            :value="semanticValueCol[numberConnectedField]"
                                                            :disabled="!semanticValueCol.length"
                                                            dense
                                                            flat
                                                            hide-details
                                                            outlined
                                                            solo
                                                            @change="changeSemanticDataLinkColumn"
                                                        />
                                                    </v-col>
                                                </v-row>
                                            </template>
                                        </template>
                                        <!--                        <template-->
                                        <!--                            v-if="(cartogramSource===0 && fileName!=='')|| cartogramSource===1"-->
                                        <!--                        >-->
                                        <!--                                    <v-row >-->
                                        <!--                                        <v-col >-->
                                        <!--                                            {{ $t('phrases.Theme') }}-->
                                        <!--                                            <v-text-field-->
                                        <!--                                                :value="themeName"-->
                                        <!--                                                outlined-->
                                        <!--                                                dense-->
                                        <!--                                                hide-details-->
                                        <!--                                                @input="value=>themeName=value"-->
                                        <!--                                            />-->
                                        <!--                                        </v-col>-->
                                        <!--                                    </v-row>-->
                                        <!--                        </template>-->
                                        <template v-if="cartogramSource===1">
                                            <v-row align-content="center">
                                                <v-col
                                                    cols="auto"
                                                    class="py-1"
                                                >
                                                    <v-switch
                                                        :input-value="bySelectedObjects"
                                                        :label="$t('userthematic.By selected objects')"
                                                        hide-details
                                                        hide-spin-buttons
                                                        dense
                                                        class="ml-3 my-1"
                                                        @change="changeBySelectedObjects"
                                                    />
                                                </v-col>
                                                <v-spacer />
                                                <v-col
                                                    v-if="bySelectedObjects"
                                                    cols="auto"
                                                    class="py-1"
                                                >
                                                    <v-tooltip right>
                                                        <template #activator="{ on, attrs }">
                                                            <gwtk-icon-button
                                                                :icon="actionIndicatorIcon"
                                                                :selected="selectActionStatus"
                                                                v-bind="attrs"
                                                                v-on="on"
                                                                @click="toggleActionIndicator"
                                                            />
                                                        </template>
                                                        {{ selectActionStatus? $t('userthematic.Disable selection of layer objects') : $t('userthematic.Enable selection of layer objects') }}
                                                    </v-tooltip>
                                                </v-col>
                                            </v-row>
                                            <v-row v-if="bySelectedObjects">
                                                <v-col class="py-1">
                                                    <gwtk-button
                                                        v-if="!isSelectedObjectsAdded"
                                                        secondary
                                                        :title="$t('userthematic.Add') + ' ('+selectedObjectsLength+')'"
                                                        :disabled="!selectedObjectsLength"
                                                        @click="addSelectedObjectsToParameterList"
                                                    />
                                                    <v-chip
                                                        v-else
                                                        close
                                                        @click:close="toggleCloseSelected"
                                                    >
                                                        {{ $t('userthematic.Parameters added') }}
                                                    </v-chip>
                                                </v-col>
                                            </v-row>
                                        </template>
                                        <template v-if="(cartogramSource===0 && fileName) || cartogramSource===1">
                                            <v-row>
                                                <v-col
                                                    cols="8"
                                                    class="py-2"
                                                >
                                                    <gwtk-menu
                                                        :title="$t('userthematic.Parameter')"
                                                        icon="mdi-plus"
                                                        is-dropdown
                                                        :disabled="!parameterList.length"
                                                        theme="primary"
                                                        width-available
                                                    >
                                                        <v-list>
                                                            <gwtk-list-item
                                                                v-for="(item, index) in parameterList"
                                                                :key="index"
                                                                :title="item.name"
                                                                @click="selectBuildParameter(item.name)"
                                                            />
                                                        </v-list>
                                                    </gwtk-menu>
                                                </v-col>
                                                <v-spacer />
                                                <v-col
                                                    cols="auto"
                                                    class="py-2"
                                                >
                                                    <v-tooltip right>
                                                        <template #activator="{ on, attrs }">
                                                            <gwtk-button
                                                                secondary
                                                                icon="diagram-out"
                                                                icon-size="20"
                                                                :disabled="disabledBuildMap"
                                                                v-bind="attrs"
                                                                v-on="on"
                                                                @click="showDiagramClick()"
                                                            />
                                                        </template>
                                                        {{ $t('userthematic.Chart') }}
                                                    </v-tooltip>
                                                </v-col>
                                            </v-row>
                                            <template v-if="buildParameterList.length">
                                                <v-row class="mt-4">
                                                    <v-divider />
                                                </v-row>
                                                <v-row>
                                                    <v-list class="gwtk-full-width">
                                                        <gwtk-list-item
                                                            v-for="(item, index) in buildParameterList"
                                                            :key="index"
                                                            :title="item.text"
                                                        >
                                                            <template #right-slot>
                                                                <gwtk-icon-button
                                                                    icon="settings"
                                                                    icon-size="18"
                                                                    @click="editBuildParameter(item.text, index, item.id)"
                                                                />
                                                                <gwtk-icon-button
                                                                    icon="close-icon"
                                                                    icon-size="18"
                                                                    @click="removeBuildParameter(index)"
                                                                />
                                                            </template>
                                                        </gwtk-list-item>
                                                    </v-list>
                                                </v-row>
                                                <v-row class="mb-0">
                                                    <v-divider />
                                                </v-row>
                                            </template>
                                        </template>
                                    </div>
                                    <v-row class="mt-4 mx-0">
                                        <gwtk-button
                                            v-if="isReadyCreateThematic"
                                            primary
                                            :title="$t('userthematic.Build')"
                                            :disabled="disabledBuildMap"
                                            width-available
                                            @click="buildMap"
                                        />
                                        <gwtk-button
                                            v-else
                                            secondary
                                            width-available
                                            :title="$t('userthematic.Cancel')"
                                            @click="buildMap"
                                        >
                                            <v-progress-circular
                                                size="19"
                                                width="2"
                                                indeterminate
                                            >
                                                <gwtk-icon
                                                    size="19"
                                                    name="mdi-close"
                                                />
                                            </v-progress-circular>
                                        </gwtk-button>
                                    </v-row>
                                </v-container>
                                <v-container v-else class="gwtk-full-height">
                                    <gwtk-build-parameter-editor
                                        :set-state="setState"
                                        :build-parameters-options-temp="buildParametersOptionsTemp"
                                        :semantic-value-col="semanticValueCol"
                                        :range-index="rangeIndex"
                                        :min-value="minValue"
                                        :max-value="maxValue"
                                        :is-reduced-size-interface="isReducedSizeInterface"
                                    />
                                </v-container>
                            </template>
                            <v-container v-else class="gwtk-full-height">
                                <gwtk-chart-thematic
                                    :thematic-chart-data-array="thematicChartDataArray"
                                    :build-parameter-list="buildParameterList"
                                    :set-state="setState"
                                    :is-parameter-setting-mode="isParameterSettingMode"
                                    :build-parameters-options-temp="buildParametersOptionsTemp"
                                    :color-legend="colorLegend"
                                />
                                <gwtk-button
                                    secondary
                                    :title="$t('userthematic.Back')"
                                    @click="cancelDiagramClick"
                                />
                            </v-container>
                        </v-tab-item>
                        <v-tab-item>
                            <gwtk-user-thematic-project-manager
                                :set-state="setState"
                                :build-parameter-list="buildParameterList"
                                :project-names-list="projectNamesList"
                                :project-selected-index="projectSelectedIndex"
                                :is-reduced-size-interface="isReducedSizeInterface"
                                @goBack="goBack"
                            />
                        </v-tab-item>
                    </v-tabs-items>
                </div>
            </v-sheet>
            <v-overlay :value="!isReadyGetFeature">
                <v-progress-circular
                    indeterminate
                    size="64"
                />
            </v-overlay>
        </template>
        <template v-else>
            <v-sheet class="mx-2">
                {{ $t('userthematic.Component not configured') }}
            </v-sheet>
        </template>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkUserThematicWidget.ts" />

<style scoped>
    .gwtk-main-view {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;

    }

    .gwtk-tab-container {
        height: calc(100% - 48px);
    }

    .gwtk-full-height {
        height: 100%;
    }

    .gwtk-full-width {
        width: 100%;
    }

    .gwtk-parameters-list {
        min-height: 128px;
        height: calc(100% - 386px);
        overflow-y: auto;
        overflow-x: hidden;
    }
    .gwtk-parameters-list-reduce {
        min-height: 128px;
        height: calc(100% - 306px);
        overflow-y: auto;
        overflow-x: hidden;
    }

    .gwtk-user-thematic-filename {
        white-space: normal;
        word-break: break-all;
        height: auto;
        padding: 0.5em 1em;
    }
    ::v-deep .gwtk-parameters-list-reduce .v-btn:not(.v-btn--round).v-size--default{
        height: var(--v-btn-height--default);
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
        padding-top: var(--py-2) !important;
        padding-bottom: var(--py-2) !important;
    }

    .gwtk-user-thematic-buttons .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
        height: var(--btn-toggle-btn-height);
    }
</style>