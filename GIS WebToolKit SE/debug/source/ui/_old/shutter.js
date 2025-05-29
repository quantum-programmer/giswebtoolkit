/**************************************** Нефедьева О. 30/10/20 ****
 ***************************************** Sokolova Т.  30/09/19 ****
 ***************************************** Гиман Н.     02/11/17 ****
 ***************************************** Патейчук В.  20/05/20 ****
 ***************************************** Помозов Е.В. 02/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Компонент "Шторка"                        *
 *                                                                  *
 *******************************************************************/

import { PixelBounds } from '~/geometry/PixelBounds';

if (window.GWTK) {
    GWTK.ShutterControl = function(map) {
        this.map = map;
        if (map === undefined || map === null) {
            console.log("GWTK.ShutterControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return this;
        }
        this.toolname = this.name = 'shuttercontrol';
        GWTK.MapAction.call(this, null, this.name);
        this.layersWMS = [];
        this.layersWMTS = [];
        this.panel = null;
        this.$panel = null;
        this.button = null;
        this.$button = null;
        this.shutterPanel = null;
        this.windowSize = this.map.getWindowSize();                      // размер окна карты
        this.windowWidth = this.windowSize[0];
        this.windowHeight = this.windowSize[1];
        this.windowOffset = $(this.map.mapPane).offset();                // положение окна карты
        this.verticalMode = true;                                        // текущий режим работы
        this.layerList = {};                                             // список всех слоев шторки
        this.stopDrag = true;
        this.createButton();
    };
    
    GWTK.ShutterControl.prototype = {
        /**
         * Настроить
         * @method set
         */
        set: function() {
            this.init();
        },
        /**
         * Очистить
         * @method clear
         */
        clear: function() {
            this.destroy();
            this.createButton();
            $(this.map.eventPane).trigger({ 'type': 'refreshmap', 'cmd': 'draw' });
        },
        
        /**
         * Инициализация класса
         *
         * @method init
         */
        init: function() {
            this.resize();
            this.createShutter();
            
            this.setResizable();
            // если указана панель для компонентов, то перетаскивание недоступно
            if (!this.map.options.controlspanel) {
                this.setDraggable();
            }
            this.initEvents();
            this.initLayersList();
            this.createCanvas();
        },
        
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            
            this.uncheckAllShutterLayer(false);
            this.$button.off().remove();
            this.$resetAll.off('click.shutterevent');
            this.$selectAll.off('click.shutterevent');
            this.$changeMode.off('click.shutterevent');
            this.$shutter.off("click.shutterevent");
            this.$shutter.off("mousedown.shutterevent");
            this.$shutterPanel.off("mousemove.shutterevent");
            this.$shutterPanel.off("mouseup.shutterevent");
            this.$shutterPanel.off("mousedown.shutterevent");
            this.$shutterPanel.off("click.shutterevent");
            this.$shutterPanel.off("mousewheel DOMMouseScroll wheel MozMousePixelScroll.shutterevent");
            this.$shutter.off('mouseup.shutterevent');
            $(this.map.mapPane).off('overlayRefresh.shutterevent');
            $(this.map.mapPane).off('mapdrag.shutterevent');
            $(window).off('resize.shutterevent');
            $(this.map.eventPane).off('wmsloaded.shutterevent');
            $(this.map.eventPane).off('refreshmap.shutterevent');
            this.map.disableMapRefresh(false);
            this.$shutterPanel.remove();
            this.removeListenersForList();
            this.map.off({ type: 'visibilitychanged', target: 'map' }, this.onVisibilityChanged);
            this.map.off({ type: 'layerlistchanged', target: 'map' }, this.onLayerlistChanged);
            
            this.$panel.remove();
            this.$panel = null;
            this.$layerListPanel = null;
            
            this.map.tiles._drawFilter = {};
        },
        
        /**
         * Инициализировать события
         * @method initEvents
         */
        initEvents: function() {
            
            var shutter = this;
            
            this.$resetAll.on('click.shutterevent', GWTK.Util.bind(function() {
                this.uncheckAllShutterLayer(false);
            }, this));
            
            this.$selectAll.on('click.shutterevent', GWTK.Util.bind(function() {
                this.uncheckAllShutterLayer(true);
            }, this));
            
            this.$changeMode.on('click.shutterevent', function(e) {
                shutter.changeShutterMode(e);
            });
            
            if (GWTK.uainfo.isTouch) {
                this.shutter.addEventListener('touchstart', this.map.handlers.touchStart);
                this.shutter.addEventListener('touchmove', this.map.handlers.touchMove);
                this.shutter.addEventListener('touchend', this.map.handlers.touchEnd);
            }
            
            
            this.$shutter.on("click.shutterevent", function(event) {
                event.stopPropagation();
            });
            
            this.$shutter.on('mousedown.shutterevent',
                function(e) {
                    shutter.shutterMouseDown(e);
                    e.stopPropagation();
                });
            
            this.$shutterPanel.on("mousemove.shutterevent", this.map.handlers.mapmove);
            
            this.$shutterPanel.on("mouseup.shutterevent", this.map.handlers.mapmouseup);
            
            this.$shutterPanel.on("mousedown.shutterevent", this.map.handlers.mapmousedown);
            
            this.$shutterPanel.on("click.shutterevent", this.map.handlers.mapclick);
            
            this.$shutterPanel.on("mousewheel DOMMouseScroll wheel MozMousePixelScroll.shutterevent", this.map.handlers.mousewheelscaling);
            
            this.$shutter.on('mouseup.shutterevent',
                function() {
                    $(document).off('mouseup.shuttermove').off('mousemove.shuttermove');
                });
            
            $(this.map.mapPane).on('overlayRefresh.shutterevent', GWTK.Util.bind(this.onOverlayRefresh, this));
            
            $(this.map.eventPane).on('wmsloaded.shutterevent', GWTK.Util.bind(this.onWmsLoaded, this));
            
            $(this.map.mapPane).on('mapdrag.shutterevent', GWTK.Util.bind(function() {
                this.clipLayers(true);
            }, this));
            
            $(window).on('resize.shutterevent', GWTK.Util.bind(function() {
                this.resize();
            }, this));
            
            this.onVisibilityChanged = this.onVisibilityChanged.bind(this);
            this.map.on({ type: 'visibilitychanged', target: 'map' }, this.onVisibilityChanged);
            
            this.onLayerlistChanged = this.onLayerlistChanged.bind(this);
            this.map.on({ type: 'layerlistchanged', target: 'map' }, this.onLayerlistChanged);
            
            this._refreshImage = GWTK.Util.debounce(GWTK.bind(this.clipLayers, this), 200);
            
            $(this.map.eventPane).on('refreshmap.shutterevent', GWTK.bind(this._refreshImage, this));
            
            this.map.disableMapRefresh(true);                               // отключить обновление в карте, здесь обновится
            
            // обработка изменений размера панели контролов
            $(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function(event) {
                // изменить размеры своей панели
                this.resize();
            }.bind(this));
            
        },
        
        /**
         * Обработать событие visibilitychanged карты
         * @method onVisibilityChanged
         */
        onVisibilityChanged: function(event) {
            if (event.maplayer) {
                if (event.maplayer.visible) {
                    if (!this.layerList[event.maplayer.id]) {
                        this.addLayer(event.maplayer.id);
                    }else{
                        return false;
                    }
                }else{
                    this.removeLayer(event.maplayer.id);
                }
            }
        },
        
        /**
         * Обработать событие layerlistchanged карты
         * @method onLayerlistChanged
         */
        onLayerlistChanged: function(event) {
            console.log('onLayerlistChanged');
            if (!event || !event.maplayer || !event.maplayer.id) {
                return;
            }
            var id = event.maplayer.id,
                act = event.maplayer.act | '';
            if (id) {
                if (event.maplayer.act === 'add') {
                    var layer = this.map.tiles.getLayerByxId(id);
                    if (!this.layerList[layer.xId] && layer.visible) {
                        this.addLayer(id);
                    }else{
                        return;
                    }
                }else{
                    this.removeLayer(id);
                }
            }
        },
        
        /**
         * Обработать событие overlayRefresh карты
         * @method onOverlayRefresh
         */
        onOverlayRefresh: function(event) {
            if (event && event.cmd && event.cmd === 'zoom') {
                var shutter = this;
                
                setTimeout(function() {
                    shutter._drawWmsImagePattern();
                    shutter.clipLayers();
                }, 800);
            }else{
                this.clipLayers();
            }
            return;
        },
        
        /**
         * Обработать событие wmsLoaded карты
         * @method onWmsLoaded
         */
        onWmsLoaded: function(event) {
            this._drawWmsImagePattern();
            this.clipLayers();
            return;
        },
        
        /**
         * Обработать событие mousedown шторки
         * @param e{object} - объект события
         * @method shutterMouseDown
         */
        shutterMouseDown: function(e) {
            document.onselectstart = GWTK.Util.falseFunction;
            this.stopDrag = false;
            var shutt = this;
            $(document).on('mousemove.shuttermove', function(e) {
                shutt.dragShutterDiv(e);
            });
            $(document).on('mouseup.shuttermove', function() {
                $(document).off('mouseup.shuttermove');
                $(document).off('mousemove.shuttermove');
                shutt.stopDrag = true;
            });
            e.stopPropagation();
        },
        
        /**
         * Установить размеры элементов
         * @method resize
         */
        resize: function() {
            this.windowSize = this.map.getWindowSize();
            this.windowWidth = this.windowSize[0];
            this.windowHeight = this.windowSize[1];
            if (this.$shutterPanel) {
                this.$shutterPanel.css({
                    'width': this.windowWidth,
                    'height': this.windowHeight
                });
            }
            
            if (this.canvas) {
                this.canvas.width = this.windowWidth;
                this.canvas.height = this.windowHeight;
                this._drawWmsImagePattern();
            }
            
            this.clipLayers();
        },
        
        /**
         * Обработать событие mosemove шторки
         * @param event{object} - объект события
         * @method dragShutterDiv
         */
        dragShutterDiv: function(event) {
            
            if (!this.stopDrag) {
                var curtain = this.shutter;
                if (this.verticalMode) {
                    curtain.style.top = 0 + 'px';
                    curtain.style.left = this.getMousePosition(event, false) - this.windowOffset.left + 'px';
                    var left = parseInt(curtain.style.left), scrWid = this.windowWidth - 10, finLeft = scrWid + 'px';
                    curtain.style.left = (left > scrWid) ? finLeft : left < 10 ? 10 + 'px' : left + 'px';
                }else{
                    curtain.style.left = 0 + 'px';
                    curtain.style.top = this.getMousePosition(event, true) - this.windowOffset.top + 'px';
                    var top = parseInt(curtain.style.top), winHei = this.windowHeight - 10, finTop = winHei + 'px';
                    curtain.style.top = top > winHei ? finTop : top < 10 ? 10 + 'px' : top + 'px';
                }
            }
            
            this.clipLayers();
        },
        
        /**
         * Обработать событие mousemove
         * @param event{object} - объект события mousemove
         * @param vertical{boolean} - признак получения координат перемещения по оси x или y
         * @method getMousePosition
         * @return {Number|*}
         */
        getMousePosition: function(event, vertical) {
            return (vertical ? (this.getBrowser('msie') ? event.clientY + document.body.scrollTop : event.pageY) :
                (this.getBrowser('msie') ? event.clientX + document.body.scrollTop : event.pageX));
        },
        
        /**
         * Получить версию браузера MS
         * @param name {string} - наименование браузера 'msie'
         * @method getBrowser
         * @return {number}
         */
        getBrowser: function(name) {
            return (Math.max(navigator.userAgent.toLowerCase().indexOf(name), 0));
        },
        
        /**
         * Создать панель управления
         * @method createPanel
         */
        createPanel: function() {
            
            // если указана панель для компонентов, то создаем в ней
            if (this.map.options.controlspanel) {
                this.panel = GWTK.DomUtil.create('div', 'map-panel-def-flex shutter-panel-flex', this.map.mapControls);
            }else{
                this.panel = GWTK.DomUtil.create('div', 'map-panel-def map-panel-def-task shutter-panel', this.map.panes.mapPaneOld);
            }
            
            this.panel.id = this.map.divID + '_shutterPane';
            this.$panel = $(this.panel);
            this.$panel.append(GWTK.Util.createHeaderForComponent({
                map: this.map,
                name: 'Shutter layer',
                callback: GWTK.Util.bind(function() {
                    this.$button.click();
                }, this)
            }));
            this.$outerButtonDiv = $('<div id="toolspane" class="shutter-button-pane"></div>');
            this.$resetAll = $('<div title="' + w2utils.lang("Reset all") + '" class="img-btn-search shutter-delete-all"></div>');
            this.$selectAll = $('<div title="' + w2utils.lang("Select all") + '" class="img-btn-search shutter-select-all"></div>');
            this.$changeMode = $('<div title="' + w2utils.lang("Horizontal:Vertical") + '" class="img-btn-search gor-mode"></div>');
            this.$outerButtonDiv.append(this.$resetAll);
            this.$outerButtonDiv.append(this.$selectAll);
            this.$outerButtonDiv.append(this.$changeMode);
            this.$layerListPanel = $('<div class="shutter-selectaible-layer-pane"></div>');
            this.$panel.append(this.$outerButtonDiv);
            this.$panel.append(this.$layerListPanel);
            this.$panel.hide();
        },
        
        /**
         * Включение, отключение всех слоев в шторке
         * @param check{Boolean} - признак включения (true)/отключения (false)
         */
        uncheckAllShutterLayer: function(check) {
            var allCheckbox = this.$layerListPanel.find('.shutterchecklayer');
            for (var i = 0; i < allCheckbox.length; i++) {
                if (check === true) {
                    if (allCheckbox[i].checked === false) {
                        allCheckbox[i].click();
                    }
                }else if (check === false) {
                    if (allCheckbox[i].checked === true) {
                        allCheckbox[i].click();
                    }
                }
            }
        },
        
        /**
         * Изменить режим работы шторки
         * @method changeShutterMode
         * @param e{object} - объект события
         */
        changeShutterMode: function(e) {
            this.$changeMode.addClass("control-button-non-active");
            if (this.verticalMode) {
                this._setVerticalMode();
            }else{
                this._setHorizontalMode();
            }
            this.verticalMode = !this.verticalMode;
            
            return false;
        },
        
        /**
         * Установить режим вертикальной шторки
         * @method _setVerticalMode
         */
        _setVerticalMode: function() {
            var wsize = this.map.getSize(),
                height = GWTK.uainfo.isTouch ? '7px' : '2px';            //whMobile
            var btmode = this.$changeMode;
            this.$changeMode.removeClass('gor-mode');
            this.$changeMode.addClass('ver-mode');
            this.$shutter.css({ cursor: 'n-resize' });
            this.$shutter.animate({ height: height, top: wsize.y / 2 }, 500,
                GWTK.Util.bind(function() {
                    this.$shutter.animate({ width: '100%', left: '0', height: height, top: wsize.y / 2 },
                        500,
                        GWTK.Util.bind(function() {
                            this.clipLayers();
                            btmode.removeClass("control-button-non-active")
                        }, this));
                }, this));
        },
        
        /**
         * Установить режим горизонтальной шторки
         * @method _setHorizontalMode
         */
        _setHorizontalMode: function() {
            var wsize = this.map.getSize(),
                width = GWTK.uainfo.isTouch ? '7px' : '2px';            //whMobile
            var btmode = this.$changeMode;
            this.$changeMode.removeClass('ver-mode').addClass('gor-mode');
            this.$shutter.css({ cursor: 'w-resize' });
            this.$shutter.animate({ width: width, left: wsize.x / 2 }, 500, GWTK.Util.bind(function() {
                this.$shutter.animate({
                    width: width,
                    left: wsize.x / 2,
                    height: '100%',
                    top: '0'
                }, 500, GWTK.Util.bind(function() {
                    this.clipLayers();
                    btmode.removeClass("control-button-non-active")
                }, this));
            }, this));
        },
        
        /**
         * Создать кнопку управления
         * @method createButton
         */
        createButton: function() {
            var tool = this;
            this.button = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable shutter-button', this.map.panes.toolbarPane);
            this.button.id = 'panel_button_shutter';
            this.button.title = w2utils.lang('Shutter layer');
            this.$button = $(this.button);
            this.$button.on('click', function(e) {
                if (!this.$panel) {
                    this.createPanel();
                }
                if (!this.$panel.is(':visible')) {
                    this.$panel.show();
                    // развернуть общую панель для компонентов (если используется)
                    this.map.showControlsPanel();
                    $(e.target).addClass('control-button-active');
                    this.map.setAction(this);
                }else{
                    this.$panel.hide('slow', function() {
                        tool.map.taskManager.closeAction();
                    });
                    this.$button.removeClass('control-button-active');
                }
            }.bind(this));
        },
        
        /**
         * Создать элементы шторки
         * @method createShutter
         */
        createShutter: function() {
            this.shutterPanel = this.map.createPane('shutter-map-panel', this.map.mapPane);
            this.shutterPanel.style.width = this.windowSize[0] + 'px';
            this.shutterPanel.style.height = this.windowSize[1] + 'px';
            this.$shutterPanel = $(this.shutterPanel);
            
            this.shutter = GWTK.DomUtil.create('div', 'shutter-div', this.shutterPanel);
            this.$shutter = $(this.shutter);
            this.$shutter.css({
                'left': this.windowWidth / 2 + 'px',
                'z-index': '220',
                'height': screen.height
            });
            
            if (GWTK.uainfo.isTouch) {
                this.$shutter.css({ 'width': '10px' });
            }
        },
        
        /**
         * Обновить размеры элементов слоев WMS шторки
         * @method updateSizeWMS
         */
        updateSizeWMS: function() {
            if (this.layersWMS.length > 0) {
                $(this.layersWMS).css({
                    'width': this.windowWidth,
                    'height': this.windowHeight
                });
            }
        },
        
        /**
         * Обновить размеры элементов слоев WMTS шторки
         * @method updateSizeWMTS
         */
        updateSizeWMTS: function() {
            if (this.layersWMTS.length === 0) return false;
            this.tileOffsetLeftW = this.windowWidth - parseInt(this.map.panes.tilePane.offsetLeft);
            this.tileOffsetTopH = this.windowHeight + Math.abs(parseInt(this.map.panes.tilePane.offsetTop));
            $(this.layersWMTS).css({ 'width': this.tileOffsetLeftW + 1000, 'height': this.tileOffsetTopH });
        },
        
        /**
         * Обрезать слои списка WMS
         * @method clipWms
         */
        clipWms: function() {
            if (this.layersWMS.length === 0) return false;
            var offset = this.map.panes.tilePane.offsetTop;
            this.updateSizeWMS();
            if (this.verticalMode) {
                $(this.layersWMS).css('clip', this.getClipCssWms(offset, this.$shutter.position().left, null, null));
            }else{
                $(this.layersWMS).css('clip', this.getClipCssWms(this.$shutter.position().top, null, null, null));
            }
        },
        
        /**
         * Обрезать слои списка WMTS
         * @method clipWmts
         */
        clipWmts: function() {
            if (this.layersWMTS.length === 0) return false;
            var topOffset = this.map.panes.tilePane.offsetTop;
            this.updateSizeWMTS();
            this.updateSizeWMS();
            if (this.verticalMode) {
                $(this.layersWMTS).css('clip', this.getClipCssWmts(-$(this.layersWMTS).height(), this.$shutter.position().left, null, null));
            }else{
                $(this.layersWMTS).css('clip', this.getClipCssWmts(this.$shutter.position().top - topOffset, -$(this.layersWMTS).height(), null, null));
            }
        },
        
        /**
         * Обрeзать слои для шторки
         * @method clipLayers
         */
        clipLayers: function() {
            if ($.isEmptyObject(this.layerList)) {
                return;
            }
            this.clipWms();
            this.clipWmts();
            this._drawShutter();
        },
        
        /**
         * Нарисовать шторку в карте
         * @method _drawShutter
         */
        _drawShutter: function() {
            
            this.map.tiles._drawFilter = this._getLayerFilter();
            
            this.map.tiles.drawMapImage(true, false, true);                     // карта
            
            if (this.verticalMode) {
                this.clipShutterImage(this.$shutter.position().left, 0);        // шторка вертикальная
            }else{
                this.clipShutterImage(0, this.$shutter.position().top);         // шторка горизонтальная
            }
        },
        
        /**
         * Получить фильтр слоев карты
         * @method _getLayerFilter
         * @return {Object} фильтр отображения карты по слоям, json {"wmts": [id слоев тайлов], "wms":[id слоев wms]}
         */
        _getLayerFilter: function() {
            var filter = [], wmsfilter = [], images = [],
                wmslayers = [],
                layers = this.map.tiles.getVisibleLayers(),      // видимые слои в порядке отображения
                i, len = layers.length,
                count = 0;
            
            for (i = 0; i < len; i++) {
                if (layers[i].xId in this.layerList && this.layerList[layers[i].xId]) {
                    count++;
                    continue;
                }
                if (layers[i].tiles) {
                    filter.push(layers[i].xId);
                }else{
                    var inst = this.map.tiles.getLayerByxId(layers[i].xId);
                    if (inst.getType() === 'wms') {
                        wmsfilter.push(layers[i].xId);
                        wmslayers.push(layers[i]);
                }
            }
            }
                        
            if (filter.length === 0 && wmsfilter.length === 0 && count !== layers.length) {
                return undefined;
            }
            return { "wmts": filter, "wms": wmsfilter, "images": images, "wmslayers": wmslayers };
        },
        
        /**
         * Создать холст
         * @method createCanvas
         */
        createCanvas: function() {
            var size = this.map.getSize();
            if (this.canvas !== undefined) {
                this.canvas.width = size.x;
                this.canvas.height = size.y;
            }else{
                var $c = $('<canvas width="' + size.x + '" height="' + size.y + '" class="wms-canvas" id="wms_shuttle_canvas" ></canvas>');
                $c.css('top', '0px').css('left', '0px');
                this.canvas = $c[0];
            }
        },
        
        /**
         * Нарисовать шаблон шторки для wms слоев
         * @method _drawWmsImagePattern
         */
        _drawWmsImagePattern: function() {
            if (!this.canvas) {
                return;
            }
            const ctx = this.canvas.getContext('2d');
            if (!ctx) { 
                return;
            }
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const filter = [];
            for( let xid in this.layerList ) {
                const layer = this.map.tiles.getLayerByxId(xid);
                if (layer.getType() === 'wms' && this.layerList[xid]) {
                    filter.push(xid);
                }
            }
            if (filter.length > 0) {
                this.map.drawWmsImageTo(this.canvas, filter);
            }
            
            this.pixelBoundsCanvas = this.map.getPixelMapBounds();
        },
        
        /**
         * Обрезать изображение в шторке
         * @method clipShutterImage
         * (для слоев wms и tile)
         * @param x,y {Number, Number} левое верхнее положение шторки в окне (пикселы)
         * @param skipwms {boolean} пропустить рисование wms
         */
        clipShutterImage: function(x, y) {
            if ($.isEmptyObject(this.layerList)) {
                return;
            }
            var enable = false;
            for (var id in this.layerList) {
                enable |= this.layerList[id];
            }
            if (!enable) {
                return;
            }
            var topleft = GWTK.point(x, y), i, len,
                mapbounds = this.map.getPixelMapBounds(),
                clipbounds = PixelBounds.toBounds(mapbounds.min.add(topleft), mapbounds.max); // габариты шторки
            
            var begin = GWTK.point(clipbounds.min.x, clipbounds.min.y),              // left top пикселы матрицы начала шторки в окне
                clipSize = clipbounds.getSize(),
                ctx = this.map._getCanvas().getContext("2d");
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(x, y, clipSize.x, clipSize.y);
            }   
            // draw shuttle tiles
            for (var key in this.layerList) {
                if (!this.layerList[key]) continue;
                var layer = this.map.tiles.getLayerByxId(key);
                if (layer && layer.getType() === 'tile') {
                    layer.drawLayer(clipbounds, begin, false, topleft);
                }
            }
            ctx.globalAlpha = 1;
            // draw shuttle wms
            if (this.pixelBoundsCanvas) {
                var sx = Math.round(clipbounds.min.x - this.pixelBoundsCanvas.min.x),
                    sy = Math.round(clipbounds.max.y - this.pixelBoundsCanvas.max.y);
                
                ctx.drawImage(this.canvas, sx, sy, clipSize.x, clipSize.y, x, y, clipSize.x, clipSize.y);
            }
            
        },
        
        /**
         * Получить тип слоя в шторке
         * @method getLayerType
         * @param layer{object} объект слоя карты
         * @return {string} строка, тип слоя 'WMTS' или 'WMS'.
         * При ошибке - пустая строка
         */
        getLayerType: function(layer) {
            if (layer) {
                var type = layer.getType();
                return (type === 'tile' || type == 'geomarkers' ? 'WMTS' : 'WMS');
            }
            return "";
        },
        
        /**
         * Добавить слой в шторку
         * @method addLayer
         * @param xid {string} - идентификатор слоя карты
         */
        addLayer: function(xid) {
            var layer = this.map.tiles.getLayerByxId(xid);
            if (!layer) return false;
            var type = this.getLayerType(layer) || '';
            if (!type || type == "") {
                return;
            }
            this.removeListenersForList();
            this.layerList[layer.xId] = false;
            this.$layerListPanel.append(
                '<label class="shutter-label-list" >' +
                '<p class="p-checkbox">' +
                '<input type = "checkbox" class = "shutterchecklayer curtain-item-check" name = "' +
                type + '" value = "' + layer.xId + '">' + layer.alias +
                '</p>' +
                '</label>'
            );
            this.addListenersForList();
            
            this.map.tiles._drawFilter = this._getLayerFilter();
        },
        
        /**
         * Удалить слой шторки
         * @param xid {string} - xid слоя карты
         * @method removeLayer
         * @return {boolean}
         */
        removeLayer: function(xid) {
            var layer = this.map.tiles.getLayerByxId(xid);
            if (!layer) return false;
            
            var type = this.getLayerType(layer) || '';
            var value = layer.xId;
            this.shutterItemChanged(value, false, type);                   // удалить из списка по типу слоя
            var $input = this.$layerListPanel.find(':input[value="' + value + '"]');
            $input.off('click.shutterclickitem');                          // удалить обработчиков
            $input.parent().parent().remove();                             // удалить элементы UI
            delete this.layerList[layer.xId];                              // удалить из общего списка
            
            this.map.tiles._drawFilter = this._getLayerFilter();
        },
        
        /**
         * Инициализировать список слоев шторки
         * @method initLayersList
         */
        initLayersList: function() {
            var i, len;
            for (i = 0; len = this.map.layers.length, i < len; i++) {
                var type = this.getLayerType(this.map.layers[i]),
                    visible = this.map.layers[i].visible;
                if (type === 'WMS') {
                    if (!visible || this.map.options.mergewmslayers) {
                        continue;
                    }
                    this.layerList[this.map.layers[i].xId] = false;
                    this.$layerListPanel.append(
                        '<label class="shutter-label-list" >' +
                        '<p class="p-checkbox">' +
                        '<input type = "checkbox" class = "shutterchecklayer curtain-item-check" name = "wms" ' +
                        'value = "' + this.map.layers[i].xId + '">' +
                        this.map.layers[i].alias +
                        '</p>' +
                        '</label>'
                    );
                    continue;
                }
                if (type === 'WMTS') {
                    if (!visible) {
                        continue;
                    }
                    this.layerList[this.map.layers[i].xId] = false;
                    this.$layerListPanel.append(
                        '<label class="shutter-label-list" >' +
                        '<p class="p-checkbox">' +
                        '<input type = "checkbox" class = "shutterchecklayer curtain-item-check" name = "wmts" ' +
                        'value = "' + this.map.layers[i].xId + '">' +
                        this.map.layers[i].alias +
                        '</p>' +
                        '</label>'
                    )
                }
            }
            this.addListenersForList();
            console.log(this.layerList);
        },
        
        /**
         * Добавить обработчики для элементов списка слоев шторки
         * @method addListenersForList
         */
        addListenersForList: function() {
            this.$layerListPanel.find('input').on('click.shutterclickitem', GWTK.Util.bind(function(e) {
                this.shutterItemChanged(e.target.value, e.target.checked, e.target.name.toUpperCase());
            }, this));
        },
        
        /**
         * Удалить обработчики событий для элементов списка слоев шторки
         * @method removeListenersFromList
         */
        removeListenersForList: function() {
            this.$layerListPanel.find('input').off('click.shutterclickitem');
        },
        
        /**
         * Обработчик выбора слоя для шторки
         * @param value {string} - значение идентификатора контейнера слоя
         * @param checked {boolean} - признак включения слоя
         * @param type {string} - тип слоя 'WMS' или 'WMTS'
         * @return {boolean}
         */
        shutterItemChanged: function(value, checked, type) {
            var layer = this.map.tiles.getLayerByxId(value);
            if (!layer) {
                return false;
            }
            var type = this.getLayerType(layer);
            if (GWTK.Util.isEmpty(type)) {
                return false;
            }
            
            this.layerList[value] = checked;                        // изменить в списке слоев в шторке
            
            var container, id,
                layertype = layer.getType();
            switch (layertype) {
                case 'svg':
                    container = (layer.layerContainer && layer.layerContainer.drawingMethod) ? layer.layerContainer.drawingMethod.svgCanvas : null;
                    break;
                case 'geomarkers':
                    container = layer.getLayerContainer();
                    container.id = layer.xId;
                    break;
                default:
                    //container = layer.layerContainer;
                    break;
            }
            if (container) {
                id = container.id;
            }
            
            if (layertype === 'wms') {
                this._drawWmsImagePattern();
            }
            
            if (checked) {
                if (container) {
                    this['layers' + type].push(container);
                }
            }else{
                for (var i = 0; i < this['layers' + type].length; i++) {
                    var ediv = this['layers' + type][i];
                    if (ediv && ediv.id === id) {
                        ediv.style.clip = 'auto';
                        this['layers' + type].splice(i, 1);
                        break;
                    }
                }
                this.map.tiles._drawFilter = this._getLayerFilter();
                
            }
            this.clipLayers();
        },
        
        /**
         * Получить значение CSS свойства clip для WMS слоев
         * @param top {number} - значение Y1
         * @param left {number} - значение X1
         * @param bottom {number} - значение Y2
         * @param right {number} - значение X2
         * @return {string}
         */
        getClipCssWms: function(top, left, bottom, right) {
            var rect = "rect(";
            if (this.verticalMode) {
                if (top !== null) rect += (top - $(this.layersWMS).height() - top) + "px ";
                else rect += "auto ";
            }else{
                if (top !== null) rect += (top) + "px ";
                else rect += "auto ";
            }
            
            if (right !== null) rect += (right) + "px ";
            else rect += "auto ";
            
            if (bottom !== null) rect += (bottom) + "px ";
            else rect += "auto ";
            
            if (left !== null) rect += (left) + "px";
            else rect += "auto";
            rect += ")";
            
            return rect;
        },
        
        /**
         * Получить значение CSS свойства clip для WMTS слоев
         * @param top {number} - значение Y1
         * @param left {number} - значение X1
         * @param bottom {number} - значение Y2
         * @param right {number} - значение X2
         * @return {string}
         */
        getClipCssWmts: function(top, left, bottom, right) {
            var rect = "rect(";
            if (top !== null) rect += (top) + "px ";
            else rect += "auto ";
            
            if (right !== null) rect += (right) + "px ";
            else rect += "auto ";
            
            if (bottom !== null) rect += (bottom) + "px ";
            else rect += "auto ";
            
            if (left !== null) rect += (left + -this.map.panes.tilePane.offsetLeft) + "px";
            else rect += "auto";
            rect += ")";
            return rect;
        },
        
        /**
         * Сделать панель перемещаемой
         */
        setDraggable: function() {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: this.$panel, resizable: false });
        },
        
        /**
         * Сделать панель растягиваемой
         * @method setResizable
         */
        setResizable: function() {
            var tool = this;
            var minW = parseInt($('.shutter-panel').css('min-width'));
            var minH = parseInt($('.shutter-panel').css('min-height'));
            if (!minW) minW = 400;
            if (!minH) minH = 250;
            this.$panel.resizable({
                handles: 's,w,sw',
                resize: function(event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    tool.resize();
                    
                    GWTK.Util.fixJqueryResizablePluginFF({
                        before: {
                            width: ui.originalSize.width,
                            height: ui.originalSize.height
                        },
                        after: {
                            width: ui.size.width,
                            height: ui.size.height
                        }
                    });
                },
                create: function() {
                    $(this).parent().on('resize', function(e) {
                        e.stopPropagation();
                    });
                    $(this).parent().on('mousedown', function(e) {
                        tool.$shutterPanel.off("mouseup.shutterevent");
                    });
                    $(this).parent().on('mouseup', function(e) {
                        tool.$shutterPanel.on("mouseup.shutterevent", tool.map.handlers.mapmouseup);
                    });
                },
                minWidth: minW,
                minHeight: minH
            });
        }
        
    };
    
    GWTK.Util.inherits(GWTK.ShutterControl, GWTK.MapAction);
}
