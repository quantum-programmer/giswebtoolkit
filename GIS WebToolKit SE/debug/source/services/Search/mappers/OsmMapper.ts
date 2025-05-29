/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Маппер для Osm                            *
 *                                                                  *
 *******************************************************************/

import { ServiceResponse } from '~/services/Utils/Types';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GeoPoint from '~/geo/GeoPoint';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import CommonService from '~/services/RequestServices/common/CommonService';
import { SimpleJson } from '~/types/CommonTypes';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import GwtkMapper from './GwtkMapper';
import VectorLayer from '~/maplayers/VectorLayer';


type RequestParams = {
    q: string;
    format?: 'json' | 'xml';
    limit?: string;
    bounded?: '0' | '1';
    viewbox?: string;
}

/**
 * Класс поиска на сервисе OSM
 * @class OsmMapper
 * @extends GwtkMapper
 */
export default class OsmMapper extends GwtkMapper<RequestParams> {
    /**
     * @constructor OsmMapper
     * @param vectorLayer {VectorLayer} Слой для объектов
     * @param requestService {RestService} Сервис запросов
     */
    constructor( vectorLayer: VectorLayer, requestService: CommonService ) {
        super( vectorLayer, requestService.commonGet.bind( requestService ) );
    }

    protected prepareRequestParams( criteriaAggregators: CriteriaAggregator[] ): RequestParams {
        let limit, q = '';
        // параметры поиска для каждого слоя карты, где поиск выполняется
        for ( let i = 0; i < criteriaAggregators.length; i++ ) {

            const criteriaAggregator = criteriaAggregators[ i ];
            const numericCount = criteriaAggregator.getCriterionContent( SearchCriterionName.Count );
            limit = (numericCount !== undefined) ? ('' + Math.min( numericCount, 50 )) : undefined;

            const semanticFilter = criteriaAggregator.getCriterionContent( SearchCriterionName.Text );
            q = semanticFilter ? GwtkMapper.getSearchText( semanticFilter.semanticCriterionList ) : '';
        }

        return { q, limit, format: 'json' };
    }

    protected onDataLoaded( results: ServiceResponse<SimpleJson<any>> ) {

        const mapObjects = [];
        let foundObjectCount = 0;
        if ( !results.error && results.data ) {
            const featureCollection = results.data;
            foundObjectCount = featureCollection.length;
            for ( let i = 0; i < featureCollection.length; i++ ) {
                const feature = featureCollection[ i ];

                const mapObject = new MapObject( this.vectorLayer, MapObjectType.Point, {
                    id: 'osmobject.' + (i + 1),
                    layer: feature.class,
                    code: 0,
                    layerid: '' + feature.type,
                    mapid: '',
                    name: feature.display_name,
                    schema: ''
                } );

                mapObject.addSemantic( { key: 'osm_id', value: feature.osm_id + '', name: 'Идентификатор OSM' } );
                mapObject.addSemantic( { key: 'osm_type', value: feature.osm_type, name: 'Тип' } );
                mapObject.addSemantic( { key: 'licence', value: feature.licence, name: 'Лицензия' } );

                mapObject.addGeoPoint( new GeoPoint( parseFloat( feature.lon ), parseFloat( feature.lat ) ) );

                mapObjects.push( mapObject );

            }
        }
        return { mapObjects, foundObjectCount };
    }
}

