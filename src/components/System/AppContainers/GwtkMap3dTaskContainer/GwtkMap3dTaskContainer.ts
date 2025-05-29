/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Системный компонент панели 3D вида                 *
 *                                                                  *
 *******************************************************************/

import { Component } from 'vue-property-decorator';
import GwtkCommonContainer from '../GwtkCommonContainer';

/**
 * Системный компонент панели 3D вида
 * @class GwtkMap3dTaskContainer
 * @extends GwtkCommonContainer
 */
@Component
export default class GwtkMap3dTaskContainer extends GwtkCommonContainer {


    /**
     * Ширина панели
     * @private
     * @property width {number}
     */
    private width = 350;


    /**
     * Проверка активности компонентов
     * @private
     * @property isActive {boolean}
     */
    private get isActive() {
        return this.components.length > 0;
    }

}
