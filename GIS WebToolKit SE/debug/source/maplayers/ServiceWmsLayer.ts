/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Сервисный WMS слой на GISWebServiceSE                *
 *                                                                  *
 *******************************************************************/


import { GwtkMap, DownloadFormat } from '~/types/Types';
import { GwtkLayerDescription } from '~/types/Options';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { GetMapImageParams, GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import Layer from '~/maplayers/Layer';
import { BrowserService } from '~/services/BrowserService';
import { Bounds } from '~/geometry/Bounds';
import RequestService, { StandardRequest } from '~/services/RequestServices/common/RequestService';
import { GeoJsonType } from '~/utils/GeoJSON';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';


type LayerItem = {
    guid?: string;
    id: string;
    objectIds: Set<string>;
    color?: string;
}
type LayerItemInput = {
    id: string;
    objectIds: string[];
    color?: string;
}

/**
 *  Сервисный WMS слой на GISWebServiceSE
 * @class ServiceWmsLayer
 * @extends Layer
 */
export default class ServiceWmsLayer extends Layer {

    private readonly getWmsImage: StandardRequest<GetMapImageParams[], Blob>;

    private abortXhr?: () => void;
    private readonly wmsDrawingHandler: () => void;
    private readonly wmsUpdateHandler: () => void;

    /**
     * @constructor ServiceWmsLayer
     * @param map {GwtkMap} Экземпляр карты
     * @param options {Options} Параметры слоя
     */
    constructor(map: GwtkMap, options: GwtkLayerDescription) {
        super(map, options);

        const httpParams = RequestServices.createHttpParams(this.map, {
            url: this.serviceUrl
        });

        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        this.getWmsImage = service.getWmsImage.bind(service);

        this.wmsDrawingHandler = this.draw.bind(this);
        this.wmsUpdateHandler = this.requestImage.bind(this);

        this.map.on({ type: 'postwmsdrawing' }, this.wmsDrawingHandler);
        this.map.on({ type: 'postwmsupdate' }, this.wmsUpdateHandler);
    }

    destroy() {
        super.destroy();
        this.map.off({ type: 'postwmsdrawing' }, this.wmsDrawingHandler);
        this.map.off({ type: 'postwmsupdate' }, this.wmsUpdateHandler);
        this.map.redraw();
    }

    onRemove() {
        super.onRemove();
        this.destroy();
    }

    /**
     * URL-адрес источника
     * @property serviceUrl {string}
     */
    get serviceUrl() {
        return this.server || '';
    }

    readonly layers: LayerItem[] = [];

    private imageItem?: { bounds: Bounds; image: HTMLImageElement; };

    private async requestImage() {

        if (this.abortXhr) {
            this.abortXhr();
        }

        if (this.layers.length === 0) {
            this.imageItem = undefined;
            this.map.redraw();
            return;
        }

        const [width, height] = this.map.getWindowSize();
        const bounds = this.map.getWindowBounds();
        const minOrigin = bounds.min.toOrigin();
        const maxOrigin = bounds.max.toOrigin();
        const BBOX = [minOrigin[0], minOrigin[1], maxOrigin[0], maxOrigin[1]].join();
        const CRS = this.map.getCrsString();
        const WIDTH = width + '';
        const HEIGHT = height + '';
        const FORMAT = 'png';

        const options: GetMapImageParams[] = [{
            LAYER: '',
            CRS,
            BBOX,
            WIDTH,
            HEIGHT,
            FORMAT,
            ONLYSELECTOBJECTS: '1',
            COLOR: '8F43EE'
        }];

        this.layers.forEach(layer => {
            options.push({
                LAYER: layer.id,
                IDLIST: Array.from(layer.objectIds).join(','),
                COLOR: layer.color || undefined
            } as unknown as GetMapImageParams);
        });

        const httpParams = RequestServices.createHttpParams(this.map, {
            url: this.serviceUrl,
            responseType: 'blob'
        });

        const request = RequestService.sendCancellableRequest(this.getWmsImage, options, httpParams);

        this.abortXhr = request.abortXhr;

        try {
            const response = await request.promise;
            const image = new Image(width, height);
            image.src = BrowserService.makeObjectURL(response.data);
            image.onload = () => {
                this.imageItem = { bounds, image };
                this.map.redraw();
            };
            this.abortXhr = undefined;
        } catch (error) {
            this.imageItem = undefined;
            this.map.redraw();
            this.abortXhr = undefined;
        }

    }

    /**
     * Добавить данные для рисования
     * @method addLayer
     * @param item {LayerItemInput} Данные для рисования
     * @param [guid] {string} Уникальный идентификатор для данных
     */
    addLayer(item: LayerItemInput, guid?: string) {
        let layer;
        if (guid) {
            layer = this.layers.find(layerItem => layerItem.guid === guid);
            if (!layer) {
                layer = { id: item.id, objectIds: new Set<string>(), color: item.color, guid };
                this.layers.push(layer);
            }
        } else {
            layer = this.layers.find(layerItem => layerItem.id === item.id && layerItem.guid === undefined);
        }

        if (!layer) {
            layer = { id: item.id, objectIds: new Set<string>(), color: item.color };
            this.layers.push(layer);
        }

        for (const objectId of item.objectIds) {
            layer.objectIds.add(objectId);
        }
    }

    clear() {
        this.layers.splice(0);
    }

    draw() {
        if (this.visible && this.imageItem) {
            const ctx = this.map._getCanvas()?.getContext('2d');
            if (ctx) {
                const minPixel = this.map.planeToPixel(this.imageItem.bounds.min);
                const maxPixel = this.map.planeToPixel(this.imageItem.bounds.max);

                const left = Math.min(minPixel.x, maxPixel.x);
                const top = Math.min(minPixel.y, maxPixel.y);
                const right = Math.max(minPixel.x, maxPixel.x);
                const bottom = Math.max(minPixel.y, maxPixel.y);

                const alpha = ctx.globalAlpha;

                ctx.globalAlpha = 1.0;
                ctx.drawImage(this.imageItem.image, left, top, right - left, bottom - top);

                ctx.globalAlpha = alpha;
            }
        }
    }

    forceUpdate() {
        return this.requestImage();
    }


    async download(formatOptions: DownloadFormat): Promise<Blob | undefined> {

        if (formatOptions.outType === OUTTYPE.JSON) {
            const options: GetFeatureParams[] = [{
                LAYER: '',
                OUTTYPE: OUTTYPE.JSON,
                OUTCRS: this.map.getCrsString()
            }];

            this.layers.forEach(layer => {
                options.push({
                    LAYER: layer.id,
                    IDLIST: Array.from(layer.objectIds).join(',')
                });
            });

            const httpParams = RequestServices.createHttpParams(this.map, {
                url: this.serviceUrl
            });

            const requestService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            const response = await requestService.getFeature<GeoJsonType>(options, httpParams);
            if (response) {
                if (response.data) {
                    const json = JSON.stringify(response.data);

                    return new Blob([json], { type: 'application/octet-stream' });
                }
            }
        }
    }


}
