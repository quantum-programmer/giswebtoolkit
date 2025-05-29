
 /******************************** Нефедьева О.А. **** 05/06/20 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                        Обработчик карты                          *
 *              Пересечение двух выбранных объектов карты           *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Обработчик карты
     * Пересечение двух выбранных объектов карты 
     * @constructor GWTK.MapCrossTwoObjectAction
     * @param task {Object} ссылка на задачу обработчика
     * @param map {GWTK.Map} ссылка на карту
     * @param name {string} строка, имя обработчика
    */
    GWTK.MapCrossTwoObjectsAction = function (task, map, name) {
        this._id = '_' + GWTK.Util.randomInt(2000, 50000);
        if (!map) {                                                         // карта
            console.log("GWTK.MapCrossTwoObjectAction. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.map = map;
        this.task = task;
        this.selectedObjects = [];
        this.selectableLayersId = [];

        //GWTK.SelectMapObjectActionHover.call(this, this.task, this.getSelectableLayers, true);
        GWTK.SelectMapObjectActionHover.call(this, this.task, {
            fn_setselectlayers: this.getSelectableLayers,
            drawall: true
        });

        if (typeof name !== 'undefined' && name.length > 0) {
            this.name = name;
        }
        else {
            this.name = 'mapcrosstwoobjects';
        }
        return;
    };

    GWTK.MapCrossTwoObjectsAction.prototype = {

        /**
         * Настроить
         * @method set
         */
        set: function () {
            this.initEvents();
        },

        /**
		 * Очистить
		 * @method clear
		 */
        clear: function () {
            this.$super.clear(this);
            $(this.map.eventPane).off('featurelistclick.' + this.id);
            this.map.statusbar.clearText();
            $('#w2ui-overlay-checkcross').click();
        },

        /**
		 * Получить идентификаторы слоев для выбора объектов
		 * @method getSelectableLayers
		 * @return {Array} - список слоев
		*/
        getSelectableLayers: function () {
            this.selectableLayersId = [];
            var layers = this.map.tiles.getSelectableLayersArray(), i;
            for (i = 0; i < layers.length; i++) {
                if (!layers[i].options || !layers[i].options.url) {
                    continue;
                }
                if (layers[i].options.url.indexOf(this.map.options.url) === 0)
                  this.selectableLayersId.push(layers[i].xId);
            }
            return this.selectableLayersId;
        },

        /**
		 * Назначить обработчики событий
		 * @method initEvents
		*/
        initEvents: function () {
            if (!this.map) { return; }
            var that = this,
                evtype = 'featurelistclick.' + this.id;

            $(this.map.eventPane).off(evtype);

            $(this.map.eventPane).on(evtype, function (event) { that._onObjectSelected(event); return; });

            this.onSuccess = GWTK.Util.bind(this.onSuccess, this);
            this.onError = GWTK.Util.bind(this.onError, this);

            return;
        },

        /**
		 * Обработчик события выбора объекта карты
		 * @method _onObjectSelected
		 * @param event {Object} объект события
		*/
        _onObjectSelected: function (event) {

            if (!this.selectedObjects || !this.map) {
                return;
            }

            if (this.selectedObjects.length == 2) {
                this.selectedObjects = [];
                this.map.statusbar.set("");
            }
            var lay_id = event.layer,
                lay = this.map.tiles.getLayerByxId(event.layer);

            if (!lay || !lay.idLayer || lay.idLayer.length == 0) {
                this.selectedObjects = [];
                return;
            }
            lay_id = lay.idLayer;
            
            this.selectedObjects.push({ 'gmlid': event.gid, 'layer_id': lay.idLayer, 'mapobject':this.selectedFeatures.findobjectsById(event.layer, event.gid) });

            var text = w2utils.lang("selected") + " : " + this.selectedObjects[0].gmlid;
            if (this.selectedObjects.length > 1) {
                text += '      ' + this.selectedObjects[1].gmlid;
            }
            this.map.statusbar.set(text);

            if (this.selectedObjects.length == 2) {
                this.postRequest();
            }
            return;
        },

        /**
		 * Отправить запрос CHECKCROSS
		 * @method postRequest
		*/
        postRequest: function () {
            if (this.selectedObjects.length < 2) {
                this.map.statusbar.set("Выберите объект карты");
                return;
            }

            this.zIndexDrawPanel('down', this.drawpanel);

            this.map.setCursor('progress');

            var url = this.map.options.url + "?service=WFS&restmethod=CHECKCROSS&layer=" +
                      this.selectedObjects[0].layer_id + ',' + this.selectedObjects[1].layer_id +
                      "&idlayerlist1=" + encodeURIComponent(this.selectedObjects[0].gmlid) +
                      "&IDLAYERLIST2=" + encodeURIComponent(this.selectedObjects[1].gmlid);
            var token = this.map.getToken();
            var xhrfields, 
            wc = this.map.authTypeServer(this.mapsrv) || this.map.authTypeExternal(this.mapsrv);
            wc ? xhrfields = {'withCredentials': true} : xhrfields = undefined;
            
            $.support.cors = true;
            
            $.ajax({
                crossDomain: true,
                type: 'get',
                url: url,
                dataType: 'xml',
                beforeSend: token ? function (xhr) { xhr.setRequestHeader(GWTK.AUTH_TOKEN, token) } : undefined,
                async: true,
                context: this,
                xhrFields: xhrfields,
                error: this.onError,
                success: this.onSuccess
            });
            return;
        },

        /**
		 * Обработка ошибки запроса CHECKCROSS
		 * @method onError
		*/
        onError: function (msg) {
            this.map.setCursor('default');
            console.log(w2utils.lang("Failed to get data"));
            console.log(msg);
            this.clearSelection();
            this.zIndexDrawPanel('up', this.drawpanel);
            return;
        },

        /**
		 * Сбросить информацию о выбранных объектах
		 * @method clearSelection
		*/
        clearSelection: function(){
            this.selectedObjects = [];
            this.selectedFeatures.clear();
        },

        /**
		 * Обработка ответа сервера на запрос CHECKCROSS
		 * @method onSuccess
		 * @param data {XmlDocument} результат проверки пересечения объектов
		*/
        onSuccess: function (data) {
            this.map.setCursor('default');
            
            var members = $(data).find('member');
            if (members.length == 0) {
                this.clearSelection();
                this.zIndexDrawPanel('up', this.drawpanel);
                return;
            }
            var check = $(members[0]).find('name').text();
            var html = '<div style="padding:5px;max-width:400px !important;">'+ this.getReport(check.toLowerCase())+'</div>';
            var param = { name: 'checkcross', noTip: true, html: html, align:'both', width:'400px'};

            this.task.$pane.w2overlay(param);

            var that = this;
            setTimeout(function () {
                that.clearSelection();
                that.zIndexDrawPanel('up', that.drawpanel);
            }, 2000);
            
        },

        /**
		 * Запросить отчет об операции
		 * @method getReport
		 * @param cross {string} результат проверки, 'cross' - имеется пересечение, 'notcross' - нет
		*/
        getReport: function (cross) {
            var mapobject1 = this.selectedObjects[0].mapobject, 
                number1 = GWTK.Util.parseGmlId(this.selectedObjects[0].gmlid), local1='',
                mapobject2 = this.selectedObjects[1].mapobject, 
                number2 = GWTK.Util.parseGmlId(this.selectedObjects[1].gmlid), local2='';
                
                if ( mapobject1.spatialposition.toLowerCase() == 'polygon' ||
                     mapobject1.spatialposition.toLowerCase() == 'multipolygon') local1 = w2utils.lang("Polygon");
                if ( mapobject1.spatialposition.toLowerCase() == 'linestring' ||
                     mapobject1.spatialposition.toLowerCase() == 'multilinestring') local1 = w2utils.lang("Line");
                if ( mapobject2.spatialposition.toLowerCase() == 'polygon' ||
                     mapobject2.spatialposition.toLowerCase() == 'multipolygon') local2 = w2utils.lang("Polygon");
                if ( mapobject2.spatialposition.toLowerCase() == 'linestring' ||
                     mapobject2.spatialposition.toLowerCase() == 'multilinestring') local2=w2utils.lang("Line"); 
                     var check = w2utils.lang('Yes');
                     if (cross !== 'cross') check = w2utils.lang('No');
                     //var name1 = mapobject1.name.slice(0, 1) + mapobject1.name.slice(1).toLowerCase();
            var table =
                '<div id="checkcrossReport" style="border: 0px solid silver; overflow : auto;">' +
                '<table id="table-cross-result">' +
                '<tr valign="top">' +
				'<th colspan="5" class="table-measur-td-header" style="text-align:center;">' + w2utils.lang("Intersecting objects") + '</th>' +
				'</tr><tr colspan="5" style="height:5px;"></tr>' +
 				'<tr valign="top">' +
                '<td class="table-measur-td">' + "1." + '</td>' +
                '<td class="table-measur-td">' + number1.objid + '</td>' +
                '<td class="table-measur-td">' + mapobject1.name.slice(0, 1) + mapobject1.name.slice(1).toLowerCase() + '</td>' +
                '<td class="table-measur-td">' + mapobject1.maplayername + '</td>' +
                '<td class="table-measur-td">' + local1 + '</td>' +
                '</tr>' +
                '<tr valign="top">' +
                '<td class="table-measur-td" >' + "2." + '</td>' +
                '<td class="table-measur-td" >' + number2.objid + '</td>' +
                '<td class="table-measur-td">' + mapobject2.name.slice(0, 1) + mapobject2.name.slice(1).toLowerCase() + '</td>' +
                '<td class="table-measur-td" >' + mapobject2.maplayername + '</td>' +
                '<td class="table-measur-td" >' + local2 + '</td>' +
                '</tr>' +
                '<tr colspan="5" style="height:5px;" valign="top"></tr>' +
                '<tr style="text-align:center;">' +
                '<td class="table-measur-td"></td>' +
                '<td class="table-measur-td"></td>' +
                '<td class="table-measur-td">' + w2utils.lang('Intersection') + '</td>' +
                '<td style="text-align:left;padding-left:5px;">' + check.toUpperCase() + '</td>' +
                '<td class="table-measur-td"></td>' +
                '</tr>' +
                '</table></div>';
            return table;
        }

    };

    GWTK.Util.inherits(GWTK.MapCrossTwoObjectsAction, GWTK.SelectMapObjectActionHover);
}