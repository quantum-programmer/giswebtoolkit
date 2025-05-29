/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет задачи "Линейные измерения"               *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { GwtkLinearMeasurementsTaskState, TOGGLE_NEW_MEASUREMENT } from './GwtkLinearMeasurementsTask';
import { SegmentItemData, UnitTextExport } from '../../../../Types';
import { AngleUnit, Unit } from '~/utils/WorkspaceManager';
import MeasurementUtils from '../../../../utils/MeasurementUtils';


@Component
export default class GwtkLinearMeasurementsWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkLinearMeasurementsTaskState>( key: K, value: GwtkLinearMeasurementsTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly measurementList!: SegmentItemData[];

    private toggleNewMeasurement() {
        this.setState( TOGGLE_NEW_MEASUREMENT, undefined );
    }

    private getDataValue( value: string, unit: Unit | AngleUnit | UnitTextExport | '' ): string {
        return MeasurementUtils.getDataValue( value, unit );
    }
}
