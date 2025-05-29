/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Объекты карты"                    *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import {
    GwtkMapObjectTaskState,
    MapObjectsViewMode,
    RequestItem,
    SemanticViewFlags,
    TableParams,
    EXIT_MODE,
    DELETE_FILTER,
    SET_ACTIVE_OR_SELECTED_OBJECTS,
    PAINT_SELECTED_MAP_OBJECTS,
    SET_SHOW_MAP_OBJECTS_LIST_TYPE,
    SELECT_SEARCH_FILTER,
    SELECT_SORT_SEMANTIC,
    SET_SEARCH_VALUE,
    FIND_OBJECTS_BY_SEARCH_VALUE,
    ExportButtonList,
    EXPORT_TO_CLIPBOARD,
    EXPORT_TO_XLSX,
    SortType,
    ShowObjectsListType, GallerySemanticItem,
    EXPORT_TO_GEOJSON
} from '../../../task/GwtkMapObjectTask';
import FilterItemManager, { SelectedFilterItem } from '../../../task/utils/FilterItemManager/FilterItemManager';
import { AngleUnit, CursorCoordinateUnit } from '~/utils/WorkspaceManager';
import MapObject from '~/mapobject/MapObject';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkMapObjectFilters from '../GwtkMapObjectFilters/GwtkMapObjectFilters.vue';
import GwtkMapObjectFiltersSelected
    from '../GwtkMapObjectFilters/GwtkMapObjectFiltersSelected/GwtkMapObjectFiltersSelected.vue';
import GwtkMapObjectItemGallery
    from '../GwtkMapObjectWidget/GwtkMapObjectItemInformation/GwtkMapObjectItemGallery/GwtkMapObjectItemGallery.vue';
import GwtkMapObjectItemInformation
    from '../GwtkMapObjectWidget/GwtkMapObjectItemInformation/GwtkMapObjectItemInformation.vue';
import GwtkMapObjectItemEditor from '../GwtkMapObjectWidget/GwtkMapObjectItemEditor/GwtkMapObjectItemEditor.vue';
import GwtkMapObjectListWidget from '../GwtkMapObjectWidget/GwtkMapObjectListWidget/GwtkMapObjectListWidget.vue';
import GwtkMapObjectTableWidget from '../GwtkMapObjectWidget/GwtkMapObjectTableWidget/GwtkMapObjectTableWidget.vue';
import { MapObjectPanelState } from '~/taskmanager/TaskManager';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';


/**
 * Компонент "Список объектов карты"
 * @class GwtkMapObjectWidget
 * @extends BaseGwtkVueComponent
 */
@Component({ components: { GwtkMapObjectFilters, GwtkMapObjectFiltersSelected, GwtkMapObjectItemGallery, GwtkMapObjectItemInformation, GwtkMapObjectItemEditor, GwtkMapObjectListWidget, GwtkMapObjectTableWidget } })
export default class GwtkMapObjectWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({ default: true }) objectsProgressBar!: boolean;

    @Prop({ default: true }) filtersProgressBar!: boolean;

    @Prop({ default: () => ([]) }) mapObjects!: MapObject[];

    @Prop({ default: () => ([]) }) mapObjectsSelected!: MapObject[];

    @Prop({ default: () => ([]) }) reallySelectedObjects!: MapObject[];

    @Prop({ default: 0 }) foundObjectsNumber!: number;

    @Prop({ default: () => ({}) }) filterManager!: FilterItemManager;

    @Prop({ default: () => ([]) }) selectedObjects!: string[];

    @Prop({ default: 0 }) mapObjectsState!: MapObjectPanelState;

    @Prop({ default: () => ({}) }) currentMapObject!: MapObject | null;

    @Prop({ default: () => '' }) drawnObjectId!: string;

    @Prop({ default: () => [] }) requestQueue!: { id: string; requestItems: RequestItem[]; }[];

    @Prop({ default: false }) stateSearchObject!: boolean;

    @Prop({ default: () => ({}) })
    readonly showGallery!: boolean;

    @Prop({ default: false })
    readonly showSemanticFileUploadOverlay!: boolean;

    @Prop({ default: false })
    readonly coordinateDisplayFormatValue!: AngleUnit;

    @Prop({ default: false })
    readonly showSelectedObjectsPage!: boolean;

    @Prop({ default: 'tab_edit_semantic' })
    readonly editorTabOptions!: string;

    @Prop({ default: '' })
    readonly previewImageSrc!: string;

    @Prop({ default: false })
    readonly isGetRouteEnabled!: boolean;

    @Prop({ default: () => ({}) })
    readonly semanticViewFlags!: SemanticViewFlags;

    @Prop({ default: '' })
    readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop({ default: () => ({}) })
    readonly tableParams!: TableParams;

    @Prop({ default: '' })
    readonly showMapObjectsListType!: MapObjectsViewMode;

    @Prop({ default: () => [] })
    readonly buttonsExportActions!: ExportButtonList;

    @Prop({ default: [] })
    readonly semantics!: { name: string, value: string }[];

    @Prop( { default: false } )
    readonly showProgressBar!: boolean;

    @Prop({ default: '' })
    readonly selectSortType!: SortType['value'];

    @Prop({ default: '' })
    readonly selectedSortSemantic!: string;

    @Prop({ default: () => ([]) })
    readonly sortTypes!: SortType[];

    @Prop( { default: () => ([]) } )
    readonly externalFunctions!: { id: string; text: string; contents: string | null; }[];

    @Prop({ default: () => ([]) })
    readonly tableMapObjects!: (MapObject | null)[];

    @Prop({ default: () => ([]) })
    readonly objectAllDocuments!: { key: string, name: string, itemList: GallerySemanticItem[] }[];

    @Prop({ default: () => 0 })
    readonly currentObjectIndex!: number;

    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    @Prop({default: false})
    readonly onlyFilled!: boolean;

    /**
     * Текущая вкладка
     * @property tabOptions {string}
     */
    tabOptions = 'tab_objects';

    showExportMenu = false;
    closeOnContentClick = true;

    ascending = false;

    get editingMode() {
        return this.mapVue.getMap().strictEditorMode;
    }

    get selectedSortType() {
        return this.sortTypes.find(type => (type.value.type === this.selectSortType.type && type.value.value === this.selectSortType.value)) || this.sortTypes[0];
    }

    get sortButtonIcon() {
        return this.selectSortType.value === FINDDIRECTION.FirstObjectFirst;
    }

    get currentSemantic() {
        return this.semantics.find(semantic => semantic.value === this.selectedSortSemantic) || this.semantics[0];
    }

    changeShowListType() {
        this.showObjectsListType = this.showObjectsListType === ShowObjectsListType.list ? ShowObjectsListType.table : ShowObjectsListType.list;
    }

    get isShowObjectListType() {
        return this.showObjectsListType === ShowObjectsListType.list;
    }

    get containerHeight() {
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            return '100%';
        } else {
            return 'calc(100% - 4.4em)';
        }
    }

    /**
     * Удалить примененный фильтр
     * @private
     * @method deleteSelectedFiltersTypes
     * @param item {SelectedFilterItem} Фильтр
     */
    deleteSelectedFiltersTypes(item: SelectedFilterItem) {
        this.setState(DELETE_FILTER, item);
    }

    /**
     * Показать список объектов
     * @method isShowObjectsList
     */
    get isShowObjectsList() {
        return this.mapObjectsState === MapObjectPanelState.showObjects;
    }

    /**
     * Показать список объектов
     * @method isShowObjectsList
     */
    get isShowSelectedObjectsList() {
        return this.mapObjectsState === MapObjectPanelState.showSelectedObjects;
    }

    get isShowSelectedObjectsPage() {
        return this.showSelectedObjectsPage;
    }

    /**
     * Показать информацию об объекте
     * @method isShowObjectInfo
     */
    get isShowObjectInfo() {
        return this.mapObjectsState === MapObjectPanelState.showInfo;
    }


    /**
     * Показать информацию об объекте
     * @method isShowObjectInfo
     */
    get isShowGallery() {
        return this.isShowObjectInfo && this.showGallery;
    }

    /**
     * Показать окно редактирования объекта
     * @method isShowObjectEditing
     */
    get isShowObjectEditing() {
        return this.mapObjectsState === MapObjectPanelState.showEditor;
    }

    /**
     * Получить количество объектов без учета кластера
     */
    get mapObjectsLength(): number {
        let length = 0;

        let mapObjects = this.mapObjects;
        if (this.isShowSelectedObjectsList) {
            mapObjects = this.mapObjectsSelected;
        }

        mapObjects.forEach(object => {
            if (!object.isEmptyClusterObject) {
                length += 1;
            }
        });

        if (length > this.foundObjectsNumber && !this.isShowSelectedObjectsList) {
            length = this.foundObjectsNumber;
        }

        return length;
    }

    /**
     * Установить команду активного объекта
     */
    setActiveObjectCommand() {
        this.setState(SET_ACTIVE_OR_SELECTED_OBJECTS, undefined);
    }

    /**
     * Закрыть окно списка объектов
     * @private
     * @method closeMapObjectsWindow
     */
    closeMapObjectsWindow() {
        this.setState(EXIT_MODE, undefined);
    }

    /**
     * Запустить экспорт в CSV
     * @private
     */
    processItem<K extends keyof GwtkMapObjectTaskState>(action: K, value: GwtkMapObjectTaskState[K]) {
        this.setState(action, value);
    }

    /**
     * Выделить все объекты в карте
     * @method paintSelectedObjectsAll
     * @private
     */
    paintSelectedObjectsAll() {
        this.setState(PAINT_SELECTED_MAP_OBJECTS, undefined);
    }

    /**
     * Получить тип показа списка объектов
     * @private
     * @get
     * @method showObjectsListType
     */
    get showObjectsListType() {
        return this.showMapObjectsListType;
    }

    /**
     * Установить тип показа списка объектов
     * @private
     * @set
     * @method showObjectsListType
     */
    set showObjectsListType(value: MapObjectsViewMode) {
        this.setState(SET_SHOW_MAP_OBJECTS_LIST_TYPE, value);
    }

    setSearchFilter(value: { type: SORTTYPE, value: FINDDIRECTION }) {
        if (this.selectSortType !== value) {
            this.setState(SELECT_SEARCH_FILTER, value);
        }
    }

    setSemanticFilter(value: string) {
        this.setState(SELECT_SORT_SEMANTIC, value);
    }
    toggleExportMenuItem() {
        this.showExportMenu = !this.showExportMenu;
        this.closeOnContentClick = false;
    }

    /**
     * Получить иконку для функций экспорта
     * @method getListItemIcon
     * @private
     * @param value {string} Строковое описание функции
     */

    getListItemIcon(value: string) {
        if (value===EXPORT_TO_CLIPBOARD) {
            return 'mdi-microsoft-word';
        } else if (value===EXPORT_TO_XLSX) {
            return 'mdi-microsoft-excel';
        } else if (value===EXPORT_TO_GEOJSON) {
            return 'mdi-code-json';
        } else return 'mdi-file-delimited';
    }

    get showSemanticValueSelect() {
        return this.selectSortType.type === SORTTYPE.SortBysemanticValue;
    }

    /**
     * Получить и показать количество объектов
     * в зависимость выбранного вида
     * @property showLoadedObjectsCount
     */
    get showLoadedObjectsCount() {
        let countText;
        if (!this.isShowSelectedObjectsList) {
            if (this.showObjectsListType === 'table') {
                countText = ' (' + this.foundObjectsNumber + '/' + this.foundObjectsNumber + ')';
            } else {
                countText = ' (' + this.mapObjectsLength + '/' + this.foundObjectsNumber + ')';
            }
        } else {
            countText = ' (' + this.mapObjectsLength + ')';
        }
        return countText;
    }

    get changeSearchValue() {
        return this.tableParams.searchValue;
    }

    set changeSearchValue( value: string ) {
        if ( value === null ) {
            value = '';
        }

        this.setState( SET_SEARCH_VALUE, value );
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
