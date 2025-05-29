/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Точка в геодезических координатах (радианы)             *
 *                                                                  *
 *******************************************************************/

import TranslateList from '~/translate/TTranslateList';
import { MapPoint } from '~/geometry/MapPoint';
import TranslateFactory from '~/translate/TranslateFactory';


type Radians = number;

/**
 * Класс точки в геодезических координатах (радианы)
 * @class GeoPointRad
 */
export default class GeoPointRad {
    /**
     * Долгота
     * @protected
     * @property {number} longitude
     */
    protected longitude: Radians;
    /**
     * Широта
     * @protected
     * @property {number} latitude
     */
    protected latitude: Radians;
    /**
     * Высота
     * @protected
     * @property {number} height
     */
    protected height: number;

    /**
     * Идентификатор проекции
     * @protected
     * @property {string} ProjectionId
     */
    protected ProjectionId: string;

    /**
     * @constructor GeoPointRad
     * @param [longitude] {number} Значение долготы
     * @param [latitude] {number} Значение широты
     * @param [height] {number} Значение высоты
     * @param [projectionId] {string} Идентификатор проекции
     */
    constructor( longitude: Radians = 0, latitude: Radians = 0, height: Radians = 0, projectionId: string = 'GoogleMapsCompatible' ) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.height = height;
        this.ProjectionId = projectionId;
    }

    /**
     * Запросить идентификатор проекции
     * @returns {string} Идентификатор проекции
     */
    getProjectionId(): string {
        return this.ProjectionId;
    }

    /**
     * Получить значение долготы
     * @method getLongitude
     * @return {number} Долгота
     */
    getLongitude(): Radians {
        return this.longitude;
    }

    /**
     * Установить значение долготы
     * @method setLongitude
     * @param value {number} Долгота
     */
    setLongitude( value: Radians ): void {
        this.longitude = value;
    }

    /**
     * Получить значение широты
     * @method getLatitude
     * @return {number} Широта
     */
    getLatitude(): Radians {
        return this.latitude;
    }

    /**
     * Установить значение широты
     * @method setLatitude
     * @param value {number} Широта
     */
    setLatitude( value: Radians ): void {
        this.latitude = value;
    }

    /**
     * Получить значение высоты
     * @method getHeight
     * @return {number} Высота
     */
    getHeight(): Radians {
        return this.height;
    }

    /**
     * Установить значение высоты
     * @method setHeight
     * @param value {number} Высота
     */
    setHeight( value: number ): void {
        this.height = value;
    }

    /**
     * Получить копию объекта
     * @method copy
     * @return {GeoPointRad} Копия объекта
     */
    copy(): GeoPointRad {
        return new GeoPointRad( this.longitude, this.latitude, this.height, this.ProjectionId );
    }

    clone() {
        return this.copy();
    }

    /**
     * Сравнение точек
     * @method equals
     * @param other{GeoPointRad} Точка в геодезических координатах
     * @return {boolean} Если `true`, то точки одинаковые
     */
    equals( other: GeoPointRad ): boolean {
        return this.longitude === other.getLongitude() && this.latitude === other.getLatitude() && this.height === other.getHeight() && this.ProjectionId === other.ProjectionId;
    }

    /**
     * Преобразовать в метры
     * @param [projectionId] идентификатор проекции пересчета
     * @returns {MapPoint| undefined}
     */
    toMapPoint( projectionId?: string ): MapPoint | undefined {
        const mainTranslate = TranslateList.getItem( this.ProjectionId );
        if ( !mainTranslate ) {
            return undefined;
        }
        const b = TranslateFactory.createTDouble( this.getLatitude() );
        const l = TranslateFactory.createTDouble( this.getLongitude() );

        if ( projectionId ) {
            const translate = TranslateList.getItem( projectionId );
            if ( !translate ) {
                return undefined;
            }

            const h = TranslateFactory.createTDouble();
            mainTranslate.geoToGeo3dWGS84( b, l, h );
            translate.geoWGS84ToGeo( b, l );
            translate.bl2xy_one( b, l );
            return new MapPoint( b.Value, l.Value, this.getHeight(), projectionId );
        } else {
            mainTranslate.bl2xy_one( b, l );
        }

        return new MapPoint( b.Value, l.Value, this.getHeight(), this.getProjectionId() );
    }
}
