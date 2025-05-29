/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Группа слоев карты                        *
 *                                                                  *
 *******************************************************************/
import WmsLayer, {
    GetImageRequestParams,
    LayerRequestParams,
    LayerParamsItem
} from '~/maplayers/WmsLayer';
import { SimpleJson } from '~/types/CommonTypes';
import { SelectObjectFilter } from './SelectObjectFilter';
import { GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import { SearchRequestParams } from '~/services/Search/MultiServiceFinder';
import objectHash from 'object-hash';
import {PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL} from '~/utils/WorkspaceManager';


export type WmsServerItem = {
    'id': string;           // id сервиса
    'xId': string;          // id слоя в карте
    'layer': WmsLayer;      // слой
};

export type WmsServerDescriptor = {
    'server': string;           // url сервиса
    'scene': string;            // id слоя
    'list': WmsServerItem[];    // элементы WmsServerItem, состав группы
}

type LayerRequestCommonFilter = {
    'keylist': string;
    'idlist': string;
    'textfilter': string;
    'count': number;
    'index': number;
}

export class GroupLayer {
    /**
     * Адрес сервера
     * @private
     * @readonly
     * @property server {string}
     */
    private readonly server: string;

    /**
     * xid слоя
     * @private
     * @readonly
     * @property scene {string}
     */
    private scene: string;

    /**
     * Cписок слоев группы
     * @private
     * @readonly
     * @property list {WmsServerItem[]}
     */
    private readonly list: WmsServerItem[] = [];

    /**
     * Основной слой группы
     * @private
     * @readonly
     * @property layer {WmsLayer}
     */
    private readonly layer: WmsLayer;

    /**
     * Признак простой группы
     * @private
     * @readonly
     * @property simple {boolean}
     */
    private readonly simple: boolean;

    /**
     * Параметры выделения объектов
     * @private
     * @readonly
     * @property selectObjectFilter {SelectObjectFilter | undefined}
     */
    private selectObjectFilter: SelectObjectFilter | undefined;

    constructor( serverdescriptor: WmsServerDescriptor ) {
        this.server = serverdescriptor.server;
        this.scene = serverdescriptor.scene;
        this.list = serverdescriptor.list.slice();
        this.layer = this.list[ 0 ].layer;
        this.simple = !this.layer.useXmlRpc || this.layer.isBounds360;
    }

    /**
     * Адрес сервера
     * @property serviceUrl {string}
     */
    get serviceUrl(): string {
        return this.server;
    }

    /**
     * Получить список группы
     * @property getList {Array}, WmsServerItem[]
     */
    get getList() {
        return this.list;
    }

    /**
     * Установить слитым
     * @property setMerged{Array} WmsServerItem[]
     */
    setMerged() {
        this.scene = '';
    }

    /**
     * Признак 'слит'
     * @property isMerged{boolean}
     */
    get isMerged() {
        return this.scene === '';
    }

    /**
     * Очистить рисунки
     * @method setEmptyImage
     * @private
     */
    private setEmptyImage() {
        this.layer.clearImageSrc();
    }

    /**
     * Признак видимости группы
     * @property isGroupVisible {boolean}
     */
    get isGroupVisible() {
        for ( const item of this.list ) {
            if ( item.layer.isVisible ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Параметры поиска (фильтр выделения объектов)
     * @property searchParameters { SearchRequestParams }
     */
    set searchParameters( value: SearchRequestParams ) {
        if ( value.server === this.server ) {

            this.matchSearchLayers( value );
            if ( this.list.length === 0 ) {
                this.selectObjectFilter = undefined;
                return;
            }
            const filter = JSON.parse( JSON.stringify( value ) );

            this.selectObjectFilter = new SelectObjectFilter( filter );

            const idList = this.selectObjectFilter.getIdListForLayers( this.list );
            if ( idList ) {
                this.selectObjectFilter.idList = idList;
            }
        } else {
            this.selectObjectFilter = undefined;
        }
    }

    getSearchParameters(): GetFeatureParams[] | undefined {
        if ( this.selectObjectFilter ) {
            return this.selectObjectFilter.layerParameters;
        }
    }

    /**
     * Заполнить список слоев группы
     * группа формируется из соседних слоев одного сервера
     * (для возможности управлять порядком отображения слоев)
     * @method fillList
     * @params wmslayers {Array}, WmsLayer[]
     * @returns {Array}, WmsLayer[] - массив слоев, вошедших в группу
     */
    fillList( wmsLayers: WmsLayer[] ): WmsLayer[] | undefined {
        if ( wmsLayers.length === 0 ) {
            return;
        }
        if ( this.simple || !this.layer.isLayersMerge ) {
            return;
        }
        const merged = [];
        for ( const layer of wmsLayers ) {
            if ( !layer.isSimple ) {
                if ( layer.serviceUrl !== this.server ) {
                    continue;
                }
                if ( layer.serviceUrl === this.server && layer.xId !== this.scene ) {
                    this.list.push( { id: layer.idLayer, xId: layer.xId, layer } );
                    merged.push( layer );
                }
            }
        }
        const opacity = +this.layer.getOpacityCss();
        this.list.forEach( elem => elem.layer.setOpacity( opacity ) );

        return merged;
    }

    /**
     * Заполнить обычный список слоев группы
     * (группа формируется из всех слоев одного сервера)
     * @method fillCommonList
     * @params wmslayers {Array}, WmsLayer[]
     * @returns {Array}, WmsLayer[] - массив слоев, вошедших в группу
     */
    fillCommonList( wmslayers: WmsLayer[] ): WmsLayer[] | undefined {
        if ( wmslayers.length === 0 ) {
            return;
        }
        const merged = [];
        for ( const layer of wmslayers ) {
            if ( !layer.isSimple ) {
                if ( layer.serviceUrl === this.server && layer.xId !== this.scene ) {
                    if ( layer.idLayer === this.layer.idLayer ) {
                        continue;
                    }
                    this.list.push( { id: layer.idLayer, xId: layer.xId, layer } );
                    merged.push( layer );
                }
            }
        }
        return merged;
    }

    /**
     * Создать описание параметров запроса
     * @method createRequestDescription
     * @returns {GetImageRequestParams[] | undefined} описание параметров запроса
     * @private
     */
    private async createRequestDescription(): Promise<void | GetImageRequestParams[]> {

        let restParam = await this.layer.getLayerImageRequestParams( this.isGroupVisible );

        if ( restParam ) {
            if ( !this.layer.isVisible || !this.layer.enabledByFilter ) {
                restParam.forEach( rest => {
                    if ( rest.data ) {
                        rest.data.restmethod.layerlist.splice( 0, 1 );
                    }
                } );
            }
            // заполнить параметы фильтра для слоев в списке
            for ( const item of this.list ) {
                if ( item.xId !== this.layer.xId ) {
                    await this.fillItemRestParam( restParam, item );
                }
            }

            if ( restParam[ 0 ].data && restParam[ 0 ].data.restmethod.layerlist.length === 0 ) {
                restParam = undefined;
            }

            if ( restParam && this.layer.isLayersMerge ) {
                this.mergeLayerFilterById( restParam );          // объединить фильтры слоев с одинаковыми id сервиса
            }

        }
        return restParam;
    }

    /**
     * Создать описание параметров запроса выделения объектов
     * @method createSearchRequestDescription
     * @param mapObjects {MapObject[]} Массив выделенных объектов
     * @returns {GetImageRequestParams[] | undefined} описание параметров выделения объектов
     * @private
     */
    private async createSearchRequestDescription(): Promise<void | GetImageRequestParams[]> {
        const requestParams = await this.layer.getLayerImageRequestParams( this.isGroupVisible );
        if ( !requestParams || !this.selectObjectFilter ) {
            return;
        }

        let layerlist: LayerRequestParams[] | undefined;
        if ( requestParams[ 0 ].data ) {
            layerlist = requestParams[ 0 ].data.restmethod.layerlist;
        }

        // дополнить список layerlist для запроса
        this.list.forEach( ( layerdesc, index ) => {
            if ( index > 0 ) {
                layerlist?.push( { 'id': layerdesc.id, 'params': [] } );
            }
        } );

        for ( const restparam of requestParams ) {

            if ( restparam.data ) {
                const commonlist = this.getCommonForSearchParams();
                restparam.data.restmethod.common.push( ...commonlist );
            }

            if ( layerlist ) {
                const idList = this.selectObjectFilter.idList;
                if ( idList && idList.length > 0 ) {
                    this.fillIdListForSearchParams( layerlist );
                }
            }

            restparam.xdata = JSON.stringify( restparam.data );
        }

        return requestParams;
    }

    /**
     * Заполнить параметр IDLIST по фильтру поиска
     * @method fillIdListForSearchParams
     * @param layerlist {LayerRequestParams[]} параметры запроса слоев
     * @param mapObjects {MapObject[]} Массив выделенных объектов
     * @private
     */
    private fillIdListForSearchParams( layerlist: LayerRequestParams[] ): void {
        if ( !this.selectObjectFilter ) {
            return;
        }
        const idList = this.selectObjectFilter.idList;

        if ( idList ) {
            const name = 'IDLIST';
            const type = 'string';
            layerlist.forEach( layerparam => {
                const param = this.selectObjectFilter?.getLayerParameters( layerparam.id, this.server );
                if ( param && param.IDLIST && param.IDLIST.length > 0 ) {
                    layerparam.params = [{ name, value: param.IDLIST, type }];
                } else {
                    const gmlList: Set<string> = new Set();
                    idList.forEach( iditem => {
                        if ( iditem.mapid === layerparam.id ) {
                            gmlList.add( iditem.gmlid );
                        }
                    } );
                    const value = Array.from( gmlList ).join( ',' );
                    if ( value.length !== 0 ) {
                        layerparam.params = [{ name, value, type }];
                    }
                }
            } );
        }
    }

    /**
     * Получить параметры секции common для выделения объектов по фильтру поиска
     * @method getCommonForSearchParams
     * @returns { LayerParamsItem[] }
     * @private
     */
    private getCommonForSearchParams(): LayerParamsItem[] {
        const type = 'string';

        const commonlist: LayerParamsItem[] = [
            {
                'name': 'ONLYSELECTOBJECTS',
                'value': '1', type
            },
            {
                'name': 'COLOR',
                'value': this.layer.map.getLineColorMarkedObjects( true ), type
            }
        ];

        return commonlist;
    }

    /**
     * Заполнить параметры запроса слоя списка list
     * @method fillItemRestParam
     * @params params {GetImageRequestParams[]} массив описаний запроса
     * @params item {WmsServerItem} элемент списка list
     * @private
     */
    private async fillItemRestParam( params: GetImageRequestParams[], item: WmsServerItem ): Promise<void> {
        if ( params.length < 1 || !params[ 0 ].data ) {
            return;
        }
        for ( const param of params ) {
            if ( param.data && item.layer.isVisible && item.layer.enabledByFilter ) {
                if ( param.data.restmethod.layerlist ) {
                    const list = param.data.restmethod.layerlist;
                    const format = { name: 'format', value: item.layer.format, type: 'string' };
                    const layerParams: LayerParamsItem[] = [format];
                    const filterParams = item.layer.getFilter();
                    if ( filterParams ) {
                        layerParams.push( ...filterParams );
                    }

                    const dynamicLabelData = this.layer.map.workspaceManager.getValue(PROJECT_SETTINGS_LAYERS_DYNAMIC_LABEL);
                    const index = dynamicLabelData.findIndex((data) => data.id === item.layer.id);
                    if (index !== -1 && dynamicLabelData[index] && dynamicLabelData[index].dynamicLabel && this.layer.map.dynamicLabelList) {
                        const dynamicLabelData = await this.layer.map.dynamicLabelList.getDynamicLabelData(item.layer);
                        if (dynamicLabelData) {
                            layerParams.push(...[{ name: 'dynamicLabelRecodList', value: dynamicLabelData, type: 'string' }]);
                        }
                    }

                    list.push( { 'id': item.id, params: layerParams } );

                    param.xdata = JSON.stringify( param.data );
                }
            }
        }
    }

    /**
     * Объединить фильтр слоя по id
     * @method mergeLayerFilterById
     * @params params {GetImageRequestParams[]} массив описаний запроса
     * @private
     */
    mergeLayerFilterById( params: GetImageRequestParams[] ): void {
        if ( params.length < 1 ) {
            return;
        }
        for ( const param of params ) {
            if ( !param.data ) {
                continue;
            }

            if ( param.data.restmethod.layerlist.length < 2 ) {
                continue;
            }
            const currentList = param.data.restmethod.layerlist.slice();
            const sublist: SimpleJson<LayerRequestParams[]> = {};
            let currentListLength = currentList.length;
            for (let i = 0; i < currentList.length; i++) {
                const layeritem = currentList[i];

                const subitems = [];
                let curLength = currentList.length;
                for (let j = i + 1; j < curLength; j++) {
                    if (currentList[j].id === layeritem.id) {
                        subitems.push(currentList[j]);
                        currentList.splice(j, 1);
                        j--;
                        curLength--;
                    }
                }
                currentListLength = currentList.length;
                const key = objectHash(layeritem, {encoding: 'hex'});
                if (subitems && subitems.length > 1) {
                    sublist[key] = subitems;
                }
            }
            const list = param.data.restmethod.layerlist;
            let i = 0;
            let len = list.length;
            while ( i < len ) {
                const hex_id = objectHash( list[ i ], { encoding: 'hex' } );
                if ( sublist[ hex_id ] ) {

                    this.adjustLayerRequestList( list, list[ i ].id );

                    delete sublist[ hex_id ];

                    if ( list.length !== len ) {
                        len = list.length;
                        i = 0;
                    }
                } else {
                    i++;
                }

            }
            param.xdata = JSON.stringify( param.data );
        }
    }

    /**
     * Объединить описания слоев по id
     * @method adjustLayerRequestList
     * @params list {LayerRequestParams[]} описание параметров слоев
     * @params id {string} id слоя
     * @private
     */
    private adjustLayerRequestList( list: LayerRequestParams[], id: string ): number {
        const filter: LayerRequestCommonFilter = {
            'keylist': '',
            'idlist': '',
            'textfilter': '',
            'count': 0,
            'index': -1
        };

        this.fillCommonFilterById( list, id, filter );

        let count = filter.count;
        const index = filter.index;
        const total = count;
        if ( count > 1 && index > -1 ) {
            if ( this.resetLayerRequestParams( filter, list[ index ] ) ) {
                let i = index + 1;
                count--;
                while ( count > 0 ) {
                    if ( list[ i ] && list[ i ].id === id ) {
                        list.splice( i, 1 );
                        count--;
                        i = index;
                    }
                    i++;
                }
            }
        }
        return total;
    }

    /**
     * Заполнить фильтр по id
     * @method fillCommonFilterById
     * @params list {LayerRequestParams[]} описание параметров слоя
     * @params id {string} id слоя
     * @params filter {LayerRequestCommonFilter} описание фильтра
     * @private
     */
    private fillCommonFilterById( list: LayerRequestParams[], id: string, filter: LayerRequestCommonFilter ): void {
        let index = -1;
        let count = 0;
        for ( const layeritem of list ) {                        // общий фильтр для id
            if ( layeritem.id === id ) {
                if ( !layeritem.params ) {
                    continue;
                }
                if ( index < 0 ) {
                    index = list.indexOf( layeritem );
                }
                for ( const param of layeritem.params ) {
                    if ( param.name === 'keylist' ) {
                        const value = param.value as string;
                        if ( filter.keylist.length > 0 ) {
                            filter.keylist += ',';
                        }
                        filter.keylist += value;
                    }
                    if ( param.name === 'idlist' ) {
                        const value = param.value as string;
                        if ( filter.idlist.length > 0 ) {
                            filter.idlist += ',';
                        }
                        filter.idlist += value;
                    }
                    if ( param.name === 'textfilter' ) {
                        const value = param.value as string;
                        if ( filter.textfilter.length > 0 ) {
                            filter.textfilter = filter.textfilter + 'OR';
                        }
                        filter.textfilter += value;
                    }
                }
                count++;
            }
        }

        filter.index = index;
        filter.count = count;
    }

    /**
     * Переустановить фильтр в описании параметров
     * @method resetLayerRequestParams
     * @params layeritem {LayerRequestParams} описание параметров слоя
     * @params filter {LayerRequestCommonFilter} описание фильтра
     * @private
     */
    private resetLayerRequestParams( filter: LayerRequestCommonFilter, layeritem: LayerRequestParams ): boolean {
        if ( layeritem.params ) {
            for ( const param of layeritem.params ) {
                if ( param.name === 'keylist' && filter.keylist.length > 0 ) {
                    param.value = filter.keylist;
                }
                if ( param.name === 'idlist' && filter.idlist.length > 0 ) {
                    param.value = filter.idlist;
                }
                if ( param.name === 'textfilter' && filter.textfilter.length > 0 ) {
                    param.value = filter.textfilter;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Запрос
     * @method request
     * @params id {string} идентификатор запроса
     */
    async request(id: string): Promise<void | boolean> {
        let result = false;
        if ( this.isMerged ) {
            this.setEmptyImage();
        } else {
            const description = await this.createRequestDescription();
            if ( description ) {
                this.layer.requestImage( description, id );
                result = true;
            } else {
                this.setEmptyImage();
            }
        }
        return result;
    }

    /**
     * Запрос выделения объектов
     * @method requestWithSearchParam
     * @param id {string} идентификатор запроса
     * @param mapObjects {MapObject[]} Массив выделенных объектов
     */
    async requestWithSearchParam(id: string): Promise<boolean> {

        let result = false;
        if ( !this.selectObjectFilter ) {
            return result;
        }
        if ( this.isMerged ) {
            this.setEmptyImage();
        } else {
            const description = await this.createSearchRequestDescription();
            if ( description ) {
                this.layer.requestImage( description, id );
                result = true;
            } else {
                this.setEmptyImage();
            }
        }
        return result;
    }

    /**
     * Настроить список слоев для выделения объектов
     * @method matchSearchLayers
     * @params searchParameters {SearchParameters} параметры поиска
     */
    private matchSearchLayers( searchParameters: SearchRequestParams ) {
        const ids = SelectObjectFilter.getLayerIds( searchParameters );
        const remove: WmsServerItem[] = [];
        this.list.forEach( layerdesc => {
            if ( !ids.includes( layerdesc.id ) ) {
                remove.push( layerdesc );
            }
        } );
        while ( remove.length > 0 ) {
            const index = this.list.indexOf( remove[ 0 ] );
            if ( index !== -1 ) {
                this.list.splice( index, 1 );
            }
            remove.splice( 0, 1 );
        }
    }

    /**
     * Наличие id в списке группы
     * @method contains
     * @params xid {string} идентификатор слоя в карте
     * @returns {boolean}
     */
    contains( xid: string[] ): boolean {
        if ( xid.length === 0 ) {
            return true;
        }
        for ( const item of this.list ) {
            if ( xid.includes( item.xId ) ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Установить непрозрачность для группы
     * @method setOpacity
     * @params value {number} css непрозрачность
     */
    setOpacity( value: number ): void {
        this.list.forEach( item => item.layer.setOpacity( item.layer.initOpacity( value ) ) );
    }

}
