/************************************** Патейчук В.К.  20/02/20 ****
*************************************** Нефедьева О.А. 11/12/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2020              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*              Класс Пользовательский элемент управления           *
*                                                                  *
*******************************************************************/
/**
 * Класс Пользовательский элемент управления
 * @class GWTK.UserControl
 * @constructor GWTK.UserControl
 * @param name {String} уникальное имя контрола, ОБЯЗАТЕЛЬНЫЙ ПАРАМЕТР
 * @param map {Object} объект карты
 * @param options {Object} объект параметров, методы прототипа, параметры кнопки и панели
 * @param apply {Boolean} признак инициализации, `true` - выполнить инициализацию после создания,
 *                                               `false` - только создать
 */
if (window.GWTK) {

    GWTK.UserControl = function (name, map, options, apply) {
        this.toolname = name;                                // уникальное имя в GWTK
        this.map = map;                                      // карта
        this.title = '';                                     // Название компонента
        if (this.map) {
            this.mapDomElements = this.map.getPanels();
        }
        this.button;                                         // кнопка управления
        this.panel;                                          // панель управления
        this.header;                                         // заголовок панели управления

        if (options && !$.isEmptyObject(options)) {          // параметры, описание прототипа
            if ('error' in options) {
                delete options['error'];
            }
            $.extend(true, this, options);                   // добавить методы и свойства
        }

        this._error = this._validate();                      // проверить валидность

        if ($.type(apply) === "boolean") {                   // если установлен признак apply, инициализировать
            if (apply && !this.error()) {
                this.locale();
                this.init();
                if (this.map) {
                    var index = this.map.getMapTool(name, true);
                    if (index != null) {
                        this.map.maptools.splice(index, 1);
                        this.map.maptools.push(this);
                    }
                }
            }
        }
    };

    /**
     * Деструктор
     * @method destroy
     * освободить ресурсы, отключить обработчики событий, ОБЯЗАТЕЛЬНАЯ ФУНКЦИЯ
    */
    GWTK.UserControl.prototype.destroy = function () {
    };

    /**
     * Инициализировать
     * @method init, ОБЯЗАТЕЛЬНАЯ ФУНКЦИЯ
    */
    GWTK.UserControl.prototype.init = function () {
        // Init control here...
    };

    /**
     * Имя элемента управления
     * @method name
     * @return {String} имя элемента управления
    */
    GWTK.UserControl.prototype.name = function () {
        return this.toolname;
    };

    /**
     * Признак наличия ошибки
     * @method error
     * @return {Boolean} `true` - ошибка
    */
    GWTK.UserControl.prototype.error = function () {
        return this._error;
    };

    /**
     * Проверить обязательные свойства
     * @method _validate
     * @return {Boolean} признак ошибки, `true` - наличие ошибки.
     * При отсутствии в прототипе функций `destroy` или `init`,
     * не установленном имени возвращает `true`
    */
    GWTK.UserControl.prototype._validate = function () {

        var _error = false;
        if (typeof this.map === 'undefined') {
            console.log("GWTK.UserControl Warning. " + w2utils.lang("Not defined a required parameter") + " map.");
        }
        if (typeof this.toolname === 'undefined' || this.toolname.length == 0) {
            _error = true;
            console.log("GWTK.UserControl. " + w2utils.lang("Not defined a required parameter") + " name.");
        }
        if (!$.isFunction(this.init) || !$.isFunction(this.destroy)) {
            _error = true;
            console.log("GWTK.UserControl. " + w2utils.lang("Not defined a required functions") + " destroy or init");
        }
        return _error;
    };

    /**
     * Получить панель карты
     * @method getMapPanel
     * @return {Object} HTMLElement, основная панель карты
    */
    GWTK.UserControl.prototype.getMapPanel = function () {
        if (this.mapDomElements && 'map' in this.mapDomElements) {
            return this.mapDomElements['map'];
        }
        return;
    };

    /**
     * Получить панель событий карты
     * @method getMapEventPanel
     * @return {Object} HTMLElement, панель событий карты
    */
    GWTK.UserControl.prototype.getMapEventPanel = function () {
        if (this.mapDomElements && 'event' in this.mapDomElements) {
            return this.mapDomElements['event'];
        }
        return;
    };

    /**
     * Получить панель тулбара карты
     * @method getMapToolbarPanel
     * @return {Object} HTMLElement, панель тулбара карты
     */
    GWTK.UserControl.prototype.getMapToolbarPanel = function () {
        if (this.mapDomElements && 'toolbar' in this.mapDomElements) {
            return this.mapDomElements['toolbar'];
        }
        return;
    };

    /**
     * Создать кнопку управления
     * @method createButton
     * @param options {Object}, JSON, настройки кнопки:
     *        'class' {String}, имена css-стилей кнопки управления,
     *        'id'    {String}, идентификатор кнопки управления,
     *        'parent' {Object/String}, родительский элемент/селектор родительского элемента
     *        'notifyclick' {Boolean} `true` создавать триггер при клике на кнопку
     * @return {Object} HTMLElement кнопки управления.
     */
    GWTK.UserControl.prototype.createButton = function (options) {

        var options_default = { 'class': 'control-button clickable', 'id': 'panel_button_' + this.toolname };

        if (typeof options === "undefined") {
            if (!this.button_options) {
                this.button_options = options_default;
            }
        }
        else {
            this.button_options = options;
        }

        if (!this.map) return;

        if (!this.button_options.hasOwnProperty('parent')) {
            this.button_options['parent'] = this.getMapToolbarPanel();
        }
        else {
            if (typeof this.button_options['parent'] === 'string') {
                var obj = $(this.button_options['parent']);
                if (obj.length === 0){
                    this.button_options['parent'] = this.getMapToolbarPanel();
                }
                else {
                    this.button_options['parent'] = obj[0];
                }
            }
        }
        if (!this.button_options.hasOwnProperty('id')) {
            this.button_options['id'] = 'panel_button_' + this.toolname;
        }
        if (typeof this.button_options.notifyclick === 'undefined'){
            this.button_options.notifyclick = false;
        }

        this.button = GWTK.DomUtil.create('div', this.button_options['class'], this.button_options['parent']);
        this.button.id = this.button_options.id;
        this.button.title = this.title;
        this.button.toolname = this.toolname;
        this.$button = $(this.button);

        return this.button;
    };

    /**
     * Создать панель управления
     * @method createPanel
     * @param options  {Object}, JSON, настройки панели:
     *        'class'  {String}, имена css-стилей панели управления,
     *        'id'     {String}, идентификатор панели управления,
     *        'parent' {Object/String}, родительский элемент/селектор родительского элемента
     *        'display'{String} стилевое свойство отображения панели в документе
     *        'header' {Boolean} наличие заголовка, `true` - панель имеет заголовок
     *        'hidable'{Boolean} скрываемая панель, `true` - показать по нажатию кнопки
     *        'draggable' {Boolean} возможность перемещать панель
     *        'resizable' {Boolean} возможность изменять размеры панели
     *        'minimize' {Boolean} возможность сворачивать/восстанавливать панель
     * @return {Object} HTMLElement, панель управления
     */
    GWTK.UserControl.prototype.createPanel = function (options) {

        if (typeof options === "undefined") {
            if (!this.panel_options) {
                this.panel_options = { 'class': 'map-panel-def map-panel-def-task',
                                       'class-controlspanel': 'map-panel-def-flex',
                                       'id': this.map.divID + '_' + this.toolname + 'Pane',
                                       'display': 'none',
                                       'header': true,
                                       'hidable': true
                                    };
            }
        }
        else {
            this.panel_options = options;
        }

        if (!this.map) return;

        // контейнер для панели
        if (!this.panel_options.hasOwnProperty('parent')) {
            this.panel_options['parent'] = this.getMapPanel();
        }
        if (typeof this.panel_options['parent'] === 'string') {
            var obj = $(this.panel_options['parent']);
            if (obj.length === 0) {
                this.panel_options['parent'] = this.getMapPanel();
            }
            else {
                this.panel_options['parent'] = obj[0];
            }
        }

        // возможность скрытия панели
        if (!this.panel_options.hasOwnProperty('hidable')) {
            this.panel_options['hidable'] = true;
        }

        // если указана боковая панель контролов и создается не компонет "Меню"
        if ((this.map.options.controlspanel) && (this.toolname != 'mapmenu') && (this.panel_options['class'].indexOf('user-control-3d') === -1)) {
            // если стили не указаны, то установить умалчиваемые
            if (!this.panel_options['class-controlspanel'])
                this.panel_options['class-controlspanel'] = 'map-panel-def-flex';
            // заменить стили
            this.panel_options['class'] = this.panel_options['class-controlspanel'];
            // заменить родительский контейнер (только если это карта)
            if (this.panel_options['parent'] == this.getMapPanel())
                this.panel_options['parent'] = this.map.mapControls;
        }

        this.panel = GWTK.DomUtil.create('div', this.panel_options['class'], this.panel_options['parent']);
        this.panel.id = this.panel_options['id'] ? this.panel_options['id'] : this.map.divID + '_' + this.toolname + 'Pane';
        this.$panel = $(this.panel);
        if ('display' in this.panel_options) {
            this.$panel.css('display', this.panel_options['display']);
        }

        if ('header' in this.panel_options && this.panel_options['header']) {
            this.createPanelHeader();
        }

        var drag = false, resize = false;

        if ('draggable' in this.panel_options ) {
            // если не указана панель для компонентов, то доступно перетаскивание
			if(!this.map.options.controlspanel) {
                drag = this.panel_options['draggable'];
            }
        }
        if ('resizable' in this.panel_options) {
            resize = this.panel_options['resizable'];
        }
        if (drag || resize) {
            GWTK.panelUI({ $element: this.$panel, draggable: drag, resizable: resize });
        }

        return;
    };

    /**
     * Настроить обработчики событий
     * @method initEvents
     */
    GWTK.UserControl.prototype.initEvents = function () {
        var tool = this;
        if (this.$button) {
            this.$button.on('click', function (event) {
                if (tool.$button.hasClass('control-button-active')) {
                    tool.$button.removeClass('control-button-active');
                    if (tool.$panel && tool.panel_options.hidable) {
                        tool.$panel.hide('slow');
                    }
                } else {
                    tool.$button.addClass('control-button-active');
                    if (tool.$panel) {
                        tool.$panel.show('slow');
                    }
                }
                tool._notifyClick();
            });
        }

        // обработка изменений размера панели контролов
		$(this.map.eventPane).on('resizecontrolspanel.' + this.toolname, function (event) {
            console.log(event);
			// изменить размеры своей панели
			this.resize();
        }.bind(this));

        // Add more event handlers here...
    };

    /**
	 * Изменить размер дочерних элементов по размеру панели
     * @method resize
	 */
    GWTK.UserControl.prototype.resize = function () {
        // Resize control here...
    };

    /**
     * Уведомить о нажатии кнопки управления
     * @method _notifyClick
     * триггер выдается при включенном поле `notifyclick` в параметрах кнопки
     */
    GWTK.UserControl.prototype._notifyClick = function () {
        if (!this.button_options || !this.button_options.notifyclick) {
            return;
        }
        if (this.button) {
            $(this.map.eventPane).trigger({
                'type': 'buttonclick',
                'id': this.button.id, 'active': this.$button.hasClass('control-button-active'),
                'toolname': this.toolname
            });
        }
    };

    /**
     * Обработчик закрытия панели управления
     * @method onClosePanel
     */
    GWTK.UserControl.prototype.onClosePanel = function (event) {
        if (this.$button) { this.$button.removeClass('control-button-active'); }
        this.$panel.hide();
        return;
    };

    /**
     * Создать заголовок панели управления
     * @method createPanelHeader
     * @return {Element} div, контейнер заголовка
     */
    GWTK.UserControl.prototype.createPanelHeader = function () {
        if (!this.panel) return;

        var that = this,
            minimize = this.panel_options.minimize;

        if (typeof minimize == "undefined" || minimize !== true) {
            minimize = false;
        }

        this.header = GWTK.Util.createHeaderForComponent({
            map: this.map,
            parent: this.panel,
            name: this.title,
            callback: function (e) { that.onClosePanel(e); },
            context: this.toolname,
            minimizePanel: minimize ? this.$panel : false
        });

        this.$header = $(this.header);

        return this.header;
    };

    /**
     * Подключить файл стилей css
     * @method appendCss
     * @param source {String} путь к файлу стилей css
     * @param filename {String} имя файл стилей css
     */
    GWTK.UserControl.prototype.appendCss = function (source, filename) {
        if (typeof filename == 'undefined' || filename.length == 0 || typeof source == 'undefined') {
            return;
        }
        var $links = $('head').find('link'),
            href = '/' + filename,
            not = true;
        $links.each(function (index) {
            if (this.href.indexOf(href) !== -1) {
                not = false;
            }
        });
        if (!not) {
            return;
        }
        $('head').append($('<link rel="stylesheet" href="' + source + filename + '" type="text/css" />'));
    };

    /**
     * Локализовать
     * @method locale
     */
    GWTK.UserControl.prototype.locale = function () {
        var local = 'en-us';
        if (this.map && this.map.options && this.map.options.locale){
            local = this.map.options.locale.toLowerCase();
        }
        if (w2utils.settings.locale.toLowerCase() !== local){
            if (this.map.options.localepath){
                w2utils.locale(this.map.options.localepath);    
            }
            else{
                w2utils.locale('./locale/' + local + '.json');
            }
        }        
    }

    GWTK.usercontrol = function (name, map, options, apply) {
        return new GWTK.UserControl(name, map, options, apply);
    };
}
