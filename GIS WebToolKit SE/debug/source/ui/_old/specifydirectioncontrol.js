/************************************* Полищук Г.В.    08/10/18 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2018              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Элемент управления для выбора                       *
 *              направления при помощи указателя.                   *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     * Элемент управления для выбора направления при помощи указателя.
     * Входные методы: createInstance - создать экземпляр;
     *                 removeFromPanel - удалить экземпляр;
     *                 setValue - установить значение.
     *
     * @class GWTK.SpecifyDirectionControl
     * @constructor GWTK.SpecifyDirectionControl
     */
    GWTK.SpecifyDirectionControl = function () {

        this.instances = [];  // список экземпляров
        this.init();

    };

    /**
     * Функции объекта GWTK.SpecifyDirectionControl .
     */
    GWTK.SpecifyDirectionControl.prototype = {

        /**
         * Инициализировать объект.
         *
         * @method init
         */
        init: function () {
        },

        /**
         * Создать экземпляр элемента управления.
         *
         * @method createInstance
         * @param params {object} данные; будут добавлены в массив созданных экземпляров this.instances
         *        params.$iconContainer {object} где разместить - обязательный параметр
         *        params.fn_callback {function} функция обратного вызова для возврата итога - обязательный параметр
         *        params.imgSrc {string} путь к картинке
         *        params.imgWidth {float} ширина картинки
         *        params.imgHeight {float} высота картинки
         *        params.value {float} изначальное значение вращения по часовой стрелке - по умолчанию ноль (север)
         *        params.attachFormField {object} обратная связь с формой:
         *                      formName {string} название w2ui-формы
         *                      formField {string} название поля формы
         *                      $field {JQuery} поле формы
         * @return {number|boolean} индекс добавленного экземпляра или false при неудаче
         */
        createInstance: function (params) {

            // Проверка необходимых данных
            if (typeof params !== 'object') {
                return false;
            }
            if (!(params.$iconContainer instanceof $)) {
                // Контейнер должен быть экземпляром JQuery
                return false;
            }
            if (typeof params.fn_callback !== 'function') {
                // Функция обратного вызова должна быть указан
                return false;
            }
            if (params.$iconContainer.find('.specify-direction').length) {
                // Защита от повторного создания
                return false;
            }

            // Настройки картинки
            params.imgSrc = params.imgSrc || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAQAAACQqPihAAACY' +
                'ElEQVR42mIY6mAUNDDtMAKwWvYgbcRhHCbd9x13aOnqvrmjO5ymH1A6dnJpHDpowQaDS6d2NQVDc78cdjmjlEBTOHAJaG3pR8Caa' +
                '9EGe/dUrIiay//NpX3eLSF5ePm/X/Wiv+ivKVBTgb/mL9aLr2/P3/hvCk2qoq4IaNImYoeINk0ChLqqaPKfFfUpbYmQThL30oQrp' +
                'KefdZIQoa361NiK9QnVRIvDn7g4/b6FUG19YgyJP61eyMERI3FwFKKeP51LUSj4CyJKkxNGJjmJUuEvFAojS7TSYL9Pbvb7DbQyo' +
                'kilBl+PGYfT3zVQaRTJjPjozKRvZCQ0Y1dXHKU4SHiJmyhVbFSdaiHuh4+4y7FRDCGquZvRLOHneGya5S0cDavtFm5OeIDHIhYtt' +
                'D18dpkd/w4PjzkOsSaDGDLrVAmxWMU7C2ERokrmqFe3k+Ckz/1zzWMsOom6GWtCt0Qc4+Qt3kV8xk0ci/rNwSorBqRGNuVLmipu0' +
                'iSgXhzMZqmJmyPuXNI8wqKJlgY11TZuNvGuRAc3bVQd0PgbEW6eXtO8wE2Ev5HRmju4+MHcNc1DfuNiB23nzuYN3kC8z5+N9TZPM' +
                'jSrud/GqLTvzGZo7vErZ6UZfSO8zGjafZNnCpSGaJbMKZBjpn3DGxJz9IyZlmNCr1/87SzLtFi+9FJBjglt7Jv5c8UzdvnL7oWql' +
                'GvfOLbnpzNFmT3Ouab6kmN7Om6BKmU+kM0eZV5h3wL2ZWMvZPuyse80G/tOG+vq5M9Ia3XSvw1N/x4B5f0bevXW6N/3pH9PmvJxA' +
                'XqMcgxxMAoA66Kwqpw16yIAAAAASUVORK5CYII=';
            params.imgWidth = params.imgWidth || 51;
            params.imgHeight = params.imgHeight || 51;
            // Вставка картинки
            params.$img = $('<img src="' + params.imgSrc + '" class="specify-direction" width="' + params.imgWidth + 'px" height="' + params.imgHeight + 'px" style="cursor: pointer" />');
            params.$iconContainer.append(params.$img);

            // Обработка изначального значения
            params.value = parseFloat(params.value);
            if (isNaN(params.value)) {
                params.value = 0;
            }
            this._updateRotating(params, params.value);

            // Нажатие по картинке
            params.$img.on('mousedown', GWTK.Util.bind(function (event) {

                params.start = true;
                params.newValue = params.value;
                // Координаты центра
                params.xC = params.$img.offset().left - $(window).scrollLeft() + (params.imgWidth / 2);
                params.yC = params.$img.offset().top - $(window).scrollTop() + (params.imgHeight / 2);
                // Угол относительно центра
                params.startDeg = this._calcDeg([ params.xC, params.yC ], [ event.pageX, event.pageY ]);

            }, this));

            var $body = $('body');
            $body.on('mousemove', GWTK.Util.bind(function (event) {

                if (!params.start) {
                    return;
                }

                event.stopPropagation();

                // Угол относительно центра
                var deg = this._calcDeg([ params.xC, params.yC ], [ event.pageX, event.pageY ]);
                // Применение нового значения вращения
                params.newValue = (params.value + deg - params.startDeg + 360) % 360;
                this._updateRotating(params, params.newValue);
                // Возврат значения
                params.fn_callback(Math.round(params.newValue * 100) / 100);

            }, this));

            $body.on('mouseup', GWTK.Util.bind(function () {

                if (!params.start) {
                    return;
                }
                params.start = false;

                // Возврат итогового значения вращения
                params.value = params.newValue;
                params.fn_callback(Math.round(params.value * 100) / 100);

            }, this));

            // Добавление экземпляра и получение его порядкового номера
            this.instances.push(params);
            var id = this.instances.length - 1;

            // Обратная связь с формой
            if (typeof params.attachFormField === 'object') {
                // Слежение за вводом в поле
                params.attachFormField.$field.on('input', GWTK.Util.bind(function (event) {
                    this.setValue(id, event.target.value);
                }, this));
                // Первоначальная установка
                this.setValue(id, w2ui[params.attachFormField.formName].record[params.attachFormField.fieldName]);
                // Слежение за изменением через форму
                w2ui[params.attachFormField.formName].on('change', GWTK.Util.bind(function (event) {
                    if (event.target === params.attachFormField.fieldName) {
                        this.setValue(id, event.value_new);
                    }
                }, this));
            }

            return id;

        },

        /**
         * Получение градуса точки point относительно точки center.
         * Исходные рассчётные формулы опубликованы на ресурсе:
         * https://php.ru/forum/threads/naxozhdenija-ugla-0-360-po-koordinatam-tochki-i-centra.37538/
         *
         * @method _calcDeg
         * @param center {object} координаты центра отсчёта [ x, y ]
         * @param point {object} координаты точки [ x, y ]
         * @return {number} угол от 0 до 360
         * @private
         */
        _calcDeg: function (center, point) {

            var x = point[0] - center[0];
            var y = point[1] - center[1];
            if (x === 0) {
                return (y > 0) ? 180 : 0
            }
            var a = Math.atan(y / x) * 180 / Math.PI;
            a = (x > 0) ? a + 90 : a + 270;
            return a;

        },

        /**
         * Обновить вращение картинки.
         *
         * @method _updateRotating
         * @param params {object} настройки экземпляра
         * @param value {number} градусы по часовой стрелке
         * @private
         */
        _updateRotating: function (params, value) {

            params.$img.css({ transform: 'rotate(' + value + 'deg)' });

        },

        /**
         * Установить значение вращения.
         *
         * @method setValue
         * @param id {object} индекс экземпляра
         * @param value {string} значение
         */
        setValue: function (id, value) {

            // Проверка данных
            var instance = this.instances[id];
            if (!instance) {
                return;
            }
            var intValue = (parseInt(value, 10) + 360) % 360;
            if (isNaN(intValue)) {
                return;
            }

            instance.value = intValue;
            this._updateRotating(instance, intValue);

        },

        /**
         * Удалить экземпляр.
         *
         * @method removeFromPanel
         * @param id {string} индекс экземпляра в списке this.instances
         */
        removeInstance: function (id) {

            var instance = this.instances[id];
            if (!instance) {
                return;
            }

            instance.$iconContainer.remove();

        },

        /**
         * Удалить экземпляры. Деструктор. Собственные данные не удаляются, только порождённые.
         * Полное удаление делается дополнительно, извне, удалением данного объекта: delete instance.
         *
         * @method destroy
         */
        destroy: function () {

            for (var i in this.instances) {
                this.removeInstance(i);
            }

        }

    };

}