/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Базовый класс критерия поиска                   *
 *                                                                  *
 *******************************************************************/

import {
    SemanticSearchCriterionType,
    StringForSearchInResultType,
    TextSearchCriterionType
} from '~/services/Search/criteria/SemanticSearchCriterion';
import { NumericCriterionName, NumericSearchCriterionType } from '~/services/Search/criteria/NumericSearchCriterion';
import { LayerIdSearchCriterionType } from '~/services/Search/criteria/LayerIdSearchCriterion';
import {
    StringArrayCriterionName,
    StringArraySearchCriterionType
} from '~/services/Search/criteria/StringArraySearchCriterion';
import {
    AreaCenterSearchCriterionType,
    BboxSearchCriterionType,
    SrsNameSearchCriterionType,
    FrameCenterSearchCriterionType,
    ObjectCenterSearchCriterionType,
    OutTypeCenterSearchCriterionType,
    LatLongSearchCriterionType,
    FindInPointSearchCriterionType,
    GetGraphObjectsCriterionType,
    MetricCriterionType,
    FindDirectionCriterionType,
    SemSortKeyType,
    SortKeyType
} from '~/services/Search/criteria/AdditionalSearchCriterion';
import {
    CrossMethodSearchCriterionType,
    FileDataSearchCriterionType
} from '~/services/Search/criteria/AreaSearchCreterion';
import { MeasureSearchCriterionType } from '~/services/Search/criteria/MeasureSearchCriterion';
import {LayerTypeSearchCriterionType} from '~/services/Search/criteria/LayerTypeSearchCriterion';

export type SearchCriterionData =
    AreaCenterSearchCriterionType
    | BboxSearchCriterionType
    | FindInPointSearchCriterionType
    | FrameCenterSearchCriterionType
    | GetGraphObjectsCriterionType
    | LatLongSearchCriterionType
    | FindDirectionCriterionType
    | SemSortKeyType
    | SortKeyType
    | LayerIdSearchCriterionType
    | NumericSearchCriterionType<NumericCriterionName>
    | ObjectCenterSearchCriterionType
    | OutTypeCenterSearchCriterionType
    | SemanticSearchCriterionType
    | SrsNameSearchCriterionType
    | StringArraySearchCriterionType<StringArrayCriterionName>
    | TextSearchCriterionType
    | CrossMethodSearchCriterionType
    | FileDataSearchCriterionType
    | MetricCriterionType
    | MeasureSearchCriterionType
    | StringForSearchInResultType
    | LayerTypeSearchCriterionType;

export enum SearchCriterionName {
    Area = 'Area',
    Bbox = 'Bbox',
    CodeList = 'CodeList',
    Count = 'Count',
    CrossMethod = 'CrossMethod',
    FileData = 'FileData',
    FindInPoint = 'FindInPoint',
    Frame = 'Frame',
    GetGraphObjects = 'GetGraphObjects',
    IdList = 'IdList',
    KeyList = 'KeyList',
    LatLong = 'LatLong',
    LayerId = 'LayerId',
    Metric = 'Metric',
    MultyLevelGeometry = 'MultyLevelGeometry',
    ObjectCenter = 'ObjectCenter',
    ObjectLocal = 'ObjectLocal',
    ObjectScale = 'ObjectScale',
    OutType = 'OutType',
    Semantic = 'Semantic',
    SrsName = 'SrsName',
    StartIndex = 'StartIndex',
    Text = 'Text',
    TypeNames = 'TypeNames',
    MeasureFilter = 'MeasureFilter',
    PersistentSemanticFilter = 'Filter',
    SemList = 'SemList',
    FindDirection = 'FindDirection',
    SemSortKey = 'SemSortKey',
    SortKey = 'SortKey',
    StringForSearchInResult = 'StringForSearchInResult',
    LayerType = 'LayerType'
}

/**
 * Базовый класс критерия поиска
 * @abstract
 * @class BaseSearchCriterion
 */
export abstract class BaseSearchCriterion<T extends SearchCriterionData> {

    abstract name: T['name'];

    /**
     * Получить содержимое критерия
     * @abstract
     * @method getContent
     * @return {object} Содержимое критерия
     */
    abstract getContent(): T['data'];

    /**
     * Объединить с критерием
     * @abstract
     * @method join
     * @param criteria {BaseSearchCriterion} Критерий для объединения с текущим
     * @return {BaseSearchCriterion} Объединенный критерий
     */
    abstract join( criteria: BaseSearchCriterion<T> ): BaseSearchCriterion<T>;

    /**
     * Получить копию критерия
     * @abstract
     * @method copy
     * @return {BaseSearchCriterion} Объединенный критерий
     */
    abstract copy(): BaseSearchCriterion<T>;

    /**
     * Сравнить критерии
     * @abstract
     * @method equals
     * @param other {BaseSearchCriterion} Критерий для сравнения
     * @return {boolean} Результат
     */
    abstract equals( other: BaseSearchCriterion<T> ): boolean;
}

