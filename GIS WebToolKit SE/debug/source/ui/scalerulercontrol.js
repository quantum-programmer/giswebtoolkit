/***************************************** Полищук Г.В.  09/02/21 ***
/***************************************** Нефедьева О.  30/11/17 ***
/***************************************** Соколова Т.О. 08/02/17 ***
/***************************************** Гиман Н.Л     26/05/16 ***
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент Линейный масштаб                      *
 *                                                                  *
 *******************************************************************/
if(window.GWTK) {
    GWTK.ScaleRulerControl = function (map) {
        this.map = map;                          // объект карты
        if (!this.map) {
            console.log("GWTK.ScaleRulerControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.toolname = "scalerulercontrol";     // имя инструмента
        this.map.maptools.push(this);            // добавление в иструменты
        this.ruler = null;                       // html объект линейки
        this.rulerContainer = null;              // html объект контейнера линейки
        this.ruleroptions = {                    // параметры линейки
            maxWidth: 100,
            reductionCoefficient: 0.00027,
            metric: true
        };

        this.init();                        //инициализация
    };

    GWTK.ScaleRulerControl.prototype = {
        //инициализация
        init: function () {
            this.createRuler();
            var that = this;
            this.updateRulerValue();

            $(this.map.eventPane).on("overlayRefresh.rulerhead", function () {
                that.updateRulerValue();
            });
        },

        /**
         * Обновить линейный масштаб.
         * Алгоритм:
         *  - производится проверка настроек и ширины карты во избежание ошибок;
         *  - извлекается знаменатель текущего масштаба - коэффициент уменьшения карты;
         *  - вычисляется ширина карты (метры) путём произведения следующих множителей:
         *      - полученного масштаба;
         *      - ширины экрана;
         *      - коэффициента приведения ширины экрана в метры;
         *      - коэффициента искажения по проекции на широте центра карты;
         *  - вычисляется ширина линейки (метры) путём произведения ширины карты и ограничения по заданным настройкам;
         *  - вычисляется число для линейки путём округления;
         *  - корректируется ширина UI-элемента линейки с учётом искажения из-за округления;
         *  - устанавливается значение UI-элемента в метрах или километрах.
         */
        updateRulerValue: function () {
            var sizeX = this.map.getWindowSize()[0];
            if (this.ruleroptions.metric && sizeX > 0) {
                var scale = GWTK.TileMatrixSets[this.map.options.tilematrixset].scales[this.map.options.tilematrix];
                var widthMeters = scale * sizeX * this.ruleroptions.reductionCoefficient * Math.cos(this.map.options.center.lat * Math.PI / 180);
                var rulerMeters = widthMeters * (this.ruleroptions.maxWidth / sizeX);
                var rulesMetersStrLen = (Math.floor(rulerMeters) + '').length;
                var pow10 = Math.pow(10, rulesMetersStrLen - 1);
                var number = rulerMeters / pow10;
                var numberRounded = 1;
                if (number >= 10) {
                    numberRounded = 10;
                } else if (number >= 5) {
                    numberRounded = 5;
                } else if (number >= 3) {
                    numberRounded = 3;
                } else if (number >= 2) {
                    numberRounded = 2;
                }
                var meters = pow10 * numberRounded;
                this.ruler.style.width = Math.round(this.ruleroptions.maxWidth * meters / rulerMeters) + 'px';
                if (meters < 1000) {
                    this.ruler.innerHTML = meters + ' ' + w2utils.lang('m');
                } else {
                    this.ruler.innerHTML = meters / 1000 + ' ' + w2utils.lang('km');
                }
            }
        },

        // Cоздать линейку
        createRuler: function () {
            this.ruler = document.createElement('div');
            this.ruler.id = "rulercontrol-id";
            this.rulerContainer = document.createElement('div');
            this.rulerContainer.id = "rulercontrol-container-id";
            this.rulerContainer.className = "scale-pane-node";
            this.rulerContainer.appendChild(this.ruler);
            this.map.tableScaleContainer.appendChild(this.rulerContainer);
        },

        // Деструктор
        destroy: function () {
            $(this.map.eventPane).off("overlayRefresh.rulerhead");
            $(this.rulerContainer).empty().remove();
        }
    };

 /*******************************************************************
 *                                                                  *
 *                      Статус бар                                  *
 *                                                                  *
 *******************************************************************/

    GWTK.StatusBarControl = function (map) {
        this.map = map;                     //объект карты
        this.toolname = "statusbarcontrol"; //нименование инструмента
        this.map.maptools.push(this);       //добавление в иструменты
        this.$statusbarContainer = null;
        this.init();                        //инициализация
    };


    GWTK.StatusBarControl.prototype = {

        // инициализация
        init: function () {
            this.createStatusBar().hide();
        },

        // установить текст
        set: function (message) {
            if (!message) return;
            this.$statusbarContainer.text(message).show();
        },

        // очистить строку 
        clear: function () {
            this.$statusbarContainer.hide();
        },

        // установить текст
        setText: function (message) {
            if (!message) return;
            $('#statusbarcontrol-container-id').text(message).show();
        },

        // очистить строку 
        clearText: function () {
            $('#statusbarcontrol-container-id').hide();
        },

        destroy: function () {
            this.$statusbarContainer.remove();
        },

        //создание линейки
        createStatusBar: function () {

            // var block = document.createElement('div');
            // block.id = "block";
            // block.className = "block";
            // this.map.tableScaleContainer.appendChild(block);

            var statusbarContainer = document.createElement('div');
            statusbarContainer.id = "statusbarcontrol-container-id";
            statusbarContainer.className = "panel-statusbar";
            this.map.tableScaleContainer.appendChild(statusbarContainer);
            return this.$statusbarContainer = $(statusbarContainer);

        }
    }

}
