/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик измерения площади                  *
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
import Fill from '~/style/Fill';
import i18n from '@/plugins/i18n';
import Utils from '~/services/Utils';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import {
    PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA,
    PROJECT_SETTINGS_MEASUREMENT_UNITS_PERIMETER,
    Unit,
    UnitText,
    WorkspaceValues,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY
} from '~/utils/WorkspaceManager';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import HtmlLayer from '~/maplayers/HtmlLayer';
import AreaTooltipRenderable from '@/components/GwtkMeasurements/actions/AreaTooltipRenderable';
import { CURSOR_TYPE } from '~/types/Types';
import { DataChangedEvent } from '~/taskmanager/TaskManager';


/**
 * Обработчик измерения площади
 * @class ControlAreaActionLink
 * @extends ActionLink<GwtkMeasurementsTask>
 */
export default class ControlAreaActionLink extends ActionLink<GwtkMeasurementsTask> {

    private htmlLayer!: HtmlLayer;

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObject {MapObject}
     */
    private mapObject!: MapObject;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        CREATE_MODE_ACTION, EDIT_MODE_ACTION, DELETE_MODE_ACTION
    ];

    private objectArea: string | undefined;

    private readonly MIN_POINT_COUNT = 4;

    constructor( task: GwtkMeasurementsTask, id: string ) {
        super( task, id );
        this.createMapObjects();
    }

    createMapObjects() {
        this.htmlLayer = new HtmlLayer( this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        }, new AreaTooltipRenderable() );

        this.map.vectorLayers.push( this.htmlLayer );

        this.mapObject = this.parentTask.vectorLayer.createMapObject( MapObjectType.Polygon, { local: LOCALE.Plane } );
        this.mapObject.commit();

        this.updateStyle();

        this.parentTask.vectorLayer.classifier.getObjectSemantics( '' ).then( result => {
            let semanticDescription = result.find( semantic => semantic.code === '9' );
            if ( semanticDescription ) {
                this.mapObject.addSemantic( {
                    key: semanticDescription.shortname,
                    name: semanticDescription.name,
                    value: this.map.translate( 'Area' )
                } );
            }
        } );
    }

    destroy() {
        super.destroy();
        this.parentTask.setResult();
        this.parentTask.removeLinkPanel();
        this.map.clearActiveObject();

        if ( this.htmlLayer.getMapObjectsCount() === 0 ) {
            this.map.closeLayer( this.htmlLayer.xId );
            this.mapObject.delete();
        }

        this.mapWindow.setCursor( CURSOR_TYPE.default );
    }

    setup() {

        const mapActiveObject = this.map.getActiveObject();
        if ( mapActiveObject && mapActiveObject.type === MapObjectType.Polygon ) {
            this.mapObject.updateGeometryFrom( mapActiveObject );
        }
        this.map.setActiveObject( this.mapObject );

        this.parentTask.createLinkPanel( this.widgetParams );

        if ( this.mapObject.getPointList().length == 0 ) {
            this.setLinkAction( CREATE_MODE_ACTION );
            this.showMessage();
        } else {
            this.setLinkAction( EDIT_MODE_ACTION );
            this.run();
        }
    }

    commit() {
        super.commit();
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            this.setLinkAction();
            if ( this.mapObject.getPointList().length >= this.MIN_POINT_COUNT ) {
                this.map.setActiveObject( this.mapObject );
                this.setLinkAction( EDIT_MODE_ACTION );
                this.run();
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

    onMouseMove( event: MouseDeviceEvent ) {
        super.onMouseMove( event );
        if ( (this.action && this.action.id === EDIT_MODE_ACTION) && !this.action.canMapMove() ) {
            this.htmlLayer.clear();
        }
    }

    revert() {
        this.setLinkAction();
        this.quit();
    }

    run() {
        if ( this.mapObject.getPointList().length < this.MIN_POINT_COUNT ) {
            this.objectArea = undefined;
            this.parentTask.setResult();
            this.htmlLayer.clear();
        }

        this.mapObject.calcArea().then( result => {
            if ( result ) {
                const resultInUnits = this.squareMetersToUnits( result );

                this.objectArea = i18n.tc( 'phrases.Area' ).toUpperCase() + ': ' + resultInUnits.text;

                this.htmlLayer.clear();

                const mapObjectPointList = this.mapObject.getPointList();
                if ( mapObjectPointList.length > 0 ) {

                    const pointObject = new MapObject( this.htmlLayer, MapObjectType.Point, {
                        semantics: [{
                            key: 'area',
                            name: '',
                            value: resultInUnits.text || ''
                        }, {
                            key: 'layer_xid',
                            name: '',
                            value: this.parentTask.vectorLayer.xId
                        }, {
                            key: 'object_gmlids',
                            name: '',
                            value: this.mapObject.gmlId
                        }]
                    } );
                    pointObject.addPoint( this.mapObject.getCenter() );
                    pointObject.commit();
                }
            } else {
                this.objectArea = undefined;
                this.htmlLayer.clear();
            }
            this.parentTask.setResult( this.objectArea );
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
                this.htmlLayer.clear();
                this.map.setActiveObject( this.mapObject );
                this.setLinkAction( CREATE_MODE_ACTION );
                break;
            default:
                super.setState( key, value );
        }
    }

    showMessage() {
        this.mapWindow.addSnackBarMessage( i18n.tc( 'phrases.To measure the area, pick at least three points on the map' ) );
    }

    /**
     * Сформировать строку результата измерения площади
     * @param areaMeters - значение площади в кв. м
     */
    squareMetersToUnits( areaMeters: number ) {
        if ( typeof areaMeters === 'undefined' )
            return {};
        const unit = this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_UNITS_AREA ); // установленные единицы измерения площади
        let area = Utils.squareMetersToUnits( areaMeters, unit );
        let unitText = ' ' + i18n.tc( 'phrases.' + UnitText[ unit ] );
        switch ( area.unit ) {
            case Unit.SquareKilometers:
                if ( area.value < 0.001 ) {
                    area.value *= 1000000;
                    unitText = ' ' + i18n.tc( 'phrases.' + UnitText[ Unit.SquareMeters ] );
                }
                break;
        }
        const text = Number( Number( area.value ).toFixed( 3 ) ).toLocaleString() + ' ' + unitText;

        return { area: Number( area.value ).toFixed( 3 ), unit, text };
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
            this.run();
        }
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

    private updateStyle() {
        const newStyle = new Style( {
            stroke: new Stroke( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY ),
                width: '2px',
                linejoin: 'round'
            } ),
            fill: new Fill( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY ),
            } )
        } );

        this.mapObject.clearStyles();
        this.mapObject.addStyle( newStyle );
        this.mapObject.commit();
    }
}
