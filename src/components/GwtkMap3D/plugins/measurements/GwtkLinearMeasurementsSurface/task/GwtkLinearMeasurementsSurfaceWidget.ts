/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Виджет задачи "Линейные измерения по поверхности"       *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkLinearMeasurementsSurfaceTaskState,
    TOGGLE_EXPORT_TO_CSV,
    TOGGLE_NEW_MEASUREMENT,
    TOGGLE_RESUME,
    TOGGLE_SEGMENT_DETAILS
} from './GwtkLinearMeasurementsSurfaceTask';
import {
    UnitTextExport,
    MeasurementName,
    SegmentItem,
    SegmentItemData
} from '../../../../Types';
import MeasurementUtils from '../../../../utils/MeasurementUtils';
import { AngleUnit, Unit } from '~/utils/WorkspaceManager';


@Component
export default class GwtkLinearMeasurementsSurfaceWidget extends BaseGwtkVueComponent {
    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkLinearMeasurementsSurfaceTaskState>( key: K, value: GwtkLinearMeasurementsSurfaceTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly measurementList!: SegmentItemData[];

    @Prop( { default: () => [] } )
    private readonly segmentList!: SegmentItem[];

    @Prop( { default: true } )
    private readonly isResumeButtonDisabled!: boolean;

    private angleTypes: { id: string, text: string }[] = [
        { id: MeasurementName.azimuth, text: this.$t( 'phrases.Azimuth' ) + '' },
        { id: MeasurementName.directionAngle, text: this.$t( 'phrases.Direction angle' ) + '' }
    ];

    private angleTypeCurrent: string = this.angleTypes[ 0 ].id;
    private angleTextCurrent: string = this.angleTypes[ 0 ].text;

    updated() {
        const segmentTableBody = this.$refs[ 'segmentTableBody' ] as Element;

        if ( segmentTableBody ) {
            const rowSelected = segmentTableBody.querySelector( 'tr.selected' );
            if ( rowSelected ) {
                rowSelected.scrollIntoView( false );
            }
        }
    }

    private changeAngleType( value: { id: string, text: string } ) {
        this.angleTypeCurrent = value.id;
    }

    private toggleSegment( index: number ) {
        if ( index !== undefined ) {
            this.setState( TOGGLE_SEGMENT_DETAILS, index + 1 );
        }
    }

    private toggleResume() {
        this.setState( TOGGLE_RESUME, undefined );
    }

    private toggleNewMeasurement() {
        this.setState( TOGGLE_NEW_MEASUREMENT, undefined );
    }

    private get measurementListFiltered() {
        const measurements: SegmentItemData[] = [];

        this.measurementList.forEach( measurement => {

            if ( (this.angleTypeCurrent === this.angleTypes[ 0 ].id && measurement.name === MeasurementName.azimuth) ||
                (this.angleTypeCurrent === this.angleTypes[ 1 ].id && measurement.name === MeasurementName.rotation) ) {
                measurements.push( { name: MeasurementName.angle, unit: measurement.unit, value: measurement.value } );

            } else if ( measurement.name !== MeasurementName.azimuth && measurement.name !== MeasurementName.rotation ) {
                measurements.push( measurement );
            }

        } );

        return measurements;
    }

    private get segmentListFiltered() {
        const segmentsFiltered: SegmentItem[] = [];

        this.segmentList.forEach( segment => {

            const data: SegmentItemData[] = [];

            segment.data.forEach( item => {

                if ( ((this.angleTypeCurrent === this.angleTypes[ 0 ].id && item.name !== MeasurementName.angle) ||
                        (this.angleTypeCurrent === this.angleTypes[ 1 ].id && item.name !== MeasurementName.azimuth)) &&
                    item.unit !== '' ) {
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
