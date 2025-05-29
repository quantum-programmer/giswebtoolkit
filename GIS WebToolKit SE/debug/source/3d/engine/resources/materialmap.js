/****************************************** Тазин В.О. 18/02/21  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент реестра материалов                   *
 *                                                                  *
 *******************************************************************/

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Компонент реестра ресурсов
     * @class GWTK.gEngine.MaterialMap
     */
    GWTK.gEngine.Renderer.MaterialMap = (function () {

            /**
             * Запись в реестре
             * @class MapEntry
             * @public
             * @param rName {string} Название ресурса
             * @param material {GWTK.gEngine.Renderer.MaterialDescription} Материал
             */
            var MapEntry = function (rName, material) {
                this.mName = rName;
                this.mMaterial = material;
            };
            // Хранилище ресурсов
            var mMaterialMap = {};
            var mCount = 0;

            var MaterialMap = function () {
                this.retrieveOrCreate(GWTK.gEngine.DEFAULT_MATERIAL, {
                    AmbientColor: [1, 1, 1, 1],
                    DiffuseColor: [0.85, 0.85, 0.85, 1],
                    SpecularColor: [0.15, 0.15, 0.15, 1],
                    EmissiveColor: [0.05, 0.05, 0.05, 1],
                    Shininess: 2,
                    Opacity: 1
                });
            };
            MaterialMap.prototype = {

                /**
                 * Добавить материал в реестр
                 * @method _addEntry
                 * @private
                 * @param rName {string} Название материала
                 * @param material {GWTK.gEngine.Renderer.MaterialDescription} Материал
                 */
                _addEntry: function (rName, material) {
                    mMaterialMap[rName] = new MapEntry(rName, material);
                    mCount++;
                },

                /**
                 * Извлечь материал или создать новый
                 * @method retrieveOrCreate
                 * @public
                 * @param rName {string} Название материала
                 * @param description {object} Описание материала
                 * @return {GWTK.gEngine.Renderer.MaterialDescription} Материал
                 */
                retrieveOrCreate: function (rName, description) {
                    var r = this.retrieveEntry(rName);
                    if (r === undefined) {
                        r = new GWTK.gEngine.Renderer.MaterialDescription(description);
                        this._addEntry(rName, r);
                    }
                    return r;
                },

                /**
                 * Проверка существования ресурса
                 * @method hasEntry
                 * @public
                 * @param rName {string} Название материала
                 * @return {boolean} Материал существует
                 */
                hasEntry: function (rName) {
                    return (mMaterialMap[rName] !== undefined);
                },

                /**
                 * Извлечь материал
                 * @method retrieveEntry
                 * @public
                 * @param rName {string} Название материала
                 * @return {GWTK.gEngine.Renderer.MaterialDescription} Материал
                 */
                retrieveEntry: function (rName) {
                    var r;
                    var entry = mMaterialMap[rName];
                    if (entry !== undefined) {
                        r = entry.mMaterial;
                    }
                    return r;
                },

                /**
                 * Удаление ссылки на материал (и сам материал)
                 * @method unloadEntry
                 * @public
                 * @param rName {string} Название материала
                 */
                unloadEntry: function (rName) {
                    var entry = mMaterialMap[rName];
                    if (entry !== undefined) {
                        delete mMaterialMap[rName];
                    }
                    mCount--;
                },
                /**
                 * Удаление всех материалов
                 * @method unloadAll
                 * @public
                 */
                unloadAll: function () {
                    mMaterialMap = {};
                    mCount = 0;
                    this.retrieveOrCreate(GWTK.gEngine.DEFAULT_MATERIAL, {
                        AmbientColor: [1, 1, 1, 1],
                        DiffuseColor: [0.85, 0.85, 0.85, 1],
                        SpecularColor: [0.15, 0.15, 0.15, 1],
                        EmissiveColor: [0.05, 0.05, 0.05, 1],
                        Shininess: 2,
                        Opacity: 1
                    });
                }

            };

            return new MaterialMap();
        }()
    )
}