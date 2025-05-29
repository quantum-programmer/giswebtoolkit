/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик добавления точек объекта               *
 *                                                                  *
 *******************************************************************/
import AppendPointAction from '~/systemActions/AppendPointAction';
import GwtkMeasurementsTask from '@/components/GwtkMeasurements/task/GwtkMeasurementsTask';
import {
    PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import SVGrenderer from '~/renderer/SVGrenderer';
import MapCalculations from '~/geo/MapCalculations';
import GeoPoint from '~/geo/GeoPoint';
import { MouseDeviceEvent } from '~/input/MouseDevice';


/**
 * Обработчик добавления точек объекта измерения
 * @class AppendPointActionMeasurement
 * @extends AppendPointAction
 */
export default class AppendPointActionMeasurement extends AppendPointAction<GwtkMeasurementsTask> {

    private readonly curveMapObject: MapObject;

    private readonly curveMapObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'black',
            width: '1px',
            dasharray: '5, 5'
        } ),
        fill: new Fill( {
            opacity: 0
        } )
    } );

    constructor( task: GwtkMeasurementsTask, id: string ) {
        super( task, id );
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        this.curveMapObject = new MapObject( tempVectorLayer, MapObjectType.LineString, { local: LOCALE.Line } );
    }

    setup() {
        super.setup();
        this.updateStyle();
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( [PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY].indexOf( type ) !== -1 ) {
            this.updateStyle();
        }
    }

    onWorkspaceReset() {
        this.updateStyle();
    }

    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if ( this.currentObject?.type === MapObjectType.LineString ) {
            this.rebuildCurve();
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.currentObject?.type === MapObjectType.LineString ) {
            this.curveMapObject.removeAllPoints();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        super.onPostRender( renderer );
        if ( this.currentObject?.type === MapObjectType.LineString ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.curveMapObject, this.curveMapObjectStyle );
        }
    }

    private rebuildCurve() {
        this.curveMapObject.removeAllPoints();

        const points = this.dashedObject.getPointList();

        for ( let i = 0; i < points.length - 1; i++ ) {
            const startGeoPoint = points[ i ].toGeoPoint();
            const endGeoPoint = points[ i + 1 ].toGeoPoint();
            if ( startGeoPoint && endGeoPoint ) {
                const result = MapCalculations.buildOrthodrome( startGeoPoint.getLatitude(), startGeoPoint.getLongitude(), endGeoPoint.getLatitude(), endGeoPoint.getLongitude() );
                if ( result ) {
                    result.forEach( point => this.curveMapObject.addGeoPoint( new GeoPoint( point[ 1 ], point[ 0 ], 0, this.curveMapObject.vectorLayer.projectionId ) ) );
                }
            }
        }
    }

    private updateStyle() {
        this.currentObjectStyle = new Style( {
            stroke: new Stroke( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR ),
                width: '2px',
                linejoin: 'round'
            } ),
            fill: new Fill( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY )
            } )
        } );

        this.map.requestRender();
    }

    commit() {
        super.commit();
        this.currentObject?.commit();
    }
}
