import {
    RosCadNumber,
    RosreestrInfoResponse,
    RosreestrSearchTextFeature,
    RosreestrLoadedData,
    RosreestrRequestParams,
    RosreestrSearchTextResponse,
    RosreestrFeatureSemanticItem
} from '~/services/Search/mappers/RosreestrMapper/Types';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';
import axios from 'axios';
import DICTIONARY from './dictionary.json';
import { FeatureSemanticItem } from '~/utils/GeoJSON';


export default abstract class RosreestrSearcherBase<SearchResult = RosreestrLoadedData> {

    protected text: RosCadNumber = '';

    protected baseUrl: string = '';

    protected params: RosreestrRequestParams;
    protected fullSearch!: boolean;

    constructor(text: RosCadNumber, baseUrl: string, params: RosreestrRequestParams, fullSearch: boolean ) {
        this.text = text;
        this.baseUrl = baseUrl;
        this.params = params;
        this.fullSearch = fullSearch;
    }

    public abstract search(): Promise<SearchResult>;

    protected fixLastSlash(url: string): string {
        const lastIndexOf = url.lastIndexOf('/');
        if (lastIndexOf !== (url.length - 1)) {
            url += '/';
        }
        return url;
    }

    /**
     * После получения идентификатора нам надо получить описание объекта
     * Все семантики которые имеются у объекта
     * @param type
     * @param cadNumber
     * @private
     */
    protected getUrlForAdditionalInfo(type: RosreestrQueryType, cadNumber: string): string {
        const url = this.fixLastSlash(this.baseUrl);
        return `${url}${type}/${cadNumber}`;
    }

    /**
     * Получаем URL адрес для запроса информации по объекту
     * Возвращается информация с идентификатором объекта в системе
     * Далее выполняем запрос по идентификатору для получения
     * описания семантик объекта их системы
     * @param type {RosreestrQueryType}
     * @param cadNumber {string}
     * @param params {RosreestrRequestParams}
     * @private
     */
    protected getUrlForIds(type: RosreestrQueryType, cadNumber: string, params: RosreestrRequestParams): string {
        const url = this.fixLastSlash(this.baseUrl);
        return `${url}${type}?&text=${cadNumber}&tolerance=${params.tolerance}&limit=${params.limit}`;
        //return `${url}?text=${cadNumber}&tolerance=${params.tolerance}&limit=${params.limit}&types=[${type}]`;
    }

    protected async fetchIds(type: RosreestrQueryType, cadNumber: string, params: RosreestrRequestParams): Promise<RosreestrSearchTextResponse | undefined> {
        const url = this.getUrlForIds(type, cadNumber, params);
        const result = await axios.get<RosreestrSearchTextResponse>(url);
        if (result) {
            return result.data;
        }
    }

    async fetchData(type: RosreestrQueryType, text: string, params: RosreestrRequestParams): Promise<RosreestrLoadedData> {
        if (params.rosreestrType && params.rosreestrType.split(',').indexOf(type.toString()) === -1) {
            return { data: [] };
        }

        const data = await this.fetchIds(type, text, params);
        if (data) {
            return { data: data.features };
        }
        return { data: [] };
    }


    async fetchDetailedData(type: RosreestrQueryType, text: string, params: RosreestrRequestParams): Promise<RosreestrLoadedData> {
        if (params.rosreestrType && params.rosreestrType.split(',').indexOf(type.toString()) === -1) {
            return { data: [] };
        }
        const data = await this.fetchIds(type, text, params);
        if (data) {
            const result: RosreestrSearchTextFeature[] = [];
            for await (const k of this.execQueries(data)) {
                if (k.data.feature.center) {
                    result.push(k.data.feature);
                }
            }
            return { data: result };
        }
        return { data: [] };
    }


    /**
     * Выполнить запрос для получения описания семантик объектов
     * !!! Получаем объект features
     * @param results
     */
    async* execQueries(results: RosreestrSearchTextResponse) {
        for (const item of results.features) {
            const url = this.getUrlForAdditionalInfo(item.type, item.attrs.id);
            yield axios.get<RosreestrInfoResponse>(url);
        }
    }

    public getMapObjectSemantics(item: RosreestrSearchTextFeature): FeatureSemanticItem[] {
        const result: FeatureSemanticItem[] = [];
        const rosreestrResult: RosreestrFeatureSemanticItem[] = [];

        // Поля для отображения на форме
        type VisibleFields = {
            [key: string]: number;
        };

        const visible_fields_FREE: VisibleFields = {
            'cn': 1,                          // Кадастровый номер
        };

        const visible_fields_LAND_DISTRICT: VisibleFields = {
            'cn': 2,                          // Кадастровый номер
            'name': 1
        };
        const visible_fields_LAND_AREA: VisibleFields = {
            'cn': 2,                          // Кадастровый номер
            'name': 1,
            'okrug_cn': 3
        };
        const visible_fields_LAND_QUARTER: VisibleFields = {
            'cn': 2,                          // Кадастровый номер
            'name': 1,
            'rayon_cn': 3
        };
        const visible_fields_LAND_LOT: VisibleFields = {
            'cn': 1,                            // Кадастровый номер
            'kvartal_cn': 2,                    // Кадастровый номер квартала
            'address': 3,                       // Адрес
            'area_value': 4,                    // Площадь
            // 'area_type': 4,                  // Тип площади
            // 'area_unit', 4,                  // Единицы измерения площади
            'statecd': 5,                       // Статус
            'category_type': 6,                 // Категория земель
            'util_code': 7,                     // Разрешенное использование
            'util_by_doc': 8,                   // Разрешенное использование по документу
            // 'fp': 9,                            // Форма собственности
            'cad_cost': 10,                     // Кадастровая стоимость
            // 'cad_unit: 10,                   // Единицы измерения кадастровой стоимости
            'date_cost': 11,                    // Дата внесения кадастровой стоимости
            'cc_date_approval': 12,             // Дата утверждения категории земель
            'cc_date_entering': 13,
            'application_date': 14,
            'parcel_build_attrs': 50,
            // 'parcel_type',
            // 'parcel_build',
            'rifr': 50,                       // Свободен от прав третьих лиц
            'rifr_cnt': 50,                   // Контактное лицо
            'rifr_dep': 50,                   //  Орган власти
            'rifr_dep_info': 50,
            'sale': 50,                       // Принято решение о проведении торгов
            'sale_cnt': 50,                   // Контактное лицо
            'sale_date': 50,                  // Дата проведения торгов
            'sale_dep': 50,                   // Орган власти
            'sale_dep_uo': 50,
            'sale_doc_date': 50,
            'sale_doc_num': 50,
            'sale_doc_type': 50,
            'sale_price': 50,                 // Начальная цена
            'children': 50,
            // 'is_big'
        };

        const visible_fields_CCO: VisibleFields = {
            'oks_type': 1,                     // Вид ОКС
            'cn': 2,                            // Кадастровый номер
            'kvartal_cn': 3,                    // Кадастровый номер квартала
            'address': 4,                       // Адрес
            'name': 5,
            'purpose': 6,                       // Назначение
            'area_value': 7,                    // Площадь
            // 'area_type': 7,                  // Тип площади
            // 'area_unit', 7,                  // Единицы измерения площади
            'statecd': 8,                       // Статус
            'util_by_doc': 9,                   // Разрешенное использование по документу
            'util_code': 10,                    // Разрешенное использование
            // 'fp',                            // Форма собственности
            'cad_cost': 11,                     // Кадастровая стоимость
            // 'cad_unit': 11                   // Единицы измерения стоимости
            'date_cost': 12,                    // Дата внесения кадастровой стоимости
            'cc_date_approval': 13,             // Дата утверждения земель
            'cc_date_entering': 14,
            'application_date': 15,
            'floors': 16,                       // Количество этажей
            'underground_floors': 17,           // Количество подземных этажей
            'elements_constuct': 18,            // Элементы конструкции
            'year_built': 19,                   // Завершение строительства
            'year_used': 20                     // Ввод в эксплуатацю
        };

        const visible_fields_BOUNDARY: VisibleFields = {
            'type': 1,
            'number_zone': 2,
            'reestr_number_id': 3,
            'name': 4,
            'desc': 5,
            'brd_id': 6
        };

        const visible_fields_ZONE: VisibleFields = {
            'subtype': 1,
            'cdzone': 2,
            'number_zone': 3,
            'acnum': 4,
            'rayon_cn': 5,
            'name_zone': 6,
            'desc': 7,
            'content_restrictions': 8,
            'zone_kind': 9
        };

        let visible_fields: VisibleFields;
        switch (item['type']) {
            case RosreestrQueryType.CCO:
                visible_fields = visible_fields_CCO;
                break;
            case RosreestrQueryType.LAND_LOT:
                visible_fields = visible_fields_LAND_LOT;
                break;
            case RosreestrQueryType.LAND_QUARTER:
                visible_fields = visible_fields_LAND_QUARTER;
                break;
            case RosreestrQueryType.LAND_AREA:
                visible_fields = visible_fields_LAND_AREA;
                break;
            case RosreestrQueryType.LAND_DISTRICT:
                visible_fields = visible_fields_LAND_DISTRICT;
                break;
            case RosreestrQueryType.BOUNDARY:
                visible_fields = visible_fields_BOUNDARY;
                break;
            case RosreestrQueryType.USE_RESTRICTED_ZONE:
            case RosreestrQueryType.TERRITORIAL_AREA:
            case RosreestrQueryType.FORESTRY:
            case RosreestrQueryType.SPECIALLY_NATURAL_AREA:
            case RosreestrQueryType.FREE_ECONOMIC_ZONE:
                visible_fields = visible_fields_ZONE;
                break;
            default:
                visible_fields = visible_fields_FREE;
        }

        let attrKey: keyof typeof item.attrs;
        for (attrKey in item.attrs) {
            if (visible_fields[attrKey]) {
                let value: string;
                const currentValue = item.attrs[attrKey] as keyof typeof DICTIONARY;
                switch (attrKey) {
                    case 'statecd':
                    case 'oks_type':
                    case 'area_type':
                    case 'category_type':
                    case 'type':    // границы
                    case 'purpose': // Назначение
                    case 'cdzone':  // вид зоны
                    case 'subtype': // тип зоны
                        value = DICTIONARY[currentValue] || currentValue;
                        break;
                    case 'area_value':
                        value = currentValue + ' ' + (DICTIONARY[item.attrs.area_unit] || '');
                        break;
                    case 'cad_cost':
                        const unit = DICTIONARY[item.attrs.cad_unit] ? ` ${DICTIONARY[item.attrs.cad_unit]}.` : '';
                        value = currentValue + unit;
                        break;
                    case 'is_big':
                        value = currentValue ? '1' : '0';
                        break;
                    case 'parcel_build':
                        value = currentValue ? '1' : '0';
                        break;
                    case 'elements_constuct':
                        if (item.attrs[attrKey] && item.attrs[attrKey].length > 0) {
                            value = item.attrs[attrKey][0].wall_text || '';
                        } else {
                            value = '';
                        }
                        break;
                    default:
                        value = item.attrs[attrKey];
                }


                if (value) {
                    let order: number = visible_fields[attrKey];
                    let name: string = attrKey;
                    if (attrKey in DICTIONARY) {
                        name = DICTIONARY[attrKey as keyof typeof DICTIONARY];
                    }
                    switch (attrKey) {
                        case 'area_value':
                            name = DICTIONARY[item.attrs['area_type'] as keyof typeof DICTIONARY];
                            break;
                    }
                    rosreestrResult.push({
                        feature: {
                            key: attrKey,
                            name,
                            value
                        },
                        order: order
                    });
                }
            }

        }
        let key: keyof typeof item.stat;
        for (key in item.stat) {

            const value = item.stat[key];
            if (value) {
                rosreestrResult.push({
                    feature: {
                        key: key,
                        name: DICTIONARY[key] || key,
                        value: `${value.total} (${DICTIONARY['total']}), ${value.geo} (${DICTIONARY['with borders']})`
                    },
                    order: 100,
                });
            }
        }

        // Сортировать массив семантических характеристик
        rosreestrResult.sort((a: RosreestrFeatureSemanticItem, b: RosreestrFeatureSemanticItem) => {
            return a.order - b.order;
        });

        for (let i = 0; i < rosreestrResult.length; i++) {
            result.push(rosreestrResult[i].feature);
        }
        return result;
    }

}
