/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент "Всплывающая информация                  *
 *                          об объекте"                             *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { CURSOR_TYPE } from '~/types/Types';
import SearchManager, { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { LogEventType } from '~/types/CommonTypes';
import {
    VIEW_SETTINGS_ZOOM_LEVEL,
    WorkspaceValues,
    PROJECT_SETTINGS_LAYERS_VIEW_ORDER,
} from '~/utils/WorkspaceManager';
import SVGrenderer, {DEFAULT_SVG_MARKER_ID} from '~/renderer/SVGrenderer';
import MapWindow from '~/MapWindow';
import HTMLTooltipRenderable from '~/renderer/HTMLTooltipRenderable';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import TextStyle from '~/style/TextStyle';
import HTMLrenderer from '~/renderer/HTMLrenderer';
import PixelPoint from '~/geometry/PixelPoint';
import i18n from '@/plugins/i18n';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import { DataChangedEvent, MapObjectPanelState } from '~/taskmanager/TaskManager';
import { METRIC, OUTTYPE } from '~/services/RequestServices/common/enumerables';
import GwtkError from '~/utils/GwtkError';
import {geoJsonToMapObjects } from '~/api/MapApi';
import Utils from '~/services/Utils/Utils';
import RequestServices, { ServiceType } from '~/services/RequestServices';


const ON_INFO_CLICK = 'gwtkmapobjecttooltip.oninfoclick';

const ON_DELETE_CLICK = 'gwtkmapobjecttooltip.ondeleteclick';

type GwtkMapObjectTooltipState = {
    [ON_INFO_CLICK]: MapObject | undefined;
    [ON_DELETE_CLICK]: MapObject | undefined;
}

const DELTA_PIX = 12;
const TOOLTIP_BASE_WIDTH = 244;
const TOOLTIP_BASE_HEIGHT = 200;
const TOOLTIP_TIMEOUT = 500;

/**
 * Компонент "Всплывающая информация об объекте"
 * @class GwtkMapObjectTooltipTask
 * @extends Task
 */
export default class GwtkMapObjectTooltipTask extends Task {

    private mapObject?: MapObject | null;

    private mapObjectList: MapObject[] = [];

    private tooltipPoint?: PixelPoint;

    /**
     * Стиль рисования объекта
     * @private
     * @readonly
     * @property mergeObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style({
        stroke: new Stroke({
            color: 'green',
            width: '2px'
        }),
        fill: new Fill({
            opacity: 0.1
        }),
        marker: new MarkerStyle({ markerId: DEFAULT_SVG_MARKER_ID }),
        text: new TextStyle({ color: 'green' })
    });

    private readonly searchManager: SearchManager;

    private readonly mapObjectsTooltipViewer = new HTMLTooltipRenderable();

    private isRender = true;

    private renderTimeout?: number;

    private creationTimeout?: number;

    /**
     * @constructor GwtkMapObjectTooltipTask
     * @param mapWindow {MapWindow} Окно карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
        this.searchManager = new SearchManager(this.map);
    }

    setup() {
        this.loadMapObjects();
        if (window.location.search.substring(1).split('&').length > 1) {
            this.setObjectFromUrl();
        }
    }
    /**
     * Установить объект, полученный из URL в панель информации
     * @private
     * @method setObjectFromUrl
     */
    private setObjectFromUrl() {
        const idLayerObjectNumberKey = this.map.options?.forcedParams?.idLayerObjectNumberKey;
        if (idLayerObjectNumberKey) {
            const idLayer = Utils.parseIdLayerObjectNumberKey(idLayerObjectNumberKey).idLayer;
            const objectNumber = Utils.parseIdLayerObjectNumberKey(idLayerObjectNumberKey).objectNumber;
            if (idLayer && objectNumber) {
                this.getMapObjectFeatureFromUrl(idLayer, objectNumber).then((mapObject) => {
                    if (mapObject && mapObject[0]) {
                        this.map.setActiveObject(mapObject[0]);
                        this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showInfo, true);
                    }
                }).catch((error) => {
                    const gwtkError = new GwtkError(error);
                    this.map.writeProtocolMessage({
                        text: i18n.tc('tooltips.Error setup object from URL'),
                        description: gwtkError.message,
                        type: LogEventType.Error
                    });
                });
            }
        }
    }

    protected destroy() {
        super.destroy();
        this.map.requestRender();
    }

    get active() {
        return this.mapWindow.getTaskManager().canShowTooltip();
    }

    canShowTooltip(): boolean {
        return !!this.map.vectorLayers.find(layer => (layer instanceof GeoJsonLayer && layer.visible && layer.options.tooltip)) || !!this.map.tiles.getSelectableLayersArray().find(layer => layer.options.tooltip);
    }

    onWorkspaceChanged(type: keyof WorkspaceValues) {
        if (type === VIEW_SETTINGS_ZOOM_LEVEL || type === PROJECT_SETTINGS_LAYERS_VIEW_ORDER) {
            this.loadMapObjects();
        }
    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'content') {
            Utils.debounce(this.loadMapObjects, 200);
        }
    }

    onPreRender(renderer: SVGrenderer) {
        if (!this.active) {
            this.mapObject = undefined;
            this.mapObjectsTooltipViewer.clear();
            return;
        }
        if (this.isRender) {
            this.createTooltipHtmlElement(this.map.htmlRenderer, this.mapObject || undefined)
                .then(htmlElement => {
                    this.clearTimeout();

                    const timeoutMilliseconds = htmlElement ? 50 : 400;

                    this.renderTimeout = window.setTimeout(() => {
                        this.mapObjectsTooltipViewer.update(this.map.htmlRenderer, htmlElement ? [htmlElement] : []);
                        this.map.requestRender();
                    }, timeoutMilliseconds);

                })
                .catch(() => {
                    this.clearTimeout();
                    this.renderTimeout = undefined;
                });
            this.isRender = false;
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (!this.mapObject) {
            return;
        }
        this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObject, this.mapObjectStyle);

        let timeoutMilliseconds = TOOLTIP_TIMEOUT;
        if (this.mapObject.type === MapObjectType.Point ||
            this.mapObject.type === MapObjectType.MultiPoint) {
            timeoutMilliseconds = 0;
        }

        this.creationTimeout = window.setTimeout(() => {
            this.mapObjectsTooltipViewer.drawRenderable(this.map.htmlRenderer);
        }, timeoutMilliseconds);

    }

    onMouseMove(event: MouseDeviceEvent) {
        if (!this.active) {
            return;
        }

        const previousObject = this.mapObject;
        this.mapObject = undefined;

        const map = this.mapWindow.getMap(),
            point = event.mousePosition.clone(),
            coord = map.pixelToPlane(point);

        //смещаем точку в пикселах для вычисления допуска в метрах
        point.x += DELTA_PIX;
        point.y += DELTA_PIX;

        const coordSupport = map.pixelToPlane(point);
        if (coord) {
            const cursorMapPoint = this.mapWindow.getMap().pixelToPlane(event.mousePosition);

            //допуск попадания в точку
            const delta = Math.max(Math.abs(coordSupport.x - coord.x), Math.abs(coordSupport.y - coord.y));

            let hoverResult;
            for (let i = 0; i < this.mapObjectList.length; i++) {
                const mapObject = this.mapObjectList[i];
                if (mapObject.isClusterObject) {
                    continue;
                }
                hoverResult = mapObject.checkHover(cursorMapPoint, delta);
                if (hoverResult) {
                    this.mapObject = mapObject;
                    this.mapWindow.setCursor(CURSOR_TYPE.pointer);
                    break;
                }
            }
            if (!hoverResult && previousObject) {
                this.mapWindow.setCursor(CURSOR_TYPE.default);
            }
        }

        if (this.mapObject !== previousObject) {
            this.isRender = true;
            this.tooltipPoint = event.mousePosition;
            if (this.creationTimeout) {
                window.clearTimeout(this.creationTimeout);
                this.creationTimeout = undefined;
            }
        }

    }

    async setState<K extends keyof GwtkMapObjectTooltipState>(key: K, value: GwtkMapObjectTooltipState[K]) {
        switch (key) {
            case ON_INFO_CLICK:
                if (value) {
                    const mapObject = value as MapObject;
                    const clusterList = this.getClusterObjectsList(mapObject);
                    this.map.setActiveObject(mapObject);
                    if (clusterList) {
                        this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showObjects, false, clusterList);
                    } else {
                        this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showInfo, true);
                    }
                }
                break;
            case ON_DELETE_CLICK:
                if (value) {
                    const mapObject = value as MapObject;
                    const semantic = mapObject.getSemanticValue('mapmark');
                    if (semantic) {
                        await mapObject.delete();
                        this.removeMapObject(mapObject);
                        this.map.requestRender();
                    }
                }
                break;
            default:
                if (this._action) {
                    this._action.setState(key, value);
                }
        }
    }

    /**
     * Удалить объект из списка объектов
     * @private
     * @method removeMapObject
     * @param mapObject {MapObject} объект карты
     */
    private removeMapObject(mapObject: MapObject) {
        if (!this.mapObjectList) {
            return;
        }
        const index = this.mapObjectList.findIndex(mapobject => mapObject.id === mapobject.id);
        if (index !== -1) {
            this.mapObjectList.splice(index, 1);
            if (this.mapObject && this.mapObject.id === mapObject.id) {
                this.mapObject = undefined;
            }
        }
    }

    /**
     * Получить список объектов кластера
     * @private
     * @method getClusterObjectsList
     * @param mapObject {MapObject} объект карты
     */
    private getClusterObjectsList(mapObject: MapObject): MapObject[] | undefined {
        let clusterList = undefined;
        if (mapObject.clusterId) {
            clusterList = [mapObject];
            const clusterId = mapObject.clusterId;
            this.mapObjectList.forEach((mapobject: MapObject) => {
                if (mapobject.isClusterObject && mapobject.clusterIdRef === clusterId) {
                    clusterList.push(mapobject);
                }
            });
        }
        return clusterList;
    }


    /**
     * Сбросить таймер
     * @private
     * @method clearTimeout
     */
    private clearTimeout(): void {
        if (this.renderTimeout !== undefined) {
            window.clearTimeout(this.renderTimeout);
        }
    }

    private async loadMapObjects() {
        if (!this.canShowTooltip()) {
            return;
        }

        const windowBounds = this.map.getWindowBounds();

        // сначала выполним поиск по локальным слоям
        const mapObjectList: MapObject[] = [];
        const geoJsonLayers = this.map.vectorLayers.filter(layer => (layer instanceof GeoJsonLayer && layer.visible && layer.options.tooltip)) as GeoJsonLayer[];
        geoJsonLayers.forEach(layer => {
            const mapObjectsIterator = layer.getMapObjectsIterator();
            for (const mapObject of mapObjectsIterator) {
                if (windowBounds.intersects(mapObject.getBounds())) {
                    mapObjectList.push(mapObject);
                }
            }
        });

        this.searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.TooltipLayers);

        this.searchManager.clearSearchCriteriaAggregator();
        const criteriaAggregator = this.searchManager.getSearchCriteriaAggregatorCopy();
        criteriaAggregator.getObjectLocalSearchCriterion().clearValue();
        criteriaAggregator.getObjectLocalSearchCriterion().addValue('0', '1', '2', '4', '5');
        criteriaAggregator.getBboxSearchCriterion().clearValue();


        criteriaAggregator.getBboxSearchCriterion().setValue(windowBounds);

        criteriaAggregator.removeCriterion(SearchCriterionName.Count);
        criteriaAggregator.removeCriterion(SearchCriterionName.StartIndex);

        const srsNameSearchCriterion = criteriaAggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue(this.map.getCrsString());

        const numericScale = criteriaAggregator.getObjectScaleSearchCriterion();
        numericScale.setValue(this.map.getZoomScale(this.map.options.tilematrix));

        criteriaAggregator.getMetricCriterion().setValue(METRIC.AddMetric);

        this.searchManager.setSearchCriteriaAggregator(criteriaAggregator);

        try {
            const result = await this.searchManager.findNext();
            if (result && result.mapObjects) {
                result.mapObjects.forEach(mapObject => mapObjectList.push(mapObject));
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('tooltips.Error loading tooltips'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
        }

        if (mapObjectList.length) {
            this.mapObjectList = MapObject.sortMapObjectsByType(mapObjectList);
        } else {
            this.mapObjectList.splice(0);
        }
    }

    /**
     * Получить геометрические свойства объекта, указанного в URL
     * @private
     * @async
     * @method getMapObjectFeatureFromUrl
     * @param idLayer {string} id слоя
     * @param objectNumber {string} номер объекта
     * @return {MapObject[]} Объект карты
     */
    private async getMapObjectFeatureFromUrl(idLayer: string, objectNumber: string) {
        const mapLayer = this.map.tiles.getLayerByIdService(idLayer);
        if (!mapLayer || !mapLayer.server) {
            return;
        }
        const param = {
            LAYER: idLayer,
            OBJLOCAL: '0,1,2,3,4',
            IDLIST: objectNumber,
            OUTTYPE: OUTTYPE.JSON,
            OUTCRS: this.map.getCrsString()
        };
        const url = mapLayer.options.url;
        const uri = Utils.parseUrl(url);
        const server = uri.origin + '/' + uri.pathname;
        const httpParams = RequestServices.createHttpParams(this.map, { url: server });
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

        try {
            const result = await service.getFeature([param]);
            let response;
            if (typeof result.data === 'string') {
                response = JSON.parse(result.data);
            } else {
                response = result.data;
            }
            return geoJsonToMapObjects(this.map, response);
        } catch (error) {
            const gwtkError = new GwtkError(error);
            this.map.writeProtocolMessage({
                text: i18n.tc('tooltips.Error requesting object data'),
                description: gwtkError.message,
                type: LogEventType.Error
            });
            return [];
        }
    }
    /**
     * Создание всплывающего элемента
     * @private
     * @async
     * @method createTooltipHtmlElement
     * @param renderer {HTMLrenderer} Инструмент рисования
     * @param mapObject {MapObject} Объект карты
     * @return {SVGGElement|undefined} SVG элемент рисования пути
     */
    private async createTooltipHtmlElement(renderer: HTMLrenderer, mapObject?: MapObject): Promise<HTMLDivElement | undefined> {

        if (!mapObject) {
            return;
        }

        const mapObjectTooltip = await mapObject.getTooltip();

        if (mapObjectTooltip === undefined || Reflect.ownKeys(mapObjectTooltip).length === 0) {
            return;
        }

        let width = TOOLTIP_BASE_WIDTH;

        const element = document.createElement('div');
        element.setAttribute('xid', mapObject.id);

        element.classList.add('pa-4');
        element.style.gap = '8px';

        element.style.position = 'absolute';
        element.style.zIndex = '707';

        element.style.backgroundColor = 'var(--color-white)';
        element.style.borderRadius = '4px';
        element.style.boxShadow = '0px 0px 2px  var(--v-secondary-lighten5), 0px 2px 2px var(--v-secondary-lighten5)';

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('mb-2');

        headerDiv.style.display = 'flex';
        headerDiv.style.flexDirection = 'row';
        headerDiv.style.alignItems = 'flex-start';

        //Левая колонка
        const leftColumnItems = [];

        if (mapObjectTooltip.objectName) {
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('text-subtitle-1');
            nameDiv.classList.add('font-weight-bold');
            nameDiv.style.marginBottom = '4px';
            nameDiv.style.color = ' var(--v-secondary-lighten1)';

            nameDiv.textContent = mapObjectTooltip.objectName;
            leftColumnItems.push(nameDiv);
        }

        if (mapObjectTooltip.layerName) {
            const layerNameDiv = document.createElement('div');

            layerNameDiv.classList.add('mb-1');
            layerNameDiv.classList.add('text-body-2');

            layerNameDiv.style.color = ' var(--v-secondary-lighten1)';

            layerNameDiv.textContent = mapObjectTooltip.layerName;
            leftColumnItems.push(layerNameDiv);
        }

        if (leftColumnItems.length > 0) {
            const leftCol = document.createElement('div');
            leftCol.style.width = '100%';
            leftCol.classList.add('pa-1');
            leftColumnItems.forEach(item => leftCol.appendChild(item));
            headerDiv.appendChild(leftCol);
        }


        //Правая колонка
        const rightColumnItems = [];

        if (mapObjectTooltip.image) {

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.width = '64px';
            div.style.height = '64px';
            div.style.border = '1px solid #a1a1a1';
            div.style.borderRadius = '6px';

            const img = document.createElement('img');
            img.style.minWidth = '32px';
            img.style.minHeight = '32px';
            img.style.maxWidth = '64px';
            img.style.maxHeight = '64px';
            img.style.objectFit = 'contain';
            img.src = mapObjectTooltip.image;

            div.appendChild(img);

            rightColumnItems.push(div);
        }

        if (rightColumnItems.length > 0) {
            const rightCol = document.createElement('div');
            rightCol.classList.add('pa-1');
            rightColumnItems.forEach(item => rightCol.appendChild(item));
            headerDiv.appendChild(rightCol);
            width += 104;
        }

        element.appendChild(headerDiv);


        //Семантики
        const bottomItems: HTMLDivElement[] = [];

        if (mapObjectTooltip.semantics) {
            mapObjectTooltip.semantics.forEach(semantic => {

                const semanticDiv = document.createElement('div');
                semanticDiv.classList.add('mb-2');

                const semanticNameDiv = document.createElement('div');
                semanticNameDiv.classList.add('text-subtitle-2');
                semanticNameDiv.classList.add('font-weight-bold');
                semanticNameDiv.classList.add('mb-1');

                semanticNameDiv.style.color = ' var(--v-secondary-lighten1)';

                semanticNameDiv.textContent = semantic.name;
                semanticDiv.appendChild(semanticNameDiv);

                const semanticValueDiv = document.createElement('div');
                semanticValueDiv.classList.add('text-body-1');

                semanticValueDiv.style.color = ' var(--v-secondary-lighten1)';

                semanticValueDiv.textContent = semantic.value;
                semanticDiv.appendChild(semanticValueDiv);

                bottomItems.push(semanticDiv);

            });
        }

        if (bottomItems.length > 0) {
            const bottom = document.createElement('div');
            bottom.classList.add('pa-1');
            bottomItems.forEach(item => bottom.appendChild(item));

            element.appendChild(bottom);
        }


        const infoButton = document.createElement('button');

        infoButton.classList.add('button');
        infoButton.classList.add('v-btn');
        infoButton.classList.add('v-btn--plain');
        infoButton.classList.add('v-btn--text');
        infoButton.classList.add('button_theme_secondary');
        infoButton.classList.add('button_align_center');
        infoButton.classList.add('pa-2');

        infoButton.onclick = () => this.setState(ON_INFO_CLICK, mapObject);


        const infoButtonSpan = document.createElement('span');
        infoButtonSpan.classList.add('v-btn__content');

        const infoButtonSpanIcon = document.createElement('i');
        infoButtonSpanIcon.classList.add('v-icon');
        infoButtonSpanIcon.classList.add('notranslate');
        infoButtonSpanIcon.classList.add('icon');
        infoButtonSpanIcon.classList.add('button__content');
        infoButtonSpanIcon.classList.add('button__content_icon');
        infoButtonSpanIcon.classList.add('mdi');
        infoButtonSpanIcon.classList.add('mdi-information-variant');
        infoButtonSpanIcon.style.color = 'var(--v-primary-base)';

        infoButtonSpan.appendChild(infoButtonSpanIcon);

        infoButton.appendChild(infoButtonSpan);

        element.appendChild(infoButton);

        const semantic = mapObject.getSemanticValue('mapmark');
        if (semantic) {
            const deleteButton = document.createElement('button');
            deleteButton.style.float = 'right';
            deleteButton.title = i18n.t('mapmarks.Remove') as string;
            for (const classname of infoButton.classList) {
                deleteButton.classList.add(classname);
            }
            deleteButton.innerHTML = infoButton.innerHTML.replace('mdi-information-variant', 'mdi-delete-outline');
            deleteButton.onclick = () => this.setState(ON_DELETE_CLICK, mapObject);
            element.appendChild(deleteButton);
        }
        //Положение на экране
        const windowHeight = mapObject.vectorLayer.map.getWindowSize()[1];
        const windowWidth = mapObject.vectorLayer.map.getWindowSize()[0];

        if (!this.tooltipPoint) {
            return;
        }
        const resultPoint = this.tooltipPoint.subtract(new PixelPoint(0.5 * width, windowHeight + 16));

        if (resultPoint.x > 0) {
            if (resultPoint.x < windowWidth - width) {
                element.style.left = resultPoint.x + 'px';
            } else {
                element.style.left = windowWidth - width + 'px';
            }
        } else {
            element.style.left = '0';
        }

        if (-resultPoint.y > 0) {
            if (-resultPoint.y < windowHeight - TOOLTIP_BASE_HEIGHT) {
                element.style.bottom = -resultPoint.y + 'px';
            } else {
                element.style.top = '0';
            }
        } else {
            element.style.bottom = '0';
        }

        element.style.width = width + 'px';

        element.onmouseenter = () => {
            this.clearTimeout();
            this.mapObject = null;
        };

        return element;
    }

}
