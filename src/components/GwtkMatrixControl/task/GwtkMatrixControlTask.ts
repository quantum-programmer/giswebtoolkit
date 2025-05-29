/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Задача компонента "Значения матриц в точке"           *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import {MouseDeviceEvent} from '~/input/MouseDevice';
import Rectangle from '~/geometry/Rectangle';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {HttpParams} from '~/services/RequestServices/common/RequestService';
import {ParseTextToXml} from '~/services/Utils/XMLDoc';
import {GetCoveragePointParams, GetCoveragePointResponse} from '~/services/RequestServices/RestService/Types';
import Utils from '~/services/Utils';
import i18n from '@/plugins/i18n';
import GwtkMatrixControlWidget from '@/components/GwtkMatrixControl/task/GwtkMatrixControlWidget.vue';
import {LogEventType} from '~/types/CommonTypes';
import {DataChangedEvent} from '~/taskmanager/TaskManager';
import GwtkError from '~/utils/GwtkError';


type MatrixItem = {
    name: string;
    unit: string;
    value: string;
    idLayer: string;
    xId: string;
    rect: Rectangle;
}

export type ServiceMatrixList = {
    serviceUrl: string;
    matrixItems: MatrixItem[];
}

export type WidgetParams = {
    serviceMatrixList: ServiceMatrixList[];
    errorMessage: string;
    isWaiting: boolean;
}

/**
 * Компонент "Значения матриц в точке"
 * @class GwtkMatrixControlTask
 * @extends Task
 */
export default class GwtkMatrixControlTask extends Task {

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private resultData?: GetCoveragePointResponse;

    private readonly initialServiceMatrixList: ServiceMatrixList[] = [];

    /**
     * Минимальный размер экрана для отображения компонента в окне
     * @private
     * @readonly
     * @property displayLG {Number}
     */
    private readonly displayLG: number = 1280;

    /**
     * @constructor GwtkMatrixControlTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.onMouseMove = Utils.throttle(this.onMouseMove.bind(this), 300);

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            serviceMatrixList: [],
            errorMessage: '',
            isWaiting: false
        };

        this.initMatrixLayer().then(() => this.onDataChanged({type: 'content'}));

    }

    onMouseMove(event: MouseDeviceEvent) {

        const position = this.map.pixelToPlane(event.mousePosition);

        const coordinates = position.toOrigin();
        const geo = position.toGeoPoint();
        const CRS = this.map.getCrsString();

        if (coordinates && CRS && geo) {

            const layerIdArrayServiceList: { layerIdArray: string[]; serviceUrl: string }[] = [];

            this.widgetProps.serviceMatrixList.forEach(serviceMatrixItem => {

                const layerIdArray: string[] = [];

                serviceMatrixItem.matrixItems.forEach(item => {
                    const layer = this.map.tiles.getLayerByxId(item.xId);
                    if (layer) {
                        if (item.rect.contains(geo.getLongitude(), geo.getLatitude())) {
                            layerIdArray.push(item.idLayer);
                        } else {
                            item.value = '';
                        }
                    }

                });

                layerIdArrayServiceList.push({ serviceUrl: serviceMatrixItem.serviceUrl, layerIdArray });

            });

            for (let i = 0; i < layerIdArrayServiceList.length; i++) {
                const layerIdArrayService = layerIdArrayServiceList[i];

                if (layerIdArrayService.layerIdArray.length > 0) {

                    const requestParams: GetCoveragePointParams = {
                        LAYER: layerIdArrayService.layerIdArray.toString(),
                        POINT: coordinates[0] + ',' + coordinates[1],
                        CRS
                    };

                    const httpParams: HttpParams = {url: layerIdArrayService.serviceUrl};

                    const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

                    service.getCoveragePoint(requestParams).then(result => {

                        if (result.data) {

                            this.resultData = result.data;

                            for (const resultKey in this.resultData) {
                                const resultItem = this.resultData[resultKey];

                                const serviceMatrixItem = this.widgetProps.serviceMatrixList.find(item => item.serviceUrl === layerIdArrayService.serviceUrl);

                                if (serviceMatrixItem) {

                                    const index = serviceMatrixItem.matrixItems.findIndex(item => item.idLayer === resultKey);

                                    if (resultItem.value && resultItem.value !== -111111 && resultItem.value !== -32767000) {
                                        serviceMatrixItem.matrixItems[index].value = resultItem.value.toFixed(2);
                                    } else {
                                        serviceMatrixItem.matrixItems[index].value = '';
                                        serviceMatrixItem.matrixItems[index].unit = '';
                                    }
                                    serviceMatrixItem.matrixItems[index].unit = resultItem.unit ? i18n.tc('phrases.' + resultItem.unit) : '';

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
                        this.map.writeProtocolMessage({text: e, type: LogEventType.Error});
                    });

                }

            }

        }
    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'content' || (event.type === 'layercommand' && event.command === 'visibilitychanged')) {

            this.widgetProps.serviceMatrixList.splice(0);

            if (this.initialServiceMatrixList.length > 0) {
                this.initialServiceMatrixList.forEach(serviceMatrixItem => {

                    const matrixItems: MatrixItem[] = [];

                    serviceMatrixItem.matrixItems.forEach(matrix => {
                        const layer = this.map.getLayer(matrix.idLayer, serviceMatrixItem.serviceUrl);

                        if (layer && layer.visible) {
                            let index = -1;
                            const currentServiceMatrixItem = this.widgetProps.serviceMatrixList.find(item => item.serviceUrl === serviceMatrixItem.serviceUrl);
                            if (currentServiceMatrixItem) {
                                index = currentServiceMatrixItem.matrixItems.findIndex(matrixLayer => matrixLayer.xId === matrix.xId);
                            }

                            if (index === -1) {
                                matrixItems.push(matrix);
                            }
                        }
                    });

                    if (matrixItems.length > 0) {
                        this.widgetProps.serviceMatrixList.push({ serviceUrl: serviceMatrixItem.serviceUrl, matrixItems });
                    }

                });

                if (this.widgetProps.serviceMatrixList.length === 0) {
                    this.widgetProps.errorMessage = i18n.tc('matrixcontrol.There are no visible matrices in the map');
                }
            }

        }

    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMatrixControlWidget';
        const source = GwtkMatrixControlWidget;
        this.mapWindow.registerComponent(name, source);

        // Создание Vue компонента
        if (this.map.getWindowRect().width > this.displayLG) {
            this.mapWindow.createWindowWidget(name, this.widgetProps);
        } else {
            this.mapWindow.createWidget(name, this.widgetProps);
        }

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    /**
     * Инициализация матриц высот
     * @private
     * @async
     * @method initMatrixLayer
     */
    private async initMatrixLayer() {
        this.widgetProps.isWaiting = true;

        const serviceUrlList: string[] = [];

        this.map.vectorLayers.forEach(item => {
            const serviceUrl = item.serviceUrl;
            if (!serviceUrlList.includes(serviceUrl)) {
                serviceUrlList.push(serviceUrl);
            }
        });

        for (let serviceNumber = 0; serviceNumber < serviceUrlList.length; serviceNumber++) {

            const serviceUrl = serviceUrlList[serviceNumber];
            const httpParams: HttpParams = {url: serviceUrl};
            const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.WCS);

            const matrixItems: MatrixItem[] = [];

            try {
                const result = await service.getCapabilities();

                if (result.data) {
                    const xml = ParseTextToXml(result.data);
                    const element = xml.findByTag('wcs:Contents');

                    if (element) {
                        for (let i = 0; i < element.children.length; i++) {

                            const child = element.children[i];
                            const coverageId = child.findByTag('wcs:CoverageId');
                            if (!coverageId || !coverageId.data) {
                                continue;
                            }

                            const layer = this.map.getLayer(coverageId.data, serviceUrl);
                            if (!layer) {
                                continue;
                            }

                            const bbox = child.findByTag('ows:WGS84BoundingBox');
                            let rect: Rectangle = new Rectangle(0, 0, 0, 0);
                            if (!bbox) {
                                continue;
                            }

                            for (let j = 0; j < bbox.children.length; j++) {
                                const bboxChild = bbox.children[j];
                                const lowerCorner = bboxChild.findByTag('ows:LowerCorner');
                                if (lowerCorner && lowerCorner.data) {
                                    const data = lowerCorner.data.split(' ');
                                    rect.left = parseFloat(data[0]);
                                    rect.top = parseFloat(data[1]);
                                }

                                const upperCorner = bboxChild.findByTag('ows:UpperCorner');
                                if (upperCorner && upperCorner.data) {
                                    const data = upperCorner.data.split(' ');
                                    rect.right = parseFloat(data[0]);
                                    rect.bottom = parseFloat(data[1]);

                                }
                            }

                            matrixItems.push({
                                value: '',
                                unit: '',
                                name: layer.alias,
                                idLayer: layer.idLayer,
                                xId: layer.xId,
                                rect: rect
                            });

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
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({ text: gwtkError.message, type: LogEventType.Error });
            }

            if (matrixItems.length) {
                this.initialServiceMatrixList.push({ serviceUrl, matrixItems });
            }

        }

        if (!this.initialServiceMatrixList.length) {
            this.widgetProps.errorMessage = i18n.tc('matrixcontrol.There are no matrices in the map');
        }

        this.widgetProps.isWaiting = false;

    }

}
