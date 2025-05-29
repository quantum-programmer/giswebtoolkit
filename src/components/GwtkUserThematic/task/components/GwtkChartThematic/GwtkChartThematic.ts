/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Диаграмма компонента                      *
 *            "Построение Диаграммы тематических карт"              *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    GwtkUserThematicTaskState,
    GET_OBJECTS_OF_RANGE,
    INIT_CANVAS,
    SET_PARAMETER_FOR_CHART,
    TRIGGER_TOOLTIP
} from '../../GwtkUserThematicTask';
import {BuildParameterOptions, ThematicChartDataArray} from '~/types/Types';


/**
 * Виджет компонента
 * @class GwtkChartThematic
 * @extends Vue
 */
@Component
export default class GwtkChartThematic extends Vue {

    @Prop({default: () => ({})})
    private readonly setState!: <K extends keyof GwtkUserThematicTaskState>(key: K, value?: GwtkUserThematicTaskState[K]) => void;

    @Prop({default: () => ({})})
    private readonly thematicChartDataArray!: ThematicChartDataArray;

    @Prop({default: []})
    private readonly buildParameterList!: { id: string, text: string }[];

    @Prop({default: false})
    private readonly isParameterSettingMode!: boolean;

    @Prop({default: () => ({})})
    private readonly buildParametersOptionsTemp!: BuildParameterOptions & { rangesCount: number };

    @Prop({default: () => []})
    private readonly colorLegend!: string[];

    valueThematic: number[] = [];

    mounted() {
        const canvas = this.$refs.thematicChart as HTMLCanvasElement;
        if (canvas) {
            this.setState(INIT_CANVAS, canvas);
        }
    }

    /**
     * Сформировать легенду
     */
    get itemsLegend() {
        const itemsLegend = [];

        for (let numberRange = 0; numberRange < this.thematicChartDataArray.array.length; numberRange++) {
            itemsLegend.push({
                iconLegend: this.colorLegend[numberRange],
                text: this.thematicChartDataArray.array[numberRange].description.label + ' (' + this.thematicChartDataArray.array[numberRange].value + ')',
                description: this.thematicChartDataArray.array[numberRange].description.title,
                icon: {
                    line: this.thematicChartDataArray.array[numberRange].description.icon[0],
                    square: this.thematicChartDataArray.array[numberRange].description.icon[1],
                    point: this.thematicChartDataArray.array[numberRange].description.icon[2]
                }
            });
        }
        return itemsLegend;
    }

    /**
     * Нажатие на элемент списка
     * @param index номер элемента
     */
    legendItemClick(index: number) {
        this.setState(TRIGGER_TOOLTIP, index);
    }

    private changeParameter(value: string) {
        this.setState(SET_PARAMETER_FOR_CHART, value);
    }

    private toggleGoToObjects(index: number) {
        this.setState(GET_OBJECTS_OF_RANGE, index);
    }


}
