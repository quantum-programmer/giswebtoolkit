/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент ввода с сенсорного экрана                 *
 *                                                                  *
 *******************************************************************/

import { MouseButton } from '~/input/MouseDevice';

const MIN_DRAG_DELTA = 6;

/**
 * Компонент ввода с сенсорного экрана
 * @class TouchScreenDevice
 */
export default class TouchScreenDevice {

    /**
     * Текущее расстояние между нажатиями
     * @private
     * @property {number|undefined} currentDelta
     */
    private currentDelta?: number;

    /**
     * Панель для отлавливания событий
     * @private
     * @readonly
     * @property {HTMLDivElement} eventPane
     */
    private readonly eventPane: HTMLDivElement;

    /**
     * Исходные позиции нажатия
     * @private
     * @readonly
     * @property {object} initTouches
     */
    private readonly initTouches: { [ key: number ]: { clientX: number; clientY: number; }; } = {};

    /**
     * Нажутае клавиши
     * @private
     * @readonly
     * @property {object} touches
     */
    private readonly touches: { [ key: number ]: number | undefined } = {
        0: undefined,
        1: undefined
    };

    /**
     * @constructor TouchScreenDevice
     * @param eventPane {HTMLElement} Панель событий
     */
    constructor( eventPane: HTMLDivElement ) {
        eventPane.addEventListener( 'touchstart', this.ontouchstart.bind( this ), { capture: false, passive: true } );
        eventPane.addEventListener( 'touchmove', this.ontouchmove.bind( this ), { capture: false, passive: true } );
        eventPane.addEventListener( 'touchcancel', this.ontouchend.bind( this ), false );
        eventPane.addEventListener( 'touchend', this.ontouchend.bind( this ), false );

        this.eventPane = eventPane;
    }

    /**
     * Обработчик прикосновения к экрану
     * @method ontouchstart
     * @private
     * @param event {TouchEvent} Объект события
     */
    ontouchstart( event: TouchEvent ) {

        // сохраняем исходное прикосновение (для определения клика)
        for ( let i = 0; i < event.changedTouches.length; i++ ) {
            const { identifier, clientX, clientY } = event.changedTouches[ i ];
            this.initTouches[ identifier ] = { clientX, clientY };
            this.addTouch( event.changedTouches[ i ], event );
        }

        event.stopPropagation();
        // event.preventDefault();
        // event.returnValue = false;
    }

    private addTouch( changedTouche: Touch, event: TouchEvent ) {
        if ( this.touches[ 0 ] === undefined && this.touches[ 1 ] === undefined ) {
            // если до этого не было первого прикосновения
            this.touches[ 0 ] = changedTouche.identifier;

            // эмулируем нажатие левой клавиши мыши
            const mEvent = new MouseEvent( 'mousedown', {
                ...event,
                button: MouseButton.Left,
                clientX: changedTouche.clientX,
                clientY: changedTouche.clientY
            } );
            this.eventPane.dispatchEvent( mEvent );
        } else if ( this.touches[ 1 ] === undefined ) {
            // если до этого не было второго прикосновения
            if ( this.touches[ 0 ] !== undefined ) {
                // если определено первое, то отправляем событие отпускания левой клавиши
                // иначе вместе с событиями правой клавиши (2 прикосновения) будут срабатывать и левые
                let existTouch;
                for ( let i = 0; i < event.touches.length; i++ ) {
                    if ( event.touches[ i ].identifier === this.touches[ 0 ] ) {
                        existTouch = event.touches[ i ];
                    }
                }
                if ( existTouch ) {
                    // эмулируем отпускание левой клавиши мыши
                    const mEvent1 = new MouseEvent( 'mouseup', {
                        ...event,
                        button: MouseButton.Left,
                        clientX: existTouch.clientX,
                        clientY: existTouch.clientY
                    } );
                    this.eventPane.dispatchEvent( mEvent1 );
                }
            }

            this.touches[ 1 ] = changedTouche.identifier;

            // эмулируем нажатие правой клавиши мыши
            const mEvent = new MouseEvent( 'mousedown', {
                ...event,
                button: MouseButton.Right,
                clientX: changedTouche.clientX,
                clientY: changedTouche.clientY
            } );
            this.eventPane.dispatchEvent( mEvent );
        }
    }

    /**
     * Обработчик удаления от экрана
     * @method ontouchend
     * @private
     * @param event {TouchEvent} Объект события
     */
    ontouchend( event: TouchEvent ) {

        const changedTouch1 = event.changedTouches[ 0 ];
        const changedTouch2 = event.changedTouches[ 1 ];

        const touchesItem1 = (changedTouch1 && this.touches[ 0 ] === changedTouch1.identifier) ? changedTouch1 : (changedTouch2 && this.touches[ 0 ] === changedTouch2.identifier) ? changedTouch2 : undefined;
        const touchesItem2 = (changedTouch1 && this.touches[ 1 ] === changedTouch1.identifier) ? changedTouch1 : (changedTouch2 && this.touches[ 1 ] === changedTouch2.identifier) ? changedTouch2 : undefined;

        if ( event.touches.length === 0 ) {
            // если прикосновений не осталось проверяем событие клика
            const initialTouch = this.initTouches[ changedTouch1.identifier ];
            if ( Math.abs( changedTouch1.clientX - initialTouch.clientX ) < MIN_DRAG_DELTA && Math.abs( changedTouch1.clientY - initialTouch.clientY ) < MIN_DRAG_DELTA ) {

                // эмулируем клик левой клавиши мыши
                const mEvent = new MouseEvent( 'click', {
                    ...event,
                    button: MouseButton.Left,
                    clientX: changedTouch1.clientX,
                    clientY: changedTouch1.clientY
                } );
                this.eventPane.dispatchEvent( mEvent );
                this.currentDelta = undefined;
            }
        }

        if ( touchesItem1 ) {
            // если пропадает первое прикосновение
            this.touches[ 0 ] = undefined;

            // эмулируем отпускание левой клавиши мыши
            const mEvent = new MouseEvent( 'mouseup', {
                ...event,
                button: MouseButton.Left,
                clientX: touchesItem1.clientX,
                clientY: touchesItem1.clientY
            } );
            this.eventPane.dispatchEvent( mEvent );
            this.currentDelta = undefined;
        }

        if ( touchesItem2 ) {
            // если пропадает второе прикосновение
            this.touches[ 1 ] = undefined;

            // эмулируем отпускание правой клавиши мыши
            const mEvent = new MouseEvent( 'mouseup', {
                ...event,
                button: MouseButton.Right,
                clientX: touchesItem2.clientX,
                clientY: touchesItem2.clientY
            } );
            this.eventPane.dispatchEvent( mEvent );

            if ( this.touches[ 0 ] !== undefined ) {
                // если осталось первое прикосновение, то возвращаем нажатие левой клавиши
                // иначе не будут срабатывать события левой клавиши

                let touch;
                for ( let i = 0; i < event.touches.length; i++ ) {
                    if ( event.touches[ i ].identifier === this.touches[ 0 ] ) {
                        touch = event.touches[ i ];
                    }
                }
                if ( touch ) {
                    // эмулируем нажатия левой клавиши мыши
                    const mEvent1 = new MouseEvent( 'mousedown', {
                        ...event,
                        button: MouseButton.Left,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    } );
                    this.eventPane.dispatchEvent( mEvent1 );
                }
            }
            this.currentDelta = undefined;
        }

        for ( let i = 0; i < event.changedTouches.length; i++ ) {
            Reflect.deleteProperty( this.initTouches, event.changedTouches[ i ].identifier );
        }

        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
    }

    /**
     * Обработчик движения по экрану
     * @method ontouchmove
     * @private
     * @param event {TouchEvent} Объект события
     */
    ontouchmove( event: TouchEvent ) {

        const touch1 = event.changedTouches[ 0 ];
        const touch2 = event.changedTouches[ 1 ];
        const eventTouches1 = event.touches[ 0 ];
        const eventTouches2 = event.touches[ 1 ];

        if ( touch1 && (this.touches[ 0 ] === touch1.identifier && event.touches.length === 1) ) {
            // эмулируем перемещение при нажатой левой клавиши мыши
            const mEvent = new MouseEvent( 'mousemove', {
                ...event,
                button: MouseButton.Left,
                clientX: touch1.clientX,
                clientY: touch1.clientY
            } );
            this.eventPane.dispatchEvent( mEvent );
        } else if ( eventTouches1 && eventTouches2 ) {

            // подсчет изменения расстояний между пальцами
            const delta = 0.001 * Math.sqrt( Math.pow( eventTouches1.clientX - eventTouches2.clientX, 2 ) + Math.pow( eventTouches1.clientY - eventTouches2.clientY, 2 ) );
            let deltaY = delta;
            if ( this.currentDelta !== undefined ) {
                deltaY = this.currentDelta - deltaY;
            } else {
                this.currentDelta = delta;
                deltaY = 0;
            }


            if ( Math.abs( deltaY ) < 0.1 ) {
                // считаем что 2 пальца перемещаются параллельно
                if ( touch1 && touch2 && (this.touches[ 1 ] === touch1.identifier || this.touches[ 1 ] === touch2.identifier) ) {
                    // эмулируем перемещение при нажатой правой клавиши мыши
                    const mEvent = new MouseEvent( 'mousemove', {
                        ...event,
                        button: MouseButton.Right,
                        clientX: touch1.clientX,
                        clientY: touch1.clientY
                    } );
                    this.eventPane.dispatchEvent( mEvent );
                }
            } else {
                this.currentDelta = delta;

                let clientX = eventTouches1.clientX;
                let clientY = eventTouches1.clientY;
                if ( eventTouches2 ) {
                    clientX = 0.5 * (clientX + eventTouches2.clientX);
                    clientY = 0.5 * (clientY + eventTouches2.clientY);
                }

                // эмулируем прокрутку колеса мыши
                const mEvent = new WheelEvent( 'wheel', {
                    ...event,
                    deltaY: deltaY > 0 ? 100 : -100,
                    clientX,
                    clientY
                } );
                this.eventPane.dispatchEvent( mEvent );
            }
        }
    }
}
