/********************************* Нефедьева О.А. **** 20/07/16 ****
********************************** Соколова Т. В. **** 04/04/21 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2016              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*    История редактирования редактора карты ( GWTK.EditorHistory ) *
* Журнал всех операций редактора карты ( GWTK.EditorOperationsLog )*
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    // класс истории операций изменения данных
    GWTK.EditorHistory = function (context) {

        this.toolname = 'editorhistory';
        this.current = -1;  // текущее изменение

        // массив операций объекты history 
        // data - тип данных - ('g' - метрика, 's' - семантика)
        // type - тип операции ( 'insert', 'delete', 'update', 'offset', 'all', 'changedirection' -
        // добавление/вставка, удаление, обновление точки, смещение объекта, изменение всех точек, смена направления)
        // number - номер cтарой/новой (если 'insert') точки (с 0) 
        // offset - смещение в пикселах структура GWTK.Point3D 
        // coord_old - координаты старой точки 
        // coord_new - координаты новой точки 
        // points_old - массив старых точек
        // points_new - массив новых точек
        // семантика
        // semantics - массив изменений семантических характеристик
        // topologyobjectJSON_new - json объектов топологии
        // topologyobjectJSON_old - json объектов топологии
        this.historys = new Array();

        if (context) {
            this.context = context;
        }

    };


    GWTK.EditorHistory.prototype = {

        // добавить изменение
        add: function (type, number, subject, offset, coord_old, coord_new, points_old, points_new, topologyobjectJSON_old, topologyobjectJSON_new, mapobject_old, mapobject_new ) {
            if (!type) return;

            var history = new Array();
            history.data = 'g'; // метрика
            history.type = type;
            history.number = number;
            if (offset)
                history.offset = new GWTK.Point3D(offset.x, offset.y, offset.h);
            if (coord_old)
                history.coord_old = new GWTK.Point3D(coord_old.x, coord_old.y, coord_old.h);
            if (coord_new)
                history.coord_new = new GWTK.Point3D(coord_new.x, coord_new.y, coord_new.h);
            if (subject >= 0)
                history.subject = subject;

            // если обновляются все точки метрики
            if (type == 'all') {
                if (points_old && points_old instanceof GWTK.mapgeometry &&
                    points_new && points_new instanceof GWTK.mapgeometry) {
                    history.points_old = points_old.createcopy();
                    history.points_new = points_new.createcopy();
                }
                else {
                    return;
                }
            }

            // Положить json с объектами топологии
            if (topologyobjectJSON_old)
                history.topologyobjectJSON_old = JSON.parse(JSON.stringify(topologyobjectJSON_old));
            if (topologyobjectJSON_new)
                history.topologyobjectJSON_new = JSON.parse(JSON.stringify(topologyobjectJSON_new));

            this.historys.push(history);
            this.current = this.historys.length - 1;

            // // Добавление в журнал транзакций
            // this.addTransaction(history);
        },

        // type =  'insert', 'delete', 'update'
        // semantics - строка с идентификаторами семантик
        // codes - строка с кодами семантик
        // values_old - строка со старыми значениями
        // values_new - строка с новыми значениями
        addsem: function (type, semantics) {
            if (!type || !semantics || semantics.length == 0)
                return;

            var history = new Array();
            history.number = this.historys.length;
            history.data = 's'; // семантика
            history.type = type;
            history.semantics = new Array();
            for (var i = 0; i < semantics.length; i++)
                history.semantics.push({ id: semantics[i].id, oldvalue: semantics[i].oldvalue, newvalue: semantics[i].newvalue, code: semantics[i].code, changeview: semantics[i].changeview });
            this.historys.push(history);
            this.current = this.historys.length - 1;

            // // Запись в журнал
            // this.addTransaction(history);

        },

        // Добавить изменение типк объекта
        // type = 'update'
        // node_old - строка со старыми значениями
        // node_new - строка с новыми значениями
        addtype: function (type, node_old, node_new) {
            if (!type || !node_old || !node_new)
                return;

            var history = new Array();
            history.number = this.historys.length;
            history.data = 't'; // тип объекта
            history.type = type;
            history.node_old = JSON.parse(JSON.stringify(node_old));
            history.node_new = JSON.parse(JSON.stringify(node_new));
            this.historys.push(history);
            this.current = this.historys.length - 1;
        },

        // Добавить изменение объекта полностью
        // type = 'update'
        // mapobject_old - строка со старыми значениями
        // mapobject_new - строка с новыми значениями
        // node_old - код объкта старый
        // node_new - код объкта новый
        addmapobject: function (type, mapobject_old, mapobject_new, node_old, node_new) {
            if (!type || !mapobject_old || !mapobject_new)
                return;

            var history = new Array();
            history.number = this.historys.length;
            history.data = 'mapobject'; // тип объекта
            history.type = type;
            history.mapobject_old = mapobject_old.clone();
            history.mapobject_new = mapobject_new.clone();
            if (node_old && node_new) {
                history.node_old = JSON.parse(JSON.stringify(node_old));
                history.node_new = JSON.parse(JSON.stringify(node_new));
            }

            this.historys.push(history);
            this.current = this.historys.length - 1;

            // // Запись в журнал
            // this.addTransaction(history);

        },

        /**
         * Добавить изменения для массива объектов
         * @param type
         * @param objects
         */
        addmapobjects:  function (type, objects) {
            if (!type || !objects || objects.length == 0) {
                return;
            }

            var history = new Array();
            history.number = this.historys.length;
            history.data = 'mapobjects'; // тип объекта
            history.type = type;

            history.historyEditObjects = [];

            for (var i = 0; i < objects.length; i++) {
                var data = {
                    mapobject_old: objects[i].mapobject_old.clone(),
                    mapobject_new: objects[i].mapobject_new.clone()
                };
                if (objects[i].node_old && objects[i].node_new) {
                    data.node_old = JSON.parse(JSON.stringify(objects[i].node_old));
                    data.node_new = JSON.parse(JSON.stringify(objects[i].node_new));
                }
                history.historyEditObjects.push(data);
            }
            this.historys.push(history);
            this.current = this.historys.length - 1;

            // // Запись в журнал
            // this.addTransaction(history);

        },

        // очистить все изменения
        // count - сколько изменений удалить с конца
        clear: function (count) {
            if (!count) {
                count = this.historys.length;
            }
            this.historyclear(count);
            this.historys.splice(this.historys.length - count, count);
            this.current -= count;

            // if (!count) {
            //     this.historys.splice(0, this.historys.length);
            //     this.current = -1;
            // }
            // else {
            //     this.historys.splice(this.historys.length - count, count);
            //     this.current -= count;
            // }
        },

        /**
         * Очистить непосредственно данные истории
         * @param count - сколько изменений очисить с конца
         */
        historyclear: function(count){
            if (!count) {
                count = this.historys.length;
            }
            var history;
            for(var i = count - 1; i >=0 ; i--){
                history = this.historys[i];
                switch(this.historys[i].data){
                    case 'mapobject':
                        history.mapobject_old.clear();
                        history.mapobject_new.clear();
                        history.mapobject_old = null;
                        history.mapobject_new = null;
                        history.node_old = null;
                        history.node_new = null;
                        break;
                    case 'mapobjects':
                        var len;
                        if (history.historyEditObjects && (len = history.historyEditObjects.length) > 0) {
                            for (var j = 0; j < len; j++) {
                                history.historyEditObjects[j].mapobject_old.clear();
                                history.historyEditObjects[j].mapobject_new.clear();
                                history.historyEditObjects[j].mapobject_old = null;
                                history.historyEditObjects[j].mapobject_new = null;
                                history.historyEditObjects[j].node_old = null;
                                history.historyEditObjects[j].node_new = null;
                            }
                        }
                        history.historyEditObjects = null;
                        break;
                    case 't':
                        history.node_old = null;
                        history.node_new = null;
                        break;
                    case 'all':
                        history.points_old.clear();
                        history.points_new.clear();
                        history.points_old = null;
                        history.points_new = null;
                        break;
                    case 's':
                        history.semantics = null;
                        break;
                }
            }
        },

        // вперед
        next: function () {
            if (this.historys.length == 0)
                return;

            if (this.current != this.historys.length - 1)
                this.current += 1;

            return this.historys[this.current];
        },

        // назад
        prev: function () {
            if (this.current < 0)
                return;

            var history = this.historys[this.current];
            if (this.current >= 0)
                this.current -= 1;

            return history;
        },

        count: function () {
            return this.historys.length;
        },

        // Есть ли записи по семантике
        issemantics: function () {
            for (var i = 0; i < this.count; i++) {
                if (this.historys[i].data == "s")
                    return true;
            }
            return false;
        },

        // Есть ли записи по метрике
        isgeometry: function () {
            for (var i = 0; i < this.count() ; i++) {
                if (this.historys[i].data == "g")
                    return true;
            }
            return false;
        },


        // Добавление в журнал транзакций
        addTransaction: function(history) {

            if (history && this.context && this.context.transactionsLog) {

                // Если это метрика
                switch (history.data) {
                    case 'g':
                        var mapobject = {
                            "name": "",         // наименование объекта
                            "gid": ""
                        }
                        if (this.context.editobjects && this.context.editobjects.length > 0) {
                            mapobject.name = this.context.editobjects[0].name;
                            mapobject.gid = this.context.editobjects[0].gid;
                        }
                        var nametransaction = '', oldvalue = '', newvalue = '';
                        switch (history.type) {
                            case "delete" :
                                nametransaction = w2utils.lang("Removal of point");
                                break;
                            case "insert" :
                                nametransaction = w2utils.lang("Addition of point");
                                break;
                            case "update" :
                                nametransaction = w2utils.lang("Changing point coordinates");
                                break;
                            case 'changedirection':
                                nametransaction = w2utils.lang("Changing direction");
                                break;
                        }

                        if (nametransaction != '') {
                            if (!history.subject) {
                                nametransaction += ' (' + w2utils.lang("Main contour");
                            }
                            else {
                                nametransaction += ' (' + w2utils.lang("Contour") + ' ' + history.subject;
                            }
                            nametransaction += ', ' + w2utils.lang("Point") + ' ' + (history.number + 1).toString() + ')';

                            oldvalue = (history.coord_old) ? 'B=' + history.coord_old.x + ' L=' + history.coord_old.y : "";
                            newvalue = (history.coord_new) ? 'B=' + history.coord_new.x + ' L=' + history.coord_new.y : "";
                        }

                        this.context.transactionsLog.add(new GWTK.EditorTransactionLog({
                            "mapalias": (this.context.layer && this.context.layer.alias) ? this.context.layer.alias : "",         // алиас карты
                            "regime": this.context.getShortTaskName(this.currentTask),           // режим редактора (Создани, редактирование, удаление, перемещение ...)
                            "mapobject": mapobject,
                            "name": nametransaction, // название транзакции
                            "oldvalue": oldvalue,        // входное состояние
                            "newvalue": newvalue,        // выходное состояние
                            "result": ""           // результат
                        }));
                    break;
                    case 'mapobject':
                        this.context.transactionsLog.add(new GWTK.EditorTransactionLog({
                            "mapalias": this.context.layer.alias,         // алиас карты
                            "regime": this.context.getShortTaskName(this.context.currentTask),           // режим редактора (Создани, редактирование, удаление, перемещение ...)
                            // "mapobject":{
                            //     "name": "",         // наименование объекта
                            //     "gid": ""           // Идентификатор объекта
                            // },
                            "name": w2utils.lang("Changing map object type"),             // название транзакции
                            "oldvalue": history.mapobject_old.name,
                            "newvalue": history.mapobject_new.name,
                            "result" : ""           // результат
                        }));
                        break;
                    case 'mapobjects':
                        // Запись в журнал
                        this.context.transactionsLog.add(new GWTK.EditorTransactionLog({
                            "mapalias": this.context.layer.alias,         // алиас карты
                            "regime": this.context.getShortTaskName(this.context.currentTask),           // режим редактора (Создани, редактирование, удаление, перемещение ...)
                            // "mapobject":{
                            //     "name": "",         // наименование объекта
                            //     "gid": ""           // Идентификатор объекта
                            // },
                            "name": w2utils.lang("Changing map objects type"),             // название транзакции
                            //"oldvalue": history.mapobject_old.mame,
                            "newvalue": history.historyEditObjects[0].node_new.text,
                            "result" : ""           // результат
                        }));
                        break;
                    case 's':
                        // Запись в журнал
                        if (history.semantics && history.semantics.length > 0) {
                            this.context.transactionsLog.add(new GWTK.EditorTransactionLog({
                                "mapalias": this.context.layer.alias,         // алиас карты
                                "regime": this.context.getShortTaskName(this.context.currentTask),           // режим редактора (Создани, редактирование, удаление, перемещение ...)
                                // "mapobject":{
                                //     "name": "",         // наименование объекта
                                //     "gid": ""           // Идентификатор объекта
                                // },
                                "name": w2utils.lang("Changing map object attributes"),             // название транзакции
                                // "oldvalue": semantics[0].oldvalue,
                                "newvalue": history.semantics[0].newvalue + ' ( ' + w2utils.lang("Code") + ' ' + history.semantics[0].code + ' )',
                                "result": ""           // результат
                            }));
                        }
                        break;

                }
            }

        }

};


    // класс журнала операций редактора карпты

    GWTK.EditorTransactionLog = function(options) {

        this.options = {
            "mapalias": "",         // алиас карты
            "regime": "",           // режим редактора (Создани, редактирование, удаление, перемещение ...)
            "mapobject": {
                "name": "",         // наименование объекта
                "gid": ""           // Идентификатор объекта
            },
            "name": "",             // название транзакции
            "oldvalue": "",        // входное состояние
            "newvalue": "",        // выходное состояние
            "result": ""           // результат
        };
        if (options) {
            $.extend(this.options, options);
        }
    };


    GWTK.EditorTransactionsLog = function (map, context) {

        if (!map || map instanceof GWTK.Map === false) {
            console.log('GWTK.EditorTransactionsLog:' + w2utils.lang("Not defined a required parameter") + " map.");
            return false;
        }
        this.map = map;
        this.context = context;
        this.transactions = new Array();  // массив структур GWTK.EditorTransactionLog
        this.transactionsString = new Array();
        this.toolname = 'editoroperationslog';
    };

    GWTK.EditorTransactionsLog.prototype = {

        add: function(transaction){

            try {
                if (this.context && this.context.lock) {
                    $(document).on('messageclosed', GWTK.Util.bind(function () {
                        this.context.lock();
                    },this));
                    this.context.lock(true);
                }

                GWTK.mapWriteProtocolMessage(this.map, {
                    "text": this.transactionToString(transaction.options), // текст сообщения
                    "display": true, // показать всплывающее окно,
                    "icon": "warning", // имя изображения в окне, "error"/"warning" или ничего}
                    "height": 100,
                    "width": 400,
                    "top": 10
                    // "duration":2000
                });
            } catch (e) {
                // console.log(e);
                // console.log('GWTK.mapWriteProtocolMessage:  ', e);
            }

        },

        transactionToString: function(transaction){
            var res = '';
            if (transaction) {
                //var data = GWTK.MapEditorUtil.getDateAndTimeFormat(new Date());
                var data = ''; //GWTK.MapEditorUtil.getTimeFormat(new Date());
                res =  data;

                if (transaction.name) {
                    res += ' - ' + transaction.name + '.';
                }

                if (transaction.oldvalue) {
                    res += ' ' + w2utils.lang("Old meaning") + ': '+ transaction.oldvalue + '.';
                }

                if (transaction.newvalue) {
                    res += ' ' + w2utils.lang("New meaning") + ': '+ transaction.newvalue + '.';
                }

                // ---------

                if (transaction.mapalias) {
                    res += ' ' + transaction.mapalias + '.';
                }

                if (transaction.regime){
                    res += ' ' + transaction.regime + '.';
                }

                if (transaction.mapobject && transaction.mapobject.name && transaction.mapobject.gid) {
                    res += ' ' + w2utils.lang("Object of map") + ' - ' + transaction.mapobject.name + '(' + transaction.mapobject.gid + ').';
                }

                // if (transaction.name) {
                //     res += ' ' + transaction.name + '.';
                // }
                //
                // if (transaction.oldvalue) {
                //     res += ' ' + w2utils.lang("Old meaning") + ' = '+ transaction.oldvalue + '.';
                // }
                //
                // if (transaction.newvalue) {
                //     res += ' ' + w2utils.lang("New meaning") + ' = '+ transaction.newvalue + '.';
                // }

                if (transaction.result) {
                    res += ' ' + transaction.result + '.';
                }
            }
            return res;
        }
    };
}
    
