/******************************************** Тазин В. 22/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Класс состояния фильтрации по нормали поверхности          *
 *                                                                  *
 *******************************************************************/
import { WindingOrder } from '~/3d/engine/core/geometry/mesh';

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};



    /**
     *  Класс состояния фильтрации по нормали поверхности
     * @class GWTK.gEngine.Renderer.FacetCulling
     * @constructor GWTK.gEngine.Renderer.FacetCulling
     */
    GWTK.gEngine.Renderer.FacetCulling = function () {
        this.enabled = true;
        this.face = GWTK.gEngine.Renderer.enumCullFaceMode.Back;
        this.frontFaceWindingOrder = WindingOrder.Counterclockwise;
    };
}