/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Задача Построить зону затопления                  *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import VectorLayer from '~/maplayers/VectorLayer';
import { MapPoint } from '~/geometry/MapPoint';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import { LogEventType } from '~/types/CommonTypes';
import SelectPointsAction from '../actions/SelectPointsAction';
import SelectFloodObjectAction from '../actions/SelectFloodObjectAction';
import { GwtkLayerDescription } from '~/types/Options';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { HttpParams } from '~/services/RequestServices/common/RequestService';
import SVGrenderer, { RED_CIRCLE_SMALL_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import { BuildFloodZoneParams, GetCoveragePointParams } from '~/services/RequestServices/RestService/Types';
import Utils from '~/services/Utils';
import i18n from '@/plugins/i18n';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import { ContentTreeNode, TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import GwtkBuildFloodZoneWidget from './GwtkBuildFloodZoneWidget.vue';
import Style from '~/style/Style';
import MarkerStyle from '~/style/MarkerStyle';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import Stroke from '~/style/Stroke';

export const SELECT_POINTS_ACTION = 'gwtkbuildfloodzone.selectpointstaction';
export const HIGHLIGHT_OBJECT_ACTION = 'gwtkbuildfloodzone.selectobjectaction';
export const MATRIX_LIST = 'gwtkbuildfloodzone.matrixlist';
export const VIRTUAL_FOLDER_LIST = 'gwtkbuildfloodzone.virtualfolderlist';
export const FLOOD_ZONE_NAME = 'gwtkbuildfloodzone.floodzonename';
export const FLOOD_ZONE_WIDTH = 'gwtkbuildfloodzone.floodzonewidth';
export const LIFT_LEVEL_FIRST = 'gwtkbuildfloodzone.liftlevel1';
export const LIFT_LEVEL_SECOND = 'gwtkbuildfloodzone.liftlevel2';
export const SELECTED_MATRIX = 'gwtkbuildfloodzone.selectedmatrix';
export const SELECTED_FOLDER = 'gwtkbuildfloodzone.selectedfolder';
export const SELECTED_FLOOD_OBJECT = 'gwtkbuildfloodzone.selectedobject';
export const OBJECT_POINTS_ARRAY = 'gwtkbuildfloodzone.objectpoints';
export const BUILD_START = 'gwtkbuildfloodzone.buildstart';
export const ACTION_ACTIVE = 'gwtkbuildfloodzone.actionactive';
export const NEW_BUILDING = 'gwtkbuildfloodzone.newbuilding';
export const RESET_SELECTION = 'gwtkbuildfloodzone.resetselection';

const FLOOD_ZONE_WIDTH_DEFAULT = '2000';

export type GwtkBuildFloodZoneTaskState = {
    [MATRIX_LIST]: DataListItem[];
    [VIRTUAL_FOLDER_LIST]: DataListItem[];
    [FLOOD_ZONE_NAME]: string | undefined;
    [FLOOD_ZONE_WIDTH]: string | undefined;
    [SELECTED_MATRIX]: string;
    [SELECTED_FOLDER]: string;
    [LIFT_LEVEL_FIRST]: string | undefined;
    [LIFT_LEVEL_SECOND]: string | undefined;
    [OBJECT_POINTS_ARRAY]: SelectedPointData;
    [BUILD_START]: undefined;
    [SELECTED_FLOOD_OBJECT]: MapObject;
    [HIGHLIGHT_OBJECT_ACTION]: boolean;
    [ACTION_ACTIVE]: boolean;
    [NEW_BUILDING]: undefined;
    [RESET_SELECTION]: undefined;
};

type WidgetParams = {
    setState: GwtkBuildFloodZoneTask['setState'];
    matrixList: { id: string, name: string }[];
    folderList: { id: string, name: string }[];
    floodZoneWidth: string;
    floodZoneName: string;
    objectPointsArray: MapPoint[];
    liftLevelFirst: string;
    liftLevelSecond: string;
    selectedMatrixId: string;
    selectedFolderId: string;
    mapObjectSelected: boolean,
    isObjectSelected: boolean;
    allPointsAreSelected: boolean;
    maxPointsCount: number;
    additionalMessage: string;
    isBuilding: boolean;
    isComponentConfigured: boolean;
    isNewBuilding: boolean;
}

export type DataListItem = {
    id: string;
    url?: string;
    name: string;
}

type FloodZoneData = {
    alias: string;
    id: string;
    xsdschema: string;
}

export type SelectedPointData = {
    mapObject: MapObject;                                       // копия текущего объект (по которому строим)
    selectedPoints: MapObject;                                   // отобранные точки текущего объекта
    lastPointSelector?: { positionNumber: number, contourNumber: number, objectNumber: number };
}

/**
 * Задача "Построить зону затопления"
 * @class GwtkBuildFloodZoneTask
 * @extends Task
 */
export default class GwtkBuildFloodZoneTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * Векторный слой отображения точек
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    private readonly vectorLayer: VectorLayer;

    /**
     * Часть объекта между выбранными точками
     * @private
     * @readonly
     * @property mapObjectSegment {MapObject}
     */
    private readonly mapObjectSegment: MapObject;

    /**
     * Часть объекта между выбранными точками
     * @private
     * @readonly
     * @property mapObjectPoints {MapObject}
     */
    private readonly mapObjectPoints: MapObject;

    private mapObjectCopy?: MapObject;

    private firstPointSelector?: PointInfo;
    private lastPointSelector?: PointInfo;
    private intermediatePointSelector?: PointInfo;

    private matrixHeightValueLoaded: string = '';

    private readonly floodZoneDataLoaded: FloodZoneData[] = [];

    private url: string = '';

    private selectedMapObject?: MapObject;

    private buildCounter = 1;

    constructor(mapVue: MapWindow, id: string) {
        super(mapVue, id);

        this.actionRegistry.push(
            {
                getConstructor() {
                    return SelectFloodObjectAction;
                },
                id: HIGHLIGHT_OBJECT_ACTION,
                active: false,
                enabled: true
            },
            {
                getConstructor() {
                    return SelectPointsAction;
                },
                id: SELECT_POINTS_ACTION,
                active: false,
                enabled: true
            }
        );

        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),
            matrixList: [],
            folderList: [],
            floodZoneWidth: '',
            floodZoneName: '',
            objectPointsArray: [],
            liftLevelFirst: '',
            liftLevelSecond: '',
            selectedMatrixId: '',
            selectedFolderId: '',
            mapObjectSelected: false,
            isObjectSelected: false,
            allPointsAreSelected: false,
            maxPointsCount: 2,
            additionalMessage: '',
            isBuilding: false,
            isComponentConfigured: true,
            isNewBuilding: false
        };

        this.vectorLayer = new VectorLayer(this.map, {
            alias: '',
            id: Utils.generateGUID(),
            url: ''
        });

        this.mapObjectSegment = new MapObject(this.vectorLayer, MapObjectType.LineString);
        this.mapObjectSegment.addStyle(new Style({
            stroke: new Stroke({ color: 'red', width: '3px' })
        }));

        this.mapObjectPoints = new MapObject(this.vectorLayer, MapObjectType.MultiPoint);
        this.mapObjectPoints.addStyle(new Style({
            marker: new MarkerStyle({ markerId: RED_CIRCLE_SMALL_SVG_MARKER_ID })
        }));

    }

    setup() {
        const param = this.map.options.floodZone;

        if (!param
            || !param.url
            || !Array.isArray(param.matrixList)
            || !param.matrixList.length
            || !Array.isArray(param.virtualFolderList)
            || !param.virtualFolderList.length) {
            this.widgetProps.isComponentConfigured = false;
            return;
        }

        this.url = param.url;

        this.widgetProps.matrixList = param?.matrixList;
        this.widgetProps.folderList = param?.virtualFolderList;
        this.widgetProps.selectedMatrixId = this.widgetProps.matrixList[0].id;
        this.widgetProps.selectedFolderId = this.widgetProps.folderList[0].id;
        this.widgetProps.floodZoneWidth = FLOOD_ZONE_WIDTH_DEFAULT;
        this.widgetProps.floodZoneName = this.newFloodZoneName;
        this.widgetProps.objectPointsArray = [];

        this.setAction(HIGHLIGHT_OBJECT_ACTION, true);

    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkBuildFloodZoneWidget';
        const source = GwtkBuildFloodZoneWidget;

        this.mapWindow.registerComponent(name, source);

        // Создание Vue компонента
        this.mapWindow.createWidget(name, this.widgetProps);

        // Добавить в список для удаления при деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    protected destroy() {
        super.destroy();
        this.map.clearSelectedObjects();
    }

    setState<K extends keyof GwtkBuildFloodZoneTaskState>(key: K, value: GwtkBuildFloodZoneTaskState[K]) {
        switch (key) {
            case SELECTED_MATRIX:
                this.widgetProps.selectedMatrixId = value as string;
                break;
            case SELECTED_FOLDER:
                this.widgetProps.selectedFolderId = value as string;
                break;
            case FLOOD_ZONE_NAME:
                this.widgetProps.floodZoneName = value as string;
                break;
            case LIFT_LEVEL_FIRST:
                this.widgetProps.liftLevelFirst = value as string;
                break;
            case LIFT_LEVEL_SECOND:
                this.widgetProps.liftLevelSecond = value as string;
                break;
            case FLOOD_ZONE_WIDTH:
                this.widgetProps.floodZoneWidth = value as string;
                break;

            case BUILD_START:
                this.buildStart();
                break;

            case NEW_BUILDING:
                this.setAction(HIGHLIGHT_OBJECT_ACTION, true);
                this.clearTaskObject();
                this.widgetProps.isNewBuilding = false;

                this.widgetProps.floodZoneName = this.newFloodZoneName;

                this.mapObjectSegment.removeAllPoints();
                this.mapObjectPoints.removeAllPoints();
                break;

            case HIGHLIGHT_OBJECT_ACTION:
                const active = value as boolean;
                if (!active) {
                    this.stopSelectObject();
                } else {
                    this.map.clearSelectedObjects();
                    this.setAction(key, active);
                }
                break;

            case OBJECT_POINTS_ARRAY:
                this.updateObjectPointsArray(value as SelectedPointData);
                break;

            case RESET_SELECTION:
                this.resetSelection();
                break;

            default:
                break;
        }
    }

    private async updateObjectPointsArray(pointsData: SelectedPointData) {
        this.mapObjectCopy = pointsData.mapObject.copy();
        await this.setPointHeight(pointsData);
        const points = pointsData.selectedPoints.getPointList();
        this.widgetProps.objectPointsArray.splice(0);
        this.widgetProps.objectPointsArray.push(...points);

        if (this.widgetProps.objectPointsArray.length === 1) {
            this.firstPointSelector = pointsData.lastPointSelector;
        }

        if (this.widgetProps.objectPointsArray.length === 2) {
            this.intermediatePointSelector = pointsData.lastPointSelector;
        }

        if (this.widgetProps.objectPointsArray.length === this.maxPointsCount) {
            this.widgetProps.allPointsAreSelected = true;

            this.lastPointSelector = pointsData.lastPointSelector;

            this.widgetProps.objectPointsArray.forEach((item: MapPoint) => {
                this.mapObjectPoints.addPoint(item);
            });

        }
    }

    private async buildStart() {
        if (this.checkParameters()) {
            this.widgetProps.isBuilding = true;
            this.updateMapObjectSegment();
            await this.buildFloodZoneRequest();
            this.widgetProps.isBuilding = false;
            this.openMapLayers();
            this.widgetProps.isObjectSelected = false;
        }

        this.map.clearSelectedObjects();

        this.widgetProps.isNewBuilding = true;
    }

    setTaskObject(mapObject: MapObject) {
        this.selectedMapObject = mapObject.copy();
        this.widgetProps.maxPointsCount = this.maxPointsCount;
        this.clearPointsArray();

        this.widgetProps.isObjectSelected = true;
    }

    getTaskObject() {
        return this.selectedMapObject;
    }

    clearTaskObject() {
        this.selectedMapObject = undefined;
        this.clearPointsArray();

        this.widgetProps.isObjectSelected = false;
        this.widgetProps.maxPointsCount = 2;
    }

    private async setPointHeight(pointsData: SelectedPointData) {
        let points = pointsData.selectedPoints.getPointList();
        if (pointsData.lastPointSelector) {
            const lastPoint = pointsData.mapObject?.getPoint(pointsData.lastPointSelector);
            if (lastPoint) {

                const currentSelector = {
                    positionNumber: points.length - 1,
                    contourNumber: 0,
                    objectNumber: 0
                };

                await this.getMatrixHeight(lastPoint);

                if (this.matrixHeightValueLoaded !== '') {
                    lastPoint.h = +this.matrixHeightValueLoaded;
                    pointsData.mapObject?.updatePoint(lastPoint, pointsData.lastPointSelector);
                    if (points.length > 0) {
                        const currentPoint = pointsData.selectedPoints.getPoint(currentSelector);
                        if (currentPoint) {
                            currentPoint.h = lastPoint.h;
                            pointsData.selectedPoints.updatePoint(currentPoint, currentSelector);
                        }
                    }
                } else {
                    pointsData.selectedPoints.removePoint(currentSelector);
                }
            }
        }
    }

    stopSelectObject() {
        if (!this.selectedMapObject) {
            return;
        }
        setTimeout(() => {
            this.clearPointsArray();
            this.setAction(SELECT_POINTS_ACTION, true);
        }, 15);
    }

    private clearPointsArray() {
        this.widgetProps.objectPointsArray.splice(0);

        this.widgetProps.allPointsAreSelected = false;
    }

    private setAction(id: string, active: boolean) {
        if (active) {
            this.doAction(id);
        } else {
            this.quitAction(id);
        }
    }

    onPreRender(renderer: SVGrenderer) {
        if (this.mapObjectSegment.isDirty || this.mapObjectPoints.isDirty) {
            this.mapObjectSegment.isDirty = false;
            this.mapObjectPoints.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.mapObjectSegment) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectSegment);
        }
        if (this.mapObjectPoints) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.mapObjectPoints);
        }
    }

    get maxPointsCount() {
        let count = 2;
        if (this.selectedMapObject) {
            if (this.selectedMapObject.type === MapObjectType.MultiPolygon ||
                this.selectedMapObject.type === MapObjectType.Polygon) {
                count = 3;
            }
        }
        return count;
    }

    private async getMatrixHeight(mapPoint: MapPoint) {
        if (mapPoint.h !== 0) {
            this.matrixHeightValueLoaded = mapPoint.h.toFixed(2);
            return;
        }
        const coordinates = mapPoint.toOrigin();
        const CRS = this.map.getCrsString();
        this.matrixHeightValueLoaded = '';

        if (coordinates && CRS && mapPoint.Translate?.IsGeoSupported) {
            if (this.widgetProps.selectedMatrixId) {

                const requestParams: GetCoveragePointParams = {
                    LAYER: this.widgetProps.selectedMatrixId,
                    POINT: coordinates[0] + ',' + coordinates[1],
                    CRS
                };

                const httpParams: HttpParams = { url: this.url };
                const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

                await service.getCoveragePoint(requestParams).then(result => {

                    if (result.data) {

                        const resultData = result.data;

                        for (const key in resultData) {
                            const keyItem = resultData[key];
                            if (keyItem.value && keyItem.value !== -111111 && keyItem.value !== -32767 && keyItem.value !== -32767000) {
                                this.matrixHeightValueLoaded = keyItem.value.toFixed(2);
                                break;
                            }
                        }
                    } else {
                        this.map.writeProtocolMessage(
                            {
                                text: i18n.tc('phrases.Failed to get data'),
                                type: LogEventType.Error
                            }
                        );
                    }
                }).catch(e => {
                    this.map.writeProtocolMessage({ text: e, type: LogEventType.Error });
                });
            }
        }
    }

    private checkParameters() {
        if (this.selectedMapObject && this.widgetProps.objectPointsArray.length === this.maxPointsCount) {

            return (this.widgetProps.floodZoneWidth !== '' &&
                this.widgetProps.liftLevelFirst !== '' &&
                this.widgetProps.liftLevelSecond !== '');
        }
        return false;
    }

    private async buildFloodZoneRequest() {
        if (!this.selectedMapObject) {
            return;
        }

        this.floodZoneDataLoaded.splice(0);

        const CRS = this.map.getCrsString();
        let coordinates = this.widgetProps.objectPointsArray[0].toOrigin();
        const POINT1 = coordinates[0] + ',' + coordinates[1];
        coordinates = this.widgetProps.objectPointsArray[this.maxPointsCount - 1].toOrigin();
        const POINT2 = coordinates[0] + ',' + coordinates[1];

        const requestParams: BuildFloodZoneParams = {
            LAYER: this.selectedMapObject.vectorLayer.idLayer,
            IDLIST: this.selectedMapObject.gmlId,
            COVERAGEID: this.widgetProps.selectedMatrixId,
            FLOOD: Number(this.widgetProps.floodZoneWidth) + '',
            H1: Number(this.widgetProps.liftLevelFirst) + '',
            H2: Number(this.widgetProps.liftLevelSecond) + '',
            CRS,
            POINT1,
            POINT2,
            OUTTYPE: OUTTYPE.JSON,
            SAVEPATH: this.widgetProps.selectedFolderId + '/' + this.widgetProps.floodZoneName
        };

        const httpParams: HttpParams = { url: this.url };

        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        await service.BuildFloodZone(requestParams).then(result => {

            if (result.data) {
                const resultData = result.data;
                this.floodZoneDataLoaded.push(...resultData.restmethod.createlayerlist);
            } else {
                this.map.writeProtocolMessage(
                    {
                        text: i18n.tc('phrases.Failed to get data'),
                        type: LogEventType.Error
                    }
                );
            }
        }).catch(e => {
            this.map.writeProtocolMessage({ text: e, type: LogEventType.Error });
        });
    }

    private openMapLayers() {
        for (const layerparam of this.floodZoneDataLoaded) {
            const type = layerparam.id.split('.')[1] === 'sitx' ? 'sxf' : layerparam.id.split('.')[1];
            const options: GwtkLayerDescription = {
                id: Utils.generateGUID(),
                alias: this.widgetProps.floodZoneName + GwtkBuildFloodZoneTask.getAliasPostfix(layerparam.alias),
                url: this.url + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&LAYERS=' + layerparam.id + '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs',
                zIndex: 750,
                opacityValue: 50,
                export: [type],
            };
            const treeNode: ContentTreeNode = {
                id: options.id,
                nodeType: TreeNodeType.Layer,
                text: options.alias,
                parentId: USER_LAYERS_FOLDER_ID
            };

            const layer = this.map.openLayer(options, treeNode);

            this.map.tiles.moveLayerToTop(layer.xId);
        }
    }

    private updateMapObjectSegment() {
        if (this.mapObjectCopy && this.firstPointSelector && this.lastPointSelector) {

            if (this.maxPointsCount === 2) {
                const contourNumber = this.firstPointSelector.contourNumber;
                const startNumber = Math.min(this.firstPointSelector.positionNumber, this.lastPointSelector.positionNumber);
                const finishNumber = Math.max(this.firstPointSelector.positionNumber, this.lastPointSelector.positionNumber);

                for (let positionNumber = startNumber; positionNumber <= finishNumber; positionNumber++) {
                    const point = this.mapObjectCopy.getPoint({ positionNumber, contourNumber, objectNumber: 0 });
                    if (point) {
                        this.mapObjectSegment.addPoint(point);
                    }
                }
            }

            if (this.maxPointsCount === 3 && this.intermediatePointSelector) {
                const pos1 = this.firstPointSelector.positionNumber;
                const pos2 = this.intermediatePointSelector.positionNumber;
                const pos3 = this.lastPointSelector.positionNumber;

                const objectNumber = this.firstPointSelector.objectNumber;
                const contourNumber = this.firstPointSelector.contourNumber;

                if ((pos1 < pos2 && pos2 < pos3) || (pos1 > pos2 && pos2 > pos3)) {
                    const startNumber = Math.min(pos1, pos3);
                    const finishNumber = Math.max(pos1, pos3);

                    for (let positionNumber = startNumber; positionNumber <= finishNumber; positionNumber++) {
                        const point = this.mapObjectCopy.getPoint({ positionNumber, contourNumber, objectNumber });
                        if (point) {
                            this.mapObjectSegment.addPoint(point);
                        }
                    }

                } else { // крайняя точка попала в выбранный участок объекта

                    const positionNumberMax = this.mapObjectCopy.getContourPointsCount(objectNumber, contourNumber) - 1;

                    let isEdgePointFound = false;
                    let wrongDirection = false;
                    let pointCount = 0;

                    let positionNumber = pos1;

                    while (pointCount < positionNumberMax) {

                        const point = this.mapObjectCopy.getPoint({ positionNumber, contourNumber, objectNumber });
                        if (point) {
                            this.mapObjectSegment.addPoint(point);
                        }

                        pointCount++;

                        positionNumber++;

                        if (positionNumber === positionNumberMax) {
                            positionNumber = 0;
                            isEdgePointFound = true;
                        }

                        if (positionNumber === pos3) {

                            const point = this.mapObjectCopy.getPoint({ positionNumber, contourNumber, objectNumber });
                            if (point) {
                                this.mapObjectSegment.addPoint(point);
                            }

                            if (!isEdgePointFound) {
                                wrongDirection = true;
                            }
                            break;
                        }

                    }

                    if (wrongDirection) {

                        this.mapObjectSegment.removeAllPoints();
                        pointCount = 0;
                        if (pos1 === 0) {
                            positionNumber = positionNumberMax;
                        } else {
                            positionNumber = pos1;
                        }

                        while (pointCount < positionNumberMax) {

                            const point = this.mapObjectCopy.getPoint({ positionNumber, contourNumber, objectNumber });
                            if (point) {
                                this.mapObjectSegment.addPoint(point);
                            }

                            pointCount++;

                            positionNumber--;

                            if (positionNumber === 0) {
                                positionNumber = positionNumberMax;
                            }

                            if (positionNumber === pos3) {
                                const point = this.mapObjectCopy.getPoint({
                                    positionNumber,
                                    contourNumber,
                                    objectNumber
                                });
                                if (point) {
                                    this.mapObjectSegment.addPoint(point);
                                }
                                break;
                            }

                        }

                    }

                }


            }

        }
    }

    private get newFloodZoneName(): string {
        const prefix = i18n.t('floodzone.Flood zone') + ' ';

        let newName = prefix + this.buildCounter;
        let name = '';
        if (this.widgetProps.floodZoneName) {
            name = this.widgetProps.floodZoneName;
        }
        while (newName === name) {
            this.buildCounter++;
            newName = prefix + this.buildCounter;
        }
        return newName;
    }

    setAdditionalMessage(text: string) {
        this.widgetProps.additionalMessage = text;
    }

    resetAdditionalMessage() {
        this.widgetProps.additionalMessage = '';
    }

    private resetSelection() {
        this.widgetProps.objectPointsArray.splice(0);
        if (this._action) {
            this._action.setState(RESET_SELECTION, undefined);
        }

        this.clearTaskObject();
        this.map.clearSelectedObjects();
        this.setAction(HIGHLIGHT_OBJECT_ACTION, true);
        this.resetAdditionalMessage();

        this.mapObjectPoints.removeAllPoints();
    }

    private static getAliasPostfix(alias: string): string {
        if (alias.toLowerCase().indexOf('matrix') > -1) {
            return ' (' + i18n.tc('floodzone.Elevation matrix').toLowerCase() + ')';
        }
        return '';
    }
}
