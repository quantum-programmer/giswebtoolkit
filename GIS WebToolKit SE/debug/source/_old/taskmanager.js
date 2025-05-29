/*************************************** Нефедьева О. 06/02/19 *****
 /*************************************** Соколова Т.  17/10/17 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Менеджер задач карты                        *
 *                                                                  *
 *******************************************************************/
/**
 * Класс Менеджер задач карты (задачи - интерактивные компоненты)
 * Конструктор TaskManager
 * @param map {Object}  Компонент карты
 */
if (window.GWTK) {
    
    GWTK.TaskManager = function(map) {
        this._map = map;                                 // Карта
        if (!map) {
            console.log("TaskManager. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        
        this._action = null;                             // текущий обработчик карты
        this._serviceAction = null;                      // сервисный обработчик карты
        this._taskArray = [];                            // открытые задачи
        this._totalShowObjectInfo = true;                // общий признак "выводить информацию об отобранных объектах"
        
        
        this._map.on({ type: 'setaction', target: 'taskmanager', phase: 'before' }, (e) => {
            $(map.eventPane).trigger({ type: 'setaction', action: e.originalEvent.action });
        });
        
        return;
    };
    
    GWTK.TaskManager.prototype =
        {
            /**
             * Установить задачу карты
             * @method setTask
             * @param task {Object} класс задачи
             * @return {Boolean}, true - задача активирована, false - не активирована
             */
            // ===============================================================
            setTask: function(task) {
                
                if (!task) return false;
                if ($.inArray(task, this._taskArray) == -1) {
                    this._taskArray.push(task);
                    task.isActive = true;
                }
                
                return true;
            },
            
            /**
             * Завершить задачу карты
             * @method closeTask
             * @return {Boolean} true/false, true - задача завершена, false - не завершена
             */
            // ===============================================================
            closeTask: function(task) {
                if (this._taskArray.length == 0) {
                    return false;
                }
                var index = $.inArray(task, this._taskArray);
                if (index == -1) {
                    return false;
                }
                var task = this._taskArray[index];
                var canceled = task.cancel();                // прервать задачу
                if (canceled) {
                    if (this._action && this._action.task == task) {
                        this.closeAction();
                        this._action = null;
                    }
                    task.close();
                    this._taskArray.splice(index, 1);
                }
                return canceled;
            },
            
            /**
             * Установить обработчик карты
             * @method setAction
             * @param action {Object} класс обработчика карты
             * @return {Boolean} true/false, true - обработчик установлен, false - не установлен
             * Установленный обработчик становится текущим обработчиком карты
             */
            // ===============================================================
            setAction: function(action) {
                const taskManager = this._map.getTaskManager();
                
                this._newaction = action;
                
                if (taskManager.activateBlockingActionOld(action)) {
                    this._action = action;
                    $(this._map.eventPane).trigger({ type: 'setaction', action });
                }
                this._newaction = null;
                
                return true;
            },
            
            /**
             * Закрыть (удалить) текущий обработчик карты
             * @method closeAction
             * @param action {Object} класс обработчика карты
             * @return {Boolean} true/false, true - обработчик закрыт, false - не закрыт
             */
            // ===============================================================
            closeAction: function() {
                const taskManager = this._map.getTaskManager();
                if (this._action && taskManager.deactivateBlockingActionOld()) {
                    $(this._map.eventPane).trigger({ type: 'closeaction', action: this._action.name, task: this._action.task });
                    this._action = null;
                }
                return true;
            },
            
            canCloseAction: function() {
                if (!this._action) return true;
                var flag = this._action.canClose;
                if (this._action.task) {
                    flag = (flag && this._action.task.canClose());
                }
                return flag;
            },
            
            closeAllTasks: function() {
                if (this._taskArray.length == 0) return;
                do {
                    this.closeTask(this._taskArray[0]);
                }
                while (this._taskArray.length > 0);
            },
            
            /**
             * Установить общий признак вывода информации об объектах карты
             * @method setTotalShowInfoFlag
             * @param flag {boolean} признак вывода информации, false - не выводить
             * @return {boolean} true/false, значение признака вывода информации
             */
            // ===============================================================
            setTotalShowFeatureInfoFlag: function(flag) {
                if (typeof flag !== 'boolean') {
                    return;
                }
                return (this._totalShowObjectInfo = flag);
            },
            
            /**
             * Получить общий признак вывода информации об объектах карты
             * @method getTotalShowInfoFlag
             * @return {boolean} true/false, значение признака вывода информации
             */
            // ===============================================================
            getTotalShowFeatureInfoFlag: function(flag) {
                return this._totalShowObjectInfo;
            }
            
        }
    
}