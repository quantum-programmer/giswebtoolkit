/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик создания объекта                   *
 *                                                                  *
 *******************************************************************/

import ActionLink from '~/taskmanager/ActionLink';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import GwtkMapEditorTask, {
    CREATE_MODE_ACTION,
    CREATE_MODE_CIRCLE_ACTION,
    CREATE_MODE_INCLINED_RECTANGLE_ACTION,
    CREATE_MODE_RECTANGLE_ACTION,
    CREATE_OBJECT_COMMIT,
    CREATE_OBJECT_FROM_OBJECT,
    CREATE_OBJECT_MANUAL_INPUT_COORDS,
    GwtkMapEditorTaskState,
    OPEN_PUBLISH_OBJECT_DIALOG,
    PUBLISH_OBJECT_FROM_FILE_DATA,
    SET_OBJECT_EDITOR_DATA,
    SELECT_LAYOUT
} from '@/components/GwtkMapEditor/task/GwtkMapEditorTask';
import { EditorLayoutDescription, LEGEND_OBJECT_DRAWING_TYPE } from '~/types/Types';
import {ServiceResponse} from '~/services/Utils/Types';
import {GetLoadDataResponse} from '~/services/RequestServices/RestService/Types';
import GeoJSON, {GeoJsonType} from '~/utils/GeoJSON';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {OUTTYPE} from '~/services/RequestServices/common/enumerables';
import RequestService from '~/services/RequestServices/common/RequestService';

/**
 * Обработчик создания объекта
 * @class CreateObjectActionLink
 * @extends ActionLink<GwtkMapEditorTask>
 */
export default class CreateObjectActionLink extends ActionLink<GwtkMapEditorTask> {

    /**
     * Флаг готовности обработчика
     * @private
     * @property isReady {boolean}
     */
    private isReady = false;

    /**
     * Объект карты
     * @private
     * @property mapObject {MapObject}
     */
    private mapObject: MapObject | undefined;

    setState<K extends keyof GwtkMapEditorTaskState>( key: K, value?: GwtkMapEditorTaskState[K] ) {
        switch ( key ) {
            case PUBLISH_OBJECT_FROM_FILE_DATA:
                
                const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
                const service = RequestServices.getService(serviceUrl, ServiceType.REST);
                const result: ServiceResponse<GetLoadDataResponse> = value as ServiceResponse<GetLoadDataResponse>;
                if ( result.data ) {
                    const layerId = result.data.restmethod.createlayerlist[0].id;
                    const getObjects = service.getFeatureMetric.bind(service) as () => Promise<ServiceResponse<GeoJsonType>>;
                    const options = [
                        {
                            LAYER: encodeURIComponent(layerId),
                            OUTTYPE: OUTTYPE.JSON,
                            COUNT: '1',
                            OUTCRS: this.map.getCrsString(),
                            NOHEIGHTCOORDINATE:'0', 
                        }
                    ];
                    const cancellableRequestGetObjects = RequestService.sendCancellableRequest(getObjects, options);
                    cancellableRequestGetObjects.promise.then(response => {
                        if (response && response.data) {
                            const geoJSON = new GeoJSON(response.data);
                            const feature = geoJSON.featureCollection.getFeature(0)?.toJSON();
                            if (feature) {
                                this.mapObject?.updateGeometryFromJSON(feature);
                                this.mapWindow.getTaskManager().onCommit();
                            }
                        }
                    });
                }
                break;
            default:
                super.setState(key, value);
        }
    }

    destroy() {
        super.destroy();
        this.parentTask.setState(SET_OBJECT_EDITOR_DATA, undefined);
        this.parentTask.setState(SELECT_LAYOUT, undefined);
        this.map.requestRender();
    }

    async setup() {
        try {
            const result = await this.parentTask.getMapObjectDescription(this.id) as EditorLayoutDescription;
            if (result) {
                const vectorLayer = this.map.getVectorLayerByxId(result.layerXid);
                if (vectorLayer) {
                    let activeObjectWithGeometry;
                    this.isReady = true;
                    this.mapObject = new MapObject(vectorLayer, result.mapObjectType || MapObjectType.LineString, result.objectDescription);
                    if (result.objectDescription.semantics) {
                        this.mapObject.addSemanticList(result.objectDescription.semantics);
                    }
                    if (result.drawingType === LEGEND_OBJECT_DRAWING_TYPE.FromObject) {
                        activeObjectWithGeometry = this.map.getActiveObject();
                    }
                    this.map.setActiveObject(this.mapObject);

                    switch (result.drawingType) {
                        case LEGEND_OBJECT_DRAWING_TYPE.AnyContour:
                            this.setLinkAction(CREATE_MODE_ACTION);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.HorizontalRectangle:
                            this.setLinkAction(CREATE_MODE_RECTANGLE_ACTION);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.InclinedRectangle:
                            this.setLinkAction(CREATE_MODE_INCLINED_RECTANGLE_ACTION);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.Circle:
                            this.setLinkAction(CREATE_MODE_CIRCLE_ACTION);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.FromFile:
                            this.parentTask.setState(OPEN_PUBLISH_OBJECT_DIALOG, undefined);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.ManualInput:
                            this.parentTask.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS, undefined);
                            break;
                        case LEGEND_OBJECT_DRAWING_TYPE.FromObject:
                            this.parentTask.setState(CREATE_OBJECT_FROM_OBJECT, activeObjectWithGeometry);
                            break;
                        default:
                            this.parentTask.quitAction(this.id);
                    }

                } else {
                    this.parentTask.quitAction(this.id);
                }
            }
        } catch (error) {
            this.parentTask.quitAction(this.id);
        }
    }

    canSelectObject() {
        return !this.isReady;
    }

    commit() {
        super.commit();
        this.setLinkAction();
        const mapObject = this.map.getActiveObject();
        if (mapObject) {
            this.parentTask.setState(CREATE_OBJECT_COMMIT, mapObject);
        }
        this.parentTask.quitAction(this.id);
    }

    revert() {
        super.revert();
        this.quit();
    }
}
