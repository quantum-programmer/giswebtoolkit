/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *      Обработчик выбора прямоугольного фрагмента для печати       *
 *                                                                  *
 *******************************************************************/

import GwtkPrintMapTask, { UPDATE_MAP_FRAME } from '@/components/GwtkPrintMap/task/GwtkPrintMapTask';
import SelectFrame from '~/systemActions/SelectFrame';

/**
 * Обработчик выбора прямоугольного фрагмента для печати
 * @class SelectPrintFrame
 * @extends SelectFrame<GwtkPrintMapTask>
 */
export default class SelectPrintFrame extends SelectFrame<GwtkPrintMapTask> {
    setup() {
        super.setup();
        this.mapWindow.hideElements();
    }

    run() {
        if ( this.frame ) {
            this.parentTask.setState( UPDATE_MAP_FRAME, this.frame );
        }
    }

    destroy() {
        super.destroy();
        this.mapWindow.showElements();
    }
}
