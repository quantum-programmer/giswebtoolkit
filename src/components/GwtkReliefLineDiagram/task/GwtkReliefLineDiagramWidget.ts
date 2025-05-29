/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                   "Построение профиля рельефа"                   *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {
    APPEND_POINT_RELIEF_LINE_ACTION,
    GwtkReliefLineDiagramTaskState,
    DataProfileRelief,
    CLEAR_SELECTED_POINTS,
    ChartParams,
    ChartStatistics,
    SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, UPDATE_CHART_PARAMS, CHART_IS_READY
} from './GwtkReliefLineDiagramTask';
import {Chart, registerables} from 'chart.js';
import {ActionMode, ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID} from '~/taskmanager/Action';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkReliefLineChart from './components/GwtkReliefLineChart.vue';
import GwtkReliefLineDiagramContainerItem from './GwtkReliefLineDiagramContainerItem.vue';


Chart.register(...registerables);

/**
 * Виджет компонента
 * @class GwtkReliefLineDiagramWidget
 * @extends BaseGwtkVueComponent
 */
@Component({components: {GwtkReliefLineChart, GwtkReliefLineDiagramContainerItem}})
export default class GwtkReliefLineDiagramWidget extends BaseGwtkVueComponent {
    @Prop({default: ''})
    private readonly taskId!: string;

    @Prop({default: () => ({})})
    private readonly description!: TaskDescription;

    @Prop({default: () => ({})})
    private readonly setState!: <K extends keyof GwtkReliefLineDiagramTaskState>(key: K, value: GwtkReliefLineDiagramTaskState[K]) => void;

    @Prop({default: () => ({})})
    private readonly dataProfileRelief!: DataProfileRelief;

    @Prop({default: () => ({})})
    private readonly chartParams!: ChartParams;

    @Prop({default: () => false})
    private readonly hasSelectedPoints!: boolean;

    @Prop({default: () => false})
    private readonly readyFlag!: boolean;

    @Prop({default: () => ({})})
    private readonly modePanel!: ActionModePanel;

    @Prop({default: () => false})
    private readonly isActiveModeByObject!: boolean;

    @Prop({default: () => false})
    private readonly isActiveModeByPoints!: boolean;

    @Prop({default: () => false})
    private readonly isWaitingForChart!: boolean;

    @Prop({default: ''})
    private readonly currentMessage!: string;

    @Prop({default: () => false})
    private readonly showMessage!: boolean;

    @Prop({default: () => false})
    private readonly isActivePartSelectionMode!: boolean;

    @Prop({default: () => 1})
    private readonly objectContourCount!: number;

    @Prop({default: () => 0})
    private readonly objectContourSelected!: number;

    @Prop({default: () => true})
    private readonly isBuildEnabled!: boolean;

    private optionsMode = false;

    private chartParamsEdited: ChartParams = JSON.parse(JSON.stringify(this.chartParams));

    created() {
        this.setState(CHART_IS_READY, undefined);
    }

    /**
     * Построить график рельефа снова
     */
    restartReliefDiagram() {
        this.setState(APPEND_POINT_RELIEF_LINE_ACTION, true);
    }

    restartReliefDiagramByObject() {
        this.setState(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, false);
        this.setState(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, true);
    }

    get modePanelDescriptions() {
        const result: ActionMode[] = [];

        MODE_PANEL_KEYS.forEach((key) => {
            let modePanel = this.modePanel[key];
            if (modePanel !== undefined) {
                if (!(!this.$vuetify.breakpoint.smAndUp && key === SAVE_PANEL_ID)) {
                    result.push(modePanel);
                }
            }
        });
        return result;
    }

    clearSelectedPoints() {
        this.setState(CLEAR_SELECTED_POINTS, undefined);
    }

    private get lineColorStyle() {
        return {
            backgroundColor: this.chartParamsEdited.lineColor,
            cursor: 'pointer',
            height: '22px',
            width: '22px',
            borderRadius: '4px',
            transition: 'border-radius 200ms ease-in-out'
        };
    }

    private get fillColorStyle() {
        return {
            backgroundColor: this.chartParamsEdited.fillColor,
            cursor: 'pointer',
            height: '22px',
            width: '22px',
            borderRadius: '4px',
            transition: 'border-radius 200ms ease-in-out'
        };
    }

    private changeLineColor(value: { hexa: string }) {
        this.chartParamsEdited.lineColor = value.hexa;
    }

    private changeFillColor(value: { hexa: string }) {
        this.chartParamsEdited.fillColor = value.hexa;
    }

    private changeShowHeightIncrement() {
        this.chartParamsEdited.showHeightIncrement = !this.chartParamsEdited.showHeightIncrement;
    }

    private changeShowStatisticsItem(item: { text: string, show: boolean }, status: boolean) {

        let statisticsKey: keyof ChartStatistics;
        for (statisticsKey in this.chartParamsEdited.statistics) {
            const statisticsItem = this.chartParamsEdited.statistics[statisticsKey];
            if (statisticsItem.text === item.text) {
                statisticsItem.show = status;
            }
        }
    }

    private get statistics() {

        let statisticsKey: keyof ChartStatistics;
        for (statisticsKey in this.chartParamsEdited.statistics) {
            const statisticsItemEdited = this.chartParamsEdited.statistics[statisticsKey];
            const statisticsItem = this.chartParams.statistics[statisticsKey];
            statisticsItemEdited.value = statisticsItem.value;
            statisticsItemEdited.unitText = statisticsItem.unitText;
        }

        return this.chartParamsEdited.statistics;
    }

    private toggleApply() {
        this.optionsMode = false;
        this.setState(UPDATE_CHART_PARAMS, this.chartParamsEdited);
    }

    private toggleCancel() {
        this.optionsMode = false;
        this.chartParamsEdited = JSON.parse(JSON.stringify(this.chartParams));
    }

}
