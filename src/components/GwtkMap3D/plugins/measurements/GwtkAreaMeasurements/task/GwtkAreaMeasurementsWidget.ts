/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет задачи "Измерения площади"                *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkAreaMeasurementsTaskState,
    TOGGLE_NEW_MEASUREMENT,
    TOGGLE_PLANE_OBJECT,
    TOGGLE_RESUME,
    TOGGLE_SEGMENT_DETAILS,
    TOGGLE_EXPORT_TO_CSV
} from './GwtkAreaMeasurementsTask';
import { UnitTextExport, SegmentItem, SegmentItemData } from '../../../../Types';
import MeasurementUtils from '../../../../utils/MeasurementUtils';
import { AngleUnit, Unit } from '~/utils/WorkspaceManager';


@Component
export default class GwtkAreaMeasurementsWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkAreaMeasurementsTaskState>( key: K, value: GwtkAreaMeasurementsTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly measurementList!: SegmentItemData[];

    @Prop( { default: () => [] } )
    private readonly segmentList!: SegmentItem[];

    @Prop( { default: true } )
    private readonly isResumeButtonDisabled!: boolean;

    updated() {
        const segmentTableBody = this.$refs[ 'segmentTableBody' ] as Element;

        if ( segmentTableBody ) {
            const rowSelected = segmentTableBody.querySelector( 'tr.selected' );
            if ( rowSelected ) {
                rowSelected.scrollIntoView( false );
            }
        }
    }

    private togglePlaneObject( value: boolean ) {
        this.setState( TOGGLE_PLANE_OBJECT, value );
    }

    private toggleResume() {
        this.setState( TOGGLE_RESUME, undefined );
    }

    private toggleNewMeasurement() {
        this.setState( TOGGLE_NEW_MEASUREMENT, undefined );
    }

    private toggleSegment( index: number ) {
        if ( index !== undefined ) {

            let resultIndex = index + 1;
            if ( index === this.segmentList.length - 1 ) {
                resultIndex = 0;
            }

            this.setState( TOGGLE_SEGMENT_DETAILS, resultIndex );
        }
    }

    private get segmentListFiltered() {
        const segmentsFiltered: SegmentItem[] = [];

        this.segmentList.forEach( segment => {

            const data: SegmentItemData[] = [];

            segment.data.forEach( item => {

                if ( item.unit !== '' ) {
                    data.push( { name: item.name, value: item.value, unit: item.unit } );
                }

            } );

            segmentsFiltered.push( { active: segment.active, data } );

        } );

        return segmentsFiltered;
    }

    private toggleExport() {
        this.setState( TOGGLE_EXPORT_TO_CSV, undefined );
    }

    private getDataValue( value: string, unit: Unit | AngleUnit | UnitTextExport | '' ): string {
        return MeasurementUtils.getDataValue( value, unit );
    }

    private getTitle( item: SegmentItemData ): string {
        return MeasurementUtils.getTitle( item );
    }

}
