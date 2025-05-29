/****************************************** Тазин В.О. 22/07/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент реестра ресурсов                     *
 *                                                                  *
 *******************************************************************/

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};

    /**
     * Компонент реестра ресурсов
     * @class GWTK.gEngine.ResourceMap
     */
    GWTK.gEngine.ResourceMap = (function () {

            /**
             * Запись в реестре
             * @class MapEntry
             * @public
             * @param rName {string} Название ресурса
             */
            var MapEntry = function (rName) {
                this.mName = rName;
                this.mAsset = rName;
                this.mRefCount = 1;
                this.loaded = false;
            };

            // Хранилище ресурсов
            var mResourceMap = {};
            var mOnloadQuery = [];
            // var mRequestedList = {};
            // Количество невыполненных операций загрузки
            var mNumOutstandingLoads = 0;
            // Вызываемый обработчик, когда все загрузки выполнены
            var mLoadCompleteCallback = null;
            var mActualLoadCompleteCallback = [];
            /**
             * Проверка загруженных ресурсов и вызов обработчика всех загруженных ресурсов
             * @method _checkForAllLoadCompleted
             * @public
             */
            var _checkForAllLoadCompleted = function () {
                if ((mNumOutstandingLoads === 0) && (typeof mLoadCompleteCallback === 'function')) {
                    // Чтобы обработчик вызвался только 1 раз:
                    mLoadCompleteCallback();
                    mLoadCompleteCallback = null;
                }
            };
            /**
             * Проверка загруженных ресурсов и вызов обработчиков
             * @method _checkForActualLoadCompleted
             * @public
             */
            var _checkForActualLoadCompleted = function () {
                for (var i = 0; i < mActualLoadCompleteCallback.length; i++) {
                    var curList = mActualLoadCompleteCallback[i].loadList;
                    var flag = true;
                    for (var j = 0, curAssetName; (curAssetName = curList[j]); j++) {
                        if (!GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(curAssetName)) {
                            flag = false;
                            break;
                        }
                    }
                    if (flag) {
                        var curEntry = mActualLoadCompleteCallback.splice(i, 1)[0];
                        i--;
                        curEntry.callback();
                    }
                }
            };
            var ResourceMap = function () {
            };
            ResourceMap.prototype = {

                /**
                 * Установить обработчик события завершения всех загрузок
                 * @method setLoadCompleteCallback
                 * @public
                 * @param funct {function} Обработчик
                 */
                setLoadCompleteCallback: function (funct) {
                    mLoadCompleteCallback = funct;
                    // на случай, если все загрузки уже выполнены
                    _checkForAllLoadCompleted();
                },
                /**
                 * Установить обработчик события завершения загрузок определенных ресурсов
                 * @method setActualLoadCompleteCallback
                 * @public
                 * @param loadList {Array} Список идентификаторов загрузок
                 * @param funct {function} Обработчик
                 */
                setActualLoadCompleteCallback: function (loadList, funct) {
                    mActualLoadCompleteCallback.push({'loadList': loadList, 'callback': funct});
                    // на случай, если все загрузки уже выполнены
                    _checkForActualLoadCompleted();
                },
                /**
                 * Добавить ресурс в реестр
                 * @method asyncLoadRequested
                 * @public
                 * @param rName {string} Название ресурса
                 */
                asyncLoadRequested: function (rName) {
                    mResourceMap[rName] = new MapEntry(rName);  // указатель на загружаемый ресурс
                    ++mNumOutstandingLoads;
                },
                /**
                 * Внесение загруженного ресурса в реестр (в mAsset изначально просто ссылка)
                 * @method asyncLoadCompleted
                 * @public
                 * @param rName {string} Название запроса
                 * @param loadedAsset {object} Ресурс
                 */
                asyncLoadCompleted: function (rName, loadedAsset) {
                    if (this.isAssetLoaded(rName)) {
                        mResourceMap[rName].mAsset = loadedAsset;
                        mResourceMap[rName].loaded = true;
                        --mNumOutstandingLoads;
                        _checkForAllLoadCompleted();
                        _checkForActualLoadCompleted();
                        this.update();
                    }

                },
                /**
                 * Принудительное обновление ресурса
                 * @method forceUpdate
                 * @public
                 * @param rName {string} Название запроса
                 * @param asset {object} Ресурс
                 */
                forceUpdate: function (rName, asset) {
                    if (this.isAssetLoaded(rName)) {
                        mResourceMap[rName].mAsset = asset;
                    }
                },
                /**
                 * Статус ресурса в реестре
                 * @method isAssetLoaded
                 * @public
                 * @param rName {string} Название ресурса
                 * @return {boolean} Если ресурс внесен в реестр - вернет `true`
                 */
                isAssetLoaded: function (rName) {
                    return (rName in mResourceMap);
                },
                /**
                 * Статус полной загрузки ресурса
                 * @method isAssetActuallyLoaded
                 * @public
                 * @param rName {string} Название ресурса
                 * @return {boolean} Если ресурс загружен в реестр - вернет `true`
                 */
                isAssetActuallyLoaded: function (rName) {
                    return (rName in mResourceMap && mResourceMap[rName].loaded);
                },
                /**
                 * Извлечь загруженный ресурс (или ссылку на него)
                 * @method retrieveAsset
                 * @public
                 * @param rName {string} Название ресурса
                 * @return {object|null} Ресурс
                 */
                retrieveAsset: function (rName) {
                    var r = null;
                    if (rName in mResourceMap) {
                        r = mResourceMap[rName].mAsset;
                    }
                    return r;
                },
                /**
                 * Извлечь загруженный ресурс (или ссылку на него)
                 * @method retrieveAssetsOnload
                 * @public
                 * @param names {array} Массив запрашиваемых ресурсов
                 * @param callBack {function} Обработчик для ресурса
                 */
                retrieveAssetsOnload: function (names, callBack) {
                    if (this._checkOnloadQueryItem(names)) {
                        callBack();
                    } else {
                        var item = {
                            "idList": names, "callback": callBack
                        };
                        mOnloadQuery.push(item);
                    }
                },
                /**
                 * Проверить, загружены дли все ресурсы из списка
                 * @method _checkOnloadQueryItem
                 * @public
                 * @param names {array} Массив запрашиваемых ресурсов
                 */
                _checkOnloadQueryItem: function (names) {
                    var allItemsLoaded = true;
                    for (var i = 0; i < names.length; i++) {
                        if (!this.isAssetActuallyLoaded(names[i])) {
                            allItemsLoaded = false;
                            break;
                        }
                    }
                    return allItemsLoaded;
                },
                /**
                 * Обновить состояние реестра
                 * @method update
                 * @public
                 */
                update: function () {
                    var count = mOnloadQuery.length;
                    for (var i = 0; i < count; i++) {
                        var item = mOnloadQuery[i];
                        if (this._checkOnloadQueryItem(item.idList)) {
                            item.callback();
                            mOnloadQuery.splice(i, 1);
                            i--;
                            count--;
                        }
                    }
                },


                /**
                 * Удаление ссылки на ресурс (если нет ссылок, то удаляет сам ресурс)
                 * @method unloadAsset
                 * @public
                 * @param rName {string} Название ресурса
                 */
                unloadAsset: function (rName) {
                    var c = 0;
                    if (rName in mResourceMap) {
                        mResourceMap[rName].mRefCount -= 1;
                        if (mResourceMap[rName].mAsset === rName) {
                            --mNumOutstandingLoads;
                        }
                        c = mResourceMap[rName].mRefCount;
                        if (c === 0) {
                            delete mResourceMap[rName];
                        }
                    }
                    return c;
                },
                /**
                 * Удаление всех ресурсов
                 * @method unloadAll
                 * @public
                 */
                unloadAll: function () {
                    for (var rName in mResourceMap) {
                        delete mResourceMap[rName];
                    }
                    mResourceMap = {};
                    mOnloadQuery.length = 0;
                },
                /**
                 * Увеличить количество ссылок на данный ресурс
                 * @method incAssetRefCount
                 * @public
                 * @param rName {string} Название ресурса
                 */
                incAssetRefCount: function (rName) {
                    return mResourceMap[rName] && mResourceMap[rName].mRefCount++;
                },
                /**
                 * Получить количество ссылок на данный ресурс
                 * @method getRefCount
                 * @public
                 * @param rName {string} Название ресурса
                 */
                getRefCount: function (rName) {
                    if (rName in mResourceMap) {
                        return mResourceMap[rName].mRefCount;
                    }
                }

            };

            return new ResourceMap();
        }()
    )
}