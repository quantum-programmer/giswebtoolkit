/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Точка в геодезических координатах                    *
 *                                                                  *
 *******************************************************************/

//TODO: потом удалить?

/**
 * Класс точки
 * @class Geodetic3D
 * @param [longitude] {number} Значение долготы
 * @param [latitude] {number} Значение широты
 * @param [height] {number} Значение высоты
 */
export default class Geodetic3D {

    /**
     * Максимальная широта
     * @protected
     * @property {number} mMaxMapLatitude
     */
    private mMaxMapLatitude = 85.0840591556 * Math.PI / 180;


    /**
     * Долгота
     * @protected
     * @property {number} longitude
     */
    protected longitude: number;
    /**
     * Широта
     * @protected
     * @property {number} latitude
     */
    protected latitude: number;
    /**
     * Высота
     * @protected
     * @property {number} height
     */
    protected height: number;


    /**
     * @constructor Geodetic3D
     * @param [longitude] {number} Значение долготы
     * @param [latitude] {number} Значение широты
     * @param [height] {number} Значение высоты
     */
    constructor( longitude = 0, latitude = 0, height = 0 ) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.height = height;

    }

    /**
     * Валидация/изменение значения широты
     * @protected
     * @method validateLatitude
     */
    private validateLatitude() {
        this.latitude = Math.max( this.latitude, -this.mMaxMapLatitude );
        this.latitude = Math.min( this.latitude, this.mMaxMapLatitude );
    }

    /**
     * Получить значение долготы
     * @method getLongitude
     * @return {number} Долгота
     */
    getLongitude(): number {
        return this.longitude;
    }

    /**
     * Установить значение долготы
     * @method setLongitude
     * @param value {number} Долгота
     */
    setLongitude( value: number ): void {
        this.longitude = value;
    }

    /**
     * Получить значение широты
     * @method getLatitude
     * @return {number} Широта
     */
    getLatitude(): number {
        return this.latitude;
    }

    /**
     * Установить значение широты
     * @method setLatitude
     * @param value {number} Широта
     */
    setLatitude( value: number ): void {
        this.latitude = value;
        this.validateLatitude();
    }

    /**
     * Получить значение высоты
     * @method getHeight
     * @return {number} Высота
     */
    getHeight(): number {
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
     * Сравнение точек
     * @method equals
     * @param other{GeoPointRad} Точка в геодезических координатах
     * @return {boolean} Если `true`, то точки одинаковые
     */
    equals( other: Geodetic3D ): boolean {
        return this.longitude === other.getLongitude() && this.latitude === other.getLatitude() && this.height === other.getHeight();
    }


    /**
     * Получить копию объекта
     * @method copy
     * @return {Geodetic3D} Копия объекта
     */
    copy() {
        return new Geodetic3D( this.longitude, this.latitude, this.height );
    }
}
