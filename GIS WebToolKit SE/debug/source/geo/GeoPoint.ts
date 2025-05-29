/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Точка в геодезических координатах (градусы)           *
 *                                                                  *
 *******************************************************************/


import Trigonometry from '~/geo/Trigonometry';
import GeoPointRad from '~/geo/GeoPointRad';
import { MapPoint } from '~/geometry/MapPoint';
import Utils from '~/services/Utils';
import { AngleUnit } from '~/utils/WorkspaceManager';


type Degrees = number;

/**
 * Класс точки в геодезических координатах (градусы)
 * @class GeoPoint
 * @extends GeoPointRad
 */
export default class GeoPoint extends GeoPointRad {

    /**
     * @constructor GeoPoint
     * @param [longitude] {number} Значение долготы
     * @param [latitude] {number} Значение широты
     * @param [height] {number} Значение высоты
     * @param [projectionId] {string} Идентификатор проекции
     */
    constructor( longitude?: Degrees, latitude?: Degrees, height?: number, projectionId?: string ) {
        super( longitude, latitude, height, projectionId );
    }

    getLongitude(): Degrees {
        return super.getLongitude();
    }

    setLongitude( value: Degrees ): void {
        return super.setLongitude( value );
    }

    getLatitude(): Degrees {
        return super.getLatitude();
    }

    setLatitude( value: Degrees ): void {
        return super.setLatitude( value );
    }

    copy(): GeoPoint {
        return new GeoPoint( this.longitude, this.latitude, this.height, this.ProjectionId );
    }

    toMapPoint( projectionId?: string ): MapPoint | undefined {
        return Trigonometry.toRadians( this ).toMapPoint( projectionId );
    }

    /**
     * Получить строку с координатами в формате (градусы, минуты, секунды)
     * @method toDegreesMinutesSecondsString
     * @param lang { ( value: string ) => string } функция локализации слова
     * @return {string} Строка с координатами в формате (градусы, минуты, секунды)
     */
    toDegreesMinutesSecondsString( lang?: ( value: string ) => string ): string {
        let latitudeLabel = 'Latitude';
        let longitudeLabel = 'Longitude';
        if ( lang ) {
            latitudeLabel = lang( latitudeLabel );
            longitudeLabel = lang( longitudeLabel );
        }
        return latitudeLabel + ' = ' + GeoPoint.degrees2DegreesMinutesSeconds( this.latitude ) + '   ' + longitudeLabel + ' = ' + GeoPoint.degrees2DegreesMinutesSeconds( this.longitude ) + ' ';
    }

    /**
     * Получить строку с координатой в формате (градусы, минуты, секунды)
     * @method degrees2DegreesMinutesSeconds
     * @private
     * @param degrees {number} Угол в градусах
     * @return {string} Строка с координатой в формате (градусы, минуты, секунды)
     */
    static degrees2DegreesMinutesSeconds( degrees: number ): string {
        const angle = Utils.degreesToUnits( degrees, AngleUnit.DegreesMinutesSeconds );
        if ( angle.unit === AngleUnit.DegreesMinutesSeconds ) {
            const [iDegrees, iMinutes, seconds] = angle.value;
            return Utils.createDegreesMinutesSecondsStr( iDegrees, iMinutes, seconds );
        }
        return '';
    }

    /**
     * Получить координаты в градусах из строки координат в формате (градусы, минуты, секунды)
     * @method degreesMinutesSeconds2Degrees
     * @static
     * @param degrees {Number} координат в формате (градусы)
     * @param minutes {Number} координат в формате (минуты)
     * @param seconds {Number} координат в формате (секунды)
     * @return {number} координаты в градусах
     */
    static degreesMinutesSeconds2Degrees( degrees: number, minutes: number, seconds: number ): number {
        let iDegrees = degrees;

        const total = (minutes + seconds / 60) / 60;

        if ( iDegrees < 0 ) {
            iDegrees -= total;
        } else {
            iDegrees += total;
        }

        return iDegrees;
    }
}
