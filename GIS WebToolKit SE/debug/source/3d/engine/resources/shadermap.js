/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент реестра шейдеров                     *
 *                                                                  *
 *******************************************************************/

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Компонент реестра ресурсов
     * @class GWTK.gEngine.Renderer.ShaderMap
     */
    GWTK.gEngine.Renderer.ShaderMap = (function () {

            /**
             * Запись в реестре
             * @class MapEntry
             * @public
             * @param shaderProgram {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Название ресурса
             */
            var MapEntry = function (shaderProgram) {
                this.mShaderProgram = shaderProgram;
                this.mRefCount = 1;
            };
            // Хранилище ресурсов
            var mShaderMap = {};

            var ShaderMap = function () {
            };
            ShaderMap.prototype = {

                /**
                 * Добавить шейдер в реестр
                 * @method _addEntry
                 * @private
                 * @param rName {string} Название шейдера
                 * @param shaderProgram {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа шейдера
                 */
                _addEntry: function (rName, shaderProgram) {
                    mShaderMap[rName] = new MapEntry(shaderProgram);
                },

                /**
                 * Извлечь шейдер или создать новый
                 * @method retrieveOrCreate
                 * @public
                 * @param rName {string} Название шейдера
                 * @param vertexShaderSource {string} Текст вершинного шейдера
                 * @param fragmentShaderSource {string} Текст фрагментного шейдера
                 * @return {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl} Программа шейдера
                 */
                retrieveOrCreate: function (rName, vertexShaderSource, fragmentShaderSource) {
                    var r = this.retrieveEntry(rName);
                    if (r === null) {
                        r = GWTK.gEngine.Renderer.GraphicDevice.createShaderProgram(vertexShaderSource, fragmentShaderSource);
                        this._addEntry(rName, r);
                    }
                    return r;
                },

                /**
                 * Извлечь шейдер
                 * @method retrieveEntry
                 * @public
                 * @param rName {string} Название шейдера
                 * @return {GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl|null} Программа шейдера
                 */
                retrieveEntry: function (rName) {
                    var r = null;
                    if (rName in mShaderMap) {
                        r = mShaderMap[rName].mShaderProgram;
                        this._incEntryRefCount(rName);
                    }
                    return r;
                },

                /**
                 * Удаление ссылки на шейдер (если нет ссылок, то удаляет сам шейдер)
                 * @method unloadEntry
                 * @public
                 * @param rName {string} Название шейдера
                 */
                unloadEntry: function (rName) {
                    var c = 0;
                    if (rName in mShaderMap) {
                        c = --mShaderMap[rName].mRefCount;
                        if (c === 0) {
                            mShaderMap[rName].mShaderProgram.cleanUp();
                            delete mShaderMap[rName];
                        }
                    }
                    return c;
                },
                /**
                 * Удаление всех шейдеров
                 * @method unloadAll
                 * @public
                 */
                unloadAll: function () {
                    for (var rName in mShaderMap) {
                        mShaderMap[rName].mShaderProgram.cleanUp();
                    }
                    mShaderMap = {};
                },

                /**
                 * Увеличить количество ссылок на данный шейдер
                 * @method _incEntryRefCount
                 * @private
                 * @param rName {string} Название шейдера
                 */
                _incEntryRefCount: function (rName) {
                    return mShaderMap[rName] && mShaderMap[rName].mRefCount++;
                },
                /**
                 * Получить количество ссылок на данный ресурс
                 * @method getRefCount
                 * @public
                 * @param rName {string} Название ресурса
                 */
                getRefCount: function (rName) {
                    var rCount = 0;
                    if (rName in mShaderMap) {
                        rCount = mShaderMap[rName].mRefCount;
                    }
                    return rCount;
                }

            };

            return new ShaderMap();
        }()
    )
}