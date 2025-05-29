/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Маппер для Nspd                           *
 *                                                                  *
 *******************************************************************/

import GwtkMapper, { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';

import { ServiceResponse } from '~/services/Utils/Types';
import CriteriaAggregator from '../../CriteriaAggregator';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import CommonService from '~/services/RequestServices/common/CommonService';
import { SearchCriterionName } from '../../criteria/BaseSearchCriterion';
import i18n from '@/plugins/i18n';
import { NspdRequestParams, NspdSearchTextFeature } from './Types';
import { FeatureSemanticItem, FeatureType } from '~/utils/GeoJSON';
import { SemanticCriterion, SemanticOperator } from '../../criteria/SemanticSearchCriterion';


/**
 * Класс поиска на сервисе НСПД
 * @class NspdMapper
 * @extends GwtkMapper
 */
export default class NspdMapper extends GwtkMapper {

    requestService;

    semanticKeys: { [key: string]: string } = {
        cad_num: 'KADNUM',
        cad_number: 'KADNUM',
        cost_index: 'CADSPECIF',
        cost_value: 'CADPRICE',
        determination_couse: 'DOCUMENT',
        land_record_category_type: 'ASSIGNME',
        land_record_reg_date: 'DATE_CREATE',
        land_record_subtype: 'PARCELS',
        land_record_type: 'S_PLOT',
        ownership_type: 'PROP_FORM',
        permitted_use_established_by_document: 'ALLOWED_USE',
        quarter_cad_number: 'KADNUM_K',
        readable_address: 'ADDRESS',
        specified_area: 'AREADOC',
        status: 'STATUS_REALITY',
        build_record_area: 'AREADOC',
        build_record_registration_date: 'DATE_CREATE',
        build_record_type_value: 'TYPE_REALTY',
        cultural_heritage_val: 'CULTURAL',
        floors: 'FLOOR_NUMB',
        materials: 'MATERIAL10',
        permitted_use_name: 'USE_PERMITTED',
        purpose: 'dAss_b',
        underground_floors: 'BASELEMENT',
        united_cad_numbers: 'KN_COMPLEX',
        year_built: 'EDNCONSTRUCTION',
        year_commisioning: 'COMMISSIONING',
        cad_num_ko: 'KN_OKRUG',
        cad_num_kr: 'Cadastral_distr',
        guid: 'ObjectGUID',
        brd_nmb: 'EXTRACT_N',
        date_cr: 'EXTRACT_D',
        reg_code: 'PART_NUMB',
        reg_num: 'CULT_NUM',
        REGION_KEY: 'REGION',
        built_up_area: 'AREADOC',
        degree_readiness: 'READINESS',
        facility_cad_number: 'KADNUM_FAC',
        registration_date: 'DATE_CREATE',
        right_type: 'PROP_FORM',
        type_value: 'TYPE_REALTY',
        address_readable_address: 'ADDRESS',
        cost_registration_date: 'DATE_CREATE',
        object_type_value: 'TYPE_REALTY',
        params_area: 'AREADOC',
        params_floors: 'FLOOR_NUMB',
        params_purpose: 'dAss_b',
        params_underground_floors: 'BASELEMENT',
        params_year_built: 'EDNCONSTRUCTION',
        params_year_commisioning: 'COMMISSIONING',
        doc_date: 'DATE_CREATE',
        doc_gov: 'SCHEMEORG',
        doc_guid: 'ObjectGUID',
        kvartal_id: 'KN_SOURSE',
        region_key: 'REGION',
        shape_area: 'AREADOC',
        utilization: 'PURPOSE',
        document_name: 'SURVEY_BOUND',
        document_date: 'PMDATE',
        area: 'AREADOC',
        document_number: 'PMNUMB',
        land_use_text: 'EXTRA',
        nominal_number: 'SurveyProjectNum',
        cadastral_district: 'Cadastral_distr',
        content_restrict_encumbrances: 'RESTRICT_TEXT',
        legal_act_document_issuer: 'CULT_ORGAN',
        legal_act_document_name: 'CULT_DECISION',
        legal_act_document_number: 'PART_NUMB',
        name_by_doc: 'NameZone',
        reg_numb_border: 'CULT_NUM',
        type_boundary_value: 'ZONE_T'
    };

    constructor(vectorLayer: VectorLayer, requestService: CommonService) {
        super(vectorLayer, requestService.commonGet.bind(requestService));
        this.requestService = requestService;
    }


    protected onDataLoaded(results: ServiceResponse<NspdSearchTextFeature>): GwtkMapperResult {
        const mapObjects: MapObject[] = [];
        let foundObjectCount = 0;

        if (!results.error && results.data) {
            const featureCollection = results.data.data.features;
            foundObjectCount = featureCollection.length;

            for (let i = 0; i < foundObjectCount; i++) {

                const item = featureCollection[i];

                const semantics: FeatureSemanticItem[] = [];

                for (let semanticName in item.properties.options) {

                    const key = this.semanticKeys[semanticName];
                    const index = semantics.findIndex((item) => (item.key === key) && (item.value !== '-'));
                    if (key && index === -1) {
                        semantics.push({
                            key: key,
                            name: i18n.tc('nspd.' + semanticName),
                            value: item.properties.options[semanticName] as string || '-'
                        });
                    }
                }

                semantics.push({
                    key: 'category',
                    name: item.properties.categoryName,
                    value: item.properties.category + ''
                });

                const mapObject = new MapObject(this.vectorLayer, MapObjectType.Undefined, {
                    id: '' + item.id,
                    code: 0,
                    mapid: '',
                    name: item.properties.categoryName,
                    schema: '',
                    topscale: 17062,
                    semantics
                });

                mapObject.updateGeometryFromJSON(item as FeatureType);
                mapObjects.push(mapObject);
            }
        }

        return { mapObjects, foundObjectCount };
    }

    protected prepareRequestParams(criteriaAggregators: CriteriaAggregator[]): NspdRequestParams {
        let query = '';
        let type = '';

        for (let i = 0; i < criteriaAggregators.length; i++) {
            const criteriaAggregator = criteriaAggregators[i];

            const semanticFilter = criteriaAggregator.getCriterionContent(SearchCriterionName.Text);
            if (semanticFilter) {
                query = GwtkMapper.getSearchText(semanticFilter.semanticCriterionList);
                type = NspdMapper.getTypeNspdObject(semanticFilter.semanticCriterionList);
            }
        }

        return { query, thematicSearchId: Number(type) };
    }


    protected static getTypeNspdObject(semanticCriterionList: SemanticCriterion[]): string {
        let result = '';
        if (semanticCriterionList[1] && semanticCriterionList[1].operator === SemanticOperator.ContainsValue) {
            result = semanticCriterionList[1].value;
        }
        return result;
    }

}