/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Управление выделением объектов отобранных объектов       *
 *                                                                  *
 *******************************************************************/

import WmsLayer from './WmsLayer';
import { GwtkMap } from '~/types/Types';
import { GwtkLayerDescription } from '~/types/Options';
import { SearchRequestParams } from '~/services/Search/MultiServiceFinder';
import { SearchParametersIdList } from './SelectObjectFilter';


export type IdListCatalog = {
    mapId: string;
    idList: SearchParametersIdList[];
};

export default class SelectedObjectsDrawManager {
    /**
     * Экземпляр карты
     * @property map {GwtkMap}
     * @private
     */
    private readonly map: GwtkMap;

    readonly prefix: string = 'duty_';

    /**
     * Флаг выделения объектов
     * @property highlightObjectsFlag {boolean}
     * @private
     */
    private highlightObjectsFlag: boolean = false;

    /**
     * Список слоев для отображения выделенных объектов
     * @property layersList {WmsLayer[]}, массив слоев WmsLayer
     * @private
     */
    private layersList: WmsLayer[] = [];


    /**
     * Конструктор
     * @param map {GwtkMap} Карта
     */
    constructor( map: GwtkMap ) {
        this.map = map;
    }

    /**
     * Флаг выделения объектов
     * @property paintSelectedObjectsFlag {boolean}
     * @returns {boolean}
     */
    get paintSelectedObjectsFlag() {
        return this.highlightObjectsFlag;
    }

    /**
     * Установить флаг выделения объектов
     * @property paintSelectedObjectsFlag
     * @param value {boolean}
     */
    set paintSelectedObjectsFlag( value: boolean ) {
        this.highlightObjectsFlag = value;
    }

    /**
     * Список слоев для выделения объектов
     * @property selectedObjectsLayers
     * @returns {WmsLayer[]} массив слоев для выделения объектов
     */
    get selectedObjectsLayers() {
        return this.layersList;
    }

    /**
     * Получить текущие параметры поиска объектов
     * @method getSearchObjectParameters
     * @return { [SearchRequestParams] }, массив параметров по серверам
     */
    getSearchObjectParameters() {
        const windowBounds = this.map.getWindowBounds();

        const selectedMapObjects = this.map.getSelectedObjects().filter( mapObject => mapObject.getBounds().intersects( windowBounds ) );

        if ( selectedMapObjects.length === 0 ) {
            return [];
        }

        const searchDescription: SearchRequestParams[] = [];

        const idListCatalog = new Map<string, SearchParametersIdList[]>();
        const serverCatalog = new Map<string, Set<string>>();

        selectedMapObjects.forEach(
            mapobject => {
                if ( mapobject.mapId ) {
                    const mapid = mapobject.mapId;
                    const key = mapobject.vectorLayer.serviceUrl + mapid;
                    let list = idListCatalog.get( key );
                    if ( !list ) {
                        list = [];
                    }
                    list.push( { mapid, 'gmlid': mapobject.gmlId } );
                    idListCatalog.set( key, list );

                    let serviceList = serverCatalog.get( mapobject.vectorLayer.serviceUrl );
                    if ( !serviceList ) {
                        serviceList = new Set<string>();
                    }
                    serviceList.add( mapid );
                    serverCatalog.set( mapobject.vectorLayer.serviceUrl, serviceList );
                }
            }
        );

        for ( const server of serverCatalog.keys() ) {
            const idents = serverCatalog.get( server );
            const descriptor: SearchRequestParams = {
                server,
                params: []
            };
            idents?.forEach( idlayer => {
                descriptor.params.push( { LAYER: idlayer } );
            } );
            searchDescription.push( descriptor );
        }

        for ( const descriptor of searchDescription ) {
            const params = descriptor.params;
            if ( params && params.length > 0 ) {
                this.prepareParamsByIdList( descriptor, idListCatalog );
            }
        }

        return searchDescription;
    }

    /**
     * Подготовить параметры для поиска по идентификаторам выделенных объектов
     * @method prepareParamsByIdList
     * @param descriptor { SearchRequestParams }, массив параметров слоев для сервера
     * @param objectList {Map} отсортированные по слоям идентификаторы выделенных объектов
     */
    private prepareParamsByIdList( descriptor: SearchRequestParams, objectList: Map<string, SearchParametersIdList[]> ) {

        const emptyLayer = [];
        const idList: SearchParametersIdList[] = [];

        for ( const params of descriptor.params ) {
            if ( params.LAYER && params.LAYER.length > 0 ) {
                const key = descriptor.server + params.LAYER;
                const gmlidList = objectList.get( key );
                if ( !gmlidList ) {
                    emptyLayer.push( params.LAYER );
                } else {
                    idList.push( ...gmlidList );
                    const gmlid = [];
                    for ( const item of gmlidList ) {
                        gmlid.push( item.gmlid );
                    }
                    params.IDLIST = gmlid.join( ',' );
                }
            }
        }

        if ( idList.length > 0 ) {
            descriptor.idlist = idList;
        }

        for ( const id of emptyLayer ) {
            const index = descriptor.params.findIndex( param => param.LAYER && param.LAYER === id );
            if ( index > -1 ) {
                descriptor.params.splice( index, 1 );
            }
        }
    }

    /**
     * Получить слои для рисования выделенных объектов
     * @method getSelectedObjectsLayers
     * @param searchDescription { SearchRequestParams[] } параметры объектов по серверам и слоям
     * @returns {WmsLayer[]} массив слоев для выделения объектов
     */
    getSelectedObjectsLayers( searchDescription: SearchRequestParams[] ) {

        const layers: WmsLayer[] = [];
        const layersCatalog = new Map<string, WmsLayer>();

        searchDescription.forEach( description => {
            for ( const layer of this.layersList ) {
                if ( description.server === layer.server ) {
                    description.params.forEach( param => {
                        if ( param.LAYER === layer.idLayer ) {
                            const key = layer.server + layer.idLayer;
                            layersCatalog.set( key, layer );
                        }
                    } );
                }
                layer.setVisibility( false );
            }
        } );

        for ( let layer of layersCatalog.values() ) {
            layers.push( layer );
        }

        return layers;
    }

    /**
     * Открыть слой выделения объектов
     * @method openSelectionLayer
     * @param maplayer {WmsLayer} слой карты
     * @return { WmsLayer }, слой WmsLayer
     * @private
     */
    openSelectionLayer( maplayer: WmsLayer ): WmsLayer | undefined {
        if ( maplayer.selectObject ) {
            return this.openLayer( this.getLayerDescription( maplayer ) );
        }
    }

    /**
     * Удалить слой выделения объектов
     * @method removeColoringLayer
     * @param xid {string} идентификатор слоя в карте
     */
    removeSelectionLayer( xid: string ) {
        let xId: string = xid;
        if ( xid.indexOf( this.prefix ) === -1 ) {
            xId = this.prefix + xid;
        }
        this.removeLayer( xId );
    }

    /**
     * Открыть слой выделения объектов
     * @method openLayer
     * @param options {GwtkLayerDescription} параметры слоя
     * @return { WmsLayer }, слой WmsLayer
     * @private
     */
    private openLayer( options: GwtkLayerDescription ): WmsLayer | undefined {
        const params = JSON.parse( JSON.stringify( options ) );
        if ( params.id.indexOf( this.prefix ) === -1 ) {
            params.id = this.prefix + params.id;
        }

        const layer = new WmsLayer( this.map, options );

        if ( layer && layer.wms ) {
            this.map.tiles.wmsManager.registerLayer( layer );
            layer.onAdd();
            this.layersList.push( layer );
            return layer;
        }
    }

    /**
     * Удалить слой
     * @method removeLayer
     * @param xid {string} идентификатор слоя
     * @private
     */
    private removeLayer( xid: string ) {
        const layer = this.layersList.find( layer => layer.xId === xid );
        if ( layer ) {
            const index = this.layersList.indexOf( layer );
            layer.onRemove();
            if ( index > -1 ) {
                this.layersList.splice( index, 1 );
            }
        }
    }

    /**
     * Получить параметры слоя выделения объектов
     * @method getLayerDescription
     * @param maplayer { WmsLayer } слой карты
     * @returns { GwtkLayerDescription }
     * @private
     */
    private getLayerDescription( maplayer: WmsLayer ): GwtkLayerDescription {
        return {
            'id': this.prefix + maplayer.xId,
            'alias': '',
            'selectObject': false,
            'url': maplayer.serverUrl,
            'gis': true,
            'duty': true,
            'hidden': 1,
            'authtype': maplayer.options.authtype,
            'schemename': maplayer.options.schemename
        };
    }

    /**
     * Получить xid слоя карты для слоя выделения объектов
     * @method xIdOriginal
     * @param xid { string } id слоя выделения объектов
     * @returns { string } xid слоя карты
     * @static
     */
    static xIdOriginal( xid: string ): string {
        const ident = xid.split( 'duty_' );
        if ( ident[ 1 ] ) {
            return ident[ 1 ];
        }
        return '';
    }

}
