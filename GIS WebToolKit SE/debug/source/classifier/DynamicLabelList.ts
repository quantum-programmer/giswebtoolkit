/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс динамических подписей карты               *
 *                                                                  *
 *******************************************************************/

import WmsLayer from '~/maplayers/WmsLayer';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {GetDynamicLabelListResponse} from '~/services/RequestServices/RestService/Types';
import {GwtkMap} from '~/types/Types';
import {LogEventType} from '~/types/CommonTypes';


export default class DynamicLabelList {

    private readonly urlDataList: { url: string; dynamicLabelList?: GetDynamicLabelListResponse['dynamicLabelList'] }[] = [];

    constructor(private readonly map: GwtkMap) {
        this.mapForceRender();
    }

    private mapForceRender() {
        setTimeout(() => {
            this.map.tiles.wmsManager.onMapDragEnd();
        }, 1);
    }

    private async getDynamicLabelList(serviceUrl: string) {
        let data = this.urlDataList.find(data => data.url === serviceUrl);

        if (!data) {
            data = { url: serviceUrl, dynamicLabelList: undefined };
            const httpParams = RequestServices.createHttpParams(this.map, {url: serviceUrl});
            const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            try {
                this.urlDataList.push(data);
                const request = await service.getDynamicLabelList(httpParams);
                if (request.data) {
                    data = this.urlDataList.find(data => data.url === serviceUrl);
                    if (data) {
                        data.dynamicLabelList = request.data?.dynamicLabelList;
                    }
                }
                this.mapForceRender();
            } catch (e) {
                this.map.writeProtocolMessage({type: LogEventType.Error, text: e as string});
            }
        }

        return data?.dynamicLabelList;
    }

    async getDynamicLabelData(layer: WmsLayer) {
        if (layer.server) {
            const dynamicLabelList = await this.getDynamicLabelList(layer.server);
            const layerId = layer.idLayer;
            if (dynamicLabelList) {
                const recordIds = [];
                for (let i = 0; i < dynamicLabelList.length; i++) {
                    const record = dynamicLabelList[i].record;
                    for (let j = 0; j < record.layerList.length; j++) {
                        if (record.layerList[j] === layerId) {
                            recordIds.push(record.id);
                        }
                    }
                }
                if (recordIds.length > 0) {
                    return recordIds.join(';');
                }
            }
        }
    }


}
