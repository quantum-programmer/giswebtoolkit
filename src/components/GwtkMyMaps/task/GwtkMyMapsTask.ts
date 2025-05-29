/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Задача редактора карты                        *
 *                                                                  *
 *******************************************************************/

import MapWindow, {ButtonDescription} from '~/MapWindow';
import Task from '~/taskmanager/Task';
import {AppendPointActionState} from '~/systemActions/AppendPointAction';
import {EditorLayoutDescription, GwtkComponentDescriptionPropsData} from '~/types/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import GwtkMyMapsWidget from '../task/GwtkMyMapsWidget.vue';
import {LOCALE, LogEventType} from '~/types/CommonTypes';
import {BrowserService} from '~/services/BrowserService';
import GeoJSON, {CommonServiceSVG} from '~/utils/GeoJSON';
import Stroke from '~/style/Stroke';
import Utils from '~/services/Utils';
import i18n from '@/plugins/i18n';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import SVGrenderer, {DEFAULT_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import LineTemplateList from '../templates/lineList.json';
import PolygonTemplateList from '../templates/polygonList.json';
import GwtkError from '~/utils/GwtkError';
import {GwtkLayerDescription} from '~/types/Options';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';
import {GetFeatureParams} from '~/services/RequestServices/RestService/Types';


export const UNDO_TRANSACTION = 'gwtkmymaps.undotransaction';
export const SET_SERVICE_URL = 'gwtkmymaps.setserviceurl';
export const SET_VIRTUAL_FOLDER = 'gwtkmymaps.setvirtualfolder';
export const SET_LAYER = 'gwtkmymaps.setlayer';
export const SET_LAYER_VISIBILITY = 'gwtkmymaps.setlayervisibility';
export const RENAME_LAYER = 'gwtkmymaps.renamelayer';
export const CREATE_LAYER = 'gwtkmymaps.create';
export const REMOVE_LAYER = 'gwtkmymaps.remove';
export const SET_MARKER_ID = 'gwtkmymaps.setmarkerid';
export const SET_LINE_ID = 'gwtkmymaps.setlineid';
export const SET_POLYGON_ID = 'gwtkmymaps.setpolygonid';
export const CREATE_STYLE = 'gwtkmymaps.createstyle';
export const SELECT_TAB = 'gwtkmymaps.selecttab';


export type GwtkMyMapsTaskState = {
    [UNDO_TRANSACTION]: boolean;
    [SET_SERVICE_URL]: string;
    [SET_VIRTUAL_FOLDER]: string;
    [SET_LAYER]: string;
    [SET_LAYER_VISIBILITY]: boolean;
    [RENAME_LAYER]: undefined;
    [CREATE_LAYER]: undefined;
    [REMOVE_LAYER]: string;
    [SET_MARKER_ID]: string;
    [SET_LINE_ID]: string;
    [SET_POLYGON_ID]: string;
    [CREATE_STYLE]: LOCALE;
    [SELECT_TAB]: TemplateTab;
} & AppendPointActionState;

export type SldTemplate = {
    id: string;
    text: string;
    icon: string;
    sld: CommonServiceSVG[];
}

type WorkspaceData = {
    markerList: SldTemplate[];
    lineList: SldTemplate[];
    polygonList: SldTemplate[];
    selectedLayerId: string;
};

export enum TemplateTab {
    Point = 'point',
    Line = 'line',
    Polygon = 'polygon'
}

type WidgetParams = {
    serviceList: string[];
    selectedService: string;
    virtualFolderList: { id: string; text: string; }[];
    selectedVirtualFolderId: string;
    layerList: { id: string; text: string; }[];
    selectedLayerId: string;
    selectedLayerVisibility: boolean;
    markerList: SldTemplate[];
    selectedMarkerId: string;
    lineList: SldTemplate[];
    selectedLineId: string;
    polygonList: SldTemplate[];
    selectedPolygonId: string;
    selectedPointObjectsCount: number;
    selectedLineObjectsCount: number;
    selectedPolygonObjectsCount: number;
    setState: <K extends keyof GwtkMyMapsTaskState>(key: K, value: GwtkMyMapsTaskState[K]) => void;
    buttons: ButtonDescription[];
    selectedTab: TemplateTab;
}

/**
 * Задача редактора карты
 * @class GwtkMyMapsTask
 * @extends Task
 */
export default class GwtkMyMapsTask extends Task {

    /**
     * Слой для объектов
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    vectorLayer?: VectorLayer;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly mapObjects: MapObject[] = [];

    protected workspaceData: WorkspaceData = {
        markerList: [],
        lineList: [],
        polygonList: [],
        selectedLayerId: ''
    };

    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property mergeObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style({
        stroke: new Stroke({
            color: 'red',
            width: '2px',
            dasharray: '5, 2'
        }),
        marker: new MarkerStyle({markerId: DEFAULT_SVG_MARKER_ID})
    });

    private get newLayerName(): string {
        const prefix = i18n.t('mymaps.New layer') + ' ';
        let counter = 1;
        let newName = prefix + counter;
        while (this.widgetProps.layerList.find(item => item.text === newName)) {
            counter++;
            newName = prefix + counter;
        }

        return newName;
    }

    /**
     * @constructor GwtkMapEditorTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        const componentOptions = this.map.options.mymaps || [];

        const serviceList = componentOptions.map(item => item.url);
        const selectedService = serviceList[0];

        const virtualFolderList = componentOptions.find(item => item.url === selectedService)?.virtualFolderList.map(virtualFolderId => {
            if (!this.map.tiles.getVirtualFolderByFolderName(virtualFolderId, selectedService)) {
                const layerParams: GwtkLayerDescription = {
                    id: Utils.generateGUID(),
                    alias: virtualFolderId,
                    selectObject: true,
                    url: selectedService,
                    gis: true,
                    opacityValue: 100,
                    service: 'wms',
                    datatype: 'MAP,SIT,SITX,MPT',
                    folder: virtualFolderId,
                    hidden: 0
                };
                this.map.addVirtualFolder(layerParams);
                // this.map.options.settings_mapEditor?.maplayersid.push( layerParams.id );
            }
            return {
                id: virtualFolderId,
                text: virtualFolderId
            };
        }) || [];
        const selectedVirtualFolderId = virtualFolderList[0].id;

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,

            serviceList,
            selectedService,
            virtualFolderList,
            selectedVirtualFolderId,
            layerList: [],
            selectedLayerId: '',
            selectedLayerVisibility: false,
            markerList: [],
            lineList: [],
            polygonList: [],
            selectedMarkerId: '',
            selectedLineId: '',
            selectedPolygonId: '',
            selectedPointObjectsCount: 0,
            selectedLineObjectsCount: 0,
            selectedPolygonObjectsCount: 0,
            selectedTab: TemplateTab.Point,

            setState: this.setState.bind(this),
            buttons: [
                {
                    id: UNDO_TRANSACTION,
                    active: false,
                    enabled: !!this.map.options.settings_mapEditor?.transaction,
                    options: {
                        icon: 'undo',
                        title: 'phrases.Undo recent changes'
                    }
                }
            ]
        };
    }

    async setup() {
        super.setup();

        if (!this.workspaceData) {
            this.workspaceData = {markerList: [], lineList: [], polygonList: [], selectedLayerId: ''};

            //fillMarkers
            const mapMarkers = this.map.options.mapmarkers;
            if (mapMarkers && mapMarkers.images) {
                for (let i = 0; i < mapMarkers.images.length; i++) {
                    const src = mapMarkers.images[i];

                    const markerStyle = MarkerStyle.fromSVG({
                        image: src,
                        refX: 32,
                        refY: 32,
                        width: 64,
                        height: 64
                    });

                    const mTemplate = {
                        id: markerStyle.markerId,
                        text: 'New marker_' + i,
                        icon: await GwtkMyMapsTask.getTemplateImage([new Style({
                            marker: markerStyle,
                        })], LOCALE.Point),
                        sld: [markerStyle.toServiceSVG()]
                    };

                    this.workspaceData.markerList.push(mTemplate);
                }
            }

            //fillLines
            LineTemplateList.forEach(item => this.workspaceData.lineList.push(item as SldTemplate));

            //fillPolygons
            PolygonTemplateList.forEach(item => this.workspaceData.polygonList.push(item as SldTemplate));
        }

        this.widgetProps.markerList = this.workspaceData.markerList;
        this.widgetProps.lineList = this.workspaceData.lineList;
        this.widgetProps.polygonList = this.workspaceData.polygonList;


        await this.updateLayerIdList();

        if (this.workspaceData.selectedLayerId) {
            this.selectLayer(this.workspaceData.selectedLayerId);
        } else if (this.widgetProps.layerList.length > 0) {
            this.selectLayer(this.widgetProps.layerList[0].id);
        }

        this.writeWorkspaceData(true);

        this.onSelectObjects();
    }

    quit() {
        super.quit();
        this.mapObjects.splice(0);
        this.map.requestRender();
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMyMapsWidget';
        const source = GwtkMyMapsWidget;
        this.mapWindow.registerComponent(name, source);

        // создание экземпляра Vue компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    setState<K extends keyof GwtkMyMapsTaskState>(key: K, value: GwtkMyMapsTaskState[K]): void {
        switch (key) {
            case UNDO_TRANSACTION:
                if (this.vectorLayer instanceof GISWebServiceVectorLayer) {
                    this.mapObjects.splice(0);
                    this.widgetProps.selectedMarkerId = '';
                    this.widgetProps.selectedLineId = '';
                    this.widgetProps.selectedPolygonId = '';

                    this.vectorLayer.undoTransaction();
                }
                break;
            case SET_SERVICE_URL:
                this.widgetProps.selectedService = value as string;
                break;
            case SET_VIRTUAL_FOLDER:
                this.widgetProps.selectedVirtualFolderId = value as string;
                break;
            case SET_LAYER:
                this.selectLayer(value as string);
                break;
            case SET_LAYER_VISIBILITY:
                if (this.vectorLayer) {
                    const layer = this.map.tiles.getLayerByxId(this.vectorLayer.id);
                    if (layer) {
                        this.map.setLayerVisibility(layer, value as boolean);
                        this.widgetProps.selectedLayerVisibility = layer.visible;
                    }
                }
                break;
            case RENAME_LAYER:
                const selectedLayerItem = this.widgetProps.layerList.find(item => item.id === this.widgetProps.selectedLayerId);
                if (selectedLayerItem) {
                    const currentName = selectedLayerItem.text;
                    this.mapWindow.showInputText({
                        title: i18n.t('phrases.Name') + '',
                        inputText: currentName,
                        description: i18n.t('mymaps.The map on the server will be renamed') as string
                    })
                        .then(name => {
                            this.renameLayer(name, selectedLayerItem).catch(e => {
                                if (e) {
                                    this.mapWindow.addSnackBarMessage(e.message);
                                }
                            });
                        })
                        .catch(error => {
                            this.map.writeProtocolMessage({
                                text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.The map on the server has not been renamed') + '.',
                                description: error,
                                type: LogEventType.Error
                            });
                        });
                }
                break;
            case CREATE_LAYER:
                this.mapWindow.showInputText({
                    title: i18n.t('phrases.Name') + '',
                    inputText: this.newLayerName,
                    description: i18n.t('mymaps.A new map will be created on the server') as string
                })
                    .then(name => {
                        this.createLayer(name).catch(error => {
                            this.map.writeProtocolMessage({
                                text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.Error creating map on server'),
                                description: error,
                                type: LogEventType.Error
                            });
                        });
                    })
                    .catch(error => {
                        this.map.writeProtocolMessage({
                            text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.Error creating map on server') + '.',
                            description: error,
                            type: LogEventType.Error
                        });
                    });
                break;
            case REMOVE_LAYER:
                if (this.widgetProps.selectedLayerId) {
                    this.mapWindow.showInputText({
                        description: `${i18n.t('mymaps.The map')} "${value}" ${i18n.t('mymaps.will be removed from the server')}`
                    }).then(() => this.removeLayer())
                        .catch(error => {
                            this.map.writeProtocolMessage({
                                text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.Error deleting map on server') + '.',
                                description: error,
                                type: LogEventType.Error
                            });
                        });
                }
                break;
            case SET_MARKER_ID:
                if (this.widgetProps.selectedPointObjectsCount > 0) {
                    const markerTemplate = this.workspaceData.markerList.find(marker => marker.id === value as string);
                    if (markerTemplate) {
                        this.widgetProps.selectedMarkerId = markerTemplate.id;
                        this.commitMapObjects(LOCALE.Point);
                    }
                }
                break;
            case SET_LINE_ID:
                if (this.widgetProps.selectedLineObjectsCount > 0) {
                    const lineTemplate = this.workspaceData.lineList.find(line => line.id === value as string);
                    if (lineTemplate) {
                        this.widgetProps.selectedLineId = lineTemplate.id;
                        this.commitMapObjects(LOCALE.Line);
                    }
                }
                break;
            case SET_POLYGON_ID:
                if (this.widgetProps.selectedPolygonObjectsCount > 0) {
                    const polygonTemplate = this.workspaceData.polygonList.find(polygon => polygon.id === value as string);
                    if (polygonTemplate) {
                        this.widgetProps.selectedPolygonId = polygonTemplate.id;
                        this.commitMapObjects(LOCALE.Plane);
                    }
                }
                break;
            case CREATE_STYLE:
                this.createStyle(value as LOCALE);
                break;
            case SELECT_TAB:
                this.widgetProps.selectedTab = value as TemplateTab;
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }


    onSelectObjects(): void {
        const mapObjects = this.map.getSelectedObjects();
        if (mapObjects.length !== 0) {
            this.mapObjects.splice(0);
            this.updateObjectCount(mapObjects);
        } else {
            this.updateObjectCount(this.mapObjects);
        }

    }

    onSearchResultChanged(): void {
        setTimeout(() => {
            if (this.map.serviceObjectsSelection()) {
                this.updateLayersViewOrder();

                this.updateObjectCount(this.map.getSelectedObjects());
            }
        }, 200);
    }

    private updateLayersViewOrder(): void {
        if (this.vectorLayer) {
            this.map.tiles.moveLayerToTop(this.vectorLayer.xId);
        }
    }

    private async updateMapObjectsGeometry(mapObjects: MapObject[]) {
        const objectData: {
            serviceUrl: string;
            items: {
                idLayer: string;
                objectIdList: string[]
            }[]
        }[] = [];

        mapObjects.forEach(mapObject => {
            if (!mapObject.hasGeometry()) {
                let serviceData = objectData.find(objectDataItem => objectDataItem.serviceUrl === mapObject.vectorLayer.serviceUrl);
                if (!serviceData) {
                    serviceData = {serviceUrl: mapObject.vectorLayer.serviceUrl, items: []};
                    objectData.push(serviceData);
                }

                let layerData = serviceData.items.find(layerData => layerData.idLayer === mapObject.vectorLayer.idLayer);
                if (!layerData) {
                    layerData = {idLayer: mapObject.vectorLayer.idLayer, objectIdList: []};
                    serviceData.items.push(layerData);
                }

                layerData.objectIdList.push(mapObject.gmlId);
            }
        });

        const OUTCRS = this.map.getCrsString();

        for (let serviceDataIndex = 0; serviceDataIndex < objectData.length; serviceDataIndex++) {

            const serviceData = objectData[serviceDataIndex];

            const requestOptions: GetFeatureParams[] = [];

            serviceData.items.forEach(layerData => {
                requestOptions.push({
                    LAYER: layerData.idLayer,
                    IDLIST: layerData.objectIdList.join(),
                    OUTTYPE: OUTTYPE.JSON,
                    OUTCRS
                });
            });

            const httpParams = RequestServices.createHttpParams(this.map, {url: serviceData.serviceUrl});

            const requestService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            const result = await requestService.getFeatureMetric(requestOptions);

            if (result && result.data) {
                const geoJSON = new GeoJSON(result.data);

                for (let objectNumber = 0; objectNumber < geoJSON.featureCollection.getFeatureCount(); objectNumber++) {
                    const feature = geoJSON.featureCollection.getFeature(objectNumber)?.toJSON();
                    if (feature) {
                        const mapObject = mapObjects.find(item => item.gmlId === feature.properties.id);
                        if (mapObject) {
                            mapObject.updateGeometryFromJSON(feature);
                        }
                    }
                }
            }
        }
    }

    private async updateObjectCount(mapObjects: MapObject[]) {
        this.widgetProps.selectedPointObjectsCount = 0;
        this.widgetProps.selectedLineObjectsCount = 0;
        this.widgetProps.selectedPolygonObjectsCount = 0;

        await this.updateMapObjectsGeometry(mapObjects);

        mapObjects.forEach(mapObject => {
            if (mapObject.type === MapObjectType.Point) {
                this.widgetProps.selectedPointObjectsCount++;
            } else if (mapObject.type === MapObjectType.LineString || mapObject.type === MapObjectType.MultiLineString) {
                this.widgetProps.selectedLineObjectsCount++;
            } else if (mapObject.type === MapObjectType.Polygon || mapObject.type === MapObjectType.MultiPolygon) {
                this.widgetProps.selectedPolygonObjectsCount++;
            }
        });
    }

    onPostRender(renderer: SVGrenderer) {
        //TODO: будет ли сейчас вообще рисоваться?
        if (!this.map.serviceObjectsSelection() && this.mapObjects.length <= 300) {
            this.mapObjects.forEach(mapObject => this.map.mapObjectsViewer.drawMapObject(renderer, mapObject, this.mapObjectStyle));
        }
    }

    private get createIsEnabled(): boolean {
        let createIsEnabled = true;  // если не прислали настройки - разрешаем по умолчанию
        if (this.map.options.settings_mapEditor) {
            const functions = this.map.options.settings_mapEditor.functions;
            if (Array.isArray(functions)) {
                createIsEnabled = functions.includes('*') || functions.includes('create');
            }
        }
        return createIsEnabled;
    }

    private selectLayer(layerId: string): void {
        if (this.widgetProps.selectedLayerId !== layerId) {
            const url = this.widgetProps.selectedService;
            const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.selectedVirtualFolderId, url);
            if (virtualFolder) {
                if (this.widgetProps.layerList.findIndex(item => item.id === layerId) !== -1) {
                    const layer = virtualFolder.openLayer({id: layerId});
                    if (layer) {
                        this.map.setLayerVisibility(layer, true);
                        this.widgetProps.selectedLayerVisibility = true;
                        this.vectorLayer = this.map.getVectorLayerByxId(layerId);
                        if (this.vectorLayer) {
                            this.widgetProps.selectedLayerId = this.vectorLayer.id;
                            this.workspaceData.selectedLayerId = this.vectorLayer.id;

                            this.mapObjects.splice(0);
                            this.updateObjectCount(this.map.getSelectedObjects());
                            this.widgetProps.selectedMarkerId = '';
                            this.widgetProps.selectedLineId = '';
                            this.widgetProps.selectedPolygonId = '';

                            this.writeWorkspaceData(true);
                            this.updateLayersViewOrder();

                            if (!this.widgetProps.selectedPointObjectsCount
                                && !this.widgetProps.selectedLineObjectsCount
                                && !this.widgetProps.selectedPolygonObjectsCount) {
                                this.mapWindow.addSnackBarMessage(i18n.tc('mymaps.Select the required objects on the map'));
                            }
                        }
                    }
                }
            }
        }
    }

    private copyNewObject(mapObject: MapObject): MapObject | undefined {
        if (this.vectorLayer) {

            const sheetName = mapObject.sheetName;

            const geoJsonFeature = mapObject.toJSON();
            geoJsonFeature.properties.id = sheetName + '.0';

            const newMapObject = MapObject.fromJSON(this.vectorLayer, geoJsonFeature);

            newMapObject.clearStyles();
            return newMapObject;
        }
    }

    private async updateLayerIdList(): Promise<void> {
        const url = this.widgetProps.selectedService;
        const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.selectedVirtualFolderId, url);

        if (virtualFolder) {
            this.widgetProps.layerList.splice(0);
            await virtualFolder.update();

            const layerIdList = virtualFolder.getLayerItemList(this.map.options.username);

            layerIdList.forEach(({id, text}) => {
                this.widgetProps.layerList.push({id, text});
            });
        }
    }

    private async renameLayer(newName: string, currentLayeritem: { id: string; text: string; }) {
        const oldName = currentLayeritem.text;

        if (newName !== oldName) {

            if (this.widgetProps.layerList.find(item => item.text === newName)) {
                throw Error(i18n.t('mymaps.Layer with the same name already exists') as string);
            }

            const url = this.widgetProps.selectedService;
            const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.selectedVirtualFolderId, url);
            if (virtualFolder) {

                await virtualFolder.renameData(currentLayeritem, newName);

                await this.updateLayerIdList();

                const newItem = this.widgetProps.layerList.find(item => item.text === newName);
                if (newItem) {
                    this.selectLayer(newItem.id);
                }
            }
        }
    }


    private async createLayer(alias: string): Promise<void> {

        const url = this.widgetProps.selectedService;
        const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.selectedVirtualFolderId, url);
        if (virtualFolder) {
            let layerItem = this.widgetProps.layerList.find(item => item.text === alias);

            if (!layerItem) {
                let createdLayerIds: string[] = [];
                try {
                    createdLayerIds = await virtualFolder.createUserLayer(this.map.options.username + '/' + alias);
                } catch (error) {
                    const gwtkError = new GwtkError(error);
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mymaps.My maps') + '. ' + i18n.tc('mymaps.Error creating map on server'),
                        description: gwtkError.message,
                        type: LogEventType.Error
                    });
                }
                await this.updateLayerIdList();
                layerItem = this.widgetProps.layerList.find(item => item.id === createdLayerIds[0]);
            }

            if (layerItem) {
                this.selectLayer(layerItem.id);
            }
        }
    }

    private async removeLayer(): Promise<void> {
        const url = this.widgetProps.selectedService;
        const virtualFolder = this.map.tiles.getVirtualFolderByFolderName(this.widgetProps.selectedVirtualFolderId, url);
        if (virtualFolder) {
            await virtualFolder.removeLayer(this.widgetProps.selectedLayerId);

            await this.updateLayerIdList();

            const layerItem = this.widgetProps.layerList[0];
            if (layerItem) {
                this.selectLayer(layerItem.id);
            }
        }
    }

    /**
     * Редактирование стилей локализации для градации параметра построения
     * @method editRangeLocaleStyle
     * @private
     * @async
     */
    private async createStyle(locale: LOCALE): Promise<void> {
        let type: CommonServiceSVG['type'] = 'LineSymbolizer';
        switch (locale) {
            case LOCALE.Line:
                type = 'LineSymbolizer';
                break;
            case LOCALE.Plane:
                type = 'PolygonSymbolizer';
                break;
            case LOCALE.Point:
                type = 'PointSymbolizer';
                break;
            case LOCALE.Text:
                type = 'TextSymbolizer';
                break;
        }

        if (this.vectorLayer) {
            try {
                const commonSVG = {type} as CommonServiceSVG;
                const result = await this.mapWindow.getTaskManager().callLegend(this.vectorLayer.id, [commonSVG], locale) as EditorLayoutDescription;
                if (result) {
                    if (result.objectDescription.sld) {
                        const styleTemplate = {
                            id: Utils.generateGUID(),
                            text: result.objectDescription.name || '',
                            icon: await GwtkMyMapsTask.getTemplateImage(result.objectDescription.sld.map(style => Style.fromServiceSVG(style)), locale),
                            sld: result.objectDescription.sld
                        };


                        switch (locale) {
                            case LOCALE.Line:
                                this.workspaceData.lineList.push(styleTemplate);
                                break;
                            case LOCALE.Plane:
                                this.workspaceData.polygonList.push(styleTemplate);
                                break;
                            case LOCALE.Point:
                                this.workspaceData.markerList.push(styleTemplate);
                                break;
                            case LOCALE.Text:
                                break;
                        }


                        this.writeWorkspaceData(true);
                        this.commitMapObjects(locale);
                    }
                }
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({text: gwtkError.message, type: LogEventType.Error});
            }
        }
    }

    private commitMapObjects(locale: LOCALE): void {

        if (this.vectorLayer) {

            if (this.mapObjects.length === 0) {
                const mapObjects = this.map.getSelectedObjectsIterator();

                for (const mapObject of mapObjects) {
                    const newMapObject = this.copyNewObject(mapObject);
                    if (newMapObject) {
                        this.mapObjects.push(newMapObject);
                    }
                }
            }
            let lineTemplate, polygonTemplate, markerTemplate;
            switch (locale) {
                case LOCALE.Line:
                    lineTemplate = this.workspaceData.lineList.find(line => line.id === this.widgetProps.selectedLineId);
                    break;
                case LOCALE.Plane:
                    polygonTemplate = this.workspaceData.polygonList.find(polygon => polygon.id === this.widgetProps.selectedPolygonId);
                    break;
                case LOCALE.Point:
                    markerTemplate = this.workspaceData.markerList.find(marker => marker.id === this.widgetProps.selectedMarkerId);
                    break;
                case LOCALE.Text:
                    break;
            }

            this.vectorLayer.startTransaction();
            for (let i = 0; i < this.mapObjects.length; i++) {
                const mapObject = this.mapObjects[i];

                let styles: CommonServiceSVG[] | undefined;
                switch (mapObject.type) {
                    case MapObjectType.Polygon:
                    case MapObjectType.MultiPolygon:
                        if (polygonTemplate) {
                            styles = polygonTemplate.sld;
                        }
                        break;
                    case MapObjectType.MultiLineString:
                    case MapObjectType.LineString:
                        if (lineTemplate) {
                            styles = lineTemplate.sld;
                        }
                        break;
                    case MapObjectType.MultiPoint:
                    case MapObjectType.Point:
                        if (markerTemplate) {
                            styles = markerTemplate.sld;
                        }
                }

                if (styles) {

                    mapObject.clearStyles();
                    styles.forEach(style => mapObject.addStyle(Style.fromServiceSVG(style)));

                    mapObject.commit();

                }
            }


            if (this.createIsEnabled) {

                this.vectorLayer.commitTransaction().then(() => {
                    // this.vectorLayer?.getAllMapObjects().forEach( mapObject => {
                    //     const mapObjectIndex = this.mapObjects.findIndex( currentMapObject => mapObject.id === currentMapObject.id );
                    //     if ( mapObjectIndex !== -1 ) {
                    //         this.mapObjects.splice( mapObjectIndex, 1, mapObject );
                    //     }
                    // } );
                }).catch(e => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mymaps.Error saving objects on the map'),
                        type: LogEventType.Error,
                        display: true,
                        description: e
                    });
                });
            } else {
                this.map.writeProtocolMessage({
                    text: i18n.tc('mymaps.The operation is prohibited for the current user'),
                    type: LogEventType.Error,
                    display: true
                });
            }

        }
    }

    private static getTemplateImage(styleOptions: Style[], locale: LOCALE): Promise<string> {
        return BrowserService.svgToBase64(BrowserService.stylesToSvgElement(styleOptions, locale));
    }
}
