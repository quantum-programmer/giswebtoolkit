/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Конструктор параметров JSON-RPC запроса               *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';
import { JsonParam, JsonParamType, JsonRpcRequest } from '~/services/RequestServices/RestService/Types';

interface LayerItem<T extends SimpleJson<any>> {
    id: string;
    params: JsonParam<T>[];
}

interface JsonRpcParams<T extends SimpleJson<any>> {
    restmethod: {
        name: string;
        common: JsonParam<T>[],
        layerlist: LayerItem<T>[];
        params: JsonParam<T>[];
    }
}

/**
 * Конструктор параметров JSON-RPC запроса
 * @class RestMethodParams
 */
export default class RestMethodParams<T extends SimpleJson<any>> {

    private readonly json: JsonRpcParams<T>;

    /**
     * @constructor RestMethodParams
     * @param methodName {string} Название метода
     */
    constructor( readonly methodName: string ) {
        this.json = {
            restmethod: {
                name: methodName,
                common: [],
                layerlist: [],
                params: []
            }
        };
    }

    /**
     * Получить/создать элемент слоя
     * @private
     * @method retrieveOrCreateLayerItem
     * @param layerId {string} Идентификатор слоя на сервисе
     * @return {LayerItem} Элемент слоя
     */
    private retrieveOrCreateLayerItem( layerId: string ): LayerItem<T> {
        let layerItem = this.json.restmethod.layerlist.find( layer => layer.id === layerId );
        if ( !layerItem ) {
            layerItem = { id: layerId, params: [] };
            this.json.restmethod.layerlist.push( layerItem );
        }
        return layerItem;
    }

    /**
     * Добавить слой (без параметров)
     * @method addLayer
     * @param layerId {string} Идентификатор слоя на сервисе
     */
    addLayer( layerId: string ) {
        this.retrieveOrCreateLayerItem( layerId );
    }

    /**
     * Добавить параметр слоя
     * @method addLayer
     * @param layerId {string} Идентификатор слоя на сервисе
     * @param name {string} Наименование параметра
     * @param value {string} Значение параметра
     * @param [type] {string} Тип значения параметра
     */
    addLayerParam( layerId: string, name: keyof T, value: T[keyof T], type: JsonParamType = 'string' ): void {
        if ( value !== undefined ) {
            const layerItem = this.retrieveOrCreateLayerItem( layerId );

            layerItem.params.push( {
                name,
                value,
                type
            } );
        }
    }

    /**
     * Добавить общий параметр
     * @method addCommonParam
     * @param name {string} Наименование параметра
     * @param value {string} Значение параметра
     * @param [type] {string} Тип значения параметра
     */
    addCommonParam( name: keyof T, value: T[keyof T], type: JsonParamType = 'string' ): void {
        this.json.restmethod.common.push( {
            name,
            value,
            type
        } );
    }

    /**
     * Добавить ссылочный параметр
     * @method addLinkedParam
     * @param name {string} Наименование параметра
     * @param value {string} Значение параметра
     * @param [type] {string} Тип значения параметра
     */
    addLinkedParam( name: keyof T, value: T[keyof T], type: JsonParamType = 'string' ): void {
        this.json.restmethod.params.push( {
            name,
            value,
            type
        } );
    }

    /**
     * Получить JSON объект для запроса
     * @method toJson
     * @return {JsonRpcRequest} Объект запроса
     */
    toJson(): JsonRpcRequest<T> {

        const name = this.json.restmethod.name;
        const common = this.json.restmethod.common.length > 0 ? JSON.parse( JSON.stringify( this.json.restmethod.common ) ) as JsonParam<T>[] : undefined;

        let layerlist = undefined;
        if ( this.json.restmethod.layerlist.length > 0 ) {
            layerlist = this.json.restmethod.layerlist.map( layerItem => {
                const id = layerItem.id;
                let params = undefined;
                if ( layerItem.params.length > 0 ) {
                    params = JSON.parse( JSON.stringify( layerItem.params ) ) as JsonParam<T>[];
                }
                return { id, params };
            } );
        }

        const params = this.json.restmethod.params.length > 0 ? JSON.parse( JSON.stringify( this.json.restmethod.params ) ) as JsonParam<T>[] : undefined;

        return {
            restmethod: {
                name,
                common,
                layerlist,
                params
            }
        };
    }

}
