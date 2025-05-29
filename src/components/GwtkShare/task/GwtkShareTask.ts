/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Поделиться"                     *
 *                                                                  *
 *******************************************************************/
import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import i18n from '@/plugins/i18n';
import { BrowserService } from '~/services/BrowserService';

/**
 * Компонент "Поделиться"
 * @class GwtkShareTask
 * @extends Task
 */
export default class GwtkShareTask extends Task {

    /**
     * @constructor GwtkShareTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        this.copyUrl();
    }

    setup() {
        this.mapWindow.getTaskManager().detachTask( this.id );
    }


    /**
     * Скопировать ссылку в буфер обмена
     */
    copyUrl() {
        const mapLink = this.map.getMapLink();
        if (mapLink) {
            // скопировать в буфер обмена
            BrowserService.copyToClipboard(mapLink).then(() => {
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Link copied to clipboard'));
            }).catch(() => {
                this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Copy failed'));
            });
        }
    }
}
