/************************************* Соколова Т.O.** 11/09/17 ****
/************************************* Нефедьева O. ** 30/11/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*           Компонент слайдер с кнопками управления                *
*                                                                  *
*******************************************************************/

if (window.GWTK) {

    //  GWTK.sliderToolsControl - класс - слайдер с кнопками управления

    // Параметры создания класса
    // ----------------------------
    // id - идентификатор объекта слайдера
    // toolsdiv - div для размещения кнопок
    // sliderdiv - div для размещения бегунка слайдера
    // initparam - параметры инициализации слайдера
    //  в виде 
    //  var initparam = new Array();
    //  initparam.dtbegin = new Date() - время начала
    //  initparam.dtend = new Date()  - время окончания
    //  initparam.step = 250 - шаг в миллисекундах
    //  initparam.interval = 250 - интервал обновления панели слайдера в режиме проигрывания в миллисекундах
    //  initparam.mininterval = 250 - минимально допустимый интервал

    // Функция инициализации данных
    // ----------------------------
    // initSlider(dtbegin, dtend, step, interval, mininterval)
    // - dtBegin - начало
    // - dtEnd - окончание
    // - step - шаг
    // - interval - интервал обновления панели слайдера в режиме проигрывания
    // - mininterval = null - минимально допустимый интервал

    // События родительскому элементу sliderdiv
    // -----------------------------------
    // updatedatasliderToolsControl - изменение значений бюегунка
    //  dt - реальная дата,
    //  service - направление движения:
    //  - "begin" - начало
    //  - "end" - конец
    //  - "step_forward" - шаг вперед
    //  - "step_back" - шаг назад
    //  - "random" - случайно выбранное значение
    //  - "start" - старт
    //  - "stop" - стоп
    //  - "playprocess" - проигрывание
    //  - "playprocess_back" - проигрывание назад
    // updateparamsliderToolsControl - изменение значений диалога
    
    GWTK.sliderToolsControl = function (id, toolsdiv, sliderdiv, initparam ) {
        this.param = initparam;
        this.tools = $(toolsdiv);
        this.slider = $(sliderdiv);

        // текущие пограничные даты
        this.dateTimeBegin = null;
        this.dateTimeEnd = null;
        this.Step = 36000000;
        this.Interval = 1000;
        this.mininterval = this.Interval;

        this.timerId = 0;           // Процесс play
        this.isPlay = false;

        if (this.tools != null && this.tools != undefined &&
            this.slider != null && this.slider != undefined) {
            this.parentstr = 'asdslider_' + id;
            this.initRes("RU");
            this.create();

            // файл kml или csv
            if (initparam != null && initparam != undefined &&
                initparam.dtbegin != null && initparam.dtbegin != undefined &&
                initparam.dtend != null && initparam.dtend != undefined &&
                initparam.step != null && initparam.step != undefined &&
                initparam.interval != null && initparam.interval != undefined) 
                this.initSlider(initparam.dtbegin, initparam.dtend, initparam.step, initparam.interval, initparam.mininterval);
        }

        // Диалог параметров
        this.dialog;
     }

    GWTK.sliderToolsControl.prototype = {
        create: function () {
        var str = ' <div id="toolbar_' + this.parentstr + '" class="ui-corner-all">' +
                        ' <button id="beginning_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_beginning + '</button> ' +
                        ' <button id="rewind_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_rewind + '</button> ' +
                        ' <button id="play_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_play + '</button>' +
                        ' <button id="playback_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_playback + '</button>' +
                        ' <button id="forward_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_forward + '</button>' +
                        ' <button id="end_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_end + '</button>' +
                        ' <button id="wrench_' + this.parentstr + '" style="width:20px; height:20px;">' + this.res_sliderToolsControl_wrench + '</button>' +
                    '</div>';
        $(this.tools).append(str);

        $(this.slider).append(
                '<table width="100%" cellpadding="0" cellspacing="0"> ' +
                '<tr> ' +
                '<td   align="left" > ' +
                            '<div id="mapMoviesTrack-labelLeft_' + this.parentstr + '" class="mapMoviesTrack-labelLeft"/> ' +
                '</td> ' +
                '<td align="center"> ' +
                            '<div id="mapMoviesTrack-labelCenter_' + this.parentstr + '" class="mapMoviesTrack-labelCenter"/> ' +
                '</td> ' +
                '<td align="right" > ' +
                            '<div id="mapMoviesTrack-labelRight_' + this.parentstr + '" class="mapMoviesTrack-labelRight"/> ' +
                '</td> ' +
                '</tr> ' +
                '<tr> ' +
                '<td colspan="3" align="center"> ' +
                            '<div id="' + this.parentstr + '" class="mapMoviesTrack-panel"/> ' +
                '</td> ' +
                '</tr> ' +
                '</table>');

        },

        initRes: function (res) {

            // кнопки проирывателяres_sliderToolsControl__errRegexpD
            this.res_sliderToolsControl_beginning = w2utils.lang("Back to top");// 'Перейти к началу';
            this.res_sliderToolsControl_rewind = w2utils.lang("Rewind");//'Перемотка назад';
            this.res_sliderToolsControl_play = w2utils.lang("Starting forward");//'Старт вперед';
            this.res_sliderToolsControl_playback = w2utils.lang("Start back");//'Старт назад';
            this.res_sliderToolsControl_stop = w2utils.lang("Stop");//'Стоп';
            this.res_sliderToolsControl_forward = w2utils.lang("Flash forward");// 'Перемотка вперед';
            this.res_sliderToolsControl_end = w2utils.lang("Go to the end");//'Перейти к концу';
            this.res_sliderToolsControl_pause = w2utils.lang("Pause");//'Пауза';
            this.res_sliderToolsControl_wrench = w2utils.lang("Rewind parameters");//'Параметры перемотки';

            // диалог
            this.res_sliderToolsControl_stepD = w2utils.lang("Step (in milliseconds)");//'Шаг (в миллисекундах)';
            this.res_sliderToolsControl_intervalD = w2utils.lang("Speed (in milliseconds)");//'Скорость (в миллисекундах)';
            this.res_sliderToolsControl_unitD = new Array(w2utils.lang("day"), w2utils.lang("clock"), w2utils.lang("minutes"), w2utils.lang("seconds"), w2utils.lang("milliseconds"));
            this.res_sliderToolsControl_save = w2utils.lang("Save");
            this.res_sliderToolsControl_cancel = w2utils.lang("Cancel");
            this.res_sliderToolsControl_errLenghtD = w2utils.lang("the length should be in the range ");//': длина должна быть в диапазоне ';
            this.res_sliderToolsControl_errValueD = w2utils.lang("the value must be in the range");//': значение должно быть в диапазоне ';
            this.res_sliderToolsControl_errRegexpD = w2utils.lang("only characters ");//': только символы ';

        },

        destroy: function () {
            // Удалить таймер
            if (this.timerId != 0)
                clearTimeout(this.timerId);

            $("#beginning_" + this.parentstr).unbind();
            $("#rewind_" + this.parentstr).unbind();
            $("#playback_" + this.parentstr).unbind();   
            $("#play_" + this.parentstr).unbind();       
            $("#forwar_" + this.parentstr).unbind();    
            $("#end_" + this.parentstr).unbind();       
            $("#wrench_" + this.parentstr).unbind();

            // удалить панели
            $('#dialog-form_' + this.parentstr).remove();
            $(this.tools).children().remove();
            $(this.slider).children().remove();
        },

        initSlider: function (dtbegin, dtend, step, interval, mininterval) {
            if (dtend == null || dtend == undefined || 
                dtbegin == null || dtbegin == undefined)
                return;
                this.dateTimeBegin = dtbegin;
                this.dateTimeEnd = dtend;

                if (step != null && step != undefined)
                    this.Step = step;
                if (interval != null && interval != undefined)
                    this.Interval = interval;
                if (mininterval != null && mininterval != undefined)
                    this.mininterval = mininterval;

                $('#mapMoviesTrack-labelRight_' + this.parentstr).append(document.createTextNode(this.dateTimeBegin.toLocaleString()));
                $('#mapMoviesTrack-labelLeft_' + this.parentstr).append(document.createTextNode(this.dateTimeEnd.toLocaleString()));

                var instance = this;
                //var parent = this.parent;
                var parentstr = this.parentstr; 
                var min = 0, max = 0, val = 0;
                min = val = +(dtbegin);
                max = +(dtend);
                var slider = $('#' + this.parentstr).slider({
                min: min,
                max: max,
                range: "min",
                step: this.Step,
                value: val,
                slide: function (event, ui) {
                if (instance.isPlay) 
                    instance.updateinfo(ui.value, "start");
                else
                    instance.updateinfo(ui.value, "random");
                }
            });

            $("#beginning_" + parentstr).button({   // начало
                text: false,
                icons: {
                    primary: "ui-icon-seek-start"
                }
            });
            $("#beginning_" + parentstr).bind('click', {slPane:this}, function(e){
                e.data.slPane.stop();
                e.data.slPane.begin_end("begin");
                return false;
            });

            $("#rewind_" + parentstr).button({   //  шаг назад
                text: false,
                icons: {
                    primary: "ui-icon-seek-prev"
                }
            });

            $("#rewind_" + parentstr).bind('click', { slPane: this }, function (e) {
                e.data.slPane.stop();
                e.data.slPane.play(-e.data.slPane.Step, "step_back");
                return false;
            });

            $("#playback_" + parentstr).button({           // проиграть назад
                text: false,
                icons: {
                    primary: "ui-icon-playback"
                }
            });
            $("#playback_" + parentstr).bind('click', { slPane: this }, function (e) {
                if (e.data.slPane.dateTimeEnd == null || e.data.slPane.dateTimeBegin == null)
                    return;

                var options;
                if ($(this).text() === e.data.slPane.res_sliderToolsControl_playback) {
                    e.data.slPane.stop();
                    $("#playback_" + parentstr).button("option", {
                        label: e.data.slPane.res_sliderToolsControl_pause,
                        icons: {
                            primary: "ui-icon-pause"
                        }
                    });
                    // Запустим процесс   
                    var service = "start";
                    e.data.slPane.timerId = setInterval(function () {
                        e.data.slPane.play(-e.data.slPane.Step, service);
                        service = null;
                    }, e.data.slPane.Interval);
                } else {
                    e.data.slPane.stopWithUpdate();
                }
                return false;
            });

            $("#play_" + parentstr).button({
                text: false,
                icons: {
                    primary: "ui-icon-play"
                }
            });

            $("#play_" + parentstr).bind('click', {slPane:this}, function(e){
                if (e.data.slPane.dateTimeEnd == null || e.data.slPane.dateTimeBegin == null)
                    return false;

                var options;
                if ($(this).text() === e.data.slPane.res_sliderToolsControl_play) {
                    e.data.slPane.stop();

                    $("#play_" + parentstr).button("option", {
                        label: e.data.slPane.res_sliderToolsControl_pause,
                        icons: {
                            primary: "ui-icon-pause"
                        }
                    });

                    // Запустим процесс   
                    //e.data.slPane.stop();
                    var service = "start";
                    var sl = e.data.slPane;
                    sl.timerId = setInterval(function () {
                        sl.play(sl.Step, service);
                        service = null;
                    }, sl.Interval);
                } else {
                    e.data.slPane.stopWithUpdate();
                }
                return false;

            });

            $("#forward_" + parentstr).button({              // шаг вперед
                text: false,
                icons: {
                    primary: "ui-icon-seek-next"
                }
            });

            $("#forward_" + parentstr).bind('click', { slPane: this }, function (e) {
                e.data.slPane.stop();
                e.data.slPane.play(e.data.slPane.Step, "step_forward");
                 return false;
           });

            $("#end_" + parentstr).button({
                text: false,
                icons: {
                    primary: "ui-icon-seek-end"
                }
            })

            $("#end_" + parentstr).bind('click', { slPane: this }, function (e) {
                e.data.slPane.stop();
                e.data.slPane.begin_end("end");
                 return false;
           });
               
            $("#wrench_" + parentstr).button({
                text: false,
                icons: {
                    primary: "ui-icon-wrench"
                }
            });
            $("#wrench_" + parentstr).bind('click', { slPane: this }, function (e) {
                //e.data.slPane.stop();
                e.data.slPane.stopWithUpdate();
                e.data.slPane.opendialog();
                 return false;
           });

            $('body').append(
                    '<div id="dialog-form_' + this.parentstr + '" title="' + this.res_sliderToolsControl_wrench + '">' +
                '<p class="validateTips" style="color:red; font-style:italy; font-size:small;"></p>' +
                '<form>' +
                '<label for="step" style="display:block;">' + this.res_sliderToolsControl_stepD + '</label> ' +
                '<input type="text" style="display:block; text-align:right;" name="step" id="step_' + this.parentstr + '" value="' + instance.Step + '" class="text ui-widget-content ui-corner-all"> ' +
                '<label for="interval" style="display:block;">' + this.res_sliderToolsControl_intervalD + '</label> ' +
                '<input type="text" style="display:block; text-align:right;" name="interval" id="interval_' + this.parentstr + '" value="' + instance.Interval + '" class="text ui-widget-content ui-corner-all"> ' +
                '<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">' +
                '</form>' +
                '</div>');


            var form,
            pict = /^[0-9]+$/,
            step = $("#step_" + this.parentstr),
            interval = $("#interval_" + this.parentstr),
            mininterval = this.mininterval,
            allFields = $([]).add(step).add(interval),
            tips = $(".validateTips"),
            dateTimeEnd, dateTimeBegin;

            $('#step_' + this.parentstr).mask('999999999999', {autoclear: false});
            $('#step_' + this.parentstr).val(this.Step);
            $('#interval_' + this.parentstr).mask('999999999999', { autoclear: false });
            $('#interval_' + this.parentstr).val(this.Interval);

 
            // Проверка введенного символа
            function checkKeydown(keyCode, n, min, max, pict) {

                var valid = valid && checkRegexp(n, pict);
                var valid = checkLength(n, min, max);
                return valid;
            }

            function updateTips(t) {
                tips
                    .text(t)
                    .addClass("ui-state-highlight");
                setTimeout(function () {
                    tips.removeClass("ui-state-highlight", 1500);
                }, 500);
            }

            // Проверка на длину поля
            function checkLength(o, min, max, n) {
                if (o.val().length > max || o.val().length < min) {
                    if (n != undefined) {
                        o.addClass("ui-state-error");
                        updateTips(n + sliderToolsControl_errLenghtD_RU + min + " - " + max + ".");
                    }
                    return false;
                } else {
                    return true;
                }
            }

            // Проверка на значение
            function checkValue(o, min, max, n) {
                if (min != max && (parseInt(o.val()) > max || parseInt(o.val()) < min)) {
                    if (n != undefined) {
                        o.addClass("ui-state-error");
                        updateTips(n + sliderToolsControl_errValueD_RU + min + " - " + max + ".");
                    }
                    return false;
                } else {
                    return true;
                }
            }

            // Проверка на символы
            function checkRegexp(o, regexp, character, n) {
                if (!(regexp.test(o.val()))) {
                    if (n != undefined) {
                        o.addClass("ui-state-error");
                        updateTips(n + sliderToolsControl_errRegexpD + character);
                    }
                    return false;
                } else {
                    return true;
                }
            }

            function updateParam() {
            var valid = true;
            allFields.removeClass("ui-state-error");

            valid = valid && checkLength(step, 3, 13, sliderToolsControl_stepD_RU);
            valid = valid && checkLength(interval, 3, 13, sliderToolsControl_intervalD_RU);

            var delta = dateTimeEnd - dateTimeBegin;
            valid = valid && checkValue(step, 1, delta, sliderToolsControl_stepD_RU);
            valid = valid && checkValue(interval, mininterval, 3600000, sliderToolsControl_intervalD_RU);
            return valid;
            }


            this.dialog = $("#dialog-form_" + this.parentstr).dialog({
                autoOpen: false,
                height: 270,
                width: 250,
                modal: true,
                buttons: [ 
                    { text: this.res_sliderToolsControl_save, width: "80", height: "24", click: function () { ok = true; if (updateParam()) $(this).dialog("close"); return false;} },
                    { text: this.res_sliderToolsControl_cancel, width: "80", height: "24", click: function () { ok = false; $(this).dialog("close");  return false;} }
                ],

                close: function () {
                    form[0].reset();
                    $(".validateTips").text("");
                    allFields.removeClass("ui-state-error");
                return false;
                }
            });


            $("#dialog-form_" + this.parentstr).bind("dialogopen", { slPane: this }, function (e, ui) {
                dateTimeBegin = e.data.slPane.dateTimeBegin;
                dateTimeEnd = e.data.slPane.dateTimeEnd;
                return false;
            });

            $("#dialog-form_" + this.parentstr).bind("dialogclose", { slPane: this }, function (e, ui) {
                if (ok == false)
                    return;
                var stepnew = step.val().replace(/_/g, '');
                var intervalnew = interval.val().replace(/_/g, '');
                e.data.slPane.Step = parseInt(stepnew);
                $("#" + e.data.slPane.parentstr).slider("option", "step", e.data.slPane.Step);
                e.data.slPane.Interval = parseInt(intervalnew);

                e.data.slPane.eventUpdateparam(e.data.slPane.Step, e.data.slPane.Interval);
              /*  $(e.data.slPane.slider).trigger({
                    type: 'updateparam',
                    step: stepnew,
                    interval: intervalnew
                });*/
                return false;
            });
        

            $("#end_" + this.parentstr).bind('click', { slPane: this }, function (e) {
                e.data.slPane.stop();
                e.data.slPane.begin_end("end");
                return false;
            });


            form = this.dialog.find("form").on("submit", function (event) {
                event.preventDefault();
                ok = true;
                if (updateParam())
                    $(this).dialog("close");
                return false;
            })

        },

        // функция проигрывания
        play: function (step, service) {
            if (this.dateTimeEnd == null || this.dateTimeBegin == null)
                return;

            var value = $("#" + this.parentstr).slider("value");

            if (step > 0 && value >= +(this.dateTimeEnd) ||
                step < 0 && value <= +(this.dateTimeBegin)) {
                this.stopWithUpdate();
                return;
            }

            value += parseInt(step);
            if (step > 0 && value >= +(this.dateTimeEnd)) {
                this.begin_end("end");
                return;
            }
            else {
                if (step < 0 && value <= +(this.dateTimeBegin)) {
                    this.begin_end("begin");
                    return;
                }
            }

            $("#" + this.parentstr).slider("value", value);

            if (service == null || service == undefined || service == "start" && step < 0) {
                service = "playprocess";
                if (step < 0)
                    service = "playprocess_back"; // шаг вперед*/
            }
            
            if (service == "start")  
               this.isPlay = true;

            this.updateinfo(value, service);
        },

        begin_end: function (direction)  // по умолчанию end
        { 
            if (this.dateTimeEnd == null || this.dateTimeBegin == null ||
                direction == null) return;

            var value = +(this.dateTimeEnd);
            if (direction == "begin")
                value = +(this.dateTimeBegin);

            $("#" + this.parentstr).slider("value", +value);

            this.stopWithUpdate(direction);
        },

        stop: function () {
            this.isPlay = false;
            if (this.timerId != 0) {
                clearTimeout(this.timerId);
                this.timerId = 0;
            }
            $("#play_" + this.parentstr).button("option", {
                label: this.res_sliderToolsControl_play,
                icons: {
                    primary: "ui-icon-play"
                }
            });
            $("#playback_" + this.parentstr).button("option", {
                label: this.res_sliderToolsControl_playback,
                icons: {
                    primary: "ui-icon-playback"
                }
            });
        },
        
        // Принудительный запуск плеера
        startPlay: function () {
            if (this.timerId != 0)  // запущен, ничего не делаем
                return;
            $("#play_" + this.parentstr).click();
        },
        
        // Принудительный останов плеера
        stopPlay: function () {
            if (this.timerId == 0)  // уже остановлен
                return;
             $("#play_" + this.parentstr).click();
        },


        stopWithUpdate: function (direction) {
            this.stop();
            var value = $("#" + this.parentstr).slider("value")
            if (direction == null || direction == undefined)
                direction = "stop";
            this.updateinfo(value, direction);
        },

        // обновить панель плеера
        updatePanel: function (dtBegin, dtEnd, step, interval, currvalue) {
            if (dtBegin == null || dtBegin == null) {
                $('#mapMoviesTrack-labelLeft_' + this.parentstr).text('');
                $('#mapMoviesTrack-labelRight_' + this.parentstr).text('');
                return;
            }

            $('#' + this.parentstr).slider("option", "min", +(dtBegin));
            $('#mapMoviesTrack-labelLeft_' + this.parentstr).text(dtBegin.toLocaleString());
            $('#' + this.parentstr).slider("option", "max", +(dtEnd));
            $('#mapMoviesTrack-labelRight_' + this.parentstr).text(dtEnd.toLocaleString());

            $('#' + this.parentstr).slider("option", "step", +(step));

            var value = new Date(dtBegin);
            if (currvalue != null && currvalue != undefined)
                value = currvalue; //new Date(value);
            $('#' + this.parentstr).slider("value", +(value));
        },

        // Установить текущее значение и остановить проигрывание
        setValueStop: function (value) {
         if (this.timerId != 0) {
                clearTimeout(this.timerId);
                this.timerId = 0;
            }

            this.setValue(value); 
        },

        // Установить текущее значение
        setValue: function (value) {
            var dt = +(value);
            $('#' + this.parentstr).slider("value", dt);
              // Выведем текущее значение
            $('#mapMoviesTrack-labelCenter_' + this.parentstr).text(new Date(dt).toLocaleString());
      },

        // Запросить текущее значение слайдера
        getValue: function () {
            return $('#' + this.parentstr).slider("value");

        },

        opendialog: function () {
            $("#step_" + this.parentstr).val(this.Step);
            $("#interval_" + this.parentstr).val(this.Interval);
            this.dialog.dialog("open");
        },

        updateinfo: function (dt, service, typepoint) {
            // Выведем текущее значение
            $('#mapMoviesTrack-labelCenter_' + this.parentstr).text(new Date(dt).toLocaleString());

            this.eventUpdatedata(dt, service, typepoint);
        },
     
        getSlider: function () {
            return $('#' + this.parentstr);
        },

        getSliderWidget: function () {
            return $('#' + this.parentstr).slider("instance");
        },

        getButton: function (type) {
            if (type == null || type == undefined)
                return null;
            switch (type) {
                case 'beginning':
                    return $("#beginning_" + this.parentstr);  // в начало
                case 'rewind':
                    return $("#rewind_" + this.parentstr);     // шаг назад
                case 'playback':
                    return $("#playback_" + this.parentstr);   // проигывание назад
                case 'play':
                    return $("#play_" + this.parentstr);       // проигрывание вперед
                case 'forward':
                    return $("#forwar_" + this.parentstr);    // шаг вперед
                case 'end':
                    return $("#end_" + this.parentstr);        // в конец
                case 'wrench':
                    return $("#wrench_" + this.parentstr);     // Параметры
                default:
                    return null;
            }

        },

        getButtonWidget: function (type) {
            if (type == null || type == undefined)
                return null;
            switch(type) {
                case 'beginning':
                    return $("#beginning_" + this.parentstr).button("instance");  // в начало
                case 'rewind':
                    return $("#rewind_" + this.parentstr).button("instance");     // шаг назад
                case 'playback':
                    return $("#playback_" + this.parentstr).button("instance");   // проигывание назад
                case 'play':
                    return $("#play_" + this.parentstr).button("instance");       // проигрывание вперед
                case 'forward':
                    return $("#forward_" + this.parentstr).button("instance");    // шаг вперед
                case 'end':
                    return $("#end_" + this.parentstr).button("instance");        // в конец
                case 'wrench':
                    return $("#wrench_" + this.parentstr).button("instance");     // Параметры
                default:
                    return null;
            }

        },

        // События
        eventUpdatedata: function (dt, service, typepoint) {
            $(this.slider).trigger({
                type: 'updatedatasliderToolsControl',
                value: dt,
                service: service
            });
        },
        
        eventUpdateparam: function (stepnew, intervalnew) {
            $(this.slider).trigger({
                type: 'updateparamsliderToolsControl',
                step: stepnew,
                interval: intervalnew
            });
        }

    }
}