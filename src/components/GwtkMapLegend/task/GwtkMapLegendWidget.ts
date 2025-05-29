/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Виджет компонента "Легенда карты"                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    ACTIVATE_DRAWING_TYPE_BUTTON,
    CHANGE_CURRENT_MAP_LAYER_ID,
    FINISH_SELECT_LEGEND_ITEM,
    SET_CREATING_OBJECT_TYPE,
    SET_SELECTED_LEGEND_ITEM,
    TOGGLE_CURRENT_MAP_LEGEND_ITEM,
    SHOW_SEARCH,
    ON_INPUT_SEARCH,
    SET_SHOW_LEGENDS_TYPE,
    ACROSS_ALL_ACTIVE_LAYERS,
    TOGGLE_READ_ONLY_MODE,
    GwtkMapLegendItemWrapper,
    GwtkMapLegendTaskState,
    MapLayerWithLegendDescription, LegendViewMode
} from './GwtkMapLegendTask';
import GwtkMapLegendItem from './components/LegendItems/GwtkMapLegendItem';
import { LayerIdLegendMode, LEGEND_SHOW_MODE } from './components/LegendItems/Types';
import { ClassifierObject } from './components/LegendItems';
import { LEGEND_OBJECT_DRAWING_TYPE , MapMarkersCommandsFlags, MarkerImageCategory, MarkerIcon } from '~/types/Types';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import { LOCALE } from '~/types/CommonTypes';
import Style from '~/style/Style';
import GwtkGraphicObjectParamsWidget
    from '../task/components/GraphicObjectParams/GwtkGraphicObjectParamsWidget.vue';
import GwtkMapLegendGroupWidget from '../task/components/LegendGroup/GwtkMapLegendGroupWidget.vue';
import GwtkMapLegendListWidget from '../task/components/LegendList/GwtkMapLegendListWidget.vue';
import GwtkMapLegendToolbar from '../task/components/Toolbar/GwtkMapLegendToolbar.vue';
import GwtkMapLegendTreeWidget from '../task/components/LegendTree/GwtkMapLegendTreeWidget.vue';
import Layer from '~/maplayers/Layer';
import RenderableLayer from '~/maplayers/RenderableLayer';
import i18n from '@/plugins/i18n';


@Component({
    components: {
        GwtkGraphicObjectParamsWidget,
        GwtkMapLegendGroupWidget,
        GwtkMapLegendListWidget,
        GwtkMapLegendTreeWidget,
        GwtkMapLegendToolbar
    }
})
export default class GwtkMapLegendWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapLegendTaskState>(key: K, value: GwtkMapLegendTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly buttons!: TaskDescription[];

    @Prop({ default: () => ({}) })
    private readonly currentMapLegendItemWrapper!: GwtkMapLegendItemWrapper;

    @Prop({ default: () => [] })
    private readonly legendItemWrapperList!: GwtkMapLegendItemWrapper[];

    @Prop({ default: () => [] })
    private readonly mapLayersWithLegendDescriptions!: MapLayerWithLegendDescription[];

    @Prop({ default: '' })
    private readonly selectedMapLayerId!: string;

    @Prop({ default: () => ({}) })
    private readonly legendShowMode!: LEGEND_SHOW_MODE;

    @Prop({ default: false })
    private readonly layerIsLocked!: boolean;

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemSelected!: GwtkMapLegendItem;

    @Prop({ default: () => ({}) })
    private readonly mapLegendItemsSelectedList!: GwtkMapLegendItem[];

    @Prop({ default: () => ({}) })
    private readonly creatingObjectType!: LOCALE;

    @Prop({ default: () => ({}) })
    private readonly styleOptions!: Style;

    @Prop({ default: undefined })
    private readonly activeRequestCancelHandler!: () => void;

    @Prop({ default: false })
    private readonly disabledTab!: boolean;

    @Prop({ default: () => ([]) })
    private readonly markerImageList!: MarkerIcon[];

    @Prop({ default: () => ([]) })
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop({ default: () => ({}) })
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    @Prop({ default: '' })
    private readonly previewImageSrc!: string;

    @Prop({ default: false })
    private readonly showSearch!: boolean;

    @Prop({ default: '' })
    private readonly selectedShowLegendsType!: LegendViewMode;

    @Prop({ default: '' })
    private readonly searchValue!: string;

    @Prop({ default: () => ({}) })
    private readonly searchResult!: GwtkMapLegendItem[];

    @Prop({ default: [] })
    readonly openTreeElement!: string[];

    @Prop({ default: false })
    private readonly isVisibilityAvailable!: boolean;

    @Prop({ default: false })
    private readonly allActiveLayers!: boolean;

    /**
     * Поиск в дереве легенды по имени объекта
     */
    private searchObjectValue = '';

    private searchActiveValue = false;

    private allLayersItem = {
        layerId: 'allLayersId',
        layerName: i18n.tc('legend.Across all active layers')
    };

    private selectedShowLegendsTypePrev: LegendViewMode = LegendViewMode.Tree;

    get layers() {
        return [...this.mapLayersWithLegendDescriptions, this.allLayersItem];
    }

    activateDrawingTypeButton(buttonId: LEGEND_OBJECT_DRAWING_TYPE) {
        this.setState(ACTIVATE_DRAWING_TYPE_BUTTON, buttonId);
    }

    get layerSelectIsDisabled() {
        return this.layerIsLocked || this.creatingObjectMode;
    }

    get creatingObjectMode() {
        return (this.legendShowMode === LEGEND_SHOW_MODE.ItemSelectionMode);
    }

    get readOnlyMode() {
        return (this.legendShowMode === LEGEND_SHOW_MODE.ReadOnlyMode);
    }

    get layerStyleSettingsMode() {
        return this.legendShowMode === LEGEND_SHOW_MODE.LayerStyleSettingsMode;
    }
    
    toggleReadonlyMode() {
        this.setState(TOGGLE_READ_ONLY_MODE, undefined);
    }

    get currentMapLegendItem(): GwtkMapLegendItem | null {
        return this.currentMapLegendItemWrapper.mapLegendItem;
    }

    changeLayerId(layerId: string) {
        if (layerId !== this.allLayersItem.layerId) {
            const legend: LayerIdLegendMode = { layerId: layerId, mode: this.legendShowMode };
            this.setState(CHANGE_CURRENT_MAP_LAYER_ID, legend);
        } else {
            this.setState(ACROSS_ALL_ACTIVE_LAYERS, undefined);
        }
    }

    changeCurrentLegendItem(mapLegendItem: GwtkMapLegendItem) {
        this.setState(TOGGLE_CURRENT_MAP_LEGEND_ITEM, mapLegendItem as ClassifierObject);
    }

    toggleSelect() {
        this.setState(SET_SELECTED_LEGEND_ITEM, true);
    }

    toggleFinish() {
        this.setState(FINISH_SELECT_LEGEND_ITEM, true);
    }

    /**
     * Поиск в дереве легенды по имени объекта
     * @method searchObject
     */
    get searchObject() {
        return this.searchObjectValue;
    }

    /**
     * Поиск в дереве легенды по имени объекта
     * @method searchObject
     * @param value
     */
    set searchObject(value: string) {
        this.searchObjectValue = value;
    }

    /**
     * Поиск в дереве легенды по имени объекта
     * @method  searchActive
     */
    get searchActive() {
        return this.searchActiveValue;
    }

    /**
     * Поиск в дереве легенды по имени объекта
     * @method searchActive
     * @param value
     */
    set searchActive(value: boolean) {
        this.searchActiveValue = value;
    }

    /**
     * Активация поиска в дереве легенды по имени объекта
     * @method toggleActivateSearch
     */
    toggleActivateSearch() {
        this.searchActiveValue = !this.searchActiveValue;
        if (!this.searchActiveValue) {
            this.searchObjectValue = '';
        }
    }

    /**
     * Класс кнопки поиска
     * @method classSearchActiveBtn
     */
    get classSearchActiveBtn() {
        return this.searchActive ? 'disabled-item' : '';
    }

    get mapLayer(): Layer | undefined {
        let mapLayer = this.mapVue.getMap().tiles.getLayerByxId(this.selectedMapLayerId);

        if (!mapLayer) {
            mapLayer = this.mapVue.getMap().vectorLayers.find(layer => layer.id === this.selectedMapLayerId);
        }
        return mapLayer;
    }

    /**
     *
     */
    get isGraphicLayer() {
        return this.mapLayer instanceof GeoJsonLayer;
    }

    get isClassifierObject() {
        return this.creatingObjectType === LOCALE.Template;
    }

    setClassifierObjectType() {
        this.setState(SET_CREATING_OBJECT_TYPE, LOCALE.Template);
    }

    setGraphicObjectTypeLine() {
        if (!this.disabledTab) {
            this.setState(SET_CREATING_OBJECT_TYPE, LOCALE.Line);
        }
    }

    get showCreateObject() {

        if (this.creatingObjectMode) {
            const mapLayer = this.mapLayer;
            if (mapLayer) {
                return mapLayer.isEditable;
            }
        }
        return false;
    }

    get hasNoLegend() {
        const mapLayer = this.mapLayer;
        if (mapLayer) {
            return mapLayer instanceof RenderableLayer;
        }
        return true;
    }

    get activeTab() {
        if (this.creatingObjectType === LOCALE.Template) {
            return 0; // таб "Объекты карты"
        } else {
            return 1; // таб "Графический объект"
        }
    }

    set activeTab(value: number) {
        if (value === 0) {
            this.setState(SET_CREATING_OBJECT_TYPE, LOCALE.Template);
        } else {
            this.setState(SET_CREATING_OBJECT_TYPE, LOCALE.Line);
        }
    }

    get selectEnabled() {
        return this.mapLegendItemSelected || this.creatingObjectType !== LOCALE.Template;
    }

    clickShowSearch() {
        if (!this.showSearch) {
            this.selectedShowLegendsTypePrev = this.showLegendsType;
            this.showLegendsType = LegendViewMode.Group;
        } else {
            this.showLegendsType = this.selectedShowLegendsTypePrev;
        }
        this.setState(SHOW_SEARCH, undefined);
    }

    onInputSearch(value: string) {
        this.setState(ON_INPUT_SEARCH, value);
    }

    /**
     * Получить тип показа списка легенд
     * @get
     * @method showLegendsType
     */
    get showLegendsType():LegendViewMode {
        return this.selectedShowLegendsType;
    }

    /**
     * Установить тип показа списка легенд
     * @set
     * @method showLegendsType
     */
    set showLegendsType(value: LegendViewMode) {
        this.setState(SET_SHOW_LEGENDS_TYPE, value);
    }

    get isGroupMode() {
        return this.showLegendsType === LegendViewMode.Group;
    }
    get isListMode() {
        return this.showLegendsType === LegendViewMode.List;
    }

}
