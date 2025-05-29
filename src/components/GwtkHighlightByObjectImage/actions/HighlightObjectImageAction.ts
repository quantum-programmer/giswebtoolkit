/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *           Обработчик выбора объекта для поиска по его виду       *
 *                                                                  *
 *******************************************************************/

import GwtkHighlightByObjectImageTask
    from '@/components/GwtkHighlightByObjectImage/task/GwtkHighlightByObjectImageTask';
import HighlightObjectAction from '~/systemActions/HighlightObjectAction';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import SearchManager from '~/services/Search/SearchManager';
import MapObject from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';


/**
 * Обработчик выбора первой точки для DirectGeodetic
 * @class MapCalculationsDirectAction
 * @extends AppendPointAction<GwtkMapCalculationsTask>
 */
export default class HighlightObjectImageAction extends HighlightObjectAction<GwtkHighlightByObjectImageTask> {

    /**
     * Применить объект
     * @method run
     */
    run() {
        if ( this.mapObject  && !this.parentTask.taskActive ) {
            if ( this.mapObject.objectName ) {
                this.mapWindow.addSnackBarMessage( this.mapObject.objectName );
                this.parentTask.run( this.mapObject );
            }
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        this.run();
    }

    canShowObjectPanel(): boolean {
        return true;
    }


    destroy() {
        super.destroy();
        this.parentTask.detachTask();
    }

    setup() {
        super.setup();
    }


    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        if (!this.searchManager) {
            this.searchManager = new SearchManager(this.map);
        }
        const result = await this.searchManager.findWithinBounds(this.map.getWindowBounds(), undefined, undefined, { noGraphicObjects: true });

        if (result && result.mapObjects) {
            return MapObject.sortMapObjectsByType(result.mapObjects);
        } else {
            this.map.writeProtocolMessage({ text: i18n.tc('phrases.No items found'), type: LogEventType.Info, display: true });
        }

    }

}
