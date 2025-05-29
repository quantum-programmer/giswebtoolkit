/*************************************** Нефедьева О.   09/12/20 ****
 *************************************** Патейчук В.К.  15/04/20 ****
 *************************************** Соколова т.О.  05/04/21 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент "Журнал событий карты"                *
 *                                                                  *
 *******************************************************************/

    GWTK.protoLogOfMapEvents = {
        title: w2utils.lang('Log of Map events'),

        button_options: {
            "class": 'control-button-maplog clickable icon-maplog',
            'parent':'.scale-pane-table'
        },

        panel_options: {
            'class': 'map-panel-def maplog-panel',
            'class-controlspanel': 'map-panel-def-flex maplog-panel-flex',
            'display': 'none',
            'header': true,
            'hidable': true,
            'draggable': true,
            'resizable': true,
            'minimize': true
        },

        protocol: [],                  // массив записей

        maxSize: 25,                   // максимальный размер массива

        key: 'eventProtocol',          // ключ session

    /**
     * Инициализация компонента
     *
     * @method init
     */
    init: function () {
        this.title = w2utils.lang('Log of Map events');

        this.timer = false;

        this.createButton();

        this.createPanel();

        this.initPanel();

        this.initEvents();

        this._restoreProtocol();
    },

    /**
     * Инициализировать панель
     *
     * @method initPanel
     */
    initPanel:function(){
        if (this.panel){
            this.$panel = $(this.panel);
            this.$panel.append('<div id="maplog-content" class="panel-maplog-content"></div>');
        }
    },

    /**
     * Инициализировать события
     *
     * @method initEvents
     */
    initEvents:function(){
        var tool = this;
        if (this.button) {
            $(this.button).on('click', function (event) {
                if ($(tool.panel).is(':visible')){
                    tool.$panel.hide('slow');
                } else {
                    if (tool.protocol.length > 0){
                        tool._refreshPanel();
                        $(tool.panel).show('slow');
                        // развернуть общую панель для компонентов (если используется)
					    tool.map.showControlsPanel();
                    }
                }
            });
        }
    },

    /**
     * Добавить запись события
     *
     * @method addMessage
     * @param param {Object} параметры сообщения, JSON
     *  {
     *      text            : '',      // текст
     *      icon            :'',       // имя изображения в окне, "error"/"warning" или ничего
     *      height          :number,   // высота всплывающего окна, пикселы
     *      width:          :number,   // ширина всплывающего окна, пикселы
     *      top             :number,   // положение окна сверху, пикселы
     *      left            :number,   // положение окна слева, пикселы
     *      classname       :''        // имя css класса окна
     *  }
     * @param display {boolean} признак отображения всплывающего окна, `true` - показать
     */
    addMessage:function(param, display){

        if (typeof param === "undefined"){
            return;
        }
        var options = {};
        if (typeof param === "string"){
            var res = this._insert(param);
            options["text"] = param;
        }
        else if (param.hasOwnProperty('text')){
            var res = this._insert(param.text),
                tool = this;
            options = $.extend({},param);
        }
        if (res){
           this._showTitle();
           if ($(this.panel).is(':visible')){
            this._insertPanelRecord();
           }

           this._saveProtocol();

           if (display) {
              options.duration = false;

              if (this.timer){this._clearTimer();}

              this.timer = setTimeout(function() {
                  tool._clearTimer(); w2popup.close();
                  document.dispatchEvent(new CustomEvent('messageclosed'));
                  }, 2000);

              GWTK.Util.showMessage(options);
           }
        }
    },

    /**
     * Вставить запись в протокол
     *
     * @method _insert
     */
    _insert:function(record){
        if (typeof record === "undefined"){ return false;}

        if (this.protocol.length >= this.maxSize){
            this.protocol.splice(this.protocol.length - 1, 1);
        }

        var currDate = w2utils.formatDateTime((new Date()), 'dd-mm-yyyy|h:m:s');

        this.protocol.splice(0, 0, currDate + ' ' + record);

        return true;
    },

    /**
     * Показать запись во всплывающей подсказке
     *
     * @method _showTitle
     */
    _showTitle:function(){
        if (this.protocol.length === 0){
            this.button.title = '';
        }
        else{
            this.button.title = this.protocol[0];
        }
    },

    /**
     * Обновить протокол в панели
     *
     * @method _refreshPanel
     */
    _refreshPanel:function(){
        var text = '';
        //this.protocol.forEach(str => text += '<div>'+str+'<\div><br>');
        this.protocol.forEach(function(str) {
               text += '<div class="maplog-rec">' + str + '<\div>';
            }
        );
        $(this.panel).find("#maplog-content").html(text);
    },

    /**
     * Вставить запись в протокол в панели
     *
     * @method _insertPanelRecord
     */
    _insertPanelRecord:function(){
        var $parent = $(this.panel).find("#maplog-content");

        $parent.prepend('<div class="maplog-rec">' + this.protocol[0] + '<\div>' );
    },

    /**
     * Очистить таймер
     *
     * @method _clearTimer
     */
    _clearTimer: function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = false;
        }
    },

    /**
     * Сохранить протокол
     *
     * @method _saveProtocol
     */
    _saveProtocol: function(){
        if(this.protocol){
            var key = this.key + this.map.options.id;
            if (this.protocol.length == 0){
                localStorage.removeItem(key);
            }
            else {
                localStorage.setItem(key, JSON.stringify({"count": this.protocol.length, "data": this.protocol}))
            }
        }
    },

    /**
     * Восстановить протокол
     *
     * @method _restoreProtocol
     */
    _restoreProtocol: function(){
        var key = this.key + this.map.options.id;
        if (localStorage && localStorage.getItem(key) !== null){
            try{
                this.protocol = [];
                var values = JSON.parse(localStorage.getItem(key));
                if (values.count){
                    this.protocol = values.data;
                }
                this._showTitle();
            }
            catch(e){
                return;
            }

        }

    }

    };
