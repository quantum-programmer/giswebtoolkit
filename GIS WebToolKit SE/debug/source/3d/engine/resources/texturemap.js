/******************************************** Тазин В. 25/08/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент реестра текстур                      *
 *                                                                  *
 *******************************************************************/

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Компонент реестра текстур
     * @class GWTK.gEngine.Renderer.TextureMap
     */
    GWTK.gEngine.Renderer.TextureMap = (function () {

            var _CACHE = 400;

            /**
             * Запись в реестре
             * @class MapEntry
             * @public
             * @param rName {string} Название ресурса
             * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
             * @param locked {boolean} Защита от удаления
             */
            var MapEntry = function (rName, texture, locked) {
                this.mName = rName;
                this.mTexture = texture;
                this.mLocked = !!locked;
                this.mLastTimeRequested = Date.now();
            };
            // Хранилище ресурсов
            var mTextureMap = {};
            var mCount = 0;
            var TextureMap = function () {
            };
            TextureMap.prototype = {

                /**
                 * Добавить текстуру в реестр
                 * @method _addEntry
                 * @private
                 * @param rName {string} Название текстуры
                 * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
                 * @param locked {boolean} Защита от удаления
                 */
                _addEntry: function (rName, texture, locked) {
                    mTextureMap[rName] = new MapEntry(rName, texture, locked);
                    mCount++;
                },
                /**
                 * Освободить память за счет неиспользуемых текстур
                 * @method freeMemory
                 * @public
                 */
                freeMemory: function () {
                    var i = mCount;
                    var curTime = Date.now() - GWTK.gEngine.GLOBAL_LIVETIME;
                    var timeToExit = Date.now() + 33;
                    for (var name in mTextureMap) {
                        if (mCount <= _CACHE || i <= 0 || Date.now() >= timeToExit) {
                            break;
                        }
                        var entry = mTextureMap[name];
                        if (entry.mLocked !== true && curTime > entry.mLastTimeRequested) {
                            this.unloadEntry(name);
                        }
                        i--;
                    }
                },
                /**
                 * Извлечь тестуру или создать новую
                 * @method retrieveOrCreate
                 * @public
                 * @param rName {string} Название текстуры
                 * @param description {GWTK.gEngine.Renderer.Texture2DDescription} Описание текстуры
                 * @param img {object|null} Изображение
                 * @param locked {boolean} Флаг защиты от удаления при превышении размера кеша
                 * @param sampler {object|null} Шаблон использования текстуры в контексте (GWTK.gEngine.Renderer.TextureSamplers)
                 * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
                 */
                retrieveOrCreate: function (rName, description, img, locked, sampler) {
                    var r = this.retrieveEntry(rName);
                    if (r === undefined) {
                        if (img) {
                            r = GWTK.gEngine.Renderer.GraphicDevice.createTexture2D(description, img, sampler);
                        } else {
                            r = GWTK.gEngine.Renderer.GraphicDevice.createEmptyTexture2D(description, sampler);
                        }
                        this._addEntry(rName, r, locked);
                    }
                    return r;
                },
                /**
                 * Проверка существования ресурса
                 * @method hasEntry
                 * @public
                 * @param rName {string} Название текстуры
                 * @return {boolean} Текстура существует
                 */
                hasEntry: function (rName) {
                    return (mTextureMap[rName] !== undefined);
                },

                /**
                 * Извлечь тестуру
                 * @method retrieveEntry
                 * @public
                 * @param rName {string} Название текстуры
                 * @return {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
                 */
                retrieveEntry: function (rName) {
                    var r;
                    var entry = mTextureMap[rName];
                    if (entry !== undefined) {
                        r = entry.mTexture;
                        entry.mLastTimeRequested = Date.now();
                    }
                    return r;
                },
                /**
                 * Снятие защиты от удаления
                 * @method unlockEntry
                 * @public
                 * @param rName {string} Название текстуры
                 */
                unlockEntry: function (rName) {
                    var entry = mTextureMap[rName];
                    if (entry !== undefined) {
                        entry.mLocked = false;
                    }
                },
                /**
                 * Установка защиты от удаления
                 * @method lockEntry
                 * @public
                 * @param rName {string} Название текстуры
                 */
                lockEntry: function (rName) {
                    var entry = mTextureMap[rName];
                    if (entry !== undefined) {
                        entry.mLocked = true;
                    }
                },

                /**
                 * Удаление ссылки на текстуру (и саму текстуру)
                 * @method unloadEntry
                 * @public
                 * @param rName {string} Название текстуры
                 */
                unloadEntry: function (rName) {
                    var entry = mTextureMap[rName];
                    if (entry !== undefined) {
                        entry.mTexture.cleanUp();
                        delete mTextureMap[rName];
                    }
                    mCount--;
                },
                /**
                 * Удаление всех текстур
                 * @method unloadAll
                 * @public
                 */
                unloadAll: function () {
                    for (var name in mTextureMap) {
                        mTextureMap[name].mTexture.cleanUp();
                    }
                    mTextureMap = {};
                    mCount = 0;
                }
            };
            return new TextureMap();
        }()
    )
}