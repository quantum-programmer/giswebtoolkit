/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент пользовательского ввода                   *
 *                                                                  *
 *******************************************************************/

import DomEvent from '~/dom/DomEvent';
import PixelPoint from '~/geometry/PixelPoint';

type CustomEventHandler = ( e: MouseDeviceEvent ) => void;

export type MouseDeviceEvent = {
    mousePosition: PixelPoint;
    pressedMouseButtonList: MouseDevice['buttonPressedList'];
    wheelDelta?: number;
    mapdrag?: MouseDevice['mapdrag'];
    originalEvent: MouseEvent;
}

/**
 * Список клавиш мыши
 * @enum MouseButton
 */
export enum MouseButton {
    Left,
    Middle,
    Right
}

/**
 * Список типов событий
 * @enum MouseEventType
 */
export enum MouseEventType {
    Click = 'onmouseclick',
    ContextMenu = 'oncontextmenu',
    CursorMove = 'oncursormove',
    DelayedClick = 'onmouseclickdelayed',
    DoubleClick = 'onmousedblclick',
    MapDrag = 'onmapdrag',
    MouseDown = 'onmousedown',
    MouseLeave = 'onmouseleave',
    MouseMove = 'onmousemove',
    MouseUp = 'onmouseup',
    RightClick = 'onmouserightclick',
    Wheel = 'onmousewheel'
}

/**
 * Задержка блокировки второго клика (ожидание двойного)
 * @property {number} DOUBLE_CLICK_DELAY
 */
const DOUBLE_CLICK_DELAY = 400;

/**
 * Минимальное смещение по X для перемещения
 * @property {number} MIN_DRAG_DELTA_X
 */
const MIN_DRAG_DELTA_X = 6;

/**
 * Минимальное смещение по Y для перемещения
 * @property {number} MIN_DRAG_DELTA_Y
 */
const MIN_DRAG_DELTA_Y = 6;

/**
 * Компонент ввода с мыши
 * @class MouseDevice
 */
export default class MouseDevice {

    /**
     * Ссылка на таймер
     * @private
     * @property {object} preventClickTimer
     */
    private preventClickTimer?: number;

    /**
     * Флаг предотвращения повторного клика при двойном
     * @private
     * @property {boolean} preventClick
     */
    private preventClick = false;
    /**
     * Флаг предотвращения повторного клика при перемещении
     * @private
     * @property {boolean} preventClickByMove
     */
    private preventClickByMove = false;

    /**
     * Метка времени последней прокрутки колеса
     * @private
     * @property {number} lastWheelScalingTime
     */
    private lastWheelScalingTime = window.performance.now();

    /**
     * Панель для отлавливания событий
     * @private
     * @readonly
     * @property {HTMLDivElement} eventPane
     */
    private readonly eventPane: HTMLDivElement;

    //todo: удалить после полного перехода на taskManager
    private readonly oldPane: HTMLDivElement;

    /**
     * Положение курсора при последнем нажатии
     * @private
     * @readonly
     * @property {Point} mouseDownPosition
     */
    private readonly mouseDownPosition = new PixelPoint( 0, 0 );
    /**
     * Положение курсора при последнем нажатии левой клавиши или в процессе перетаскивания
     * @private
     * @readonly
     * @property {Point} leftButtonPreviousPosition
     */
    private readonly leftButtonPreviousPosition = new PixelPoint( 0, 0 );
    /**
     * Положение курсора
     * @private
     * @readonly
     * @property {Point} mouseCurrentPosition
     */
    private readonly mouseCurrentPosition = new PixelPoint( 0, 0 );
    /**
     * Список состояний клавиш
     * @private
     * @readonly
     * @property {object} buttonPressedList
     */
    private readonly buttonPressedList: { [key in MouseButton]: boolean; } = {
        0: false,
        1: false,
        2: false
    };
    /**
     * Объект перетаскивания
     * @private
     * @readonly
     * @property {object} mapdrag
     */
    private readonly mapdrag = {
        deltaX: 0,
        deltaY: 0
    };
    /**
     * Объект события
     * @private
     * @readonly
     * @property {MouseDeviceEvent} mouseEvent
     */
    private readonly mouseEvent: MouseDeviceEvent = {
        mousePosition: this.mouseCurrentPosition,
        pressedMouseButtonList: this.buttonPressedList,
        mapdrag: undefined,
        originalEvent: new MouseEvent( '' )
    };
    /**
     * Список подписчиков событий
     * @private
     * @readonly
     * @property {object} subscribers
     */
    private readonly subscribers: { [key in MouseEventType]: CustomEventHandler[]; } = {
        onmousedown: [],
        onmouseup: [],
        onmousemove: [],
        oncursormove: [],
        onmousedblclick: [],
        onmouseclick: [],
        onmousewheel: [],
        onmouseleave: [],
        oncontextmenu: [],
        onmouserightclick: [],
        onmapdrag: [],
        onmouseclickdelayed: []
    };

    /**
     * @constructor MouseDevice
     * @param eventPane {HTMLElement} Панель событий
     * @param oldPane {HTMLElement} Старая панель событий
     */
    constructor( eventPane: HTMLDivElement, oldPane: HTMLDivElement ) {
        eventPane.addEventListener( 'mousedown', this.onmousedown.bind( this ) );
        eventPane.addEventListener( 'mouseup', this.onmouseup.bind( this ) );
        eventPane.addEventListener( 'click', this.onmouseclick.bind( this ) );
        eventPane.addEventListener( 'dblclick', this.onmousedblclick.bind( this ) );
        eventPane.addEventListener( 'mousemove', this.onmousemove.bind( this ) );
        eventPane.addEventListener( 'wheel', this.onmousewheel.bind( this ), { capture: true, passive: true } );
        eventPane.addEventListener( 'mouseleave', this.onmouseleave.bind( this ) );
        eventPane.addEventListener( 'contextmenu', this.oncontextmenu.bind( this ) );

        this.eventPane = eventPane;

        this.oldPane = oldPane;
    }

    /**
     * Обновление положения курсора (пересчет в границах элемента)
     * @private
     * @method updateEventObject
     * @param event {MouseEvent} Объект события мыши
     */
    private updateEventObject( event: MouseEvent ) {
        this.mouseEvent.originalEvent = event;

        const rect = this.eventPane.getBoundingClientRect();

        this.mouseCurrentPosition.x = Math.floor( event.clientX - rect.left - this.eventPane.clientLeft );
        this.mouseCurrentPosition.y = Math.floor( event.clientY - rect.top - this.eventPane.clientTop );
    }

    /**
     * Обработчик свободного перемещения курсора
     * @private
     * @method cursorMove
     * @param mouseEvent {MouseEvent} Объект события мыши
     */
    private cursorMove( mouseEvent: MouseDevice['mouseEvent'] ) {
        if ( !this.buttonPressedList[ MouseButton.Left ] && !this.buttonPressedList[ MouseButton.Right ] ) {
            const handlers = this.subscribers[ MouseEventType.CursorMove ];
            for ( let i = 0; i < handlers.length; i++ ) {
                handlers[ i ]( mouseEvent );
            }
        }
    }

    /**
     * Обработчик нажатия клавиши мыши
     * @method onmousedown
     * @private
     */
    private onmousedown( event: MouseEvent ) {
        const button = event.button as MouseButton;
        this.buttonPressedList[ button ] = true;

        this.updateEventObject( event );

        this.mouseDownPosition.x = this.mouseCurrentPosition.x;
        this.mouseDownPosition.y = this.mouseCurrentPosition.y;

        if ( button === MouseButton.Left ) {
            this.leftButtonPreviousPosition.x = this.mouseCurrentPosition.x;
            this.leftButtonPreviousPosition.y = this.mouseCurrentPosition.y;
        }

        const handlers = this.subscribers[ MouseEventType.MouseDown ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.mouseEvent );
        }
        const mEvent = new MouseEvent( GWTK.mousedown, event );
        this.oldPane.dispatchEvent( mEvent );

        this.preventClickByMove = false;

        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик отпускания клавиши
     * @method onmouseup
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmouseup( event: MouseEvent ) {
        this.updateEventObject( event );

        const button = event.button as MouseButton;
        this.buttonPressedList[ button ] = false;

        const handlers = this.subscribers[ MouseEventType.MouseUp ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.mouseEvent );
        }

        const mEvent = new MouseEvent( GWTK.mouseup, event );
        this.oldPane.dispatchEvent( mEvent );
        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик клика клавиши
     * @method onmouseclick
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmouseclick( event: MouseEvent ) {
        if ( !this.preventClick ) {
            const button = event.button;

            this.updateEventObject( event );

            // если слегка сместились, то считаем, что клик все-таки был
            if ( !this.preventClickByMove ) {

                if ( button === MouseButton.Left ) {
                    const handlers = this.subscribers[ MouseEventType.Click ];
                    for ( let i = 0; i < handlers.length; i++ ) {
                        handlers[ i ]( this.mouseEvent );
                    }
                }

                if ( button === MouseButton.Right ) {
                    const handlers = this.subscribers[ MouseEventType.RightClick ];
                    for ( let i = 0; i < handlers.length; i++ ) {
                        handlers[ i ]( this.mouseEvent );
                    }
                }

                this.preventClick = true;
                // событие отложенного клика (приходит позже обычного в случае, когда нет двойного клика)
                this.preventClickTimer = window.setTimeout( () => {
                    if ( button === MouseButton.Left ) {
                        const handlers = this.subscribers[ MouseEventType.DelayedClick ];
                        for ( let i = 0; i < handlers.length; i++ ) {
                            handlers[ i ]( this.mouseEvent );
                        }
                    }
                    this.preventClick = false;
                }, DOUBLE_CLICK_DELAY );

                const mEvent = new MouseEvent( event.type, event );
                this.oldPane.dispatchEvent( mEvent );
                event.stopPropagation();
                event.preventDefault();
                event.returnValue = false;
            }
        }

        this.preventClick = true;
        this.preventClickTimer = window.setTimeout( () => this.preventClick = false, DOUBLE_CLICK_DELAY );
    }

    /**
     * Обработчик двойного клика клавиши
     * @method onmousedblclick
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmousedblclick( event: MouseEvent ) {

        this.updateEventObject( event );

        const button = event.button;
        // если слегка сместились, то считаем, что клик все-таки был
        if ( !this.preventClickByMove ) {

            if ( button === MouseButton.Left ) {
                const handlers = this.subscribers[ MouseEventType.DoubleClick ];
                for ( let i = 0; i < handlers.length; i++ ) {
                    handlers[ i ]( this.mouseEvent );
                }
            }
        }

        if ( this.preventClickTimer !== undefined ) {
            window.clearTimeout( this.preventClickTimer );
            this.preventClickTimer = undefined;
            this.preventClick = false;
        }
        const mEvent = new MouseEvent( event.type, event );
        this.oldPane.dispatchEvent( mEvent );
        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик перемещения курсора мыши по элементу
     * @method onmousemove
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmousemove( event: MouseEvent ) {
        this.updateEventObject( event );

        const handlers = this.subscribers[ MouseEventType.MouseMove ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.mouseEvent );
        }


        const dx = this.mouseCurrentPosition.x - this.mouseDownPosition.x,
            dy = this.mouseCurrentPosition.y - this.mouseDownPosition.y;
        // проверка на значительное смещение курсора, чтобы запустить
        if ( Math.abs( dx ) >= MIN_DRAG_DELTA_X || Math.abs( dy ) >= MIN_DRAG_DELTA_Y ) {
            if ( this.buttonPressedList[ MouseButton.Left ] ) {

                this.mapdrag.deltaX = this.mouseCurrentPosition.x - this.leftButtonPreviousPosition.x;
                this.mapdrag.deltaY = this.mouseCurrentPosition.y - this.leftButtonPreviousPosition.y;

                this.mouseEvent.mapdrag = this.mapdrag;

                const handlers = this.subscribers[ MouseEventType.MapDrag ];
                for ( let i = 0; i < handlers.length; i++ ) {
                    handlers[ i ]( this.mouseEvent );
                }

                this.mouseEvent.mapdrag = undefined;

                this.leftButtonPreviousPosition.x = this.mouseCurrentPosition.x;
                this.leftButtonPreviousPosition.y = this.mouseCurrentPosition.y;

                this.preventClickByMove = true;
            }

            if ( this.preventClickTimer !== undefined ) {
                clearTimeout( this.preventClickTimer );
                this.preventClickTimer = undefined;
                this.preventClick = false;
            }
        }

        this.cursorMove( this.mouseEvent );
        const mEvent = new MouseEvent( GWTK.mousemove, event );
        this.oldPane.dispatchEvent( mEvent );

        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик вращения колеса
     * @method onmousewheel
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmousewheel( event: WheelEvent ) {
        this.updateEventObject( event );

        const now = window.performance.now();

        if ( now - this.lastWheelScalingTime > 50 ) {
            this.mouseEvent.wheelDelta = DomEvent.getWheelDelta( event );

            const handlers = this.subscribers[ MouseEventType.Wheel ];
            for ( let i = 0; i < handlers.length; i++ ) {
                handlers[ i ]( this.mouseEvent );
            }

            this.lastWheelScalingTime = now;
        }

        this.mouseEvent.wheelDelta = undefined;
        const mEvent = new WheelEvent( event.type, event );
        this.oldPane.dispatchEvent( mEvent );
        event.stopPropagation();
        // event.preventDefault();
        // event.returnValue = false;
    }

    /**
     * Обработчик покидания элемента курсором
     * @method onmouseleave
     * @private
     * @param event {MouseEvent} Объект события
     */
    private onmouseleave( event: MouseEvent ) {
        const button = event.button as MouseButton;
        this.buttonPressedList[ button ] = false;

        this.updateEventObject( event );

        const handlers = this.subscribers[ MouseEventType.MouseLeave ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.mouseEvent );
        }
        const mEvent = new MouseEvent( event.type, event );
        this.oldPane.dispatchEvent( mEvent );
        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик вызова контекстного меню
     * @method oncontextmenu
     * @private
     * @param event {MouseEvent} Объект события
     */
    private oncontextmenu( event: MouseEvent ) {

        this.updateEventObject( event );

        const handlers = this.subscribers[ MouseEventType.ContextMenu ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.mouseEvent );
        }

        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
        this.onmouseclick( event );
    }

    /**
     * Подписаться на событие
     * @method subscribe
     * @param eventName
     * @param handler
     */
    subscribe( eventName: MouseEventType, handler: CustomEventHandler ) {
        const subsribers = this.subscribers[ eventName ];
        if ( handler ) {
            subsribers.push( handler );
        }
    }

    /**
     * Отписаться от события
     * @method unsubscribe
     * @param eventName
     * @param handler
     */
    unsubscribe( eventName: MouseEventType, handler: CustomEventHandler ) {
        let ind = this.subscribers[ eventName ].indexOf( handler );
        if ( ind !== -1 ) {
            this.subscribers[ eventName ].splice( ind, 1 );
        }
    }

    /**
     * Очистить список подписчиков
     * @method clean
     */
    clean() {
        let eventName: keyof MouseDevice['subscribers'];
        for ( eventName in this.subscribers ) {
            this.subscribers[ eventName ].length = 0;
        }
    }
}
