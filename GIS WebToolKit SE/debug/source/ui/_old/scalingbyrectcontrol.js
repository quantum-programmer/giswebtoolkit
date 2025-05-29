/**************************************** Гиман Н.Л.   26/05/17 *****
 /**************************************** Нефедьева О. 19/11/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Масштабирование карты по рамке                  *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Компонент масштабирования карты по рамке
     * @class GWTK.ScalingByFrameControl
     * @constructor GWTK.ScalingByFrameControl
     */
    GWTK.ScalingByFrameControl = function(map, panel) {
        this.toolname = 'scalingbyframe';
        this.map = map;
        this.panel = panel;
        
        if (!this.map) {
            console.log("ScalingByFrameControl" + ". " + w2utils.lang("Not defined a required parameter") + " Map.");
            return this;
        }
        
        this._zoom = '';
        
        this.init();
        
        this.map.maptools.push(this);
        
        return;
    };
    
    GWTK.ScalingByFrameControl.prototype = {
        
        init: function() {
            if (!this.map) {
                return;
            }
            if (!this.panel) {
                this.panel = this.map.panes.toolbarPane;
            }
            this.createToolbarsButton();
            this.initEvents();
            return;
        },
        
        setZoomMode: function(mode) {
            this._zoom = '';
            if (mode == 'up' || mode == 'down') {
                this._zoom = mode;
            }
            return this._zoom;
        },
        
        createToolbarsButton: function() {
            
            this.btPlus = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable button-action control-button-scalebyrectplus', this.panel);
            this.btPlus.id = 'scalebyrectplus';
            this.btPlus.title = w2utils.lang("Scale up");
            this.btPlus._modezoom = 'up';
            
            this.btMinus = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable button-action control-button-scalebyrectminus', this.panel);
            this.btMinus.id = 'scalebyrectminus';
            this.btMinus.title = w2utils.lang("Scale down");
            this.btMinus._modezoom = 'down';
            
            if (!this.map.hasMenu()) {
                $(this.btMinus).css("display", "inline-block");
                $(this.btPlus).css("display", "inline-block");
            }else{
                $(this.btPlus).css("display", "block");
            }
            
            return;
        },
        
        initEvents: function() {
            var map = this.map,
                tool = this;
            
            this.onMapframe = GWTK.Util.bind(this.onMapframe, this);
            
            $('#scalebyrectplus').on('click', function(event) {
                tool._toggleAction(this);
                return;
            });
            
            $('#scalebyrectminus').on('click', function(event) {
                tool._toggleAction(this);
                return;
            });
        },
        
        _toggleAction: function(button) {
            if (!button) return false;
            
            if ($(button).hasClass("control-button-active")) {           // выключить режим
                $(button).removeClass("control-button-active");
                this.map.closeAction();
                //this.clear();
            }else{
                if (!this.map.closeAction()) {
                    return;
                }
                GWTK.DomUtil.removeActiveElement(".button-action");      // выключить текущий режим
                this.set(button);
            }
            
            return;
        },
        
        set: function(button) {
            
            if (!button || !button._modezoom) {
                return false;
            }
            
            var tool = this;
            
            var action = new GWTK.SelectMapFrameAction(this, this.map);
            
            if (this.map.setAction(action)) {
                GWTK.DomUtil.removeActiveElement('.button-action');                     // выключить текущий режим карты
                this.setZoomMode(button._modezoom);
                $(button).addClass('control-button-active');
                GWTK.DomUtil.removeClass(this.map.eventPane, 'cursor-dragging');
                this.map.setCursor('pointer');
                
                $(this.map.eventPane).on('mapframe', this.onMapframe);
            }else{
                action.clear();
                this.clear();
            }
            
        },
        
        clearAction: function() {
            this.clear();
        },
        
        clear: function() {
            this.setZoomMode('');
            $(this.map.eventPane).off('mapframe', this.onMapframe);
            return;
        },
        
        onMapframe: function(event) {
            if (!this.map) {
                return;
            }
            var winSize = this.map.getWindowSize(),
                bbox = event.bbox,
                frame = event.frame;
            
            if (this._zoom == 'up') {
                this.map.showMapExtent(bbox[0].lat, bbox[0].lng, bbox[1].lat, bbox[1].lng, true);
            }else if (this._zoom == 'down') {
                var s1 = parseInt(frame.width) * parseInt(frame.height);
                var s2 = winSize[0] * winSize[1];
                var perc = s1 / s2;
                var size = GWTK.point(parseInt(frame.width) / 2 + parseInt(frame.left),
                    parseInt(frame.height) / 2 + parseInt(frame.top));
                var coord = this.map.tiles.getLayersPointProjected(size);
                this.map.setMapCenter(coord, true);
                var scale = parseInt(this.map.getZoomScale(this.map.options.tilematrix), 10);
                var z = parseInt((scale / perc) * 1.5);
                var rew = this.map.getScaleZoom(z);
                rew = this.map.zoomLimit(rew);
                this.map.setView(coord, rew);
                this.map.overlayRefresh();
            }
            return;
        },
        
        /**
         * Деструктор
         * @method destroy
         */
        destroy: function() {
            if (this._zoom == 'up' || this._zoom == 'down') {
                if (this.map.taskManager._action instanceof GWTK.SelectMapFrameAction) {
                    this.map.closeAction();
                }
            }
            
            this.clear();
            
            $(this.btPlus).off().remove();
            $(this.btMinus).off().remove();
        }
        
    }
}