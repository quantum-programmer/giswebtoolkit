/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Поиск"                          *
 *                                                                  *
 *******************************************************************/

import Task, {ActionDescription} from '~/taskmanager/Task';
import {AddressServiceType, SearchType} from '~/types/Options';
import SearchManager, {GISWebServiceSEMode, SourceType} from '~/services/Search/SearchManager';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkSearchWidget from '@/components/GwtkSearch/task/GwtkSearchWidget.vue';
import SearchItemsDescription from '@/components/GwtkSearch/task/SearchItemsDescription';
import {MapObjectPanelState} from '~/taskmanager/TaskManager';
import i18n from '@/plugins/i18n';
import PickPointAction, {SET_COORDINATE_IN_POINT} from '~/systemActions/PickPointAction';
import PixelPoint from '~/geometry/PixelPoint';
import {LogEventType} from '~/types/CommonTypes';
import GeoPoint from '~/geo/GeoPoint';
import {Bounds} from '~/geometry/Bounds';
import {PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS} from '~/utils/WorkspaceManager';

export const UPDATE_ADDRESS_SERVICE = 'gwtksearch.updateaddressservice';
export const START_SEARCH = 'gwtksearch.startsearch';
export const CHANGE_SEARCH_MODE = 'gwtksearch.changesearchmode';
export const CHANGE_VISIBLE_ON_SCALE = 'gwtksearch.changevisibleonscale';
export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtksearch.searchrogressbar';
export const UPDATE_SEARCH_TEXT = 'gwtksearch.updatesearchtext';
export const ABORT_SEARCH = 'gwtksearch.abortsearch';
export const SELECT_POINT_ACTION = 'gwtksearch.selectpointaction';

export type GwtkSearchTaskState = {
    [UPDATE_ADDRESS_SERVICE]: AddressServiceType;
    [START_SEARCH]: undefined;
    [CHANGE_SEARCH_MODE]: SearchType;
    [CHANGE_VISIBLE_ON_SCALE]: WidgetParams['visibleOnCurrentScale'];
    [UPDATE_SEARCH_PROGRESS_BAR]: boolean;
    [UPDATE_SEARCH_TEXT]: string;
    [ABORT_SEARCH]: undefined;
    [SELECT_POINT_ACTION]: boolean;
    [SET_COORDINATE_IN_POINT]: PixelPoint;
}

type WidgetParams = {
    setState: GwtkSearchTask['setState'];
    visibleOnCurrentScale: boolean; // поиск только видимых объектов в текущем м-бе
    searchSourceDescription: SearchItemsDescription;
    searchProgressBar: boolean;
    searchText: string;
    actionDescription: ActionDescription;
}

/**
 * Компонент "Поиск"
 * @class GwtkSearchTask
 * @extends Task
 * @description Поиск объекта карты, адреса или кадастрового номера на карте.
 * Виды поиска:
 * 1) Поиск объекта карты - поиск выполняется по семантикам объектов карты,
 * указанных в настройках каждого слоя. Опция "Только видимые" ограничивает
 * условия поиска только видимыми в текущем масштабе объектами.
 * 2) Поиск по адресу - Поиск адреса выполняется через выбранный адресный
 * сервис. Карта позиционируется по координатам, соответствующим найденному
 * адресу.
 * 3) Поиск по кадастровому номеру - поиск выполняется на сайте Росреестра. Карта
 * позиционируется по координатам, соответствующим найденному адресу.
 *
 */
export default class GwtkSearchTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private geoPoint?: GeoPoint;

    /**
     * @constructor GwtkMapContentTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);


        this.actionRegistry.push({
            getConstructor() {
                return PickPointAction;
            },
            id: SELECT_POINT_ACTION,
            active: false,
            enabled: true
        });

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),

            setState: this.setState.bind(this),
            visibleOnCurrentScale: true,
            searchSourceDescription: new SearchItemsDescription(this.map.options),
            searchProgressBar: false,
            searchText: '',
            actionDescription: this.getActionDescription(SELECT_POINT_ACTION)!
        };
    }

    createTaskPanel() {

        // регистрация Vue компонента
        const nameWidget = 'GwtkSearchWidget';
        const sourceWidget = GwtkSearchWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);

        this.setState(CHANGE_SEARCH_MODE, SearchType.Map);
    }

    setup() {
        if (!this.map.options.search_options || !this.map.options.search_options.address) {
            this.mapWindow.getTaskManager().detachTask(this.id);
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Component not configured'));
        }
    }

    private get configurationIsValid() {
        let result = true;
        // if (this.widgetProps.searchSourceDescription.isAddressSearch) {
        //     const searchServiceAlias = this.widgetProps.searchSourceDescription.activeAddressModeDescription.text;
        //     const source_options = this.map.options.search_options?.address.sources.find(sourse => sourse.alias === searchServiceAlias);
        //     if (source_options) {
        //         result = !source_options.access || !!source_options.access.value;
        //     } else {
        //         result = false;
        //     }
        // }
        return result;
    }

    setState<K extends keyof GwtkSearchTaskState>(key: K, value: GwtkSearchTaskState[ K ]) {

        switch (key) {
            case UPDATE_ADDRESS_SERVICE:
                this.widgetProps.searchSourceDescription.activeAddressSearchServiceId = value as AddressServiceType;
                this.updateSearchTextFromPoint();
                break;
            case START_SEARCH:
                if (this.configurationIsValid) {
                    this.searchViaSearchManager();
                } else {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Component not configured'));
                }
                break;
            case CHANGE_SEARCH_MODE:
                this.widgetProps.searchSourceDescription.activeSearchModeId = value as SearchType;
                this.updateSearchTextFromPoint();
                break;
            case CHANGE_VISIBLE_ON_SCALE:
                this.widgetProps.visibleOnCurrentScale = !value as WidgetParams['visibleOnCurrentScale'];
                break;
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case ABORT_SEARCH:
                // this.searchViaSearchManager();
                this.abortSearch();
                break;
            case UPDATE_SEARCH_TEXT:
                this.widgetProps.searchText = value as string;
                this.geoPoint = undefined;
                break;
            case SELECT_POINT_ACTION:
                if (value) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Pick a point on the map'));
                }
                if (value) {
                    this.doAction(key);
                } else {
                    this.quitAction(key);
                }
                break;
            case SET_COORDINATE_IN_POINT:
                this.geoPoint = this.map.pixelToGeo(value as PixelPoint);
                this.updateSearchTextFromPoint();
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    private updateSearchTextFromPoint() {
        if (this.geoPoint) {
            this.widgetProps.searchText = `${parseFloat(this.geoPoint.getLatitude().toFixed(6))} ${parseFloat(this.geoPoint.getLongitude().toFixed(6))}`;
        }
    }

    /**
     * Прервать поиск
     * @method abortSearch
     */
    private abortSearch() {
        const searchManager = this.mapWindow.getMap().searchManager as SearchManager;
        searchManager.stopSearch();
    }

    /**
     * Поиск объектов
     * @method searchViaSearchManager
     */
    private searchViaSearchManager() {
        if (this.widgetProps.actionDescription.active) {
            window.setTimeout(() => this.quitAction(SELECT_POINT_ACTION), 5);
        }

        const text = this.widgetProps.searchText;
        const sourceType = this.widgetProps.searchSourceDescription.sourceType;
        if (sourceType === undefined) {
            return;
        }

        this.map.clearActiveObject();

        const searchManager = this.mapWindow.getMap().searchManager as SearchManager;

        let geoPoint;
        const regex = /(\d+\.\d*)[,\s](\d+\.\d*)/gm;
        const m = regex.exec(text);
        if (m && m[1] !== undefined && m[2] !== undefined) {
            geoPoint = new GeoPoint(parseFloat(m[2]), parseFloat(m[1]));
        }

        if (sourceType === SourceType.GISWebServiceSE && geoPoint) {
            const point = this.map.geoToPixel(geoPoint);
            searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.StrictSearch, undefined, point);

        } else {
            searchManager.activateSource(sourceType, GISWebServiceSEMode.TextSearch);
        }

        searchManager.clearSearchCriteriaAggregator();
        const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();

        if (geoPoint) {
            if (sourceType === SourceType.GISWebServiceSE) {

                const point = this.map.geoToPixel(geoPoint);

                const radius = this.map.workspaceManager.getValue(PROJECT_SETTINGS_OBJECT_SEARCH_PIXEL_RADIUS);

                const leftBottomPoint = point.clone();
                leftBottomPoint.x -= radius;
                leftBottomPoint.y += radius;
                const leftBottomPlanePoint = this.map.pixelToPlane(leftBottomPoint);

                const rightTopPoint = point.clone();
                rightTopPoint.x += radius;
                rightTopPoint.y -= radius;
                const rightTopPlanePoint = this.map.pixelToPlane(rightTopPoint);

                const bboxSearchCriterion = criteriaAggregatorCopy.getBboxSearchCriterion();
                bboxSearchCriterion.clearValue();
                const bounds = new Bounds(leftBottomPlanePoint, rightTopPlanePoint);
                bboxSearchCriterion.setValue(bounds);
                criteriaAggregatorCopy.setBboxSearchCriterion(bboxSearchCriterion);
            } else {
                const isOsm = this.widgetProps.searchSourceDescription.activeSearchModeId === SearchType.Address && this.widgetProps.searchSourceDescription.activeAddressSearchServiceId === AddressServiceType.Osm;
                const text = isOsm ? `${geoPoint.getLatitude()},${geoPoint.getLongitude()}` : `${geoPoint.getLongitude()},${geoPoint.getLatitude()}`;

                const textSearchCriterion = criteriaAggregatorCopy.getTextSearchCriterion();
                textSearchCriterion.addTextSearchKey(['Text'], text);
            }
        } else {
            const textSearchCriterion = criteriaAggregatorCopy.getTextSearchCriterion();
            textSearchCriterion.addTextSearchKey(['Text'], text);
            if (sourceType === SourceType.Nspd) {
                textSearchCriterion.addTextSearchKey(['thematicSearchId'], '1');
            }
        }


        if (this.widgetProps.visibleOnCurrentScale) {
            const scale = this.mapWindow.getMap().getZoomScale(this.mapWindow.getMap().getZoom());
            if (scale) {
                const objScaleCriterion = criteriaAggregatorCopy.getObjectScaleSearchCriterion();
                objScaleCriterion.setValue(scale);
                criteriaAggregatorCopy.setObjectScaleSearchCriterion(objScaleCriterion);
            }
        }

        const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

        this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);
        searchManager.findNext().then(() => {
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.t('phrases.Search') + '. ' + i18n.t('phrases.Error'),
                description: error,
                type: LogEventType.Error
            });
        }).finally(() => {
            this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showObjects);
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        });

    }
}
