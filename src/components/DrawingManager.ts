import {GwtkDraw} from '@/components/GwtkDraw';
import {
    SET_MAP_MARK_COORD,
    DRAW_ACTION_ID,
    DRAW_POINT_ACTION,
    SET_DRAW_MODE,
    DRAW_POLYGON_ACTION,
    SET_JSON,
    SET_BUFFER_ZONE_RADIUS,
    DRAW_GEOJSON_ACTION,
    SET_TOOLTIP_ENABLED,
    CLEAR
} from '@/components/GwtkDraw/task/GwtkDrawTask';
import MapWindow from '~/MapWindow';
import {GeoJsonType} from '~/utils/GeoJSON';


export default class DrawingManager {

    constructor(private readonly mapWindow: MapWindow) {
        GwtkDraw(this.mapWindow);
    }

    private get drawingTask() {
        return this.mapWindow.getTaskManager().getDrawingTask();
    }

    drawPoint(coords?: [string, string], tooltip = false) {
        const mapDrawTask = this.drawingTask;
        if (mapDrawTask) {
            if (coords?.length === 2 && coords.every(coord => !isNaN(Number(coord)))) {
                mapDrawTask.setState(SET_MAP_MARK_COORD, coords);
                mapDrawTask.setState(SET_TOOLTIP_ENABLED, tooltip);
            } else if (coords === undefined) {
                mapDrawTask.setState(DRAW_ACTION_ID, DRAW_POINT_ACTION);
                return new Promise<GeoJsonType>((resolve, reject) => {
                    mapDrawTask.setState(SET_DRAW_MODE, {resolve, reject});
                    mapDrawTask.setState(SET_TOOLTIP_ENABLED, tooltip);
                });
            } else {
                return;
            }
        }
    }

    drawPolygon(tooltip=false) {
        const mapDrawTask = this.drawingTask;
        if (mapDrawTask) {
            mapDrawTask.setState(DRAW_ACTION_ID, DRAW_POLYGON_ACTION);
            return new Promise<GeoJsonType>((resolve, reject) => {
                mapDrawTask.setState(SET_DRAW_MODE, {resolve, reject});
                mapDrawTask.setState(SET_TOOLTIP_ENABLED, tooltip);
            });
        }
    }

    drawGeoJson(json: GeoJsonType, bufferZoneRadius?: number, tooltip=false) {
        const mapDrawTask = this.drawingTask;

        if (mapDrawTask) {
            mapDrawTask.setState(SET_JSON, json);
            mapDrawTask.setState(SET_BUFFER_ZONE_RADIUS, bufferZoneRadius);
            mapDrawTask.setState(DRAW_ACTION_ID, DRAW_GEOJSON_ACTION);
            return new Promise<GeoJsonType | true>((resolve, reject) => {
                mapDrawTask.setState(SET_DRAW_MODE, {resolve, reject});
                mapDrawTask.setState(SET_TOOLTIP_ENABLED, tooltip);
            });
        }
    }

    clear() {
        const mapDrawTask = this.drawingTask;

        if (mapDrawTask) {
            mapDrawTask.setState(CLEAR, undefined);
        }
    }

}
