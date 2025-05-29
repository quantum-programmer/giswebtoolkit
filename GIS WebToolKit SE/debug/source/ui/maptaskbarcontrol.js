/************************************* Полищук Г.В.    25/06/20 *****
 ************************************* Нефедьева О.    02/09/20 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент управления сворачиванием                  *
 *              окон интерфейса.                                    *
 *                                                                  *
 *******************************************************************/

if (window.GWTK) {

    /**
     * Компонент управления сворачиванием окон интерфейса.
     * Входные методы: addToPanel - создать экземпляр элемента управления
     *                 removeFromPanel - удалить экземпляр элемента управления
     *                 onPanelClose - обработка при закрытии окна; обязательно необходимо вызывать перед показом/закрытием панели, чтобы убрать иконку, если панель свёрнута
     *                 minimizePanel - свернуть окно интерфейса
     *                 restorePanel - восстановить окно интерфейса
     *
     * @class GWTK.MapTaskBarControl
     * @constructor GWTK.MapTaskBarControl
     * @param {GWTK.Map} map
     */
    GWTK.MapTaskBarControl = function (map) {
        if (!map) {
            console.log("GWTK.MapTaskBarControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }
        this.map = map;

        this.toolname = 'maptaskbar';  // имя компонента
        this.addCounter = 0;  // счётчик панелей, на которые добавлено сворачивание
        this.$mapPane = $(map.mapPane);  // панель карты
        this.$eventPane = $(map.eventPane);  // панель событий
        this.init();
    };

    /**
     * Функции объекта GWTK.MapTaskBarControl .
     */
    GWTK.MapTaskBarControl.prototype = {

        /**
         * Инициализировать объект.
         *
         * @method init
         */
        init: function () {
            this.$iconContainer = this.$mapPane.find('.minimize-panel-container');
            if (this.$iconContainer.length === 0) {
                this.$iconContainer = $('<div class="minimize-panel-container" style="position: absolute; right: 10px; bottom: 10px; z-index: 752"></div>');
                this.$iconContainer.appendTo(this.$mapPane);
            }

            this.map.maptools.push(this);
        },

        /**
         * Добавить к заголовку панели иконку сворачивания.
         *
         * @method addToPanel
         * @param {Object} $panel - JQuery-объект панели
         * @param {*} context - контекст для того чтобы родитель мог определить сработавший экземпляр (он или не он)
         * @param {string} iconClass - класс иконки, обозначающей свёрнутую панель
         * @return {string|Boolean} при успехе - идентификатор созданного экземпляра
         *                          при неудаче - false
         */
        addToPanel: function ($panel, context, iconClass) {
            var $panelHeader = $($panel).find('.panel-info-header');

            if ($($panel).length && !$panel.attr('minimize-panel') && $panelHeader.length) {
                var minimizedPanelId = (++this.addCounter).toString();
                $panel.attr('minimize-panel', minimizedPanelId);

                var $panelIcon = $('<div class="minimize-panel-icon" />');
                $panelIcon.append('<svg xmlns="http://www.w3.org/2000/svg" class="info-svg" style="fill-rule: evenodd" viewBox="0 0 24 28"><rect x="5" y="15" width="14" height="2"></rect></svg>');
                $panelIcon.appendTo($panelHeader);

                $panelIcon.on('click', function () {
                    this.minimizePanel(minimizedPanelId, context, iconClass);
                }.bind(this));

                return minimizedPanelId;
            } else {
                return false;
            }
        },

        /**
         * Свернуть панель.
         *
         * @method minimizePanel
         * @param {string} minimizedPanelId - идентификатор панели
         * @param {*} context - контекст для того чтобы родитель мог определить сработавший экземпляр (он или не он)
         * @param {string} iconClass - класс иконки, обозначающей свёрнутую панель
         * @return {Boolean} признак успешного выполнения операции:
         *                      true - сворачивание началось
         *                      false - сворачивание не началось
         */
        minimizePanel: function (minimizedPanelId, context, iconClass) {
            var $panel = $('[minimize-panel="' + minimizedPanelId + '"]');
            if (this.isPanelMinimized($panel)) {
                return false;
            }

            this.$eventPane.trigger('beforeminimizemappanel', { id: minimizedPanelId, context: context });
            $panel.addClass('panel-minimized');

            var panelSize = this.getPanelSize($panel);
            var iconSize = this.getIconSize();
            var $iconBlock = this.createIconBlock(minimizedPanelId);
            var $icon = this.createIcon($panel, iconClass, iconSize).appendTo($iconBlock);
            var $closeIcon = this.createCloseIcon().appendTo($iconBlock);
            var panelCssOriginal = this.getOriginalPanelCss($panel);
            this.setPanelAbsolute($panel);

            this.animateMinimizing({
                objects: {
                    $panel: $panel,
                    $iconBlock: $iconBlock
                },
                sizes: {
                    panelSize: panelSize,
                    iconSize: iconSize
                }
            }, function () {
                $iconBlock.show();
                $panel.hide();
                $panel.css(panelCssOriginal);
            });

            this.listenIconClick($icon, minimizedPanelId, context);
            this.listenCloseClick($closeIcon, $panel, minimizedPanelId, context);

            this.$eventPane.trigger('minimizemappanel', { id: minimizedPanelId, context: context });

            return true;
        },

        /**
         * Проверить, что панель уже свёрнута.
         *
         * @method isPanelMinimized
         * @param {Object} $panel
         * @return {Boolean} - признак того, что панель уже свёрнута
         */
        isPanelMinimized: function ($panel) {
            return $($panel).length === 0 || $panel.hasClass('panel-minimized');
        },

        /**
         * Получить размеры панели.
         *
         * @method getPanelSize
         * @param {Object} $panel
         * @return {{width: number, height: number}}
         */
        getPanelSize: function ($panel) {
            return {
                width: $($panel).outerWidth(false),
                height: $($panel).outerHeight(false)
            };
        },

        /**
         * Получить размеры иконки.
         *
         * @method getIconSize
         * @return {{width: number, height: number}}
         */
        getIconSize: function () {
            return {
                width: 40,
                height: 40
            };
        },

        /**
         * Создать блок для иконки, обзначающей свёрнутую панель.
         *
         * @method createIconBlock
         * @param {string} minimizedPanelId
         * @return {Object}
         */
        createIconBlock: function (minimizedPanelId) {
            var $iconBlock = $('<span/>');
            $iconBlock.addClass('maptaskbar-icon-container');
            $iconBlock.attr({ 'minimize-icon': minimizedPanelId });
            $iconBlock.prependTo(this.$iconContainer);

            return $iconBlock;
        },

        /**
         * Создать иконку.
         *
         * @method createIcon
         * @param {Object} $panel
         * @param {string} iconClass
         * @param {Object} iconSize
         * @return {Object}
         */
        createIcon: function ($panel, iconClass, iconSize) {
            var $icon = $('<div/>');
            var title = $panel.find('.panel-info-header > span').text();
            $icon.attr({ 'title': title });

            $icon.addClass('maptaskbar-icon');
            $icon.addClass(iconClass);

            $icon.css(iconSize);

            return $icon;
        },

        /**
         * Создать крестик-закрывашку.
         *
         * @method createCloseIcon
         */
        createCloseIcon: function () {
            var $closeIcon = $('<div/>');
            $closeIcon.addClass('maptaskbar-icon-close');

            return $closeIcon;
        },

        /**
         * Получить стили оригинальной панели.
         *
         * @method getOriginalPanelCss
         * @param {Object} $panel
         * @return {Object}
         */
        getOriginalPanelCss: function ($panel) {
            return {
                position: $($panel).css('position'),
                left: $($panel).css('left'),
                top: $($panel).css('top'),
                transform: '',
                margin: $($panel).css('margin')
            };
        },

        /**
         * Установить оригинальной панели обсолютное позицинирование.
         *
         * @method setPanelAbsolute
         * @param {Object} $panel
         */
        setPanelAbsolute: function ($panel) {
            $($panel).css({
                position: 'absolute',
                left: $($panel).offset().left - parseFloat($($panel).css('marginLeft')),
                top: $($panel).offset().top - parseFloat($($panel).css('marginTop')),
                transformOrigin: '0 0',
                margin: 0
            });
        },

        /**
         * Анимировать сворачивание.
         *
         * @method animateMinimizing
         * @param {Object} options
         * @param {function} promise
         */
        animateMinimizing: function (options, promise) {
            try {
                options.objects.$panel.length;
                options.objects.$iconBlock.length;
                options.sizes.panelSize.width;
                options.sizes.iconSize.width;
            } catch (e) {
                return;
            }

            var offsetIconBlock = options.objects.$iconBlock.offset();
            var offsetMap = this.$mapPane.offset();
            options.objects.$iconBlock.hide();
            options.objects.$panel.animate({
                left: offsetIconBlock.left - offsetMap.left,
                top: offsetIconBlock.top - offsetMap.top
            }, {
                duration: 'slow',
                easing: 'easeOutSine',
                step: function (now, fx) {
                    var k = (options.sizes.panelSize.width * (1 - fx.pos) + options.sizes.iconSize.width) / (options.sizes.panelSize.width + options.sizes.iconSize.width);
                    $(this).css({ transform: 'scale(' + k + ')' });
                },
                complete: promise
            });
        },

        /**
         * Установить действие при нажатии на иконку свёрнутой панели.
         *
         * @method listenIconClick
         * @param {Object} $icon
         * @param {string} minimizedPanelId
         * @param {*} context
         */
        listenIconClick: function ($icon, minimizedPanelId, context) {
            $icon.on('click', function () {
                this.restorePanel(minimizedPanelId, {
                    context: context
                });
            }.bind(this));
        },

        /**
         * Установить действие при нажатии на иконку-закрывашку.
         *
         * @method listenCloseClick
         * @param {Object} $closeIcon
         * @param {Object} $panel
         * @param {string} minimizedPanelId
         * @param {*} context
         */
        listenCloseClick: function ($closeIcon, $panel, minimizedPanelId, context) {
            $closeIcon.on('click', function () {
                this.onPanelClose($panel);
                $panel.find('.panel-info-header > .panel-info-close').trigger('click');
                this.$eventPane.trigger('closeminimizedmappanel', { id: minimizedPanelId, panel: $panel, context: context });
            }.bind(this));
        },

        /**
         * Восстановить панель.
         *
         * @method restorePanel
         * @param {string} minimizedPanelId - идентификатор панели
         * @param {Object} options - настройки:
         *        {function} options.fn_callback - функция обратного вызова после анимации.
         *        {*} options.context - контекст для того чтобы родитель мог определить сработавший экземпляр (он или не он)
         */
        restorePanel: function (minimizedPanelId, options) {
            if (typeof options !== 'object' || options === null) {
                options = {};
            }

            var $panel = $('[minimize-panel="' + minimizedPanelId + '"]');
            var $iconContainer = $('[minimize-icon="' + minimizedPanelId + '"]');
            if (($panel.length === 0) || ($iconContainer.length === 0)) {
                return;
            }

            $panel.removeClass('panel-minimized');
            $panel.show();
            if (typeof options.fn_callback === 'function') {
                options.fn_callback();
            }
            this.$eventPane.trigger('restoremappanel', { id: minimizedPanelId, context: options.context });
            this.$eventPane.trigger({type:'notifyrestorepanel', panel: $panel, context: options.context} );

            $iconContainer.remove();
        },

        /**
         * Убрать сворачивание.
         * Восстановить панель, если свёрнута. В этом случае выполнение функции отложено после разворачивания панели.
         * Удалить иконку с панели.
         *
         * @method removeFromPanel
         * @param {string} minimizedPanelId - индекс экземпляра в списке this.instances
         * @param {Boolean} forceQuick - быстро удалить, без задержек на восстановление панелей
         * @param {*} context - контекст, необходим для определения сработавшего экземпляра (он или не он)
         */
        removeFromPanel: function (minimizedPanelId, forceQuick, context) {
            var $panel = $('[minimize-panel="' + minimizedPanelId + '"]');
            if (!$panel.length) {
                return;
            }

            if (!forceQuick && $panel.hasClass('panel-minimized')) {
                this.restorePanel(minimizedPanelId, {
                    fn_callback: function () {
                        this.removeFromPanel(minimizedPanelId, false, context);
                    }.bind(this),
                    context: context
                });
                return;
            }

            $panel.removeAttr('minimize-panel');
            $panel.find('.minimize-panel-icon').remove();
            $('[minimize-icon="' + minimizedPanelId + '"]').remove();
        },

        /**
         * Действие при закрытии панели.
         * Должно вызываться породившим модулем перед закрытием окна, чтобы убрать иконку, если она есть.
         *
         * @method onPanelClose
         * @param {Object} $panel - JQuery-объект панели
         */
        onPanelClose: function ($panel) {
            $($panel).removeClass('panel-minimized');
            var minimizedPanelId = $($panel).attr('minimize-panel');
            if (minimizedPanelId) {
                $('[minimize-icon="' + minimizedPanelId + '"]').remove();
            }
        },

        /**
         * Удалить экземпляры. Деструктор. Собственные данные не удаляются, только порождённые.
         * Полное удаление делается дополнительно, извне, удалением данного объекта: delete instance.
         *
         * @method destroy
         */
        destroy: function () {
            this.$iconContainer.find('.maptaskbar-icon').each(function () {
                $(this).trigger('click');
            });
            this.$iconContainer.remove();
        }

    };

}