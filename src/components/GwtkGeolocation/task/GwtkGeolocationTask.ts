/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент "Мое местоположение"                     *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { BrowserService } from '~/services/BrowserService';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import GeoPoint from '~/geo/GeoPoint';
import SVGrenderer, { GEOLOCATION_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import i18n from '@/plugins/i18n';
import MarkerStyle from '~/style/MarkerStyle';
import { MapPoint } from '~/geometry/MapPoint';
import { LogEventType } from '~/types/CommonTypes';


/**
 * Компонент "Мое местоположение"
 * @class GwtkGeolocationTask
 * @extends Task
 */
export default class GwtkGeolocationTask extends Task {

    private readonly mapObject;

    private watchUserNumber?: number;

    /**
     * @constructor GwtkGeolocationTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.mapObject = new MapObject( tempVectorLayer, MapObjectType.Point );
        this.mapObject.addPoint( new MapPoint( 0, 0, 0, this.map.ProjectionId ) );
        this.mapObject.isDirty = false;
    }

    setup() {
        // Запросить координату
        this.watchUserNumber = BrowserService.watchUserPosition( ( result ) => {
            this.goToPosition( result.coords );
        }, ( reason: GeolocationPositionError ) => {
            this.map.writeProtocolMessage( {
                text: i18n.tc( 'phrases.Geolocation' ) + '. ' + i18n.tc( 'phrases.Failed to get data' ) + '.',
                description: reason.message,
                type: LogEventType.Error
            } );

            if ( reason.code === reason.PERMISSION_DENIED ) {
                this.map.writeProtocolMessage(
                    {
                        text: <string>i18n.t( 'geolocation.Permission for geolocation denied' ),
                        display: true
                    }
                );
            } else if ( reason.code === reason.POSITION_UNAVAILABLE ) {
                this.map.writeProtocolMessage(
                    {
                        text: <string>i18n.t( 'geolocation.Position unavailable' ),
                        display: true
                    }
                );
            } else if ( reason.code === reason.TIMEOUT ) {
                this.map.writeProtocolMessage(
                    {
                        text: <string>i18n.t( 'geolocation.Geolocation activation time exceeded' ),
                        display: true
                    }
                );
            }

            this.mapWindow.getTaskManager().detachTask( this.id );
        } );
    }

    protected destroy() {
        super.destroy();
        this.map.requestRender();
        if ( this.watchUserNumber !== undefined ) {
            BrowserService.stopWatchUserPosition( this.watchUserNumber );
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.mapObject.isDirty ) {
            this.mapObject.isDirty = false;
            this.map.requestRender();
        }

    }

    onPostRender( renderer: SVGrenderer ) {
        this.map.mapObjectsViewer.drawMapObject( renderer, this.mapObject, new Style( { marker: new MarkerStyle( { markerId: GEOLOCATION_SVG_MARKER_ID } ) } ) );
    }

    /**
     * Переход в точку
     * @private
     * @method goToPosition
     * @param coords {GeolocationCoordinates} Описание точки
     */
    private goToPosition( coords: GeolocationCoordinates ) {

        const mapPoint = new GeoPoint( coords.longitude, coords.latitude, coords.altitude || 0, this.map.ProjectionId ).toMapPoint();

        if ( mapPoint ) {
            this.map.setViewport( mapPoint );
            this.map.overlayRefresh();
            this.mapObject.updatePoint( mapPoint, {
                positionNumber: 0,
                contourNumber: 0,
                objectNumber: 0
            } );
        }
    }
}
