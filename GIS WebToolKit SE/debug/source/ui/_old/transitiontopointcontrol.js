/*************************************** Полищук Г.В.   10/02/21 ****
 *************************************** Патейчук В.К.  20/02/20 ****
 *************************************** Нефедьева О.   05/06/20 ****
 *************************************** Гиман Н.       08/10/19 ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Компонент Перемещение карты по координатам точки         *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {
    /**
     * Компонент перемещения карты по координатам точки
     * @class GWTK.transitionToPointControl
     * @constructor GWTK.transitionToPointControl
     * @param map {Object} карта GWTK.Map
     */
    GWTK.transitionToPointControl = function (map) {
        this.toolname = 'transitionToPoint';
        this.map = map;
        if (!this.map) {
            console.log("transitionToPointControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.id=null;
        this.pane = null;
        this.$pane = null;

        this.mode = false;
        this.changeCoordView = ['dms', 'bl'];
        this.currentCoordsView = 'dms';
        this.currentCoordsObj = {dms : [[],[]], bl: []};
        this.compareArray = {dms : [[],[]], bl: []};
        this.valueWasChanged = false;
        this.toolbarButton = null;

        this.init();
    }
    GWTK.transitionToPointControl.prototype = {

        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            this.createPane();
            // добавить в карту
            this.map.maptools.push(this);
        },

        /**
         * Создать панель компонента
         * @method init
         */
        // ===============================================================
        createPane: function () {

            this.id = this.map.divID + '_transitionpointPane';
            this.pane = GWTK.DomUtil.create('div', 'map-panel-def transitionpoint-panel', this.map.mapPaneOld);
            this.pane.id = this.id;
            this.pane.className += ' transition-point-container';

            this.$pane = $(this.pane);
            this.$pane.hide();

            var tool = this, map = this.map;

            // заголовок
            this.pane.appendChild(GWTK.Util.createHeaderForComponent({
                    map: this.map,
                    callback: function (e) {
                        $('#' + tool.id).hide('slow');
                        tool.map.off({type: "click", target: "map", phase: 'before'}, tool.onMapclick);
                    },
                    name: w2utils.lang("Moving to the point"),
                    minimizePanel: this.$pane,
                    context: this.toolname
                }
            ));

            // body
            var frame = document.createElement('div');
            frame.id = "transitionpoint_container";
            frame.className += 'transition-point-inputs-container';
            // широта
            var elem = document.createElement('div');
            elem.id = "transitionpointb_info";
            $(elem).html('<div style="height:2px"></div>' +
                            '<div class="panel-transitionpoint-b">' +
                                '<span style="left:2px"> ' + w2utils.lang("Latitude") + ' </span>' +
                            '</div>')
            $(frame).append(elem);

            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpointb_gr");
            input.setAttribute("id", "transitionpointb_gr");
            input.setAttribute("style", "width:40px;");
            input.value = '';
            input.title = w2utils.lang("degrees");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding: 5px; color: #868b92;");
            label.innerHTML = "°";
            frame.appendChild(label);

            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpointb_min");
            input.setAttribute("id", "transitionpointb_min");
            input.setAttribute("style", "width:30px;");
            input.value = '';
            input.title = w2utils.lang("minutes");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding: 5px; color: #868b92;");
            label.innerHTML = "'";
            label.className = 'label-coord';
            frame.appendChild(label);

            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpointb_sec");
            input.setAttribute("id", "transitionpointb_sec");
            input.setAttribute("style", "width:60px;");
            input.value = '';
            input.title = w2utils.lang("seconds");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding-left: 5px; color: #868b92;");
            label.innerHTML = "''";
            label.className = 'label-coord';
            frame.appendChild(label);

            // Долгота
            var elem = document.createElement('div');
            elem.id = "transitionpointl_info";
            $(elem).html('<div style="height:2px"></div>' +
                            '<div class="panel-transitionpoint-l">' +
                                '<span style="left:2px; top: 4px;"> ' + w2utils.lang("Longitude") + ' </span>' +
                            '</div>')
            $(frame).append(elem);
            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpoinl_gr");
            input.setAttribute("id", "transitionpointl_gr");
            input.setAttribute("style", "width:40px;");
            input.value = '';
            input.title = w2utils.lang("degrees");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding: 5px; color: #868b92;");
            label.innerHTML = "°";
            frame.appendChild(label);

            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpointl_min");
            input.setAttribute("id", "transitionpointl_min");
            input.setAttribute("style", "width:30px;");
            input.value = '';
            input.title = w2utils.lang("minutes");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding: 5px; color: #868b92;");
            label.innerHTML = "'";
            label.className = 'label-coord';
            frame.appendChild(label);

            var input = document.createElement('input');
            input.setAttribute("type", "text");
            input.setAttribute("name", "transitionpointl_sec");
            input.setAttribute("id", "transitionpointl_sec");
            input.setAttribute("style", "width:60px;");
            input.value = '';
            input.title = w2utils.lang("seconds");
            frame.appendChild(input);

            var label = document.createElement('label');
            label.setAttribute("style", "padding-left: 5px; color: #868b92;");
            label.innerHTML = "''";
            label.className = 'label-coord';
            frame.appendChild(label);

            // body --> панель
            this.$pane.append(frame);
            this.$pane.append('<table><tr><td colspan="5"></td></tr> ' +
                '<tr> ' +
                '<td> ' +
                    '<div id="change-coords-view" title="' + w2utils.lang("Coordinate format") + '" class="control-button control-button_addmenu panel-transitionpoint-control-button-mode clickable"></div>' +
                '</td> ' +
                '<td> ' +
                    '<div id="copy-coords-input" title="' + w2utils.lang("Copy to Clipboard") + '" class="control-button control-button_addmenu panel-transitionpoint-control-button-copy clickable"></div>' +
                '</td> ' +
                '<td > ' +
                '<div id="get-coords-input" title="' + w2utils.lang("Get point coordinates") + '" class="control-button control-button_addmenu panel-transitionpoint-control-button-get clickable"></div>' +
                '</td> ' +
                '<td > ' +
                '<input id="hicopy" class="transition-point-input-hidden" type="text">' +
                '</td> ' +
                '<td > ' +
                '<div name="transitionpoint_ok" id="transitionpoint_ok" class="control-button control-button_addmenu control-button-ok clickable transition-point-button-ok" ' +
                  'title="' + w2utils.lang("Go to") + '" ></div>' +
                '</td> ' +
                '</tr> ' +
                '</table>');

            $('#copy-coords-input').on('click', tool.copyCoords.bind(tool));

            $('#change-coords-view').on('click', function(){
                tool.changeCoordsView(true);
            });
            $('#get-coords-input').on('click', function(){

                if($(this).hasClass('control-button-active')){
                    $(this).removeClass('control-button-active');
                }else{
                    $(this).addClass('control-button-active');
                }

                if(tool.mode){
                    tool.mode = false;
                    tool.map.off({ type: "click", target: "map", phase: 'before', map: tool.map }, tool.onMapclick);
                }
                else {
                    tool.mode = true;
                    tool.map.statusbar.set('Выберите точку на карте.');
                    setTimeout(function () { tool.map.statusbar.clearText(); }, 3000);
                    tool.map.on({ type: "click", target: "map", phase: 'before', map: tool.map }, tool.onMapclick);
                }
            });
            // назначить обработчики событий
            this.initEvents();

            return;
        },

        /**
         * Изменить формат ввода координат точки
         * @method changeCoordsView
         */
        // ===============================================================
        changeCoordsView: function (some) {
            /*выбрали режим */
            if(some){
                for(var i = 0; i < this.changeCoordView.length; i++){
                    if(this.currentCoordsView == this.changeCoordView[i]){
                        if(i + 1 >= this.changeCoordView.length){
                            this.currentCoordsView = this.changeCoordView[0];
                            break;
                        }else{
                            this.currentCoordsView = this.changeCoordView[i + 1];
                            break;
                        }
                    }
                }
            }

            var gr_B    =   $('#transitionpointb_gr');
            var min_B   =   $('#transitionpointb_min');
            var sec_B   =   $('#transitionpointb_sec');
            var gr_L    =   $('#transitionpointl_gr');
            var min_L   =   $('#transitionpointl_min');
            var sec_L   =   $('#transitionpointl_sec');

            if(this.currentCoordsView == 'dms'){
                if(this.compareArray.bl[0] ==  this.currentCoordsObj.bl[0] && this.compareArray.bl[1] ==  this.currentCoordsObj.bl[1]){
                    gr_B.val(this.currentCoordsObj.dms[0][0].replace("°", ''));
                    min_B.val(this.currentCoordsObj.dms[0][1].replace("'", ''));
                    sec_B.val(this.currentCoordsObj.dms[0][2].replace("''", ''));
                    gr_L.val(this.currentCoordsObj.dms[1][0].replace("°", ''));
                    min_L.val(this.currentCoordsObj.dms[1][1].replace("'", ''));
                    sec_L.val(this.currentCoordsObj.dms[1][2].replace("''", ''));
                }
                else {
                //    пересчитываем и записываем  новые значения для дальнейшего сравнения
                    var sgrad = GWTK.toLatLng([gr_B.val(), gr_L.val()]);
                    var coord = sgrad.Degrees2DegreesMinutesSeconds(gr_B.val()).split(' ');
                    var coord1 = sgrad.Degrees2DegreesMinutesSeconds(gr_L.val()).split(' ');
                    this.currentCoordsObj.dms = [coord, coord1];
                    this.currentCoordsObj.bl = [parseFloat(gr_B.val()), parseFloat(gr_L.val())];
                    this.compareArray.dms = [coord, coord1];
                    this.compareArray.bl = [gr_B.val(), gr_L.val()];
                    gr_B.val(this.currentCoordsObj.dms[0][0].replace("°", ''));
                    min_B.val(this.currentCoordsObj.dms[0][1].replace("'", ''));
                    sec_B.val(this.currentCoordsObj.dms[0][2].replace("''", ''));
                    gr_L.val(this.currentCoordsObj.dms[1][0].replace("°", ''));
                    min_L.val(this.currentCoordsObj.dms[1][1].replace("'", ''));
                    sec_L.val(this.currentCoordsObj.dms[1][2].replace("''", ''));
                }


                $('#transitionpointb_gr, #transitionpointl_gr').animate({width: 40}, 200, function(){
                    $('#transitionpointb_min, #transitionpointb_sec, #transitionpointl_min, #transitionpointl_sec').show();
                    $('.label-coord').show();
                });
            }
            if(this.currentCoordsView == 'bl'){

                if( parseInt(this.compareArray.dms[0][0])   ==  parseInt( gr_B.val())  &&
                    parseInt(this.compareArray.dms[0][1])   ==  parseInt(min_B.val())  &&
                    parseInt(this.compareArray.dms[0][2])   ==  parseInt(sec_B.val())  &&
                    parseInt(this.compareArray.dms[1][0])   ==  parseInt(gr_L.val())   &&
                    parseInt(this.compareArray.dms[1][1])   ==  parseInt(min_L.val())  &&
                    parseInt(this.compareArray.dms[1][2])   ==  parseInt(sec_L.val())){
                    gr_B.val(parseFloat(this.currentCoordsObj.bl[0]).toFixed(8));
                    gr_L.val(parseFloat(this.currentCoordsObj.bl[1]).toFixed(8));
                }
                else {
                    if(gr_B.val() || min_B.val() || sec_B.val() || gr_L.val() || min_L.val() || sec_L.val()){
                        var ll = new GWTK.LatLng(0, 0);
                        var coordB = ll.DegreesMinutesSeconds2Degrees(gr_B.val(), min_B.val(), sec_B.val());
                        var coordL = ll.DegreesMinutesSeconds2Degrees(gr_L.val(), min_L.val(), sec_L.val());

                        this.currentCoordsObj.bl = [parseFloat(coordB), parseFloat(coordL)];
                        this.compareArray.bl = [coordB, coordL];
                        this.currentCoordsObj.dms = [[gr_B.val(), min_B.val(), sec_B.val()],[gr_L.val(), min_L.val(), sec_L.val()]];
                        gr_B.val(this.currentCoordsObj.bl[0].toFixed(8));
                        gr_L.val(this.currentCoordsObj.bl[1].toFixed(8));
                    }
                    else {
                        this.currentCoordsObj.dms = [["", "", ""],["", "", ""]];

                    }
                }

                $('#transitionpointb_min, #transitionpointb_sec, #transitionpointl_min, #transitionpointl_sec').hide();
                $('.label-coord').hide();
                $('#transitionpointb_gr, #transitionpointl_gr').animate({width: 145}, 200);

            }
        },

        /**
         * Сохранить значения координат точки
         * @method saveSelectedCoords
        */
        // ===============================================================
        saveSelectedCoords: function(e){

            var gr_B    =   $('#transitionpointb_gr');
            var min_B   =   $('#transitionpointb_min');
            var sec_B   =   $('#transitionpointb_sec');
            var gr_L    =   $('#transitionpointl_gr');
            var min_L   =   $('#transitionpointl_min');
            var sec_L   =   $('#transitionpointl_sec');

            this.showLabel(e.point);
            //при клике сразу переводим в г/м/с
            var sgrad = GWTK.toLatLng(e.geo);
            var coord = sgrad.Degrees2DegreesMinutesSeconds(e.geo[0]).split(' ');
            var coord1 = sgrad.Degrees2DegreesMinutesSeconds(e.geo[1]).split(' ');
            //присваиваем объекту класса
            this.currentCoordsObj.dms = [coord, coord1];
            this.compareArray.dms = [coord, coord1];
            //сохраняем координаты БЛ
            this.currentCoordsObj.bl = [parseFloat(e.geo[0]), parseFloat(e.geo[1])];
            this.compareArray.bl = [e.geo[0], e.geo[1]];
            //если отображение г/м/с
            if(this.currentCoordsView == 'dms'){
                gr_B.val(this.currentCoordsObj.dms[0][0].replace("°", ''));
                min_B.val(this.currentCoordsObj.dms[0][1].replace("'", ''));
                sec_B.val(this.currentCoordsObj.dms[0][2].replace("''", ''));
                gr_L.val(this.currentCoordsObj.dms[1][0].replace("°", ''));
                min_L.val(this.currentCoordsObj.dms[1][1].replace("'", ''));
                sec_L.val(this.currentCoordsObj.dms[1][2].replace("''", ''));
            }else{
                //если БЛ
                gr_B.val(this.currentCoordsObj.bl[0].toFixed(8));
                gr_L.val(this.currentCoordsObj.bl[1].toFixed(8));
            }
        },

        /**
         * Обработчик события клика в карте
         * @method onMapclick
         * @param event {Object} объект события
        */
        // ===============================================================
        onMapclick: function (event) {
            //console.log(event);
            if (!event.map || !(event.map instanceof GWTK.Map))
                return;
            var map = event.map, tool = map.mapTool("transitionToPoint");
            if (!tool) return;

            event.stopPropagation();
            var point = GWTK.DomEvent.getMousePosition(event, map.panes.eventPane);
            if (!map.tiles._testPointByMaxBounds(point)) {                   // проверить точку по габаритам карты
                return;
            }
            var coord = map.tiles.getLayersPointProjected(point);
            var geo = GWTK.projection.xy2geo(map.options.crs, coord.y, coord.x);
            if (tool.mode) {
                event.point = point;
                event.coord = coord;
                event.geo = geo;
                tool.saveSelectedCoords(event);
            }
        },

        /**
         * Инициализация событий компонента
         * @method initEvents
        */
        // ===============================================================
        initEvents: function () {
            var tool = this, map = this.map;

            var coordPane = $(map.panes.coordPane);
            if(!coordPane.length){
                this.toolbarButton = GWTK.DomUtil.create('div', 'control-button control-button-radio clickable transition-point-control-button', map.panes.toolbarPane);
                this.toolbarButton.title = w2utils.lang("Moving to the point");
                $(this.toolbarButton).on('click', function(){
                    if($(this).hasClass('control-button-active')){
                        tool.hidePane();
                        return false;
                    }
                    else {
                        if(tool) tool.showPane();
                        return false;
                    }
                });
            }
            else {
                // click на панели координат, показать панель
                $(map.panes.coordPane).on('click', function(e){
                    if(tool) tool.showPane();
                    return false;
                });
            }

            // закрытие панели
            $('#transitionpoint_close').on('click', function(){
                tool.hidePane();
            });


            $("#transitionpointb_gr").keyup(function(){
                if (tool.currentCoordsView == 'bl') {
                    tool.currentCoordsObj.bl[0] = this.value;
                }
                if (tool.currentCoordsView == 'dms') {
                    tool.currentCoordsObj.bl = [];
                }
            });

            $("#transitionpointl_gr").keyup(function(){
               if(tool.currentCoordsView == 'bl') {
                   tool.currentCoordsObj.bl[1] = this.value;
               }
               if(tool.currentCoordsView == 'dms') {
                   tool.currentCoordsObj.bl = [];
               }
            });
            /*giman*/


            // валидация ввода пользователя
            $("#transitionpointb_gr").keypress(function (e) {
                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Tab Delete
                    return true;
                if(tool.currentCoordsView == 'dms'){
                    if ($(this).val().length > 2)
                        return false;
                }

                // контроль на отрицательное число
                if (e.which == 45) {
                    if ($(this).val().indexOf('-') != -1)
                        return false;
                    if ($(this).val().length != 0)
                        return false;
                }
                else {
                    // контроль на число
                    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57) && tool.currentCoordsView !== 'bl') {
                        return false;
                    }
                    if(e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57) && tool.currentCoordsView == 'bl' && e.which !== 46){
                        return false;
                    }
                }

            });

            $("#transitionpointb_min").keypress(function (e) {

                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                tool.currentCoordsObj.b = [];

                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Delete Tab
                    return true;
                if ($(this).val().length > 1)
                    return false;
                if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                   return false;
                }
            });
            $("#transitionpointb_sec").keypress(function (e) {
                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                tool.currentCoordsObj.b = [];
                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Delete Tab
                    return true;
                if ($(this).val().length > 10)
                    return false;
                if (e.which == 46) {
                    if ($(this).val().indexOf('.') != -1)
                        return false;
                    if ($(this).val().length < 1 || $(this).val().length > 2)
                        return false;
                } else {
                    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                        return false;
                    }
                }
            });

            $("#transitionpointl_gr").keypress(function (e) {
                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Delete Tab
                    return true;
                if(tool.currentCoordsView == 'dms'){
                    if ($(this).val().length > 3)
                        return false;
                }
                if (e.which == 45) {
                    if ($(this).val().indexOf('-') != -1)
                        return false;
                    if ($(this).val().length != 0)
                        return false;
                } else {
                    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57) && tool.currentCoordsView !== 'bl') {
                            return false;
                    }
                    if(e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57) && tool.currentCoordsView == 'bl' && e.which !== 46){
                        return false;
                    }
                }
            });

            $("#transitionpointl_min").keypress(function (e) {

                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                tool.currentCoordsObj.b = [];

                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Delete Tab
                    return true;
                if ($(this).val().length > 1)
                    return false;
                if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                    return false;
                }
            });
            $("#transitionpointl_sec").keypress(function (e) {

                //var tool = GWTK.maphandlers.map.mapTool("transitionToPoint");
                tool.currentCoordsObj.b = [];

                if (e.which == 0 || e.which == 8 || e.which == 9 || e.which == 110) // Backspace Delete Tab
                    return true;
                if ($(this).val().length > 10)
                    return false;
                if (e.which == 46) {
                    if ($(this).val().indexOf('.') != -1)
                        return false;
                    if ($(this).val().length < 1 || $(this).val().length > 2)
                        return false;
                } else {
                    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                        return false;
                    }
                }
            });

            // перейти в точку
            $('#transitionpoint_ok').on('click', function () {

                if (!tool) return false;
                if (!tool._transition(tool)) return false;

                    if(tool.currentCoordsView !== 'bl') {
                        var gr = tool.$pane.find('#transitionpointb_gr').val();
                        var min = tool.$pane.find('#transitionpointb_min').val();
                        if (min == "") {
                            min = 0;
                        }
                        var sec = tool.$pane.find('#transitionpointb_sec').val();
                        if (sec == "") {
                            sec = 0;
                        }
                        var ll = new GWTK.LatLng(0, 0);
                        coordB = ll.DegreesMinutesSeconds2Degrees(gr, min, sec);
                        tool.currentCoordsObj.dms[0] = [gr, min, sec];
                        tool.compareArray.dms[0] = [gr, min, sec];
                        gr = tool.$pane.find('#transitionpointl_gr').val();
                        min = tool.$pane.find('#transitionpointl_min').val();
                        if (min == "") {
                            min = 0;
                        }
                        sec = tool.$pane.find('#transitionpointl_sec').val();
                        if (sec == "") {
                            sec = 0;
                        }
                        tool.currentCoordsObj.dms[1] = [gr, min, sec];
                        tool.compareArray.dms[1] = [gr, min, sec];
                        coordL = ll.DegreesMinutesSeconds2Degrees(gr, min, sec);
                        tool.currentCoordsObj.bl = [coordB, coordL];
                        tool.compareArray.bl = [parseFloat(coordB), parseFloat(coordL)];
                    }
                    else {
                        if(tool.currentCoordsObj.bl.length > 0){
                            coordB = tool.currentCoordsObj.bl[0];
                            coordL = tool.currentCoordsObj.bl[1];

                            if(tool.currentCoordsObj.bl[0] !== tool.compareArray.bl[0] || tool.currentCoordsObj.bl[1] !== tool.compareArray.bl[1]){
                                var sgrad = GWTK.toLatLng([coordB, coordL]);
                                var coord = sgrad.Degrees2DegreesMinutesSeconds(coordB).split(' ');
                                var coord1 = sgrad.Degrees2DegreesMinutesSeconds(coordL).split(' ');
                                tool.currentCoordsObj.dms[0] = coord;
                                tool.currentCoordsObj.dms[1] = coord1;
                                tool.compareArray.dms = [coord, coord1];
                                tool.compareArray.bl = [coordB, coordL];
                            }

                        }
                        else {
                            tool.currentCoordsObj.bl[0] = tool.$pane.find('#transitionpointb_gr').val();
                            tool.currentCoordsObj.bl[1] = tool.$pane.find('#transitionpointl_gr').val();
                        }
                    }

                if (coordB != null && coordL != null) {
                    tool.map.setViewport([coordB, coordL]);
                }
                tool.map.overlayRefresh('transittopoint');
                tool.showLabel();
            });


            return;
        },

        /**
         * Отобразить отметку точки
         * @method showLabel
        */
        // ===============================================================
        showLabel: function (topLeft) {
            if(topLeft){
                var x = topLeft.x;
                var y = topLeft.y
            }else{
                var wh = this.map.getWindowSize();
                    x = parseInt(wh[0] / 2, 10);
                    y = parseInt(wh[1] / 2, 10);
            }


            $('#transitpoint').stop().remove();                            // отметка точки

            var pointImg = GWTK.DomUtil.create('div', 'label-transitionpoint', this.map.overlayPane);
            pointImg.id = "transitpoint";
            pointImg.style.left = x + 'px';
            pointImg.style.top = y + 'px';


            $('#transitpoint').fadeOut(3000, function () {
                $('#transitpoint').remove();
            });
        },

        /**
         * Копировать координаты точки в буфер обмена
         * @method copyCoords
        */
        // ===============================================================
        copyCoords: function () {

            $('#hicopy').show();
            var tool = this;
            if(tool.currentCoordsView == 'bl'){
                var t1 = $('#transitionpointb_gr').val().toString();
                var t2 = $('#transitionpointl_gr').val().toString();
                if(t1 !== "" && t2 !== ""){
                    this.map.statusbar.set('Координаты скопированы в буфер: ' + t1 + ' ' + t2);
                    setTimeout(function () { tool.map.statusbar.clearText(); }, 3000);
                    $('#hicopy').val(t1 + ' ' + t2);
                }
            }
            if(tool.currentCoordsView == 'dms'){
                var gr_B    =   $('#transitionpointb_gr').val();
                var min_B   =   $('#transitionpointb_min').val();
                var sec_B   =   $('#transitionpointb_sec').val();
                var gr_L    =   $('#transitionpointl_gr').val();
                var min_L   =   $('#transitionpointl_min').val();
                var sec_L   =   $('#transitionpointl_sec').val();

                //var ta = $('#transitionpointb_gr').val().toString() + '°' + $('#transitionpointb_min').val().toString() + "'" + $('#transitionpointb_sec').val().toString() + "\"";
                //var tb = $('#transitionpointl_gr').val().toString() + '°' + $('#transitionpointl_min').val().toString() + "'" + $('#transitionpointl_sec').val().toString() + "\"";
                var ta;
                var tb;
                if(gr_B !== "" && gr_L !== ""){
                    ta = gr_B + '°';
                    tb = gr_L + '°';
                    if(min_B !== ""){
                        ta +=  min_B + "'";
                    }
                    if(sec_B !== ""){
                        ta += sec_B + '"';
                    }
                    if(min_L !== ""){
                        tb +=  min_L + "'";
                    }
                    if(sec_L !== ""){
                        tb += sec_L + '"';
                    }

                    this.map.statusbar.set('Координаты скопированы в буфер: ' + ta + ' ' + tb);
                    setTimeout(function () { tool.map.statusbar.clearText(); }, 3000);

                    $('#hicopy').val(ta + ' ' + tb);
                }

            }

            // выделить
            $('#hicopy').select().focus();
            // скопировать в буфер обмена
            if (document.execCommand) {
                // Chrome
                try {
                    document.execCommand('copy');
                    $('#hicopy').hide();
                }
                catch (e) {
                    console.log(w2utils.lang("Command is not supported!"));
                }
            }

        },

        /**
         * Отобразить панель
         * @method showPane
        */
        // ===============================================================
        showPane: function () {
            this.checkMinimizedToTaskbar();
            if(this.toolbarButton){
                $(this.toolbarButton).addClass('control-button-active');
            }
            this.$pane.show();
            if (this.mode) {
                this.map.on({ type: "click", target: "map", phase: 'before', map: this.map }, this.onMapclick);
            }
        },

        /**
         * Проверить, что окно свёрнуто в панели задач.
         * Если свёрнуто - иконка будет закрыта.
         * @method checkMinimizedToTaskbar
         */
        checkMinimizedToTaskbar: function () {
            var mapTaskBar = this.map.mapTool('maptaskbar');
            if (mapTaskBar) {
                mapTaskBar.onPanelClose(this.$pane);  // защита при повторном открытии окна, чтобы убрать иконку
            }
        },

        /**
         * Скрыть панель
         * @method hidePane
        */
        // ===============================================================
        hidePane: function () {
            if(this.toolbarButton){
                $(this.toolbarButton).removeClass('control-button-active');
            }
            this.$pane.hide();
        },

        /**
         * Проверить видимость панели
         * @method hidePane
        */
        // ===============================================================
        visible: function () {
            if (this.pane.style.display && this.pane.style.display == 'none')
                return false;
            return true;
        },

        animateInput: function(id, inOut){
            var elem = $('#' + id);
            if(inOut){
                elem.animate({borderColor: 'red'}, 500).focus();
            }else{
                elem.animate({borderColor: '#bbbbbb'}, 1500);
            }
        },

        /**
         * Выполнить настройку для анимации
         * @method _transition
        */
        // ===============================================================
        _transition: function () {
            var mes_gr = "*" + w2utils.lang("Enter degrees") + "! ";
            var mes_lim = "*" +w2utils.lang("The range is from 0 to 60");
            var pointb_gr =     this.$pane.find('#transitionpointb_gr').val();
            var pointb_min =    this.$pane.find('#transitionpointb_min').val();
            var pointb_sec =    this.$pane.find('#transitionpointb_sec').val();
            var pointl_gr =     this.$pane.find('#transitionpointl_gr').val();
            var pointl_min =    this.$pane.find('#transitionpointl_min').val();
            var pointl_sec =    this.$pane.find('#transitionpointl_sec').val();
            var $mess;
            var lat_range = { 'min': -85, 'max': 85 }, lng_range = { 'min': -180, 'max': 180 };
            if (this.map.options.maxBounds) {
                var min_geo = this.map.options.maxBounds.getSouthWest();
                var max_geo = this.map.options.maxBounds.getNorthEast();
                lat_range['min'] = parseInt(min_geo.lat); lat_range['max'] = parseInt(max_geo.lat);
                lng_range['min'] = parseInt(min_geo.lng); lng_range['max'] = parseInt(max_geo.lng);
                console.log('lat_range ', lat_range, 'lng_range', lng_range);
            }

            // Широта
            if (!pointb_gr) {
                $mess = $("#transitionpointb_gr_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointb_gr_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_gr);
                    $('#err-msg-builderzone').append($mess);
                    this.animateInput('transitionpointb_gr', true);
                }
                else {
                    this.animateInput('transitionpointb_gr', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointb_gr', false);
                $mess.fadeOut(3000);
                return false;
            }
            if (pointb_gr < lat_range.min || pointb_gr > lat_range.max) {
                $mess = $("#transitionpointb_gr_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointb_gr_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html("*" + w2utils.lang("The range is from -85 to 85"));
                    $('#err-msg-builderzone').append($mess);
                    this.animateInput('transitionpointb_gr', true);
                }
                else {
                    this.animateInput('transitionpointb_gr', true);
                    $mess.fadeIn("slow");
                }
                $mess.fadeOut(3000);
                this.animateInput('transitionpointb_gr', false);
                return false;
            }
            if (!pointb_min) {
                pointb_min = 0;
            }
            if (pointb_min > 60 || pointb_min < 0) {
                $mess = $("#transitionpointb_min_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointb_min_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_lim);
                    this.animateInput('transitionpointb_min', true);
                    $('#err-msg-builderzone').append($mess);
                }else {
                    this.animateInput('transitionpointb_min', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointb_min', false);
                $mess.fadeOut(3000);
                return false;
            }
            if (!pointb_sec) {
                pointb_sec = 0;
            }
            if (pointb_sec > 60 || pointb_sec < 0) {
                $mess = $("#transitionpointb_sec_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointb_sec_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_lim);
                    this.animateInput('transitionpointb_sec', true);
                    $('#err-msg-builderzone').append($mess);
                }
                else {
                    this.animateInput('transitionpointb_sec', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointb_sec', false);
                $mess.fadeOut(3000);
                return false;
            }

            // Долгота
            if (!pointl_gr) {
                $mess = $("#transitionpointl_gr_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointl_gr_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_gr);
                    this.animateInput('transitionpointl_gr', true);
                    $('#err-msg-builderzone').append($mess);
                }
                else {
                    this.animateInput('transitionpointl_gr', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointl_gr', false);
                $mess.fadeOut(3000);
                return false;
            }
            if (pointl_gr < lng_range.min || pointl_gr > lng_range.max) {
                $mess = $("#transitionpointl_gr_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointl_gr_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html("*" + w2utils.lang("The range is from -180 to 180"));
                    this.animateInput('transitionpointl_gr', true);
                    $('#err-msg-builderzone').append($mess);
                }
                else {
                    this.animateInput('transitionpointl_gr', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointl_gr', false);
                $mess.fadeOut(3000);
                return false;
            }
            if (!pointl_min) {
                pointl_min = 0;
            }
            if (pointl_min > 60 || pointl_min < 0) {
                $mess = $("#transitionpointl_min_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointl_min_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_lim);
                    $('#err-msg-builderzone').append($mess);
                    this.animateInput('transitionpointl_min', true);
                }
                else {
                    this.animateInput('transitionpointl_min', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointl_min', false);
                $mess.fadeOut(3000);
                return false;
            }
            if (!pointl_sec) {
                pointl_sec = 0;
            }
            if (pointl_sec > 60 || pointl_sec < 0) {
                $mess = $("#transitionpointl_sec_size_errMessage");
                if ($mess.length == 0) {
                    $mess = $(document.createElement('span'));
                    $mess[0].id = "transitionpointl_sec_size_errMessage";
                    $mess[0].style.color = 'red';
                    $mess.html(mes_lim);
                    this.animateInput('transitionpointl_sec', true);
                    $('#err-msg-builderzone').append($mess);
                }
                else {
                    this.animateInput('transitionpointl_sec', true);
                    $mess.fadeIn("slow");
                }
                this.animateInput('transitionpointl_sec', false);
                $mess.fadeOut(3000);
                return false;
            }
              return true;
        },

        /**
         * Деструктор
         * @method destroy
        */
        // ===============================================================
        destroy: function () {
            $('#copy-coords-input').off();
            $('#change-coords-view').off();
            $('#get-coords-input').off();
            $(this.closeButton).off();
            $(this.map.panes.coordPane).off();
            $("#transitionpoint_ok").off();
            $('#transitionpoint_close').off();

            $("#transitionpointb_gr").unbind();
            $("#transitionpointl_gr").unbind();
            $("#transitionpointb_min").unbind();
            $("#transitionpointb_sec").unbind();
            $("#transitionpointl_min").unbind();
            $("#transitionpointl_sec").unbind();

            $('#transitpoint').remove();
            this.$pane.remove();
        }

    }
}
