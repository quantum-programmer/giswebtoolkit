/**************************************** Нефедьева О. 12/11/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Показать весь слой в окне                      *
 *                                                                  *
 *                          GWTK SE                                 *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Контрол Показать весь слой в окне карты
     * @class GWTK.ShowLayerExtentControl
     * @constructor GWTK.ShowLayerExtentControl
     */
    GWTK.ViewEntireLayerControl = function(map) {
        
        this.toolname = "viewentirelayer";
        
        this.map = map;
        
        this.idLayer = "";
        
        if (!this.map) {                                                         // карта
            console.log("GWTK.ViewEntireLayerControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        this.init();
    };
    
    GWTK.ViewEntireLayerControl.prototype = {
        
        /**
         * Инициализировать
         * @method init
         */
        init: function() {
            this.initEvents();
        },
        
        /**
         * Инициализация событий
         * @method initEvents
         */
        initEvents: function() {
            var tool = this;
            $(this.map.eventPane).on('showlayerextent.viewentirelayer', function(event) {
                tool.onShowLayerExtent(event);
            });
        },
        
        /**
         * Обработчик события Показать слой
         * @method onShowLayerExtent
         */
        onShowLayerExtent: function(event) {
            if (!event || !event.idlayer || !this.map) {
                return;
            }
            if (this.map.is3dActive()) {
                return;
            }
            this.loadBounds(event);
        },
        
        /**
         * Загрузить габариты слоя
         * @method loadBounds
         * @param event {Object} событие `showlayerextent`
         */
        loadBounds: function(event) {
            
            var maplay = this.map.tiles.getLayerByIdService(event.idlayer);
            
            if (!maplay) {
                return;
            }
            
            var url = maplay.serverUrl ? maplay.serverUrl : maplay.server;
            
            // var server = url.split('?'),
            //     wfs = new WfsQueries(server[0], this.map);
            //
            // wfs.context = this;
            //
            // //wfs.onDataLoad = function (data) { wfs.context.onloadBounds(data) };
            // wfs.onDataLoad = this.onloadBounds.bind(this);
            //
            // wfs.sendRequest({ 'restmethod': 'GetBound', 'layer_id': event.idlayer });
            
            const server = url.split('?')[0];
            const httpParams = GWTK.RequestServices.createHttpParams(this.map, { url: server });
            const wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            wfs.getBound({ LAYER: event.idlayer }).then((result) => {
                this.onloadBounds(result.data);
            })
        },
        
        /**
         * Обработать загрузку габаритов слоя (запроса GetBound).
         *
         * @method onloadBounds
         * @param response {string} строка ответа, габариты слоя, градусы
         */
        onloadBounds: function(response) {
            
            // Проверить существование подстроки "Format"
            var pos = -1;
            if (response) {
                pos = response.indexOf('Format');
            }
            if (pos === -1) {
                console.log("GWTK.WfsRestRequests.onloadBounds. " + w2utils.lang("Failed to get data"));
                if (response) {
                    console.log(response);
                }
                return;
            }
            
            var val = response.substr(0, pos),
                coord = val.split(' ');
            if (coord.length !== 4) {
                return;
            }
            
            if (typeof this.map.options.maxBounds == 'undefined') {
                this.map.showMapExtent(parseFloat(coord[1]), parseFloat(coord[0]), parseFloat(coord[3]), parseFloat(coord[2]));
                return;
            }
            
            var min = new GWTK.LatLng(parseFloat(coord[1]), parseFloat(coord[0])),
                max = new GWTK.LatLng(parseFloat(coord[3]), parseFloat(coord[2])),
                bounds = GWTK.latLngBounds(min, max);
            
            if (!this.map.options.maxBounds.intersects(bounds)) {
                console.log('GWTK.ViewEntireLayerControl. ' + 'Layer bounds are out of map max bounds');
                w2alert('Layer bounds are out of map max bounds' + '!');
                return;
            }
            
            // обрезаем габариты слоя по maxBounds карты
            var max_sw = this.map.options.maxBounds.getSouthWest(),
                max_ne = this.map.options.maxBounds.getNorthEast();
            
            if (min.lat < max_sw.lat) {
                min.lat = max_sw.lat;
            }
            if (max.lat > max_ne.lat) {
                max.lat = max_ne.lat;
            }
            if (min.lng < max_sw.lng) {
                min.lng = max_sw.lng;
            }
            if (max.lng > max_ne.lng) {
                max.lng = max_ne.lng;
            }
            
            this.map.showMapExtent(min.lat, min.lng, max.lat, max.lng);
            
        },
        
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            $(this.map.eventPane).off('.viewentirelayer');
        }
        
        
    };
    
}