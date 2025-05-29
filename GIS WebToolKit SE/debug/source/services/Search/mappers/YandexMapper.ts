/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Маппер для Yandex                         *
 *                                                                  *
 *******************************************************************/

import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import CommonService from '~/services/RequestServices/common/CommonService';
import { SimpleJson } from '~/types/CommonTypes';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import GwtkMapper from './GwtkMapper';
import { ServiceResponse } from '~/services/Utils/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GeoPoint from '~/geo/GeoPoint';

type MapperParams = {
    apikey: string;
}

type RequestParams = {
    apikey: string;
    geocode: string;
    format?: 'json' | 'xml';
    results?: string;
    skip?: string;
};

/**
 * Класс поиска на сервисе Yandex
 * @class YandexMapper
 * @extends GwtkMapper
 */
export default class YandexMapper extends GwtkMapper<RequestParams> {

    private defaults: MapperParams = { apikey: '' };

    /**
     * @constructor YandexMapper
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param requestService {CommonService} Сервис запросов
     * @param params {MapperParams} Параметры маппера
     */
    constructor( vectorLayer: VectorLayer, requestService: CommonService, params: MapperParams ) {
        super( vectorLayer, requestService.commonGet.bind( requestService ) );

        let key: keyof MapperParams;
        for ( key in this.defaults ) {
            if ( params[ key ] !== undefined ) {
                this.defaults[ key ] = params[ key ] as any;
            }
        }
    }

    protected prepareRequestParams( criteriaAggregators: CriteriaAggregator[] ): RequestParams {
        let results, skip, geocode = '';
        // параметры поиска для каждого слоя карты, где поиск выполняется
        for ( let i = 0; i < criteriaAggregators.length; i++ ) {

            const criteriaAggregator = criteriaAggregators[ i ];
            const numericCount = criteriaAggregator.getCriterionContent( SearchCriterionName.Count );
            results = (numericCount !== undefined) ? ('' + numericCount) : undefined;
            const numericStartIndex = criteriaAggregator.getCriterionContent( SearchCriterionName.StartIndex );
            skip = (numericStartIndex !== undefined) ? ('' + numericStartIndex) : undefined;

            const semanticFilter = criteriaAggregator.getCriterionContent( SearchCriterionName.Text );
            geocode = semanticFilter ? GwtkMapper.getSearchText( semanticFilter.semanticCriterionList ) : '';
        }
        return { ...this.defaults, geocode, results, skip, format: 'json' };
    }

    protected onDataLoaded( results: ServiceResponse<SimpleJson<any>> ) {
        return this.parseResponse( results );
    }

    /**
     * Разобрать ответ по формату Адресной базы данных (или Яндекс)
     * @private
     * @method parseResponse
     * @param results {Object} Ответ сервиса
     * @return {GwtkMapperResult} Обработанный ответ сервера
     */
    private parseResponse( results: ServiceResponse<SimpleJson<any>> ) {
        const mapObjects = [];
        let foundObjectCount = 0;
        if ( !results.error && results.data ) {
            const response = results.data.response;
            foundObjectCount = +response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found;
            if ( foundObjectCount !== 0 ) {
                const featureCollection = response.GeoObjectCollection.featureMember;
                for ( let i = 0; i < featureCollection.length; i++ ) {
                    const feature = featureCollection[ i ];
                    const point = feature.GeoObject.Point.pos.split( ' ' );
                    // const mapObject = new MapObject( this.vectorLayer, MapObjectType.Point,{ name: feature.GeoObject.metaDataProperty.GeocoderMetaData.text, code:0,layer:feature.GeoObject.name, layerid:this.vectorLayer.idLayer, id:i+'', mapid:this.vectorLayer.idLayer,schema:'' } );
                    const mapObject = new MapObject(this.vectorLayer, MapObjectType.Point, {
                        id: 'yandex.' + (i + 1),
                        layer: feature.GeoObject.description,
                        code: 0,
                        layerid: '' + feature.GeoObject.metaDataProperty.GeocoderMetaData.locality,
                        mapid: '',
                        name: feature.GeoObject.name,
                        schema: ''
                    });

                    const components = feature.GeoObject.metaDataProperty.GeocoderMetaData.Address.Components;
                    for ( let j = 0; j < components.length; j++ ) {
                        const key = components[ j ].kind + '_' + j;
                        const name = this.getSemanticName( components[ j ].kind );
                        const value = components[ j ].name;

                        mapObject.addSemantic( { key, value, name } );
                    }

                    mapObject.addGeoPoint( new GeoPoint( parseFloat( point[ 0 ] ), parseFloat( point[ 1 ] ), parseFloat( point[ 2 ] || 0 ) ) );

                    mapObjects.push( mapObject );

                }
            }
        }
        return { mapObjects, foundObjectCount };
    }

    private getSemanticName( key: string ) {
        const tr = ( a: string ) => { return this.vectorLayer.map.translate( a ); };
        switch ( key ) {
            case 'country':
                return tr( 'Country' );
            case 'province':
                return tr( 'Province' );
            case 'area':
                return tr( 'Zone' );
            case 'district':
                return tr( 'District' );
            case 'locality':
                return tr( 'Locality' );
            case 'hydro':
                return tr( 'Hydro' );
            default:
                return 'Объект';
        }
    }
}

