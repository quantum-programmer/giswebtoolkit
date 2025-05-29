import { ServiceResponse } from '~/services/Utils/Types';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';
import { FeatureSemanticItem } from '~/utils/GeoJSON';


export type RosCadNumber = string;
export type RosCoords = string;
export type RosText = string;
export type SearcherText = RosCadNumber | RosCoords | RosText

export type RosreestrRequestParams = {
    text: string;
    tolerance: string; // 0 необходим для вывода координат
    limit?: string;
    typeRosreestrObject: string;
    rosreestrType: string;
}

/**
 * Описание структуры ответа на запрос, где указываем параметр "text"
 * https://pkk.rosreestr.ru/api/features/5?text=55.73920643640676,37.69633219131255&tolerance=1&limit=11
 */
export interface RosreestrSearchTextFeature {
    attrs: {
        name: string;
        cn: string;
        id: string;
        adate: string;
        address: string;
        application_date: string;
        area_unit: '055';
        area_value: string;
        brd_id:string;
        cad_cost: number;
        cad_unit: '383';
        category_type: string;
        cc_date_approval: string;
        cc_date_entering: string;
        children: string;
        date_cost: string;
        date_create: string;
        fp: string;
        is_big: boolean;
        kvartal: string;
        kvartal_cn: string;
        parcel_build: false;
        parcel_build_attrs: string;
        parcel_type: string;
        rifr: string;
        rifr_cnt: string;
        rifr_dep: string;
        rifr_dep_info: string;
        sale: string;
        sale_cnt: string;
        sale_date: string;
        sale_dep: string;
        sale_dep_uo: string;
        sale_doc_date: string;
        sale_doc_num: string;
        sale_doc_type: string;
        sale_price: string;
        statecd: '01' | '03' | '04' | '05' | '06' | '07' | '08' | '00';
        util_by_doc: string;
        util_code: string;
        oks_type: 'building' | 'construction';
        area_type: '009';
        elements_constuct: [{ wall: string; wall_text: string; }];
        name_zone: string;
        type: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '17' | '18' | '19' | '20';
        purpose: '204001000000' | '204002000000' | '204003000000' | '204005000000' | '204006000000';
        cdzone: '218020010001' | '218020010002' | '218020010003' | '218020010004' | '218020010005' | '218020010006' | '218020020001' | '218020020201' | '218020020203' | '218020020002' | '218020020003' | '218020020004' | '218020020005' | '218020020006' | '218020020007' | '218020020008' | '218020020202' | '218020030001' | '218020030002' | '218020030003' | '218020030004' | '218020030005' | '218020030006' | '218020030007' | '218020030008' | '218020040001' | '218020040002' | '218020040003' | '218020040004' | '218020040005' | '218020040006' | '218020040007' | '218020040008' | '218020050001';
        subtype: '218010000000' | '218010010000' | '218010020000' | '218010030000' | '218010040000' | '218010050000' | '218010060000' | '218010070000' | '218010080000' | '218010090000' | '218020000000' | '218020010000' | '218020020000' | '218020030000' | '218020040000' | '218020050000';
        content_restrictions: string;
        number_zone: string;
        reestr_number_id: string;
        acnum: string;
        rayon_cn: string;
        zone_kind: string;
        desc: string;
    };
    center: {
        x: number;
        y: number;
    };
    stat: {
        rayon: { total: number, geo: number };
        kvartal: { total: number, geo: number };
        parcel: { total: number, geo: number };
        oks: { total: number, geo: number };
    };
    extent: {
        xmax: number;
        xmin: number;
        ymax: number;
        ymin: number;
    };
    sort: number;
    type: RosreestrQueryType;
}

/**
 * Описание структуры ответа на запрос
 * где НЕ указываем параметр "text"
 * получаем описание семантик объекта
 * https://pkk.rosreestr.ru/api/features/5/77:1:6043:1023
 */


export interface RosreestrItemInfo {
    attrs: {
        name: string;
        cn: string;
        id: string;
        adate: string;
        address: string;
        application_date: string;
        area_unit: string;
        area_value: string;
        cad_cost: number;
        cad_unit: string;
        category_type: string;
        cc_date_approval: string;
        cc_date_entering: string;
        children: string;
        date_cost: string;
        date_create: string;
        fp: string;
        is_big: boolean;
        kvartal: string;
        kvartal_cn: string;
        parcel_build: false;
        parcel_build_attrs: string;
        parcel_type: string;
        rifr: string;
        rifr_cnt: string;
        rifr_dep: string;
        rifr_dep_info: string;
        sale: string;
        sale_cnt: string;
        sale_date: string;
        sale_dep: string;
        sale_dep_uo: string;
        sale_doc_date: string;
        sale_doc_num: string;
        sale_doc_type: string;
        sale_price: string;
        statecd: string;
        util_by_doc: string;
        util_code: string;
        oks_type: string;
        area_type: string;
        elements_constuct: [{ wall: string; wall_text: string; }];
    };
    center?: {
        x: number;
        y: number;
    };
    extent: {
        xmax: number;
        xmin: number;
        ymax: number;
        ymin: number;
    };
    sort: number;
    type: RosreestrQueryType;
}

/**
 * Возможно без координат
 */
export type RosreestrInfoItems = RosreestrItemInfo[];

export type RosreestrSearchTextResponse = {
    features: RosreestrSearchTextFeature[];
    total: number;
    total_relation: string;
};

export type RosreestrInfoResponse = {
    feature: RosreestrSearchTextFeature;
    total: number;
    total_relation: string;
};

export type RosreestrFeatureSemanticItem = {
    feature: FeatureSemanticItem;
    order: number;
}

export type RosreestrLoadedData = ServiceResponse<RosreestrSearchTextFeature[]>
