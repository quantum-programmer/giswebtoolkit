/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент Построение буферных зон               *
 *                                                                  *
 *******************************************************************/

import Task, {ActionDescription} from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkBuilderOfZoneWidget from '@/components/GwtkBuilderOfZone/task/GwtkBuilderOfZoneWidget.vue';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {BuildZoneParams} from '~/services/RequestServices/RestService/Types';
import {SEVERALOBJ} from '~/services/RequestServices/common/enumerables';
import GeoJSON, {FeatureType, GeoJsonType} from '~/utils/GeoJSON';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import {ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID} from '~/utils/MapTreeJSON';
import SelectBuilderOfZoneObjectAction from '@/components/GwtkBuilderOfZone/action/SelectBuilderOfZoneObjectAction';
import i18n from '@/plugins/i18n';
import Style from '~/style/Style';
import Fill from '~/style/Fill';
import {LogEventType} from '~/types/CommonTypes';
import Stroke from '~/style/Stroke';
import {GISWebServiceSEMode, SourceType} from '~/services/Search/SearchManager';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import Utils from '~/services/Utils';

export const HIGHLIGHT_MODE_ACTION = 'gwtkbuilderofzone.highlightobject';
export const UPDATE_CHECK_AROUND_ALL = 'gwtkbuilderofzone.updatecheckaroundall';
export const UPDATE_SEW_ZONE_CHECK = 'gwtkbuilderofzone.updatesewzonecheck';
export const UPDATE_SEARCH_OBJECTS_CHECK = 'gwtkbuilderofzone.updatesearchobjectscheck';
export const UPDATE_RADIUS = 'gwtkbuilderofzone.updateradius';
export const UPDATE_UNITS = 'gwtkbuilderofzone.updateunits';
export const UPDATE_BUFFER_ZONE_NAME = 'gwtkbuilderofzone.updatebufferzonename';
export const UPDATE_MSG_OBJECT_NAME = 'gwtkbuilderofzone.updatemsgobjectname';
export const CREATE_BUFFER_ZONE = 'gwtkbuilderofzone.createbufferzone';
export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtkbuilderofzone.searchrogressbar';
export const ABORT_SEARCH = 'gwtkbuilderofzone.abortsearch';
export const UPDATE_SELECT_ACTION_ACTIVE = 'gwtkbuilderofzone.selectactionactive';

export type GwtkBuilderOfZoneTaskState = {
    [UPDATE_CHECK_AROUND_ALL]: WidgetParams['checkAroundAll'];        // обновление признака построить зону вокруг всех выбранных объектов
    [UPDATE_SEW_ZONE_CHECK]: WidgetParams['checkSewZone'];            // обновление признака сшивания зон
    [UPDATE_SEARCH_OBJECTS_CHECK]: WidgetParams['checkSewZone'];      // обновление признака поиска объекта
    [UPDATE_RADIUS]: WidgetParams['zoneRadiusValue'];                 // обновление радиуса на форме
    [UPDATE_UNITS]: WidgetParams['units'];                            // обновление единиц измерения на форме
    [UPDATE_BUFFER_ZONE_NAME]: WidgetParams['bufferZoneNameVal'];     // обновление имени буферной зоны
    [UPDATE_MSG_OBJECT_NAME]: undefined;           // обновление сообщения о выборе объекта
    [CREATE_BUFFER_ZONE]: string;                                     // запустить создание буферной зоны
    [HIGHLIGHT_MODE_ACTION]: boolean;
    [UPDATE_SEARCH_PROGRESS_BAR]: boolean;
    [ABORT_SEARCH]: undefined;
    [UPDATE_SELECT_ACTION_ACTIVE]: undefined;
}

type WidgetParams = {
    setState: GwtkBuilderOfZoneTask['setState'];
    checkAroundAll: boolean;        // признак построить зону вокруг всех выбранных объектов
    checkSewZone: boolean;          // признак сшивания зон
    checkSearchObjects: boolean;    // признак поиска объектов
    zoneRadiusValue: string;
    units: string;
    bufferZoneNameVal: string;         // Имя буферной зоны
    txtObjectName: string;
    searchProgressBar: boolean;
    searchObjectDisabled: boolean;
    actionDescription: ActionDescription | undefined;
}

enum CrossMethodType {
    crosssquare = 'AREASEEKCROSSSQUARE'
}


/**
 * Компонент "Построение буферной зоны"
 * @class GwtkBuilderOfZoneTask
 * @extends Task
 * @description
 */
export default class GwtkBuilderOfZoneTask extends Task {
    numberZone = 1;
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    canShowObjectPanel = false;

    /**
     * @constructor GwtkBuilderOfZoneTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.actionRegistry.push({
            getConstructor() {
                return SelectBuilderOfZoneObjectAction;
            },
            id: HIGHLIGHT_MODE_ACTION,
            active: false,
            enabled: true
        });

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            checkAroundAll: false,        // признак построить зону вокруг всех выбранных объектов
            checkSewZone: false,           // признак сшивания зон
            checkSearchObjects: false,     // признак поиска объектов
            zoneRadiusValue: '0',
            units: 'km',
            bufferZoneNameVal: i18n.t('phrases.Buffer zone ') + '1',
            txtObjectName: '',
            searchProgressBar: false,
            searchObjectDisabled: false,
            actionDescription: this.getActionDescription(HIGHLIGHT_MODE_ACTION)
        };

        const validObjects = this.getValidObjects();

        const count = this.map.getSelectedObjects().length;
        this.map.clearSelectedObjects();

        this.map.addSelectedObjects(validObjects);
        if (this.map.getSelectedObjects().length !== count) {
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.Removed selection from external service objects') + '.',
                type: LogEventType.Info,
                display: true
            });
        }
    }

    /**
     *
     */
    setup() {
        super.setup();
        if (this.getSelectableVectorLayers().length > 0) {
            this.setState(HIGHLIGHT_MODE_ACTION, true);
        } else {
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.There are no active layers of the main service') + '.',
                type: LogEventType.Info,
                display: true
            });
        }
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkBuilderOfZoneWidget';
        const sourceWidget = GwtkBuilderOfZoneWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    protected destroy() {
        super.destroy();
        this.setAction(HIGHLIGHT_MODE_ACTION, false);
    }

    setState<K extends keyof GwtkBuilderOfZoneTaskState>(key: K, value: GwtkBuilderOfZoneTaskState[ K ]) {

        switch (key) {
            case UPDATE_CHECK_AROUND_ALL:
                this.widgetProps.checkAroundAll = !value as WidgetParams['checkAroundAll'];
                break;
            case UPDATE_SEW_ZONE_CHECK:
                this.widgetProps.checkSewZone = !value as WidgetParams['checkSewZone'];
                break;
            case UPDATE_SEARCH_OBJECTS_CHECK:
                this.widgetProps.checkSearchObjects = value as WidgetParams['checkSearchObjects'];
                break;
            case UPDATE_RADIUS:
                this.widgetProps.zoneRadiusValue = value as WidgetParams['zoneRadiusValue'];
                break;
            case UPDATE_UNITS:
                this.widgetProps.units = value as WidgetParams['units'];
                break;
            case UPDATE_BUFFER_ZONE_NAME:
                this.setBufferZoneName(value as WidgetParams['bufferZoneNameVal']);
                break;
            case HIGHLIGHT_MODE_ACTION:
                if (!this.map.getTaskManager().isBlockingActionActive) {
                    this.setAction(key, value as boolean);
                }
                break;
            case UPDATE_MSG_OBJECT_NAME:
                this.updateMsgObjectName();
                break;
            case CREATE_BUFFER_ZONE:
                this.builderZone();
                this.setAction(HIGHLIGHT_MODE_ACTION, false);
                break;
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case ABORT_SEARCH:
                this.abortSearch();
                break;
            case UPDATE_SELECT_ACTION_ACTIVE:
                if (this.widgetProps.actionDescription) {
                    this.setAction(HIGHLIGHT_MODE_ACTION, !this.widgetProps.actionDescription.active);
                }
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    private setBufferZoneName(value: string) {
        this.widgetProps.bufferZoneNameVal = value;
    }

    private setAction(id: string, active: boolean) {
        if (active) {
            this.doAction(id);
        } else {
            this.quitAction(id);
        }
    }

    /**
     * Обновить имя выбранного объекта
     * @method updateMsgObjectName
     */
    private updateMsgObjectName() {
        const selectedObjectList = this.getValidObjects();

        let nameSelectObject = i18n.t('phrases.Select map object');

        if (selectedObjectList.length > 0) {
            nameSelectObject = i18n.t('phrases.Objects selected') + ': ' + selectedObjectList.length;
        }

        this.widgetProps.txtObjectName = nameSelectObject as string;
    }

    /**
     * Функция построения зоны
     * @method builderZone
     */
    private builderZone() {

        let radius = parseInt(this.widgetProps.zoneRadiusValue);
        if (this.widgetProps.units === ('km')) {
            radius = radius * 1000;
        }

        const serviceUrl = this.map.options.url;
        const httpParams = {
            url: serviceUrl
        };

        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST) || undefined;

        const selectedObjects = this.getValidObjects();

        if (selectedObjects.length === 0) {
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Select map object'));
            return false;
        }

        // Вокруг всех выбранных
        const checkAroundAll = this.widgetProps['checkAroundAll'];
        let countObject = 1;
        if (checkAroundAll) {
            countObject = selectedObjects.length;
        }

        let gmlIdArray: string[] = [];
        let mapLayerIdArray: string[] = [];
        for (let numberObject = 0; numberObject < countObject; numberObject++) {
            gmlIdArray.push(selectedObjects[numberObject].gmlId);
            const mapId = selectedObjects[numberObject].mapId;
            if (mapId && mapLayerIdArray.indexOf(mapId) === -1) {
                mapLayerIdArray.push(mapId);
            }
        }
        if (mapLayerIdArray.length == 0) {
            this.map.writeProtocolMessage(
                {
                    text: 'BuildZone. ' + i18n.tc('phrases.Input data error'),
                    type: LogEventType.Error
                }
            );
            return false;
        }

        const buildZoneParam: BuildZoneParams = {
            LAYER: mapLayerIdArray.join(),
            IDLIST: gmlIdArray.join(),
            RADIUS: radius + '',
            SEVERALOBJ: this.widgetProps.checkSewZone ? SEVERALOBJ.UnionZons : SEVERALOBJ.SplitZones,
            OUTTYPE: 'JSON',
            CRS: this.map.getCrsString()

        };

        service.buildZone(buildZoneParam).then((result) => {
            if (result.data) {
                const geoJsonMain = new GeoJSON(result.data);

                if (geoJsonMain.featureCollection.getFeatureCount() === 0) {
                    return false;
                }

                const zoneObjectIdList: string[] = [];

                for (let numFeatures = 0, geoJsonFeature; (geoJsonFeature = geoJsonMain.featureCollection.getFeature(numFeatures)); numFeatures++) {
                    geoJsonFeature.properties.sld =
                        new Style({
                            fill: new Fill({
                                color: 'red',
                                opacity: 0.3
                            }),
                            stroke: new Stroke({
                                color: 'red',
                                opacity: 0.75
                            })
                        }).toServiceSVG();

                    if (geoJsonFeature.properties.id) {
                        zoneObjectIdList.push(geoJsonFeature.properties.id);
                    }
                }

                const idLayer = Utils.generateGUID();
                const alias = this.widgetProps.bufferZoneNameVal;

                this.map.openLocalLayer(this.map, {id: idLayer, alias, url: 'localhost'}, geoJsonMain.toString());

                // добавить слой в дерево
                const treeNode: ContentTreeNode = {
                    id: idLayer,
                    nodeType: TreeNodeType.LocalLayer,
                    text: alias,
                    parentId: USER_LAYERS_FOLDER_ID
                };
                this.map.onLayerListChanged(treeNode);


                // обновить имя зоны
                this.numberZone++;
                this.setBufferZoneName(i18n.t('phrases.Buffer zone ') + '' + this.numberZone);

                if (this.widgetProps.checkSearchObjects) {
                    this.searchObjects(zoneObjectIdList, idLayer);
                }

                return true;
            } else {
                this.map.writeProtocolMessage(
                    {
                        text: i18n.tc('phrases.Build buffer zone') + '. ' + i18n.tc('phrases.Failed to get data') + '!',
                        type: LogEventType.Error
                    }
                );
                return;
            }
        }).catch((e: Error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.Build buffer zone') + '. ' + i18n.tc('phrases.Failed to get data') + '! ',
                description: e.message,
                type: LogEventType.Error,
                display: true
            });
        });
    }

    /**
     * Выполнить поиск объектов в ходящих в построенную зону
     * @method searchObjects
     */
    searchObjects(zoneIdList: string[], idLayer: string) {
        if (!zoneIdList.length) {
            return;
        }

        this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);

        this.map.clearActiveObject();

        let features: FeatureType[] = [];

        // сначала выполним поиск по локальным слоям
        const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible)) as GeoJsonLayer[];
        for (let layerNumber = 0; layerNumber < geoJsonLayers.length; layerNumber++) {
            const layer = geoJsonLayers[layerNumber];
            if (layer.id === idLayer) {
                const mapObjectsIterator = layer.getMapObjectsIterator();

                for (let i = 0; i < zoneIdList.length; i++) {

                    const idZone = zoneIdList[i];

                    for (const mapObject of mapObjectsIterator) {
                        if (mapObject.gmlId === idZone) {

                            features.push(mapObject.toJSON());

                            break;
                        }
                    }

                }

            }
        }

        if (features.length) {

            const searchManager = this.mapWindow.getMap().searchManager;

            searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.AreaSearch);
            searchManager.clearSearchCriteriaAggregator();
            const aggregator = searchManager.getSearchCriteriaAggregatorCopy();

            const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.map.getCrsString());

            const areaCrossMethod = aggregator.getCrossMethodSearchCriterion();
            areaCrossMethod.setValue(CrossMethodType.crosssquare);
            aggregator.setCrossMethodSearchCriterion(areaCrossMethod);

            // fixme: ошибка на сервисе при наличии sld !!!
            features.forEach(item => item.properties.sld = undefined);

            const geojson: GeoJsonType = {
                type: 'FeatureCollection',
                crs: {type: 'name', properties: {name: this.map.getCrsString()}},
                features
            };
            const searchAreaDataCriterion = aggregator.getFileDataCriterion();
            searchAreaDataCriterion.setValue(geojson);
            aggregator.setFileDataCriterion(searchAreaDataCriterion);

            this.mapWindow.getTaskManager().updateCriteriaAggregator(aggregator);
            searchManager.setSearchCriteriaAggregator(aggregator);

            searchManager.findNext().then(() => {
                this.canShowObjectPanel = true;
                this.mapWindow.getTaskManager().showObjectPanel();
                this.canShowObjectPanel = false;
            }, () => {
                this.map.writeProtocolMessage(
                    {
                        text: i18n.tc('phrases.Build buffer zone') + '. ' + i18n.tc('phrases.Error') + '. ' + i18n.tc('phrases.Object search') + '!',
                        type: LogEventType.Error,
                        display: true
                    }
                );
            })
                .finally(() => {
                    this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
                });
        }
    }

    /**
     * Прервать поиск
     * @method abortSearch
     */
    private abortSearch() {
        this.mapWindow.getMap().searchManager.stopSearch();
    }

    /**
     * Обработчик события выделения объектов
     * @method onSelectObjects
     */
    onSelectObjects() {
        this.setState(UPDATE_MSG_OBJECT_NAME, undefined);
    }

    private getSelectableVectorLayers() {
        const selectableLayersIdList: string[] = [];

        this.map.vectorLayers.forEach(vectorLayer => {
            const layer = this.map.tiles.getLayerByxId(vectorLayer.xId);
            if (layer && layer.visible && vectorLayer.serviceUrl === this.map.options.url) {
                selectableLayersIdList.push(vectorLayer.idLayer);
            }
        });
        return selectableLayersIdList;
    }

    private getValidObjects(): MapObject[] {

        const selectableLayersIdList = this.getSelectableVectorLayers();

        const selectedObjects = this.map.getSelectedObjects();

        return selectedObjects.filter(mapObject => {
            return (selectableLayersIdList.find(item => item === mapObject.vectorLayer.idLayer) !== undefined);
        });
    }

}
