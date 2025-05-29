/*************************************** Патейчук В.К.  15/04/20 ****
 *************************************** Нефедьева О.А. 09/12/20 ****
 *************************************** Полищук Г.В.   13/11/19 ****
 *************************************** Гиман Н.Л.     09/08/19 ****
 *************************************** Помозов Е.В.   26/09/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Компонент "Скачать слои"                     *
 *                                                                  *
 *******************************************************************/

/**
 * Компонент скачивания файлов данных карты
 * Поддерживаемые форматы для экспорта: json, gml, sxf, txf
 * Скачивание данных возможно в слоях карты, в параметрах которых
 * содержится ключ "export" со списком разрешенных форматов данных,
 * например, {...,"export":['gml','json'],..}
 */
protoExportLayer = {
    title: w2utils.lang('Layers export'),

    formats: {
        'gml': {
            outType: '',
            contentType: 'text/xml',
            ext: 'gml'
        },
        'json': {
            outType: 'json',
            contentType: 'text/plain',
            ext: 'json'
        },
        'sxf': {
            outType: 'sxf',
            contentType: 'text/plain',
            ext: 'zip'
        },
        'txf': {
            outType: 'txf',
            contentType: 'text/plain',
            ext: 'zip'
        }
    },
    format: undefined,

    button_options: {
        "class": 'control-button control-button-exportlayer clickable'
    },

    panel_options: {
        'class': 'map-panel-def exportlayer-panel',
        'class-controlspanel': 'map-panel-def-flex exportlayer-panel-flex',
        'display': 'none',
        'hidable': true,
        'header': true,
        'draggable': true,
        'resizable': true
    },

    /**
     * Инициализация компонента
     */
    init: function () {
        this.title = w2utils.lang('Layers export');
        this.createButton();

        this.createPanel();

        this.createExportLayerPanelBody();

        this.initEventsExportLayer();

        this.createExportLayerGrid();

        this.listenExportLayerGridUpdate();
    },

    /**
     * Инициализация событий
     *
     * @method initEventsExportLayer
     */
    initEventsExportLayer: function () {

        //this.initEvents(); // вызвать базовый метод
        // базовый метод initEvents() переопределен ниже

        // обработка клика на кнопке в тулбаре
        this.$button.on('click', function () {
            if (GWTK.DomUtil.isActiveElement(this.$button)) {
                this.$button.removeClass('control-button-active');
                this.$panel.hide();
            } else {
                this.$button.addClass('control-button-active');
                this.$panel.show();
                // развернуть общую панель для компонентов (если используется)
                this.map.showControlsPanel();
                this.grid.refresh(); // обновить грид
            }
            this._notifyClick();
        }.bind(this));

        // обработка изменений размера панели
        this.$panel.on('resize', function (event) {
            w2ui[this.gridName].box.style.height = event.target.clientHeight - 45 + 'px';
            w2ui[this.gridName].resize();
        }.bind(this));

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
        // обновить грид
        if (w2ui[this.gridName])
            w2ui[this.gridName].resize();
    },

    /**
     * Создать рабочее пространство для панели.
     *
     * @method createExportLayerPanelBody
     */
    createExportLayerPanelBody: function () {
        this.$body = $('<div>')
            //.css({ height: this.panelMinHeight - 25 })
            .css({ height: 180 })
            .appendTo(this.$panel);
    },

    /**
     * Создать w2grid слоёв.
     *
     * @method createExportLayerGrid
     */
    createExportLayerGrid: function () {
        if (this.gridName && w2ui[this.gridName]) {
            w2ui[this.gridName].destroy();
        }

        this.gridName = this.map.divID + '_' + this.toolname + '_grid';
        this.grid = this.$body.w2grid({
            'name': this.gridName,
            'show': {
                'toolbar': true,
                'toolbarReload': false,
                'toolbarColumns': false,
                'toolbarSearch': false,
                'selectColumn': true
            },
            'toolbar': {
                'items': this.getExportLayerToolbarItems(),
                'onClick': function (event) {
                    var recordIndex = this.grid.getSelection(true).shift();
                    if (recordIndex === undefined) {
                        w2alert(w2utils.lang('Select layer'));
                        return;
                    }

                    this.downloadLayer(this.grid.records[recordIndex].xId, event.item.downloadFormat);
                }.bind(this)
            },
            'multiSelect': false,
            'columns': [
                {
                    'field': 'name',
                    'caption': w2utils.lang('Layer name'),
                    'size': '100%'
                }
            ],
            onSelect: function(event){ var rec = this.grid.get(event.recid);
                this._adjustToolbarItems(rec.formats);
               }.bind(this)
        });

        this.fillExportLayerGrid();
    },

    /**
     * Настроить кнопки тулбара таблицы
     *
     * @method _adjustToolbarItems
     * @param formats {Array} массив строк - фильтр форматов
     * @private
     */
    _adjustToolbarItems:function(formats){
        if (typeof formats === 'undefined'){ return; }
        for (var i =0; i < this.grid.toolbar.items.length; i++){
            var item = this.grid.toolbar.items[i];
            if (item.type !== 'button' || item.downloadFormat == undefined){
                continue;
            }
            if ($.inArray(item.downloadFormat, formats) == -1){
                item.disabled = true;
            }
            else{
                item.disabled = false;
            }
        }
        this.grid.toolbar.refresh();
    },

    /**
     * Заполнить w2grid слоёв данными
     *
     * @method fillExportLayerGrid
     */
    fillExportLayerGrid: function () {
        this.grid.records = this.getExportLayerGridRecords();

        var disabled = false;
        if (this.grid.records.length === 0) {
            disabled = true;
        }
        for (var i in this.grid.toolbar.items) {
            if (this.grid.toolbar.items.hasOwnProperty(i)) {
                this.grid.toolbar.items[i].disabled = disabled;
            }
        }

        this.grid.refresh();
        $(this.grid.box).find('.export-layer-button')
            .css({
                'margin': 0,
                'padding': '4px !important',
                'minWidth': 0
            });
    },

    /**
     * Получить записи для grid слоёв
     * @method getExportLayerGridRecords
     * @return {Array} массив записей
     */
    getExportLayerGridRecords: function () {
        var records = [];
        for (var i = 0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i],
                formats = [];
            if (!layer.options['export']) {
                continue;
            }
            if ($.isArray(layer.options['export'])) {
                if (layer.options['export'].length === 0){
                    layer.options['export'] = undefined;
                    continue;
                }
                for (var j = 0; j < layer.options['export'].length; j++) {     // фильтр форматов для слоя
                    formats.push(layer.options['export'][j].toLowerCase());
                }
            }
            else {                                // параметр "старого" типа
               for (var key in this.formats){
                   formats.push(key);
               }
            }

            if (layer.getType() === "wms" && layer.options['export']) {
                records.push({
                    'recid': (i + 1).toString(),
                    'name': layer.alias,
                    'xId': layer.xId,
                    'formats': formats
                });
            }
        }

        return records;
    },

    /**
     * Получить элементы панели управления для w2grid слоёв.
     *
     * @method getExportLayerToolbarItems
     * @return {Array}
     */
    getExportLayerToolbarItems: function () {
        var iconSpan = '<span class="control-button-exportlayer" style="width: 16px; height: 16px; background-size: contain; vertical-align: inherit;"></span>';
        var items = [];
        items.push({
            'type': 'html',
            'html': '&nbsp;' + w2utils.lang('Select type') + ':&nbsp;'
        });
        for (var format in this.formats) {
            if (this.formats.hasOwnProperty(format)) {
                items.push({
                    'type': 'button',
                    'id': this.gridName + '-' + format,
                    'downloadFormat': format,
                    'caption': iconSpan + '&nbsp;' + w2utils.lang(format.toString().toUpperCase())
                });
            }
        }
        return items;
    },

    /**
     * Скачать слой карты по указанному идентификатору в заданном формате.
     *
     * @method downloadLayer
     * @param {string} layerXid
     * @param {string} format
     */
    downloadLayer: function (layerXid, format) {
        if (!layerXid || !format) {
            throw ('Format and layerXid must be defined.');
        }
        if (!this.formats[format]) {
            throw ('Format is not supported.');
        }
        this.format = format;
        var formatOptions = this.formats[format];

        var layer = this.map.tiles.getLayerByxId(layerXid),
            server = GWTK.Util.getServerUrl(layer.options.url);
        if (layer) {
            var requestUrl = server + '?' +
                'service=wfs&' +
                'restMethod=getFeature&' +
                'objCenter=2&' +
                'semantic=1&' +
                'semanticName=1&' +
                'metric=1&' +
                'mapId=1&' +
                'layers=' + layer.idLayer + '&' +
                'outType=' + formatOptions.outType;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', requestUrl, true);
            xhr.responseType = 'blob';
            xhr.onload = function () {
                var contentType = xhr.getResponseHeader('Content-Type');
                if (contentType.indexOf(formatOptions.contentType) === -1) {
                    this.onerror();
                    return;
                }
                var urlApi = window.URL || window.webkitURL,
                    blob = xhr.response,
                    objectUrl = urlApi.createObjectURL(blob);
                var a = document.createElement("a");
                a.style.display = 'none';
                document.body.appendChild(a);
                a.href = objectUrl;
                a.download = layer.alias + '.' + formatOptions.ext;
                a.click();
                setTimeout(function () {
                    window.URL.revokeObjectURL(objectUrl);
                    a.parentNode.removeChild(a);
                });
            };

            xhr.onerror = function (e) {
                console.log(w2utils.lang('Layers export') + " " + w2utils.lang("Failed to get data") + ' id ' + layerXid);
                w2alert(w2utils.lang("Failed to get data") + ' id ' + layerXid);
            };

            var token = this.map.getToken();
            if (token && layer.options.token) {
                xhr.setRequestHeader(GWTK.AUTH_TOKEN, token);
            }
            if (this.map.authTypeServer(server) || this.map.authTypeExternal(server)){
                xhr.withCredentials = true;
            }
            xhr.send();
        }
        else {
            throw 'Can not find layer with id ' + layerXid;
        }
    },

    /**
     * Установить отслеживание события обновления w2grid слоёв.
     *
     * @method listenExportLayerGridUpdate
     */
    listenExportLayerGridUpdate: function () {
        $(this.map.eventPane).on('layerlistchanged.' + this.toolname, this.fillExportLayerGrid.bind(this));
    },

    /**
     * Деструктор.
     * Освободить ресурсы, отключить обработчики событий.
     *
     * @method destroy
     */
    destroy: function () {
        $(this.map.eventPane).off('layerlistchanged.' + this.toolname);
        $().w2destroy(this.gridName);
        this.$button.remove();
        this.$panel.remove();
    }

};

/**
 * Контрол Начальный экстент
 * Изменяет текущий вид карты в соответствии с начальными 
 * значениями центра и масштаба в параметрах карты
 */
GWTK.protoMapInitExtent = {

    title: "",

    toolname: "mapinitialextent",

    /**
     * Инициализировать
     * @method init
     */
    init: function () {
        this.title = w2utils.lang('Show initial extent');
        this.createButton({ 'class': 'control-button clickable control-button-mapinitial' });
        this.createPanel = GWTK.Util.falseFunction;
        this.initEvents();
    },
    /**
     * Назначение обработчиков событий
     * @method initEvents
     */
    initEvents: function () {

        // нажатие кнопки управления
        this.$button.on('click', function (event) {
            if (!this.map){return;}
            this.map.restoreView();
        }.bind(this));
    },

    /**
     * Деструктор
     * @method destroy
     * освободить ресурсы, отключить обработчики событий
    */
    destroy: function () {
        this.$button.remove();
    }

};