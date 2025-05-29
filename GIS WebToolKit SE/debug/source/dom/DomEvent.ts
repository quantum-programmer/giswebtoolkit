/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                             DomEvent                             *
 *                                                                  *
 *******************************************************************/
import PixelPoint from '~/geometry/PixelPoint';

/**
 * Методы обработки событий
 * @static
 * @class DomEvent
 */
export default class DomEvent {

    /**
     * Получить координаты курсора
     * @static
     * @method getMousePosition
     * @param event {MouseEvent} Событие
     * @param [container] {HTMLDivElement} Контейнер, относительно которого пересчитать координаты
     * @return {PixelPoint} Координаты курсора в пикселах
     */
    static getMousePosition( event: MouseEvent, container?: HTMLDivElement ): PixelPoint {
        const cX = event.clientX;
        const cY = event.clientY;
        if ( !container ) {
            return new PixelPoint( cX, cY );
        }
        const rect = container.getBoundingClientRect();
        return new PixelPoint(
            Math.floor( cX - rect.left - container.clientLeft ),
            Math.floor( cY - rect.top - container.clientTop ) );
    }

    /**
     * Получить величину прокрутки колеса мыши
     * @static
     * @method getWheelDelta
     * @param event {WheelEvent} Событие
     * @return {number} Величина прокрутки
     */
    static getWheelDelta( event: WheelEvent ): number {
        let delta = 0;

        if ( event.detail ) {
            delta = -event.detail / 3;
        } else if ( event.deltaY ) {
            delta = -event.deltaY / 100; // для FireFox
        }

        if ( delta != Math.round( delta ) ) {
            delta = delta > 0 ? 1 : -1;// для IE 11
        }

        return delta;
    }

    // /**
    //  * Обновить координаты точки под курсором в панели координат
    //  * @static
    //  * @deprecated
    //  * @method getMouseGeoCoordinates
    //  * @param event {MouseEvent} Событие
    //  * @param map {GwtkMap} Экземпляр карты
    //  */
    // static getMouseGeoCoordinates( event: MouseEvent, map: GwtkMap ): void {
    //     const point = this.getMousePosition( event, map.panes.eventPane );
    //     const coord = map.tiles.getLayersPointProjected( point );
    //     if ( coord ) {
    //         const geo = GWTK.projection.xy2geo( map.options.crs, coord.y, coord.x );
    //         if ( geo[ 1 ] > 180 ) {
    //             geo[ 1 ] = geo[ 1 ] - 360.0;
    //         }
    //         if ( geo[ 1 ] < -180 ) {
    //             geo[ 1 ] = geo[ 1 ] + 360.0;
    //         }
    //         map.panes.coordPane.innerHTML = GWTK.toLatLng( geo ).toDegreesMinutesSecondsString();
    //     }
    // }
}


