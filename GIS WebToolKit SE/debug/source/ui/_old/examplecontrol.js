/****************************************************** 26/08/20 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *    Инструмент карты  Получение значения геопокрытия в точке      *
 *                                                                  *
 *******************************************************************/

/**
 * Пример компонента карты 'Получение значения геопокрытия в точке'
 * Компонент получает и отображает в таблице значение высоты точки карты.
 * Получение высоты выполняется через запрос GetCoveragePoint к сервису GIS WebService SE.
 * В качестве матрицы используется описание элемента 'matrix ' в параметрах карты. 
 * Компонент реализован как пользовательский элемент GWTK.UserControl, 
 * имя прототипа protoControlExample.
 * Создание выполняется с помощью api-функции GWTK.mapCreateUserControl:
 * GWTK.mapCreateUserControl('maptoolexample', this, protoControlExample, true);
 * Компонент создает кнопку управления в тулбаре карты. При включении кнопки отображается
 * панель 'Получение значения геопокрытия в точке'. 
 * При клике в карте значение высоты указанной точки выводится в таблице.
 */
var protoControlExample = {
    title: w2utils.lang('Example of maptool'),

    toolname: 'maptoolexample', 

    // параметры кнопки управления
    button_options: {     
        "class": 'control-button control-button-ok clickable'
    },

    // параметры панели управления 
    panel_options: {
        'class': 'map-panel-def exportlayer-panel',
        'class-controlspanel': 'map-panel-def-flex exportlayer-panel-flex',
        'display': 'none',
        'hidable': true,
        'header': true,
        'draggable': true,
        'resizable': true
    },

    // имя таблицы
    gridName: 'coveragepoints_grid',

    /**
     * Инициализация компонента
     * @method init
     */
    init: function () {
        this.title = 'Получение значения геопокрытия в точке';  // заголовок окна
                
        this.createButton();                                    // создать кнопку

        this.createPanel();                                     // создать панель

        this.createPanelBody();                                 // создать рабочую область

        this.initEventListeners();                              // инициализировать обработку событий

        this.initLayerParam();                                  // инициализировать параметры слоя для запросов данных
    },

    /**
     * Инициализация параметров слоя
     * @method initLayerParam
     */
    initLayerParam: function(){
        if ($.isArray(this.map.options.matrix) && this.map.options.matrix.length > 0){
            this.xId = this.map.options.matrix[0].id;
            var url = GWTK.Util.getServerUrl(this.map.options.matrix[0].url);
            var param = GWTK.Util.getParamsFromURL(this.map.options.matrix[0].url.toLowerCase());
            if (url && url.length > 0 && 'layer' in param){
                this.url = url + '?service=wcs&restmethod=getcoveragepoint&crs=EPSG:4326&getgeoheight=1&layer=' + param['layer'] + '&point=';
            }
        }
    },

    /**
     * Инициализация событий
     * @method initEventListeners
     */    
    initEventListeners: function(){
        
        this.initEvents();
        
        this.$panel.on('resize', function (event) {
            w2ui[this.gridName].box.style.height = event.target.clientHeight - 45 + 'px';
            w2ui[this.gridName].box.style.width = event.target.clientWidth - 20 + 'px';
            w2ui[this.gridName].resize();
        }.bind(this));
    },

    /**
     * Обработка нажатия кнопки управления
     * @method _notifyClick
     */    
    _notifyClick: function(){
        var map = this.map;
        if (this.$button.hasClass('control-button-active')) {
            this.createGrid();
            this.map.statusbar.set('Выберите точку на карте');
            setTimeout(function () { map.statusbar.clearText(); }, 3000);
            this.map.on({ type: "click", target: "map", phase: 'before', map: this.map }, this.onMapclick.bind(this));
        }
        else{
            this.map.off({ type: "click", target: "map", phase: 'before', map: this.map }, this.onMapclick);
            this.map.statusbar.clearText();
            w2ui[this.gridName].destroy();
            this.grid = undefined;
        }
    },

    /**
     * Обработка клика в карте
     * @method onMapclick
     * @param event {Object} объект события
     */
    onMapclick: function(event){
        event.stopPropagation();
        
        this.map.statusbar.clearText();
        
        var point = GWTK.DomEvent.getMousePosition(event, this.map.panes.eventPane);
        var coord = this.map.tiles.getLayersPointProjected(point);
        var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
        this.getPointHeight(geo);    
    },

    /**
     * Изменить размер дочерних элементов по размеру панели
     * @method resize
     */
    resize: function () {
        // обновить грид
        if (w2ui[this.gridName])
            w2ui[this.gridName].resize();
    },

    /**
     * Создать рабочее пространство для панели
     * @method createPanelBody
     */
    createPanelBody: function () {
        this.$body = $('<div id="coords__">')
            .css({ height: 180, width: 380 })
            .appendTo(this.$panel);
    },

    /**
     * Создать grid
     * @method createGrid
     */
    createGrid: function () {
        if (this.gridName && w2ui[this.gridName]) {
            w2ui[this.gridName].destroy();
        }
        this.grid = this.$body.w2grid({
            'name': this.gridName,
            'show': {
                'toolbarColumns': true,
            },
            'multiSelect': false,
            'columns': [
                {
                    'field': 'h',
                    'caption': 'Высота (H)',
                    'size': '120px'
                },
                {
                    'field': 'b',
                    'caption': 'Широта (B)',
                    'size': '120px'
                },
                {
                    'field': 'l',
                    'caption': 'Долгота (L)',
                    'size': '120px'
                }
            ],
            records: []
        });

        w2ui[this.gridName].render();
    },

    /**
     * Добавить запись в грид
     * @method addGridRecord
     * @param data {Object}, {'h': число, 'l': число, 'b': число} 
     */
    addGridRecord: function (data) {
        if ($.isEmptyObject(data)){
            return;
        }
        var record = {'recid': this.grid.records.length + 1, 'h': data.h, 'b':  Number(data.b).toFixed(10), l: Number(data.l).toFixed(10)};
        w2ui[this.gridName].add(record);
        w2ui[this.gridName].refresh();
    },

    /**
     * Добавить запись в грид
     * @method addGridRecord
     * @param data {Object}, координаты точки, {'h': число, 'l': число, 'b': число} 
     */
    getPointHeight: function(geo){
        var url = this.url + geo.join(',');
        var setting = {'url': url, 
                       'crossDomain': true,
                       'processData': false, 
                       'type': "GET",
                       'data': '',
                       'outtype': 'json', 
                       'response': 'text/xml'};
        var xhr = $.ajax(setting);
        xhr.then(function(result){
                    var data = JSON.parse(result);
                    var height; 
                    for (var key in data){
                        height = data[key]['value'] + ' ' + data[key]['unit'];
                        break;
                    }
                    this.addGridRecord({'b': geo[0], 'l': geo[1], 'h': height});
                }.bind(this), 

                function (error) {
                    console.log(error)
                }
            );             
                
    },

    /**
     * Деструктор
     * @method destroy
     */
    destroy: function () {
        this.map.off({ type: "click", target: "map", phase: 'before', map: this.map }, this.onMapclick);
        $().w2destroy(this.gridName);
        this.$button.remove();
        this.$panel.remove();
    }

};

