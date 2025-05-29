/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        График компонента                         *
 *                   "Построение профиля рельефа"                   *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Vue} from 'vue-property-decorator';

import {
    CHANGE_CONTOUR_SELECTED,
    EDIT_POINT_RELIEF_LINE_ACTION,
    GwtkReliefLineDiagramTaskState, INIT_CANVAS, SELECT_OBJECT_FOR_RELIEF_LINE_ACTION,
} from '../GwtkReliefLineDiagramTask';
import {ActionModePanel} from '~/taskmanager/Action';
import i18n from '@/plugins/i18n';


/**
 * Виджет компонента
 * @class GwtkReliefLineChart
 * @extends Vue
 */
@Component
export default class GwtkReliefLineChart extends Vue {

    @Prop({default: () => ({})})
    private readonly setState!: <K extends keyof GwtkReliefLineDiagramTaskState>(key: K, value: GwtkReliefLineDiagramTaskState[K]) => void;

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

    mounted() {
        const canvas = this.$refs.reliefChart as HTMLCanvasElement;
        if (canvas) {
            this.setState(INIT_CANVAS, canvas);
        }
    }

    private toggleCancel() {
        this.setState(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, false);
        this.setState(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, true);
    }

    private toggleBuild() {
        this.setState(SELECT_OBJECT_FOR_RELIEF_LINE_ACTION, false);
        this.setState(EDIT_POINT_RELIEF_LINE_ACTION, true);
    }

    private get items() {
        const result: string[] = [];
        for (let i = 0; i < this.objectContourCount; i++) {
            result.push(i18n.tc('relieflinediagram.Contour') + ' ' + i);
        }
        return result;
    }

    get contourSelected() {
        return i18n.tc('relieflinediagram.Contour') + ' ' + this.objectContourSelected;
    }

    set contourSelected(item) {
        const contourIndex = +item.split(' ')[1];
        this.setState(CHANGE_CONTOUR_SELECTED, contourIndex);
    }

}
