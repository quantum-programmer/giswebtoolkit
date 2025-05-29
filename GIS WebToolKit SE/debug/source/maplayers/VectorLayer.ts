/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Векторный слой                            *
 *                                                                  *
 *******************************************************************/

import VectorSource from '~/sources/VectorSource';
import {GwtkMap, DownloadFormat} from '~/types/Types';
import Layer from '~/maplayers/Layer';
import {GwtkLayerDescription} from '~/types/Options';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import Classifier, {ClassifierTypeSemanticValue} from '~/classifier/Classifier';
import SemanticList from '~/classifier/SemanticList';
import {VIEW_SETTINGS_ZOOM_LEVEL} from '~/utils/WorkspaceManager';
import {CRS, FeatureProperties, GeoJsonType} from '~/utils/GeoJSON';
import Style from '~/style/Style';
import AbstractVectorSource from '~/sources/AbstractVectorSource';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';
import Utils from '~/services/Utils';
import GwtkError from '~/utils/GwtkError';
import { GetLoadDataResponse, GetStatusDataResponse, LoadData, UploadFileResponse } from '~/services/RequestServices/RestService/Types';
import { LogEventType } from '~/types/CommonTypes';
import FileUploader from '~/utils/FileUploader';
import GeoJsonSource from '~/sources/GeoJsonSource';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import RequestService from '~/services/RequestServices/common/RequestService';
import { ServiceResponse } from '~/services/Utils/Types';


/**
 * Векторный слой
 * @class VectorLayer
 */
export default class VectorLayer extends Layer {

    private readonly objectImages: { [key: string]: { src: string; path: string; }[] } = {};

    /**
     * Источник данных для отображения
     * @private
     * @readonly
     * @property {VectorSource} source
     */
    protected readonly source: AbstractVectorSource = new VectorSource();

    get editingData() {
        let result;
        if (this.map.options.settings_mapEditor) {
            const editingData = this.map.options.settings_mapEditor.editingdata;
            if (editingData) {
                for (let i = 0; i < editingData.length; i++) {
                    if (editingData[i].layerid === this.xId) {
                        result = editingData[i].objects;
                        break;
                    }
                }
            }
        }
        return result;
    }

    get externalFunctions() {
        return this.options.externalFunctions;
    }

    protected semanticList: SemanticList;

    readonly classifier: Classifier;

    /**
     * @constructor VectorLayer
     * @param map {GwtkMap} Экземпляр карты
     * @param options {Options} Параметры слоя
     */
    constructor(map: GwtkMap, options: GwtkLayerDescription) {
        super(map, options);

        let endIndex = this.url.indexOf('?');
        if (endIndex === -1) {
            endIndex = this.url.length;
        }
        this.server = this.url.substring(0, endIndex);

        this.classifier = this.map.classifiers.createByLayer(this);

        this.semanticList = new SemanticList({
            serviceUrl: this.serviceUrl,
            layerId: this.idLayer,
            filters: {INMAP: '1'}
        }, this.map);

    }

    get serviceUrl() {
        return '';
    }

    destroy() {
        super.destroy();
        this.source.destroy();
    }

    /**
     * Метод, вызываемый перед удалением
     * @method onRemove
     */
    onRemove() {
        this.destroy();
        // уведомить задачи карты
        this.map.trigger({type: 'layerlistchanged', target: 'map'});
    }

    createMapObject(type: MapObjectType = MapObjectType.LineString, properties?: FeatureProperties, style?: Style): MapObject {
        const mapObject = new MapObject(this, type, properties);
        if (style) {
            mapObject.addStyle(style);
        }
        mapObject.objectNumber = 0;

        return mapObject;
    }

    /**
     * Обновить объект в источнике
     * @async
     * @method commit
     * @param mapObject {MapObject} Объект карты
     */
    async commitMapObject(mapObject: MapObject) {
        return await this.source.commit(mapObject);
    }

    /**
     * Обновить объект из источника
     * @async
     * @method commit
     * @param mapObject {MapObject} Объект карты
     * @param [params] { geometry?: boolean; properties?: boolean; } Параметры обновления
     */
    async reloadMapObject(mapObject: MapObject, params: { geometry?: boolean; properties?: boolean; } = {
        geometry: true,
        properties: true
    }): Promise<void> {
        await this.source.reload(mapObject, {geometry: !!params.geometry, properties: !!params.properties});
    }

    /**
     * Загрузить метрику
     * @async
     * @method loadGeometry
     * @param mapObject {MapObject} Объект карты
     */
    async loadGeometry(mapObject: MapObject): Promise<void> {
        const response = await this.source.requestGeometry(mapObject);
        if (response && response.features && response.features.length) {
            const feature = response.features[0];
            if (feature && feature.geometry) {
                mapObject.updateGeometryFromJSON(feature);
            }
            if (feature.bbox) {
                mapObject.setBBox(feature.bbox);
            }
        } else if (!(this.source instanceof VectorSource)) {
            throw Error('Undefined object');
        }
    }


    /**
     * Получить список значений семантик типа "классификатор" по ключу семантики
     * @async
     * @method getClassifierSemanticValuesByKey
     * @param key {string} Ключ семантики
     * @return {Promise<ClassifierTypeSemanticValue[]>} Promise со списком значений семантик типа "классификатор"
     */
    async getClassifierSemanticValuesByKey(key: string): Promise<ClassifierTypeSemanticValue[]> {
        if (this.classifier) {
            return await this.classifier.getClassifierSemanticValuesByKey(key);
        }
        return [];
    }

    getClassifierLayerSemanticsList() {
        return this.semanticList.getClassifierLayerSemanticsList();
    }

    getLayerSemantics(layerId: string) {
        return this.semanticList.getLayerSemantics(layerId);
    }

    /**
     * Получить список всех семантик
     * @method getAllSemantics
     */
    getAllSemantics() {
        return this.semanticList.getAllSemantics();
    }

    getLegendImageUrl({layerId, key}: MapObject): Promise<string> {
        return this.legendInstance.getLegendImageUrl({layerId, key});
    }

    cancelRequests() {
        super.cancelRequests();
        this.semanticList.cancelRequest();
    }

    getObjectImages(gmlId: string) {
        if (!this.objectImages[gmlId]) {
            this.objectImages[gmlId] = [];
        }
        return this.objectImages[gmlId];
    }

    addObjectImage(gmlId: string, objectImage: { src: string; path: string }) {
        if (!this.objectImages[gmlId]) {
            this.objectImages[gmlId] = [];
        }
        if (!this.objectImages[gmlId].find(image => image.path === objectImage.path)) {
            this.objectImages[gmlId].push(objectImage);
        }
    }

    removeObjectImage(gmlId: string, imagePath: string) {
        if (this.objectImages[gmlId]) {
            const index = this.objectImages[gmlId].findIndex(image => image.path === imagePath);
            if (index !== -1) {
                this.objectImages[gmlId].splice(index, 1);
                //todo: для GwtkMapObjectTooltipTask - иначе не обновятся списки загруженных объектов
                this.map.trigger({
                    type: 'workspacechanged',
                    target: 'map',
                    item: {key: VIEW_SETTINGS_ZOOM_LEVEL, value: this.map.options.tilematrix}
                });
            }
        }
    }

    startTransaction() {
        try {
            this.source.startTransaction();
        } catch (error) {
            const gwtkError = new GwtkError(error);
            throw Error(gwtkError.message + '.' + 'Layer:' + this.alias);
        }
    }

    commitTransaction() {
        return this.source.commitTransaction();
    }

    reloadTransaction(params: { geometry?: boolean; properties?: boolean; } = {
        geometry: true,
        properties: true
    }): Promise<unknown> {

        return this.source.reloadTransaction({geometry: !!params.geometry, properties: !!params.properties});
    }

    cancelTransaction(): void {
        return this.source.cancelTransaction();
    }

    async download(formatOptions?: DownloadFormat): Promise<Blob | undefined> {
        if (!formatOptions || formatOptions.outType === OUTTYPE.JSON) {
            return this.source.blob;
        } else {
            this.downloadMapObjects(formatOptions.outType);
        }
    }

    private async downloadMapObjects(type: OUTTYPE, fileName: string = 'Layer') {
        const crs: CRS = {
            type: 'name',
            properties: {
                name: this.map.getCrsString(),
            }
        };

        const features = [];
        let resulMapObjectList: MapObject[] = [];
        const mapObjectsIterator = (this.source as GeoJsonSource).mapObjectList || [];
        if (mapObjectsIterator) {
            for (let i = 0; i < mapObjectsIterator.length; i++) {
                resulMapObjectList.push(mapObjectsIterator[i]);
            }
        }

        for (let i = 0; i < resulMapObjectList.length; i++) {
            await resulMapObjectList[i].reload({ geometry: true, properties: true });
            features.push(resulMapObjectList[i].toJSON());
        }

        const geoJSONData: GeoJsonType = {
            type: 'FeatureCollection',
            crs: crs,
            features
        };

        const crsName = geoJSONData.crs ? (geoJSONData.crs.type === 'name' ? geoJSONData.crs.properties.name : '') : '';

        geoJSONData.features.forEach(feature => delete feature.properties.sld);

        const blob = new Blob([JSON.stringify(geoJSONData)], { type: 'application/json' });

        const file = new File([blob], fileName + '.json', { type: 'application/json' });

        this.map.taskManagerNew.showOverlayPanel();
        const uploader = new FileUploader(file, { url: this.map.options.url });
        uploader.upload();
        uploader.onSuccess((res: UploadFileResponse['restmethod']) => {
            this.loadData(res.file.path, type, crsName);
        });
        uploader.onError(() => {
            this.map.taskManagerNew.removeOverlayPanel();
            this.map.writeProtocolMessage({
                text: this.map.translate('Error uploading a file to the server') + '!',
                type: LogEventType.Error,
                display: true
            });
        });
    }

    protected loadData(uploadLink: string, type: OUTTYPE, crsName?: string) {
        const serviceUrl = this.map.options.url;
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: 'service',
            LAYERNAME: this.alias,
            CRS: crsName || this.map.getCrsString(),
            CREATEMAPSCALE: '' + 1000000,
            FILENAME: uploadLink
        };

        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);

        cancellableRequest.promise.then(response => {
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    const jobId = response.data.restmethod.outparams.jobId;
                    let canRequest = true;
                    const interval = setInterval(() => {
                        if (canRequest) {
                            canRequest = false;
                            (service.getAsyncStatusData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetStatusDataResponse>>).then((result) => {
                                if (result.data) {
                                    if (result.data.restmethod?.outparams?.status) {
                                        if (result.data.restmethod.outparams.status === 'Succeeded') {
                                            clearInterval(interval);
                                            (service.getAsyncResultData({ PROCESSNUMBER: jobId }) as Promise<ServiceResponse<GetLoadDataResponse>>).then((result) => {
                                                if (result.data) {
                                                    const idLayer = result.data.restmethod.createlayerlist[0].id;
                                                    this.map.downLoadLayerByPath(idLayer, type);
                                                    this.map.taskManagerNew.removeOverlayPanel();
                                                }
                                            });
                                        } else if (result.data.restmethod.outparams.status === 'Failed') {
                                            canRequest = true;
                                            this.map.taskManagerNew.removeOverlayPanel();
                                            clearInterval(interval);
                                            this.map.addSnackBarMessage(this.map.translate('Failed to download objects'));
                                        } else if (result.data.restmethod.outparams.status === 'Accepted' || result.data.restmethod.outparams.status === 'Running') {
                                            canRequest = true;
                                        } else {
                                            this.map.taskManagerNew.removeOverlayPanel();
                                            clearInterval(interval);
                                        }
                                    }
                                } else {
                                    this.map.taskManagerNew.removeOverlayPanel();
                                    clearInterval(interval);
                                    this.map.addSnackBarMessage(this.map.translate('Failed to download objects'));
                                }
                            });
                        }
                    }, 1000);
                }
            }
        }).catch((error) => {
            this.map.taskManagerNew.removeOverlayPanel();
            this.map.writeProtocolMessage({
                text: this.map.translate('Failed to download objects'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }



    static getEmptyInstance(map: GwtkMap, alias = '', url = ''): VectorLayer {
        return new VectorLayer(map, {alias, id: Utils.generateGUID(), url});
    }

}
