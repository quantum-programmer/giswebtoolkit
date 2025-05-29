/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик измерения углов                    *
 *                                                                  *
 *******************************************************************/

import GwtkMeasurementsTask, {
    CREATE_MODE_ACTION,
    DELETE_MODE_ACTION,
    EDIT_MODE_ACTION,
    GwtkMeasurementTaskState
} from '@/components/GwtkMeasurements/task/GwtkMeasurementsTask';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import ActionLink from '~/taskmanager/ActionLink';
import MapObject, { CalcAngleResultType, MapObjectType } from '~/mapobject/MapObject';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import i18n from '@/plugins/i18n';
import Utils from '~/services/Utils';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import {
    AngleUnit,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE,
    UnitText,
    WorkspaceValues,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY
} from '~/utils/WorkspaceManager';
import PixelPoint from '~/geometry/PixelPoint';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import Trigonometry from '~/geo/Trigonometry';
import HtmlLayer from '~/maplayers/HtmlLayer';
import AngleTooltipRenderable from '@/components/GwtkMeasurements/actions/AngleTooltipRenderable';
import { CURSOR_TYPE } from '~/types/Types';
import { DataChangedEvent } from '~/taskmanager/TaskManager';


/**
 * Обработчик измерения площади
 * @class ControlAngleActionLink
 * @extends ActionLink<GwtkMeasurementsTask>
 */
export default class ControlAngleActionLink extends ActionLink<GwtkMeasurementsTask> {


    private htmlLayer!: HtmlLayer;

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObject {MapObject}
     */
    private mapObject!: MapObject;

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObjectAngleSector {MapObject}
     */
    private mapObjectAngleSector!: MapObject;

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        CREATE_MODE_ACTION, EDIT_MODE_ACTION, DELETE_MODE_ACTION
    ];

    private readonly MAX_POINT_COUNT = 3;

    constructor( task: GwtkMeasurementsTask, id: string ) {
        super( task, id );
        this.createMapObjects();
    }

    private createMapObjects() {
        this.htmlLayer = new HtmlLayer( this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        }, new AngleTooltipRenderable() );

        this.map.vectorLayers.push( this.htmlLayer );


        this.mapObject = this.parentTask.vectorLayer.createMapObject( MapObjectType.MultiLineString, { local: LOCALE.Line } );
        this.mapObject.commit();
        this.mapObjectAngleSector = this.parentTask.vectorLayer.createMapObject( MapObjectType.LineString, { local: LOCALE.Line } );
        this.mapObjectAngleSector.commit();
        this.updateStyle();

        this.parentTask.vectorLayer.classifier.getObjectSemantics( '' ).then( result => {

            let semanticDescription = result.find( semantic => semantic.code === '9' );
            if ( semanticDescription ) {
                this.mapObject.addSemantic( {
                    key: semanticDescription.shortname,
                    name: semanticDescription.name,
                    value: this.map.translate( 'Line' )
                } );
                this.mapObjectAngleSector.addSemantic( {
                    key: semanticDescription.shortname,
                    name: semanticDescription.name,
                    value: this.map.translate( 'Angle' )
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
            await this.mapObjectAngleSector.delete();
            await this.parentTask.vectorLayer.commitTransaction();
        }

        this.mapWindow.setCursor( CURSOR_TYPE.default );
    }

    setup() {
        this.map.setActiveObject( this.mapObject );

        this.parentTask.createLinkPanel( this.widgetParams );

        if ( this.mapObject.getPointList().length > 0 ) {
            this.mapObject.removeAllPoints();
            this.mapObjectAngleSector.removeAllPoints();

            this.mapObject.commit();
            this.mapObjectAngleSector.commit();

        }
        this.setLinkAction( CREATE_MODE_ACTION );

        this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.To measure the angle, pick three points on the map' ) );
    }

    commit() {
        super.commit();
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            this.setLinkAction();
            this.map.setActiveObject( this.mapObject );
            if ( this.mapObject.getPointList().length == this.MAX_POINT_COUNT ) {
                this.setLinkAction( EDIT_MODE_ACTION );
            } else {
                this.setLinkAction( CREATE_MODE_ACTION );
            }
        } else if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            this.action.commit();
            this.run();
        } else {
            this.setLinkAction();
        }
    }

    revert() {
        this.setLinkAction();
        this.quit();
    }

    run() {

        if ( this.mapObject.getPointList().length < 3 ) {
            this.parentTask.setResult( i18n.tc( 'phrases.To measure the angle, pick three points on the map' ) );
            return;
        }
        this.mapObject.calcAngle().then( result => {
            if ( result ) {
                this.htmlLayer.clear();
                this.updateAngleSector( result );
                this.parentTask.setResult( `${i18n.tc( 'phrases.ANGLE' )}:  ${this.degreesToUnits( result.resultAngle.toFixed( 6 ) )}` );
            }
        } ).catch( error => {
            this.map.writeProtocolMessage( {
                text: i18n.tc( 'phrases.Measurements' ) + '. ' + i18n.tc( 'phrases.Failed to get data' ) + '!',
                description: error,
                type: LogEventType.Error,
                display: true
            } );
        } );
    }


    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if ( (this.action && this.action.id === EDIT_MODE_ACTION) && !this.action.canMapMove() ) {
            this.mapObjectAngleSector.removeAllPoints();
            this.mapObjectAngleSector.commit();
            this.htmlLayer.clear();
        }
    }


    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            if ( this.MAX_POINT_COUNT <= this.mapObject.getPointList().length ) {
                this.parentTask.quitAction( this.action.id );
            }
        }
    }

    selectObject( mapObject?: MapObject ) {
        super.selectObject( mapObject );
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            this.mapObjectAngleSector.removeAllPoints();
            this.run();
        }
    }

    onDataChanged( event: DataChangedEvent ) {
        super.onDataChanged( event );
        if ( event.type === 'content' && !this.map.getVectorLayerByxId( this.htmlLayer.xId ) ) {
            this.setState( CREATE_MODE_ACTION, true );
        }
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( type === PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE ) {
            this.map.requestRender();
        }

        if ( [PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY].indexOf( type ) !== -1 ) {
            this.updateStyle();
        }
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
                this.mapObjectAngleSector.removeAllPoints();

                this.mapObject.commit();
                this.mapObjectAngleSector.commit();
                this.htmlLayer.clear();
                this.map.setActiveObject( this.mapObject );
                this.setLinkAction( CREATE_MODE_ACTION );
                break;
            default:
                super.setState( key, value );
        }
    }


    /**
     * Конвертация результата измерения угла
     * @private
     * @method degreesToUnits
     * @param degrees {string} значение угла в градусах
     * @return {string} Результат в нужных единицах измерения
     */
    private degreesToUnits( degrees: string ): string {
        const units = this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_ANGLE );
        const unitText = UnitText[ units ];

        const angle = Utils.degreesToUnits( parseFloat( degrees ), units );

        let result;
        switch ( angle.unit ) {
            case AngleUnit.Radians:
                result = angle.value.toFixed( 6 ) + ' ' + i18n.tc( 'phrases.' + unitText );
                break;
            case AngleUnit.DegreesMinutesSeconds:
                const [iDegrees, iMinutes, seconds] = angle.value;
                result = Utils.createDegreesMinutesSecondsStr( iDegrees, iMinutes, seconds );
                break;
            default:
                result = angle.value + UnitText[ AngleUnit.Degrees ];
        }
        return result;
    }

    /**
     * Отобразить дугу для измеренного угла
     * @private
     */
    private updateAngleSector( angleResult: CalcAngleResultType ) {
        if ( this.mapObject.getPointList().length < 3 ) {
            return;
        }

        let pixelCoord: PixelPoint | undefined;
        let xValue = 0;
        const vectorRotateText = vec2.create();

        this.mapObjectAngleSector.removeAllPoints();

        // рассчитать угол для построения на карте
        const [coord0, coord1, coord2] = this.mapObject.getPointList();
        const vector1 = vec2.create();
        const vector2 = vec2.create();
        const vector22 = vec2.create();

        if ( coord0 && coord1 && coord2 ) {
            vec2.setValues( vector1, coord0.x - coord1.x, coord0.y - coord1.y );

            vec2.setValues( vector2, coord2.x - coord1.x, coord2.y - coord1.y );
            vec2.setValues( vector22, coord1.x - coord2.x, coord1.y - coord2.y );
        }

        let angleBetween = vec2.angleBetween( vector1, vector2 );
        if ( vec2.rotationDirection( vector1, vector2 ) ) {
            angleBetween = Math.PI * 2 - angleBetween;
        }

        const pointCenterGeo = this.mapObject.getPointList()[ 1 ].toGeoPoint();
        if ( pointCenterGeo ) {
            let flag = false;
            const pointCenter = this.mapWindow.getMap().geoToPixel( pointCenterGeo, this.mapWindow.getMap().getZoom() );
            pixelCoord = pointCenter;
            const pointGeo1 = this.mapObject.getPointList()[ 0 ].toGeoPoint();
            const pointGeo2 = this.mapObject.getPointList()[ 2 ].toGeoPoint();
            let radius = 25;
            if ( pointGeo1 && pointGeo2 ) {
                const point1 = this.mapWindow.getMap().geoToPixel( pointGeo1, this.mapWindow.getMap().getZoom() );
                const point2 = this.mapWindow.getMap().geoToPixel( pointGeo2, this.mapWindow.getMap().getZoom() );

                const distancePoint1ToCenter = point1.distanceTo( pointCenter );
                const distancePoint2ToCenter = point2.distanceTo( pointCenter );

                const length = Math.min( distancePoint1ToCenter, distancePoint2ToCenter );

                radius = Math.min( 0.5 * length, radius );

                const xPoint1 = pointCenter.x + radius * (point1.x - pointCenter.x) / distancePoint1ToCenter;
                const yPoint1 = pointCenter.y + radius * (point1.y - pointCenter.y) / distancePoint1ToCenter;
                const xPoint2 = pointCenter.x + radius * (point2.x - pointCenter.x) / distancePoint2ToCenter;
                const yPoint2 = pointCenter.y + radius * (point2.y - pointCenter.y) / distancePoint2ToCenter;

                if ( xPoint2 && yPoint2 ) {
                    const pointXYCircle = new PixelPoint( xPoint2, yPoint2 );
                    const pointXYPlace = this.mapWindow.getMap().pixelToPlane( pointXYCircle );
                    if ( pointXYPlace ) {
                        this.mapObjectAngleSector.addPoint( pointXYPlace );
                    }
                }

                let angleRotate = 0.01 + Math.PI / 2;
                while ( angleRotate < angleBetween + Math.PI / 2 ) {
                    let vectorRotate = vec2.create();
                    vec2.rotate( vector22, angleRotate, vectorRotate );

                    const normalizedVectorRotate = vec2.normalize( vectorRotate, vec2.create() );
                    const xPointC = pointCenter.x + radius * normalizedVectorRotate[ 0 ];
                    const yPointC = pointCenter.y + radius * normalizedVectorRotate[ 1 ];

                    if ( xPointC && yPointC ) {
                        const pointXYCircle = new PixelPoint( xPointC, yPointC );
                        const pointXYPlace = this.mapWindow.getMap().pixelToPlane( pointXYCircle );
                        if ( pointXYPlace ) {
                            this.mapObjectAngleSector.addPoint( pointXYPlace );
                            if ( angleRotate >= (angleBetween / 2 + Math.PI / 2) && !flag ) {
                                flag = !flag;
                                xValue = xPointC - pointCenter.x;
                                vec2.setValues( vectorRotateText, vectorRotate[ 0 ], vectorRotate[ 1 ] );
                            }
                        }
                    }
                    angleRotate += 0.01;
                }

                if ( xPoint1 && yPoint1 ) {
                    const pointXYCircle = new PixelPoint( xPoint1, yPoint1 );
                    const pointXYPlace = this.mapWindow.getMap().pixelToPlane( pointXYCircle );
                    if ( pointXYPlace ) {
                        this.mapObjectAngleSector.addPoint( pointXYPlace );
                    }
                }
            }
        }

        if ( pixelCoord ) {

            const vectorOffset = vec2.create();

            vec2.normalize( vectorRotateText );

            angleBetween = Trigonometry.toDegrees( angleBetween );

            let radiusText = 0;
            if ( xValue > 24 ) {
                radiusText = 25;
                vectorOffset[ 1 ] = 12;
            }
            if ( xValue < 0 && Math.abs( xValue ) > 24 ) {
                radiusText = 120;
                vectorOffset[ 1 ] = 12;
            }
            if ( Math.abs( xValue ) < 24 ) {
                vectorOffset[ 0 ] = -45;
                if ( (angleBetween - 90) > 180 ) {
                    radiusText = 55;
                } else {
                    if ( (angleBetween - 90) < 90 ) {
                        radiusText = 80;
                    } else {
                        radiusText = 50;
                    }
                }
            }

            vec2.scale( vectorRotateText, radiusText );
            vec2.add( vectorRotateText, vectorOffset );


            const pointObject = new MapObject( this.htmlLayer, MapObjectType.Point, {
                semantics: [
                    {
                        key: 'angle_value',
                        name: '',
                        value: this.degreesToUnits( angleResult.resultAngle.toFixed( 6 ) )

                    },
                    {
                        key: 'text_offset_x',
                        name: '',
                        value: vectorRotateText[ 0 ] + ''
                    },
                    {
                        key: 'text_offset_y',
                        name: '',
                        value: vectorRotateText[ 1 ] + ''
                    },
                    {
                        key: 'layer_xid',
                        name: '',
                        value: this.parentTask.vectorLayer.xId
                    },
                    {
                        key: 'object_gmlids',
                        name: '',
                        value: this.mapObject.gmlId + ',' + this.mapObjectAngleSector.gmlId
                    }
                ]
            } );

            pointObject.addPoint( this.mapObject.getPointList()[ 1 ] );
            pointObject.commit();

            this.mapObjectAngleSector.commit();
        }

    }

    private updateStyle() {
        const newStyle = new Style( {
            stroke: new Stroke( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY ),
                width: '2px',
                linejoin: 'round'
            } )
        } );

        this.mapObject.clearStyles();
        this.mapObject.addStyle( newStyle );
        this.mapObject.commit();

        this.mapObjectAngleSector.clearStyles();
        this.mapObjectAngleSector.addStyle( newStyle );
        this.mapObjectAngleSector.commit();
    }

}
