/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Компонент "Просмотр списка выделенных              *
 *                              объектов"                           *
 *                                                                  *
 *******************************************************************/

import { MapObjectPanelState } from '~/taskmanager/TaskManager';
import MapWindow from '~/MapWindow';
import GwtkMapObjectTask, { SELECT_MODE, SINGLE_MODE_FLAG }
    from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';

/**
 * Обработчик создания компонента
 * @class GwtkSelectedObjectsViewerTask
 * @extends GwtkMapObjectTask
 */
export default class GwtkSelectedObjectsViewerTask extends GwtkMapObjectTask {

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
    }

    setup() {
        this.setState(SELECT_MODE, MapObjectPanelState.showSelectedObjects);
        this.setState(SINGLE_MODE_FLAG, false);
    }

}
