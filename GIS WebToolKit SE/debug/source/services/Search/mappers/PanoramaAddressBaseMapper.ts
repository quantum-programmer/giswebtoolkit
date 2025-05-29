/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Маппер для адресной базы                      *
 *                                                                  *
 *******************************************************************/

import { ServiceResponse } from '~/services/Utils/Types';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import CommonService from '~/services/RequestServices/common/CommonService';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { SimpleJson } from '~/types/CommonTypes';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GeoPoint from '~/geo/GeoPoint';
import GwtkMapper from './GwtkMapper';
import VectorLayer from '~/maplayers/VectorLayer';

type RequestParams = {
    filter: string;
    results?: string;
    skip?: string;
    Coord_B?: string;
    Coord_L?: string;
    _: string;
};

/**
 * Класс поиска на сервисе
 * @class PanoramaAddressBaseMapper
 * @extends GwtkMapper
 */
export default class PanoramaAddressBaseMapper extends GwtkMapper<RequestParams> {
    /**
     * @constructor PanoramaAddressBaseMapper
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param requestService {RestService} Сервис запросов
     */
    constructor( vectorLayer: VectorLayer, requestService: CommonService ) {
        super( vectorLayer, requestService.commonGet.bind( requestService ) );
    }

    protected prepareRequestParams( criteriaAggregators: CriteriaAggregator[] ): RequestParams {
        let results, skip, filter = '';
        // параметры поиска для каждого слоя карты, где поиск выполняется
        for ( let i = 0; i < criteriaAggregators.length; i++ ) {

            const criteriaAggregator = criteriaAggregators[ i ];
            const numericCount = criteriaAggregator.getCriterionContent( SearchCriterionName.Count );
            results = (numericCount !== undefined) ? ('' + Math.min( numericCount, 50 )) : undefined;

            const numericStartIndex = criteriaAggregator.getCriterionContent( SearchCriterionName.StartIndex );
            skip = (numericStartIndex !== undefined) ? ('' + numericStartIndex) : undefined;

            const semanticFilter = criteriaAggregator.getCriterionContent( SearchCriterionName.Text );
            filter = semanticFilter ? GwtkMapper.getSearchText( semanticFilter.semanticCriterionList ) : '';
        }
        return { results, skip, filter, _: '' + Date.now() };
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
                    const mapObject = new MapObject( this.vectorLayer, MapObjectType.Point,{
                        name: feature.GeoObject.metaDataProperty.GeocoderMetaData.text,
                        id: 'addressbase.' + (i + 1)
                    } );
                    mapObject.addSemantic( {
                        key: 'name',
                        value: feature.GeoObject.metaDataProperty.GeocoderMetaData.text,
                        name:  this.vectorLayer.map.translate('Name')
                    } );

                    mapObject.addGeoPoint( new GeoPoint( parseFloat( point[ 0 ] ), parseFloat( point[ 1 ] ), parseFloat( point[ 2 ] || 0 ) ) );

                    mapObjects.push( mapObject );

                }
            }
        }
        return { mapObjects, foundObjectCount };
    }
}

