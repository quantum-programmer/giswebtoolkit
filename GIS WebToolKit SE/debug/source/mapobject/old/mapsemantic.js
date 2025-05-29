/********************************** Соколова Т.О.  **** 13/04/21 ***
*********************************** Нефедьева О.   **** 16/05/17 ***
*                                                                  *
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2018              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                       Семантика объекта слоя                     *
*                                                                  *
*******************************************************************/
if (window.GWTK) {

    /*  semantics - массив семантических характеристик
    GWTK.rscsemantic = {
    "code":"",
    "type":"",
    "reply":"",
    "enable":"",
    "service":"",
    "name":"",
    "unit":"",
    "minimum":"",
    "defaultvalue":"",
    "maximum":"",
    "size":"",
    "decimal":"",
    "shortname":"",
    "value":"",
    "image": "",
    "textvalue":""
    "readonly":""  // Служебное поле для служебных семантик, заполняется в классе
}*/

    GWTK.mapsemantic = function (mapobject, semantics) {
        this.toolname = 'mapsemantic';

        // Служебные семантики, не подлежащие редактированию (maptype.h // СЛУЖЕБНЫЕ СЕМАНТИКИ НЕ РЕДАКТИРУЮТСЯ !)
        this.readonlyCode = [
            32798, 32799, 32800,
            32850, 32851, 32852, 32853, 32854, 32855
        ];

        // Переменные класса
        this.mapobject = mapobject;     // объект карты
        this.semantics = new Array();
        this.errors = new GWTK.Log();

        if (semantics)
            this.setsemantics(semantics);

        // Ссылка на семантику объекта
        if (mapobject && mapobject.semantic)
            mapobject.semantic = this;

        this.initialize();
        return this;
    };

    GWTK.mapsemantic.prototype = {

        initialize: function () {
            return this;
        },

        // Загрузим семантику из json
        loadJSON: function (properties) {
            if (!properties) return;

            // Сбросим существующие семантики
            this.clear();

            // Для локальных слоев возьмем название семантики из классификатора
            var layer;
            if (this.mapobject && this.mapobject.map && this.mapobject.map.tiles) {
                layer = this.mapobject.map.tiles.getLayerByGmlId(this.mapobject.gid);
                if (layer && layer instanceof GWTK.graphicLayer && this.mapobject.code) {
                    // this.semanticsForObjects = layer.classifier.getsemanticsByCode(this.mapobject.code);
                    layer.classifier.getsemanticsByCode(this.mapobject.code, GWTK.Util.bind(
                        function(sem){
                            this.semanticsForObjects = sem;
                        }
                    ));

                }
            }

            // Найдем отдельно проперти для семантики
            var key = "semantics";
            if (properties[key]) {
                var semantics = properties[key], len = semantics.length;
                for (var i = 0; i < len; i++) {
                    var sem = {};
                    sem.shortname = semantics[i]["key"];
                    sem.value = sem.textvalue = semantics[i]["value"];
                    sem.name = semantics[i]["name"];
                    this.semantics.push(sem);
                }
            }
            // Найдем подпись
            key = "title";
            if (properties[key]){
                this.mapobject.geometry.setText(properties[key]);
                this.mapobject.spatialposition = key;
            }

            // Если семантики появились, то уходим
            if (this.semantics.length > 0) {
                return;
            }

            // Если ничего не нашли, то по старой схеме
            for (key in properties) {
                if (key == "id" || key == "mapid" || key == "schema" || key == "code" || key == "key" || key == "name"
                    || key == "objectcenterx" || key == "objectcentery" || key == "area" || key == "perimeter" ||
                    key == "objectfirstpointx" || key == "objectfirstpointy"
                    || key == "layer" || key == "layerid"
                    || key == "objecttype")  // код стиял рисования у графического слоя
                    continue;


                var sem = {};
                sem.shortname = key;
                sem.value = sem.textvalue = properties[key];
                if (this.semanticsForObjects) {
                    var find = this.semanticsForObjects.find(function (element, index, array) {
                        if (element.shortname == key) {
                            return element;
                        }
                    });
                    if (find){
                        sem.name = find.name;
                    }
                }
                this.semantics.push(sem);
            }
        },

        // Сохраним семантику в json
        saveJSON: function (properties_semantics) {
            var count = this.count();
            if (count == 0) return;
            var textvalue = '';
            for (var i = 0; i < count; i++) {
                if (!this.validate(this.semantics[i]) && this.semantics[i].textvalue == '')
                    continue;
                textvalue = (this.semantics[i].type == '16') ? this.semantics[i].value : this.semantics[i].textvalue;
                if (textvalue && textvalue != '') {
                    // Заменить двойные кавычки на однинарные ( " на ')
                    textvalue = textvalue.toString().replace(new RegExp("\"", "g"), "\'");
                    properties_semantics.push(this.semantics[i]);
                    // properties[this.semantics[i].shortname] = textvalue;
                }
            }
        },


        // проверка семантики на валидность
        validate: function (semantic) {
            if (!semantic) return false;
            var textvalue = (semantic.type == '16') ? semantic.value : semantic.textvalue,
                required = (semantic.enable) ? semantic.enable.toString() : "0";
            if ((required == '3' || required == '2') && (!textvalue || textvalue == '')) { // Обязательная и не заполнена
                this.errors.add({ "classname": "GWTK.mapsemantic", "funcname": "validate", "type": "required", "message": w2utils.lang("Object semantics, there is no binding value") + ": " + semantic.name });
                if (!semantic.type) semantic.type = '0';
                if (semantic.type.toString() == '0') { // Если текст
                    semantic.textvalue = semantic.value = w2utils.lang("Text");
                }
                return false;
            }

            return true;
        },

        // проверка всех семантик на валидность
        validatesemantics: function (semantics) {
            this.errors = new GWTK.Log();
            var ret = true;
            if (!semantics) return ret;
            for (var i = 0; i < semantics.length; i++) {
                if (!this.validate(semantics[i]) && semantics[i].textvalue == '')
                    ret = false;
            }
            return ret;
        },

        // назначить семантики на объект
        // semantics - список семантик
        setsemantics: function (semantics) {
            if (!semantics) return;
            var find = false, _that = this;

            // Найдем и пометим семантики, которые можно отнести к служебным
            for (var i = 0; i < this.semantics.length; i++) {
                find = semantics.find(function (element, index, array) {
                    if (_that.semantics[i].shortname == semantics[index].shortname) {
                        return element;
                    }
                });
                if (!find) {
                    // Отметим семантику, как нередактируемую (служебная + нередактируемая)
                    if (this.isReadOnly(this.semantics[i]))
                        this.semantics[i].readonly = 1;
                }
            }

            // Найдем и пометим семантики, которые можно отнести к служебным, не подлежащим редактированию
            for (var i = 0; i < semantics.length; i++) {
                if (this.isReadOnly(semantics[i]))
                   semantics[i].readonly = 1;
            }

           this.clear();

           for (var i = 0; i < semantics.length; i++) {
               this._addsemantic(semantics[i], true);
            }
        },

        // назначить/обновить сенантики на объект
        // semantics - список семантик
        updatesemantics: function (semantics) {
            if (!semantics) return;
            var _that = this, reply = [];

            // Удалим повторяющиеся семантики
            for(var i = this.semantics.length - 1; i >= 0; i--){
                if (this.semantics[i].reply && this.semantics[i].reply.toString() == '1') {
                    this.semantics.splice(i, 1);
                }
            }

            for (var i = 0; i < semantics.length; i++) {
                if (!semantics[i]) continue;
                var sem = {};
                sem.code = semantics[i].code;
                sem.type = semantics[i].type;
                sem.reply = semantics[i].reply;
                sem.enable = semantics[i].enable;
                sem.service = semantics[i].service;
                sem.name = semantics[i].name;
                sem.unit = semantics[i].unit;
                sem.defaultvalue = semantics[i].defaultvalue;
                sem.minimum = semantics[i].minimum;

                // Проверка на корректность (w2ui некорректно работает, циклит)
                var minimum = parseFloat(semantics[i].minimum);
                var maximum = parseFloat(semantics[i].maximum);
                if (maximum < minimum) {
                    if (maximum < 0 && minimum < 0 || maximum > 0 && minimum > 0)
                        sem.maximum = semantics[i].minimum;
                    else {
                        if (maximum < 0) //   Заглушка, почему-то АП сервис возвращает отрицательное значение
                            sem.maximum = Math.abs(maximum).toString();
                    }
                }
                else
                    sem.maximum = semantics[i].maximum;

                sem.size = semantics[i].size;
                sem.decimal = semantics[i].decimal;
                sem.shortname = semantics[i].shortname;
                sem.value = sem.textvalue = semantics[i].value;
                sem.image = semantics[i].image;
                if (semantics[i].textvalue)
                    sem.textvalue = semantics[i].textvalue.toString().replace(new RegExp("\"", "g"), "\'");
                this.validate(sem);

                // найти и удалить существующую семантику
                this.ischange = false;

                this.semantics.find(function (element, index, array) {
                    if (sem.shortname == _that.semantics[index].shortname &&
                        (!_that.semantics[index].reply || _that.semantics[index].reply && _that.semantics[index].reply.toString() != '1')) {
                        _that.ischange = true;
                        _that.semantics.splice(index, 1, sem);
                    }
                });

                // Не нашли, то добавим
                if (!this.ischange)
                    this.semantics.push(sem);
                this.ischange = false;
            }
        },

        clear: function () {
            if (this.semantics) {
                // Служебные семантики не удаляем
                for (var i = this.semantics.length - 1; i >= 0; i--)
                    if (!this.semantics[i].readonly)
                        this.semantics.splice(i, 1);
                //this.semantics.splice(0, this.semantics.length);
            }
            this.errors = new GWTK.Log();
        },

        count: function () {
            return this.semantics.length;
        },

        remove: function (key) {
            for (var i = this.count() - 1; i >= 0; i--) {
                var idx = GWTK.MapEditorUtil.find(this.semantics, function (element, index, array) {
                    if (element.shortname == key)
                        return index + 1;
                });
                if (idx) {
                    this.semantics.splice(idx - 1, 1);
                    i--;
                }
            }
        },

        // запрос семантики в виде строки для wfs запроса
        semanticsToXmlString: function () {
            this.texttitle = '';
            var bsd = "bsd";
            if (this.mapobject && this.mapobject.rscschema) // если есть схема  ЗАТЫЧКА
                bsd = this.mapobject.rscschema;

            var count = this.count();
            if (count == 0) return "";
            var strxml = "", textvalue = "", texttitle = '';
            for (var i = 0; i < count; i++) {
                if (this.semantics[i].code == '9')
                    this.texttitle = this.semantics[i].textvalue;
                textvalue = this.semantics[i].textvalue;
                if (textvalue != null && textvalue != undefined && textvalue != "") {
                    textvalue = textvalue.toString().replace(new RegExp("\"", "g"), "\'").replace(new RegExp("<", "g"), "&lt;").replace(new RegExp(">", "g"), "&gt;").replace(new RegExp("&", "g"), "&amp;");
                    strxml += "<" + bsd + ":" + this.semantics[i].shortname + ">" + textvalue + "</" + bsd + ":" + this.semantics[i].shortname + ">";
                }
            }

            return strxml;
        },

        /**
          * Запрос/назначение семантики по ключу
          * @method value
          * @param key {String} ключ семантики
          * @param semantic {Object GWTK.rscsemantic} объект семантики для назначения
          * @param checkkey {Bool} флаг проверки ключа на наличие его в схеме слоя
          * (checkkey = true работает при условии предварительного запроса легенды классификатора слоя 
          *  функцией getlegend() класса GWTK.classifier)       
          * @return  {Object GWTK.rscsemantic} объект семантики или null:
          *  - при отсутствии семантики в режиме "запросить" возвращает объект
          *  - при отсутствии семантики в режиме "назначить" с флагом checkkey=true возвращает null
          *
        */
         // ===============================================================
        value: function (key, semantic, checkkey) {
            var sem = null;
             
            var count = this.count();
            if (count == 0) return sem;
            for (var i = 0; i < count; i++) {
                if (this.semantics[i].shortname == key) {
                    if (semantic) 
                        this.semantics.splice(i, 1, semantic);
                    sem = this.semantics[i];
                    break;
                }
            }

            // если надо установить семантику, но ее нет в списке, то добавить
            if (!sem) {
                if (checkkey) {
                    if (!this.semanticsForObjects) {
                        this.setSemanticsFromClassifier();
                    }
                    if (this.semanticsForObjects) {
                        var find = this.semanticsForObjects.find(function (element, index, array) {
                            if (element.shortname == key) {
                                return element;
                            }
                        });
                        if (!find) { // Такой код семантики не предусмотрен для объекта
                           return null;
                        }
                        sem = find;
                    }
                }

                if (!sem) {
                    sem = {
                        "code": "",
                        "type": "",
                        "reply": "",
                        "enable": "",
                        "service": "",
                        "name": "",
                        "unit": "",
                        "minimum": "",
                        "defaultvalue": "",
                        "maximum": "",
                        "size": "",
                        "decimal": "",
                        "shortname": key,
                        "value": "",
                        "image": "",
                        "textvalue": ""
                    };
                }
                if (semantic) {
                    if (this._addsemantic(semantic))
                        sem = this.semantics[this.semantics.length - 1];
                }
            }

            return sem;
        },

        // установить класс соотношения семантик из классификатора
        setSemanticsFromClassifier: function(){
            if (!this.semanticsForObjects) {
                if (this.mapobject) {
                    var layer = this.mapobject.map.tiles.getLayerByxId(this.mapobject.maplayerid);
                    if (layer && this.mapobject.code) {
                        var legend = layer.classifier.getlegend();
                        if (legend) {
                            // this.semanticsForObjects = layer.classifier.getsemanticsByCode(this.mapobject.code);, GWTK.Util.bind(
                            layer.classifier.getsemanticsByCode(this.mapobject.code, GWTK.Util.bind(
                                function(sem){
                                    this.semanticsForObjects = sem;
                                }
                            ));
                        }
                    }
                }
            }
        },

        createcopy: function (semantic) {
            semantic = (semantic && semantic instanceof GWTK.mapsemantic) ? semantic : this;
            //var newsemsntic = new GWTK.mapsemantic(semantic.mapobject, semantic.semantics);
            var newsemsntic = new GWTK.mapsemantic(null, semantic.semantics);
            newsemsntic.mapobject = semantic.mapobject;

            // Сохраним ошибки
            if (semantic.errors)
                newsemsntic.errors = semantic.errors.clone();
            // Текст подписи, если есть
            newsemsntic.texttitle = semantic.texttitle;

            return newsemsntic;
        },

        // Запрос проверки семантики, что она только на чтение
        isReadOnly: function (semantic) {
            if (!semantic) return;
            // Найдем и пометим семантики, которые можно отнести к служебным, не подлежащим редактированию
            var find = this.readonlyCode.find(function (element, index, array) {
                if (semantic.code == element.toString()) {
                    return element;
                }
            });
            return find;
        },

        // добавить семантику
        // all - добавлять семантики независимо от валидации
        _addsemantic: function (semantic, all) {
            if (!semantic) return;
            var sem = {};
            sem.code = semantic.code;
            sem.type = semantic.type;
            sem.reply = semantic.reply;
            sem.enable = semantic.enable;
            sem.service = semantic.service;
            sem.name = semantic.name;
            sem.unit = semantic.unit;
            sem.defaultvalue = semantic.defaultvalue;
            sem.minimum = semantic.minimum;
            sem.readonly = semantic.readonly;

            // Проверка на корректность (w2ui некорректно работает, циклит)
            var minimum = parseFloat(semantic.minimum);
            var maximum = parseFloat(semantic.maximum);
            if (maximum < minimum) {
                if (maximum < 0 && minimum < 0 || maximum > 0 && minimum > 0)
                    sem.maximum = semantic.minimum;
                else {
                    if (maximum < 0) //   Заглушка, почему-то АП сервис возвращает отрицательное значение
                        sem.maximum = Math.abs(maximum).toString();
                }
            }
            else
                sem.maximum = semantic.maximum;

            sem.size = semantic.size;
            sem.decimal = semantic.decimal;
            sem.shortname = semantic.shortname;
            sem.value = semantic.value;
            sem.image = semantic.image;
            if (semantic.textvalue)
                sem.textvalue = semantic.textvalue.toString().replace(new RegExp("\"", "g"), "\'");
            var ret = this.validate(sem);
            if (ret || all) {
                this.semantics.push(sem);
                return true;
            }
            // if (this.validate(sem)) {
            //     this.semantics.push(sem);
            //     return true;
            // }

        },

        // Слить семантику
        merge: function (semantic) {
            if (semantic && semantic instanceof GWTK.mapsemantic && semantic.semantics && semantic.semantics.length > 0)  {
                var find;
                for (var i = 0; i < semantic.semantics.length; i++) {
                    find = this.semantics.find(function (element, index, array) {
                        if (element.shortname == semantic.semantics[i].shortname) {
                            return element;
                        }
                    });
                    // Не нашли, добавим
                    if (!find) {
                        this._addsemantic(semantic.semantics[i]);
                    }
                }
            }

        },

        /**
         * Обновить значения семантик из списка семантик
         * @param semantics
         */
        updateSemanticsValue: function(semantics){
            if (semantics) {
                for (var i = 0; i < this.semantics.length; i++) {
                    for (var j = 0; j < semantics.length; j++) {
                        if (this.semantics[i].shortname == semantics[j].shortname) {
                            this.semantics[i].textvalue = semantics[j].textvalue;
                            this.semantics[i].value = semantics[j].value;
                            break;
                        }
                    }
                }
            }
        },


        // Загрузить семантику по номеру объекта на карте
        // objectnumber - номер объекта на карте
        loadSemanticsByObjectNumber: function (objectnumber, mapobject, fn_callback) {
            if (!objectnumber || !mapobject) return;
            var layer = mapobject.map.tiles.getLayerByxId(mapobject.maplayerid);
            if (layer) {
                // Если это слой локальной карты
                if (layer instanceof GWTK.graphicLayer) {
                    var rscobject = layer.getSemByObjNumber(layer.id + "." + objectnumber);
                    this.setsemantics(rscobject.rscsemantics);
                    if (fn_callback) {
                        return fn_callback(rscobject);
                    }
                    return rscobject;
                } else {
                    if (mapobject.wmtsId) {

                        if (!mapobject.srv) {
                            mapobject.srv = GWTK.Util.getServerUrl(layer.options.url);
                        }
                        if (mapobject.srv) {
                            this.queryEdit_GetSemByObjNumber = new EditQueries(mapobject.srv, mapobject.map);
                            this.queryEdit_GetSemByObjNumber.onDataLoad = GWTK.Util.bind(
                                function (response, context, status) {
                                    this.queryEdit_GetSemByObjNumber = null;
                                    //var answer = null;
                                    var answer = {
                                        'restmethod': 'GetSemByObjNumber',
                                        'message': 'Error',
                                        'rscobject': {'rscsemantics': []}
                                    }
                                    if (response) {
                                        response = response.replace(/\r|\n/g, '');  // удалить перенос строки, перенос каретки
                                        // Нет ошибок
                                        if (response.indexOf('ExceptionReport') < 0) {
                                            try {
                                                answer = JSON.parse(response);
                                            } catch (e) {
                                                console.log('Error: ' + e.name);
                                            }

                                            this.setsemantics(answer.rscobject.rscsemantics);
                                            if (fn_callback) {
                                                fn_callback(answer.rscobject);
                                            }
                                        }
                                    }
                                    $(mapobject.map.eventPane).trigger({
                                        type: 'getsembyobjnumber',
                                        answer: answer
                                    });
                                    if (fn_callback) {
                                        if (answer) {
                                            fn_callback(answer.rscobject);
                                        }
                                        else {
                                            fn_callback(answer);
                                        }
                                    }
                                }, this
                            );
                            this.queryEdit_GetSemByObjNumber.sendRequest({
                                "RESTMETHOD": "GetSemByObjNumber",
                                "LAYERS": mapobject.wmtsId,
                                "OBJECTNUMBER": objectnumber
                            // }, false);
                            }, true);
                        }
                    }
                }
            }

            // return this.getSemByObjNumber;
        }




    }

}
