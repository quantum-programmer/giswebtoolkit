/*
 *************************************** Патейчук В.К.  13/04/20 ****
 *************************************** Гиман Н.Л      07/11/18 ****
 *************************************** Нефедьева О.   14/12/17 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент "Навигатор карты"                    *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     *@param  {Object} map - Объект класса карты
     * @constructor
     */
    GWTK.NavigatorControl = function (map) {
        this.map = map;
        this.toolname = "navigatorcontrol";
        this.map.maptools.push(this);
        this.miniMap = null;
        this.scaleCoefficient = null;
        this.showHideImg = null;
        this.active = false;

        this.canInit = this.map.options.navigatorcontrol && this.map.options.navigatorcontrol.zoomStep && this.map.options.navigatorcontrol.url ? true : false;

        if (this.canInit) {
            this.url = this.map.options.navigatorcontrol.url;
            this.zoomStep = this.map.options.navigatorcontrol.zoomStep;
            this.width = this.map.options.navigatorcontrol.width ? this.map.options.navigatorcontrol.width : 170;
            this.height = this.map.options.navigatorcontrol.height ? this.map.options.navigatorcontrol.height : 110;
            this.init();
            $(this.showHideImg).click();
        }
    };

    GWTK.NavigatorControl.prototype = {
        /**
         * Инициализация карты
         */
        init: function () {
            $(this.map.mapPane).append('<div id="navigator-cont" style="width: ' + this.width + 'px; height: ' + this.height + 'px;"><div id="minimap"></div></div>');
            var options = {
                "url": this.map.options.url, "id": "55",
                "center": this.map.options.center,
                "tilematrix": this.map.options.tilematrix - this.zoomStep,
                "crs": this.map.options.crs,
                "tilematrixset": this.map.options.tilematrixset,
                "maxzoom": this.map.options.maxzoom - this.zoomStep,
                "minzoom": (this.map.options.minzoom - this.zoomStep) <= 0 ? 1 : this.map.options.minzoom - this.zoomStep,
                "layers": [
                    {
                        "id": "minimapid",
                        "alias": "minimapalias",
                        "selectObject": 0,
                        "hidden": false,
                        "url": this.url
                    }
                ],
                scaleupdown: false,
                mapcoordinates: false,
                mapscale: false
            };
            this.miniMap = new GWTK.Map("minimap", options);
            this.miniMap.handlers.mousewheelscaling = function () {
                return false;
            };
            var mapMain = this.map;
            //Переопределили функцию для проверки возможности смещения основной карты
            this.miniMap.handlers.mapdrag = GWTK.Util.bind(function (event) {
                var mapmove = this.movedrag;
                if (!mapmove.isDragEnabled()) return false;
                mapmove.setOffset(event);
                var coord = mapMain.tiles._testShift(mapmove.dx, mapmove.dy);
                if(coord[0] === 0){
                    mapmove.dx = coord[0];
                }
                if(coord[1]===0){
                    mapmove.dy = coord[1];
                }
                this.map.move(mapmove.dx, mapmove.dy);
                $(this.map.eventPane).trigger({type:'mapdrag', offset:{ 'dx': mapmove.dx, 'dy': mapmove.dy }});
                return false;
            }, this.miniMap.handlers);

            this.scaleCoefficient = this.miniMap.getZoomScale(this.miniMap.options.tilematrix) / this.map.getZoomScale(this.map.options.tilematrix);

            /**
             * Обработчик перемещения мини карты
             */
            var that = this;
            that.xx = 0;
            that.yy = 0;
            $(this.miniMap.eventPane).on('mapdrag', GWTK.Util.bind(function (event) {
                this.scaleCoefficient = this.miniMap.getZoomScale(this.miniMap.options.tilematrix) / this.map.getZoomScale(this.map.options.tilematrix);

                var coord = this.miniMap.tiles._testShift(this.miniMap.handlers.movedrag.dx, this.miniMap.handlers.movedrag.dy);
                var dx = coord && coord.length > 1 ? coord[0] : 0;
                var dy = coord && coord.length > 1 ? coord[1] : 0;
                this.map.tiles._onMouseDown();
                if(this.map.tiles && this.map.tiles.wmsManager){
                    this.map.tiles.wmsManager.showUpdate();
                }
                this.map.move(dx * this.scaleCoefficient, dy * this.scaleCoefficient);
            }, this));
            /**
             * Обработчик завершения перемещения мини карты
             */
            $(this.miniMap.eventPane).on('mapdragend', GWTK.Util.bind(function () {
                if(this.active){
                    this.drawWms();
                }
            }, this));

            this.showHideImg = document.createElement('img');
            this.showHideImg.id = 'img-showhide';
            this.showHideImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdElEQVR42mNkoBAwUtWAqZMm/b92/TrD1OnTiTaYEV0znE+kIXBF2ZmZ/9ElcRkCUguTY0SXIGQITA1WAwgZgiyH0wBshoiJijK8ev0aq6E4AwqbS0g1gBFo8z90m4k2gJAraOsFQprxGkCMZqLDgBhAsQEARYBIEW4z9YYAAAAASUVORK5CYII=";
            $('#navigator-cont').append(this.showHideImg);

            this.initEvents();
            this.dragableNavigator();
            $(this.miniMap.mapPane).find('#' + this.map.divID +'_objPane').remove();
        },

        /**
         * Деструктор
         * @method destroy
         */
        destroy: function () {
            if (!this.map || !this.miniMap) {
                return;
            }
            $(this.miniMap.eventPane).off();
            $(this.showHideImg).off();
            var $ep = $(this.map.eventPane);
            $ep.off('overlayRefresh.navigator');
            $ep.off('mapdrag.navigator');
            $ep.off('mapdragstart.navigator');
            $ep.off('mapdragend.navigator');

            var $navigator = $('#navigator-cont');
            if ($navigator.is('.ui-draggable'))
                $navigator.draggable('destroy');

            this.miniMap.destroy();
            $(this.miniMap.mapPanel).remove();
            this.miniMap = null;

            $navigator.remove();
        },

        /**
         * Возможность перемещения окна
         */
        dragableNavigator: function () {
            var that = this;
            var $navigator = $('#navigator-cont');
            $navigator.draggable({
                containment: "parent",
                cancel: '#minimap',
                start: function (event) {
                    $(that.showHideImg).off('click');
                },
                stop: function (e) {
                    setTimeout(function () {
                        $(that.showHideImg).on('click', function (e) {
                            if ($navigator.width() > 25 || $navigator.height() > 25) {
                                that.showHideImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcklEQVR42mNkoBAwUs2A7MzM/8RomDp9OiPZBqBrJskAbJqJNgCXZqIMEBMVZahvaiLfALK9ALL51evX5AUiSCGQD5L7R8glGAagK8DmNWQ1KAbg8ic+Q4hOysiGaGlqMmTn5ZFmAMwQZM0kG4ANUGwAANgoPxFTXQ/0AAAAAElFTkSuQmCC";
                                $navigator.animate({
                                    width: 25,
                                    height: 25,
                                    top: $navigator.offset().top - $(that.map.mapPane).offset().top + $navigator.height() - 25,
                                    left: $navigator.offset().left - $(that.map.mapPane).offset().left + $navigator.width() - 25

                                }, 100, function () {
                                    $(that.miniMap.mapPane).hide();
                                });
                            } else {
                                that.showHideImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdElEQVR42mNkoBAwUtWAqZMm/b92/TrD1OnTiTaYEV0znE+kIXBF2ZmZ/9ElcRkCUguTY0SXIGQITA1WAwgZgiyH0wBshoiJijK8ev0aq6E4AwqbS0g1gBFo8z90m4k2gJAraOsFQprxGkCMZqLDgBhAsQEARYBIEW4z9YYAAAAASUVORK5CYII=";
                                $(that.miniMap.mapPane).show();
                                $navigator.animate({
                                    width: that.width,
                                    height: that.height,
                                    top: $navigator.offset().top - $(that.map.mapPane).offset().top - that.height + 25,
                                    left: $navigator.offset().left - $(that.map.mapPane).offset().left - that.width + 25
                                }, 100, function () {
                                    // var coord = that.map.tiles.getLayersCenterProjected();
                                    // if ( coord != null )
                                    that.miniMap.options.tilematrix = that.map.options.tilematrix - that.zoomStep;
                                    that.miniMap.setMapCenter(that.map.mapcenter, true);
                                    that.miniMap.overlayRefresh();

                                    if ($navigator.offset().left + $navigator.width() > $(that.map.mapPane).width()) {
                                        $navigator.css({
                                            left: $(that.map.mapPane).width() - $navigator.width() - 5
                                        });
                                    }
                                    if ($navigator.offset().top + $navigator.height() > $(that.map.mapPane).height()) {
                                        $navigator.css({
                                            top: $(that.map.mapPane).height() - $navigator.height() - 5
                                        });
                                    }

                                    if ($navigator.offset().top <= $(that.map.mapPane).offset().top) {
                                        $navigator.css({ top: 5 });
                                    }
                                    if ($navigator.offset().left <= $(that.map.mapPane).offset().left) {
                                        $navigator.css({ left: 5 });
                                    }

                                });

                            }
                        });
                    }, 300);
                }
            });
        },

        /**
         * Обновить WMS слои основной карты
         * @method drawWms
         */
        drawWms: function () {
            var coord = this.map.tiles.getLayersCenterProjected();
            if (coord) {
                this.map.setMapCenter(coord);
                this.map.tiles.drawWmsLayers();
            }
        },

        initEvents: function () {
            var that = this;
            that.x = 0;
            that.y = 0;
            $(this.showHideImg).on('click', function (e) {
                if ($(that.miniMap.mapPane).is(':visible')) {
                    that.active = false;
                    that.showHideImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcklEQVR42mNkoBAwUs2A7MzM/8RomDp9OiPZBqBrJskAbJqJNgCXZqIMEBMVZahvaiLfALK9ALL51evX5AUiSCGQD5L7R8glGAagK8DmNWQ1KAbg8ic+Q4hOysiGaGlqMmTn5ZFmAMwQZM0kG4ANUGwAANgoPxFTXQ/0AAAAAElFTkSuQmCC";
                    $("#navigator-cont").animate({ width: 25, height: 25 }, 100, function () {
                        $(that.miniMap.mapPane).hide();
                    });
                }
                else {
                    that.showHideImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdElEQVR42mNkoBAwUtWAqZMm/b92/TrD1OnTiTaYEV0znE+kIXBF2ZmZ/9ElcRkCUguTY0SXIGQITA1WAwgZgiyH0wBshoiJijK8ev0aq6E4AwqbS0g1gBFo8z90m4k2gJAraOsFQprxGkCMZqLDgBhAsQEARYBIEW4z9YYAAAAASUVORK5CYII=";
                    $(that.miniMap.mapPane).show();
                    that.active = true;
                    $("#navigator-cont").animate({ width: that.width, height: that.height }, 100, function () {
                        that.miniMap.options.tilematrix = that.map.options.tilematrix - that.zoomStep;
                        that.miniMap.setMapCenter(that.map.mapcenter, true);
                        that.miniMap.overlayRefresh();
                    });

                }
            });

            $(this.map.eventPane).on('overlayRefresh.navigator', GWTK.Util.bind(function (e) {
                // console.log('overlayRefresh.navigator');
                if (e.cmd && e.cmd.toLowerCase() === 'zoom') {
                    this.scaleCoefficient = this.miniMap.getZoomScale(this.miniMap.options.tilematrix) / this.map.getZoomScale(this.map.options.tilematrix);
                    var geo = GWTK.projection.xy2geo(this.map.options.crs, this.map.mapcenter.y, this.map.mapcenter.x);
                    this.miniMap.options.tilematrix = this.map.options.tilematrix - this.zoomStep;
                    if (this.miniMap.options.tilematrix <= 1) {
                        this.miniMap.options.tilematrix = 2;
                    }
                    this.miniMap.setView(this.map.options.crs, geo, this.miniMap.options.tilematrix/*this.map.options.tilematrix - this.zoomStep*/);
                    this.miniMap.tiles.forceupdate();
                }
            }, this));
            //Слушаем событие у ОСНОВНОЙ карты
            $(this.map.eventPane).on('mapdragstart.navigator', GWTK.Util.bind(function (e) {
                //Генерируем onMouseDown для МИНИ карты
                that.miniMap.tiles._onMouseDown();
                //Шлем событие для МИНИ карты
                $(that.miniMap.eventPane).trigger({
                    type: 'mapdragstart',
                    offset: {
                        'left': parseFloat(that.miniMap.tilePane.style.left),
                        'top': parseFloat(that.miniMap.tilePane.style.top)
                    }
                });
            }, this));
            //Слушаем окончание перемещения ОСНОВНОЙ карты
            $(this.map.eventPane).on('mapdragend.navigator', GWTK.Util.bind(function (e) {
                //Шлем событие окончание перемещения на МИНИ карту
                $(this.miniMap.eventPane).trigger({
                    type: 'mapdragend',
                    offset: {
                        'left': parseFloat(this.miniMap.tilePane.style.left),
                        'top': parseFloat(this.miniMap.tilePane.style.top)
                    }
                });
            }, this));

            $(this.map.eventPane).on('mapdrag.navigator', GWTK.Util.bind(function (e) {
                var koef =this.map.getZoomScale(this.map.options.tilematrix) / this.miniMap.getZoomScale(this.miniMap.options.tilematrix) ;
                var coord = this.map.tiles._testShift(this.map.handlers.movedrag.dx, this.map.handlers.movedrag.dy);
                var dx = coord && coord.length > 1 ? coord[0] : 0;
                var dy = coord && coord.length > 1 ? coord[1] : 0;
                this.miniMap.tiles._onMouseDown();
                if(this.miniMap.tiles && this.miniMap.tiles.wmsManager){
                    this.miniMap.tiles.wmsManager.showUpdate();
                }
                var x = dx * koef;
                var y = dy * koef;
                that.x += x;
                that.y += y;
                function getDecimal(num) {
                    var sign = '';
                    if(num < 0){
                        sign = '-';
                    }
                    var str = "" + num;
                    var zeroPos = str.indexOf(".");
                    if(zeroPos === -1) return {dec: 0, num: num};
                    var number = str.split('.')[0];
                    str = str.slice(zeroPos);
                    str = Number(sign + str);
                    return {dec: str, num: Number(number)};
                }
                if(Math.abs(that.x) > 1 || Math.abs(that.y) > 1){
                    var numX = 0, numY = 0;
                    if((Math.abs(that.x) > 1)){
                        var numXL = getDecimal(that.x);
                        if(numXL !==0){
                            that.x = numXL.dec;
                            numX = numXL.num;
                        }
                    }
                    if((Math.abs(that.y) > 1)){
                        var numYL = getDecimal(that.y);
                        if(numYL !==0){
                            that.y = numYL.dec;
                            numY = numYL.num;
                        }
                    }
                    this.miniMap.move(numX, numY);
                }
            }, this));
        }
    }
}
