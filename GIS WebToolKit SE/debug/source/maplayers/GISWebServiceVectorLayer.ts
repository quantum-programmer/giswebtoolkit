/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Векторный слой на GISWebServiceSE (WFS)              *
 *                                                                  *
 *******************************************************************/


import {GwtkMap, DownloadFormat} from '~/types/Types';
import {GwtkLayerDescription} from '~/types/Options';
import VectorLayer from '~/maplayers/VectorLayer';
import GISWebServiceSource from '~/sources/GISWebServiceSource';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';
import {LogEventType} from '~/types/CommonTypes';
import {GetTransactionListInXmlResponse} from '~/services/RequestServices/RestService/Types';
import MapObject from '~/mapobject/MapObject';
import Utils from '~/services/Utils';
import GwtkError from '~/utils/GwtkError';
import WmsLayer from '~/maplayers/WmsLayer';


type TransactionActionList = GetTransactionListInXmlResponse['actionlist']['action'];

/**
 * Векторный слой на GISWebServiceSE (WFS)
 * @class GISWebServiceVectorLayer
 */
export default class GISWebServiceVectorLayer extends VectorLayer {

    /**
     * Источник данных для отображения
     * @private
     * @readonly
     * @property {VectorSource} source
     */
    protected readonly source: GISWebServiceSource;

    /**
     * @constructor GISWebServiceVectorLayer
     * @param map {GwtkMap} Экземпляр карты
     * @param options {Options} Параметры слоя
     */
    constructor(map: GwtkMap, options: GwtkLayerDescription) {
        super(map, options);
        const httpParams = RequestServices.createHttpParams(this.map, {url: this.serviceUrl});

        this.source = new GISWebServiceSource(httpParams, this.idLayer, this.map.getCrsString());
    }

    /**
     * URL-адрес источника
     * @property serviceUrl {string}
     */
    get serviceUrl() {
        return this.server || '';
    }

    /**
     * Отменить последнюю транзакцию
     * @async
     * @method undoTransaction
     */
    async undoTransaction() {
        this.map.clearActiveObject();
        this.map.clearSelectedObjects();
        const httpParams = GWTK.RequestServices.createHttpParams(this.map, {url: this.serviceUrl});
        const wfsQuery = GWTK.RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        await wfsQuery.undoLastAction({LAYER: this.idLayer});
        this.map.refresh();

        this.writeTransactionProtocolMessageWithPrefix(this.map.translate('Undo recent changes'));
    }

    /**
     * Восстановить последнюю отменённую транзакцию
     * @async
     * @method redoTransaction
     */
    async redoTransaction() {
        this.map.clearActiveObject();
        this.map.clearSelectedObjects();
        const httpParams = GWTK.RequestServices.createHttpParams(this.map, {url: this.serviceUrl});
        const wfsQuery = GWTK.RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        await wfsQuery.redoLastAction({LAYER: this.idLayer});
        this.map.refresh();

        this.writeTransactionProtocolMessageWithPrefix(this.map.translate('Redo recent changes'));
    }

    async getLayerStatus() {
        const httpParams = RequestServices.createHttpParams(this.map, {url: this.serviceUrl});
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        const response = await service.getLayerState({
            LAYER: this.idLayer,
            OUTTYPE: OUTTYPE.JSON
        });

        if (response.data) {
            return response.data.restmethod.outparams[0]?.value;
        } else {
            throw Error('Cannot get layer status');
        }
    }

    async getTransactionListForDay(): Promise<TransactionActionList> {
        let response: TransactionActionList = [];

        const requestService = RequestServices.retrieveOrCreate({url: this.serviceUrl}, ServiceType.REST);
        const date = new Date();
        date.setDate(date.getDate() - 2); // 2 дня назад
        const dateFormatted = date.toLocaleDateString().replaceAll('.', '/');

        try {
            const result = await requestService.getTransactionListInXml({
                LAYER: this.idLayer,
                DateBegin: dateFormatted
            });
            if (result && result.data) {
                response = result.data.actionlist.action;
            }
        } catch (error) {
            this.map.writeProtocolMessage({
                text: this.map.translate('Transaction log retrieval error') + '',
                type: LogEventType.Info,
                display: true
            });
        }

        return response;
    }

    private writeTransactionProtocolMessageWithPrefix(prefix: string): void {
        const text = `${prefix} (${this.map.translate('Layer')}: ${this.alias})`;

        this.map.writeProtocolMessage({text});
    }

    private writeTransactionProtocolMessage(objectIds: string[], transactionEvent: string): void {
        const map = this.map;

        const prefix = map.translate('Saving changes');
        const layerAliasPrefix = map.translate('Layer');
        const objectIdsPrefix = (objectIds.length > 1 ? map.translate('Objects identifier') : map.translate('Object identifier'));

        let text = `${prefix}. ${transactionEvent}: ${objectIds.length}. `;
        text += `(${layerAliasPrefix}: ${this.alias}, ${objectIdsPrefix}: ${objectIds.join(',')})`;

        map.writeProtocolMessage({text});
    }

    async commitTransaction() {
        try {
            const result = await this.source.commitTransaction();
            if (result) {
                const {inserted, replaced, deleted} = result;

                if (inserted.length > 0) {
                    this.writeTransactionProtocolMessage(inserted, this.map.translate('Created'));
                }
                if (replaced.length > 0) {
                    this.writeTransactionProtocolMessage(replaced, this.map.translate('Updated'));
                }
                if (deleted.length > 0) {
                    this.writeTransactionProtocolMessage(deleted, this.map.translate('Deleted'));
                }

                this.map.refresh();
            }
            return result;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            const text = this.map.translate('Error') + '. ' + this.map.translate('Saving changes') + '. ' + '(' + this.alias + ')';
            const description = error ? JSON.parse(gwtkError.message).exceptionText : undefined;
            this.map.writeProtocolMessage({text, description, type: LogEventType.Error, display: true});
            throw error;
        }
    }

    async commitMapObject(mapObject: MapObject) {
        try {
            const result = await this.source.commit(mapObject);
            if (result) {
                const text = this.map.translate('Saving changes') + '. ' + this.map.translate('Object') + ': ' + mapObject.gmlId + ' (' + this.alias + ')';
                this.map.writeProtocolMessage({text: text});

                this.map.refresh();
            }
            return result;
        } catch (error) {
            const gwtkError = new GwtkError(error);
            const text = this.map.translate('Error') + '. ' + this.map.translate('Saving changes') + '. ' + this.map.translate('Object') + ': ' + mapObject.gmlId + '(' + this.alias + ')';
            const description = error ? JSON.parse(gwtkError.message).exceptionText : undefined;
            this.map.writeProtocolMessage({text, description, type: LogEventType.Error, display: true});
        }
    }

    async download(formatOptions: DownloadFormat): Promise<Blob | undefined> {
        let blob;

        if (formatOptions.outType === OUTTYPE.CSV) {
            const result = await this.map.searchManager.findAllObjects([this], true);

            if (result !== undefined && result.mapObjects) {
                // Сформировать csv файл
                blob = Utils.mapObjectsToCsvGeometry(result.mapObjects);
            }
        } else {
            const service = RequestServices.retrieveOrCreate({url: this.server || ''}, ServiceType.REST);
            const requestParams = {
                LAYER: this.idLayer,
                OUTTYPE: formatOptions.outType
            };

            const response = await service.getFeature<Blob>([requestParams], {responseType: 'blob'});

            if (response !== undefined && response.data) {
                blob = response.data;
            }
        }

        return blob;
    }

}
