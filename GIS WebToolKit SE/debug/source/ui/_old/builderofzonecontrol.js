/************************************** Нефедьева О.   13/01/21 ****
 *************************************** Полищук Г.В.   15/12/20 ****
 *************************************** Патейчук В.К.  20/05/20 ****
 *************************************** Гиман Н.       08/10/19 ****
*************************************** Помозов Е.В.   02/03/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2022              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Буферные зоны"                    *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    GWTK.zoneItem = { 'id': "", 'geojson': "", 'alias': "", "svgid": "", "svgdraw": '' };
    /**
     * Контрол Построение буферной зоны
     * @class GWTK.BuilderOfZoneControl
     * @constructor GWTK.BuilderOfZoneControl
     * @param map {GWTK.Map} карта
     */
    GWTK.BuilderOfZoneControl = function(map) {
        this.toolname = 'builderOfZone';                                          // имя компонента

        this.map = map;                                                           // карта
        if (!this.map) {
            console.log("BuilderOfZoneControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.id = null;
        this.pane = null;
        this.$pane = null;
        this.gmlId = "";                                                           // идентификатор объекта или список идентификаторов
        this.layerId = "";                                                         // список идентификаторов слоев карты
        this.wfs = null;                                                           // запросы построения зоны
        this.geoJSON_Zone = null;                                                  // геометрия зоны
        this._zonePaneId = 'zonePane_';                                            // идентификатор панели отображения зоны
        this.number = 1;                                                           // текущий номер зоны
        this.svgCanvasId = "builderzone_canvas";                                   // идентификатор текущей svg-канвы
        this.svgDraw = null;                                                       // текущий класс svg-рисования
        this.zones = [];
        this.init();
    };
    GWTK.BuilderOfZoneControl.prototype = {
        /**
         * Инициализация
         */
        init: function() {
            this.createPane();
            this.createtoolbarsButton();
            // добавить в карту
            this.map.maptools.push(this);
            this.isActive = false;

            var mapContent = this.map.mapTool('mapcontent');
            var that = this;

            $(this.map.eventPane).on('layercommand.builderzone', function(event) {
                if (event.maplayer.act == 'remove') {
                    if (event.maplayer.subtype == 'zone') {
                        var layer = that.map.tiles.getLayerByxId(event.maplayer.id);
                        if (layer) {
                            layer.onRemove();
                            w2ui[mapContent.name].remove(event.maplayer.id);
                        }
                        var group = w2ui[mapContent.name].get('zone_group');
                        if (group && group.nodes.length == 0) {
                            w2ui[mapContent.name].remove('zone_group');
                        }
                        event.preventDefault();
                    }
                }
            });

            this.setResizable();

            // если не указана панель для компонентов, то доступно перетаскивание
            if (!this.map.options.controlspanel) {
                this.setDraggable();
            }
        },

        /**
         * создать кнопку в панели карты
         */
        createtoolbarsButton: function() {
            if (!this.map || !this.map.panes.toolbarPane || !this.pane)
                return;
            var map = this.map, task = this;
            this.bt = GWTK.DomUtil.create('div', 'control-button control-button-buildzone clickable', this.map.panes.toolbarPane);
            this.bt.id = 'panel_button_builderzone';
            this.bt.disabled = true;
            this.bt.title = w2utils.lang('Build buffer zone');

            if (this.pane.id) {                        // идентификатор панели
                this.bt._pane = this.pane.id;
                this.bt.disabled = false;
            }

            $(this.bt).attr('toolname', this.toolname);

            if (this.map.hasMenu()) {
                $(this.bt).css("display", "none");
            }

            // обработчик клика на кнопке (активировать режим, показать панель)
            $(this.bt).on("click", function(event) {
                if (!map) return false;
                if (!$(this).hasClass('control-button-active')) {
                    map.handlers.toolbar_button_click(event);
                    task.isActive = true;
                    task._displayZoneObjectInfo();
                    $(task.map.eventPane).on('featurelistclick.builderzone', function(e) {
                        task.featureSelected(e);
                    });
                    // развернуть общую панель для компонентов (если используется)
                    task.map.showControlsPanel();
                }else{
                    map.handlers.toolbar_button_click(event);
                    task.isActive = false;
                    $(task.map.eventPane).off('featurelistclick.builderzone');
                }
            });

            return false;
        },

        /**
         * Создать панель "Построение буферной зоны"
         */
        createPane: function() {

            this.id = this.map.divID + '_builderzonePane';
            // если указана панель для компонентов, то создаем в ней
            if (this.map.options.controlspanel) {
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def-flex builderzone-panel-flex', this.map.mapControls);
            }else{
                this.pane = GWTK.DomUtil.create('div', 'map-panel-def builderzone-panel', this.map.mapPaneOld);
            }
            this.pane.id = this.id;
            this.$pane = $(this.pane);
            this.$pane.hide();

            // заголовок
            this.createHeader();

            // body
            var frame = document.createElement('div');
            frame.id = this.map.divID + "_builderzone_container";
            $(frame).html('<div id="builderzone_info" class="panel-builderzone-info"></div>' +
                '<div style="height:10px"/>' +
                '<div class="panel-builderzone-radius">' +
                '<label style="left:2px" for="builderzone_radius"> ' + w2utils.lang("Zone radius") + ' </label>&nbsp;' +
                '</div>');
            this.$pane.append(frame);

            // поле ввода радиуса зоны
            var zoneinput = document.createElement('input');
            zoneinput.setAttribute('type', "text");
            zoneinput.setAttribute('name', 'builderzone_radius');
            zoneinput.setAttribute('id', 'bulderzone_radius');
            zoneinput.className = 'build-zone-radius-input';
            zoneinput.value = '';
            zoneinput.title = w2utils.lang("Zone radius");
            $(".panel-builderzone-radius").append(zoneinput);

            // единицы измерения и параметры построения
            var elem = document.createElement('div');
            elem.className = 'panel-builderzone-units';
            elem.id = "zone_units";
            $(elem).html('<span style="nowrap; margin-right: 5px">' +
                '<input type="radio" name="units_zone" id="units_meter" />' +
                '<label for="units_meter">' + w2utils.lang("meters") + '</label>' +
                '</span>' +
                '<span style="nowrap">' +
                '<input type="radio" name="units_zone" id="units_kilometer" checked />' +
                '<label for="units_kilometer">' + w2utils.lang("kilometers") + '</label>' +
                '</span>');
            $(elem).insertAfter('#bulderzone_radius');

            var elem = document.createElement('br');
            $(frame).append(elem);

            $(frame).append('<div class="panel-builderzone-units" >' +
                '<span style="nowrap">' +
                '<input type="checkbox"  name="zone_selectedfeatures" id="zone_selectedfeatures" />' +
                '<label for="zone_selectedfeatures"> ' + w2utils.lang("Around all selected") + '</label>&nbsp;' +
                '</span>' +
                '<span style="nowrap">' +
                '<input type="checkbox" disabled  name="zone_selectedfeatures_union" id="zone_selectedfeatures_union" />' +
                '<label for="zone_selectedfeatures_union">' + w2utils.lang("Sew zone") + '</label>&nbsp;' +
                '</span>' +
                '<span style="nowrap">' +
                '<input type="checkbox" id="search_by_zone"/>' +
                '<label>' + w2utils.lang('Object search') + '</label>' +
                '</span>' +
                '</div><br/>');

            $(frame).append('<hr>')

            // кнопка OK и Параметры карты
            elem = document.createElement('div');
            $(elem).html('<div class="panel-builderzone-footer">' +
                '<input type="text" class="build-zone-name-input" id="builderzone_name" name="builderzone_name" title="' + w2utils.lang("Name of buffer zone") + '"/>&nbsp;' +
                '<button type="button" class="control-button control-button-ok control-button_small build-zone-apply-btn" id="bulderzone_ok" title="' + w2utils.lang("Build") + '"></button>&nbsp;' +
                '<button type="button" class="control-button control-button_small control-button-options build-zone-show-options-btn" id="bulderzone_showoptions" title="' + w2utils.lang("Options") + '" ></button>' +
                '</div>');
            $(frame).append(elem);

            var $zname = $("#builderzone_name");
            $zname.val(w2utils.lang("Buffer zone ") + this.number);

            // назначить обработчики событий
            this.initEvents();

            return false;
        },

        /**
         * Создать заголовок окна
         * @method createHeader
         */
        createHeader: function() {
            if (!this.pane) return;

            this.header = GWTK.Util.createHeaderForComponent({
                    callback: function(e) {
                        $('#panel_button_builderzone').click();
                    },
                    name: w2utils.lang("Build buffer zone"),
                    map: this.map,
                    context: this.toolname,
                    parent: this.pane
                }
            );

            return;
        },

        /**
         * Назначить обработчики событий
         * @method initEvents
         */
        initEvents: function() {
            var tool = this;
            // показать окно Параметры/Поиск по области
            $('#bulderzone_showoptions').on('click', function() {
                var $bt_options = $('#panel_button_options');
                if ($bt_options.length == 0) {
                    return;
                }
                if (!$bt_options.hasClass('control-button-active')) {
                    $bt_options.click();
                }
                if (w2ui['opttabs']) {
                    w2ui['opttabs'].click('tabareasearch');
                }
            });

            // выбран объект на карте
            $(this.map.eventPane).on('featurelistclick.builderzone', function(e) {
                tool.featureSelected(e);
            });

            // отменен выбранный объект
            $(this.map.eventPane).on('featurelistcanceled.builderzone', function(e) {
                if (tool) {
                    var msg = "<span>" + w2utils.lang("Select map object") + "</span>";
                    tool.$pane.find("#builderzone_info").html(msg);
                }
                return;
            });

            // строить вокруг всех выделенных объектов
            this.$pane.find('#zone_selectedfeatures').click(function(event) {
                var $sew = $('#zone_selectedfeatures_union');
                $sew.prop('disabled', !$sew.prop('disabled'));
                tool.onAllClick(event)
            });

            // построить зону
            $('#bulderzone_ok').on('click', function() {
                if (!tool) return false;
                tool._build(tool);
            });

            // проверка ввода пользователя
            $("#bulderzone_radius").keypress(function(e) {
                if (e.which == 46) {
                    if ($(this).val().indexOf('.') != -1)
                        return false;
                }else if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                    return false;
                }
            });

            this._onZoneDataLoaded = GWTK.Util.bind(this._onZoneDataLoaded, this);

            // обработка изменений размера панели контролов
            $(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function(event) {
                // изменить размеры своей панели
                this.resize();
            }.bind(this));

            return false;
        },

        /**
         * Отобразить панель
         */
        showPane: function() {
            // вывести информацию о выбранном объекте
            this._displayZoneObjectInfo();
            this.$pane.show();
            // развернуть общую панель для компонентов (если используется)
            this.map.showControlsPanel();
        },

        /**
         * Скрыть панель
         */
        hidePane: function() {
            this.$pane.hide();
        },

        /**
         * проверить видимость панели
         * @returns {boolean}
         */
        visible: function() {
            return !(this.pane.style.display && this.pane.style.display == 'none');
        },

        /**
         * Получить признак сшивания зон
         * @returns {string} 1 || 0
         */
        getUnion: function() {
            var $sew = $('#zone_selectedfeatures_union');
            var $all = $("#zone_selectedfeatures");
            return $all.prop('checked') && $sew.prop('checked') && !$sew.prop('disabled') ? '0' : '1';
        },

        /**
         * Обработчик выбора объекта карты
         * @param data
         */
        featureSelected: function(e, data) {
            if (this.visible) {
                this._displayZoneObjectInfo(e, data);
            }
        },

        /**
         * Вывести информацию об объекте
         * @param options параметры объекта
         * @private
         */
        _displayZoneObjectInfo: function(e, options) {

            if (!this.isActive || !this.map) {
                return;
            }

            var msg = "<span>" + w2utils.lang("Select map object") + "</span>";

            var todo = false, layerfeature = null, param = options;

            if (param && 'layer' in param && 'gid' in param) todo = true;

            if (!e) {
                if (!this.map.selectedObjects.drawselobject) {
                    this.$pane.find("#builderzone_info").html(msg);
                    return;
                }else{
                    if (!param) {
                        var maplay = this.map.tiles.getLayerByGmlId(this.map.selectedObjects.drawselobject.gid);
                        if (!maplay || maplay == null) {
                            this.$pane.find("#builderzone_info").html(msg);
                            return;
                        }
                        if (maplay.getType() !== 'tile' && maplay.getType() !== 'wms') {
                            this.$pane.find("#builderzone_info").html(msg);
                            return;
                        }
                        param = {
                            layer: this.map.selectedObjects.drawselobject.maplayerid,
                            gid: this.map.selectedObjects.drawselobject.gid
                        };
                        layerfeature = this.map.selectedObjects.drawselobject;
                        todo = true;
                    }
                }
            }

            if (e && e.gid) {
                layerfeature = this.map.selectedObjects.findobjectsByGid(e.gid);
                if (!param) param = { layer: layerfeature.maplayerid, gid: layerfeature.gid };
                if (param.layer && param.gid) todo = true;
                var lay = this.map.tiles.getLayerByxId(layerfeature.maplayerid);
                if (lay == null || lay.getType() == 'svg' || lay.getType() == 'geomarkers') {
                    todo = false;
                }
            }

            if (!todo) {
                this.$pane.find("#builderzone_info").html(msg);
                return;
            }

            var lay = this.map.tiles.getLayerByxId(param.layer);
            if (lay) {
                msg = "<span>" + layerfeature.name + "   " + lay.alias + "</span>";
                this.$pane.find("#builderzone_info").html(msg);
            }
            return false;
        },

        /**
         * Вывести сообщение
         * @param msgtext - текстовое сообщение
         * @private
         */
        _showMessage: function(msgtext) {
            var $mess = $("#bulderzone_errMessage");
            if ($mess.length == 0) {
                $mess = $(document.createElement('span'));
                $mess[0].id = "bulderzone_errMessage";
                $mess[0].style.color = 'red';
                $mess.html(msgtext);
                $mess.insertAfter("#bulderzone_radius");
            }else{
                $mess.html(msgtext);
                $mess.show(1);
            }
            $mess.fadeOut(3000);
        },

        /**
         * Обработчик клика на кнопке "Вокруг всех"
         * @param event событие
         */
        onAllClick: function(event) {
            var target = null;
            if (event)
                target = event.currentTarget;
            if (!target) {
                if (event.srcElement) target = event.srcElement;
                else return;
            }
            if (target.checked) {
                var layerfeature = this.map.selectedObjects.drawselobject;
                if (layerfeature && layerfeature.gid)
                    $("#builderzone_info").css('color', "#868b92");
            }else{
                $("#builderzone_info").css('color', '');
            }
            return false;
        },

        /**
         * выполнить запрос для построения зоны заданного радиуса вокруг объекта карты
         * @returns {boolean}
         * @private
         */
        _build: function() {
            var ie = GWTK.Util.ie_Version();
            if (ie > 0 && ie < 9) {
                GWTK.Util.showMessage(GWTK.errorBrowserSvg);
                return false;
            }
            var $txt = $("#builderzone_name");
            var txt = $txt.val();
            if (!txt || txt.length == 0)
                $txt.val(w2utils.lang("Buffer zone ") + this.number);

            // var enabled = true;
            var $input = $('#bulderzone_radius');
            var radius = $input.val();
            if (!radius || radius == 0) {
                this._showMessage(' *' + w2utils.lang("Enter the radius") + '!');
                return false;
            }
            var $eunit = $('#units_kilometer');
            if ($eunit[0].checked) {
                radius = parseFloat(radius) * 1000;
            }

            if (this.wfs == null) {
                // this.wfs = new MapMath(this.map.options.url, this.map);
                // this.wfs.context = this;
                // this.wfs.onDataLoad = this._onZoneDataLoaded;
                const httpParams = GWTK.RequestServices.createHttpParams(this.map);
                this.wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
            }
            var $all = $("#zone_selectedfeatures");
            if ($all.length > 0) {
                $all = $all[0].checked;
            }else $all = false;

            var layerfeature = this.map.objectManager.selectedFeatures.drawcurrobject || this.map.objectManager.selectedFeatures.mapobjects[0];

            if (!layerfeature || !layerfeature.gid) {
                w2alert(w2utils.lang("Select map object") + '!', w2utils.lang("Buffer zones"));
                return false;
            }
            var gmlid = layerfeature.gid;
            var maplayer = this.map.tiles.getLayerByGmlId(layerfeature.gid);
            if (!maplayer) {
                if (gmlid)
                    this._showMessage(w2utils.lang("Select map object"));
                window.console.log("BuilderOfZoneControl:  Map layer undefined for object " + gmlid);
                return false;
            }
            var layer = this.map.tiles.getIdServiceByLayer(maplayer);
            if (layer.length == 0) {
                if (maplayer.getType() !== 'tile' && maplayer.getType() !== 'wms') {
                    this._showMessage(w2utils.lang("Select a non-graphic object") + "!");
                }else{
                    this._showMessage(w2utils.lang("Input data error"));
                }
                return false;
            }

            if ($all) {
                gmlid = this.map.objectManager.selectedFeatures.getselection().toString();
                layer = this.map.objectManager.selectedFeatures.layers.toString();
                if (layer.length == 0) {
                    this._showMessage(w2utils.lang("Input data error"));
                    return false;
                }
            }

            // if ($all) {
            //     this.wfs.postxmlrpc(this._getRequestXmlRpc(layer, gmlid, radius), this, "BuildZone");
            // }else{
            //     this.wfs.buildzonefeature(layer, gmlid, radius, this);
            // }
            this.wfs.buildZone({ LAYER: layer, IDLIST: gmlid, RADIUS: radius, SEVERALOBJ: this.getUnion() }).then((result) => {
                if (result.data) {
                    this._onZoneDataLoaded(result.data);
                }
            });

            this.canCancel = false;                          // запретить завершение задачи
            return false;
        },

        /**
         * Поиск объектов по буферной зоне
         * @param response - ответ зоны
         * @returns {boolean}
         */
        findObjectByBufferZone: function(response) {
            //Получили ответ с буферными зонами
            var findCheckBox = document.getElementById('search_by_zone');
            if (!findCheckBox || !findCheckBox.checked) return false;
            var $response = $(response);
            this.$featureCollectionNameSpaces = {};
            var xmlDoc = $.parseXML(response);
            var featureCollectionHTML = xmlDoc.getElementsByTagName('FeatureCollection');
            this.fillNameSpaces(featureCollectionHTML);
            this.getXmlHeaderWithNameSpaces();
            var globalCount = $response.find('wfs\\:member');
            if (globalCount.length > 1) {
                w2alert(w2utils.lang("Search is possible only for one zone."));
                return;
            }

            // найти объекты по зоне, как области поиска
            this.sendAreaSeekRequest(globalCount, $response);
        },

        /**
         * Установить переменные для XML c учетом пространства имен
         */
        getXmlHeaderWithNameSpaces: function() {
            var tmpString = '';
            for (var k in this.$featureCollectionNameSpaces) {
                if (this.$featureCollectionNameSpaces.hasOwnProperty(k)) {
                    tmpString += ' ' + k + '="' + this.$featureCollectionNameSpaces[k] + '" ';
                }
            }
            this.gmlHeader = '<?xml version="1.0" encoding="utf-8"?> <wfs:FeatureCollection ' + tmpString + ' >';
            this.gmlHeaderEnd = '</wfs:FeatureCollection>';
        },

        /**
         * Заполнить объект пространствами имен
         * @param featureCollectionHTML - xmlDoc.getElementsByTagName('FeatureCollection')
         * @returns {boolean}
         */
        fillNameSpaces: function(featureCollectionHTML) {
            if (!featureCollectionHTML || featureCollectionHTML.length == 0) return false;
            var attributes = featureCollectionHTML[0].attributes;
            for (var i = 0; i < attributes.length; i++) {
                if (this.$featureCollectionNameSpaces[attributes[i].name] && this.$featureCollectionNameSpaces[attributes[i].name] != attributes[i].value) {
                    console.log(w2utils.lang('Identical namespace with different values'));
                }
                this.$featureCollectionNameSpaces[attributes[i].name] = attributes[i].value;
            }
        },

        /**
         * Отправить запросы поиска по буферной зоне
         * @param globalCount количество буферных зон
         * @param $response jq объект (ответ сервера - буферные зоны)
         * @returns {boolean}
         */
        sendAreaSeekRequest: function(globalCount, $response) {

            this.map.handlers.clearselect_button_click();
            if (!globalCount || !$response) {
                return false;
            }
            var layers = this.map.tiles.getAreaSeekLayersxId();
            if (layers.length == 0) {
                return false;
            }

            w2utils.lock(this.$pane, w2utils.lang('Please, wait...'), true);
            $('.w2ui-lock-msg').css({ top: '50%' });
            $('.w2ui-lock-msg .w2ui-spinner').css({ margin: '25px 8px -7px -10px' });//Chrome FF IE 11

            var wfs = new GWTK.WfsRestRequests(this.map);
            if (typeof wfs === "undefined") {
                return false;
            }
            wfs.centering = 0;

            var visibleflag = GWTK.Util.stateRestoreStorage('areaseek_' + this.map.options.id);
            if (typeof visibleflag !== 'boolean') {
                visibleflag = false;
            }

            for (var i = 0; i < globalCount.length; i++) {
                var gmlBoundedBy = $response.find('gml\\:boundedBy');
                if (!gmlBoundedBy || gmlBoundedBy.length == 0) return false;
                var htmlAsGmlText = globalCount[i].outerHTML;
                var xArea = this.gmlHeader + gmlBoundedBy[0].outerHTML + htmlAsGmlText.replace('/[\n\r]+/ig', ' ') + this.gmlHeaderEnd;
                if (!xArea) return false;

                this.map.setCursor('progress');
                xArea = GWTK.Util.utf8ToBase64(xArea);
                var uri_param = "?mapid=1&objcenter=2&objlocal=0,1,2,4&filedata=1&semanticname=1&start_index=0&area=1&semantic=1&ignoreEndToEndNumbering=1";

                var urls = wfs.getUrls('areaseekcrosssquare', uri_param, xArea, visibleflag);
            }

            if (urls.length > 0) {
                wfs.postRequestMulti(urls);
            }else{
                w2utils.unlock(this.$pane);
            }

            $(this.map.eventPane).one("featureinforefreshed", GWTK.Util.bind(function() {
                w2utils.unlock(this.$pane);
            }, this));

            $(this.map.eventPane).one("featureinforefreshedcancel", GWTK.Util.bind(function() {
                w2utils.unlock(this.$pane);
            }, this));
        },

        /**
         * получение ответа сервера
         * @param response ответ сервера
         * @private
         */
        _onZoneDataLoaded: function(response) {
            this.findObjectByBufferZone(response);
            // проверить ответ
            $('#bulderzone_ok')[0].disabled = false;

            this.canCancel = true;                          // разрешить завершение задачи

            if (!this.isCancelled) {                        // была отмена задачи?
                if (response.indexOf("Exception") != -1) {
                    this._showMessage('BuildZone. ' + w2utils.lang("Failed to get data") + '!');
                    return;
                }

                this._drawZone(response);
            }

            this.isCancelled = false;
            return false;
        },

        /**
         * создать класс отображения SVG рисунка
         * @private
         */
        _createDraw: function() {
            this.svgDraw = new GWTK.svgDrawing(this.map, this._zonePaneId + this.number, null, this.svgCanvasId + this.number);
            this.svgDraw.initView();
            this.svgDraw.options.fill = 'red';
            this.svgDraw.options['fill-opacity'] = '0.15';
            this.svgDraw.options["stroke"] = "";
            this.svgDraw.options["stroke-width"] = "0px";
            this.svgDraw.options["stroke-opacity"] = "0.0";
            return false;
        },

        /**
         * удалить класс отображения SVG рисунка
         * @private
         */
        _destroyDraw: function() {
            if (!this.zones || !this.zones.length) return;
            this.zones = [];
            this.svgDraw = null;
            this.number = 1;
        },

        /**
         * удалить зону по идентификатору
         * @param id идентификатор
         */
        removeZone: function(id) {
            if (!this.zones || !this.zones.length) return;
            var i, len = this.zones.length, draw = null, data;

            for (i = 0; i < len; i++) {
                if (id !== this.zones[i].id)
                    continue;
                $(this.zones[i].svgdraw.drawpanel).remove();
                draw = this.zones[i].svgdraw;
                data = this.zones[i].geojson;
                this.zones = this.zones.splice(i, 1);
                if (this.svgDraw === draw) {
                    this.svgDraw = this.zones[this.zones.length - 1].svgdraw;            // установить текущий объект отображения зоны
                    this.geoJSON_Zone = this.zones[this.zones.length - 1].geojson;
                }
                break;
            }
            return false;
        },

        /**
         * нарисовать зону
         * @param response ответ сервера
         * @returns {*}
         * @private
         */
        _drawZone: function(response) {

            // преобразовать xml to geoJSON
            var geoJSON = {
                "type": "FeatureCollection", "features": [
                    //{
                    //    "type": "Feature", "geometry": {
                    //        "type": "Polygon",
                    //        "coordinates": []
                    //    },
                    //    "properties": { "name": "abc", "id": "1" }
                    //}
                ]
            };

            var $xml = $.parseXML(response),
                xml = $($xml);
            var members = xml.context.documentElement.childNodes;
            if (members.length == 0)
                return "";
            var coordlen, len = members.length, i, j, elem, coord;
            for (i = 0; i < len; i++) {
                if (members[i].nodeName.toLowerCase().indexOf('member') == -1)
                    continue;
                elem = members[i].childNodes[0];
                if (!elem) break;
                $(elem.childNodes).each(function() {
                    if (this.nodeName.toLowerCase().indexOf('polygon') != -1) {
                        coord = $(this).text();
                        if (coord.length != 0) {
                            coord = coord.split(' ');
                            coordlen = coord.length - 1;
                            var metric = [];
                            for (j = 0; j < coordlen; j++) {
                                metric.push([coord[j + 1], coord[j]]);
                                j++;
                            }
                            //var ff = { type: "Feature", geometry: { type: "Polygon", coordinates: [metric] } };
                            geoJSON.features.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [metric] } });
                        }
                    }
                });
            }

            if (geoJSON.features.length == 0) {
                return false;
            }
            geoJSON.properties = {};
            geoJSON.properties.name = 'bufferzone';
            geoJSON.properties.id = 'bufzone_' + this.number;

            this.geoJSON_Zone = geoJSON;
            var $zname = $("#builderzone_name");
            var zname = $zname.val();
            if (!zname || zname.length == 0)
                zname = w2utils.lang("Buffer zone ") + this.number;

            // сохранить в массиве
            var record = { 'id': 'zone_' + this.number, 'geojson': geoJSON, 'alias': zname, "svgdraw": this.svgDraw }, node;
            this.zones.push(record);

            var mapContent = this.map.mapTool('mapcontent');
            // добавить узел зоны в дерево состава карты
            if (mapContent) {
                // добавить узел зоны в дерево данных карты
                if (!w2ui[mapContent.name].get("zone_group")) {
                    // создать группу "Буферные зоны"
                    w2ui[mapContent.name].add({
                        "id": "zone_group",
                        "text": w2utils.lang("Buffer zones"),
                        "group": true,
                        "expanded": true,
                        "img": ""
                    });
                }

                // добавить node в группу "Буферные зоны"
                node = { "id": record.id, "group": false, "expanded": false };
                node.eventPanelId = this.map.eventPane.id;
                node.remove = true;
                node.gClickable = true;
                node.panischecked = true;
                node.text = record.alias;
                node.showsettings = this.map.options.showsettings;
                node.subtype = 'zone';

                w2ui[mapContent.name].add("zone_group", node);

                w2ui[mapContent.name].scrollIntoView(node.id);
            }

            this.number++;

            $zname.val(w2utils.lang("Buffer zone ") + this.number);

            // нарисовать
            var options = { "url": "", "id": record.id, "alias": record.alias, "selectObject": 1, "selectsearch": "0" };

            var zoneLayer = new GWTK.graphicLayer(this.map, options);

            var styles = this.map.options.measurementstyle;
            if (styles['fillcolor'] == undefined) styles['fillcolor'] = 'red';
            if (styles['opacity'] == undefined) styles['opacity'] = '0.3';

            for (var k = 0; k < geoJSON.features.length; k++) {
                geoJSON.features[k].properties = {};
                geoJSON.features[k].properties.name = w2utils.lang("Buffer zone ");
                geoJSON.features[k].style = {
                    "stroke": "#",
                    "stroke-width": "1",
                    "stroke-opacity": "0.75",
                    "fill": 'red',                          //"#" + styles.fillcolor,
                    "fill-opacity": '0.3',                  //styles.opacity,
                    "stroke-dasharray": "none"
                };
                zoneLayer.addFeature(geoJSON.features[k]);
            }

            zoneLayer.drawMap(false);

            return true;
        },

        /**
         * Освободить ресурсы
         */
        destroy: function() {

            if (this.header)
                $(this.header).find('.panel-info-close').off();
            else
                this.$pane.find('.panel-info-close').off();

            $('#bulderzone_ok').off();
            $(this.map.eventPane).off('featurelistcanceled.builderzone');
            $(this.map.eventPane).off('featurelistclick.builderzone');
            $(this.map.eventPane).off('overlayRefresh.builderzone');
            $(this.map.eventPane).off('mapdrag.builderzone');
            $('#bulderzone_showoptions').off();
            $('#zone_selectedfeatures').off();
            $("#bulderzone_radius").off();

            this._destroyDraw();
            this.$pane.html('');
            this.$pane.remove();

            this.zones = [];

            $(this.bt).remove();
        },

        /**
         * временное изображение
         * @returns {boolean}
         */
        createTempDraw: function() {
            if (!this.geoJSON_Zone || !this.svgDraw) return false;
            if (!this.map.mapClone) return false;
            var $zclone = $(this.svgDraw.drawpanel).clone(true);
            $zclone[0].id = this.svgDraw.drawpanel.id + "_temp";
            var left = -parseInt(this.map.panes.tilePane.style.left),
                top = -parseInt(this.map.panes.tilePane.style.top);
            $zclone[0].style.left = left + 'px';
            $zclone[0].style.top = top + 'px';
            this.map.mapClone.append($zclone[0]);
            $(this.svgDraw.drawpanel).hide();
            return true;
        },

        /**
         * Сформировать xmlRpc-запрос
         * @param layers - слои
         * @param ids - идентификаторы
         * @param radius - радиус
         * @returns {*}
         * @private
         */
        _getRequestXmlRpc: function(layers, ids, radius) {
            if (!layers || !ids || !radius)
                return "";
            var url = "?" + 'layer=' + layers + "&idlist=" + ids + "&radius=" + radius + "&circle=1&severalobj=" + this.getUnion();

            return GWTK.Util.url2xmlRpc(url, "BuildZone");
        },

        /**
         * Сделать панель перемещаемой
         */
        setDraggable: function() {
            if (!this.map)
                return;
            GWTK.panelUI({ draggable: true, $element: this.$pane, resizable: false });
        },

        /**
         * Установить возможность изменения размеров окна компонента
         */
        setResizable: function() {
            var that = this;
            this.$pane.resizable({
                handles: 's,w,sw',
                resize: function(event, ui) {
                    ui.position.left = ui.originalPosition.left;
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
                stop: function() {
                }
            });
        },

        /**
         * Изменить размер дочерних элементов по размеру панели
         */
        resize: function() {

        }

    };

}
