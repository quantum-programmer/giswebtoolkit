/******************************************** Тазин В. 13/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Класс параметров рисования                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Класс параметров рисования
     * @class GWTK.gEngine.Renderer.DrawState
     * @constructor GWTK.gEngine.Renderer.DrawState
     * @param renderState {GWTK.gEngine.Renderer.RenderState} Cостояние контекста рисования
     * @param shaderProgram {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа шейдера
     * @param [vertexArray] {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Вершинный массив контекста
     */
    GWTK.gEngine.Renderer.DrawState = function (renderState, shaderProgram, vertexArray) {
        this.renderState = renderState;
        this.shaderProgram = shaderProgram;
        this.vertexArray = vertexArray;
        this.instancedArray = null;
    };
    GWTK.gEngine.Renderer.DrawState.prototype = {
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function () {
            this.renderState = null;
            this.shaderProgram.destroy();
            this.shaderProgram = null;
            this.vertexArray.destroy();
            this.vertexArray = null;
            this.instancedArray = null;
        }
    };


}