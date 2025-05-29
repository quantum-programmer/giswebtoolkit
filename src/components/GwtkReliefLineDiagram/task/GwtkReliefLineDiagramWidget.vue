<template>
    <gwtk-task-bottom-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <div v-if="readyFlag" class="gwtk-relief-line-diagram-main-panel">
            <v-row
                v-if="!optionsMode && !isWaitingForChart && !isActiveModeByObject && !isActiveModeByPoints"
                dense
                class="pl-2 pr-8"
            >
                <v-col
                    v-for="(item, index) of statistics"
                    v-show="item.show"
                    :key="index"
                    cols="auto"
                    class="px-4"
                >
                    {{ item.value? item.text + ': ' + item.value.toFixed(1) + ' ' + item.unitText : '' }}
                </v-col>
            </v-row>
            <v-col
                v-if="!optionsMode"
                cols="1"
                class="pt-0 pr-2 gwtk-relief-line-diagram-menu-button"
            >
                <gwtk-menu>
                    <template #trigger="{ on, attrs, value }">
                        <gwtk-tool-button
                            secondary
                            icon="mdi-menu"
                            :tooltip-text="$t('relieflinediagram.Menu')"
                            :position="'top'"
                            :selected="value"
                            v-bind="attrs"
                            v-on="on"
                        />
                    </template>
                    <v-list style="min-width: 20em">
                        <gwtk-list-item
                            :title="$t('relieflinediagram.Build a new profile')"
                            @click="restartReliefDiagram"
                        />
                        <gwtk-list-item
                            :title="$t('relieflinediagram.Build a new profile by object')"
                            @click="restartReliefDiagramByObject"
                        />
                        <gwtk-list-item
                            :disabled="!hasSelectedPoints"
                            :title="$t('relieflinediagram.Reset waypoints')"
                            @click="clearSelectedPoints"
                        />
                        <gwtk-list-item
                            :disabled="modePanelDescriptions.length!==0"
                            :title="$t('relieflinediagram.Options')"
                            @click="optionsMode=!optionsMode"
                        />
                    </v-list>
                </gwtk-menu>
            </v-col>
            <div class="gwtk-relief-line-diagram-control-panel">
                <v-row
                    v-if="optionsMode"
                    class="pl-4"
                    style="justify-content: center"
                >
                    <v-col cols="4" class="pl-16">
                        <v-col>
                            <v-row dense>
                                <v-col>
                                    {{ $t('relieflinediagram.Line color') }}
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col cols="4">
                                    <v-text-field
                                        :value="chartParamsEdited.lineColor"
                                        outlined
                                        dense
                                        hide-details
                                        readonly
                                    >
                                        <template #append>
                                            <v-menu
                                                top
                                                :close-on-content-click="false"
                                                z-index="100"
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
                                                            class="gwtk-test-color-picker-ui-1"
                                                            :value="chartParamsEdited.lineColor"
                                                            mode="hexa"
                                                            hide-mode-switch
                                                            @update:color="changeLineColor"
                                                        />
                                                    </v-card-text>
                                                </v-card>
                                            </v-menu>
                                        </template>
                                    </v-text-field>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col>
                            <v-row dense>
                                <v-col>
                                    {{ $t('relieflinediagram.Fill color') }}
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col cols="4">
                                    <v-text-field
                                        :value="chartParamsEdited.fillColor"
                                        outlined
                                        dense
                                        hide-details
                                        readonly
                                    >
                                        <template #append>
                                            <v-menu
                                                top
                                                :close-on-content-click="false"
                                                z-index="100"
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
                                                            class="gwtk-test-color-picker-ui-1"
                                                            :value="chartParamsEdited.fillColor"
                                                            mode="hexa"
                                                            hide-mode-switch
                                                            @update:color="changeFillColor"
                                                        />
                                                    </v-card-text>
                                                </v-card>
                                            </v-menu>
                                        </template>
                                    </v-text-field>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-checkbox
                            class="pl-2 pt-4"
                            :input-value="chartParamsEdited.showHeightIncrement"
                            dense
                            hide-details
                            :label="$t('relieflinediagram.Show height increment value on graph')"
                            @change="changeShowHeightIncrement"
                        />
                    </v-col>
                    <v-col cols="4" class="pt-6 gwtk-chart-options-show-statistics">
                        {{ $t('relieflinediagram.Show statistics') }}
                        <v-checkbox
                            v-for="(item, index) of statistics"
                            :key="index"
                            :input-value="item.show"
                            :label="item.text"
                            class="pl-2"
                            dense
                            hide-details
                            @change="value => changeShowStatisticsItem(item, value)"
                        />
                    </v-col>
                </v-row>
                <fieldset v-if="optionsMode" class="pa-2">
                    <v-row style="justify-content: center">
                        <v-col cols="2">
                            <gwtk-button
                                v-if="!modePanelDescriptions.length"
                                secondary
                                width-available
                                :title="$t('relieflinediagram.Cancel')"
                                @click="toggleCancel()"
                            />
                        </v-col>
                        <v-col cols="2">
                            <gwtk-button
                                v-if="!modePanelDescriptions.length"
                                primary
                                width-available
                                :title="$t('relieflinediagram.Apply')"
                                @click="toggleApply"
                            />
                        </v-col>
                    </v-row>
                </fieldset>
                <gwtk-relief-line-chart
                    v-show="!optionsMode"
                    :set-state="setState"
                    :mode-panel="modePanel"
                    :is-active-mode-by-points="isActiveModeByPoints"
                    :is-active-mode-by-object="isActiveModeByObject"
                    :is-waiting-for-chart="isWaitingForChart"
                    :current-message="currentMessage"
                    :show-message="showMessage"
                    :is-active-part-selection-mode="isActivePartSelectionMode"
                    :object-contour-count="objectContourCount"
                    :object-contour-selected="objectContourSelected"
                    :is-build-enabled="isBuildEnabled"
                />
            </div>
            <template v-if="modePanelDescriptions.length!==0">
                <div
                    v-for="(modePanelDescription, modePanelDescriptionIndex) in modePanelDescriptions"
                    :key="modePanelDescriptionIndex"
                    :hidden="!modePanelDescription.visible"
                >
                    <div
                        v-if="modePanelDescription.title"
                        class="text-body-1 pt-3"
                    >
                        {{ $t('phrases.' + modePanelDescription.title) }}
                    </div>
                    <div class="gwtk-actions-buttons pt-3">
                        <v-tooltip
                            v-for="modePanelButton in modePanelDescription.buttons"
                            :key="modePanelButton.id"
                            :disabled="!modePanelButton.enabled||!modePanelButton.options.title"
                            bottom
                        >
                            <template #activator="{ on }">
                                <gwtk-icon-button
                                    v-if="modePanelButton.options.theme!=='primary'&&modePanelButton.options.theme!=='secondary'"
                                    :disabled="!modePanelButton.enabled"
                                    :icon="modePanelButton.options.icon"
                                    :selected="modePanelButton.active"
                                    clear
                                    :icon-size="32"
                                    :title="$t(modePanelButton.options.label)"


                                    v-on="on"
                                    @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                />
                                <gwtk-button
                                    v-else
                                    class="gwtk-action-button-complete"
                                    :disabled="!modePanelButton.enabled"
                                    :primary="modePanelButton.options.theme==='primary'"
                                    :secondary="modePanelButton.options.theme==='secondary'"
                                    :icon="modePanelButton.options.icon"
                                    :selected="modePanelButton.active"
                                    clear
                                    :icon-size="32"
                                    :title="$t(modePanelButton.options.label)"
                                    v-on="on"
                                    @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                />
                            </template>
                            <div>{{ $t(modePanelButton.options.title) }}</div>
                        </v-tooltip>
                    </div>
                </div>
            </template>
        </div>
        <template v-else>
            <div class="ma-2">
                {{ $t('phrases.Component not configured') }}
            </div>
        </template>
    </gwtk-task-bottom-container-item>
</template>

<script src="./GwtkReliefLineDiagramWidget.ts" type="ts" />

<style scoped>
    .gwtk-actions-buttons {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }
    .gwtk-chart-options-show-statistics {
        display: flex;
        flex-direction: column;

    }

    .gwtk-relief-line-diagram-main-panel {
        height: calc(100% - 0.5em);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .gwtk-relief-line-diagram-control-panel {
        height: calc(100% - 1em);
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }

    .gwtk-relief-line-diagram-menu-button {
        display: flex;
        justify-content: flex-end;
        position: absolute;
        right: 0;
    }

    .gwtk-action-button-complete {
      position: fixed;
      bottom: 5em
    }
</style>
