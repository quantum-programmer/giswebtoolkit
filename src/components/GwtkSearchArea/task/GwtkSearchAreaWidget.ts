/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Поиск по области"                   *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkSearchAreaTaskState, LayerListItem,
    AREA_SELECTED_LAYERS,
    AREA_ACTION_ID,
    AREA_VISIBLE_BY_SCALE,
    UPDATE_SEARCH_PROGRESS_BAR, ABORT_SEARCH,
    TypeOfSearch,
    SET_SEARCH_TYPE,
    SET_SELECTED_SEARCH_CROSS_OPERATORS,
    START_ADVANCED_SEARCH,
    UnitType,
    SET_SELECTED_UNIT_TYPE,
    SET_DISTANCE_SEARCH,
    CANCEL_SELECT_OBJECT,
    ON_SELECT_ADVANCED_SEARCH,
    SelectObjectType,
    ON_SELECT_OBJECT_TYPE,
    SHOW_ACTIVE_OBJECT,
    LayerIdents
} from '@/components/GwtkSearchArea/task/GwtkSearchAreaTask';
import { ActionMode, ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID } from '~/taskmanager/Action';

/**
 * Компонент "Поиск по области"
 * @class GwtkSearchAreaWidget
 * @extends BaseGwtkVueComponent
 */
@Component( {} )

export default class GwtkSearchAreaWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkSearchAreaTaskState>( key: K, value: GwtkSearchAreaTaskState[K] ) => void;

    @Prop( { default: [] } )
    private readonly layers!: LayerListItem[];

    @Prop( { default: [] } )
    private selectedLayers!: LayerIdents[];

    @Prop({ default: [] })
    searchCrossOperators!: { value: number, text: string }[];

    @Prop({ default: [] })
    selectedSearchCrossOperators!: number[];
    

    @Prop( { default: true } ) searchProgressBar!: boolean;

    @Prop({ default: false }) mapObjectSelected!: boolean;

    @Prop({ default: false }) isAdvancedSearch!: boolean;
    
    @Prop({ default: 0 }) selectSearchType!: TypeOfSearch;

    @Prop({ default: 0 }) selectedUnitType!: UnitType;

    @Prop({ default: 0 }) distanceSearch!: number;

    @Prop({ default: 0 }) selectObjectType!: SelectObjectType;
    
    @Prop( {
        default: []
    } )
    private readonly regimes!: TaskDescription[];

    @Prop( {
        default: true
    } )
    private visibleByScale!: boolean;

    @Prop( {
        default: ''
    } )
    private actionId!: string;

    @Prop( { default: () => ({}) } )
    private readonly modePanel!: ActionModePanel;

    private activeOptionsValue: boolean = false;

    onlyMainServise = true;

    unitsList = [
        {
            value: UnitType.meter,
            text: this.$t('relieflinediagram.m')
        },
        {
            value: UnitType.kilometer,
            text: this.$t('relieflinediagram.km')
        },
    ];

    SelectObjectTypeButtonList = [
        {
            icon: 'mdi-selection-ellipse-arrow-inside',
            text: this.$t('phrases.Point,radius'),
            id: SelectObjectType.point
        },
        {
            icon: 'mdi-selection-drag',
            text: this.$t('phrases.Area of map'),
            id: SelectObjectType.area
        },
        {
            icon: 'mdi-vector-line',
            text: this.$t('phrases.Line'),
            id: SelectObjectType.line
        },
        {
            icon: 'mdi-map-search-outline',
            text: this.$t('phrases.Object of map'),
            id: SelectObjectType.object
        },
    ];

    created() {
        this.checkMainServiceForAllLayers();
    }

    checkMainServiceForAllLayers() {
        for (let i = 0; i < this.selectedLayers.length; i++) {
            const layerId = this.selectedLayers[i].id;
            if (!this.checkMainService(layerId)) {
                break;
            }
        }
    }

    /**
     * Признак поиска с учетом видимости объектов в рисунке
     * @property visibleFlag
     * @return {boolean}
     */
    get visibleFlag() {
        return this.visibleByScale;
    }

    /**
     * Признак поиска с учетом видимости объектов в рисунке
     * @property visibleFlag
     * @param value {boolean}, `true` - учитывать видимость объектов
     */
    set visibleFlag( value: boolean ) {
        this.setState( AREA_VISIBLE_BY_SCALE, value );
    }

    /**
     * Переключить состовние режима выбора области поиска
     * @method toggleRegime
     * @param id {string} Идентификатор режима
     */
    toggleRegime( id: string ) {
        this.setState( AREA_ACTION_ID, id );
    }

    /**
     * Управление карточкой Параметры
     * @property toggleOptions
     */
    toggleOptions() {
        this.showOptions = !this.showOptions;
    }

    showOptions = false;

    /**
     * Заголовок таблицы слоев
     */
    headers = [
        {
            text: this.$t( 'phrases.Layer name' ).toString().toUpperCase(),
            align: 'start',
            sortable: true,
            value: 'alias',
            key: 'id'
        }
    ];

    /**
     * Высота таблицы слоев
     */
    tableHeight = 160;

    /**
     * Список выбранных слоев
     * @property selected
     * @return {Array}, [{id: string}]
     */
    get selected() {
        return this.selectedLayers;
    }

    /**
     * Список выбранных слоев
     * @property selected
     * @param value {{ id: string}[]} выбор в таблице
     * @return {Array} массив идентификаторов слоев
     */
    set selected(value) {
        this.setState(AREA_SELECTED_LAYERS, value);
        this.$nextTick(() => {
            this.onlyMainServise = true;
            this.checkMainServiceForAllLayers();
        });
    }

    /**
     * Список всех слоев для поиска по области
     * @property layerRows
     * @return {Array} массив строк слоев, LayerListItem[]
     */
    get layerRows() {
        if ( this.layers )
            return this.layers;
        return [];
    }

    /**
     *
     */
    get modePanelDescriptions() {
        const result: ActionMode[] = [];

        MODE_PANEL_KEYS.forEach( ( key ) => {
            let modePanel = this.modePanel[ key ];
            if ( modePanel !== undefined ) {
                if ( !(!this.$vuetify.breakpoint.smAndUp && key === SAVE_PANEL_ID) ) {
                    result.push( modePanel );
                }
            }
        } );
        return result;
    }

    /**
     * Закрыли оверлей
     */
    closeOverlay() {
        this.setState( UPDATE_SEARCH_PROGRESS_BAR, false );
        this.setState( ABORT_SEARCH, undefined );
    }

    /**
     * Развернуть параметры
     * @method expandOptions
     */
    expandOptions() {
        this.activeOptionsValue = !this.activeOptionsValue;
    }

    get isCrossTypeOfSearch() {
        return this.selectSearchType === TypeOfSearch.Cross;
    }

    get isDistanceTypeOfSearch() {
        return this.selectSearchType === TypeOfSearch.Distance;
    }

    setCrossingOperator(value: number[]) {
        this.setState(SET_SELECTED_SEARCH_CROSS_OPERATORS, value);
    }

    removeCrossOperator(index: number) {
        const newValue = this.selectedSearchCrossOperators.slice();
        newValue.splice(index, 1);
        this.setCrossingOperator(newValue);
    }

    setSearchByCross() {
        this.inputDistanceSearch(0);
        this.setState(SET_SEARCH_TYPE, TypeOfSearch.Cross);
    }

    setSearchByDistance() {
        this.setCrossingOperator([]);
        this.setState(SET_SEARCH_TYPE, TypeOfSearch.Distance);
    }

    startAdvancedSearch() {
        this.setState(START_ADVANCED_SEARCH, undefined);
    }

    selectUnitType(value: UnitType ) {
        this.setState(SET_SELECTED_UNIT_TYPE, value);
    }

    inputDistanceSearch(value: number) {
        this.setState(SET_DISTANCE_SEARCH, value);
    }

    get checkDisabled() {
        let result = false;
        if (this.isCrossTypeOfSearch && !this.selectedSearchCrossOperators.length) {
            result = true;
        } else if (this.isDistanceTypeOfSearch && (!this.distanceSearch || this.distanceSearch <= 0 )) {
            result = true;
        }
        return result;
    }

    cancelSelectObject() {
        this.setState(CANCEL_SELECT_OBJECT, undefined);
    }

    onSelectAdvancedSearch() {
        this.setState(ON_SELECT_ADVANCED_SEARCH, undefined);
    }

    setObjectType(type: SelectObjectType) {
        this.setState(ON_SELECT_OBJECT_TYPE, type);
    }

    showActiveObject() {
        this.setState(SHOW_ACTIVE_OBJECT, undefined);
    }

    checkMainService(layerId: string) {
        const map = this.mapVue.getMap();
        const serviceUrl = map.options.url;
        const layer = map.getVectorLayerByxId(layerId);
        let result = true;

        if (layer) {
            const layerServiceUrl = layer.serviceUrl;
            if (serviceUrl !== layerServiceUrl) {
                result = false;
                this.onlyMainServise = false;
            }
        }
        return result;
    }
}
