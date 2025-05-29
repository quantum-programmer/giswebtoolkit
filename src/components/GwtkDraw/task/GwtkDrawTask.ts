/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент "Рисование"                           *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import GeoJSON, {CRS, GeoJsonType} from '~/utils/GeoJSON';
import {CURSOR_TYPE, GwtkComponentDescriptionPropsData} from '~/types/Types';
import Utils from '~/services/Utils/Utils';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import {ACTION_CANCEL, ACTION_COMMIT} from '~/taskmanager/Action';
import SVGrenderer, {RED_CIRCLE_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import Stroke from '~/style/Stroke';
import {VIEW_SETTINGS_MAPCENTER, WorkspaceValues} from '~/utils/WorkspaceManager';
import FileUploader from '~/utils/FileUploader';
import {
    BuildZoneParams,
    GetLoadDataResponse,
    GetStatusDataResponse,
    LoadData,
    UploadFileResponse
} from '~/services/RequestServices/RestService/Types';
import i18n from '@/plugins/i18n';
import { LOCALE, LogEventType } from '~/types/CommonTypes';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import RequestService, {HttpParams} from '~/services/RequestServices/common/RequestService';
import GwtkError from '~/utils/GwtkError';
import {ServiceResponse} from '~/services/Utils/Types';
import {ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID} from '~/utils/MapTreeJSON';
import {SEVERALOBJ} from '~/services/RequestServices/common/enumerables';
import Fill from '~/style/Fill';
import VectorLayer from '~/maplayers/VectorLayer';
import { MapPoint } from '~/geometry/MapPoint';
import PixelPoint from '~/geometry/PixelPoint';
import HTMLTooltipRenderable from '~/renderer/HTMLTooltipRenderable';
import DrawGeoJsonAction from '../action/DrawGeoJsonAction';
import DrawPointAction from '../action/DrawPointAction';
import DrawPolygonAction from '../action/DrawPolygonAction';


export const COMMIT_OBJECT = 'gwtkdraw.commitobject';
export const COMMIT_GEOJSON_OBJECT = 'gwtkdraw.commitgeojsonobject';
export const CLEAR = 'gwtkdraw.clear';
export const DRAW_ACTION_ID = 'gwtkdraw.actionId';
export const DRAW_POINT_ACTION = 'gwtkdraw.drawpointaction';
export const DRAW_POLYGON_ACTION = 'gwtkdraw.drawpolygonaction';
export const DRAW_GEOJSON_ACTION = 'gwtkdraw.drawgeojsonaction';
export const SET_BUFFER_ZONE_RADIUS = 'gwtkdraw.setbufferzoneradius';
export const SET_JSON = 'gwtkdraw.setjson';
export const SET_DRAW_MODE = 'gwtkdraw.setdrawmode';
export const PUBLISH_OBJECT_FROM_FILE_DATA = 'gwtkdraw.publishobjectfromfiledata';
export const SET_MAP_MARK_COORD = 'gwtkdraw.setmapmarkcoord';
export const SET_TOOLTIP_ENABLED = 'gwtkdraw.settooltipenabled';


const TOOLTIP_BASE_WIDTH = 250;
const TOOLTIP_BASE_HEIGHT = 150;

export type GwtkDrawTaskState = {
    [DRAW_ACTION_ID]: string;
    [COMMIT_OBJECT]: MapObject;
    [COMMIT_GEOJSON_OBJECT]: undefined;
    [ACTION_CANCEL]: undefined;
    [ACTION_COMMIT]: undefined;
    [CLEAR]: undefined;
    [SET_JSON]: GeoJsonType;
    [SET_BUFFER_ZONE_RADIUS]: number;
    [SET_DRAW_MODE]: { resolve: (value: GeoJsonType) => void; reject: () => void; };
    [PUBLISH_OBJECT_FROM_FILE_DATA]: ServiceResponse<GetLoadDataResponse>;
    [SET_MAP_MARK_COORD]: [string, string];
    [SET_TOOLTIP_ENABLED]: boolean;
};


type WidgetParams = {
    setState: GwtkDrawTask['setState'];
}

const PUBLISH_MAP_SCALE = 1000000;

/**
 * Компонент "Рисование"
 * @class GwtkDrawTask
 * @extends Task
 */
export default class GwtkDrawTask extends Task {

    /**
     * Идентификатор загрузки
     * @private
     * @property jobId {String|undefined}
     */
    private jobId: string | undefined;

    /**
     * Коллекция объектов GeoJSON
     * @private
     * @property json {GeoJsonType | undefined}
     */
    private json: GeoJsonType | undefined;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Радиус построения буферной зоны
     * @private
     * @property vectorLayer {string}
     */
    private radius?: number;

    /**
     * Список id внешнего GeoJSON объекта и его буферной зоны
     * @private
     * @property geoJsonIdList {string[]}
     */
    private geoJsonIdList: string[] = [];

    /**
     * Объект области поиска
     * @private
     * @property mapObject {MapObject|undefined}
     */
    private mapObject?: MapObject;

    /**
     * Координаты для нанесения маркера
     * @private
     * @property geoJsonIdList {string[]}
     */
    private mapMarkCoord: string[] = [];

    /**
     * Стиль для наносимого объекта карты
     * @private
     * @property mapObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style({
        marker: new MarkerStyle({markerId: RED_CIRCLE_SVG_MARKER_ID}),
        stroke: new Stroke({color: 'red', width: '2px'})
    });

    /**
     * Функция обратного вызова при успешном завершении промиса
     * @property resolveFunction {GeoJsonType | true}
     */
    resolveFunction?: (result: GeoJsonType | true) => void;
    /**
     * Функция обратного вызова при ошибке при выролнении промиса
     * @property rejectFunction {void}
     */
    rejectFunction?: () => void;

    /**
     * Тип курсора мыши
     * @private
     * @property cursor {CURSOR_TYPE}
     */
    private cursor: CURSOR_TYPE;

    /**
     * Имя объекта для маркера
     * @private
     * @readonly
     * @property objectName {string}
     */
    private objectName = '';

    private toolTipIsEnabled = false;

    /**
     * Флаг разрешение на прорисовку
     * @private
     * @readonly
     * @property isRender {boolean}
     */
    private isRender = true;

    /**
     * Объект отрисовки HTML элемента
     * @private
     * @readonly
     * @property mapObjectsTooltipViewer {HTMLTooltipRenderable}
     */
    private readonly mapObjectsTooltipViewer = new HTMLTooltipRenderable();

    /**
     * @constructor GwtkDrawTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
        this.actionRegistry.push(
            {
                getConstructor() {
                    return DrawPointAction;
                },
                id: DRAW_POINT_ACTION,
                active: false,
                enabled: true,
            },
            {
                getConstructor() {
                    return DrawPolygonAction;
                },
                id: DRAW_POLYGON_ACTION,
                active: false,
                enabled: true,
            },
            {
                getConstructor() {
                    return DrawGeoJsonAction;
                },
                id: DRAW_GEOJSON_ACTION,
                active: false,
                enabled: true,
            }
        );
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            actionId: '',
            setState: this.setState.bind(this),
        };

        this.cursor = CURSOR_TYPE.default;
    }

    /**
     * Установить текущие параметры
     * @method setState
     */
    setState<K extends keyof GwtkDrawTaskState>(key: K, value: GwtkDrawTaskState[K]) {

        switch (key) {
            case COMMIT_OBJECT:
                let actionid = this.widgetProps.actionId ? this.widgetProps.actionId : '';
                this.mapObject = value as MapObject;
                if (this.mapObject) {
                    let crsString = '';
                    if (this.map.getCrsString().includes('EPSG:')) {
                        crsString = this.map.getCrsString().split(':')[1];
                    }
                    const crs: CRS = {
                        type: 'name',
                        properties: {
                            name: 'urn:ogc:def:crs:EPSG::'+ crsString,
                        }
                    };
                    const json: GeoJsonType = {
                        type: 'FeatureCollection',
                        crs: crs,
                        features: [this.mapObject.toJSON()],
                    };
                    if (this.resolveFunction) {
                        this.resolveFunction(json);
                        this.rejectFunction = undefined;
                        this.resolveFunction = undefined;
                    }
                }
                this.setAction(actionid, false);
                this.map.requestRender();
                break;
            case DRAW_ACTION_ID:
                const id = value as string;
                const newActionState = this._action && this._action.id === id;
                this.setAction(id, !newActionState);
                break;
            case SET_JSON:
                this.json = value as GeoJsonType;
                break;
            case SET_BUFFER_ZONE_RADIUS:
                this.radius = value as number;
                break;
            case COMMIT_GEOJSON_OBJECT:
                if (this.json) {
                    this.uploadJSON(this.json);
                }
                break;
            case ACTION_COMMIT:
                if (this._action) {
                    this._action.commit();
                }
                break;
            case ACTION_CANCEL:
                if (this._action) {
                    this._action.revert();
                }
                break;
            case SET_DRAW_MODE:
                this.clear();
                const callback = value as { resolve: (value: any) => void; reject: () => void; };
                this.resolveFunction = callback.resolve;
                this.rejectFunction = callback.reject;
                break;
            case SET_MAP_MARK_COORD:
                this.clear();
                this.mapMarkCoord.splice(0);
                this.mapMarkCoord.push(...value as [string, string]);
                const tempVectorLayer = VectorLayer.getEmptyInstance(this.map);
                this.mapObject = new MapObject(tempVectorLayer, MapObjectType.Point, {
                    local: LOCALE.Point,
                    id: 'newobject.1'
                });
                const pointXY = new MapPoint(+this.mapMarkCoord[1], +this.mapMarkCoord[0]);
                this.mapObject.addPoint(pointXY);
                this.map.fitMapObject(this.mapObject);
                this.objectName = decodeURIComponent(this.map.options.forcedParams?.objectname || '');
                this.isRender = true;
                break;
            case SET_TOOLTIP_ENABLED:
                this.toolTipIsEnabled = value as boolean;
                break;
            case CLEAR:
                this._action?.revert();
                this.clear();
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     * Установить обработчик
     * @method setAction
     * @param id {string} идентификатор обработчика
     * @param active {boolean} признак активности
     */
    private setAction(id: string, active: boolean) {
        if (active) {
            this.widgetProps.actionId = id;
            this.doAction(id);
        } else {
            this.quitAction(id);
            this.widgetProps.actionId = '';
        }
    }

    /**
     * Обработчик события перед рисованием карты
     * @method onPreRender
     */
    onPreRender(renderer: SVGrenderer) {
        if (this.mapObject && this.mapObject.isDirty) {
            this.mapObject.isDirty = false;
            this.map.requestRender();
        }
        if (this.isRender && this.objectName) {
            const element = this.createTooltipHtmlElement(this.mapObject);
            if (element) {
                this.mapObjectsTooltipViewer.update(this.map.htmlRenderer, [element]);
                this.map.requestRender();
            }
            this.isRender = false;
        }
    }

    /**
     * Обработчик события после отрисовки карты
     * @method onPostRender
     */
    onPostRender(renderer: SVGrenderer) {
        if (this.mapObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObject, this.mapObjectStyle);
            if (this.objectName) {
                this.mapObjectsTooltipViewer.drawRenderable(this.map.htmlRenderer);
            }
        }
    }

    /**
     * Очистка
     * @method clear
     */
    private clear() {
        this.mapObject = undefined;
        this.objectName = '';
        this.toolTipIsEnabled = false;
        this.isRender = false;
        this.mapObjectsTooltipViewer.clear();
        if (this.geoJsonIdList.length) {
            this.geoJsonIdList.forEach(id => this.removeLayer(id));
            this.geoJsonIdList.splice(0);
        }
        this.map.requestRender();
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
        if (type === VIEW_SETTINGS_MAPCENTER) {
            //иначе не перерисовывается в процессе перемещения
            this.isRender = true;
            this.map.requestRender();
        }
    }

    /**
     * Загружает файл карты на сервер
     * @private
     * @method uploadJSON
     * @param geoJSONData {GeoJsonType} Класс коллекции объектов GeoJSON
     * @param fileName {string} имя файла
     */
    private uploadJSON(geoJSONData: GeoJsonType, fileName: string = 'Temporary') {

        const crsName = geoJSONData.crs ? (geoJSONData.crs.type === 'name' ? geoJSONData.crs.properties.name : '') : '';

        const blob = new Blob([JSON.stringify(geoJSONData)], {type: 'application/json'});

        const file = new File([blob], fileName + '.json', {type: 'application/json'});

        const uploader = new FileUploader(file, {url: this.map.options.url});
        uploader.upload();
        // this.mapWindow.addSnackBarMessage(i18n.tc('draw.Uploading a file to the server'));
        uploader.onSuccess((res: UploadFileResponse['restmethod']) => {
            this.loadData(res.file.path, crsName);
        });
        uploader.onError(() => {
            this.map.writeProtocolMessage({
                text: i18n.tc('draw.Error uploading a file to the server') + '!',
                type: LogEventType.Error,
                display: true
            });
            if (this.rejectFunction) {
                this.rejectFunction();
                this.rejectFunction = undefined;
                this.resolveFunction = undefined;
                this.setAction(DRAW_GEOJSON_ACTION, false);
            }
        });
    }

    /**
     * Создание пользовательского слоя по файлу JSON
     * @private
     * @method loadData
     */
    private loadData(uploadLink: string, crsName?: string) {
        const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
        const httpParams = RequestServices.createHttpParams(this.map, {url: serviceUrl});
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: 'service',
            LAYERNAME: 'TempLayer',
            CRS: crsName || this.map.getCrsString(),
            CREATEMAPSCALE: '' + PUBLISH_MAP_SCALE,
            FILENAME: uploadLink
        };

        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);

        cancellableRequest.promise.then(response => {
            // this.mapWindow.addSnackBarMessage(i18n.tc('draw.Publishing an object'));
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    this.jobId = response.data.restmethod.outparams.jobId;
                }
            }
            if (this.jobId !== undefined) {
                this.getStatusResponse(this.jobId, serviceUrl);
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('draw.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
            if (this.rejectFunction) {
                this.rejectFunction();
                this.rejectFunction = undefined;
                this.resolveFunction = undefined;
                this.json = undefined;
                this.radius = undefined;
                this.setAction(DRAW_GEOJSON_ACTION, false);
            }
        });

    }

    /**
     * Получить информацию о статусе асинхронного процесса
     * @private
     * @method getStatusResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     */
    private getStatusResponse(processId: string, serviceUrl: string) {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        window.setTimeout(async () => {
            const request = service.getAsyncStatusData.bind(service) as () => Promise<ServiceResponse<GetStatusDataResponse>>;
            const cancellableRequest = RequestService.sendCancellableRequest(request, {PROCESSNUMBER: processId});
            try {
                const response = await cancellableRequest.promise;
                if (response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    if (statusMessage === 'Accepted' || statusMessage === 'Running') {
                        return this.getStatusResponse(processId, serviceUrl);
                    } else if (statusMessage === 'Succeeded') {
                        processId = response.data.restmethod.outparams.jobId;
                    } else if (statusMessage === 'Failed') {
                        this.map.writeProtocolMessage(
                            {
                                text: i18n.tc('draw.Error executing query') + '!',
                                type: LogEventType.Error,
                                display: true
                            }
                        );
                        return;
                    }
                }
                if (processId !== undefined && response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    this.processResponse(processId, serviceUrl, statusMessage);
                }
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('draw.Error executing query'),
                    display: true,
                    description: gwtkError.message,
                    type: LogEventType.Error
                });
                if (this.rejectFunction) {
                    this.rejectFunction();
                    this.rejectFunction = undefined;
                    this.resolveFunction = undefined;
                    this.setAction(DRAW_GEOJSON_ACTION, false);
                }
            }
        }, 1000);
    }

    /**
     * Обработать промежуточный этап поиска
     * @private
     * @method processResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     * @param statusMessage {string} Сообщение от сервера
     */
    private processResponse(processId: string, serviceUrl: string, statusMessage: string) {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<GetLoadDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, {PROCESSNUMBER: processId});
        cancellableRequest.promise.then((result: ServiceResponse<GetLoadDataResponse>) => {
            if (result.data && result.data.restmethod.createlayerlist[0].id) {
                this.addLayer(result.data.restmethod.createlayerlist[0].id).then(id => {
                    const layer = this.map.tiles.getLayerByxId(id);
                    if (layer) {
                        this.map.searchManager.findAllObjects([layer]).then((result) => {
                            const mapObject = result.mapObjects[0];
                            this.map.fitMapObject(mapObject);
                            if (this.radius) {
                                this.buildZone(id);
                            } else {
                                if (this.resolveFunction) {
                                    this.resolveFunction(this.json||true);
                                    this.rejectFunction = undefined;
                                    this.resolveFunction = undefined;
                                    this.setAction(DRAW_GEOJSON_ACTION, false);
                                }
                            }
                        });
                    }
                });
            } else if (result.error) {
                const gwtkError = new GwtkError(result.error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('draw.Error executing query'),
                    description: gwtkError.message,
                    display: true,
                    type: LogEventType.Error
                });
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('draw.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }

    /**
     * Удалить слой
     * @private
     * @method removeLayer
     * @param id {string} Идентификатор слоя
     */

    removeLayer(id: string) {
        this.map._removeLayer(id);
    }

    /**
     * Добавить слой
     * @private
     * @method addLayer
     * @param idLayer {string} Идентификатор слоя
     */

    addLayer(idLayer: string): Promise<string> {
        const url = this.map.options.url + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png' +
            '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=' + encodeURIComponent(idLayer);
        const id = Utils.generateGUID();

        const tooltip = this.toolTipIsEnabled ? {
            'objectName': true,
            'layerName': true,
            'image': false,
            'semanticKeys': [
                'ObjName'
            ]
        } : undefined;

        const layer = {
            id,
            alias: 'Temp_1',
            url: url,
            selectObject: true,
            tooltip
        };
        this.map.options.layers.push(layer);
        this.map.addLayer(layer);
        this.map.tiles.wmsUpdate();
        this.geoJsonIdList.push(id);
        return new Promise(resolve =>
            resolve(id)
        );
    }

    /**
     * Построить буферную зону для заданного объекта
     * @private
     * @method buildZone
     * @param id{string} Идентификатор слоя-объекта
     */

    buildZone(id: string) {
        const layer = this.map.tiles.getLayerByxId(id);

        if (layer) {
            this.map.searchManager.findAllObjects([layer], false, {withoutMetric:true}).then((result) => {

                const buildZoneParam: BuildZoneParams = {
                    LAYER: layer.idLayer,
                    IDLIST: result.mapObjects[0].gmlId,
                    RADIUS: '' + this.radius,
                    SEVERALOBJ: SEVERALOBJ.UnionZons,
                    OUTTYPE: 'JSON',
                    CRS: this.map.getCrsString()

                };

                const serviceUrl = this.map.options.url;
                const httpParams: HttpParams = {
                    url: serviceUrl,
                    responseType: 'json',
                    timeout: 601000
                };

                const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST) || undefined;


                service.buildZone(buildZoneParam, httpParams).then(result => {
                    if (result.data) {
                        const geoJsonMain = new GeoJSON(result.data);

                        if (geoJsonMain.featureCollection.getFeatureCount() === 0) {
                            this.map.writeProtocolMessage(
                                {
                                    text: i18n.tc('draw.Build buffer zone') + '. ' + i18n.tc('draw.Failed to get data') + '!',
                                    type: LogEventType.Error
                                }
                            );
                            if (this.rejectFunction) {
                                this.rejectFunction();
                                this.rejectFunction = undefined;
                                this.resolveFunction = undefined;
                                this.setAction(DRAW_GEOJSON_ACTION, false);
                                this.radius = undefined;
                            }
                            return;
                        }

                        for (let numFeatures = 0, geoJsonFeature; (geoJsonFeature = geoJsonMain.featureCollection.getFeature(numFeatures)); numFeatures++) {
                            geoJsonFeature.properties.sld =
                                new Style({
                                    fill: new Fill({
                                        color: 'red',
                                        opacity: 0.3
                                    }),
                                    stroke: new Stroke({
                                        color: 'red',
                                        opacity: 0.75
                                    })
                                }).toServiceSVG();

                        }
                        const newLayerId = Utils.generateGUID();
                        const alias = 'Buffer';

                        this.map.openLocalLayer(this.map, {
                            id: newLayerId,
                            alias,
                            url: 'localhost'
                        }, geoJsonMain.toString());

                        // добавить слой в дерево
                        const treeNode: ContentTreeNode = {
                            id: newLayerId,
                            nodeType: TreeNodeType.LocalLayer,
                            text: alias,
                            parentId: USER_LAYERS_FOLDER_ID
                        };
                        this.map.onLayerListChanged(treeNode);
                        this.geoJsonIdList.push(newLayerId);
                        if (this.resolveFunction) {
                            this.resolveFunction(result.data);
                            this.rejectFunction = undefined;
                            this.resolveFunction = undefined;
                            this.setAction(DRAW_GEOJSON_ACTION, false);
                            this.radius = undefined;
                        }
                    } else {
                        this.map.writeProtocolMessage(
                            {
                                text: i18n.tc('draw.Build buffer zone') + '. ' + i18n.tc('draw.Failed to get data') + '!',
                                type: LogEventType.Error
                            }
                        );
                        if (this.rejectFunction) {
                            this.rejectFunction();
                            this.rejectFunction = undefined;
                            this.resolveFunction = undefined;
                            this.radius = undefined;
                            this.setAction(DRAW_GEOJSON_ACTION, false);
                        }
                    }
                }).catch((e: Error) => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('draw.Build buffer zone') + '. ' + i18n.tc('draw.Failed to get data') + '! ',
                        description: e.message,
                        type: LogEventType.Error,
                        display: true
                    });
                    if (this.rejectFunction) {
                        this.rejectFunction();
                        this.rejectFunction = undefined;
                        this.resolveFunction = undefined;
                        this.radius = undefined;
                        this.setAction(DRAW_GEOJSON_ACTION, false);
                    }
                });
            });
        }
    }

    /**
     * Создание всплывающего элемента
     * @private
     * @async
     * @method createTooltipHtmlElement
     * @param mapObject {MapObject} Объект карты
     * @return {HTMLDivElement|undefined} HTML элемент рисования пути
     */
    private createTooltipHtmlElement(mapObject?: MapObject): HTMLDivElement | undefined {

        if (mapObject) {
            const objectName = decodeURIComponent(this.map.options.forcedParams?.objectname || '');
            let width = TOOLTIP_BASE_WIDTH;

            const element = document.createElement('div');

            element.classList.add('pa-4');

            element.style.position = 'absolute';
            element.style.zIndex = '708';

            element.style.backgroundColor = 'var(--color-white)';
            element.style.borderRadius = '4px';
            element.style.boxShadow = '0px 0px 2px  var(--v-secondary-lighten5), 0px 2px 2px var(--v-secondary-lighten5)';
            element.style.minWidth = '150px';
            element.style.maxWidth = '250px';
            const headerDiv = document.createElement('div');

            headerDiv.style.display = 'flex';
            headerDiv.style.flexDirection = 'row-reverse';

            const closeButton = document.createElement('button');

            closeButton.classList.add('button');
            closeButton.classList.add('v-btn');
            closeButton.classList.add('v-btn--plain');
            closeButton.classList.add('v-btn--text');
            closeButton.classList.add('button_theme_secondary');
            closeButton.classList.add('button_align_center');

            closeButton.onclick = () => this.clear();

            const closeButtonSpan = document.createElement('span');
            closeButtonSpan.classList.add('v-btn__content');

            const closeButtonSpanIcon = document.createElement('i');
            closeButtonSpanIcon.classList.add('v-icon');
            closeButtonSpanIcon.classList.add('notranslate');
            closeButtonSpanIcon.classList.add('icon');
            closeButtonSpanIcon.classList.add('button__content');
            closeButtonSpanIcon.classList.add('button__content_icon');
            closeButtonSpanIcon.classList.add('mdi');
            closeButtonSpanIcon.classList.add('mdi-close');
            closeButtonSpanIcon.style.color = 'var(--v-primary-base)';
            closeButtonSpan.appendChild(closeButtonSpanIcon);
            closeButton.appendChild(closeButtonSpan);

            headerDiv.appendChild(closeButton);

            //Имя метки
            const nameDiv = document.createElement('p');
            nameDiv.classList.add('text-subtitle-1');
            nameDiv.classList.add('font-weight-bold');
            nameDiv.classList.add('ma-0');
            nameDiv.style.color = 'var(--v-secondary-lighten1)';
            nameDiv.style.setProperty('overflow-wrap', 'break-word');

            nameDiv.textContent = objectName;

            element.appendChild(headerDiv);
            element.appendChild(nameDiv);

            //Положение на экране
            const windowHeight = mapObject.vectorLayer.map.getWindowSize()[1];
            const windowWidth = mapObject.vectorLayer.map.getWindowSize()[0];

            const tooltipPoint = this.map.planeToPixel(new MapPoint(+this.mapMarkCoord[1], +this.mapMarkCoord[0]));
            const resultPoint = tooltipPoint.subtract(new PixelPoint(0.3 * width, windowHeight + 16));

            if (resultPoint.x > 0) {
                if (resultPoint.x < windowWidth - width) {
                    element.style.left = resultPoint.x + 'px';
                } else {
                    element.style.left = windowWidth - width + 'px';
                }
            } else {
                element.style.left = '0';
            }

            if (-resultPoint.y > 0) {
                if (-resultPoint.y < windowHeight - TOOLTIP_BASE_HEIGHT) {
                    element.style.bottom = -resultPoint.y + 'px';
                } else {
                    element.style.top = '0';
                }
            } else {
                element.style.bottom = '0';
            }
            return element;
        }
    }

}
