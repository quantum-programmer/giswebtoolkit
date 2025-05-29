/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Компонент "Список объектов карты" в виде таблицы         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Watch} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    CLEAR_HIGHLIGHTED_OBJECT,
    FIND_BY_START_INDEX,
    FIND_OBJECTS_BY_SEARCH_VALUE,
    FIT_MAP_TO_CLUSTER,
    FIT_OBJECT,
    GwtkMapObjectTaskState,
    HIGHLIGHT_OBJECT,
    SELECT_CURRENT_MAPOBJECT_CONTENT,
    SELECT_MODE,
    SET_SEARCH_VALUE,
    SET_SELECT_RECORDS_COUNT_IN_TABLE,
    SET_SELECT_RECORDS_PAGE,
    SET_SHOW_NOT_EMPTY_TABLE_FIELDS,
    SET_SHOW_SELECTING_TABLE_FIELDS,
    TableHeader,
    TableParams,
    TOGGLE_REALLY_SELECT_OBJECT,
    TOGGLE_SELECTED_OBJECT,
    VIEW_CLUSTER_LIST
} from '../../../GwtkMapObjectTask';
import MapObject from '~/mapobject/MapObject';
import FilterItemManager from '../../../utils/FilterItemManager/FilterItemManager';
import {MapObjectPanelState} from '~/taskmanager/TaskManager';
import {SimpleJson} from '~/types/CommonTypes';


type OnClickTableRow = {
    expand: (value: boolean) => void,
    headers: TableHeader[],
    isExpanded: boolean,
    isMobile: boolean,
    isSelected: boolean,
    item: unknown,
    select: (value: boolean) => void
};

/**
 * Компонент "Список объектов карты" в виде таблицы
 * @class GwtkMapObjectTableWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapObjectTableWidget extends BaseGwtkVueComponent {
    @Prop({default: ''})
    readonly taskId!: string;

    @Prop({default: () => ({})})
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({default: () => ([])}) mapObjects!: MapObject[];

    @Prop({default: () => ([])})
    readonly mapObjectsSelected!: MapObject[];

    @Prop({default: () => ([])}) reallySelectedObjects!: MapObject[];

    @Prop({default: () => MapObjectPanelState.showObjects})
    readonly mapObjectsState!: MapObjectPanelState;

    @Prop({default: () => ({})})
    readonly filterManager!: FilterItemManager;

    @Prop({default: () => ({})})
    readonly tableParams!: TableParams;

    @Prop({default: ''})
    readonly drawnObjectId!: string;

    @Prop({default: () => ([])})
    readonly selectedObjects!: string[];

    @Prop({default: false})
    readonly showSelectedObjectsPage!: boolean;

    @Prop({default: () => ([])})
    readonly tableMapObjects!: (MapObject | null)[];
    @Prop( { default: false } )
    private readonly isReducedSizeInterface!: boolean;

    @Prop({default: false})
    readonly editingMode!: boolean;

    isShowSettings: boolean = false;

    isSearchFieldDisabled: boolean = false;
    readonly selectedItems: SimpleJson[] = [];

    created() {
        // this.selectedItems.splice( 0 );
        if (this.selectedObjects.length > 0) {
            this.tableParams.tableBody.forEach((bodyItem: SimpleJson) => {
                if (this.selectedObjects.includes(bodyItem.showMapObjectInMap)) {
                    this.selectedItems.push(bodyItem);
                }
            });
        }
    }

    isShowSelectedObjects() {
        return this.mapObjectsState === MapObjectPanelState.showSelectedObjects;
    }

    getIsReallySelected(id: string) {
        return this.reallySelectedObjects.find(mapObject => mapObject.id === id) !== undefined;
    }

    private get tableLoading() {
        return this.tableParams.recordsOnPage.tableLoading;
    }

    get isShowSelectedObjectsPage() {
        return this.showSelectedObjectsPage;
    }

    get tableSearchValue() {
        return this.tableParams.searchValue;
    }

    set tableSearchValue(value: string | null) {
        if (value === null) {
            value = '';
        }

        this.setState(SET_SEARCH_VALUE, value);

        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            this.setState(FIND_OBJECTS_BY_SEARCH_VALUE, undefined);
        }
    }

    get isShowNotEmptyFields() {
        return this.tableParams.showNotEmptyFields;
    }

    set isShowNotEmptyFields(value: boolean) {
        this.setState(SET_SHOW_NOT_EMPTY_TABLE_FIELDS, value);
    }

    get settingsShowFieldsHeaders() {
        let showFieldsList: string[] = [];
        this.tableParams.tableAllHeaders.forEach((header: TableHeader) => {
            if (header.value !== 'showMapObjectInMap' && header.value !== 'showMapObjectInfo') {
                if (header.visibility) {
                    showFieldsList.push(header.value);
                }
            }
        });
        return showFieldsList;
    }

    set settingsShowFieldsHeaders(value: string[]) {
        this.setState(SET_SHOW_SELECTING_TABLE_FIELDS, value);
    }


    get paginationPageNumber() {
        return this.tableParams.recordsOnPage.page;
    }

    set paginationPageNumber(value: number) {
        this.setState(SET_SELECT_RECORDS_PAGE, value.toString());
    }

    get paginationLength() {
        return Math.ceil(this.tableParams.tableBody.length / this.tableParams.recordsOnPage.records);
    }

    /**
     * Выделить выбранные объекты на карте (множественный выбор)
     * @private
     * @method tableSelectedItemsList
     * @param selectedIdem {object} - Объект содержащий данные из строки таблицы
     * @param relatedDataProvidedSelectedIdem {OnClickTableRow} - Объект содержащий полную информацию о строке таблицы
     */
    tableSelectedItemsList(selectedIdem: { showMapObjectInMap: string }, relatedDataProvidedSelectedIdem: OnClickTableRow) {
        relatedDataProvidedSelectedIdem.select(!relatedDataProvidedSelectedIdem.isSelected);

        this.setState(TOGGLE_SELECTED_OBJECT, selectedIdem['showMapObjectInMap']);
    }

    /**
     * Закрыть окно параметров
     * @private
     * @method closeSettingsMenu
     */
    closeSettingsMenu() {
        this.isShowSettings = false;
    }

    /**
     * Установить количество строк на странице в таблице
     * @private
     * @method onSelectRecordsOnPageWidget
     */
    onSelectRecordsOnPageWidget(value: string): void {
        this.setState(SET_SELECT_RECORDS_COUNT_IN_TABLE, value);
    }

    showTableOptions(value: { page: number; itemsLength: number; }) {
        this.setState(SET_SELECT_RECORDS_PAGE, value.page.toString());
        // this.setState( SET_SELECT_RECORD_OFFSET, value.itemsLength.toString() );
    }

    /**
     * Развернуть/свернуть описание объекта карты
     * @private
     * @method toggleMapObject
     * @param mapObjectId {number} Индекс объекта карты в массиве
     */
    toggleMapObject(mapObjectId: string) {

        const mapObject = this.getMapObject(mapObjectId);

        if (mapObject !== undefined) {
            if (mapObject.isEmptyClusterObject) {
                this.setState(FIT_MAP_TO_CLUSTER, mapObject);
            } else if (mapObjectId === this.drawnObjectId) {
                this.setState(CLEAR_HIGHLIGHTED_OBJECT, undefined);
            } else {
                this.setState(HIGHLIGHT_OBJECT, mapObject);
                this.setState(FIT_OBJECT, mapObject);
            }
        }
    }

    toggleSelectOrUnselect(mapObjectId: string) {
        const mapObject = this.getMapObject(mapObjectId);
        if (mapObject) {
            this.setState(TOGGLE_REALLY_SELECT_OBJECT, mapObject);
        }
    }

    /**
     * Переключаться между списком объектов и просмотром информации об объекте
     * @private
     * @method toggleMapObjectInformation
     * @param mapObjectId {String} объект карты
     */
    toggleMapObjectInformation(mapObjectId: string) {

        const mapObject = this.getMapObject(mapObjectId);

        if (mapObject !== undefined) {
            if (mapObject.isEmptyClusterObject) {
                this.setState(VIEW_CLUSTER_LIST, mapObject);
            } else {
                this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, mapObject);
                this.setState(SELECT_MODE, MapObjectPanelState.showInfo);
            }
        }
    }

    /**
     * Получить объект карты по идентификатору
     * @private
     * @method getMapObject
     * @param mapObjectId {string} объект карты
     */
    private getMapObject(mapObjectId: string) {
        const mapObjects: (MapObject | null)[] = this.getMapObjectsList();
        let mapObject: MapObject | undefined = undefined;

        for (let i = 0; i < mapObjects.length; i++) {
            const item = mapObjects[i];
            if (item !== null && item.id === mapObjectId) {
                mapObject = item;
                break;
            }
        }

        return mapObject;
    }

    /**
     * Получить список объектов карты которые отображаются в таблице
     * @private
     * @method getMapObjectsList
     */
    private getMapObjectsList() {
        let mapObjects: (MapObject | null)[];
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            mapObjects = this.mapObjectsSelected;
        } else {
            mapObjects = this.tableMapObjects;
            //mapObjects = this.mapObjects;
        }
        return mapObjects;
    }

    @Watch('paginationPageNumber')
    nextPaginationClick() {
        const mapObjects = this.getMapObjectsList();
        const recordsLengthInPage = this.tableParams.recordsOnPage.records;
        const thisPageFirstMapObjectIndex = (this.paginationPageNumber * recordsLengthInPage) - recordsLengthInPage;
        let nextPageFirstMapObjectIndex = thisPageFirstMapObjectIndex + 50;
        const prevPageFirstMapObjectIndex = thisPageFirstMapObjectIndex - 50;
        let value = 1;
        let count = 50;

        if (mapObjects.length < nextPageFirstMapObjectIndex) {
            nextPageFirstMapObjectIndex = mapObjects.length - 1;
        }

        const thisMapObjectInPage = mapObjects[thisPageFirstMapObjectIndex];
        if (thisMapObjectInPage === null) {
            value = (Math.floor(thisPageFirstMapObjectIndex / 50) * 50);

            if (value > 1) {
                const prevPageFirstMapObject = mapObjects[prevPageFirstMapObjectIndex];
                if (prevPageFirstMapObject === null) {
                    const prevValue = (Math.floor(prevPageFirstMapObjectIndex / 50) * 50);
                    if (prevValue > 1) {
                        value = value - 50;
                        count = count + 50;
                    }
                }

                const nextPageFirstMapObject = mapObjects[nextPageFirstMapObjectIndex];
                if (nextPageFirstMapObject === null) {
                    const nextValue = (Math.floor(nextPageFirstMapObjectIndex / 50) * 50);
                    if (nextValue > 1) {
                        count = count + 50;
                    }
                }

                this.setState(FIND_BY_START_INDEX, [value, count]);
            }
        }
    }

    checkClusterObject(mapObjectId: string): boolean {
        const mapObject = this.getMapObject(mapObjectId);
        return mapObject !== undefined && mapObject.isEmptyClusterObject;

    }

    get attachParam() {
        return '.' + this.taskId.split('.')[0] + ' ' + '.gwtk-draggable-task-card .v-data-table__wrapper';
    }

    /**
     * Выполнить поиск объектов по ключевому слову
     * @method findObjectsBySearchValue
     */
    findObjectsBySearchValue() {
        if (this.tableParams.searchValue !== '') {
            this.setState(FIND_OBJECTS_BY_SEARCH_VALUE, undefined);
        }
    }

    /**
     * Выполнить поиск объектов по нажатию очистить текст
     * @method findObjectsBySearchValueClearClick
     *
     */
    findObjectsBySearchValueClearClick() {
        this.setState(SET_SEARCH_VALUE, '');
        this.setState(FIND_OBJECTS_BY_SEARCH_VALUE, undefined);
    }

    /**
     * Выполнить поиск объектов по ключевому слову, по нажатию на "Enter"
     * @method findObjectsBySearchValueKeyDown
     */
    findObjectsBySearchValueKeyDownEnter(keyValue: KeyboardEvent) {
        if (keyValue.key.toLowerCase() === 'enter') {
            this.findObjectsBySearchValue();
        }
    }
}
