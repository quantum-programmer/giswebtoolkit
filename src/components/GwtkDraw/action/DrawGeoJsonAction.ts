/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Нанесение GeoJson на карту                            *
 *                                                                  *
 *******************************************************************/

import GwtkDrawTask, { COMMIT_GEOJSON_OBJECT } from '../task/GwtkDrawTask';
import Action from '~/taskmanager/Action';


/**
 * Обработчик нанесения точки
 * @class DrawGeoJsonAction
 * @extends Action<GwtkDrawTask>
 */
export default class DrawGeoJsonAction extends Action<GwtkDrawTask> {

    setup() {
        super.setup();
        this.parentTask.setState(COMMIT_GEOJSON_OBJECT, undefined);
    }
}
