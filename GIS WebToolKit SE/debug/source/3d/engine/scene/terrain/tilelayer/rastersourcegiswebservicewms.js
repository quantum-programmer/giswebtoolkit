/******************************************** Тазин В. 10/03/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Источник WMS тайлов GisWebServiceSE                 *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};
    /**
     * Класс источника WMS тайлов GisWebServiceSEWmsTile
     * @class GWTK.gEngine.Scene.GisWebServiceSEWmsTile
     * @extends GWTK.gEngine.Scene.RasterSource
     * @constructor GWTK.gEngine.Scene.GisWebServiceSEWmsTile
     * @param layerDescription {GWTK.LayerDescription} Описание слоя
     * @param projection {GWTK.gEngine.Core.Projection} Проекция
     * @param [messageQueue] Очередь сообщений потока
     */
    GWTK.gEngine.Scene.GisWebServiceSEWmsTile = function (layerDescription, projection, messageQueue) {
        GWTK.gEngine.Scene.RasterSource.call(this, layerDescription, projection, messageQueue);
        this._projection = projection;
        this.mBbox = [];
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.GisWebServiceSEWmsTile, GWTK.gEngine.Scene.RasterSource);

    /**
     * Получить ссылку на тайл
     * @method getLoadingSource
     * @public
     * @param rasterUrl {GWTK.gEngine.Scene.RasterSourceUrl} Источник для загрузки тайлов
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @return {string} Ссылка на тайл
     */
    GWTK.gEngine.Scene.GisWebServiceSEWmsTile.prototype._getLoadingSource = function (rasterUrl, identifier) {
        var bbox = this._projection.getTileBbox(identifier, this.mBbox);
        return rasterUrl.getUrl(bbox);
    };

    /**
     * Добавить источники для загрузки тайлов
     * @method _addRasterUrl
     * @private
     * @param layerDescription {GWTK.LayerDescription} Описание слоя
     */
    GWTK.gEngine.Scene.GisWebServiceSEWmsTile.prototype._addRasterUrl = function (layerDescription) {
        for (var i = 0; i < layerDescription.linkedUrls.length; i++) {
            var urlString = layerDescription.linkedUrls[i].href;
            var string = urlString.replace(/%crs/g, 'EPSG:' + layerDescription.getCRS());
            string = string.replace(/%h/g, '' + layerDescription.tileHeight);
            string = string.replace(/%w/g, '' + layerDescription.tileWidth);
            this._rasterUrlList.push(new GWTK.gEngine.Scene.RasterSourceWmsUrl(urlString.slice(0, urlString.indexOf("?")), string));
        }
    };


    /**
     * Класс источника для загрузки WMS тайлов
     * @class GWTK.gEngine.Scene.RasterSourceWmsUrl
     * @extends GWTK.gEngine.Scene.RasterSourceUrl
     * @constructor GWTK.gEngine.Scene.RasterSourceWmsUrl
     * @param serviceUrl {string} Строка адреса сервиса
     * @param urlString {string} Строка для запроса
     */
    GWTK.gEngine.Scene.RasterSourceWmsUrl = function (serviceUrl, urlString) {
        GWTK.gEngine.Scene.RasterSourceUrl.call(this, serviceUrl, urlString);
        this._keyList = {
            '%bbox': null,
            '%dt': null
        };
    };
    GWTK.gEngine.inheritPrototype(GWTK.gEngine.Scene.RasterSourceWmsUrl, GWTK.gEngine.Scene.RasterSourceUrl);
    /**
     * Параметр для замены строки
     * @property _re {string}
     * @static
     */
    GWTK.gEngine.Scene.RasterSourceWmsUrl.prototype._re = /%bbox|%dt/g;
    /**
     * Получить ссылку на тайл
     * @method getUrl
     * @public
     * @param bbox {array} Границы тайла
     * @return {string} Ссылка на тайл
     */
    GWTK.gEngine.Scene.RasterSourceWmsUrl.prototype.getUrl = function (bbox) {
        this._keyList['%bbox'] = bbox.join(",");
        this._keyList['%dt'] = '' + Date.now();
        return this._baseUri.href.replace(this._re, this._replacer);
    };
}