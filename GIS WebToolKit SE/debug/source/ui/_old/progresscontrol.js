/************************************* Полищук Г.В.    08/10/18 *****
 ************************************* Гиман Н.Л.      03/11/17 *****
 ************************************* Соколова Т.О.   09/10/17 *****
 ************************************* Нефедьева О.А.           *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент управления входными данными.              *
 *              Индикатор загрузки данных.                          *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     * Индикатор загрузки данных.
     * Точки входа:
     *      setNewProcess - добавить процесс
     *      deleteProcess - удалить процесс
     * Основная информация дана в методе setNewProcess.
     *
     * @package GWTK
     * @class GWTK.ProgressControl
     * @constructor GWTK.ProgressControl
     * @param map {object} объект карты
     */
    GWTK.ProgressControl = function (map) {

        this.map = map;
        this.toolname = "progresscontrol";
        this.regOptionsProc = {};  // список действующих процессов

        // Стилевое оформление по умолчанию. Может быть указано в настройках нового процесса (см. setNewProcess)
        this.layoutCss = { position: 'relative', height: 35 };
        this.barCss = { position: 'absolute', height: 25, top: 4, right: 20, left: 0 };
        this.headerCss = { lineHeight: 0, textAlign: 'center', color: '#666', padding: '8px 0 10px', fontSize: 11,
            fontFamily: 'Verdana, Arial, sans-serif', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };
        this.closeCss = { position: 'absolute', top: 8, right: 0, lineHeight: 0 };

        this.init();

    };

    GWTK.ProgressControl.prototype = {

        /**
         * Инициализировать компонент.
         *
         * @method init
         */
        init: function () {

            this.map.maptools.push(this);

        },

        /**
         * Добавить процесс.
         *
         * @method setNewProcess
         * @param process {object} настройки процесса
         *        process.$container - контейнер для отображения хода процесса - по умолчанию mapPane карты
         *        process.processName - название процесса для отображения пользователю
         *        process.url - url-адрес сервиса - по умолчанию из настроек карты
         *        process.data - параметры запроса (на сервер) - ОБЯЗАТЕЛЬНЫЙ ПАРАМЕТР
         *        process.type - тип отправляемого запроса - по умолчанию GET
         *        process.dataType - тип принимаемых данных - по умолчанию HTML
         *        process.timer - интервал отправки запроса в миллисекундах - по умолчанию секунда
         *        process.callBack - функция обратного вызова для передачи ответа после завершения процесса - ОБЯЗАТЕЛЬНЫЙ ПАРАМЕТР
         *        process.callBackValue - функция для извлечения значения из полученных данных
         *        process.callBackError - функция для возврата ошибки
         *        process.layoutCss - стили для слоя процесса; если не указать, унаследуются от значений по умолчанию
         *        process.barCss - стили для хода процесса; если не указать, унаследуются от значений по умолчанию
         *        process.headerCss - стили для заголовка процесса; если не указать, унаследуются от значений по умолчанию
         *        process.closeCss - стили для закрытия процесса; если не указать, унаследуются от значений по умолчанию
         * @return {object} дополненные настройки процесса
         */
        setNewProcess: function (process) {

            // Установить значения по умолчанию
            process.url = process.url || this.map.options.url;
            process.type = process.type || 'GET';
            process.dataType = process.dataType || 'html';
            process.timer = process.timer || 1000;
            process.callBack = process.callBack || this.callBack;
            process.callBackValue = process.callBackValue || this.callBackValue;
            process.callBackError = process.callBackError || this.callBackError;

            // Установить стили для оформления
            process.layoutCss = process.layoutCss || this.layoutCss;
            process.barCss = process.barCss || this.barCss;
            process.headerCss = process.headerCss || this.headerCss;
            process.closeCss = process.closeCss || this.closeCss;

            // Создать идентификатор для процесса.
            // Добавить настройки процесса в массив.
            process.pid = this.toolname + GWTK.Util.randomInt(1, 99999999);
            this.regOptionsProc[process.pid] = process;

            // Добавить вёрстку процесса в контейнер
            this._addPanel(process);

            // Начать очередь запросов
            this._iterate(process);

            return process;

        },

        /**
         * Передать ответ после завершения процесса.
         *
         * @method callBack
         * @abstract
         * @param response {string} ответ сервера
         */
        callBack: function (response) {

            console.log('В параметр callBack необходимо передать функцию.', response);

        },

        /**
         * Обработать ответ сервера.
         * Извлечь процент выполнения.
         * Предполагается, что ответ пришёл в виде XML.
         *
         * @method callBackValue
         * @abstract
         * @param response {string} ответ сервера
         * @return {number|NaN} процент выполнения
         */
        callBackValue: function (response) {

            try {
                var $doc = $.parseXML(response),
                    $xml = $($doc),
                    member = $xml.find('member'),
                    xname = member.find('name'),
                    valTeg = member.find('value');
                if (xname.text() === 'Procent') {
                    return parseInt(valTeg.find('string').text());
                }
            } catch (error) {
                console.log(error);
            }

            return NaN;

        },

        /**
         * Обработать неудачный ответ сервера.
         *
         * @method callBackError
         * @abstract
         * @param response {string} ответ сервера
         */
        callBackError: function (response) {

            console.log(response);
            w2alert(w2utils.lang("Failed to get data"));

        },

        /**
         * Повторить запрос до получения 100% выполнения процесса.
         *
         * @method _iterate
         * @param process {object} настройки процесса
         * @private
         */
        _iterate: function (process) {

            if (!process) {
                return;
            }

            var now = (new Date()).getTime();
            if (process.lastTime) {
                // Время предыдущего запроса известно
                if (process.lastTime + process.timer > now) {
                    // Время ещё не подошло? Повтор после задержки.
                    setTimeout(GWTK.Util.bind(function () {
                        this._iterate(process);
                    }, this), process.lastTime + process.timer - now);
                    return;
                }
            }
            process.lastTime = now;  // время отправки запроса сохраняется в объект

            $.ajax({
                type: process.type,
                url: process.url,
                dataType: process.dataType,
                data: process.data,
                success: GWTK.Util.bind(function (response) {

                    // Процесс остановлен или завершён
                    if (process.stop) {
                        return;
                    }

                    // Извлечь значение из ответа и проверить на допустимые пределы
                    var newVal = parseInt(process.callBackValue(response), 10);
                    if (isNaN(newVal) || newVal > 100) {
                        newVal = 100;
                    }
                    if (newVal < 0) {
                        newVal = 0;
                    }
                    this._animateProcess(process, newVal);

                    if (newVal === 100) {
                        // Процесс завершён. Отметка о времени окончания анимации.
                        response._animationFinishedAt = process.lastTime + process.timer;
                        process.callBack(response, 'success');
                    } else {
                        this._iterate(process);
                    }

                }, this),
                error: GWTK.Util.bind(function (response) {

                    this._animateProcess(process, 100);
                    process.callBackError(response);

                }, this)
            });

        },

        /**
         * Создать вёрстку для нового процесса.
         * При необходимости создать контейнер.
         * Сохраняет элементы вёрстки и контейнер в объекте process - для удаления по окончании процесса.
         * Сохраняет элемент jQuery.progressbar в process.$bar - для дальнейшего его изменения.
         *
         * @method _addPanel
         * @param process {object} настройки процесса
         *        process.$container {null|object} Контейнер для вёрстки работы процесса.
         *                                         Если не указать, то возьмёт/создаст контейнер в mapPane.
         *        process.processName {string} имя процесса для отображения пользователю
         * @private
         */
        _addPanel: function (process) {

            // Заголовок
            var $header = $('<header />').css(process.headerCss).text(process.processName);
            // Показатель процесса
            process.$bar = $('<div />').css(process.barCss).append($header).progressbar({ value: 0 });

            // Крестик
            var $closeImg = $('<img src="' + GWTK.imgClose + '" title="' + w2utils.lang('Close') + '" />')
                .on('click', GWTK.Util.bind(function () {
                    process.callBack(null, 'abort');
                    this.deleteProcess(process);
                }, this));
            // Закрывашка
            var $close = $('<div />').css(process.closeCss).append($closeImg);

            // Вёрстка для процесса
            process.$layout = $('<div />').css(process.layoutCss).append([ process.$bar, $close ]);

            // Контейнер не указан. Создать.
            if (!process.$container) {
                // Поиск на карте
                process.$container = $(this.map.mapPaneOld).find('.panel-loader-info');
                if (!process.$container.length) {
                    // Не существует, добавление на карту
                    process.$container = $('<div class="panel-loader-info" id="loader-process-wrapper-id"></div>');
                    $(this.map.mapPaneOld).append(process.$container);
                }
            }

            // Добавить вёрстку процесса в контейнер
            process.$container.show().append(process.$layout);

        },

        /**
         * Анимировать указатель выполнения процесса до указанного значения.
         * Сохранить новое значение в объект.
         *
         * @method _animateProcess
         * @param process {object} настройки процесса
         * @param newVal {number} новое значение
         * @private
         */
        _animateProcess: function (process, newVal) {

            if (!process) {
                return;
            }

            // Последнее значение
            var lastVal = parseInt(process.val, 10) || 0;

            process.$bar.stop(true, true)
                .animate({ opacity: 1 }, {
                    duration: process.timer,
                    easing: 'linear',
                    step: function (now, fx) {
                        var value = lastVal + (newVal - lastVal) * fx.pos;
                        $(fx.elem).progressbar({ value: value }).find('header').text(process.processName + ': ' + Math.round(value) + '%');
                        process.val = newVal;
                    },
                    complete: GWTK.Util.bind(function () {
                        // Автоматическое удаление после завершения
                        if (newVal === 100) {
                            this.deleteProcess(process);
                        }
                    }, this)
                });

        },

        /**
         * Удалить процесс.
         * Удалить связь с функциями обратного вызова.
         * Скрыть контейнер, если в нём больше нет процессов.
         *
         * @method deleteProcess
         * @param process {object} настройки процесса
         */
        deleteProcess: function (process) {

            if (!process) {
                return;
            }

            process.stop = true;
            process.$layout.remove();
            process.callback = process.callBackValue = process.callBackError = function () {};

            if (process.$container.is(':empty')) {
                process.$container.hide();
            }

        },

        /**
         * Деструктор.
         * Удалить порождённые процессы.
         *
         * @method destroy
         */
        destroy: function () {

            for (var i in this.regOptionsProc) {
                this.deleteProcess(this.regOptionsProc[i]);
            }

        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method animateProgressBar
         * @param pid {string} идентификатор процесса
         * @param fn_callback {function|null} функция обратного вызова после завершения анимации
         * @deprecated
         */
        animateProgressBar: function (pid, fn_callback) {

            if (typeof fn_callback === 'function') {
                this.regOptionsProc[pid].callBack = fn_callback;
            }
            this._animateProcess(this.regOptionsProc[pid], 100);

        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method createInformationPane
         * @deprecated
         */
        createInformationPane: function () {
        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method addProcess
         * @deprecated
         */
        addProcess: function () {
        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method setLoaderValue
         * @param pid {string} идентификатор процесса
         * @param newVal {number} новое значение
         * @deprecated
         */
        setLoaderValue: function (pid, newVal) {

            this._animateProcess(this.regOptionsProc[pid], newVal);

        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method setContainerForPane
         * @deprecated
         */
        setContainerForPane: function () {
        },

        /**
         * Оставлено для совместимости с предыдущими версиями.
         *
         * @method deleteProcc
         * @param pid {string} идентификатор процесса
         * @deprecated
         */
        deleteProcc: function (pid) {

            this.deleteProcess(this.regOptionsProc[pid]);

        }

    };

}

