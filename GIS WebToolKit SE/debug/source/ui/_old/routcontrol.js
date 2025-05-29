/**************************************** Патейчук В.К.  20/05/20 ***
 **************************************** Нефедьева О.А. 07/04/20 ***
 **************************************** Полищук Г.В.   23/01/19 ***
 **************************************** Гиман Н.       28/07/17 ***
 **************************************** Помозов Е.В.   02/03/21 ***
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Компонент "Маршруты"                       *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {

    /**
     * Компонент построения маршрута проезда
     * @class GWTK.RouteControl
     * @constructor GWTK.RouteControl
     * @param map {GWTK.Map} ссылка на карту
     */
    GWTK.RouteControl = function(map){

		GWTK.MapAction.call( this, 'routecontrol' );

        this.map = map;
        // имя инструмента в maptools
        this.toolname = this.name = "routecontrol";

        this.map.maptools.push(this);

        // определение слоя и адреса сервиса для построений
        if(this.map.options.routecontrol){
            if(this.map.options.routecontrol.layer){
                this.layer = this.map.options.routecontrol.layer;
            }else{
                this.layer = null;
            }
            if(this.map.options.routecontrol.url){
                this.url = this.map.options.routecontrol.url;
            }else{
                this.url = this.map.options.url;
            }
        }
        // окно компонента
        this.pane   = null;
        // запросы
        this.count = 0;
        // хранение e.geo
        this.coord  = { a: null, b: null };
        // признак активного режима
        this.activ  = false;
        // кнопка в тулбаре
        this.button = null;
        // поля в окне компонента
        this.inputA = null;
        this.inputB = null;
        // кнопка отправки запроса (на данный момент не используется)
        this.sendReq = null;
        // объект класса svgDrawing
        this.svgClass = null;
        // точка "А" на карте (белая точка с красной обводкой)
        this.pointAimg = null;
        // точка "Б" на карте
        this.pointBimg = null;
        // Интервал отправки запроса в пикселях
        this.updateStep = 400;
        // массив маршрута сохраняем для обращения по индексу из деталей
        this.arrayCoord = [];
        //объект с информацией о маршруте
        this.informationRout = { lang: null, time: null };
        // новый объект
        this.infoRouteNew = {};
        // таблица для информации
        this.tableInfo = null;
        // опции поворота
        this.routeOptions = {
            code0: w2utils.lang("straight"),
            code1: w2utils.lang("slightly to the right"),
            code2: w2utils.lang("to the right"),
            code3: w2utils.lang("to the right"),
            code4: w2utils.lang("turn round"),
            code5: w2utils.lang("to the left"),
            code6: w2utils.lang("to the left"),
            code7: w2utils.lang("slightly to the left")
        };
        // переход в точку
        this.tempImg = document.createElement('img');
        //
        this.tempImgOffset = { x: 7, y: 7 };
        // Инициализация
        if(this.url && this.layer){
            this.init();
        }
    };

    GWTK.RouteControl.prototype = {

		/**
         * Инициализация компонента
         *
         * @method init
         */
        init: function() {
            this.createButton();
            this.createPane();
            this.initEvents();
            this.setResizable();
            // если не указана панель для компонентов, то доступно перетаскивание
			if(!this.map.options.controlspanel) {
                this.setDraggable();
            }
        },

		/**
		 * Очистить компонент
         *
         * @method clearComponent
		 */
		clearComponent: function () {
			$( this.button ).removeClass( 'control-button-active' );
			$( this.pane ).hide('slow').css( { height: "auto" } );
            this.activ = false;
			$( this.map.overlayPane ).off( 'mapclick.routehead' );
			$( this.map.eventPane ).off( 'overlayRefresh.routehead' );
			$( this.pointBimg ).draggable( 'enable' );
			$( this.pointAimg ).draggable( 'enable' );
			this.count = 0;
			w2utils.unlock(this.pane);
            this.cancelRout();
            $(this.tableInfo).empty().hide();
            $("#short-route-info").remove();
            $(this.tempImg).remove();
        },

        /**
         * Деструктор
         *
         * @method destroy
	     */
		destroy: function () {

		    if ($(this.button).hasClass('control-button-active')) {
		    this.clearComponent();
		    }
		    else {
		        $(this.map.overlayPane).off('mapclick.routehead');
		        $(this.map.eventPane).off('overlayRefresh.routehead');
		    }

		    if (this.pointBimg)
		        $(this.pointBimg).draggable('destroy');
		    if (this.pointAimg)
		        $(this.pointAimg).draggable('destroy');

		    $(this.button).off();
		    $(this.button).remove();

		    if (this.svgClass) {
		        this.svgClass.destroy();
		    }

		    $(this.buttonClosePane).off();
		    $(this.moreInfoButton).off();
		    $(this.cancelButton).off();
		    $(this.reversePoint).off();
		    if (this.pane) {
		        $(this.pane).resizable('destroy');
		        if ($(this.pane).is('.ui-draggable'))
                    $(this.pane).draggable('destroy');
                $(this.pane).empty().remove();
		    }
		},

		/**
		 * Создать кнопку управления в тулбаре
         *
         * @method createButton
		 */
        createButton: function(){
            this.button  = GWTK.DomUtil.create('div', 'control-button clickable control-button-radio control-button-route', this.map.panes.toolbarPane);
            this.button.id = "panel_button_route";
            this.button.title = w2utils.lang("Route");
            var that = this;
            $(this.button).on('click', function(){
                if($(this).hasClass('control-button-active')){
					that.map.closeAction();
                }else{
					that.map.setAction( that );
                }
            });
        },

        set: function () {
			$( this.button ).addClass( 'control-button-active' );
            $( this.pane ).show();
            // развернуть общую панель для компонентов (если используется)
            this.map.showControlsPanel();
			this.activ = true;
			$( this.map.overlayPane ).on( 'mapclick.routehead', GWTK.Util.bind( this.mapclickEventListener, this ) );
			$( this.map.eventPane ).on( 'overlayRefresh.routehead', GWTK.Util.bind( this.overlayRefreshEventListener, this ) );
		},

		/**
		 * Очистить компонент
		 */
		clear: function () {
			this.clearComponent();
		},

		/**
		 * Создать панель
		 */
        createPane: function(){

            this.paneForMode = document.createElement('div');
            this.paneForMode.className = 'rout-mode-graph';

            this.routMode = document.createElement('img');
            this.routMode.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAABr0lEQVR42u2VPUtCURjHr1ImDhWZmZO0NIdt9RH6AjaGS9HYGNEL9QlagqC2kMZoaWl16uUDJEJDGJkRUlKh9nvwnLher13PJZt84M/jefmf3z33PucYsP4pAn1Qz0DpdDpMGkURFHQMf6J39JrNZr+MQWrxMzSLxlym1JWCSg1URjmxA33rFrRGWkXL6A49eGx8AsXQKToGtOsJAjJEKqAlDBddf4SmN0PaQ0m8H14g2YXsaJrJDUOQfshNvIdeoFvSFRMzJhCbf580jz/VBmJQqurF1i8VNOgH5BLDQCsaNECSSgn90eI68lbzE9R/Xh2wEdIlSvletjWu0ZwuipZvBOzZcj83fqIMJKob9h3JIa3KbyboV7pB2uly4SNdQPh0tYbbdsRgnFS0g1S/9MU9IFU8EZtHgybpf3SCEpb3DWAaCUBFJ2ic9NTBsIVh220An1w36x18UXxlJ0hK/Ncb2DBqKCSl3QJSsJI8hWoeMGnFZGX856QF1Szhj+kxJ+iGNKOacgZyhqBF0olq3uNPdgLJoZWnqDGpYPqu8Mt/05Rat6Irrg3Uy+iDfMc3Pu+cGywpUvgAAAAASUVORK5CYII=';

			this.containerForInputA = document.createElement( 'p' );

			this.containerForInputA.className = 'container-for-input';
			this.containerForInputB = document.createElement( 'p' );
			this.containerForInputB.className = 'container-for-input';
            this.containerForInputB.style.marginBottom = "2px";

            this.punktImgA = document.createElement('img');
            this.punktImgA.className = 'point-img-rout';
            this.punktImgA.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAuklEQVR42mNkoDJgHDUQBURERPAAqVAgdgdicSB+CcQ7gXj1ihUrvpBkINAwVSA1C4gdsEgfAOI0oKG3iTIQ6rLNUMMuAvE0IL4FxGpAnAXE+lBDfdFdisvARCA1D2qYARYlF6CGJgENnE+MgSuAVDgQp0O9jQ7SgHgmEK8EGhhBjIH7od51hHoNHYDkQGoOAA10HBAXUj0MqRvLUEOplw7RXEqdnEIuIMlAoIsZgS77TzUDqe7CATEQAIIiUxWoxbdpAAAAAElFTkSuQmCC";

            this.punktImgB = document.createElement('img');
            this.punktImgB.className = 'point-img-rout';
            this.punktImgB.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABPklEQVR42mNkoDJgpKuBERER3kBqOhDLQoUeAXHWihUrtpJsINCwOiDViEO6BWhoLdEGAg1zBFL7oNxfSFL/gJgDyvYCGrqdWAMXAqk4IP4BxDOAuAgq1Q3EmUDMBcRA81ZEEmsgyHUgV/4EYk6gxv9QcZD670DMDsT7geJOxBq4GkiF4DDwG9TbJLmwHEh1APEnIJ4CxDVQKVAk5QCxIBAXAA2cSKyB2kDqCpT7DuRKKPsrEItA2cpAA+8RZSDU0KtASguH9FmgYSbYJPAZmACk5uOQDgUauIZUA9mA1EsgFkCTAgWBONDAPyQZCDW0Aki1owkXAQ3rx6WHkIGg5PGBAZLuQACU0PmBBv4iy0CooZOAVC6U2wU0rByfemIMZAFSzxkgeVoGlsjJNhBqqA/I60DDjhBSS98ClhwAAOkmahUYFWMJAAAAAElFTkSuQmCC";

            this.reversePointContainer = document.createElement('div');
            this.reversePointContainer.className = 'container-reverse-point';

            this.reversePoint = document.createElement('img');
            this.reversePoint.className = 'reverse-point-graph';
            this.reversePoint.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeklEQVR42mNkoDJgpKeBOkB8hSoGmpub+548eXITkPYD0pspMhBmGBIf3dD/+HzGiM2wAH//wg0bN/bDaDRDiTcQBICGFAANmQDTiMQn3YVoAJfGUQMHi4FExD7xBhKZPklzIRE5iKCBGICYPE5O8YW3FKJreTg4DAQAUjpkFYlkApQAAAAASUVORK5CYII=";

            // если указана панель для компонентов, то создаем в ней
			if (this.map.options.controlspanel) {
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def-flex route-panel-flex', this.map.mapControls);
            }
            else {
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def route-panel', this.map.mapPane);
            }
            this.pane.id = this.map.divID + "_routePane";
            this.hidePane();

            this.inputA = document.createElement('input');
            this.inputA.type = 'text';
            this.inputA.className = 'graph-input feedback-input';
            this.inputA.id = "inputa-route";
            this.inputA.title = w2utils.lang('From');

            this.inputB = document.createElement('input');
            this.inputB.type = 'text';
            this.inputB.className = 'graph-input feedback-input';
            this.inputB.id = "inputb-route";
            this.inputB.title = w2utils.lang('To');

            this.sendReq = document.createElement('input');
            this.sendReq.type ='submit';
            this.sendReq.className = 'graph-input';

            this.cancelButton = document.createElement('input');
            this.cancelButton.type = 'reset';
            this.cancelButton.value = w2utils.lang("Reset");
            this.cancelButton.id = "routecancelbutton";
            this.cancelButton.className = "routecancelbutton-class";
            $(this.cancelButton).css('float', 'right');

            this.moreInfoButton = document.createElement('input');
            this.moreInfoButton.id = 'route-moreinfo';
            this.moreInfoButton.className = "routecancelbutton-class";
            this.moreInfoButton.type = 'reset';
            this.moreInfoButton.value = w2utils.lang("Details");

            this.moreInfoContainer = document.createElement('div');
            this.moreInfoContainer.className = 'more-info-rout-container';
            this.moreInfoContainer.id = 'detail-more-info-rout-container';

            this.containerForInputA.appendChild(this.inputA);
            this.containerForInputB.appendChild(this.inputB);

            this.reversePointContainer.appendChild(this.reversePoint);

            this.formDivMain = document.createElement('div');
            this.formDivMain.id = "maindivroute-div";

            this.formDivMainSub = document.createElement('div');
            this.formDivMainSub.id = "form1";
            this.formDivMainSub.appendChild(this.containerForInputA);
            this.formDivMainSub.appendChild(this.containerForInputB);
            this.formDivMain.appendChild(this.formDivMainSub);

            // Заголовок окна
            GWTK.Util.createHeaderForComponent({
                map: this.map,
                name: w2utils.lang("Route"),
                parent: this.pane,
                context: this.toolname,
                callback: GWTK.Util.bind(function () { $(this.button).click(); }, this)
            });
            var $btclose = $(this.pane).find('.panel-info-close');
            this.buttonClosePane = $btclose[0];

            this.pane.appendChild(this.reversePointContainer);
            this.pane.appendChild(this.formDivMain);
            this.pane.appendChild(this.moreInfoButton);
            this.pane.appendChild(this.cancelButton);
            this.pane.appendChild(this.moreInfoContainer);
            this.tableInfo = document.createElement('div');
            this.tableInfo.id = "route-info-table";
            this.moreInfoContainer.appendChild(this.tableInfo);
        },

		/**
		 * Отправить запрос построения маршрута
         *
		 * @returns {boolean}
		 */
        sendRequest: function(){
            var that = this;
            $(that.tableInfo).empty();
            $("#short-route-info").remove();
            if(that.count !== 0) return false;
            that.count = 1;
            w2utils.lock(that.pane, { spinner: true, opacity : 0.5 });
            if(!that.url || !that.layer){
                return false;
            }
            if (this.map.getToken()) {
                var beforeSendFunction = function (xhr) { if (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, that.map.getToken()) } };
                var map_url = this.map.options.url.toLowerCase();
                if (this.url.toLowerCase().indexOf(map_url) == -1) {
                    beforeSendFunction = undefined;
                }
            }
            var xhrfields = undefined;
            if (this.map.authTypeServer(that.url) || this.map.authTypeExternal(that.url)){
                xhrfields = { withCredentials: true };
            }

            $.ajax({
                url: that.url + '?RESTMETHOD=GetRoute&SERVICE=WFS&POINT1=' + that.coord.a[0] + ',' + that.coord.a[1] + '&POINT2=' + that.coord.b[0] + ',' + that.coord.b[1] + '&CRS=EPSG:4326&LAYER=' + that.layer + '&MEASURE=time&LENGTH=1&OUTTYPE=JSON&RouteText=1',
                method: "GET",
                dataType: 'text',
                crossDomain: true,
                beforeSend: beforeSendFunction,
                xhrFields: xhrfields,
                success: function (data) {
                    if (data.indexOf('ServiceExceptionReport') > -1) {
                        this.error();
                        return;
                    }
                    that.drawGraph(data);
                    w2utils.unlock(that.pane, { spinner: true, opacity : 0.5 });
                    $(that.pointBimg).draggable( 'enable' );
                    $(that.pointAimg).draggable( 'enable' );
                    that.count = 0;
                },
                error: function () {
                    w2utils.unlock(that.pane, { spinner: true, opacity: 0.5 });
                    console.log(w2utils.lang("Failed to get data"));
                    $(that.pointBimg).draggable( 'enable' );
                    $(that.pointAimg).draggable( 'enable' );
                    that.count = 0;
                }
            });
        },

		/**
		 * Вывод информации о маршруте
         *
		 * @param lang
		 */
        parseInfoForUser: function(lang){
            this.informationRout.lang = {header: 'Расстояние в метрах', value: parseInt(lang)};
            var ts = parseInt(lang / 1000 / 60 * 60);
            this.informationRout.time = {header: 'Время в пути', value: (ts / 60 | 0) + ' ч ' + ts % 60 + ' мин '};
        },

        /**
         * Установить возможность перемещения панели
         */
        setDraggable: function () {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: $(this.pane), resizable: false });
        },

		/**
		 * Установить возможность изменения размера панели
		 */
        setResizable: function () {
            var that = this;
            $(this.pane).resizable({
                handles: 's,w,sw',
                resize: function (event, ui) {
                    ui.position.left = ui.originalPosition.left;
                    $(that.moreInfoContainer/*'#detail-more-info-rout-container'*/).css({maxHeight: $(this).height() - 185});
					
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
                create: function () {
                    $(this).parent().on('resize', function (e) {
                        e.stopPropagation();
                    });
                }
            });
        },

		/**
		 * Переход в точку
         *
		 * @param event
		 */
        goToPoint: function(event){
            var id = event.currentTarget ? event.currentTarget.id : event.srcElement.id;
            var point = document.getElementById(id);
            if(point){
                point = point.coord;
            }
			var bounds = this.map.getMapGeoBounds();
            var bounObj = GWTK.latLngBounds(new GWTK.LatLng(bounds.SW.lat, bounds.SW.lng), new GWTK.LatLng(bounds.NE.lat, bounds.NE.lng));
			this.tempImg.className = "route-point";
			this.tempImg.style.left = -100 + 'px';
			this.tempImg.style.top = -100 + 'px';
			this.tempImg.style.position = "absolute";
			this.tempImg.style.width = 14 + "px";
			this.tempImg.style.height = 14 + "px";
			this.tempImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAtklEQVR42mNkIBMwUk1jm/2nBCDVAsRSUKFnQFxTdZBvAU6NQE2rGBkZQ+X0mV6JKDDzg8TePPj78dHFf2L///9fDdQchqERqCkeqGmBSTDrb+s4dlZOPoj4908MDEcX/fx9Zu1vVqDmBKDmhegan8gbMLMFNnGJwjTBAEjz+rpvrx9e+PsLqFEGXeM/40C2X2757OzYAmPXxJ8/z67/xQbUyEQ1jWQ7lbzAITs6KEoApACyNQIAIuSEDxj11EYAAAAASUVORK5CYII=";
			this.tempImg.latlng = GWTK.toLatLng( point );
			var cont = bounObj.contains( this.tempImg.latlng );
            if(cont){
				var place = GWTK.tileView.geo2pixelOffset( this.map, this.tempImg.latlng );
				this.tempImg.style.left = place.x - this.tempImgOffset.x + 'px';
				this.tempImg.style.top = place.y - this.tempImgOffset.y + 'px';
				this.map.overlayPane.appendChild( this.tempImg );
            }else{
                //обновление положения карты если точка выходит за пределы отображения графа
				this.map.setViewport( this.tempImg.latlng );
				this.map.overlayRefresh();
            }
        },

		/**
		 * Добавление информации о маршруте в окно компонента
         *
		 * @param obj
		 * @param errorMessage
		 */
        appendMoreInfo: function (obj, errorMessage) {

            // Преобразовать секунды в строку времени
            function getTimeString (sec) {

                var resultArr, hours, minutes;

                sec = parseInt(sec, 10);
                if (!sec || sec < 0) {
                    sec = 0;
                }

                hours = Math.floor(sec / 3600 );
                minutes = Math.round(sec % 3600 / 60);
                if (minutes === 60) {
                    minutes = 59;
                }

                resultArr = [];
                if (hours) {
                    resultArr.push(hours + ' ' + w2utils.lang('hour'));
                }
                if (minutes) {
                    resultArr.push(minutes + ' ' + w2utils.lang('min'));
                }
                if (resultArr.length === 0) {
                    resultArr.push('1 ' + w2utils.lang('min'));
                }

                return resultArr.join(', ');
            }

            // Преобразовать метры в строку расстояния
            function getLengthString (meter) {

                meter = parseInt(meter, 10);
                if (!meter || meter < 0) {
                    meter = 0;
                }

                if (meter >= 1000) {
                    return Math.round(meter / 10) / 100 + ' ' + w2utils.lang('km');
                }

                return meter + ' ' + w2utils.lang('m');

            }

            $(this.tableInfo).empty();
            $("#short-route-info").remove();

            var div = document.createElement("div");
                div.id = "short-route-info";
            if(errorMessage){
                div.innerHTML = errorMessage;
            }else{
                div.innerHTML = getTimeString(obj["time"]) + " " + " (" + getLengthString(obj["length"]) + ")";
            }

            $(div).insertBefore("#detail-more-info-rout-container");

            for(var key in obj.detail){

                var tr = document.createElement("div");
                    //tr.id = 'moreinfotable-' + key + "-" + obj.detail[key]["number"];
                    tr.id = 'moreinfotable-' + key /*+ "-"*/;
                    tr.coord = obj.detail[key]["point"];
                    tr.className = "rout-div-tr";
				tr.onclick = GWTK.Util.bind( this.goToPoint, this );

                var trsub = document.createElement("div");
                    trsub.className = "rout-div-tr";

                var td0 = document.createElement("div");
                    td0.className = "rout-div-td";
                    td0.innerHTML = this.routeOptions["code" + obj.detail[key]["code"]] + " " + w2utils.lang("to") + " " + obj.detail[key]["name"];
                var td = document.createElement("div");
                    td.className = "rout-div-td";
                    td.innerHTML = obj.detail[key]["name"];
                var td2 = document.createElement("div");
                    td2.className = "rout-div-td";
                    td2.innerHTML = getTimeString(obj.detail[key]["time"]) + " (" + getLengthString(obj.detail[key]["length"]) + ")";
                    td2.style.color = 'grey';
                var td3 = document.createElement("div");
                    td3.className = "rout-div-td";
                    td3.innerHTML = getLengthString(obj.detail[key]["length"]);
                var img = document.createElement('div');
                    img.className = "rout-dorection-img";
                    //формирование идентификатора для установки знака знаки описаны в CSS стилях
                    img.id = "rout-direction" + obj.detail[key]['code'];
                trsub.appendChild(img);
                trsub.appendChild(td0);
                trsub.appendChild(td);
                trsub.appendChild(td2);
                tr.appendChild(trsub);
                this.tableInfo.appendChild(tr);
            }
        },

		/**
		 * Нарисовать маршрут используя класс GWTK.svgDrawing
         *
		 * @param coord
		 */
        drawGraph: function(coord){
            var json = null;
            try{
                json= JSON.parse(coord);
            }catch(e){
                console.log(e);
            }
            //переменная с информацией о маршруте
            if(json){
                try{
                    this.infoRouteNew = json.routeinfo;
                    this.appendMoreInfo(this.infoRouteNew);
                }catch(e){
                    console.log(e);
                }
                var options = {
                    stroke: '#863ff2',
                    "stroke-width": '5px',
                    vectorEffect: "non-scaling-stroke",
                    strokeColor: "black",
                    fill: true,
                    fillColor: "red",
                    fillOpacity: "0.75",
                    background: "",
                    backgroundsize: "auto auto"
                };
                if(!this.svgClass){
                    this.svgClass = new GWTK.svgDrawing(this.map, '123456', null, '321321', null);
                }
                this.svgClass.draw(json, false, options);
            }else{
                if(this.svgClass){
                    this.svgClass.clearDraw();
                }
                this.appendMoreInfo({}, w2utils.lang("Impossible to get route"));
            }
        },

		/**
		 * Устанавливает смещение точек на карте
         *
		 * @param pointImg
		 * @param offset
		 */
        setPointPosition: function(pointImg, offset){
            pointImg.style.left = offset.x - this.supportCenter.x + 'px';
            pointImg.style.top = offset.y - this.supportCenter.y + 'px';
        },

		/**
		 * Взаимная замена двух точек
         *
		 * @returns {boolean}
		 */
        reversRout: function(){
            if(this.coord.a == null || this.coord.b == null) return false;
            var temp = this.coord.a;
            this.coord.a = this.coord.b;
            this.coord.b = temp;
            this.pointAimg.latLng = GWTK.toLatLng(this.coord.a);
            this.pointBimg.latLng = GWTK.toLatLng(this.coord.b);
            var place = GWTK.tileView.geo2pixelOffset(this.map, this.pointAimg.latLng);
            this.pointAimg.style.left = place.x - 10 + 'px';
            this.pointAimg.style.top = place.y - 10 + 'px';
            this.inputA.value = this.coord.a[0].toFixed(8) + ', ' + this.coord.a[1].toFixed(8);

            var place2 = GWTK.tileView.geo2pixelOffset(this.map, this.pointBimg.latLng);
            this.pointBimg.style.left = place2.x - 12 + 'px';
            this.pointBimg.style.top = place2.y - 40 + 'px';
            this.inputB.value = this.coord.b[0].toFixed(8) + ', ' + this.coord.b[1].toFixed(8);

            this.sendRequest();
        },

		/**
		 * Сброс маршрута
		 */
        cancelRout: function() {
            this.coord.a = null;
            this.coord.b = null;
            this.inputA.value = '';
            this.inputB.value = '';
            if(this.pointAimg && this.pointAimg.latLng){
                this.pointAimg.latLng = null;
                this.pointAimg.style.display = 'none';
                this.pointAimg = null;
            }
            if(this.pointBimg && this.pointBimg.latLng){
                this.pointBimg.latLng = null;
                this.pointBimg.style.display = 'none';
                this.pointBimg = null;
            }
            if(this.svgClass){
                this.svgClass.destroy();
                this.svgClass = null;
            }
            $(this.tableInfo).empty();
            $(this.moreInfoContainer).hide();
            $("#short-route-info").remove();
            $(this.tempImg).remove();
        },

		/**
		 * Слушатель события клика в карте
         *
		 * @param e
		 * @returns {boolean}
		 */
		mapclickEventListener: function ( e ) {
			var that = this;
            // если в очереди есть запросы то не ставим точку и не отправляем запрос
            if(that.count !== 0) return false;
            $(that.tempImg).remove();
            if(!that.activ) return false;
            if(!that.inputA.value || !parseInt(that.inputA.value)){
                if(!that.pointAimg){
                    that.coord.a = e.geo;
                    that.inputA.value = e.geo[0].toFixed(8) + ', ' + e.geo[1].toFixed(8);
                    that.pointAimg = document.createElement('img');
                    that.pointAimg.className = "mrker-graph";
                    that.pointAimg.style.position = 'absolute';
                    that.pointAimg.style.width = 20 + 'px';
                    that.pointAimg.src = "data:image/png;base64,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";
                    that.pointAimg.style.left = e.point.x - 10  + 'px';
                    that.pointAimg.style.top = e.point.y - 10 + 'px';
                    that.pointAimg.latLng = GWTK.toLatLng(e.geo);
                    $(that.pointAimg).draggable({
                        start: function(event, ui){
                            that.lengthPoint = ui.offset;
                            $(that.tempImg).remove();
                        },
                        stop: function(){
							var coord = that.map.tiles.getLayersPointProjected( {
								x: parseInt( that.pointAimg.style.left ) + 10,
								y: parseInt( that.pointAimg.style.top ) + 10
							} );
							var geo = GWTK.projection.xy2geo( that.map.options.crs, coord.y, coord.x );
                            that.pointAimg.latLng = GWTK.toLatLng(geo);
                            that.inputA.value = geo[0].toFixed(8) + ', ' + geo[1].toFixed(8);
                            that.coord.a = geo;
                            that.sendRequest();
                            $(that.pointBimg).draggable( 'disable' );
                            $(that.pointAimg).draggable( 'disable' );
                        }
                    });
                    that.map.overlayPane.appendChild(that.pointAimg);
                }
            }else{
                if(that.count !== 0) return false;
                that.coord.b = e.geo;
                that.inputB.value = e.geo[0].toFixed(8) + ', ' + e.geo[1].toFixed(8);
                if(!that.pointBimg){
                    that.sendRequest();
                    that.pointBimg = document.createElement('img');
                    that.pointBimg.className = "mrker-graph";
                    that.pointBimg.style.position = 'absolute';
                    that.pointBimg.src = GWTK.imgMarkerBlankRed;
                    that.pointBimg.style.left = e.point.x - 12 + 'px';
                    that.pointBimg.style.top = e.point.y - 40 + 'px';
                    that.pointBimg.latLng = GWTK.toLatLng(e.geo);
                    $(that.pointBimg).draggable({
                        start: function(event, ui){
                            that.lengthPoint = ui.offset;
                            $(that.tempImg).remove();
                        },
                        stop: function(){
							var coord = that.map.tiles.getLayersPointProjected( {
                                x: parseInt(that.pointBimg.style.left) + 12,
                                y: parseInt(that.pointBimg.style.top) + 42
                            });
							var geo = GWTK.projection.xy2geo( that.map.options.crs, coord.y, coord.x );
                            that.pointBimg.latLng = GWTK.toLatLng(geo);
                            that.inputB.value = geo[0].toFixed(8) + ', ' + geo[1].toFixed(8);
                            that.coord.b = geo;
                            that.sendRequest();
                            $(that.pointBimg).draggable( 'disable' );
                            $(that.pointAimg).draggable( 'disable' );
                        }
                    });
                    $(that.pointBimg).draggable( 'disable' );
                    $(that.pointAimg).draggable( 'disable' );
                    that.map.overlayPane.appendChild(that.pointBimg);
                }else{
                    that.pointBimg.latLng = GWTK.toLatLng(e.geo);
                    that.pointBimg.style.left = e.point.x - 12 + 'px';
                    that.pointBimg.style.top = e.point.y - 40 + 'px';
                    that.sendRequest();
                    $(that.pointBimg).draggable( 'disable' );
                    $(that.pointAimg).draggable( 'disable' );
                }
            }
			e.stopPropagation();
        },

		/**
		 * Слушатель события overlayRefresh
		 */
		overlayRefreshEventListener: function () {

			if ( this.pointAimg ) {
				var geo = this.pointAimg.latLng;
				var place = GWTK.tileView.geo2pixelOffset( this.map, geo );
				this.pointAimg.style.left = place.x - 10 + 'px';
				this.pointAimg.style.top = place.y - 10 + 'px';
            }
			if ( this.pointBimg ) {
				var geo2 = this.pointBimg.latLng;
				var place2 = GWTK.tileView.geo2pixelOffset( this.map, geo2 );
				this.pointBimg.style.left = place2.x - 12 + 'px';
				this.pointBimg.style.top = place2.y - 42 + 'px';
            }
			if ( this.tempImg ) {
				var place3 = GWTK.tileView.geo2pixelOffset( this.map, this.tempImg.latlng );
                if(place3){
                    try{
						this.tempImg.style.left = place3.x - this.tempImgOffset.x + 'px';
						this.tempImg.style.top = place3.y - this.tempImgOffset.y + 'px';
                    }catch(e){
                        console.log(e);
                    }
                }

            }
        },

		/**
		 * Инициализация событий
		 */
        initEvents: function() {
            var that = this;
            $(this.moreInfoButton).on('click', function () {
                if ($(that.moreInfoContainer).is(':visible')) {
                    $(that.moreInfoContainer).hide();
                } else {
                    $(that.moreInfoContainer).show();
                    $('#route-info-table').show();
                    $('#' + that.map.divID + '_routePane').css({
                        height: "auto"
                    });
                }
            });

            $(this.cancelButton).on('click', function () {
                that.cancelRout();
            });

            $(this.reversePoint).on('click', function () {
                that.reversRout();
            });

            // обработка изменений размера панели контролов
			$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
				// изменить размеры своей панели
				this.resize();
			}.bind(this));
        },

        /**
		 * Изменить размер дочерних элементов по размеру панели
		 */
        resize: function () {
            //$(that.moreInfoContainer/*'#detail-more-info-rout-container'*/).css({maxHeight: $(this).height() - 185});
        },

        /**
         * Скрыть панель
         */
        hidePane: function () {
		    $(this.pane).hide();
        },

        /**
         * Отобразить панель
         */
        showPane: function () {
            $(this.pane).show();
        }

    };

	GWTK.Util.inherits( GWTK.RouteControl, GWTK.MapAction );
}
