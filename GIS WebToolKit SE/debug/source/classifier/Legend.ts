/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Легенда классификатора                      *
 *                                                                  *
 *******************************************************************/


import {GwtkMap, Legend, LegendBranchNode} from '~/types/Types';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {BYXSD_VALUE} from '~/services/RequestServices/common/enumerables';
import RestServiceParsers from '~/services/RequestServices/RestService/RestServiceParsers';
import RequestService from '~/services/RequestServices/common/RequestService';
import {AuthParams} from '~/types/CommonTypes';
import { Bounds } from '~/geometry/Bounds';
import {
    PROJECT_SETTINGS_MAP_LEGEND,
    PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG
} from '~/utils/WorkspaceManager';


type Params = {
    serviceUrl?: string;
    layerId?: string;
    filters?: Filters;
}

type Filters = {
    WIDTH?: '64' | '16' | '48' | '32' | '96';
    BYXSD?: BYXSD_VALUE;
    TYPENAMES?: string;
    UPDATE?: '1';
    COLOR?: string;
    KEYLIST?: string;
}

export default class LegendClass {

    private readonly legend: Legend = {nodes: []};
    private legendRequestPromise?: Promise<Legend>;

    private isReady = false;
    private abortXhr?: () => void;
    private map: GwtkMap | undefined;
    private lastRequestBbox: string | undefined;
    private bbox: string | undefined;

    private readonly authParams!: AuthParams;

    /**
     * @constructor
     * @param params{Params} Параметры для запроса
     * @param authParams{AuthParams} Http-параметры для запроса
     */
    constructor(private readonly params: Params = {}, authParams: AuthParams, map?: GwtkMap) {

        Reflect.defineProperty(this, 'authParams', {
            enumerable: true,
            get: function () {
                return authParams;
            }.bind(this)
        });

        if (map) {
            Reflect.defineProperty(this, 'map', {
                enumerable: true,
                get: function () {
                    return map;
                }.bind(this)
            });
        }
    }

    set serviceUrl(url: string) {
        this.params.serviceUrl = url;
    }

    get serviceUrl() {
        if (this.params.serviceUrl) {
            return this.params.serviceUrl;
        }
        return '';
    }

    /**
     * Получить легенду классификатора
     * @method getLegend
     * @return {Promise<Legend>} Promise с легендой
     */
    getLegend(): Promise<Legend> {
        return this.getLegendInstance();
    }

    async getLegendImageUrl({layerId, key}: { layerId?: string; key?: string; }): Promise<string> {

        if (layerId !== undefined && key !== undefined) {
            const legend = await this.getLegendInstance();

            const mapLegendLayer = legend.nodes.find(item => item.key === layerId);
            if (mapLegendLayer && mapLegendLayer.nodes) {
                const mapLegendLayerNode = mapLegendLayer.nodes.find(node => node.key === key);
                if (mapLegendLayerNode) {
                    return mapLegendLayerNode.image || '';
                }
            }

        }
        return '';
    }

    /**
     * Получить легенду классификатора
     * @private
     * @method getLegendInstance
     * @return {Promise<Legend>} Promise с легендой
     */
    private getLegendInstance(): Promise<Legend> {
        if (this.map && this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND)) {
            this.bbox = this.prepareBboxParameter(this.map.getWindowBounds());
            if (this.bbox !== this.lastRequestBbox) {
                this.legendRequestPromise = undefined;
                this.isReady = false;
                this.legend.nodes.splice(0);
            }
        } else if (this.lastRequestBbox) {
            this.lastRequestBbox = undefined;
            this.legendRequestPromise = undefined;
            this.isReady = false;
            this.legend.nodes.splice(0);
        }
        if (this.isReady) {
            return Promise.resolve(this.legend);
        }

        if (this.legendRequestPromise) {
            return this.legendRequestPromise;
        }

        return this.legendRequestPromise = this.requestLegend();
    }

    private prepareBboxParameter(bbox: Bounds) {
        if (this.map) {
            if (this.map.Translate.isGeoSys()) {
                const geobounds = this.map.tileMatrix.getGeoDegreeFrameFromPlaneFrame(bbox);
                if (geobounds) {
                    const geobbox = geobounds.toBBox();
                    return geobbox.join();
                }
                return '';
            }
            const bboxPlane = [];
            bboxPlane.push(...bbox.min.toOrigin().slice(0, 2));
            bboxPlane.push(...bbox.max.toOrigin().slice(0, 2));
            return bboxPlane.join(',');
        } else {
            return undefined;
        }
    }

    /**
     * Запросить легенду классификатора
     * @private
     * @async
     * @method requestLegend
     * @return {Promise<Legend>} Promise с легендой
     */
    private async requestLegend(): Promise<Legend> {
        if (this.params.serviceUrl && this.params.layerId) {
            const httpParams = RequestServices.createHttpParams(this.authParams, { url: this.params.serviceUrl });
            const restService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            try {
                const reduceSizeInterfaceFlag = this.map?.workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
                const {
                    BYXSD = BYXSD_VALUE.ByScheme,
                    TYPENAMES,
                    WIDTH = reduceSizeInterfaceFlag ? '32' : '48',
                    COLOR,
                    UPDATE
                } = this.params.filters || {};
                let BBOX;
                let CRS;
                if (this.map) {
                    const withMapExtent = this.map.workspaceManager.getValue(PROJECT_SETTINGS_MAP_LEGEND);
                    if (withMapExtent && BYXSD != BYXSD_VALUE.ByScheme) {
                        BBOX = this.bbox;
                        this.lastRequestBbox = BBOX;
                        CRS = this.map!.getCrsString();
                    }
                }
                const request = RequestService.sendCancellableRequest(restService.createLegend.bind(restService), {
                    LAYER: this.params.layerId,
                    BYXSD,
                    TYPENAMES,
                    COLOR,
                    UPDATE,
                    WIDTH,
                    BBOX,
                    CRS,
                    GETGRAPHOBJECTS: '0'
                });

                this.abortXhr = () => request.abortXhr('Cancelled by User');

                const legendResponse = await request.promise;
                if (this.map) {
                    this.map.getTaskManager().onDataChanged({ type: 'resetlayersvisibility' });
                }

                this.onLegendResponse(legendResponse.data);
            } catch (error) {
                this.onError();
                throw error;
            }

        }
        return this.legend;
    }

    private onLegendResponse(response?: string) {
        this.isReady = true;
        this.abortXhr = undefined;
        this.legendRequestPromise = undefined;

        if (response) {

            if (this.params.serviceUrl && this.params.layerId) {
                const parsedLegend = RestServiceParsers.parseLegendResponse(response, this.params.serviceUrl, this.params.layerId);
                if (parsedLegend) {

                    let result = parsedLegend.nodes;

                    if (this.params.filters?.KEYLIST) {
                        const keysList = this.params.filters.KEYLIST.split(',');

                        const filterResult = this.preFilterLegendsByKey(parsedLegend.nodes, keysList);

                        if (filterResult.length > 0) {
                            result = filterResult;
                        }
                    }

                    result.forEach(node => this.legend.nodes.push(node));
                }
            }
        } else {
            throw new Error('Failed to load legend');
        }

    }

    private onError() {
        this.clear();
    }

    cancelRequest() {
        if (this.abortXhr) {
            this.abortXhr();
            this.abortXhr = undefined;
        }
    }

    clear(): void {
        this.isReady = false;
        this.legendRequestPromise = undefined;
        this.cancelRequest();
    }

    fromJson(json: { legend?: Legend }) {
        this.isReady = true;
        if (json.legend) {
            this.legend.nodes.splice(0, this.legend.nodes.length, ...json.legend.nodes);
        }
    }

    /**
     * Отфильтровать список легенд по ключу
     * @private
     * @method preFilterLegendsByKey
     * @param legendBranchNodes { LegendBranchNode[] } - список легенд
     * @param keysList { String[] }  - список ключей
     * @return { LegendBranchNode[] } Отфильтрованный список легенд
     */
    private preFilterLegendsByKey(legendBranchNodes: LegendBranchNode[], keysList: string[]): LegendBranchNode[] {
        const result: LegendBranchNode[] = [];

        legendBranchNodes.forEach(legendLayer => {

            const nodes = legendLayer.nodes.filter(legendNodeItem => keysList.includes(legendNodeItem.key));

            if (nodes.length > 0) {
                const {key, text, icon, image, type} = legendLayer;

                result.push({
                    nodes,
                    key,
                    text,
                    icon,
                    image,
                    type
                });
            }

        });

        return result;
    }
}
