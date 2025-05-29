/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *   Выполнение REST (Representational state transfer)-запросов     *
 *                            GWTK SE                               *
 *******************************************************************/

import {
    AppendFileToObjectParams,
    AppendFileToObjectResponse,
    SaveFileToDocumentParams,
    BuildZoneParams,
    CreateLegendParams,
    CreateRouteByPointsParams,
    CreateRouteByPointsResponse,
    CreateThematicMapByCsvParams,
    CreateThematicMapByCsvResponse,
    CreateThematicMapByFileParams,
    CreateThematicMapByFileResponse,
    FileByLinkParams,
    Get3dMaterialsParams,
    Get3dObjectsByClassifierParams,
    Get3dObjectsParams,
    Get3dTexturesParams,
    Get3dTilesParams,
    BuildHeatMapParams,
    GetAreaParams,
    GetSheetNameParams,
    GetCoveragePointParams,
    GetCoveragePointResponse,
    GetCoverageTileParams,
    GetCoverageTilesHeaderParams,
    GetFeatureCachedParams,
    GetFeatureParams,
    GetFileFromSemanticParam,
    GetFileFromSemanticResponse,
    GetFileParams,
    GetLayerSemanticListParams,
    GetLayerStateParams,
    GetLayerStateResponse,
    GetMapImageParams,
    GetScenarioParams,
    GetSemanticWithListParams,
    GetTrackParams,
    LastActionParams,
    LoadGmlByXsdParams,
    MathBuildCrossLayersParams,
    ReliefProfileParams,
    ReliefProfileResponse,
    GetLayerSemanticListResponse,
    GetSemanticWithListResponse,
    SideAzimuthParams,
    SideLengthParams,
    TextSearchParams,
    TransactionUserParams,
    UnionParams,
    GetSemByObjKeyParams,
    GetSemByObjKeyResponse,
    GetTranslateResponse,
    GetAreaResponse,
    BuildHeatMapResponse,
    GetDataFromFolderParams,
    GetDataFromFolderResponse,
    SideAzimuthResponse,
    SaveFileToDocumentResponse,
    LayerParam,
    DeleteLayerParams,
    DeleteLayerOnGISServerParams,
    GetSheetNameResponse,
    TransactionResponse,
    CreateUserMapParams,
    CreateUserMapResponse,
    RenameDataOnGISServerParams,
    GetBoundResponse,
    GetBoundRequest,
    GetTransactionListInXmlParams,
    GetTransactionListInXmlResponse,
    CheckCrossByLayersIncludePointsParams,
    GetRequestDataResponse,
    GetRequestDataParams,
    CreateProcessResponse,
    ScenarioData,
    BuildFloodZoneParams,
    BuildFloodZoneResponse,
    CheckDistanceByLayers,
    CheckFromStartByLayers,
    CheckFromEndByLayers,
    LoadData,
    UploadFileParams,
    UploadFileResponse,
    DismissParams,
    DismissResponse,
    UrlRequestParams,
    GetFeatureCountResponse,
    CheckKeyParams,
    CheckKeyResponse,
    GetDynamicLabelListResponse,
    DeleteDataParams
} from './Types';
import {
    CIRCLE,
    FINDDIRECTION,
    METRIC,
    OBJCENTER,
    OUTTYPE,
    SEVERALOBJ,
    VIRTUALFOLDER, GETFRAME
} from '~/services/RequestServices/common/enumerables';
import { AxiosRequestConfig } from 'axios';
import RequestService, { HttpParams } from '../common/RequestService';
import { SimpleJson } from '~/types/CommonTypes';
import { ServiceResponse, XMLRpcData } from '~/services/Utils/Types';
import BaseService from '~/services/RequestServices/common/BaseService';
import RestMethodParams from '~/services/RequestServices/RestService/RestMethodParams';
import {GeoJsonType, GetStatisticsResponse} from '~/utils/GeoJSON';
import { GetTranslateParams } from '~/services/RequestServices/RestService/Types';
import { BrowserService } from '~/services/BrowserService';
import Utils from '~/services/Utils/Utils';


export type MapExportFormat = {
    outType: OUTTYPE;
    contentType: string;
    ext: string;
    text: string;
    enabled: boolean
};


/**
 * Класс выполнения REST запросов
 * @class RestService
 * @extends BaseService
 */
export default class RestService extends BaseService {

    constructor(httpParams: HttpParams) {
        super(httpParams);

        this.defaults.responseType = 'json';
    }

    /**
     * Версия сервиса
     * @private
     * @property version {string|undefined}
     */
    private version?: string;

    private mergeParams(httpParams?: AxiosRequestConfig, defaultParams?: AxiosRequestConfig): HttpParams {

        const headers = { ...this.defaults.headers, ...defaultParams?.headers, ...httpParams?.headers };

        return { ...this.defaults, ...defaultParams, ...httpParams, headers };
    }

    /**
     * Сформировать jsonRpc (разбить по слоям)
     * @private
     * @method formRPCparamsArray
     * @param requestParams {object} Параметры запроса пользователя
     * @param options {object} Стандартные или необходимые параметры конкретного запроса
     * @return {XMLRpcData[]} Массив jsonRpc (по слоям)
     */
    private formRPCparamsArray(requestParams: LayerParam & SimpleJson<string | SimpleJson<any> | undefined>, options: { RESTMETHOD: string; } & SimpleJson<string | SimpleJson<any> | undefined>): XMLRpcData[] {
        const layer = requestParams.LAYER.split(',');
        const commonParams: SimpleJson<string | SimpleJson<any> | undefined> = {
            ...requestParams
        };
        delete commonParams.LAYER;

        return layer.map((value => {
            return {
                ...options,
                LAYER: value,
                ...commonParams
            };
        }));
    }

    /**
     * Сформировать jsonRpc (разбить по слоям)
     * @private
     * @method formRPCparamsArrayFromSeparateRequests
     * @param requestParams {object} Параметры запроса пользователя
     * @param options {object} Стандартные или необходимые параметры конкретного запроса
     * @return {XMLRpcData[]} Массив jsonRpc (по слоям)
     */
    private formRPCparamsArrayFromSeparateRequests(requestParams: (LayerParam & SimpleJson<string | SimpleJson<any> | undefined>)[], options: { RESTMETHOD: string; } & SimpleJson<string | undefined>): XMLRpcData[] {
        const result = [];

        for (let i = 0; i < requestParams.length; i++) {
            const xmlRpcArray = this.formRPCparamsArray(requestParams[i], options);
            for (let j = 0; j < xmlRpcArray.length; j++) {
                result.push(xmlRpcArray[j]);
            }
        }

        return result;
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных
     * @method getFeature
     * @param options {GetFeatureParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getFeature<T = GeoJsonType>(options: GetFeatureParams[], httpParams?: AxiosRequestConfig) {

        const httpLocalParams = this.mergeParams(httpParams);

        const urlRequestParams = {
            RESTMETHOD: 'GETFEATURE'
        };

        let layerSpecified = false;
        for (let i = 0; i < options.length; i++) {
            if (options[i].LAYER) {
                layerSpecified = true;
                break;
            }
        }
        if (!layerSpecified) {
            return Promise.reject('No layers to search');
        }
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);
        const requestData = this.formRPCparamsArrayFromSeparateRequests(options, {
            RESTMETHOD: 'GETFEATURE',
            OBJCENTER: OBJCENTER.ObjectCenter,
            SEMANTIC: '1',
            SEMANTICNAME: '1',
            METRIC: METRIC.AddMetric,
            MAPID: '1',
            AREA: '1',
            FINDDIRECTION: FINDDIRECTION.FirstObjectLast,
            GETSLD: '0',
            GETKEY: '1',
            FILESEMANTICLINK: '1',
            LAYERSEMANTICSEARCH: '1',
            SEMANTICCODE: '1',
            NOFILELINK: '1',
            GETEMPTYCLUSTEROBJECT: '1',
            SORTBYSEMANTICUSERCODE: '1',
            SERVICEVERSION,
            PREVIEWCLUSTERSIZE: '164',
            SCALERANGE: '1'
        });

        return RequestService.postJson<T>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных
     * @method getFeatureMetric
     * @param options {GetFeatureParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getFeatureMetric<T = GeoJsonType>(options: GetFeatureParams[], httpParams?: AxiosRequestConfig) {

        const getFeatureParams: GetFeatureParams[] = options.map(params => ({
            SEMANTIC: '0',
            METRIC: METRIC.AddMetric,
            MAPID: '1',
            GETKEY: '0',
            NOFILELINK: '1',
            GETFRAME: GETFRAME.AddObjectBounds,

            OBJCENTER: OBJCENTER.FirstPoint,
            SEMANTICNAME: '0',
            FINDDIRECTION: FINDDIRECTION.FirstObjectLast,
            GETSLD: '0',
            FILESEMANTICLINK: '0',
            SEMANTICCODE: '0',
            GETEMPTYCLUSTEROBJECT: '0',
            ...params
        }));

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };

        return this.getFeature<T>(getFeatureParams, httpLocalParams);
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных c возможностью кэширования
     * @method getFeatureCached
     * @param options {object} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeatureCached<T = GeoJsonType>(options: GetFeatureParams & GetFeatureCachedParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };

        const urlRequestParams = {
            METHOD: 'GETFEATURE',
            TILEMATRIX: options.TILEMATRIX,
            TILEROW: options.TILEROW,
            TILECOL: options.TILECOL,
            LAYER: options.LAYER,
            CUTBYFRAME: options.CUTBYFRAME
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'GETFEATURE',
            OBJCENTER: OBJCENTER.ObjectCenter,
            SEMANTIC: '1',
            SEMANTICNAME: '1',
            METRIC: '1',
            MAPID: '1'
        });

        return RequestService.postJson<T>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить геометрических свойства и атрибутивные характеристики
     * пространственных объектов из базы геоданных для хранимого запроса
     * @method getFeatureById
     * @param options {GetFeatureParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFeatureById<T = GeoJsonType>(options: GetFeatureParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETFEATURE'
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'GETFEATURE',
            STOREDQUERY_ID: 'urn:ogc:def:query:OGCservice-WFS::GetFeatureById',
            SEMANTICNAME: '1'
        });

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postJson<T>(httpLocalParams, urlRequestParams, requestData);
    }


    /**
     * Получить количество объектов с указанными параметрами
     * @async
     * @method getFeatureCount
     * @param options {LayerParam} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getFeatureCount(options: LayerParam, httpParams?: AxiosRequestConfig) {

        const urlRequestParams = {
            RESTMETHOD: 'GETFEATURE'
        };

        const httpLocalParams = this.mergeParams(httpParams);

        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);

        const requestData = this.formRPCparamsArrayFromSeparateRequests([options], {
            RESTMETHOD: 'GETFEATURE',
            OBJCENTER: OBJCENTER.ObjectCenter,
            SEMANTIC: '1',
            SEMANTICNAME: '1',
            METRIC: METRIC.AddMetric,
            MAPID: '1',
            FINDDIRECTION: FINDDIRECTION.FirstObjectLast,
            GETKEY: '1',
            FILESEMANTICLINK: '1',
            LAYERSEMANTICSEARCH: '1',
            SEMANTICCODE: '1',
            NOFILELINK: '1',
            GETEMPTYCLUSTEROBJECT: '1',
            SORTBYSEMANTICUSERCODE: '1',
            SERVICEVERSION,
            PREVIEWCLUSTERSIZE: '164',
            RESULTTYPE: 'hits',
            OUTTYPE: OUTTYPE.JSON
        });

        return RequestService.postJson<GetFeatureCountResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить легенду карты, матрицы высот или матрицы качеств
     * @method createLegend
     * @param options {CreateLegendParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    createLegend<T = string>(options: CreateLegendParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'CREATELEGEND'
        };

        const requestData = this.formRPCparamsArray(options, {
            OBJLOCAL: '0,1,2,4,5',
            RESTMETHOD: 'CREATELEGEND'
        });

        const httpLocalParams = this.mergeParams(httpParams, { responseType: 'text' });
        return RequestService.postJson<T>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить зону(ы) вокруг объект(а)ов заданного радиуса
     * @method buildZone
     * @param options {BuildZoneParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    buildZone(options: BuildZoneParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'BUILDZONE'
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'BUILDZONE',
            CIRCLE: CIRCLE.RoundedCorners,
            SEVERALOBJ: SEVERALOBJ.SplitZones
        });

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.postJson<GeoJsonType>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить профиль рельефа
     * @method getReliefProfile
     * @param options {ReliefProfileParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getReliefProfile(options: ReliefProfileParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETRELIEFPROFILE',
            SERVICE: 'WFS',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postRequest<ReliefProfileResponse>(httpLocalParams, urlRequestParams);


        // const urlRequestParams = {
        //     RESTMETHOD: 'GetReliefProfile'
        // };
        //
        // const requestData = this.formRPCparamsArray( options, {
        //     RESTMETHOD: 'GETRELIEFPROFILE'
        // } );
        //
        // const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        // return RequestService.postJson<string>( httpLocalParams, urlRequestParams, requestData );
    }

    /**
     * Получить пересечение объектов двух карт
     * @method mathBuildCrossLayers
     * @param options {MathBuildCrossLayersParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    mathBuildCrossLayers(options: MathBuildCrossLayersParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'MATHBUILDCROSSLAYERS'
        };
        const requestData = [{
            RESTMETHOD: 'MATHBUILDCROSSLAYERS',
            ...options
        }];
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.postJson<string>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить пересечение списков объектов карт
     * @method checkCrossByLayersIncludePoints
     * @param options {CheckCrossByLayersIncludePointsParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async checkCrossByLayersIncludePoints(options: CheckCrossByLayersIncludePointsParams[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);

        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);
        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'CHECKCROSSBYLAYERSINCLUDEPOINTS',
            SERVICE: 'WPS',
            SERVICEVERSION
        };
        const requestData = options.map(item => ({
            RESTMETHOD: 'CHECKCROSSBYLAYERSINCLUDEPOINTS',
            OUTTYPE: OUTTYPE.JSON,
            METRIC: METRIC.RemoveMetric,
            ...item
        } as XMLRpcData));
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить список объектов, находящихся на заданном расстоянии
     * @method checkDistanceByLayers
     * @param options {CheckDistanceByLayers} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async checkDistanceByLayers(options: CheckDistanceByLayers[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);

        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'GETOBJECTSINLISTSBYDISTANCE',
            SERVICE: 'WPS',
            SERVICEVERSION,
            MAPID: '1',
        };
        const requestData = options.map(item => ({
            RESTMETHOD: 'GETOBJECTSINLISTSBYDISTANCE',
            OUTTYPE: OUTTYPE.JSON,
            METRIC: METRIC.RemoveMetric,
            ...item
        } as XMLRpcData));
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить список объектов, начинающихся в заданных списках
     * @method checkFromStartByLayers
     * @param options {checkFromStartByLayers} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async checkFromStartByLayers(options: CheckFromStartByLayers[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);

        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'GETOBJECTSBEGININFIRSTLIST',
            SERVICE: 'WPS',
            SERVICEVERSION
        };
        const requestData = options.map(item => ({
            RESTMETHOD: 'GETOBJECTSBEGININFIRSTLIST',
            OUTTYPE: OUTTYPE.JSON,
            METRIC: METRIC.RemoveMetric,
            ...item
        } as XMLRpcData));
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить список объектов, заканчивающихся в заданных списках
     * @method checkFromEndByLayers
     * @param options {checkFromEndByLayers} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async checkFromEndByLayers(options: CheckFromEndByLayers[], httpParams?: AxiosRequestConfig) {
        const httpLocalParamsVer = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParamsVer);

        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'GETOBJECTSENDINFIRSTLIST',
            SERVICE: 'WPS',
            SERVICEVERSION
        };
        const requestData = options.map(item => ({
            RESTMETHOD: 'GETOBJECTSENDINFIRSTLIST',
            OUTTYPE: OUTTYPE.JSON,
            METRIC: METRIC.RemoveMetric,
            ...item
        } as XMLRpcData));

        const httpLocalParams = this.mergeParams(httpParams, { responseType: 'json' });
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получение информации об установке ключа защиты
     * @method checkKey
     * @param options {GetRequestDataParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async checkKey(options: CheckKeyParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'CHECKKEY',
            ...options
        };
        const httpLocalParams: HttpParams = {...this.defaults, ...httpParams};
        return RequestService.getRequest<CheckKeyResponse>(httpLocalParams, urlRequestParams);
    }


    /**
     * Создание пользовательского слоя по файлу SXF, TXF, MIF, SHP, KML,ZIP
     * @method loadData
     * @param options {LoadData} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {ServiceResponse<CreateProcessResponse>} Объект ответа
     */
    async loadData(options: LoadData, httpParams?: AxiosRequestConfig) {

        const SERVICEVERSION = await this.getVersion();
        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'LOADDATA',
            SERVICEVERSION,
            SERVICE: 'WPS',
        };
        const requestData: XMLRpcData[] = [{
            RESTMETHOD: 'LOADDATA',
            LAYER: '',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        }];

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Запуск выполнения REST-метода.
     * @async
     * @method createProcess
     * @param params {method: string; options: SimpleJson} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {ServiceResponse<CreateProcessResponse>} Объект ответа
     */
    async createProcess(params: {method: string; options: SimpleJson}, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<CreateProcessResponse>> {
        const httpLocalParams: HttpParams = {
            ...this.getDefaults(),
            ...httpParams
        };
        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: params.method,
            SERVICEVERSION: await this.getVersion({}, this.mergeParams(httpParams)),
            SERVICE: 'WPS'
        };
        const requestData: XMLRpcData[] = [{
            RESTMETHOD: params.method,
            LAYER: '',
            OUTTYPE: OUTTYPE.JSON,
            ...params.options
        }];
        return await RequestService.postJson<CreateProcessResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить зону затопления вокруг объекта по заданным параметрам
     * @method BuildFloodZone
     * @param options {BuildFloodZoneParams} Параметры построения
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    BuildFloodZone(options: BuildFloodZoneParams, httpParams?: AxiosRequestConfig) {
        const RESTMETHOD = 'BUILDFLOODZONE';
        const urlRequestParams = {
            RESTMETHOD
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD
        });

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postJson<BuildFloodZoneResponse>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить данные процесса обработки запроса
     * @method getRequestData
     * @param options {GetRequestDataParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getRequestData<T>(options: GetRequestDataParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETRESTREQUESTDATA',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetRequestDataResponse | T>(httpLocalParams, urlRequestParams);
    }

    /**
     * Получение информации о процессе дате окончания доступности результата, дате завершения процесса, проценте выполнения
     * @method getAsyncStatusData
     * @param options {GetRequestDataParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getAsyncStatusData<T>(options: GetRequestDataParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);
        const urlRequestParams = {
            RESTMETHOD: 'GETSTATUS',
            OUTTYPE: OUTTYPE.JSON,
            SERVICEVERSION,
            ...options
        };
        return RequestService.getRequest<GetRequestDataResponse | T>(httpLocalParams, urlRequestParams);
    }

    /**
     * Получить данные процесса обработки асинхронного запроса
     * @method getAsyncResultData
     * @param options {GetRequestDataParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getAsyncResultData<T>(options: GetRequestDataParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);
        const urlRequestParams = {
            RESTMETHOD: 'GETRESULT',
            OUTTYPE: OUTTYPE.JSON,
            SERVICEVERSION,
            ...options
        };

        return RequestService.getRequest<GetRequestDataResponse | T>(httpLocalParams, urlRequestParams);
    }

    /**
     * Отменить выполнение процесса асинхронного запроса
     * @method dismiss
     * @param options {DismissParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async dismiss(options: DismissParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParams);
        const urlRequestParams = {
            RESTMETHOD: 'DISMISS',
            OUTTYPE: OUTTYPE.JSON,
            SERVICEVERSION,
            ...options
        };

        return RequestService.getRequest<DismissResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Получить длину участка объекта (стороны) на местности по двум координатам
     * @method sideLength
     * @param options {SideLengthParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    sideLength(options: SideLengthParams, httpParams?: AxiosRequestConfig) {

        const urlRequestParams = {
            RESTMETHOD: 'SIDELENGTH'
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'SIDELENGTH'
        });

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.postJson<string>(httpLocalParams, urlRequestParams, requestData);
    }

    /**
     * Получить периметр, площадь, длину объектов
     * @method getArea
     * @param [options] {GetAreaParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getArea(options: GetAreaParams = {}, httpParams: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETAREA',
            SERVICE: 'WFS',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postRequest<GetAreaResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Запрос имени листа карты
     * @method getSheetName
     * @param [options] {GetSheetNameParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getSheetName(options: GetSheetNameParams = {}, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETSHEETNAME',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetSheetNameResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Получить периметр, площадь, длину объектов по матрице
     * @method getAreaByMatrix
     * @param [options] {GetAreaParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getAreaByMatrix(options: GetAreaParams = {}, httpParams: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETAREABYMATRIX',
            SERVICE: 'WFS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.postRequest<string>(httpLocalParams, urlRequestParams);
    }

    /**
     * Получить список доступных схем
     * @method getXsdList
     * @param [options] {object} Параметры запроса
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getXsdList(options = {}, httpParams?: HttpParams) {
        const getRequestParams = {
            RESTMETHOD: 'GETXSDLIST'
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<string>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить габариты слоя
     * @method getBound
     * @param options {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getBound(options: GetBoundRequest, httpParams?: HttpParams): Promise<ServiceResponse<GetBoundResponse>> {
        const httpLocalParamsVer = this.mergeParams(httpParams);
        const SERVICEVERSION = await this.getVersion({}, httpLocalParamsVer);

        const getRequestParams = {
            RESTMETHOD: 'GETBOUND',
            OUTTYPE: OUTTYPE.JSON,
            SERVICEVERSION,
            ...options
        };

        if (SERVICEVERSION === undefined || +SERVICEVERSION < 150100) {
            const httpLocalParams = this.mergeParams(httpParams, { responseType: 'text' });
            const result = await RequestService.getRequest<string>(httpLocalParams, getRequestParams).then(response => {
                const data = response.data;
                const responseData: GetBoundResponse = {
                    restmethod: {
                        outparams: {
                            [options.LAYER]: {
                                [options.EpsgList || 'BorderInBaseProjection']: '',
                                SupportGeodesy: '0',
                                format: ''
                            }
                        }
                    }
                };

                const regex = /(.+)\W+Format:(.+)/;
                let m;
                if (data && (m = regex.exec(data)) !== null) {
                    const coord = m[1];
                    const format = m[2];
                    responseData.restmethod.outparams[options.LAYER] = {
                        [options.EpsgList || 'BorderInBaseProjection']: coord,
                        SupportGeodesy: '1',
                        format
                    };
                }

                return responseData;
            });
            return { data: result };
        } else {
            const httpLocalParams = this.mergeParams(httpParams);
            let result = await RequestService.getRequest<GetBoundResponse>(httpLocalParams, getRequestParams);
            if (SERVICEVERSION && +SERVICEVERSION === 150100 && options.EpsgList && options.EpsgList.includes(':')) {
                if (result && result.data && result.data.restmethod) {
                    const layerOutParams = result.data.restmethod.outparams[options.LAYER];
                    const crs = options.EpsgList.split(':')[1];
                    layerOutParams[crs] = layerOutParams[crs]?.trim();
                    layerOutParams.SupportGeodesy = '1';
                }
            }
            return result;
        }
    }

    /**
     * Загрузить и создать слой по схеме и файлу gml
     * @method loadGmlByXsd
     * @param options {LoadGmlByXsdParams} Параметры запроса
     * @param httpParams {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    loadGmlByXsd(options: LoadGmlByXsdParams, httpParams: HttpParams) {
        const urlRequestParams = {
            RESTMETHOD: 'LOADGMLBYXSD',
            LAYER: '',
            VIRTUALFOLDER: VIRTUALFOLDER.ForCurrentUser,
            WRITELOG: '0',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.postRequest<string>(httpLocalParams, urlRequestParams);
    }

    /**
     * Запросить номер версии
     * @async
     * @method getVersion
     * @param [options] {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getVersion(options = {}, httpParams?: HttpParams): Promise<string> {
        if (this.version) {
            return this.version;
        }

        try {
            const getRequestParams = {
                RESTMETHOD: 'GETVERSION'
            };
            const httpLocalParams = this.mergeParams(httpParams);
            httpLocalParams.responseType = 'text';
            const response = await RequestService.getRequest<string>(httpLocalParams, getRequestParams);
            if (response.data) {
                this.version = Utils.getServiceVersionValue(response.data.trim());
            }
        } catch (error) {
            console.log(error);
        }

        return this.version || '0';
    }

    /**
     * Получить рисунок карты
     * @method getWmsImage
     * @param options {GetMapImageParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getWmsImage(options: GetMapImageParams[], httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETIMAGE',
            FORMAT: options[0]?.FORMAT
        };


        const requestData = options.map(item => ({
            RESTMETHOD: 'GETIMAGE',
            ...item
        }));

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'blob', ...httpParams };

        return RequestService.postJson(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Получить 3D объекты по номерам тайлов
     * @method get3dTiles
     * @param options {Get3dTilesParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dTiles(options: Get3dTilesParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            METHOD: 'GET3DTILES',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.getRequest<ArrayBuffer>(httpLocalParams, getRequestParams);
    }

    /**
     * Построить тепловую карту
     * @method buildHeatMap
     * @param options {BuildHeatMapParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    buildHeatMap(options: BuildHeatMapParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RestMethod: 'BUILDHEATMAP',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<BuildHeatMapResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить метаданные о местности для 3D слоя
     * @method get3dMetadata
     * @param options {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dMetadata(options: LayerParam, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GET3DMETADATA',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.getRequest<ArrayBuffer>(httpLocalParams, getRequestParams);
    }

    /**
     * Загрузить файл из хранилища по ссылке
     * @param options
     * @param httpParams
     */
    getFileByLink<T = Blob>(options: FileByLinkParams, httpParams?: HttpParams) {
        const getRequestParams = {
            METHOD: 'GETFILEBYLINK',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'blob', ...httpParams };
        return RequestService.getRequest<T>(httpLocalParams, getRequestParams);
    }


    /**
     * Получить материалы для 3D слоя
     * @method get3dMaterials
     * @param options {Get3dMaterialsParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dMaterials(options: Get3dMaterialsParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GET3DMATERIALS',
            ...options
        };
        // const requestData = this.formRPCparamsArray( options, {
        //     RESTMETHOD: 'GET3DMATERIALS'
        // } );
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };

        return RequestService.getRequest(httpLocalParams, getRequestParams);
    }

    /**
     * Получить материалы для 3D слоя
     * @method get3dTextures
     * @param options {Get3dTexturesParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dTextures(options: Get3dTexturesParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GET3DTEXTURES',
            LAYER: options.LAYER
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'GET3DTEXTURES'
        });

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.postJson(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Получить шаблоны 3D объектов
     * @method get3dObjects
     * @param options {Get3dObjectsParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dObjects(options: Get3dObjectsParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GET3DOBJECTS'
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'GET3DOBJECTS',
            OBJLOCAL: '2'
        });

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.postJson<ArrayBuffer>(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Получить шаблоны 3D объектов
     * @method get3dObjectsByClassifier
     * @param options {Get3dObjectsByClassifierParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    get3dObjectsByClassifier(options: Get3dObjectsByClassifierParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GET3OBJECTSBYCLASSIFIER'
        };

        const requestData = [{
            RESTMETHOD: 'GET3OBJECTSBYCLASSIFIER',
            OBJLOCAL: '2',
            ...options
        }];

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.postJson<ArrayBuffer>(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Получить метаданные о местности для 3D слоя
     * @method getLayerSemanticList
     * @param options {GetLayerSemanticListParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getLayerSemanticList(options: GetLayerSemanticListParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETLAYERSEMANTICLIST',
            ...options
        };
        const httpLocalParams = this.mergeParams(httpParams);
        return RequestService.getRequest<GetLayerSemanticListResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить метаданные о местности для 3D слоя
     * @method getSemByObjKey
     * @param options {GetSemByObjKeyParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getSemByObjKey(options: GetSemByObjKeyParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETSEMBYOBJKEY',
            ...options
        };

        const httpLocalParams = this.mergeParams(httpParams);
        return RequestService.getRequest<GetSemByObjKeyResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Запрос семантических характеристик схемы типа «справочник знаний»
     * @method getSemanticWithList
     * @param options {GetSemanticWithListParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getSemanticWithList(options: GetSemanticWithListParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETSEMANTICWITHLIST',
            ...options
        };
        const httpLocalParams = this.mergeParams(httpParams);
        return RequestService.getRequest<GetSemanticWithListResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить файл с сервиса
     * @method getFile
     * @param options {GetFileParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFile<T = JSON>(options: GetFileParams, httpParams?: HttpParams) {
        const getRequestParams = {
            METHOD: 'GETFILE',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<T>(httpLocalParams, getRequestParams);
    }

    /**
     * Загрузить файл документа с ГИС Сервера из семантики (RestMethod=GetFileFromSemantic)
     * @method getFileFromSemantic
     * @param options {GetFileFromSemanticParam} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getFileFromSemantic(options: GetFileFromSemanticParam, httpParams?: HttpParams) {
        const getRequestParams = {
            METHOD: 'GETFILEFROMSEMANTIC',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetFileFromSemanticResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить файл с сервиса
     * @method getCoverageTile
     * @param options {GetCoverageTileParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCoverageTile(options: GetCoverageTileParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            METHOD: 'GETCOVERAGETILE',
            SERVICE: 'WCS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.getRequest<ArrayBuffer>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить файл с сервиса
     * @method getCoverageTilesHeader
     * @param options {GetCoverageTilesHeaderParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCoverageTilesHeader(options: GetCoverageTilesHeaderParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            METHOD: 'GETCOVERAGETILESHEADER',
            SERVICE: 'WCS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'arraybuffer', ...httpParams };
        return RequestService.getRequest<ArrayBuffer>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить сценарий с сервиса
     * @method getScenario
     * @param options {GetScenarioParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getScenario(options: GetScenarioParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETSCENARIO',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<JSON>(httpLocalParams, getRequestParams);
    }

    /**
     * Получить сценарий с сервиса
     * @method getTrack
     * @param options {GetTrackParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getTrack(options: GetTrackParams, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<ScenarioData>> {
        const getRequestParams = {
            RESTMETHOD: 'GETTRACK',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<ScenarioData>(httpLocalParams, getRequestParams);
    }

    /**
     * Выполнить поиск объектов карты по классификационным атрибутам и семантическим
     * данным определенных карт (в том числе поиск по адресу).
     * @method textSearch
     * @param options {TextSearchParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    textSearch(options: TextSearchParams, httpParams?: HttpParams) {

        const getRequestParams = {
            SERVICE: 'WFS',
            RESTMETHOD: 'TEXTSEARCH'
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'TEXTSEARCH',
            OBJCENTER: OBJCENTER.FirstPoint,
            OBJLOCAL: '0,1,2,4',
            MapId: '1'
        });

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postJson<GeoJsonType>(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Отмена последней выполненной транзакции
     * @method undoLastAction
     * @param options {LastActionParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    undoLastAction(options: LastActionParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'UNDOLASTACTION',
            SERVICE: 'WFS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<XMLDocument>(httpLocalParams, getRequestParams);
    }

    /**
     * Восстановление последней выполненной транзакции
     * @method redoLastAction
     * @param options {LastActionParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    redoLastAction(options: LastActionParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'REDOLASTACTION',
            SERVICE: 'WFS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<XMLDocument>(httpLocalParams, getRequestParams);
    }

    /**
     * Сшивка площадных объектов
     * @method union
     * @param options {UnionParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    union(options: UnionParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'UNION',
            SERVICE: 'WFS',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GeoJsonType>(httpLocalParams, getRequestParams);
    }

    /**
     * Вычисление азимута участка объекта
     * @method sideAzimuth
     * @param options {SideAzimuthParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    sideAzimuth(options: SideAzimuthParams, httpParams?: AxiosRequestConfig) {
        const requestData = { OUTTYPE: OUTTYPE.JSON, ...options, RESTMETHOD: 'SIDEAZIMUTHEX', SERVICE: 'WFS' };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<SideAzimuthResponse>(httpLocalParams, requestData);
    }


    /**
     * Загрузить изображение объекта
     * @method appendFileToObject
     * @param options {AppendFileToObjectParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async appendFileToObject(options: AppendFileToObjectParams & { file: File }, httpParams?: AxiosRequestConfig) {

        let urlRequestParams: SimpleJson<string | undefined> = {
            RESTMETHOD: 'APPENDFILETOOBJECT'
        };

        let data;

        if (this.version && +this.version < 150100) {
            urlRequestParams = {
                ...urlRequestParams,
                LAYER: options.LAYER,
                ID: options.ID,
                FILEPATH: options.FILEPATH,
                OUTTYPE: options.OUTTYPE,
                NOTSAVEFILETOSEMANTIC: options.NOTSAVEFILETOSEMANTIC
            };

            data = options.file;

        } else {

            const filedata = (await BrowserService.blobToBase64(options.file)).replace(/^data:[^/]+\/[^/]+;base64,/, '');
            data = {
                restmethod: {
                    methodName: 'APPENDFILETOOBJECT',
                    layerlist: [
                        {
                            id: options.LAYER,
                            params: {
                                id: options.ID,
                                filepath: options.FILEPATH,
                                outtype: options.OUTTYPE,
                                notsavefiletosemantic: options.NOTSAVEFILETOSEMANTIC,
                                filedata
                            }
                        }
                    ]
                }
            };

        }

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            data, ...httpParams
        };

        return await RequestService.postRequest<AppendFileToObjectResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Загрузить файл для семантики
     * @method saveFileToDocument
     * @param options {SaveFileToDocumentParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    saveFileToDocument(options: SaveFileToDocumentParams & { file: File }, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'SAVEFILETODOCUMENT',
            LAYER: options.LAYER,
            SAVEDPATH: options.SAVEDPATH,
            FILEPATH: options.FILEPATH,
            FILETYPE: options.FILETYPE,
            OUTTYPE: options.OUTTYPE || OUTTYPE.JSON
        };

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            data: options.file, ...httpParams
        };
        return RequestService.postRequest<SaveFileToDocumentResponse>(httpLocalParams, urlRequestParams);
    }


    /**
     * Загрузить файл во временное хранилище
     * @method uploadFile
     * @param options {UploadFileParams} Параметры запроса
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    uploadFile(options: UploadFileParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'UPLOADFILE',
            UPLOADID: options.uploadId,
            ACTION: options.action
        };

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            data: options.action === 'upload' ? options.file : undefined,
            ...httpParams
        };
        return RequestService.postRequest<UploadFileResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Построение маршрута по точкам
     * @method createRouteByPoints
     * @param options {CreateRouteByPointsParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async createRouteByPoints(options: CreateRouteByPointsParams, httpParams?: AxiosRequestConfig) {
        const SERVICEVERSION = await this.getVersion();
        const getRequestParams = {
            RESTMETHOD: 'CREATEROUTEBYPOINTS',
            SERVICE: 'WFS',
            CRS: 'EPSG:4326',
            LENGTH: '1',
            ROUTETEXT: '1',
            OUTTYPE: OUTTYPE.JSON,
            SERVICEVERSION,
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<CreateRouteByPointsResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Получение высоты в точке
     * @method getCoveragePoint
     * @param options {GetCoveragePointParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getCoveragePoint(options: GetCoveragePointParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETCOVERAGEPOINT',
            SERVICE: 'WCS',
            CRS: 'EPSG:4326',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams, responseType: 'json' };
        return RequestService.getRequest<GetCoveragePointResponse>(httpLocalParams, getRequestParams);
    }

    /**
     * Создать, изменить, заместить или удалить объекты
     * @method transaction
     * @param httpParams {AxiosRequestConfig} HTTP-параметры запроса
     * @param [options] {TransactionUserParams} Параметры запроса
     * @return {Promise} Объект запроса
     */
    transaction(httpParams: AxiosRequestConfig, options?: TransactionUserParams) {
        const requestParams = {
            SERVICE: 'WFS',
            RESTMETHOD: 'Transaction',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };
        const httpOptions: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postRequest<TransactionResponse>(httpOptions, requestParams);
    }

    /**
     * Построение тематической карты по файлу
     * @method сreateThematicMapByFile
     * @param options {CreateThematicMapByFileParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    createThematicMapByFile(options: CreateThematicMapByFileParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'CREATETHEMATICMAPBYFILE',
            OUTTYPE: OUTTYPE.JSON,
        };

        const requestData = this.formRPCparamsArray(options, {
            RESTMETHOD: 'CREATETHEMATICMAPBYFILE',
            MINSEMANTICARRAY: options.MINSEMANTICARRAY,
            MAXSEMANTICARRAY: options.MAXSEMANTICARRAY,
            COLORARRAY: options.COLORARRAY,
            NUMBERCONNECTFIELD: options.NUMBERCONNECTFIELD,
            NUMBERVALUEFIELD: options.NUMBERVALUEFIELD,
            FILEDELIMETR: options.FILEDELIMETR,
            FILECODETYPE: options.FILECODETYPE,
            SEMANTICKEY: options.SEMANTICKEY,
            FILEDATA: options.FILEDATA
        });

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.postXmlRpc<CreateThematicMapByFileResponse>(httpLocalParams, getRequestParams, requestData);
    }

    /**
     * Получить состояние слоев (идентификатор состояния, версия карты)
     * @method getLayerState
     * @param options {GetLayerStateParams} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getLayerState(options: GetLayerStateParams, httpParams?: HttpParams) {

        const getRequestParams = {
            RESTMETHOD: 'GETLAYERSTATE'
        };

        const requestParams = new RestMethodParams<GetLayerStateParams>(getRequestParams.RESTMETHOD);
        options.LAYER.split(',').forEach(layerId => requestParams.addLayer(layerId));
        requestParams.addCommonParam('OUTTYPE', options.OUTTYPE || OUTTYPE.JSON);

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            ...httpParams
        };

        return RequestService.postJsonRpc<GetLayerStateResponse>(httpLocalParams, getRequestParams, requestParams.toJson());
    }

    /**
     * Построение тематической карты по файлу
     * @method createThematicMapByCsv
     * @param options {CreateThematicMapByCsvParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @param [urlRequestParamsAsync] {UrlRequestParams} Параметры асинхронного запроса
     * @return {Promise} Объект запроса
     */
    createThematicMapByCsv(options: CreateThematicMapByCsvParams, httpParams?: AxiosRequestConfig, urlRequestParamsAsync?: UrlRequestParams) {
        const getRequestParams = {
            RESTMETHOD: 'CREATETHEMATICMAPBYCSV'
        };

        const layerId = options.LAYER;

        const requestParams = new RestMethodParams<CreateThematicMapByCsvParams & { RESTMETHOD?: string; }>(urlRequestParamsAsync && urlRequestParamsAsync.RESTMETHOD || getRequestParams.RESTMETHOD);

        requestParams.addCommonParam('OUTTYPE', OUTTYPE.JSON);

        if (urlRequestParamsAsync?.RESTMETHOD) {
            requestParams.addCommonParam('RESTMETHOD', 'CREATETHEMATICMAPBYCSV');
        }
        requestParams.addLayerParam(layerId, 'LAYER', options.LAYER);
        requestParams.addLayerParam(layerId, 'NUMBERCONNECTFIELD', options.NUMBERCONNECTFIELD);

        requestParams.addLayerParam(layerId, 'FILEDATA', options.FILEDATA, 'base64');
        requestParams.addLayerParam(layerId, 'FILEDATASIZE', options.FILEDATASIZE);
        requestParams.addLayerParam(layerId, 'FILTER', options.FILTER, 'json');
        requestParams.addLayerParam(layerId, 'NUMBERFIELDCOLOR', options.NUMBERFIELDCOLOR);
        requestParams.addLayerParam(layerId, 'NUMBERFIELDSIZE', options.NUMBERFIELDSIZE);
        requestParams.addLayerParam(layerId, 'NUMBERFIELDTRANSPARENT', options.NUMBERFIELDTRANSPARENT);
        requestParams.addLayerParam(layerId, 'SEMKEYLIST', options.SEMKEYLIST);
        requestParams.addLayerParam(layerId, 'SEMNUMBERFIELDLIST', options.SEMNUMBERFIELDLIST);
        requestParams.addLayerParam(layerId, 'SEMNAMEFIELDLIST', options.SEMNAMEFIELDLIST);
        requestParams.addLayerParam(layerId, 'SAVEDPATH', options.SAVEDPATH);
        requestParams.addLayerParam(layerId, 'SAVERESULTONMAINMAP', options.SAVERESULTONMAINMAP);
        requestParams.addLayerParam(layerId, 'FILEDELIMETR', options.FILEDELIMETR);

        if (options.SEMANTICKEY) {
            requestParams.addLayerParam(layerId, 'SEMANTICKEY', options.SEMANTICKEY, 'string');
        } else if (options.BYOBJECTKEY) {
            requestParams.addLayerParam(layerId, 'BYOBJECTKEY', options.BYOBJECTKEY, 'string');
        }

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            ...httpParams
        };
        return RequestService.postJsonRpc<CreateThematicMapByCsvResponse | CreateProcessResponse>(httpLocalParams, urlRequestParamsAsync || getRequestParams, requestParams.toJson());

    }

    /**
     * Построение тематической карты по файлу асинхронным способом
     * через метод EXECUTE
     * @method createThematicMapByCsvAsync
     * @param options {CreateThematicMapByCsvParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект ответа
     */
    async createThematicMapByCsvAsync(options: CreateThematicMapByCsvParams, httpParams?: AxiosRequestConfig) {
        const SERVICEVERSION = await this.getVersion();
        const urlRequestParams = {
            RESTMETHOD: 'EXECUTE',
            IDENTIFIER: 'CREATETHEMATICMAPBYCSV',
            SERVICEVERSION,
            SERVICE: 'WPS',
        };
        return this.createThematicMapByCsv(options, httpParams, urlRequestParams);
    }


    /**
     * Получить атрибутивные характеристики объектов карты
     * @method getFeatureById
     * @param options {GetFeatureParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    async getFeatureInfo(options: GetFeatureParams, httpParams?: AxiosRequestConfig) {
        const getRequestParams = {
            RESTMETHOD: 'GETFEATURE'
        };

        const SERVICEVERSION = await this.getVersion();
        const requestParams = new RestMethodParams<GetFeatureParams>(getRequestParams.RESTMETHOD);

        requestParams.addCommonParam('OBJCENTER', options.OBJCENTER || OBJCENTER.ObjectCenter);
        requestParams.addCommonParam('SEMANTIC', options.SEMANTIC || '1');
        requestParams.addCommonParam('SEMANTICNAME', options.SEMANTICNAME || '1');
        requestParams.addCommonParam('METRIC', options.METRIC || METRIC.RemoveMetric);
        requestParams.addCommonParam('MAPID', options.MAPID || '1');
        requestParams.addCommonParam('FINDDIRECTION', options.FINDDIRECTION || FINDDIRECTION.FirstObjectLast);
        requestParams.addCommonParam('GETGRAPHOBJECTS', options.GETGRAPHOBJECTS || '0');
        requestParams.addCommonParam('GETSLD', options.GETSLD || '0');
        requestParams.addCommonParam('GETKEY', options.GETKEY || '1');
        requestParams.addCommonParam('FILESEMANTICLINK', options.FILESEMANTICLINK || '1');
        requestParams.addCommonParam('SEMANTICCODE', options.SEMANTICCODE || '1');
        requestParams.addCommonParam('NOFILELINK', options.NOFILELINK || '1');
        requestParams.addCommonParam('SERVICEVERSION', SERVICEVERSION);
        requestParams.addCommonParam('OUTTYPE', options.OUTTYPE || OUTTYPE.JSON);
        requestParams.addCommonParam('GETEMPTYCLUSTEROBJECT', options.GETEMPTYCLUSTEROBJECT || '1');


        options.LAYER.split(',').forEach(layerId => requestParams.addLayer(layerId));

        const httpLocalParams: HttpParams = {
            ...this.defaults,
            ...httpParams
        };

        return RequestService.postJsonRpc<GeoJsonType>(httpLocalParams, getRequestParams, requestParams.toJson());
    }

    /**
     * Запрос параметров проекции
     * @method getTranslate
     * @param options {GetTranslateParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getTranslate(options: GetTranslateParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETTRANSLATE',
            ...options
        };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetTranslateResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Удалить слой из списка доступных пользователю или удалить физически на сервере
     * @method deleteLayer
     * @param options {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    deleteLayer(options: DeleteLayerParams, httpParams?: HttpParams) {
        const getRequestParams = {
            RESTMETHOD: 'DELETELAYER',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<string>(httpLocalParams, getRequestParams);
    }

    /**
     * Удалить каталог физически на сервере
     * @method deleteData
     * @param options {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    deleteData(options: DeleteDataParams, httpParams?: HttpParams) {
        const getRequestParams = {
            RESTMETHOD: 'DELETEDATA',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<string>(httpLocalParams, getRequestParams);
    }

    /**
     * Удалить слой физически на GIS Server
     * @method deleteLayerOnGISServer
     * @param options {object} Параметры запроса
     * @param [httpParams] {HttpParams} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    deleteLayerOnGISServer(options: DeleteLayerOnGISServerParams, httpParams?: HttpParams) {
        const getRequestParams = {
            RESTMETHOD: 'DELETELAYERONGISSERVER',
            ...options
        };
        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest<string>(httpLocalParams, getRequestParams);
    }

    /**
     * Запрос содержимого локальной виртуальной папки или данных с виртуальной папки ГИС Сервера
     * @method getDataFromFolder
     * @param options {GetDataFromFolderParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getDataFromFolder(options: GetDataFromFolderParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETDATAFROMFOLDER',
            ...options
        };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetDataFromFolderResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Функция создания пользовательского слоя на основе существующих схем
     * @method createUserMap
     * @param options {CreateUserMapParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    createUserMap(options: CreateUserMapParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            SERVICE: 'WFS',
            RESTMETHOD: 'CREATEUSERMAP',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<CreateUserMapResponse>(httpLocalParams, urlRequestParams);
    }

    /**
     * Переименование данных на ГИС Сервере
     * @method renameDataOnGISServer
     * @param options {RenameDataOnGISServerParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    renameDataOnGISServer(options: RenameDataOnGISServerParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'RENAMEDATAONGISSERVER',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };

        const httpLocalParams: HttpParams = { ...this.defaults, responseType: 'text', ...httpParams };
        return RequestService.getRequest(httpLocalParams, urlRequestParams);
    }

    /**
     * Запрос журнала транзакций
     * @method getTransactionListInXml
     * @param options {GetTransactionListInXmlParams} Параметры запроса
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getTransactionListInXml(options: GetTransactionListInXmlParams, httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'GETTRANSACTIONLISTINXML',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetTransactionListInXmlResponse>(httpLocalParams, urlRequestParams);
    }


    /**
    * Запрос динамических подписей
    * @method getDynamicLabelList
    * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
    * @return {Promise} Объект запроса
    */
    getDynamicLabelList(httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'getDynamicLabelList'
        };

        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest<GetDynamicLabelListResponse>(httpLocalParams, urlRequestParams);
    }
    /**
    * Запросить список поддерживаемых проекций
    * @method getCrsList
    * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
    * @return {Promise<ServiceResponse<string>>} Объект ответа
    */
    getCrsList(httpParams?: AxiosRequestConfig) {
        const urlRequestParams = {
            RESTMETHOD: 'getCrsList'
        };
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        return RequestService.getRequest(httpLocalParams, urlRequestParams);
    }

    fetchLegendImage(url: string, httpParams?: AxiosRequestConfig) {
        const httpOptions: HttpParams = {
            ...this.defaults,
            url,
            ...httpParams,
            responseType: 'blob'
        };
        return RequestService.getRequest<Blob>(httpOptions, {});
    }

    getFeatureStatistics(layerIds: string[], options: { BBOX: string; SRSNAME: string; OBJECTVIEWSCALE: string; }, httpParams?: AxiosRequestConfig) {
        const requestParams: XMLRpcData[] = layerIds.map(layerId => ({
            RESTMETHOD: 'GETFEATURE',
            LAYER: layerId,
            GETSTATISTICS: '1',
            MAPID: '1',
            NOFILELINK: '1',
            OUTTYPE: OUTTYPE.JSON,
            ...options
        }));
        const httpLocalParams: HttpParams = { ...this.defaults, ...httpParams };
        const urlRequestParams = {
            RESTMETHOD: 'GETFEATURE'
        };
        return RequestService.postJson<GetStatisticsResponse>(httpLocalParams, urlRequestParams, requestParams);
    }

}
