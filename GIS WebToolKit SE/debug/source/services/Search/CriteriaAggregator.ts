/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Агрегатор критериев                       *
 *                                                                  *
 *******************************************************************/

import {
    BaseSearchCriterion,
    SearchCriterionData,
    SearchCriterionName
} from '~/services/Search/criteria/BaseSearchCriterion';
import {LayerIdSearchCriterion, LayerIdSearchCriterionType} from '~/services/Search/criteria/LayerIdSearchCriterion';
import {
    SemanticCriterion,
    SemanticSearchCriterion,
    SemanticSearchCriterionType,
    StringForSearchInResultCriterion,
    StringForSearchInResultType,
    TextSearchCriterion,
    TextSearchCriterionType
} from '~/services/Search/criteria/SemanticSearchCriterion';
import {
    CountSearchCriterion,
    MultiLevelGeometrySearchCriterion,
    NumericCriterionName,
    NumericSearchCriterionType,
    ObjectScaleSearchCriterion,
    StartIndexSearchCriterion
} from '~/services/Search/criteria/NumericSearchCriterion';
import {
    CodeListSearchCriterion,
    IdListSearchCriterion,
    KeyListSearchCriterion,
    ObjectLocalSearchCriterion,
    SemListSearchCriterion,
    StringArrayCriterionName,
    StringArraySearchCriterionType,
    TypeNamesSearchCriterion
} from '~/services/Search/criteria/StringArraySearchCriterion';
import {
    AreaCenterSearchCriterionType,
    BboxSearchCriterion,
    BboxSearchCriterionType,
    FindInPointSearchCriterion,
    FindInPointSearchCriterionType,
    FrameCenterSearchCriterionType,
    GetGraphObjectsCriterion,
    GetGraphObjectsCriterionType,
    LatLongSearchCriterionType,
    MetricCriterion,
    MetricCriterionType,
    ObjectCenterSearchCriterionType,
    OutTypeCenterSearchCriterionType,
    SrsNameSearchCriterion,
    SrsNameSearchCriterionType,
    FindDirectionCriterionType,
    FindDirectionCriterion,
    SemSortKey,
    SortKey
} from '~/services/Search/criteria/AdditionalSearchCriterion';
import {SimpleJson} from '~/types/CommonTypes';
import {
    CrossMethodSearchCriterion,
    CrossMethodSearchCriterionType,
    FileDataSearchCriterion,
    FileDataSearchCriterionType
} from '~/services/Search/criteria/AreaSearchCreterion';
import {MeasureSearchCriterion, MeasureSearchCriterionType} from '~/services/Search/criteria/MeasureSearchCriterion';
import {
    LayerTypeSearchCriterion,
    LayerTypeSearchCriterionType
} from '~/services/Search/criteria/LayerTypeSearchCriterion';

type CriterionDataType<K> =
    K extends AreaCenterSearchCriterionType['name'] ? AreaCenterSearchCriterionType['data'] :
    K extends BboxSearchCriterionType['name'] ? BboxSearchCriterionType['data'] :
    K extends FindInPointSearchCriterionType['name'] ? FindInPointSearchCriterionType['data'] :
    K extends FrameCenterSearchCriterionType['name'] ? FrameCenterSearchCriterionType['data'] :
    K extends GetGraphObjectsCriterionType['name'] ? GetGraphObjectsCriterionType['data'] :
    K extends FindDirectionCriterionType['name'] ? FindDirectionCriterionType['data'] :
    K extends SemSortKey['name'] ? SemSortKey['value'] :
    K extends SortKey['name'] ? SortKey['value'] :
    K extends MetricCriterionType['name'] ? MetricCriterionType['data'] :
    K extends LatLongSearchCriterionType['name'] ? LatLongSearchCriterionType['data'] :
    K extends LayerIdSearchCriterionType['name'] ? LayerIdSearchCriterionType['data'] :
    K extends NumericSearchCriterionType<NumericCriterionName>['name'] ? NumericSearchCriterionType<NumericCriterionName>['data'] :
    K extends ObjectCenterSearchCriterionType['name'] ? ObjectCenterSearchCriterionType['data'] :
    K extends OutTypeCenterSearchCriterionType['name'] ? OutTypeCenterSearchCriterionType['data'] :
    K extends SemanticSearchCriterionType['name'] ? SemanticSearchCriterionType['data'] :
    K extends SrsNameSearchCriterionType['name'] ? SrsNameSearchCriterionType['data'] :
    K extends StringArraySearchCriterionType<StringArrayCriterionName>['name'] ? StringArraySearchCriterionType<StringArrayCriterionName>['data'] :
    K extends CrossMethodSearchCriterionType['name'] ? CrossMethodSearchCriterionType['data'] :
    K extends FileDataSearchCriterionType['name'] ? FileDataSearchCriterionType['data'] :
    K extends MeasureSearchCriterionType['name'] ? MeasureSearchCriterionType['data'] :
    K extends StringForSearchInResultType['name'] ? StringForSearchInResultType['data']:
    K extends LayerTypeSearchCriterionType['name'] ? LayerTypeSearchCriterionType['data']:
    TextSearchCriterionType['data'];

export type SemanticFilterCriterion = {
    semanticCriteria: SemanticCriterion[],
    disjunction: boolean
};

/**
 * Агрегатор критериев
 * @class CriteriaAggregator
 */
export default class CriteriaAggregator {

    private readonly defaultCriteria: BaseSearchCriterion<SearchCriterionData>[] = [];

    /**
     * Список добавленных критериев
     * @private
     * @readonly
     * @property criterionList {object}
     */
    private readonly criterionList: SimpleJson<BaseSearchCriterion<SearchCriterionData>> = {};

    /**
     * @constructor CriteriaAggregator
     * @param id {string} Идентификатор агрегатора
     * @param [defaultCriteria] {BaseSearchCriterion[]} Массив предустановленных критериев
     */
    constructor( readonly id:string, defaultCriteria?: BaseSearchCriterion<SearchCriterionData>[] ) {
        if ( defaultCriteria ) {
            for ( let i = 0; i < defaultCriteria.length; i++ ) {
                if (defaultCriteria[i].name == SearchCriterionName.Semantic) {
                    this.defaultCriteria.push(defaultCriteria[i]);
                } else {
                    this.defaultCriteria.push(defaultCriteria[i].copy());
                }
            }
        }
    }

    /**
     * Добавить критерий
     * @private
     * @method addCriterion
     * @param criterion {BaseSearchCriterion} Критерий поиска
     */
    private setCriterion<T extends BaseSearchCriterion<SearchCriterionData>>( criterion: T ) {
        return (this.criterionList[ criterion.name ] = criterion.copy()) as T;
    }

    /**
     * Получить критерий
     * @private
     * @method getCriterion
     * @param criterionName {string} Название критерия
     * @return {BaseSearchCriterion|undefined} Критерий поиска
     */
    private getCriterion<T extends BaseSearchCriterion<SearchCriterionData>>( criterionName: T['name'] ) {
        return this.criterionList[ criterionName ] ? this.criterionList[ criterionName ] as T : undefined;
    }

    /**
     * Удалить критерий
     * @private
     * @method removeCriterion
     * @param criterionName {string} Название критерия
     */
    removeCriterion( criterionName: string ) {
        delete this.criterionList[ criterionName ];
    }

    /**
     * Получить критерий поиска по границам
     * @method getBboxSearchCriterion
     * @return {BboxSearchCriterion|undefined} Критерий поиска по границам
     */
    getBboxSearchCriterion() {
        return this.getCriterion<BboxSearchCriterion>( SearchCriterionName.Bbox ) || this.setCriterion( new BboxSearchCriterion() );
    }

    /**
     * Установить критерий поиска по границам
     * @method setBboxSearchCriterion
     * @param criterion {BboxSearchCriterion} критерий поиска по границам
     */
    setBboxSearchCriterion( criterion: BboxSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий поиска по списку кодов
     * @method getCodeListSearchCriterion
     * @return {CodeListSearchCriterion|undefined} Критерий поиска по списку кодов
     */
    getCodeListSearchCriterion() {
        return this.getCriterion<CodeListSearchCriterion>( SearchCriterionName.CodeList ) || this.setCriterion( new CodeListSearchCriterion() );
    }

    /**
     * Установить критерий поиска по списку кодов
     * @method setCodeListSearchCriterion
     * @param criterion {CodeListSearchCriterion} критерий поиска по списку кодов
     */
    setCodeListSearchCriterion( criterion: CodeListSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения количества записей в ответе
     * @method getCountSearchCriterion
     * @return {CountSearchCriterion|undefined} Критерий ограничения количества записей в ответе
     */
    getCountSearchCriterion() {
        return this.getCriterion<CountSearchCriterion>( SearchCriterionName.Count ) || this.setCriterion( new CountSearchCriterion() );
    }

    /**
     * Установить критерий ограничения количества записей в ответе
     * @method setCodeListSearchCriterion
     * @param criterion {CountSearchCriterion} критерий ограничения количества записей в ответе
     */
    setCountSearchCriterion( criterion: CountSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по ключам из классификатора
     * @method getKeyListSearchCriterion
     * @return {KeyListSearchCriterion|undefined} Критерий ограничения по ключам из классификатора
     */
    getKeyListSearchCriterion() {
        return this.getCriterion<KeyListSearchCriterion>( SearchCriterionName.KeyList ) || this.setCriterion( new KeyListSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по ключам из классификатора
     * @method setKeyListSearchCriterion
     * @param criterion {KeyListSearchCriterion} критерий ограничения по ключам из классификатора
     */
    setKeyListSearchCriterion( criterion: KeyListSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по номеру объекта
     * @method getIdListSearchCriterion
     * @return {IdListSearchCriterion|undefined} Критерий ограничения по номеру объекта
     */
    getIdListSearchCriterion() {
        return this.getCriterion<IdListSearchCriterion>( SearchCriterionName.IdList ) || this.setCriterion( new IdListSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по номеру объекта
     * @method setIdListSearchCriterion
     * @param criterion {IdListSearchCriterion} критерий ограничения по номеру объекта
     */
    setIdListSearchCriterion( criterion: IdListSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по идентификатору объекта
     * @method getLayerIdSearchCriterion
     * @return {LayerIdSearchCriterion|undefined} Критерий критерий ограничения по идентификатору объекта
     */
    getLayerIdSearchCriterion() {
        return this.getCriterion<LayerIdSearchCriterion>( SearchCriterionName.LayerId ) || this.setCriterion( new LayerIdSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по идентификатору объекта
     * @method setLayerIdSearchCriterion
     * @param criterion {LayerIdSearchCriterion} критерий ограничения по идентификатору объекта
     */
    setLayerIdSearchCriterion( criterion: LayerIdSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по локализациям
     * @method getObjectLocalSearchCriterion
     * @return {ObjectLocalSearchCriterion|undefined} Критерий критерий ограничения по локализациям
     */
    getObjectLocalSearchCriterion() {
        return this.getCriterion<ObjectLocalSearchCriterion>( SearchCriterionName.ObjectLocal ) || this.setCriterion( new ObjectLocalSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по локализациям
     * @method setObjectLocalSearchCriterion
     * @param criterion {ObjectLocalSearchCriterion} критерий ограничения по локализациям
     */
    setObjectLocalSearchCriterion( criterion: ObjectLocalSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий масштаба видимости объектов
     * @method getObjectScaleSearchCriterion
     * @return {ObjectScaleSearchCriterion|undefined} Критерий масштаба видимости объектов
     */
    getObjectScaleSearchCriterion() {
        return this.getCriterion<ObjectScaleSearchCriterion>( SearchCriterionName.ObjectScale ) || this.setCriterion( new ObjectScaleSearchCriterion() );
    }

    /**
     * Установить критерий масштаба видимости объектов
     * @method setObjectScaleSearchCriterion
     * @param criterion {ObjectScaleSearchCriterion} критерий масштаба видимости объектов
     */
    setObjectScaleSearchCriterion( criterion: ObjectScaleSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий поиска в точке
     * @method getFindInPointSearchCriterion
     * @return {FindInPointSearchCriterion|undefined} Критерий поиска в точке
     */
    getFindInPointSearchCriterion() {
        return this.getCriterion<FindInPointSearchCriterion>( SearchCriterionName.FindInPoint ) || this.setCriterion( new FindInPointSearchCriterion() );
    }

    /**
     * Установить критерий поиска в точке
     * @method setFindInPointSearchCriterion
     * @param criterion {FindInPointSearchCriterion} критерий поиска в точке
     */
    setFindInPointSearchCriterion( criterion: FindInPointSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий масштаба видимости объектов
     * @method getMultiLevelGeometrySearchCriterion
     * @return {MultiLevelGeometrySearchCriterion|undefined} Критерий масштаба видимости объектов
     */
    getMultiLevelGeometrySearchCriterion() {
        return this.getCriterion<MultiLevelGeometrySearchCriterion>( SearchCriterionName.MultyLevelGeometry ) || this.setCriterion( new MultiLevelGeometrySearchCriterion() );
    }

    /**
     * Установить критерий масштаба видимости объектов
     * @method setMultiLevelGeometrySearchCriterion
     * @param criterion {MultiLevelGeometrySearchCriterion} критерий масштаба видимости объектов
     */
    setMultiLevelGeometrySearchCriterion( criterion: MultiLevelGeometrySearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий поиска по семантике
     * @method getSemanticSearchCriterion
     * @return {SemanticSearchCriterion|undefined} Критерий поиска по семантике
     */
    getSemanticSearchCriterion() {
        return this.getCriterion<SemanticSearchCriterion>( SearchCriterionName.Semantic ) || this.setCriterion( new SemanticSearchCriterion() );
    }

    /**
     * Установить критерий поиска по семантике
     * @method setSemanticSearchCriterion
     * @param criterion {SemanticSearchCriterion} критерий поиска по семантике
     */
    setSemanticSearchCriterion( criterion: SemanticSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий кода системы координат
     * @method getSrsNameSearchCriterion
     * @return {SrsNameSearchCriterion|undefined} Критерий кода системы координат
     */
    getSrsNameSearchCriterion() {
        return this.getCriterion<SrsNameSearchCriterion>( SearchCriterionName.SrsName ) || this.setCriterion( new SrsNameSearchCriterion() );
    }

    /**
     * Установить критерий кода системы координат
     * @method setSrsNameSearchCriterion
     * @param criterion {SrsNameSearchCriterion} критерий кода системы координат
     */
    setSrsNameSearchCriterion( criterion: SrsNameSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий начального индекса элемента в ответе
     * @method getStartIndexSearchCriterion
     * @return {StartIndexSearchCriterion|undefined} Критерий начального индекса элемента в ответе
     */
    getStartIndexSearchCriterion() {
        return this.getCriterion<StartIndexSearchCriterion>( SearchCriterionName.StartIndex ) || this.setCriterion( new StartIndexSearchCriterion() );
    }

    /**
     * Проверка на наличие критерия начального индекса элемента в ответе
     * @method hasStartIndexCriterion
     */
    hasStartIndexCriterion() {
        return !!this.getCriterion<StartIndexSearchCriterion>( SearchCriterionName.StartIndex );
    }

    /**
     * Установить критерий начального индекса элемента в ответе
     * @method hasStartIndexCriterion
     * @param criterion {StartIndexSearchCriterion} критерий начального индекса элемента в ответе
     */
    setStartIndexSearchCriterion( criterion: StartIndexSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий текстового поиска
     * @method getTextSearchCriterion
     * @return {TextSearchCriterion|undefined} Критерий текстового поиска
     */
    getTextSearchCriterion() {
        return this.getCriterion<TextSearchCriterion>( SearchCriterionName.Text ) || this.setCriterion( new TextSearchCriterion() );
    }

    /**
     * Установить критерий текстового поиска
     * @method setTextSearchCriterion
     * @param criterion {TextSearchCriterion} критерий текстового поиска
     */
    setTextSearchCriterion( criterion: TextSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по значению семантики
     * @method getSemListSearchCriterion
     * @return {SemListSearchCriterion|undefined} Критерий ограничения по значению семантики
     */
    getSemListSearchCriterion() {
        return this.getCriterion<SemListSearchCriterion>( SearchCriterionName.SemList ) || this.setCriterion( new SemListSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по значению семантики
     * @method setSemListSearchCriterion
     * @param criterion {SemListSearchCriterion} критерий ограничения по значению семантики
     */
    setSemListSearchCriterion( criterion: SemListSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий ограничения по слоям классификатора
     * @method getTypeNamesSearchCriterion
     * @return {TypeNamesSearchCriterion|undefined} Критерий ограничения по слоям классификатора
     */
    getTypeNamesSearchCriterion() {
        return this.getCriterion<TypeNamesSearchCriterion>( SearchCriterionName.TypeNames ) || this.setCriterion( new TypeNamesSearchCriterion() );
    }

    /**
     * Установить критерий ограничения по слоям классификатора
     * @method setTypeNamesSearchCriterion
     * @param criterion {TypeNamesSearchCriterion} критерий ограничения по слоям классификатора
     */
    setTypeNamesSearchCriterion( criterion: TypeNamesSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий пересечения
     * @method getCrossMethodSearchCriterion
     * @return {CrossMethodSearchCriterion|undefined} Критерий пересечения
     */
    getCrossMethodSearchCriterion() {
        return this.getCriterion<CrossMethodSearchCriterion>( SearchCriterionName.CrossMethod ) || this.setCriterion( new CrossMethodSearchCriterion() );
    }

    /**
     * Установить критерий пересечения
     * @method setCrossMethodSearchCriterion
     * @param criterion {CrossMethodSearchCriterion} критерий пересечения
     */
    setCrossMethodSearchCriterion( criterion: CrossMethodSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий данных файла
     * @method getFileDataCriterion
     * @return {FileDataSearchCriterion|undefined} Критерий данных файла
     */
    getFileDataCriterion() {
        return this.getCriterion<FileDataSearchCriterion>( SearchCriterionName.FileData ) || this.setCriterion( new FileDataSearchCriterion() );
    }

    /**
     * Установить критерий данных файла
     * @method setFileDataCriterion
     * @param criterion {FileDataSearchCriterion} критерий данных файла
     */
    setFileDataCriterion( criterion: FileDataSearchCriterion ) {
        return this.setCriterion( criterion );
    }

    /**
     * Получить критерий вывода графических объектов
     * @method getGetGraphObjectsCriterion
     * @return {GetGraphObjectsCriterion|undefined} Критерий вывода графических объектов
     */
    getGetGraphObjectsCriterion() {
        return this.getCriterion<GetGraphObjectsCriterion>( SearchCriterionName.GetGraphObjects ) || this.setCriterion( new GetGraphObjectsCriterion() );
    }

    /**
     * Установить критерий вывода графических объектов
     * @method setGetGraphObjectsCriterion
     * @param criterion {GetGraphObjectsCriterion} критерий вывода графических объектов
     */
    setGetGraphObjectsCriterion( criterion: GetGraphObjectsCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий вывода метрики
     * @method getMetricCriterion
     * @return {MetricCriterion|undefined} Критерий вывода метрики
     */
    getMetricCriterion() {
        return this.getCriterion<MetricCriterion>( SearchCriterionName.Metric ) || this.setCriterion( new MetricCriterion() );
    }

    /**
     * Установить критерий вывода метрики
     * @method setMetricCriterion
     * @param criterion {MetricCriterion} критерий вывода метрики
     */
    setMetricCriterion( criterion: MetricCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий поиска по измерениям
     * @method getMeasureSearchCriterion
     * @return {MeasureSearchCriterion|undefined} Критерий поиска по измерениям
     */
    getMeasureSearchCriterion() {
        return this.getCriterion<MeasureSearchCriterion>( SearchCriterionName.MeasureFilter ) || this.setCriterion( new MeasureSearchCriterion() );
    }

    /**
     * Установить критерий поиска по измерениям
     * @method setMeasureSearchCriterion
     * @param criterion {MeasureSearchCriterion} критерий поиска по измерениям
     */
    setMeasureSearchCriterion( criterion: MeasureSearchCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить критерий поиска по результатам
     * @method getStringForSearchInResultCriterion
     * @return {StringForSearchInResultCriterion|undefined} Критерий поиска по результатам
     */
    getStringForSearchInResultCriterion() {
        return this.getCriterion<StringForSearchInResultCriterion>( SearchCriterionName.StringForSearchInResult ) || this.setCriterion( new StringForSearchInResultCriterion() );
    }

    /**
     * Установить критерий поиска по результатам
     * @method setStringForSearchInResultCriterion
     * @param criterion {StringForSearchInResultCriterion} критерий поиска по результатам
     */
    setStringForSearchInResultCriterion( criterion: StringForSearchInResultCriterion ) {
        this.setCriterion( criterion );
    }

    /**
     * Получить ключ семантики
     * @method getSemSortKey
     * @return {SemSortKey|undefined} ключ семантики
     */
    getSemSortKey() {
        return this.getCriterion<SemSortKey>(SearchCriterionName.SemSortKey) || this.setCriterion(new SemSortKey());
    }

    /**
     * Установить ключ семантики
     * @method setSemSortKey
     * @param criterion {SemSortKey} ключ семантики
     */
    setSemSortKey(criterion: SemSortKey) {
        this.setCriterion(criterion);
    }

    /**
     * Получить критерий направления сортировки
     * @method getFindDirectionCriterion
     * @return {FindDirectionCriterion|undefined} критерий направления сортировки
     */
    getFindDirectionCriterion() {
        return this.getCriterion<FindDirectionCriterion>(SearchCriterionName.FindDirection) || this.setCriterion(new FindDirectionCriterion());
    }

    /**
     * Установить критерий направления сортировки
     * @method setFindDirectionCriterion
     * @param criterion {FindDirectionCriterion} критерий направления сортировки
     */
    setFindDirectionCriterion(criterion: FindDirectionCriterion) {
        this.setCriterion(criterion);
    }

    /**
     * Получить критерий типа объектов Росреестра
     * @method getFindDirectionCriterion
     * @return {FindDirectionCriterion|undefined} критерий типа объектов Росреестра
     */
    getRosreestrTypeCriterion() {
        return this.getCriterion<LayerTypeSearchCriterion>(SearchCriterionName.LayerType) || this.setCriterion(new LayerTypeSearchCriterion());
    }

    /**
     * Установить критерий типа объектов Росреестра
     * @method setFindDirectionCriterion
     * @param criterion {FindDirectionCriterion} критерий типа объектов Росреестра
     */
    setRosreestrTypeCriterion(criterion: LayerTypeSearchCriterion) {
        this.setCriterion(criterion);
    }

    /**
     * Получить критерий типа слоя
     * @method getLayerTypeCriterion
     * @return {LayerTypeSearchCriterion|undefined} критерий типа слоя
     */
    getLayerTypeCriterion() {
        return this.getCriterion<LayerTypeSearchCriterion>(SearchCriterionName.LayerType) || this.setCriterion(new LayerTypeSearchCriterion());
    }

    /**
     * Установить критерий типа слоя
     * @method setLayerTypeCriterion
     * @param criterion {FindDirectionCriterion} критерий типа слоя
     */
    setLayerTypeCriterion(criterion: LayerTypeSearchCriterion) {
        this.setCriterion(criterion);
    }

    /**
     * Получить значение ключа сортировки
     * @method getSortKey
     * @return {SortKey|undefined} значение ключа сортировки
     */
    getSortKey() {
        return this.getCriterion<SortKey>(SearchCriterionName.SortKey) || this.setCriterion(new SortKey());
    }

    /**
     * Установить значение ключа сортировки
     * @method setSortKey
     * @param criterion {SortKey} значение ключа сортировки
     */
    setSortKey(criterion: SortKey) {
        this.setCriterion(criterion);
    }
    /**
     * Получить содержимое критерия
     * @method getCriterionContent
     * @param name {string} Название критерия
     * @return {CriterionDataType} Содержимое критерия
     */
    getCriterionContent<T extends SearchCriterionName>( name: T ) {
        let customCriterion;
        for ( const key in this.criterionList ) {
            const criterion = this.criterionList[ key ];
            if ( criterion.name === name ) {
                customCriterion = criterion;
                break;
            }
        }

        let defaultCriterion;
        for ( let i = 0; i < this.defaultCriteria.length; i++ ) {
            const criterion = this.defaultCriteria[ i ];
            if ( criterion.name === name ) {
                defaultCriterion = criterion;
                break;
            }
        }
        let result: CriterionDataType<T> | undefined;

        if ( defaultCriterion ) {
            if ( customCriterion ) {
                result = defaultCriterion.join(customCriterion).getContent() as CriterionDataType<T>;
            } else {
                result = defaultCriterion.getContent() as CriterionDataType<T>;
            }
        } else if (customCriterion) {
            result = customCriterion.getContent() as CriterionDataType<T>;
        }
        return result;
    }

    /**
     * Получить содержимое критерия поиска по семантики
     * @method getSemanticSearchCriteriaContent
     * @return {SemanticFilterCriterion|undefined} содержимое критерия поиска по семантики
     */
    getSemanticSearchCriteriaContent() {
        const result: SemanticFilterCriterion[] = [];
        const defaultCriteria = this.defaultCriteria;
        const criterionList = this.criterionList;
        const semanticCriterion = this.getCriterion<SemanticSearchCriterion>(SearchCriterionName.Semantic);
        const semanticCriterionList = semanticCriterion?.getContent();

        if (semanticCriterion && semanticCriterionList) {
            if (semanticCriterionList.semanticCriterionList.length) {
                const semantic = [];
                for (let i = 0; i < semanticCriterionList.semanticCriterionList.length; i++) {
                    semantic.push({ ...semanticCriterionList.semanticCriterionList[i] });
                }
                result.push({
                    semanticCriteria: semantic,
                    disjunction: semanticCriterionList.disjunction
                });
            }
        }

        if (criterionList.Text && defaultCriteria[0].getContent() !== '') {
            const textSearchCriterion = criterionList.Text as TextSearchCriterion;
            const textSearchContent = textSearchCriterion.getContent();
            const semantic = [];
            const disjunction = textSearchContent.disjunction;
            for (let i = 0; i < textSearchContent.semanticCriterionList.length; i++) {
                const semanticCriterion = textSearchContent.semanticCriterionList[i];
                if (semanticCriterion.value.length > 0) {
                    semantic.push(semanticCriterion);
                }
            }
            if (semantic.length > 0) {
                result.push({
                    semanticCriteria: semantic,
                    disjunction: disjunction
                });
            }
        }

        if (defaultCriteria.length === 1) {
            if (criterionList.Semantic) {
                return result;
            } else if (result.length > 0) {
                return result;
            } else  {
                return;
            }
        }

        let findSemantic = false;
        for (let i = 0; i < defaultCriteria.length; i++) {
            const criteria = defaultCriteria[i].getContent() as {
                semanticCriterionList: SemanticCriterion[];
                disjunction: boolean;
            };
            if (criteria.semanticCriterionList) {
                findSemantic = true;
                let disjunction = false;
                if (criteria) {
                    disjunction = criteria.disjunction;
                }
                const semantic = [];
                for (let j = 0; j < criteria.semanticCriterionList.length; j++) {
                    semantic.push({ ...criteria.semanticCriterionList[j] });
                }
                result.push({
                    semanticCriteria: semantic,
                    disjunction
                });
            }
        }
        if (result.length == 0) {
            return;
        }
        return result;
    }

    /**
     * Очистить все добавленные критерии
     * @method clear
     */
    clear() {
        for ( const key in this.criterionList ) {
            Reflect.deleteProperty( this.criterionList, key );
        }
    }

    /**
     * Обновить состояние агрегатора критериев поиска из другого агрегатора
     * @method updateFrom
     * @param other {CriteriaAggregator} Агрегатор критериев поиска
     */
    updateFrom( other: CriteriaAggregator ) {
        let result = false;
        for ( const name in this.criterionList ) {
            if ( !other.criterionList[ name ] ) {
                result = true;
                this.removeCriterion( name );
            }
        }

        for ( const name in other.criterionList ) {
            if ( !this.criterionList[ name ] || !this.criterionList[ name ].equals( other.criterionList[ name ] ) ) {
                result = true;
                this.setCriterion( other.criterionList[ name ] );
            }
        }
        return result;
    }

    /**
     * Получить копию объекта
     * @method copy
     * @return {CriteriaAggregator} Копия объекта
     */
    copy() {
        const result = new CriteriaAggregator( this.id, this.defaultCriteria );
        for ( const name in this.criterionList ) {
            result.setCriterion( this.criterionList[ name ] );
        }
        return result;
    }
}
