/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Задача Метки на карте                         *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import GwtkMapMarksWidget from './GwtkMapMarksWidget.vue';
import MapWindow from '~/MapWindow';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import PickPointAction, { SET_COORDINATE_IN_POINT } from '~/systemActions/PickPointAction';
import VectorLayer from '~/maplayers/VectorLayer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import { mapViewEntireLayer } from '~/api/MapApi';
import { GEOJSON_DATA } from '~/utils/WorkspaceManager';

import SVGrenderer, { LANDMARK_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import Utils from '~/services/Utils';
import i18n from '@/plugins/i18n';
import { CURSOR_TYPE, GwtkComponentDescriptionPropsData } from '~/types/Types';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import PixelPoint from '~/geometry/PixelPoint';
import GeoPoint from '~/geo/GeoPoint';
import { FeatureType, GeoJsonType, SvgMarker } from '~/utils/GeoJSON';
import { DataChangedEvent } from '~/taskmanager/TaskManager';
import MarkerImageList from '../templates/iconList.json';
import MapMarkPreview from './MapMarkPreview';
import { GwtkLayerDescription } from '~/types/Options';
import { MapPoint } from '~/geometry/MapPoint';
import { BrowserService } from '~/services/BrowserService';

export const SELECT_POINT_ACTION = 'gwtkmapmarks.selectpointtaction';
export const MARK_SET_NEW = 'gwtkmapmarks.newmarkset';
export const MARK_SET_REMOVE = 'gwtkmapmarks.marksetremove';
export const CREATE_MARK_TOGGLE = 'gwtkmapmarks.createmark';
export const MARK_SAVE = 'gwtkmapmarks.marksave';
export const MARK_NAME = 'gwtkmapmarks.markname';
export const MARK_COLOR = 'gwtkmapmarks.markcolor';
export const MARK_SET_NAME = 'gwtkmapmarks.marksetname';
export const MARK_SET_VISIBILITY = 'gwtkmapmarks.marksetvisibility';
export const MARK_IMAGE_LIST = 'gwtkmapmarks.markerlist';
export const MARK_IMAGE_ID = 'gwtkmapmarks.selectedmarkerid';
export const COMMENTS = 'gwtkmapmarks.commentary';
export const MAP_OBJECTS = 'gwtkmapmarks.mapobjects';
export const MARK_LIST_TOGGLE = 'gwtkmapmarks.marklisttoggle';
export const SELECT_MAP_OBJECT = 'gwtkmapmarks.selectmarklistitem';
export const REMOVE_MAP_OBJECT = 'gwtkmapmarks.removemarklistitem';
export const CREATE_SHARE_URL= 'gwtkmapmarks.createshareurl';

export type MarkerTemplate = {
    id: string;
    text: string;
    icon: string;
    color: string;
    sld: SvgMarker[];
}

export type MarkItem = {
    id: string;
    name: string;
    marker: FeatureType;
};

export type MarkSetIdItem = {
    id: string;
    name: string;
};

export type MarkSetIdList = MarkSetIdItem[];

export type MarkSet = {
    id: string;
    name: string;
    marks?: GeoJsonType;
};

export type MarkSetRegister = MarkSet[];

export type MapMarkPreviewOptions = {
    url: string;
    zoom: number;
    layerid: string;
};

export type GwtkMapMarksTaskState = {
    [MARK_SET_NEW]: string;
    [MARK_SET_NAME]: string;
    [MARK_SET_VISIBILITY]: boolean;
    [MARK_SET_REMOVE]: string;
    [CREATE_MARK_TOGGLE]: boolean;
    [MARK_NAME]: string;
    [MARK_SAVE]: boolean;
    [SET_COORDINATE_IN_POINT]: PixelPoint;
    [MARK_COLOR]: string;
    [MARK_IMAGE_LIST]: MarkerTemplate[];
    [MARK_IMAGE_ID]: string;
    [COMMENTS]: string;
    [MARK_LIST_TOGGLE]: boolean;
    [MAP_OBJECTS]: MapObject[];
    [SELECT_MAP_OBJECT]: string;
    [REMOVE_MAP_OBJECT]: boolean;
    [CREATE_SHARE_URL]: {objectName:string, point: MapPoint};
};


type WidgetParams = {
    setState: GwtkMapMarksTask['setState'];
    markSetIdList: MarkSetRegister;
    selectedSetId: string;
    markSetName: string;
    markSetVisibility: boolean;
    markCoordinates: string;
    markName: string;
    markerColor: string;
    markerList: MarkerTemplate[];
    selectedMarkerId: string;
    commentary: string;
    markListToggle: boolean;
    mapObjects: MapObject[];
    selectedMapObjects: string[];
    comments: string;
}


/**
 * Задача "Метки на карте"
 * @class GwtkMapRouteTask
 * @extends Task
 */
export default class GwtkMapMarksTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Векторный слой отображения меток
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    private readonly vectorLayer: VectorLayer;

    private mapObject: MapObject;

    private selectedObject: MapObject | undefined;

    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property mapObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style( {
        marker: new MarkerStyle( { markerId: LANDMARK_SVG_MARKER_ID } )
    } );

    /**
     * Цвет меток по умолчанию
     * @private
     * @readonly
     * @property DEFAULT_COLOR {string}
     */

    private readonly DEFAULT_COLOR = '#F006D8';

    /**
     * Реестр наборов меток
     * @private
     * @property markSetRegister { MarkSetRegister }
     */
    private markSetRegister: MarkSetRegister = [];

    /**
     * Создание превью карты с меткой
     * @private
     * @property markPreview { MapMarkPreview }
     */
    private markPreview: MapMarkPreview | undefined;

    /**
     * Параметры создания превью
     * @private
     * @property previewOptions { MapMarkPreviewOptions }
     */
    private readonly previewOptions: MapMarkPreviewOptions | undefined;

    /**
     * Список шаблонов изображений меток
     * @private
     * @property MarkerImages { markerTemplate[] }
     */
    private MarkerImages: MarkerTemplate[] = [];

    private cursor: CURSOR_TYPE;

    private readonly pointOne = { objectNumber: 0, contourNumber: 0 };

    /**
     * @constructor GwtkMapMarksTask
     * @param mapVue {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapVue: MapWindow, id: string ) {
        super( mapVue, id );

        this.previewOptions = this.map.options.mapmarks;

        this.readWorkspaceData();

        this.actionRegistry.push(
            {
                getConstructor() {
                    return PickPointAction;
                },
                id: SELECT_POINT_ACTION,
                active: false,
                enabled: true
            }
        );

        //создаем слой для рабочих маркеров
        this.vectorLayer = new GeoJsonLayer( this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        } );

        this.mapObject = new MapObject( this.vectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        this.initMarkerImages();

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),
            markSetIdList: this.getMarkSetIdList(),
            selectedSetId: '0',
            markSetName: this.newMarkSetName,
            markSetVisibility: false,
            markCoordinates: '',
            markName: '',
            markerColor: this.DEFAULT_COLOR,
            markerList: [],
            selectedMarkerId: '',
            commentary: '',
            markListToggle: false,
            mapObjects: [],
            selectedMapObjects: [],
            comments: ''
        };

        this.widgetProps.markerList.push( ...this.MarkerImages );
        this.widgetProps.selectedMarkerId = this.widgetProps.markerList[ 0 ].id;
        this.widgetProps.markSetIdList = this.getMarkSetIdList();
        this.widgetProps.mapObjects = [];

        this.cursor = CURSOR_TYPE.default;
    }

    async setup() {
        super.setup();
        await this.restoreComponentData();
        this.restoreWidgetProps( this.widgetProps.selectedSetId );

        if ( this.previewOptions ) {
            this.markPreview = new MapMarkPreview( this.map, this.previewOptions );
        } else {
            this.map.writeProtocolMessage(
                {
                    text: i18n.tc( 'mapmarks.Map image creation options for marks are not set' ) + '.',
                    type: LogEventType.Warning
                }
            );
        }
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMapMarksWidget';
        const source = GwtkMapMarksWidget;

        this.mapWindow.registerComponent( name, source );

        // Создание Vue компонента
        this.mapWindow.createWidget( name, this.widgetProps );

        // Добавить в список для удаления при деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    canShowTooltip() {
        return true;
    }

    /**
     * Установить параметры работы
     * @method setState
     */
    async setState<K extends keyof GwtkMapMarksTaskState>( key: K, value: GwtkMapMarksTaskState[K] ) {

        switch ( key ) {
            case MARK_SET_NEW:
                const markSet = this.createMarkSet( value as string );
                this.widgetProps.markSetIdList = this.getMarkSetIdList();
                this.widgetProps.selectedSetId = markSet.id;
                this.widgetProps.markName = this.newMarkName;
                this.clearMapObjectsWidgetProps();
                break;
            case MARK_SET_NAME:
                this.changeMarkSet( value as string );
                break;
            case MARK_NAME:
                this.widgetProps.markName = value as string;
                break;
            case CREATE_MARK_TOGGLE:
                this.setAction( value as boolean );
                this.widgetProps.markName = this.newMarkName;
                if ( !value ) {
                    this.clearPropsCreate();
                    this.mapObject.clearStyles();  // ???
                } else {
                    this.clearMapObjectsWidgetProps();
                    this.map.requestRender();
                }
                break;
            case MARK_SAVE:
                this.saveMark();
                this.saveComponentData();
                break;
            case MARK_COLOR:
                this.widgetProps.markerColor = value as string;
                this.changeMarkerColor();
                this.mapObjectStyleUpdate();
                break;
            case SET_COORDINATE_IN_POINT:
                const mapPoint = this.savePoint( value as PixelPoint );
                const geoPoint = this.map.pixelToGeo( value as PixelPoint );
                if ( geoPoint ) {
                    const Lat = GeoPoint.degrees2DegreesMinutesSeconds( geoPoint.getLatitude() );
                    const Lng = GeoPoint.degrees2DegreesMinutesSeconds( geoPoint.getLongitude() );
                    this.widgetProps.markCoordinates = `${ i18n.t( 'phrases.Latitude' ) }: ${ Lat }   ${ i18n.t( 'phrases.Longitude' ) }: ${ Lng }`;
                } else {
                    this.widgetProps.markCoordinates = `X: ${ mapPoint.x.toFixed( 4 ) } m   Y: ${ mapPoint.y.toFixed( 4 ) } m`;
                }
                this.mapObjectStyleUpdate();
                break;
            case MARK_SET_VISIBILITY:
                this.widgetProps.markSetVisibility = !this.widgetProps.markSetVisibility;
                if ( !this.setLayerVisibility(this.widgetProps.selectedSetId, this.widgetProps.markSetVisibility)) {
                    this.widgetProps.markSetVisibility = !this.widgetProps.markSetVisibility;
                }
                break;
            case MARK_SET_REMOVE:
                this.removeMarkSet(value as string);
                this.saveComponentData();
                break;
            case MARK_IMAGE_ID:
                this.widgetProps.selectedMarkerId = value as string;
                const images = this.widgetProps.markerList as MarkerTemplate[];
                const markerTemplate = images.find(item => item.id === value);
                if (markerTemplate) {
                    this.setMarkerDescription(markerTemplate, markerTemplate.color);
                    this.widgetProps.markerColor = markerTemplate.color;
                    this.mapObjectStyleUpdate();
                }
                break;
            case COMMENTS:
                this.widgetProps.commentary = value as string;
                break;
            case MARK_LIST_TOGGLE:
                let active = value as boolean;
                this.clearMapObjectsWidgetProps();
                const layer = this.map.vectorLayers.find( layer => layer.xId === this.widgetProps.selectedSetId ) as GeoJsonLayer;
                if ( active && layer ) {
                    this.getAllLayerObjects( layer );
                    await mapViewEntireLayer( this.map, layer );
                } else {
                    this.map.requestRender();
                }
                this.widgetProps.markListToggle = active;
                break;
            case SELECT_MAP_OBJECT:
                const mapObjectId = value as string;
                const index = this.widgetProps.selectedMapObjects.findIndex( (item: string) => item === mapObjectId );
                if ( index === -1 ) {
                    this.widgetProps.selectedMapObjects.push( mapObjectId );
                    this.selectedObject = this.widgetProps.mapObjects.find( (mapobj: MapObject) => mapobj.id === mapObjectId );
                    if ( this.selectedObject ) { this.viewMapObject( this.selectedObject ); }
                } else {
                    this.widgetProps.selectedMapObjects.splice( index, 1 );
                    //this.selectedObject = undefined;
                }
                this.map.requestRender();
                break;
            case REMOVE_MAP_OBJECT:
                this.removeMapObjects();
                this.saveComponentData();
                break;
            case CREATE_SHARE_URL:
                {
                    const mapPoint = value as {objectName:string, point: MapPoint};
                    const href = this.map.getShareLocation();
                    let mapLink = href + '?mapmark=' + mapPoint.point.y + ',' + mapPoint.point.x;
                    if (mapPoint.objectName) {
                        mapLink = mapLink + '&objectname=' + encodeURIComponent(mapPoint.objectName);
                    }
                    // скопировать в буфер обмена
                    BrowserService.copyToClipboard(mapLink).then(() => {
                        this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Link copied to clipboard'));
                    }).catch(() => {
                        this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Copy failed'));
                    });
                }
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
                break;
        }
    }

    /**
     * Получить список идентификаторов наборов меток
     * @method getMarkSetIdList
     * @returns { MarkSetIdList } список идентификаторов наборов меток
     * @private
     */
    private getMarkSetIdList() {
        if ( this.markSetRegister.length === 0 ) {
            const id = '0';
            const name = i18n.t('mapmarks.Undefined') as string;
            this.markSetRegister.push( { id, name } );
        } else {
            const index = this.markSetRegister.findIndex( item => item.id === '0' );
            if ( index > -1 && this.markSetRegister.length > 1 ) {
                this.markSetRegister.splice( index, 1 );
            }
        }
        return this.markSetRegister;
    }

    /**
     * Получить набор меток
     * @method getMarkSet
     * @param id { string } идентификатор набора меток
     * @returns { MarkSet | undefined } набор меток
     * @private
     */
    getMarkSet( id: string ) {
        return this.markSetRegister.find( markset => markset.id === id );
    }

    /**
     * Получить идентификатор набора меток по имени
     * @method getMarkSetIdByName
     * @param name { string } имя набора меток
     * @returns { string | undefined } идентификатор набора меток
     * @private
     */
    private getMarkSetIdByName( name: string ) {
        const markSet = this.markSetRegister.find( item => item.name === name );
        if ( markSet ) {
            return markSet.id;
        }
    }

    /**
     * Создать набор меток
     * @method createMarkSet
     * @param name { string } имя набора меток
     * @returns { MarkSet } набор меток
     * @private
     */
    private createMarkSet( name: string ) {
        const markSet = { id: Utils.generateGUID(), name };
        this.markSetRegister.push( markSet );
        return this.markSetRegister[ this.markSetRegister.length - 1 ];
    }

    /**
     * Удалить набор меток
     * @method removeMarkSet
     * @param markId { string } идентификатор набора меток
     * @private
     */
    private async removeMarkSet( markId: string ) {
        const index = this.markSetRegister.findIndex( markset => markset.id === markId );
        if ( index > -1 ) {
            const xId = this.markSetRegister[ index ].id;
            this.markSetRegister.splice( index, 1 );
            const layer = this.map.vectorLayers.find( layer => layer.xId === xId ) as GeoJsonLayer;
            await layer?.removeJsonData();
            this.map.closeLayer( xId );
            this.widgetProps.markSetIdList = this.getMarkSetIdList();
            if ( this.markSetRegister.length > 0 ) {
                this.widgetProps.selectedSetId = this.widgetProps.markSetIdList[ 0 ].id;
            } else {
                this.widgetProps.selectedSetId = '0';
            }

            this.widgetProps.mapObjects.splice( 0 );
        }
    }

    /**
     * Удалить незаполненные наборы меток
     * @method removeEmptyMarkSet
     * @private
     */
    private async removeEmptyMarkSet() {
        this.removeMarkSet( '0' );
        const ids: string[] = [];
        this.markSetRegister.forEach( markset => {
            const layer = this.map.vectorLayers.find( layer => layer.xId === markset.id );
            if ( layer ) {
                const geojsonlayer = layer as GeoJsonLayer;
                const object = geojsonlayer.getMapObjectsIterator().next();
                if ( !object.value ) {
                    this.map.closeLayer( geojsonlayer.xId );
                    ids.push( markset.id );
                }
            }
        } );

        ids.forEach( id => {
            const index = this.markSetRegister.findIndex( markset => id === markset.id );
            if ( index > -1 ) {
                this.markSetRegister.splice(index, 1);
                this.widgetProps.selectedSetId = '0';
                if (this.markSetRegister[0] !== undefined) {
                    this.widgetProps.selectedSetId = this.markSetRegister[0].id;
                }
            }
        } );
    }

    /**
     * Сохранить точку в объект карты
     * @private
     * @method savePoint
     * @param point { PixelPoint } координаты точки, пикселы
     * @returns {MapPoint} координаты точки, метры
     */
    private savePoint( point: PixelPoint) {
        this.mapObject.removeAllPoints();
        const mapPoint = this.map.pixelToPlane( point );
        if ( mapPoint ) {
            this.mapObject.addPoint( mapPoint );
        }
        return mapPoint;
    }

    /**
     * Сохранить метку
     * @method saveMark
     * @private
     */
    private async saveMark() {

        const markSet = this.getMarkSet( this.widgetProps.selectedSetId );

        if ( markSet ) {
            this.mapObject.removeAllSemantics();
            this.mapObject.addSemantic( {
                key: 'creationTime',
                name: i18n.t( 'mapmarks.Creation time' ) as string,
                value: this.dateTimeNow }
            );
            this.mapObject.addSemantic( {
                key: 'commentary',
                name: i18n.t( 'phrases.Comment' ) as string,
                value: this.widgetProps.commentary }
            );
            if ( this.markPreview ) {
                const dataimage = await this.markPreview.getImage( this.mapObject.getPoint( this.pointOne )! );
                if ( dataimage.length > 0 ) {
                    this.mapObject.addSemantic( {
                        key: 'dataimage',
                        name: 'mapimage',
                        value: dataimage,
                        view: '0'  }
                    );
                }
            }

            this.mapObject.addSemantic( {
                key: 'mapmark',
                name: i18n.t( 'mapmarks.Mark' ) as string,
                value: '1' }
            );

            this.mapObjectStyleUpdate( false );

            const jsonFeature = this.mapObject.toJSON();

            jsonFeature.properties.name = this.widgetProps.markName;
            jsonFeature.properties.mapid = markSet.id;

            let layer = this.map.vectorLayers.find( layer => layer.xId === markSet.id );
            if ( !layer ) {
                layer = this.openMapLayer( markSet );
            }
            await this.addMapObject( layer as GeoJsonLayer, jsonFeature );

            this.clearPropsCreate();
            this.mapObject = new MapObject( this.vectorLayer, MapObjectType.Point, { local: LOCALE.Point } );
        }
    }

    /**
     * Получить текущую дату-время
     * @property dateTimeNow
     * @returns {string}
     * @private
     */
    private get dateTimeNow() {
        const date = new Date();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * Открыть слой карты
     * @method openMapLayer
     * @param markset {MarkSet} набор меток
     * @param visible {number} видимость слоя
     * @private
     */
    private openMapLayer( markset: MarkSet, visible: number = 1 ) {

        if ( this.map.vectorLayers.find( layer => layer.xId === markset.id ) ) {
            return;
        }

        const hidden = visible ? 0 : 1;
        const options: GwtkLayerDescription = {
            id: markset.id,
            alias: markset.name,
            selectObject: false,
            url: 'markset',
            hidden,
            semanticfilter: ['commentary', 'creationTime'],
            tooltip: { objectName: true, layerName: true, semanticKeys: ['commentary', 'creationTime'] }
        };

        const layer = this.map.openLocalLayer( this.map, options, undefined, { isReadonly: true, isLocked: true } );
        if ( layer ) {
            const treeNode: ContentTreeNode = {
                id: markset.id,
                nodeType: TreeNodeType.LocalLayer,
                text: markset.name,
                parentId: USER_LAYERS_FOLDER_ID
            };
            this.map.onLayerListChanged( treeNode );
            this.map.requestRender();
        } else {
            this.map.writeProtocolMessage(
                {
                    text: i18n.tc( 'phrases.Map layer creation error' ) + ' ' + markset.name + '!',
                    type: LogEventType.Error
                }
            );
        }

        return layer;
    }

    /**
     * Установить видимость слоя карты
     * @method setLayerVisibility
     * @param id {string} идентификатор слоя (набора меток)
     * @param visible {boolean} видимость слоя
     * @returns {boolean}, `false` - слой, набор меток не найден
     * @private
     */
    private setLayerVisibility( id: string, visible: boolean ) {
        let result = false;
        const layer = this.map.vectorLayers.find( layer => layer.xId === id );
        if ( layer ) {
            this.map.setLayerVisibility( layer, visible );
            result = true;
        } else {
            const markSet = this.getMarkSet( id );
            if ( markSet ) {
                this.openMapLayer( markSet );
                result = true;
            }
        }
        return result;
    }

    /**
     * Восстановить параметры видимости
     * @method restoreLayerVisibility
     * @private
     */
    private restoreLayerVisibility() {
        const id = this.widgetProps.selectedSetId;
        if ( id !== '0' ) {
            let visible = true;
            const layer = this.map.vectorLayers.find( layer => layer.xId === id );
            if ( layer ) {
                visible = layer.visible;
            } else {
                const markSet = this.getMarkSet( id );
                if ( markSet ) {
                    this.openMapLayer( markSet );
                }  else {
                    visible = false;
                }
            }
            this.widgetProps.markSetVisibility = visible;
        }
    }

    /**
     * Получить объекты слоя меток
     * @method getAllLayerObjects
     * @param layer {GeoJsonLayer} слой карты (из набора меток)
     * @private
     */
    private getAllLayerObjects( layer: GeoJsonLayer ) {
        this.widgetProps.mapObjects.splice( 0 );
        const mapObjectsIterator = layer.getMapObjectsIterator();
        for ( const mapObject of mapObjectsIterator ) {
            this.widgetProps.mapObjects.push( mapObject );
        }
    }

    /**
     * Добавить объект в слой меток
     * @method addMapObject
     * @param layer {GeoJsonLayer} слой карты (из набора меток)
     * @param feature {FeatureType} json-метка
     * @private
     */
    private async addMapObject( layer: GeoJsonLayer, feature: FeatureType ) {
        const mapObject = new MapObject( layer, MapObjectType.Point, feature.properties );
        mapObject.fromJSON( feature );
        await mapObject.commit();
        this.map.requestRender();
    }

    /**
     * Удалить выделенные объекты и метки
     * @method removeMapObjects
     * @private
     */
    private removeMapObjects() {
        if ( this.widgetProps.selectedMapObjects.length === 0 ) {
            return;
        }
        const layer = this.map.vectorLayers.find( layer => layer.xId === this.widgetProps.selectedSetId );
        const markSet = this.getMarkSet( this.widgetProps.selectedSetId );

        if ( layer && markSet ) {
            for( const objectId of this.widgetProps.selectedMapObjects ) {
                const index = this.widgetProps.mapObjects.findIndex( (mapobj: MapObject) => mapobj.id === objectId );
                if ( index > -1 ) {
                    this.widgetProps.mapObjects[ index ].delete();
                    this.widgetProps.mapObjects.splice( index, 1 );
                }
            }
            this.widgetProps.selectedMapObjects.splice( 0 );
            this.selectedObject = undefined;

            this.map.requestRender();
        }
    }

    /**
     * Показать объект в карте
     * @method viewMapObject
     * @param mapObject {MapObject} объект карты
     * @private
     */
    viewMapObject( mapObject: MapObject ) {
        const mapPoint = mapObject.getPoint( this.pointOne );
        if ( mapPoint ) {
            this.map.setMapCenter( mapPoint, true );
            this.map.overlayRefresh();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        this.map.mapObjectsViewer.drawMapObject( renderer, this.mapObject );

        if ( this.selectedObject ) {
            for ( const mapObject of this.widgetProps.mapObjects ) {
                if ( this.widgetProps.selectedMapObjects.includes( mapObject.id ) ) {
                    this.map.mapObjectsViewer.drawMapObject( renderer, mapObject, this.mapObjectStyle );
                }
            }

        }
    }

    /**
     * Обновить вид (стили) объекта карты
     * @method mapObjectStyleUpdate
     * @param render {boolean} признак перерисовки карты
     * @private
     */
    private mapObjectStyleUpdate( render: boolean = true ) {
        this.mapObject.clearStyles();
        this.mapObject.addStyle( this.getStyle() );
        if ( render ) {
            this.map.requestRender();
        }
    }

    /**
     * Получить стиль маркера метки
     * @method getStyle
     * @returns {Style} описание выбранного маркера
     * @private
     */
    private getStyle() {
        const id = this.widgetProps.selectedMarkerId;
        const images = this.widgetProps.markerList as MarkerTemplate[];
        const imageItem = images.find(item => item.id === id);
        if (!imageItem) {
            return this.mapObjectStyle;
        }
        const markerDescription = imageItem.sld[0];
        const markerId = Utils.generateGUID();

        const marker = new MarkerStyle({ markerId, markerDescription });
        return new Style( { marker } );
    }

    /**
     * Очистить параметры объектов набора меток
     * @method clearMapObjectsWidgetProps
     * @private
     */
    private clearMapObjectsWidgetProps() {
        this.widgetProps.mapObjects.splice( 0 );
        this.widgetProps.selectedMapObjects.splice( 0 );
        this.selectedObject = undefined;
    }

    /**
     * Обработка закрытия слоя меток (из дерева данных)
     * @method onDataChanged
     */
    async onDataChanged( event: DataChangedEvent ) {
        if ( event.type === 'refreshmap' ) {
            this.readWorkspaceData();
            const xid = this.widgetProps.selectedSetId;
            const markset = this.markSetRegister.find( item => item.id === xid );
            const layer = this.map.vectorLayers.find( layer => layer.xId === xid );
            if ( !layer && markset ) {
                const index = this.markSetRegister.findIndex( item => item.id !== xid );
                if ( index > -1 ) {
                    this.widgetProps.selectedSetId = this.markSetRegister[ index ].id;
                    await this.map.workspaceManager.setComponentData( this.id, {
                        markSetRegister: this.markSetRegister,
                        selectedSetId: this.markSetRegister[ index ].id
                    } );
                } else {
                    this.openMapLayer( markset, 0 );
                }
                this.widgetProps.markListToggle = false;
            }
        } else if ( event.type === 'layercommand' && event.command === 'visibilitychanged' ) {
            const xid = this.widgetProps.selectedSetId;
            const layer = this.map.vectorLayers.find( layer => layer.xId === xid );
            if ( layer ) {
                this.widgetProps.markSetVisibility = layer.visible;
            }
        }
    }

    onWorkspaceChanged( type: string ) {
        if ( type === GEOJSON_DATA && this.widgetProps.markListToggle ) {
            const layer = this.map.vectorLayers.find( layer => layer.xId === this.widgetProps.selectedSetId ) as GeoJsonLayer;
            if ( layer ) {
                this.getAllLayerObjects( layer );
                this.widgetProps.selectedMapObjects.splice( 0 );
            }
        }
    }

    /**
     * Обработка изменения выбора набора меток
     * @method changeMarkSet
     * @param name {string} имя набора меток
     * @private
     */
    private changeMarkSet( name: string ) {
        if ( name === '' ) {
            this.widgetProps.markSetName = this.newMarkSetName;
            return;
        }
        this.widgetProps.markSetName = name;
        const markSet = this.markSetRegister.find( item => item.name === name );
        if ( !markSet ) {
            return;
        }

        this.widgetProps.selectedSetId = this.getMarkSetIdByName( name as string ) || '0';
        this.widgetProps.comments = '';
        this.widgetProps.mapObjects.splice( 0 );

        this.openMapLayer( markSet );
        this.widgetProps.markName = this.newMarkName;

        const layer = this.map.vectorLayers.find( layer => layer.xId === this.widgetProps.selectedSetId );
        if ( layer ) {
            this.widgetProps.markSetVisibility = layer.visible;
            mapViewEntireLayer(this.map, layer);
        }
    }

    /**
     * Деструктор
     * @method destroy
     * @protected
     */
    protected async destroy() {
        await this.removeEmptyMarkSet();
        this.saveComponentData();
        this.vectorLayer.destroy();
        super.destroy();
    }

    /**
     * Сохранить данные задачи
     * @method saveComponentData
     * @private
     */
    private async saveComponentData() {
        if ( this.widgetProps.selectedSetId !== '0' ) {
            await this.map.workspaceManager.setComponentData( this.id, {
                selectedSetId: this.widgetProps.selectedSetId,
                markSetRegister: this.markSetRegister
            } );
        } else {
            await this.map.workspaceManager.setComponentData( this.id, {} );
        }
    }

    /**
     * Восстановить данные из хранилища
     * @method restoreComponentData
     * @private
     */
    private async restoreComponentData() {
        this.readWorkspaceData();

        if ( this.workspaceData ) {
            const markSets = this.workspaceData.markSetRegister;
            if ( markSets ) {
                this.markSetRegister.splice( 0 );
                this.markSetRegister.push( ...this.workspaceData.markSetRegister );
            }
            if ( this.workspaceData.selectedSetId && this.widgetProps ) {
                if ( this.getMarkSet( this.workspaceData.selectedSetId ) ) {
                    this.widgetProps.selectedSetId = this.workspaceData.selectedSetId;
                }
            }
        }
    }

    /**
     * Восстановить параметры виджета
     * @method restoreWidgetProps
     * @param id {string} идентификатор набора меток
     * @private
     */
    private restoreWidgetProps( id?: string ) {
        this.widgetProps.markSetIdList = this.getMarkSetIdList();
        let listItem = this.widgetProps.markSetIdList[ 0 ];
        if ( id ) {
            const itemTarget = this.widgetProps.markSetIdList.find( ( item: MarkSetIdItem ) => item.id === id );
            if ( itemTarget ) {
                listItem = itemTarget;
            }
        }

        this.widgetProps.selectedSetId = listItem.id;
        this.widgetProps.markSetName = listItem.name;
        this.restoreLayerVisibility();
    }

    /**
     * Установить обработчик
     * @method setAction
     * @param active {boolean} признак активности
     */
    private setAction( active: boolean ) {
        if ( active ) {
            this.doAction( SELECT_POINT_ACTION );
        } else {
            this.quitAction( SELECT_POINT_ACTION );
        }
    }

    /**
     * Очистить параметры создания метки
     * @method clearPropsCreate
     * @private
     */
    private clearPropsCreate() {
        this.widgetProps.markCoordinates = '';
        this.widgetProps.markName = this.newMarkName;
        this.widgetProps.commentary = '';
    }

    /**
     * Новое имя набора меток
     * @property newMarkSetName
     * @returns {string}
     * @private
     */
    private get newMarkSetName(): string {
        const prefix = i18n.t( 'mapmarks.New mark set' ) + ' ';
        let counter = 1;
        let newName = prefix + counter;
        const idList: MarkSetIdList = this.getMarkSetIdList();
        while ( idList.find( item => item.name === newName ) ) {
            counter++;
            newName = prefix + counter;
        }
        return newName;
    }

    /**
     * Новое имя метки
     * @property newMarkName
     * @returns {string}
     * @private
     */
    private get newMarkName( ): string {
        const prefix = i18n.t( 'mapmarks.Mark' ) + ' ';
        let counter = 1;
        let newName = prefix + counter;
        if ( !this.widgetProps || !this.widgetProps.selectedSetId ) {
            return newName;
        }
        const xid = this.widgetProps.selectedSetId;
        const layer = this.map.vectorLayers.find( layer => layer.xId === xid ) as GeoJsonLayer;
        if ( layer ) {
            const names = new Set<string>();
            const mapObjectsIterator = layer.getMapObjectsIterator();
            for ( const mapObject of mapObjectsIterator ) {
                if ( mapObject.objectName ) {
                    names.add( mapObject.objectName );
                }
            }
            while ( names.has(newName) ) {
                counter++;
                newName = prefix + counter;
            }
        }
        return newName;
    }

    /**
     * Изменить цвет маркера метки
     * @method changeMarkerColor
     * @private
     */
    private changeMarkerColor( ) {
        const id = this.widgetProps.selectedMarkerId;
        const list = this.widgetProps.markerList as MarkerTemplate[];
        const imageItem = list.find(item => item.id === id);

        this.setMarkerDescription(imageItem!, this.widgetProps.markerColor);
    }

    /**
     * Инициализировать список маркеров меток
     * @method initMarkerImages
     * @private
     */
    private initMarkerImages( ) {
        this.MarkerImages.splice( 0 );
        this.MarkerImages.push( ...MarkerImageList );
        for ( const imageItem of this.MarkerImages ) {
            this.setMarkerDescription( imageItem, this.DEFAULT_COLOR );
        }
    }

    /**
     * Установить описание стиля маркера
     * @method setMarkerDescription
     * @param imageItem {MarkerTemplate} выбранный маркер
     * @param color {string} выбранный цвет
     * @private
     */
    private setMarkerDescription(imageItem: MarkerTemplate, color: string) {
        imageItem.color = color;
        imageItem.sld[0].image = this.setImageFillColor(imageItem.icon, color);

        const markerDescription = imageItem.sld[0];
        const markerId = Utils.generateGUID();
        const marker = new MarkerStyle({ markerId, markerDescription });

        if (marker && marker.markerDescription) {
            imageItem.sld[0].image = marker.markerDescription.image;
        }
    }

    /**
     * Установить цвет в svg маркера
     * @method setImageFillColor
     * @param image {string} исходный svg-маркер
     * @param color {string} выбранный цвет
     * @returns {string} svg-маркер с цветом color
     * @private
     */
    private setImageFillColor( image: string, color: string ): string {

        let svg = image.replace(/currentColor/g, color);
        const index = image.indexOf( 'fill=\'');
        if ( index === -1 ) {
            svg = image.replace('<path', '<path fill=\'' + color + '\'' );
        }
        return svg;
    }

}
