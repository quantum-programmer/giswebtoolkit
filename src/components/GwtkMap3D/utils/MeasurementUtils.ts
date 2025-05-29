/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Вспомогательные функции                        *
 *                                                                  *
 *******************************************************************/

import i18n from '@/plugins/i18n';
import { SegmentItem, SegmentItemData, UnitTextExport } from '../Types';
import CsvEditor, { Cell, ColumnSeparator } from '~/services/Utils/CsvEditor';
import Utils from '~/services/Utils';
import { BrowserService } from '~/services/BrowserService';
import { AngleUnit, CursorCoordinateUnit, Unit, UnitText } from '~/utils/WorkspaceManager';
import Trigonometry from '~/geo/Trigonometry';
import GeoPoint from '~/geo/GeoPoint';
import ComboPoint3D from '~/3d/engine/core/combopoint3d';


export default class MeasurementUtils {

    static getComboPointCoordsString( comboPoint: ComboPoint3D, cursorCoordinateUnit: CursorCoordinateUnit ): { value: string, unitTitle: UnitTextExport, unit: UnitTextExport } {
        let result = '';
        let unitTitle = UnitTextExport.meters;
        let unit: UnitTextExport = UnitTextExport.meters;

        const lat = comboPoint.getGeo().getLatitude() * Trigonometry.DegreePerRadians;
        const lon = comboPoint.getGeo().getLongitude() * Trigonometry.DegreePerRadians;
        const height = comboPoint.getGeo().getHeight().toFixed( 2 );

        const geoPoint = new GeoPoint( lon, lat );

        switch ( cursorCoordinateUnit ) {
            case CursorCoordinateUnit.Degrees:
                result = lat.toFixed( 5 ) + ', ' + lon.toFixed( 5 ) + ', ' + height;
                unit = UnitTextExport.degrees;
                unitTitle = UnitTextExport.degrees;
                break;
            case CursorCoordinateUnit.DegreesMinutesSeconds:
                result = GeoPoint.degrees2DegreesMinutesSeconds( lat ) + ', ' + GeoPoint.degrees2DegreesMinutesSeconds( lon ) + ', ' + height;
                unit = UnitTextExport.degMinSec;
                unitTitle = UnitTextExport.degMinSec;
                break;
            case CursorCoordinateUnit.Meter:
                const mapPoint = geoPoint.toMapPoint();
                if ( mapPoint ) {
                    result = mapPoint.y.toFixed( 2 ) + ', ' + mapPoint.x.toFixed( 2 ) + ', ' + height;
                }
                break;
            case CursorCoordinateUnit.Radians:
                result = comboPoint.getGeo().getLatitude().toFixed( 5 ) + ', ' + comboPoint.getGeo().getLongitude().toFixed( 5 ) + ', ' + height;
                unit = UnitTextExport.radians;
                unitTitle = UnitTextExport.radians;
                break;
        }

        return { value: result, unitTitle, unit };
    }

    static getDistanceValue( value: number, unit: Unit ) {
        let result: { value: number, unit: Unit } = { value: 0, unit: Unit.Meters };
        let unitTextExport: UnitTextExport = UnitTextExport.meters;

        switch ( unit ) {
            case Unit.Foots:
                result = Utils.linearMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.feet;
                break;
            case Unit.Meters:
                result = Utils.linearMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.meters;
                break;
            case Unit.Kilometers:
                result = Utils.linearMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.kilometers;
                break;
            case Unit.NauticalMiles:
                result = Utils.linearMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.miles;
                break;

            case Unit.Hectares:
                result = Utils.squareMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.hectares;
                break;
            case Unit.SquareKilometers:
                result = Utils.squareMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.squareKilometers;
                break;
            case Unit.SquareMeters:
                result = Utils.squareMetersToUnits( value, unit );
                unitTextExport = UnitTextExport.squareMeters;
                break;
        }

        return { text: result.value + '', unitTitle: result.unit, unit: unitTextExport };
    }

    static getAngleValue( value: number, unit: AngleUnit ) {
        let result: { value: number; unit: AngleUnit.Degrees | AngleUnit.Radians } | { value: [number, number, number]; unit: AngleUnit.DegreesMinutesSeconds } = {
            value: 0,
            unit: AngleUnit.Degrees
        };
        let unitTextExport: UnitTextExport = UnitTextExport.degrees;
        let unitTitle = UnitTextExport.degrees;

        let resultString = '';

        switch ( unit ) {
            case AngleUnit.Degrees:
                result = Utils.radiansToUnits( value, unit );
                resultString = result.value + '';
                break;
            case AngleUnit.Radians:
                result = Utils.degreesToUnits( value, unit );
                unitTextExport = UnitTextExport.radians;
                unitTitle = unitTextExport;
                resultString = result.value + '';
                break;
            case AngleUnit.DegreesMinutesSeconds:
                resultString = GeoPoint.degrees2DegreesMinutesSeconds( value );
                unitTextExport = UnitTextExport.degMinSec;
                unitTitle = UnitTextExport.degMinSec;
                break;
        }

        return { text: resultString, unitTitle, unit: unitTextExport };
    }

    static getDeltaHeightValue( value: number, unit: Unit ) {
        const deltaHeight = MeasurementUtils.getDistanceValue( value, unit );
        let unitTitle = deltaHeight.unitTitle;
        let d = deltaHeight.text;
        if ( unit === Unit.Kilometers ) {
            const value = parseFloat( deltaHeight.text );
            d = Number( (value * 1000).toFixed( 3 ) ).toString();
            unitTitle = Unit.Meters;
            deltaHeight.unit = UnitTextExport.meters;
        }

        return { text: d + '', unitTitle, unit: deltaHeight.unit };
    }

    static exportToCsv( segmentList: SegmentItem[] ) {
        if ( !segmentList.length ) {
            return;
        }
        const csv: CsvEditor = new CsvEditor( '', 'measurements.csv', true );
        csv.separator = ColumnSeparator.Semicolon;
        csv.lineBreak = '\r\n';
        csv.clearTitle();

        csv.columnCount = segmentList[ 0 ].data.length + 1;

        const titleRow: Cell[] = [];

        titleRow.push( {
            type: 'String',
            value: i18n.t( 'phrases.Segment' ) + '',
            col: 0,
            row: 0
        } );

        segmentList[ 0 ].data.forEach( ( item, index ) => {
            const cell: Cell = {
                type: 'String',
                value: i18n.t( 'phrases.' + item.name ) + '',
                col: index + 1,
                row: 0
            };
            titleRow.push( cell );
        } );

        csv.addTitleCells( titleRow );

        segmentList.forEach( ( segment, rowIndex ) => {
            const row: Cell[] = [];

            row.push( {
                row: rowIndex,
                col: 0,
                type: 'String',
                value: i18n.t( 'phrases.Segment' ) + ' ' + (rowIndex + 1)
            } );

            segment.data.forEach( ( item, colIndex ) => {

                row.push( {
                    row: rowIndex,
                    col: colIndex + 1,
                    type: 'String',
                    value: MeasurementUtils.getMeasurementDataValue( item.value )
                } );

            } );

            csv.addCells( row );

        } );

        const blob = Utils.unicodeToWin1251Blob( csv.toString( true ) );
        BrowserService.downloadContent( blob, csv.fileName );
    }

    static getMeasurementDataValue( value: string, fractionDigits: number = 6 ): string {
        const regex = /\d+\.*|^$/;
        if ( regex.exec( value ) === null ) {

            let unit: UnitText | UnitTextExport = UnitText.MTR;
            switch ( value ) {
                case Unit.Kilometers:
                    unit = UnitText.KMT;
                    break;
                case Unit.Foots:
                    unit = UnitText.FOT;
                    break;
                case Unit.NauticalMiles:
                    unit = UnitText.NMI;
                    break;

                case Unit.SquareMeters:
                    unit = UnitText.SMTR;
                    break;
                case Unit.SquareKilometers:
                    unit = UnitText.SKMT;
                    break;
                case Unit.Hectares:
                    unit = UnitText.HA;
                    break;

                case AngleUnit.Radians:
                    unit = UnitText.RAD;
                    break;
                case AngleUnit.Degrees:
                    return UnitText.DEG;
                case AngleUnit.DegreesMinutesSeconds:
                    return UnitText.DegMinSec;

                case UnitTextExport.degrees:
                case UnitTextExport.meters:
                case UnitTextExport.radians:
                case UnitTextExport.degMinSec:
                case UnitTextExport.miles:
                case UnitTextExport.feet:
                case UnitTextExport.kilometers:
                case UnitText.RAD:
                case UnitText.MTR:
                    unit = value;
                    break;

                case UnitText.DEG:
                case UnitText.DegMinSec:
                    return value;
            }

            return i18n.t( 'phrases.' + unit ) + '';

        } else {

            const parts: string[] = value.split( ',' );
            if ( parts.length === 3 ) {

                value = parts[ 0 ].substr( 0, parts[ 0 ].indexOf( '.' ) + 4 )
                    + ', ' + parts[ 1 ].substr( 0, parts[ 1 ].indexOf( '.' ) + 4 )
                    + ', ' + parts[ 2 ].substr( 0, parts[ 2 ].indexOf( '.' ) + 4 );

            } else {

                if ( value.indexOf( UnitTextExport.degrees ) == -1 ) {
                    let pointIndex = value.indexOf( '.' ) + 1;
                    if ( pointIndex === 0 ) {
                        pointIndex = value.length;
                    }
                    const fixed = Math.min( value.length - pointIndex, fractionDigits );
                    value = ((Math.round( parseFloat( value ) * 1e6 )) / 1e6).toFixed( fixed );

                } else {

                    value = parts[ 0 ].substr( 0, parts[ 0 ].indexOf( '.' ) + 4 );
                }

            }

            return value;

        }
    }

    static getDataValue( value: string, unit: Unit | AngleUnit | UnitTextExport | '' ): string {
        if ( value === '' ) {
            return '';
        }
        let fractionDigits = 3;
        if ( unit ) {
            if ( unit === AngleUnit.Radians || unit === AngleUnit.Degrees || unit === UnitTextExport.radians ) {
                fractionDigits = 6;
            }

            if ( unit === Unit.Meters ) {
                fractionDigits = 2;
            }
        }
        return MeasurementUtils.getMeasurementDataValue( value, fractionDigits );
    }

    static getTitle( item: SegmentItemData ): string {
        return i18n.t( 'phrases.' + item.name ) + ', ' + MeasurementUtils.getMeasurementDataValue( item.unit );
    }

}
