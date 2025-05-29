/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент "Список объектов карты"                 *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Vue} from 'vue-property-decorator';
import {
    GwtkMapObjectTaskState,
    TableParams,
    CLEAR_HIGHLIGHTED_OBJECT,
    FIND_NEXT,
    FIT_OBJECT,
    FIT_MAP_TO_CLUSTER,
    HIGHLIGHT_OBJECT,
    SELECT_CURRENT_MAPOBJECT_CONTENT,
    SELECT_MODE,
    TOGGLE_SELECTED_OBJECT,
    UPDATE_OBJECTS_PROGRESS_BAR,
    VIEW_CLUSTER_LIST,
    SET_SEARCH_VALUE,
    FIND_OBJECTS_BY_SEARCH_VALUE, TOGGLE_REALLY_SELECT_OBJECT
} from '../../../GwtkMapObjectTask';
import MapObject from '~/mapobject/MapObject';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import GwtkMapObjectItem from '../GwtkMapObjectItem/GwtkMapObjectItem.vue';
import {MapObjectPanelState} from '~/taskmanager/TaskManager';

/**
 * Компонент "Список объектов карты"
 * @class GwtkMapObjectListWidget
 * @extends Vue
 */
@Component({components: {GwtkMapObjectItem}})
export default class GwtkMapObjectListWidget extends Vue {
    @Prop({default: ''})
    readonly taskId!: string;

    @Prop({default: () => ({})})
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({default: () => ([])})
    readonly mapObjects!: MapObject[];

    @Prop({default: () => ([])})
    readonly mapObjectsSelected!: MapObject[];

    @Prop({ default: () => ([]) }) reallySelectedObjects!: MapObject[];

    @Prop({default: () => MapObjectPanelState.showObjects})
    readonly mapObjectsState!: MapObjectPanelState;

    @Prop({default: 0})
    readonly foundObjectsNumber!: number;

    @Prop({default: () => ([])})
    readonly selectedMapObjects!: MapObject[];

    @Prop({default: () => ''})
    readonly drawnObjectId!: string;

    @Prop({default: () => ({})})
    readonly tableParams!: TableParams;

    @Prop({ default: () => ({}) })
    readonly mapObject!: MapObject | null;

    @Prop( { default: false } )
    private readonly isReducedSizeInterface!: boolean;

    @Prop({default: false})
    readonly editingMode!: boolean;

    get itemHeight() {
        return !this.isReducedSizeInterface ? '92px' : '72px';
    }

    created() {
        this.setState(UPDATE_OBJECTS_PROGRESS_BAR, false);
    }

    // Решение проблемы при изменении высоты v-virtual-scroll

    resizeObserver: ResizeObserver | null = null;

    scroll() {
        const virtualScroll = this.$refs.virtualScroll as Vue;
        const el = virtualScroll.$el;
        el.scrollTop += 10;
        el.scrollTop -= 10;
    }

    mounted() {
        const container = (this.$refs.container as HTMLDivElement);
        this.resizeObserver = new ResizeObserver(() => this.scroll());
        this.resizeObserver.observe(container);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    get containerHeight() {
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            return 'calc(100% - 60px)';
        } else {
            return this.mapObjects.length < this.foundObjectsNumber ? 'calc(100% - (2.6em + 60px))' : 'calc(100% - 60px)';
        }
    }

    /**
     * Создать экземпляр расширенного описания объекта карты
     * @method createMapObjectContent
     * @param mapObject {MapObject} Объект карты
     * @return {MapObjectContent} Экземпляр расширенного описания объекта карты
     */
    createMapObjectContent(mapObject: MapObject) {
        return new MapObjectContent(mapObject);
    }

    /**
     * Развернуть/свернуть описание объекта карты
     * @method toggleMapObject
     * @param mapObjectId {number} Индекс объекта карты в массиве
     */
    toggleMapObject(mapObjectId: string) {
        let mapObject: MapObject | undefined;
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            mapObject = this.mapObjectsSelected.find(item => item.id === mapObjectId);
        } else {
            mapObject = this.mapObjects.find(item => item.id === mapObjectId);
        }
        if (mapObject && mapObject.isEmptyClusterObject) {
            this.setState(FIT_MAP_TO_CLUSTER, mapObject);
        } else if (mapObjectId === this.drawnObjectId) {
            this.setState(CLEAR_HIGHLIGHTED_OBJECT, undefined);
        } else if (mapObject) {
            this.setState(HIGHLIGHT_OBJECT, mapObject);
            this.setState(FIT_OBJECT, mapObject);
        }
    }

    /**
     * Запросить следующую порцию объектов
     * @method findNext
     */
    findNext() {
        this.setState(FIND_NEXT, undefined);
    }

    /**
     * Переключаться между списком объектов и просмотром информации об объекте
     * @method toggleMapObjectInformation
     * @param mapObject {MapObject} объект карты
     */
    toggleMapObjectInformation(mapObject: MapObject) {
        if (mapObject.isEmptyClusterObject) {
            this.setState(VIEW_CLUSTER_LIST, mapObject);
        } else {
            this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, mapObject);
            this.setState(SELECT_MODE, MapObjectPanelState.showInfo);
        }
    }

    /**
     * Выбрать объекты карты
     * @method selectMapObjects
     * @param mapObjectId {string} Идентификатор объекта карты
     */
    selectMapObjects(mapObjectId: string) {
        this.setState(TOGGLE_SELECTED_OBJECT, mapObjectId);
    }


    toggleSelectOrUnselect(mapObject: MapObject) {
        this.setState(TOGGLE_REALLY_SELECT_OBJECT, mapObject);
    }

    /**
     * Получить список для кластеризованных объектов
     * @property mapObjectsList
     * @return MapObject[]
     */
    get mapObjectsList(): MapObject[] {
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            return this.mapObjectsSelected.filter(mapObject => !mapObject.isClusterObject);
        }
        return this.mapObjects.filter(mapObject => !mapObject.isClusterObject);
    }

    /**
     * Получить количество объектов в кластере
     * @private
     * @method getClusteredObjectsLength
     * @param currentObject {MapObject} - Объект карты
     * @return number
     */
    getClusteredObjectsCount(currentObject: MapObject): number {
        let objectsLength = 0;
        if (currentObject.isEmptyClusterObject) {
            const clusterId = currentObject.clusterId;
            const mapId = currentObject.mapId;

            let mapObjects;
            if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
                mapObjects = this.mapObjectsSelected;
            } else {
                mapObjects = this.mapObjects;
            }
            mapObjects.forEach(mapObject => {
                if (mapObject.isClusterObject && mapObject.clusterIdRef === clusterId && mapObject.mapId === mapId) {
                    objectsLength += 1;
                }
            });
        }

        return objectsLength;
    }

    get isLoadMore() {
        let mapObjects;
        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            mapObjects = this.mapObjectsSelected;
        } else {
            mapObjects = this.mapObjects;
        }
        return mapObjects.length < this.foundObjectsNumber;
    }

    get changeSearchValue() {
        return this.tableParams.searchValue;
    }

    set changeSearchValue(value: string | null) {
        if (value === null) {
            value = '';
        }

        this.setState(SET_SEARCH_VALUE, value);

        if (this.mapObjectsState === MapObjectPanelState.showSelectedObjects) {
            this.setState(FIND_OBJECTS_BY_SEARCH_VALUE, undefined);
        }
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
     * @private
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
