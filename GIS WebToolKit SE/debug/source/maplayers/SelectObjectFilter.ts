/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Фильтр выделения объектов карты                   *
 *                                                                  *
 *******************************************************************/
import { WmsServerItem } from '~/maplayers/GroupLayer';
import { GetFeatureParams } from '~/services/RequestServices/RestService/Types';
import { SearchRequestParams } from '~/services/Search/MultiServiceFinder';

export type SearchParametersIdList = {
    mapid: string,
    gmlid: string
};

export class SelectObjectFilter {
    private searchParameters: SearchRequestParams;
    private readonly params: GetFeatureParams[];

    constructor( searchParameters: SearchRequestParams ) {
        this.searchParameters = searchParameters;
        this.params = this.searchParameters.params;
    }

    static getLayerIds( searchParameters: SearchRequestParams ): string[] {
        const ids: string[] = [];
        searchParameters.params.forEach( params => {
            if ( params.LAYER !== '' /*&& !ids.includes( params.LAYER )*/ ) {
                ids.push( params.LAYER );
            }
        } );
        return ids;
    }

    get idList(): SearchParametersIdList[] | undefined {
        return this.searchParameters.idlist;
    }

    set idList( value: SearchParametersIdList[] | undefined ) {
        if ( this.searchParameters.idlist ) {
            this.searchParameters.idlist.splice( 0 );
        }
        this.searchParameters.idlist = value;
    }

    getIdListForLayers( list: WmsServerItem[] ): SearchParametersIdList[] {
        const target: SearchParametersIdList[] = [];
        if ( this.idList ) {
            this.idList.forEach( item => {
                list.forEach( layerDesc => {
                    if ( item.mapid === layerDesc.id && !target.includes( item ) ) {
                        target.push( item );
                    }
                } );
            } );
        }
        return target;
    }

    get commonParameters(): GetFeatureParams {
        return this.params[ 0 ];
    }

    get layerParameters(): GetFeatureParams[] {
        const layerParam = [];
        for ( const searchparams of this.params ) {
            if ( searchparams.LAYER && searchparams.LAYER !== '' ) {
                layerParam.push( searchparams );
            }
        }
        return layerParam;
    }

    getLayerParameters( idLayer: string, server: string ): GetFeatureParams | undefined {
        if ( this.searchParameters.server === server ) {
            for ( const param of this.params ) {
                if ( param.LAYER && param.LAYER === idLayer ) {
                    return param;
                }
            }
        }
    }

}
