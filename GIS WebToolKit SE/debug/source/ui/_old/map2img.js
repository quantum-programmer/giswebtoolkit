 /**************************************** Нефедьева О. 04/12/20 ****
 ***************************************** Патейчук В.  20/05/20 ****
 ***************************************** Помозов Е.В. 09/02/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Печать карты"                     *
 *                                                                  *
 *******************************************************************/
/**
 * Элемент управления Печать карты
 * @class GWTK.PrintMapControl
 * @constructor GWTK.PrintMapControl
 * @param map {Object} объект карты, ОБЯЗАТЕЛЬНЫЙ ПАРАМЕТР
 */
if (window.GWTK) {
    GWTK.PrintMapControl = function (map) {
        this.toolname = 'printmap';
        this.map = map;
        if (!this.map) {
            console.log("GWTK.PrintMapControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.pane = null;
        this.$pane = null;
        this.bt = null;

        // создать кнопку в тулбаре
        this.createButton();

        this.map.maptools.push(this);
    };

    GWTK.PrintMapControl.prototype = {

        /**
         * Инициализация компонента
         *
         * @method init
         */
        init: function () {
            // создать панель
            this.createPane();
        },

        /**
         * Создать кнопку управления
         *
         * @method createButton
         */
        createButton: function () {
            if (!this.map || !this.map.panes.toolbarPane) {
                return;
            }
            this.bt = GWTK.DomUtil.create('div', 'control-button control-button-printmap clickable', this.map.panes.toolbarPane);
            this.bt.title = w2utils.lang('Print');
            this.bt.id = 'panel_button_printmap';
            $(this.bt).attr('toolname', this.toolname);
            // обработчик клика на кнопке (включить режим, показать панель)
            var _tool = this;
            $(this.bt).on("click", function () {
                _tool.init();
                _tool.showPane();
                _tool.map.closeAction();
                GWTK.DomUtil.removeActiveElement(".button-action");
            });
        },

        /**
         * Создать панель управления
         *
         * @method createPanel
         */
        createPane: function () {

            // удалить панель, если уже создана
            var $panelPrintMap = $('.panel-printmap');
            if ($panelPrintMap.length > 0) {
                $panelPrintMap.draggable('destroy').remove();
            }

            this.id = 'printmap_Panel';
            this.pane = GWTK.DomUtil.create('div', 'panel-printmap map-panel-def', this.map.mapPane);
            this.pane.id = this.id;
            this.pane.style.top = "90px";
            this.pane.style.left = "100px";
            this.$pane = $(this.pane);
            // Сделать панель перемещаемой
            GWTK.panelUI({ $element: this.$pane, draggable: true, cancelOnDragHTML: '.printmap_img', resizable: false });

            this.$pane.hide();

            // заголовок
            var tool = this;
            GWTK.Util.createHeaderForComponent({
                map: this.map, parent: this.pane, name: w2utils.lang('Print of map'),
                context: "printmap",
                callback: function () { tool._closePane(); }
            });

            var frame = document.createElement('div');
            frame.id = "printmap_container";

            // панель с изображением карты
            var mapPicture = GWTK.DomUtil.create('div', 'printmap_img', frame);
            mapPicture.id = 'printmap_img';
            mapPicture.title = w2utils.lang('To save an image, right-click the picture and select - Save as ...');

            // панель с комментарием
            var comment = GWTK.DomUtil.create('textarea', 'printmap_comm', frame);
            comment.id = 'printmap_comm';
            comment.name = 'printmap_comm';
            comment.alt = comment.title = w2utils.lang('Comment');
            $(comment).on('click', function(){ this.focus(); });
                        
            // добавить фрейм на панель
            this.$pane.append(frame);

            // футер (панель с кнопками)
            this.$pane.append('<div id="printmap_footer" class="printmap_footer">' +
                '<input type="button" id="printmap_save" class="sidebar-node-save-button panel-printmap-button" title="' + w2utils.lang('Save') + '" />' +
                '<input type="button" id="printmap_area" class="button-frame-ico panel-printmap-button" title="' + w2utils.lang('Select area') + '" />' +
                '<input type="button" id="printmap_print" class="control-button-printmap panel-printmap-button" title="' + w2utils.lang('Print') + '" /></div>');

            $("#printmap_save").on('click', function (event) { tool.onPrintmap_save_Click(event); });
            $("#printmap_area").on('click', function (event) { tool.onPrintmap_area_Click(event); });
            $('#printmap_print').on('click', function () { tool.onPrintMap(); });
            $(this.map.eventPane).on('closeaction.printmap', function (e) {
                if (tool.action && e.action == tool.action.name) { tool.action = undefined; tool.remove(); }
            });
			
            $(window).on('beforeprint.printmap', this._onBeforePrint.bind(this));
            $(window).on('afterprint.printmap', this._onAfterPrint.bind(this));
            
            // нарисовать карту
            this._getPrintImage({
                width: $(this.map.mapPane).width(),
                height: $(this.map.mapPane).height(),
                left: 0,
                top: 0
            });

            // показать панель печати
            this.showPane();
        },

        _closePane: function () {
            var tool = this;
            this.$pane.hide(300, function () { tool.remove(); });
        },

        /**
         * Создать канву для рисования
         *
         * @method _createCanvas
         * @return {object}
         */
        _createCanvas: function (bounds) {
            var $c;
            if (this.canvas !== undefined) {
                this.canvas.width = bounds.width;
                this.canvas.height = bounds.height;
                var ctx = this.canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                }
                $c = $(this.canvas);
            }
            else {
                $c = $('<canvas width="' + bounds.width + '" height="' + bounds.height + '" class="printmap_photo imgcanvas" id="imgCanvas" ></canvas>');
                $c.css('top', '0px').css('left', '0px');
                this.canvas = $c[0];
            }
            $c.appendTo('#printmap_img');
            return this.canvas;
        },

        /**
         * Получить изображение карты
         *
         * @method _getPrintImage
         * @param bounds {{top: number, left: number, width: number, height: number}} фрагмент карты {left, top, width, height}
         * рисунок отображается в панели управления печатью
         */
        _getPrintImage: function (bounds) {			
            var printCanvas = this._createCanvas(bounds);            			
			printCanvas.getContext("2d")
                .drawImage(this.map.tiles._canvas, bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

            if (window['html2canvas'] == undefined){
                return;
            }    
            var $elements = $('.svgdrawing-panel, .draw-panel');
            var count = $elements.length;
            var canvases = [];
			
            $elements.each(function () {
                if (this.style.width <= 1) {
                    count--;
                    return true;
                }
                html2canvas(this, { backgroundColor: null }).then(function (canvas) {
                    canvases.push(canvas);
                    if (canvases.length === count) {
                        for (var j = 0; j < canvases.length; j++) {
                            printCanvas.getContext("2d")
                                .drawImage(canvases[j], bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
                        }
                    }
                });
            });
        },
		
        /**
         * Настройка документа перед вызовом диалога печать
         *
         * @method _onBeforePrint         
         * 
         */
        _onBeforePrint: function() {
            //console.log('_onBeforePrint');
            if (!this.pane) {
                return;
            }
            var $dvmap = $(this.map.container);
            
            this.$pane.find('.panel-info-header').hide();
            this.$pane.find("#printmap_footer").hide();        
            
            this.$pane.prependTo($('body'));
                      
            this.map.container.style.visibility = 'hidden';
            
            var $menu = $dvmap.find('.mapmenu-panel');
            if ($menu.length > 0){
                $menu.hide();
                $(".control-button-mapmenu").click();
            }          
            
            // скрыть дочерние элементы в body
            this.hidden_elems = $('body').children().not(this.$pane)
                                                    .filter(':visible');           
            this.hidden_elems.css('visibility', 'hidden');
                       
            // показать рисунок печати
            this.$pane.find($('#printmap_img')).removeAttr("style").removeClass();
            $(this.canvas).addClass('printmap_photo-print');
            this.$pane.removeAttr("style")
                      .removeClass()
                      .addClass("printmap_printing");

            if ($(this.map.mapPane).width() !== $(this.map.container).width()){
                $(this.canvas)[0].style.margin = "10px";
            }
        },

        /**
         * Завершение печати
         *
         * @method _onAfterPrint         
         * 
         */
        _onAfterPrint: function() {
            //console.log('_onAfterPrint');
            if (!this.pane){
                return;
            }                        
            // показать окно карты
            this.map.container.style.visibility = 'visible';
            
            // показать скрытые в body дочерние элементы 
            if (this.hidden_elems){
                this.hidden_elems.css('visibility', '');
            }
                                
            // закрыть окно
            $(this.pane).removeClass("printmap_printing");

            // выключить пункт меню
            if (this.map.hasMenu()){
                $(this.map.eventPane).trigger({type:'closecomponent', 'context':'printmap'});
            }
            
            this.hidden_elems = undefined;

            this.remove();                        
        },

       /**
        * Печать изображения карты
        *
        * @method onPrintMap
        */
        onPrintMap: function () {
			window.print();
        },

        onPrintmap_save_Click: function () {
            var filename = 'printmap.png';

            if (this.canvas.msToBlob) { //for IE
                var blob = this.canvas.msToBlob();
                window.navigator.msSaveBlob(blob, filename);
                return;
            }

            var a = document.createElement('a');            
			a.id = 'savemap';
			document.body.appendChild(a);
			var savemap = document.getElementById('savemap');
			savemap.href = this.canvas.toDataURL('image/png');
            savemap.download = filename;
            try {
                a.click();
            } catch (e) {
                console.error(e.message);
            }
			savemap.remove();
        },

        /**
         * Активировать обработчик карты выбора фрагмента
         *
         * @method onPrintmap_area_Click
         */
        onPrintmap_area_Click: function () {

            this.hidePane();

            if (!this.action) {
                this.action = new GWTK.SelectMapFrameAction(null, this.map);
                this.action.canSelectObject = false;
                if (this.map.setAction(this.action)) {
                    GWTK.DomUtil.removeActiveElement(".button-action");
                    var that = this;
                    $(this.map.eventPane).off('mapframe.printmap');
                    $(this.map.eventPane).on('mapframe.printmap', function (event) { that.onMapFrameArea(event); });
                    GWTK.DomUtil.removeClass(this.map.eventPane, 'cursor-dragging');
                    this.map.setCursor('pointer');
                }
                else {
                    this.action.clear();
                    this.action = undefined;
                }
            }
            return false;
        },

        /**
         * Закрыть обработчик карты выбора фрагмента
         *
         * @method _closeMapAction
         */
        _closeMapAction: function () {

            $(this.map.eventPane).off('mapframe.printmap');

            if (this.action) {
                if (this.map.currentActionName() === this.action.name) {
                    this.map.closeAction();
                    this.action = undefined;
                }
                else {
                    this.action.clear();
                    this.action = undefined;
                }
            }

        },

       /**
        * Обработчик события выбора фрагмента карты 'mapframe'
        *
        * @method onMapFrameArea
        * @param event {object} объект события, event.frame - {'width':число, 'height':число, 'top':число, 'left':число}, выбранный фрагмент, пикселы
        * функция создает рисунок фрагмента карты
        */
        onMapFrameArea: function (event) {

            if (!this.action) { return; }

            event.stopPropagation();

            if (!event || !event.frame) {
                this._getPrintImage({
                    width: $(this.map.mapPane).width(),
                    height: $(this.map.mapPane).height(),
                    top: 0,
                    left: 0
                });
            } else {
                this.action.clearRectImage(this.map);
                this._getPrintImage({
                    width: parseInt(event.frame.width),
                    height: parseInt(event.frame.height),
                    top: parseInt(event.frame.top),
                    left: parseInt(event.frame.left)
                });
            }

            this.showPane();
            return false;
        },

       /**
        * Отобразить панель управления
        *
        * @method showPane
        */
        showPane: function () {
            this.$pane.show();
        },

       /**
        * Скрыть панель управления
        *
        * @method showPane
        */
        hidePane: function () {
            this.$pane.hide('slow');
        },

       /**
        * Получить видимость панели
        *
        * @method showPane
        */
        visible: function () {
            if (this.pane.style.display && this.pane.style.display === 'none') {
                return false;
            }
            return true;
        },

       /**
        * Деструктор
        *
        * @method destroy
        * освободить ресурсы, отключить обработчики событий
        */
        destroy: function () {
            $(this.bt).off();
            this.remove();
        },

       /**
        * Удалить элементы окна
        *
        * @method remove
        */
        remove: function () {

            this._closeMapAction();
            $(this.map.eventPane).off('closeaction.printmap');

            if (this.pane && $(this.pane).is('.ui-draggable')) {
               $(this.pane).draggable('destroy');
            }
            $('#printmap_print').off();
            $("#printmap_area").off();
            if (this.pane) {
                $(this.pane).remove();
                this.pane = undefined;
                this.$pane = undefined;
            }
            $(this.canvas).remove();
            this.canvas = undefined;
            
            $(window).off('beforeprint.printmap');
            $(window).off('afterprint.printmap');
                
        }
    }
}
