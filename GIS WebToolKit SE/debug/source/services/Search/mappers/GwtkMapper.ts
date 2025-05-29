/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Базовый маппер для поиска                     *
 *                                                                  *
 *******************************************************************/

import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import RequestService, { StandardRequest, HttpParams } from '~/services/RequestServices/common/RequestService';
import { ServiceResponse } from '~/services/Utils/Types';
import { SemanticCriterion, SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';
import MapObject from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { StatisticList } from '~/services/Search/mappers/GISWebServiceSEMapper';
import {LogEventType} from '~/types/CommonTypes';


export type GwtkMapperResult = {
    mapObjects: MapObject[];
    foundObjectCount: number;
    statistic?: StatisticList;
    dataFilePath?: string;
}

/**
 * Базовый маппер для поиска
 * @abstract
 * @class GwtkMapper
 */
export default abstract class GwtkMapper<RequestOptions = any, RequestResult = any> {

    protected request: StandardRequest<RequestOptions, RequestResult>;

    /**
     * Активный запрос с возможностью отмены
     * @private
     * @property activeRequest {object|undefined}
     */
    protected activeRequest?: {
        abortXhr: () => void;
        // promise: Promise<ServiceResponse<JSON>>
        promise: Promise<ServiceResponse<RequestResult>>
    };

    /**
     * @constructor GwtkMapper
     * @protected
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param request {StandardRequest} Метод запроса
     */
    protected constructor( readonly vectorLayer: VectorLayer, request: StandardRequest<RequestOptions, RequestResult> ) {
        this.request = request;
    }

    /**
     * Поиск объектов карты
     * @async
     * @method search
     * @param criteriaAggregators { CriteriaAggregator[]} Массив агрегаторов критериев
     * @param [httpParams] {HttpParams} Http-параметры запроса
     */
    async search(criteriaAggregators: CriteriaAggregator[], httpParams?: HttpParams) {

        const requestParams = this.prepareRequestParams(criteriaAggregators) as RequestOptions;

        if (this.activeRequest) {
            this.activeRequest.abortXhr();
        }

        this.activeRequest = RequestService.sendCancellableRequest(this.request, requestParams, { responseType: 'json', ...httpParams });

        let postResult: GwtkMapperResult;

        try {
            const result = await this.activeRequest.promise;
            postResult = this.onDataLoaded( result );
        } catch ( error: any ) {
            this.vectorLayer.map.writeProtocolMessage({
                type: LogEventType.Error,
                display: false,
                text: this.vectorLayer.map.translate('Failed to get data'),
                description: error.toString()
            });
            postResult = {
                mapObjects: [],
                foundObjectCount: 0
            };
        } finally {
            this.activeRequest = undefined;
        }
        return postResult;
    }

    /**
     * Отменить активный запрос
     * @method cancelRequest
     */
    cancelRequest() {
        this.activeRequest?.abortXhr();
    }

    /**
     * Подготовить параметры запроса
     * @protected
     * @abstract
     * @method prepareRequestParams
     * @param criteriaAggregators { CriteriaAggregator[]} Массив агрегаторов критериев
     * @return {object} Параметры запроса
     */
    protected abstract prepareRequestParams( criteriaAggregators: CriteriaAggregator[] ): RequestOptions;

    /**
     * Обработчик ответа сервера
     * @protected
     * @abstract
     * @method onDataLoaded
     * @param results {Object} Ответ сервиса
     * @return {GwtkMapperResult} Обработанный ответ сервера
     */
    protected abstract onDataLoaded( results: ServiceResponse<RequestResult> ): GwtkMapperResult;

    /**
     * Получить строку текстового поиска
     * @static
     * @method getSearchText
     * @return {string} Строка текстового поиска
     */
    protected static getSearchText(semanticCriterionList: SemanticCriterion[]): string {
        let result = '';
        const semanticCriterion = semanticCriterionList[0];
        if (semanticCriterion && semanticCriterion.operator === SemanticOperator.ContainsValue) {
            result = semanticCriterion.value;
        }
        return result;
    }
}
