/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент "Параметры"                      *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkMapOptionsTaskState,
    OPTIONS_APPLY,
    OPTIONS_RESET,
    PROJECT_OPTIONS_APPLY,
    PROJECT_OPTIONS_RESET,
    ProjectMapLayers,
    CursorCoordinateSystemParam,
    UIParams,
    ProgramParameters,
    DELETE_PROJECT_PARAMETERS,
    CHANGE_TYPE_USER_SETTINGS,
    FORM_PROJECT_USER_SETTINGS, TypeOfParameter,
    MapLegendParams,
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import {
    MeasurementsStyle,
    MeasurementUnits,
    ObjectSelectionStyle,
    CursorCoordinateUnit,
    ObjectSearch
} from '~/utils/WorkspaceManager';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import GwtkMapOptionsParameters
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParameters.vue';
import GwtkMapOptionsProjects
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsProjects/GwtkMapOptionsProjects.vue';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';

/**
 * Компонент "Объекты карты"
 * @class GwtkMapOptionsMain
 * @extends BaseGwtkVueComponent
 */
@Component({ components: { GwtkMapOptionsParameters, GwtkMapOptionsProjects } })
export default class GwtkMapOptionsMain extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>(key: K, value: GwtkMapOptionsTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly userParameters!: ProgramParameters;

    @Prop({ default: () => ({}) })
    private readonly projectParameters!: ProgramParameters;

    @Prop({ default: 0 })
    private readonly refreshInterval!: number;

    @Prop({ default: '' })
    private readonly typeOfParameter!: TypeOfParameter;

    @Prop({ default: '' })
    private readonly cursorCoordinateSystem!: CursorCoordinateUnit;

    @Prop({ default: () => ({}) })
    private readonly cursorCoordinateParams!: CursorCoordinateSystemParam;

    @Prop({ default: () => ({}) })
    private readonly units!: MeasurementUnits;

    @Prop({ default: () => ({}) })
    private readonly objectSelection!: ObjectSelectionStyle;

    @Prop({ default: () => ({}) })
    private readonly objectSearch!: ObjectSearch;

    @Prop({ default: () => ({}) })
    private readonly measurements!: MeasurementsStyle;

    @Prop({ default: () => ([]) })
    private readonly projectMapLayers!: ProjectMapLayers[];

    @Prop({ default: () => ({}) })
    private readonly ui!: UIParams;

    @Prop({ default: () => ({}) })
    private readonly searchFilterSettings!: {
        type: string,
        semantic: string,
        direction: string
    };

    @Prop({ default: () => ({}) })
    private readonly sortTypes!: {
        type: {
            text: string,
            type: SORTTYPE
        }[],
        direction: {
            direction: FINDDIRECTION,
            text: string
        }[],
    };    

    /**
     * Текущий элемент слоя карты
     * @property currentMapLayerItem {GwtkMapLayerItem | null}
     */
    private currentMapLayerItem: GwtkGroupLayerItem | null = null;

    /**
     * Текущая вкладка
     * @property tabOptions {string}
     */
    tabOptions = 'tab_parameters';

    created() {
        const map = this.mapVue.getMap();
        let rootContentTreeItem = map.mapProject.projectContentTree;
        this.currentMapLayerItem = GwtkMapLayerFactory.createMapLayerItem(map, rootContentTreeItem, null) as GwtkGroupLayerItem;
    }

    onMapLayerItemClicked(mapLayerItem: GwtkMapLayerItem) {
        if (mapLayerItem.isGroupItem) {
            this.currentMapLayerItem = mapLayerItem as GwtkGroupLayerItem;
        }
    }

    onBackButtonClicked() {
        if (this.currentMapLayerItem) {
            this.currentMapLayerItem = this.currentMapLayerItem.parentItem;
        }
    }

    /**
     * Применить изменения
     * @private
     * @method settingsApply
     */
    private settingsApply() {
        if (this.tabOptions === 'tab_parameters' || this.tabOptions === 'tab_project_parameters') {
            this.setState(OPTIONS_APPLY, this.tabOptions);
        } else if (this.tabOptions === 'tab_projects') {
            this.setState(PROJECT_OPTIONS_APPLY, undefined);
        }
    }

    /**
     * Сбросить все изменения
     * @private
     * @method settingsReset
     */
    private settingsReset() {
        if (this.tabOptions === 'tab_parameters' || this.tabOptions === 'tab_project_parameters') {
            this.setState(OPTIONS_RESET, this.tabOptions);
        } else if (this.tabOptions === 'tab_projects') {
            this.setState(PROJECT_OPTIONS_RESET, undefined);
        }
    }

    /**
     * Переключить тип параметра
     * @private
     * @method formProjectUserSettings
     */
    private formProjectUserSettings() {
        this.setState(CHANGE_TYPE_USER_SETTINGS, this.typeOfParameter);
        this.setState(FORM_PROJECT_USER_SETTINGS, null);
    }

    /**
     * Удалить параметры проекта
     * @private
     * @method deleteParameters
     */
    private deleteParameters() {
        this.setState(DELETE_PROJECT_PARAMETERS, undefined);
    }
    /**
     * Определить в каких настройках работаем
     * @method isDefaultUserSettings
     */
    get isDefaultUserSettings() {
        return this.typeOfParameter === TypeOfParameter.User;
    }


}
