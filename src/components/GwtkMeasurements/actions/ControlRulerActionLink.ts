/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик измерения длины                    *
 *                                                                  *
 *******************************************************************/

import GwtkMeasurementsTask, {
    CREATE_MODE_ACTION,
    DELETE_MODE_ACTION,
    EDIT_MODE_ACTION,
    GwtkMeasurementTaskState
} from '@/components/GwtkMeasurements/task/GwtkMeasurementsTask';
import ActionLink from '~/taskmanager/ActionLink';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import i18n from '@/plugins/i18n';
import Utils from '~/services/Utils';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import {
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    Unit,
    UnitText,
    WorkspaceValues,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY
} from '~/utils/WorkspaceManager';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { CalculateLengthResponse } from '~/services/RequestServices/RestService/Types';
import { MapPoint } from '~/geometry/MapPoint';
import MapCalculations from '~/geo/MapCalculations';
import GeoPoint from '~/geo/GeoPoint';
import Fill from '~/style/Fill';
import HtmlLayer from '~/maplayers/HtmlLayer';
import LengthsTooltipRenderable from '@/components/GwtkMeasurements/actions/LengthsTooltipRenderable';
import { CURSOR_TYPE } from '~/types/Types';
import { DataChangedEvent } from '~/taskmanager/TaskManager';


/**
 * Обработчик измерения длины
 * @class ControlRulerActionLink
 * @extends ActionLink<GwtkMeasurementsTask>
 */
export default class ControlRulerActionLink extends ActionLink<GwtkMeasurementsTask> {

    private htmlLayer!: HtmlLayer;

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObject {MapObject}
     */
    private mapObject!: MapObject;

    private curveMapObject!: MapObject;

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        CREATE_MODE_ACTION, EDIT_MODE_ACTION, DELETE_MODE_ACTION
    ];

    private objectLength: string | undefined;

    constructor( task: GwtkMeasurementsTask, id: string ) {
        super( task, id );

        this.createMapObjects();
    }

    private createMapObjects() {
        this.htmlLayer = new HtmlLayer( this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        }, new LengthsTooltipRenderable() );

        this.map.vectorLayers.push( this.htmlLayer );

        this.curveMapObject = this.parentTask.vectorLayer.createMapObject( MapObjectType.LineString, { local: LOCALE.Line } );
        this.curveMapObject.commit();

        this.mapObject = this.parentTask.vectorLayer.createMapObject( MapObjectType.LineString, { local: LOCALE.Line } );
        this.mapObject.commit();

        this.updateStyle();

        this.parentTask.vectorLayer.classifier.getObjectSemantics( '' ).then( result => {

            let semanticDescription = result.find( semantic => semantic.code === '9' );
            if ( semanticDescription ) {
                this.mapObject.addSemantic( {
                    key: semanticDescription.shortname,
                    name: semanticDescription.name,
                    value: this.map.translate( 'Line' )
                } );
                this.curveMapObject.addSemantic( {
                    key: semanticDescription.shortname,
                    name: semanticDescription.name,
                    value: this.map.translate( 'Orthodromy' )
                } );
            }
        } );
    }

    async destroy() {
        super.destroy();
        this.parentTask.setResult();
        this.parentTask.removeLinkPanel();
        this.map.clearActiveObject();

        if ( this.htmlLayer.getMapObjectsCount() === 0 ) {
            this.map.closeLayer( this.htmlLayer.xId );
            this.parentTask.vectorLayer.startTransaction();
            await this.mapObject.delete();
            await this.curveMapObject.delete();
            await this.parentTask.vectorLayer.commitTransaction();
        }

        this.mapWindow.setCursor( CURSOR_TYPE.default );

    }

    setup() {

        const mapActiveObject = this.map.getActiveObject();
        if ( mapActiveObject && mapActiveObject.type === MapObjectType.LineString ) {
            this.mapObject.updateGeometryFrom( mapActiveObject );
        }
        this.map.setActiveObject( this.mapObject );

        this.parentTask.createLinkPanel( this.widgetParams );

        this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.To measure the length, pick points on the map' ) );

        if ( this.mapObject.getPointList().length === 0 ) {
            this.setLinkAction( CREATE_MODE_ACTION );
            this.objectLength = undefined;
        } else {
            this.setLinkAction( EDIT_MODE_ACTION );
            this.run();
        }

    }

    commit() {
        super.commit();
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            this.setLinkAction( EDIT_MODE_ACTION );
            this.run();
        } else if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            this.action.commit();
            this.run();
        } else {
            this.setLinkAction();
        }
    }

    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if ( (this.action && this.action.id === EDIT_MODE_ACTION) && !this.action.canMapMove() ) {
            this.htmlLayer.clear();
            this.rebuildCurve();
        }
    }

    onMouseClick( event: MouseDeviceEvent ): void | true {
        const result = super.onMouseClick( event );
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            this.rebuildCurve();
        }
        return result;
    }

    private rebuildCurve() {
        this.curveMapObject.removeAllPoints();

        const points = this.mapObject.getPointList();

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
        this.curveMapObject.commit();
    }

    revert() {
        this.setLinkAction();
        this.quit();
    }

    run() {
        this.mapObject.calcLength( { getLineLengthBetweenPoint: '1' } ).then( ( result?: CalculateLengthResponse ) => {
            if ( result && result.perimeter > 0 ) {
                this.objectLength = i18n.tc( 'phrases.Length' ).toUpperCase() + ': ' + this.linearMetersToUnits( result.perimeter ).text;

                this.htmlLayer.clear();

                const mapObjectPointList = this.mapObject.getPointList();
                if ( mapObjectPointList.length > 0 ) {
                    for ( let numberSegment = 0; numberSegment < result.linesLength.length; numberSegment++ ) {
                        let point1 = mapObjectPointList[ numberSegment ];
                        let point2 = mapObjectPointList[ numberSegment + 1 ];
                        const pointCenter = new MapPoint( ((point1.x + point2.x) / 2), ((point1.y + point2.y) / 2) );

                        const pointObject = this.htmlLayer.createMapObject( MapObjectType.Point, {
                            semantics: [{
                                key: 'segment_length',
                                name: '',
                                value: this.linearMetersToUnits( result.linesLength[ numberSegment ] ).text || ''

                            }, {
                                key: 'segment_color',
                                name: '',
                                value: 'blue'
                            }]
                        } );
                        pointObject.addPoint( pointCenter );
                        pointObject.commit();
                    }

                    const pointObject = this.htmlLayer.createMapObject( MapObjectType.Point, {
                        semantics: [{
                            key: 'segment_length',
                            name: '',
                            value: this.linearMetersToUnits( result.perimeter ).text || ''

                        }, {
                            key: 'segment_color',
                            name: '',
                            value: 'red'
                        }, {
                            key: 'layer_xid',
                            name: '',
                            value: this.parentTask.vectorLayer.xId
                        }, {
                            key: 'object_gmlids',
                            name: '',
                            value: this.mapObject.gmlId + ',' + this.curveMapObject.gmlId
                        }]
                    } );
                    pointObject.addPoint( mapObjectPointList[ mapObjectPointList.length - 1 ] );
                    pointObject.commit();
                }
            } else {
                this.objectLength = undefined;
                this.htmlLayer.clear();
            }
            this.parentTask.setResult( this.objectLength );
        } ).catch( error => {
            this.map.writeProtocolMessage( {
                text: i18n.tc( 'phrases.Measurements' ) + '. ' + i18n.tc( 'phrases.Failed to get data' ) + '!',
                description: error,
                type: LogEventType.Error,
                display: true
            } );
        } );
    }

    setState<K extends keyof GwtkMeasurementTaskState>( key: K, value: GwtkMeasurementTaskState[K] ) {
        switch ( key ) {
            case CREATE_MODE_ACTION:
                if ( this.action?.id === EDIT_MODE_ACTION ) {
                    this.closeChildAction();
                    this.createMapObjects();
                    this.map.setActiveObject( this.mapObject );
                    this.setLinkAction( CREATE_MODE_ACTION );
                }
                break;
            case DELETE_MODE_ACTION:
                this.mapObject.removeAllPoints();
                this.curveMapObject.removeAllPoints();
                this.htmlLayer.clear();
                this.map.setActiveObject( this.mapObject );
                this.setLinkAction( CREATE_MODE_ACTION );
                break;
            default:
                super.setState( key, value );
        }
    }

    /**
     * Преобразовать значение длины из м в текущие единицы измерения
     * @method linearMetersToUnits
     * @param length  длина линии в метрах
     * @return {Object}
     */
    private linearMetersToUnits( length: number ) {
        if ( length === undefined || length == null )
            return {};
        const units: Unit = this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER );
        let perimeter = Utils.linearMetersToUnits( length, units );
        let d = Number( perimeter.value.toFixed( 3 ) ).toString();
        let unitsText = i18n.tc( 'phrases.' + UnitText[ units ] );
        switch ( units ) {
            case Unit.Foots:
                d = Number( perimeter.value.toFixed( 3 ) ).toString();
                break;
            case Unit.NauticalMiles:
                d = Number( perimeter.value.toFixed( 3 ) ).toString();
                break;
            case Unit.Meters:
                d = Number( perimeter.value.toFixed( 2 ) ).toString();
                break;
            case Unit.Kilometers:
                if ( perimeter.value >= 0.001 ) {
                    d = Number( perimeter.value.toFixed( 3 ) ).toString();
                } else {
                    d = Number( (perimeter.value * 1000).toFixed( 3 ) ).toString();
                    unitsText = i18n.tc( 'phrases.' + UnitText[ Unit.Meters ] );
                }
                break;
        }

        return { 'perimeter': perimeter, 'unit': units, 'text': d + ' ' + unitsText };
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        return super.canSelectThisObject( mapObject ) && this.mapObject.equals( mapObject );
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        super.onWorkspaceChanged( type );

        if ( [PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY].indexOf( type ) !== -1 ) {
            this.updateStyle();
        }

        if ( type === PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER ) {
            this.map.requestRender();
        }
    }

    private updateStyle() {
        const newStyle = new Style( {
            stroke: new Stroke( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY ),
                width: '3px',
                linejoin: 'round'
            } )
        } );

        this.mapObject.clearStyles();
        this.mapObject.addStyle( newStyle );
        this.mapObject.commit();

        const newCurveStyle = new Style( {
            stroke: new Stroke( {
                color: '#008000',//ортодром всегда зеленый
                width: '2px',
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY )
                // dasharray: '5, 5' //иначе SVG грузит GPU на больших расстояниях ортодрома
            } ),
            fill: new Fill( {
                opacity: 0
            } )
        } );

        this.curveMapObject.clearStyles();
        this.curveMapObject.addStyle( newCurveStyle );
        this.curveMapObject.commit();
    }

    onWorkspaceReset() {
        super.onWorkspaceReset();
        this.run();
    }

    onDataChanged( event: DataChangedEvent ) {
        super.onDataChanged( event );
        if ( event.type === 'content' && !this.map.getVectorLayerByxId( this.htmlLayer.xId ) ) {
            this.setState( CREATE_MODE_ACTION, true );
        }
    }
}
