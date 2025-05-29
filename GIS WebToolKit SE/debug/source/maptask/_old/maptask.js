/********************************* Соколова Т.О.  **** 02/02/17 ****
/********************************* Нефедьева О.А. **** 18/01/17 ****
*                                                                  *
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Класс задачи карты                         *
*                                                                  *
*******************************************************************/
/**
 * Класс Задача карты
 * @class GWTK.MapTask
 * @constructor GWTK.MapTask
 * @param map {Object} объект карты
 */
GWTK.MapTask = function (map) {

    this.map = map;
    this.isActive = false;
    this.isTask = true;
    this.action = null;
    this.serviceAction = null;
    this.canCancel = true;
    this.isCancelled = false;
    this.displaySelectedFeatures = true;
    return;
};

GWTK.MapTask.prototype = {
    /**
     * Инициализация класса
     * @method init
     */
    // ===============================================================
    init: function () {
        return;
    },

    /**
     * Завершить задачу
     * @method cancel
     */
    // ===============================================================
    cancel: function () {
        this.isCancelled = true;
        return this.canCancel;
    },

    /**
     * Сбросить флажки завершения
     * @method clearCancel
     */
    // ===============================================================
    clearCancel: function () {
        this.canCancel = true;
        this.isCancelled = false;
        return;
    },

    /**
     * Проверить возможность завершения 
     * @method canClose
     * @return {Boolean} true - можно завершить, false - нет
     */
    // ===============================================================
    canClose: function () {
        return this.canCancel;
    },

    /**
     * Закрыть задачу  
     * @method close
     * @return {Boolean} true - задача завершена, false - нет
     */
    // ===============================================================
    close: function () {
        if (!this.canCancel) return false;
        this.clearCancel();
        this.isActive = false;
        this.destroy();
        return true;
    },

    /**
      * Создать кнопку управления 
      * @method createToolbarsButton
    */
    // ===============================================================
    createToolbarsButton: function () {
    },

    /**
     * Создать панель управления задачи 
     * @method createPane
    */
    // ===============================================================
    createPane: function () {
    },

    /**
     * Настроить обработку событий задачи 
     * @method initEvents
    */
    // ===============================================================
    initEvents: function () {
    },

    /**
     * Сбросить параметры текущего обработчика в задаче 
     * @method clearAction
    */
    // ===============================================================
    clearAction: function () {
    },

    /**
     * Обработчик ответа сервера (callback-function)
     * @method _onDataLoaded
     * @param response {Object} ответ сервера на запрос
     * @param context {Object} контекст запроса
    */
    // ===============================================================
    _onDataLoaded: function (response, context) {
    },

    /**
     * Повторная настройка
     * @method reset
     * @param options {Object} параметры задачи
    */
    // ===============================================================
    reset: function (options) {
        return;
    },

    /**
     * Освободить ресурсы задачи
     * @method destroy
    */
    // ===============================================================
    destroy: function () {
        return;
    }


};

// ===================================================================
/*
 *  Класс Обработчик карты  ( интерактивный режим задачи или карты )
*/
/**
 * Класс Обработчик карты
 * @class GWTK.MapAction
 * @constructor GWTK.MapAction
 * @param task {Object} объект задачи
 */
GWTK.MapAction = function (task, name) {
    this.name = name;                           // имя 
    this.task = task;                           // задача
    this.canCancel = true;                      // признак "можно прервать"
    this.isService = false;                     // признак "сервисный обработчик"
    this.canSelectObject = false;               // признак "можно выбирать объекты"
    this.showInfoOfSelectedObjects = true;      // признак "выводить информацию об отобранных объектах"
    this.isAction = true;                       // признак обработчика
    if (!this.name) {
        this.name = 'mapaction_' + GWTK.Util.randomInt(10000, 100000);
    }
};

GWTK.MapAction.prototype = {
    /**
     * Инициализация класса
     * @method init
     */
    // ===============================================================
    init: function (base) {
        return;
    },

    /**
     * Настройка класса (подключение обработчиков событий, установка флажков и др.)
     * @method set
     * @param options {Object} параметры обработчика
     */
    // ===============================================================
    set: function (options, base) {
        return;
    },

    /**
     * Сбросить настройки (отключение обработчиков событий, инициализация флажков и др.)
     * @method clear
     */
    // ===============================================================
    clear: function (base) {
        return;
    },

    /**
     * Запросить карту
     * @method getMap
     * @return {Object} 
     */
    // ===============================================================
    getMap: function () {
        if (!this.task) return null;
        return this.task.map;
    },

    canClose: function () {
        return this.canCancel;
    },

    close: function () {
        if (this.canClose()) {
            this.clear();
            return true;
        }
        return;
    },

    showObjectsInfo: function (show) {
        var flag = GWTK.Util.parseBoolean(show);
        if (flag != undefined) {
            this.showInfoOfSelectedObjects = flag;
        }
        return this.showInfoOfSelectedObjects;
    }
};



 
