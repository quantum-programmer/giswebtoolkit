/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс управления фильтрами                      *
 *                                                                  *
 *******************************************************************/

import TypeFilterItem from './TypeFilterItem';
import ObjectFilterItem from './ObjectFilterItem';
import LocalizationFilterItem from './LocalizationFilterItem';
import SemanticFilterItem from './SemanticFilterItem';
import {
    StatisticLayer,
    StatisticList,
    StatisticLocal
} from '~/services/Search/mappers/GISWebServiceSEMapper';
import Layer from '~/maplayers/Layer';

export type SelectedFilterItem = TypeFilterItem | ObjectFilterItem | LocalizationFilterItem | SemanticFilterItem;

/**
 * Класс управления фильтрами
 * @class FilterItemManager
 */
export default class FilterItemManager {

    /**
     * Фильтры по слоям классификатора
     * @readonly
     * @property typeFilters {TypeFilterItem[]}
     */
    readonly typeFilters: TypeFilterItem[] = [];

    /**
     * Фильтры по объектам классификатора
     * @readonly
     * @property objectFilters {ObjectFilterItem[]}
     */
    readonly objectFilters: ObjectFilterItem[] = [];

    /**
     * Фильтры по локализациям
     * @readonly
     * @property localizationFilters {LocalizationFilterItem[]}
     */
    readonly localizationFilters: LocalizationFilterItem[] = [];

    /**
     * Фильтры по семантикам
     * @readonly
     * @property semanticFilters {SemanticFilterItem[]}
     */
    readonly semanticFilters: SemanticFilterItem[] = [];

    /**
     * Примененные фильтры
     * @readonly
     * @property appliedFilterItems {SelectedFilterItem[]}
     */
    readonly appliedFilterItems: SelectedFilterItem[] = [];

    /**
     * Количество выбранных фильтров
     * @property totalAppliedFiltersNumber {number}
     */
    get totalSelectedFiltersNumber() {
        const filterTypesCount = this.selectedTypeFilterItems.length;
        const filterObjectsCount = this.selectedObjectFilterItems.length;
        const filterLocalizationCount = this.selectedLocalizationFilterItems.length;
        const filterSemanticsCount = this.selectedSemanticFilterItems.length;

        return filterTypesCount + filterObjectsCount + filterLocalizationCount + filterSemanticsCount;
    }

    /**
     * Количество примененных фильтров
     * @property totalAppliedFiltersNumber {number}
     */
    get totalAppliedFiltersNumber() {
        return this.appliedFilterItems.length;
    }

    /**
     * Список выбранных фильтров по слоям классификатора
     * @property selectedTypeFilterItems {TypeFilterItem[]}
     */
    get selectedTypeFilterItems() {
        return this.typeFilters.filter( typeFilterItem => typeFilterItem.selected );
    }

    /**
     * Список выбранных фильтров по объектам классификатора
     * @property selectedObjectFilterItems {ObjectFilterItem[]}
     */
    get selectedObjectFilterItems() {
        return this.objectFilters.filter( objectFilterItem => objectFilterItem.selected );
    }

    /**
     * Список отображаемых фильтров по объектам классификатора
     * @property visibleObjectFilterItems {ObjectFilterItem[]}
     */
    get visibleObjectFilterItems() {
        return this.objectFilters.filter( objectFilterItem => objectFilterItem.visible );
    }

    /**
     * Список выбранных фильтров по локализации
     * @property selectedLocalizationFilterItems {LocalizationFilterItem[]}
     */
    get selectedLocalizationFilterItems() {
        return this.localizationFilters.filter( localizationFilterItem => localizationFilterItem.selected );
    }

    /**
     * Список выбранных фильтров по семантике
     * @property selectedSemanticFilterItems {SemanticFilterItem[]}
     */
    get selectedSemanticFilterItems() {
        return this.semanticFilters.filter( ( semanticFilterItem ) => semanticFilterItem.selected );
    }

    /**
     * Получить список идентификаторов карт для текущего типа фильтрации
     * @private
     * @method getLayerIds
     * @param criterion {string} Тип фильтрации
     * @param statisticLayers {StatisticLayer[]} Массив описаний карт из статистики
     * @param value {string} Значение элемента фильтрации
     * @return {string[]} Список идентификаторов карт для текущего типа фильтрации
     */
    private getLayerIds( criterion: 'keys' | 'semantics' | 'typenames', statisticLayers: StatisticLayer[], value: string ) {
        const layerIdList: string[] = [];

        for ( let layerIndex = 0; layerIndex < statisticLayers.length; layerIndex++ ) {
            const layer = statisticLayers[ layerIndex ];

            const statisticTypeInLayer = layer[ criterion ].find( statisticType => statisticType.value === value );

            if ( statisticTypeInLayer ) {
                layerIdList.push( layer.id );
            }
        }
        return layerIdList;
    }

    /**
     * Получить список названий карт в виде строки
     * @private
     * @method getLayerAliases
     * @param layerIdList{string[]} Список идентификаторов карт
     * @param selectableLayerList{Layer[]} Список карт доступных для выброа объектов
     * @return {string} Список названий карт в виде строки
     */
    private getLayerAliases( layerIdList: string[], selectableLayerList: Layer[] ) {
        const names = [];

        for ( let layerIdIndex = 0; layerIdIndex < layerIdList.length; layerIdIndex++ ) {

            const layerId = layerIdList[ layerIdIndex ];

            const selectableLayer = selectableLayerList.find( layer => layer.id === layerId );

            if ( selectableLayer ) {
                names.push( selectableLayer.alias );
            }
        }

        return names.join( ', ' );
    }

    /**
     * Создать список фильтров по слоям классификатора
     * @private
     * @method createTypesInfoList
     * @param selectableLayers {Layer[]} Список карт доступных для выбора объектов
     * @param statistic {StatisticList}  Статистика из ответа сервиса
     * @param selectedTypes {TypeFilterItem[]} Список выбранных ранее фильтров
     */
    private createTypesInfoList( selectableLayers: Layer[], statistic: StatisticList, selectedTypes: TypeFilterItem[] ) {

        const typeNames = statistic.typenames;

        for ( let typeNameIndex = 0; typeNameIndex < typeNames.length; typeNameIndex++ ) {
            const typeName = typeNames[ typeNameIndex ];

            const layerIdList = this.getLayerIds( 'typenames', statistic.layers, typeName.value );

            const layerAliases = this.getLayerAliases( layerIdList, selectableLayers );

            const selectedType = selectedTypes.find( typeFilter => typeFilter.typeValue === typeName.value );

            this.typeFilters.push( new TypeFilterItem( typeName, layerIdList.join( ',' ), layerAliases, !!selectedType ) );
        }

        // Сортировать список Типов объектов
        this.typeFilters.sort( ( a, b ) => (a.name < b.name ? -1 : 1) );
    }

    /**
     * Создать список фильтров по объектам классификатора
     * @private
     * @method createObjectsInfoList
     * @param selectableLayers{Layer[]} Список карт доступных для выбора объектов
     * @param statistic {StatisticList}  Статистика из ответа сервиса
     * @param selectedObjectKeys{ObjectFilterItem[]} Список выбранных ранее фильтров
     */
    private createObjectsInfoList( selectableLayers: Layer[], statistic: StatisticList, selectedObjectKeys: ObjectFilterItem[] ) {

        const objectKeys = statistic.keys;

        for ( let objectKeyIndex = 0; objectKeyIndex < objectKeys.length; objectKeyIndex++ ) {

            const objectKey = objectKeys[ objectKeyIndex ];

            const layerIdList = this.getLayerIds( 'keys', statistic.layers, objectKey.value );

            const layerAliases = this.getLayerAliases( layerIdList, selectableLayers );

            const selectedObjectKey = selectedObjectKeys.find( objectFilter => objectFilter.objectKey === objectKey.value );

            this.objectFilters.push( new ObjectFilterItem( objectKey, layerIdList.join( ',' ), layerAliases, !!selectedObjectKey ) );

        }

        // Сортировать список объектов
        this.objectFilters.sort( ( a, b ) => (a.name < b.name ? -1 : 1) );
    }

    /**
     * Создать список фильтров по локализациям
     * @private
     * @method createLocalizationInfoList
     * @param selectedLocalizations{LocalizationFilterItem[]} Список выбранных ранее фильтров
     * @param statistic {StatisticList}  Статистика из ответа сервиса
     */
    private createLocalizationInfoList( selectedLocalizations: LocalizationFilterItem[], statistic: StatisticList ) {

        const statisticLocal = statistic.local;

        for ( const key in statisticLocal ) {
            const localizationCount = +statisticLocal[ key as keyof StatisticLocal ];
            if ( localizationCount > 0 ) {
                const selectedLocalization = selectedLocalizations.find( localizationFilter => localizationFilter.nameCount === key );
                this.localizationFilters.push( new LocalizationFilterItem( key, localizationCount, !!selectedLocalization ) );
            }
        }

        // Сортировать список локализации
        this.localizationFilters.sort( ( a, b ) => (a.localizationDigitalValue < b.localizationDigitalValue ? -1 : 1) );
    }

    /**
     * Создать список фильтров по семантикам
     * @private
     * @method createSemanticsInfoList
     * @param selectableLayers{Layer[]} Список карт доступных для выбора объектов
     * @param statistic {StatisticList}  Статистика из ответа сервиса
     * @param selectedSemantics{SemanticFilterItem[]} Список выбранных ранее фильтров
     */
    private createSemanticsInfoList( selectableLayers: Layer[], statistic: StatisticList, selectedSemantics: SemanticFilterItem[] ) {

        const semantics = statistic.semantics;

        for ( let semanticIndex = 0; semanticIndex < semantics.length; semanticIndex++ ) {
            const semantic = semantics[ semanticIndex ];

            const layerIdList = this.getLayerIds( 'semantics', statistic.layers, semantic.value );

            const layerAliases = this.getLayerAliases( layerIdList, selectableLayers );

            const selectedSemantic = selectedSemantics.find( semanticFilter => semanticFilter.semanticName === semantic.name );

            this.semanticFilters.push( new SemanticFilterItem( semantic, layerIdList.join( ',' ), layerAliases, selectableLayers, selectedSemantic && selectedSemantic.semanticSearchValue ) );
        }

        // Сортировать список Типов объектов
        this.semanticFilters.sort( ( a, b ) => (a.semanticName < b.semanticName ? -1 : 1) );
    }

    /**
     * Сбросить выбранные слои классификатора
     * @private
     * @method resetSelectedTypes
     */
    private resetSelectedTypes() {
        this.typeFilters.forEach( typeFilterItem => typeFilterItem.selected = false );
    }

    /**
     * Сбросить выбранные объекты классификатора
     * @method resetSelectedObjects
     */
    resetSelectedObjects() {
        this.objectFilters.forEach( objectFilterItem => objectFilterItem.selected = false );
    }

    /**
     * Сбросить выбранные локализации
     * @private
     * @method resetSelectedLocalizations
     */
    private resetSelectedLocalizations() {
        this.localizationFilters.map( localizationFilterItem => localizationFilterItem.selected = false );
    }

    /**
     * Сбросить заполненные поля семантик
     * @private
     * @method resetFilledSemanticFields
     */
    private resetFilledSemanticFields() {
        this.semanticFilters.forEach( semanticFilterItem => semanticFilterItem.semanticSearchValue.length = 0 );
    }

    /**
     * Обновить фильтры по ответу сервиса
     * @method fromStatistics
     * @param statistic {StatisticList} Статистика из ответа сервиса
     * @param selectableLayers {Layer[]} Список карт доступных для выбора объектов
     */
    fromStatistics<K extends keyof StatisticList>( statistic: StatisticList, selectableLayers: Layer[] ) {

        const selectedTypes = this.selectedTypeFilterItems;
        const selectedObjectKeys = this.selectedObjectFilterItems;
        const selectedLocalizations = this.selectedLocalizationFilterItems;
        const selectedSemantic = this.selectedSemanticFilterItems;

        this.clear();

        // Создание списка типов объектов
        this.createTypesInfoList( selectableLayers, statistic, selectedTypes );

        // Создание списка объектов
        this.createObjectsInfoList( selectableLayers, statistic, selectedObjectKeys );

        // Создания списка локализаций
        this.createLocalizationInfoList( selectedLocalizations, statistic );

        // Создание списка семантик
        this.createSemanticsInfoList( selectableLayers, statistic, selectedSemantic );
    }

    /**
     * Очистить все данные
     * @method clear
     */
    clear() {
        this.typeFilters.splice( 0 );
        this.objectFilters.splice( 0 );
        this.localizationFilters.splice( 0 );
        this.semanticFilters.splice( 0 );
    }

    /**
     * Сбросить примененные фильтры
     * @method resetSelectedFilters
     */
    resetSelectedFilters() {
        this.resetSelectedTypes();
        this.resetSelectedObjects();
        this.resetSelectedLocalizations();
        this.resetFilledSemanticFields();
    }

    /**
     * Обновить список примененных фильтров
     * @method refreshAppliedFilterItems
     */
    refreshAppliedFilterItems() {

        const selectedFiltersTypes = this.appliedFilterItems;
        selectedFiltersTypes.splice( 0 );

        // Получить список выбранных типов
        this.selectedTypeFilterItems.reduce<SelectedFilterItem[]>( ( accumulator, currentValue ) => {
            accumulator.push( currentValue );
            return accumulator;
        }, selectedFiltersTypes );

        // Получить список выбранных объектов
        this.selectedObjectFilterItems.reduce<SelectedFilterItem[]>( ( accumulator, currentValue ) => {
            accumulator.push( currentValue );
            return accumulator;
        }, selectedFiltersTypes );

        // Получить список выбранных локализации
        this.selectedLocalizationFilterItems.reduce<SelectedFilterItem[]>( ( accumulator, currentValue ) => {
            accumulator.push( currentValue );
            return accumulator;
        }, selectedFiltersTypes );

        // Получить список заполненных семантик
        this.selectedSemanticFilterItems.reduce<SelectedFilterItem[]>( ( accumulator, currentValue ) => {
            accumulator.push( currentValue );
            return accumulator;
        }, selectedFiltersTypes );

    }

    /**
     * Обновить список видимых фильтров по объектам классификатора
     * @method refreshVisibleSemanticFilterItems
     */
    refreshVisibleObjectFilterItems() {
        this.objectFilters.forEach( objectFilterItem => objectFilterItem.toggleVisible( true ) );

        // применяем отобранные типы к списку фильтров по объектам
        const selectedTypeFilterTypeValues = this.selectedTypeFilterItems.map( types => types.typeValue );
        if ( selectedTypeFilterTypeValues.length > 0 ) {
            this.objectFilters.forEach( objectFilterItem => {
                objectFilterItem.toggleVisible( selectedTypeFilterTypeValues.includes( objectFilterItem.objectTypeName ) );
            } );
        }

        // применяем отобранные локализации к списку фильтров по объектам
        const selectedLocalizationFilterValues = this.selectedLocalizationFilterItems.map( localizations => localizations.localizationDigitalValue );
        if ( selectedLocalizationFilterValues.length > 0 ) {
            this.objectFilters.forEach( objectFilterItem => {
                objectFilterItem.toggleVisible( selectedLocalizationFilterValues.includes( objectFilterItem.objectLocalizationDigitalValue ) );
            } );
        }

        this.refreshVisibleSemanticFilterItems();
    }

    /**
     * Обновить список видимых фильтров по семантикам
     * @method refreshVisibleSemanticFilterItems
     */
    refreshVisibleSemanticFilterItems() {

        // применяем отобранные объекты к списку фильтров по семантикам
        const selectedObjectFilterTypeNames = this.selectedObjectFilterItems.map( objectFilterItem => objectFilterItem.objectTypeName );
        if ( selectedObjectFilterTypeNames.length > 0 ) {
            this.semanticFilters.forEach( semanticFilterItem => {
                let existFlag = false;
                for ( let i = 0; i < semanticFilterItem.semanticObjectsTypes.length; i++ ) {
                    if ( selectedObjectFilterTypeNames.indexOf( semanticFilterItem.semanticObjectsTypes[ i ] ) !== -1 ) {
                        existFlag = true;
                        break;
                    }
                }
                semanticFilterItem.toggleVisible( existFlag );
            } );
        } else {
            this.semanticFilters.forEach( semanticFilterItem => semanticFilterItem.toggleVisible( true ) );
        }
    }
}
