/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент ввода с клавиатуры                    *
 *                                                                  *
 *******************************************************************/


export enum KeyboardEventType {
    KeyDown = 'onkeydown',
    KeyUp = 'onkeyup'
}

type CustomEventHandler = ( e: KeyboardDeviceEvent ) => void;

export type KeyboardDeviceEvent = {
    keyList: KeyBoardDevice['keyPressedList'];
    activeKeyCode: KeyboardCode;
    originalEvent: KeyboardEvent;
}

/**
 * Список кодов клавиш
 * @enum KeyboardCode
 */
export enum KeyboardCode {
    Unknown = 'Unknown',
    ShiftLeft = 'ShiftLeft',
    ShiftRight = 'ShiftRight',
    ControlLeft = 'ControlLeft',
    ControlRight = 'ControlRight',
    AltLeft = 'AltLeft',
    AltRight = 'AltRight',
    WinLeft = 'WinLeft',
    WinRight = 'WinRight',
    MetaLeft = 'MetaLeft',
    MetaRight = 'MetaRight',
    ContextMenu = 'ContextMenu',
    F1 = 'F1',
    F2 = 'F2',
    F3 = 'F3',
    F4 = 'F4',
    F5 = 'F5',
    F6 = 'F6',
    F7 = 'F7',
    F8 = 'F8',
    F9 = 'F9',
    F10 = 'F10',
    F11 = 'F11',
    F12 = 'F12',
    ArrowUp = 'ArrowUp',
    ArrowDown = 'ArrowDown',
    ArrowLeft = 'ArrowLeft',
    ArrowRight = 'ArrowRight',
    Enter = 'Enter',
    Escape = 'Escape',
    Space = 'Space',
    Tab = 'Tab',
    Backspace = 'Backspace',
    Insert = 'Insert',
    Delete = 'Delete',
    PageUp = 'PageUp',
    PageDown = 'PageDown',
    Home = 'Home',
    End = 'End',
    CapsLock = 'CapsLock',
    ScrollLock = 'ScrollLock',
    PrintScreen = 'PrintScreen',
    Pause = 'Pause',
    NumLock = 'NumLock',
    Digit0 = 'Digit0',
    Digit1 = 'Digit1',
    Digit2 = 'Digit2',
    Digit3 = 'Digit3',
    Digit4 = 'Digit4',
    Digit5 = 'Digit5',
    Digit6 = 'Digit6',
    Digit7 = 'Digit7',
    Digit8 = 'Digit8',
    Digit9 = 'Digit9',
    KeyA = 'KeyA',
    KeyB = 'KeyB',
    KeyC = 'KeyC',
    KeyD = 'KeyD',
    KeyE = 'KeyE',
    KeyF = 'KeyF',
    KeyG = 'KeyG',
    KeyH = 'KeyH',
    KeyI = 'KeyI',
    KeyJ = 'KeyJ',
    KeyK = 'KeyK',
    KeyL = 'KeyL',
    KeyM = 'KeyM',
    KeyN = 'KeyN',
    KeyO = 'KeyO',
    KeyP = 'KeyP',
    KeyQ = 'KeyQ',
    KeyR = 'KeyR',
    KeyS = 'KeyS',
    KeyT = 'KeyT',
    KeyU = 'KeyU',
    KeyV = 'KeyV',
    KeyW = 'KeyW',
    KeyX = 'KeyX',
    KeyY = 'KeyY',
    KeyZ = 'KeyZ',
    Numpad0 = 'Numpad0',
    Numpad1 = 'Numpad1',
    Numpad2 = 'Numpad2',
    Numpad3 = 'Numpad3',
    Numpad4 = 'Numpad4',
    Numpad5 = 'Numpad5',
    Numpad6 = 'Numpad6',
    Numpad7 = 'Numpad7',
    Numpad8 = 'Numpad8',
    Numpad9 = 'Numpad9',
    NumpadDivide = 'NumpadDivide',
    NumpadMultiply = 'NumpadMultiply',
    NumpadSubtract = 'NumpadSubtract',
    NumpadAdd = 'NumpadAdd',
    NumpadEnter = 'NumpadEnter',
    NumpadDecimal = 'NumpadDecimal',
    Backquote = 'Backquote',
    Minus = 'Minus',
    Equal = 'Equal',
    Backslash = 'Backslash',
    Semicolon = 'Semicolon',
    Quote = 'Quote',
    Comma = 'Comma',
    Period = 'Period',
    Slash = 'Slash'
}

/**
 * Словарь ключей клавиш
 * @property {object} KeyboardKey
 */
const KeyboardKey: { [ key: string ]: KeyboardCode } = {
    'Key_16': KeyboardCode.ShiftLeft,
    'Key_17': KeyboardCode.ControlLeft,
    'Key_18': KeyboardCode.AltLeft,
    'Key_91': KeyboardCode.MetaLeft,
    'Key_92': KeyboardCode.MetaRight,
    'Key_93': KeyboardCode.ContextMenu,
    'Key_112': KeyboardCode.F1,
    'Key_113': KeyboardCode.F2,
    'Key_114': KeyboardCode.F3,
    'Key_115': KeyboardCode.F4,
    'Key_116': KeyboardCode.F5,
    'Key_117': KeyboardCode.F6,
    'Key_118': KeyboardCode.F7,
    'Key_119': KeyboardCode.F8,
    'Key_120': KeyboardCode.F9,
    'Key_121': KeyboardCode.F10,
    'Key_122': KeyboardCode.F11,
    'Key_123': KeyboardCode.F12,
    'Key_38': KeyboardCode.ArrowUp,
    'Key_40': KeyboardCode.ArrowDown,
    'Key_37': KeyboardCode.ArrowLeft,
    'Key_39': KeyboardCode.ArrowRight,
    'Key_13': KeyboardCode.Enter,
    'Key_27': KeyboardCode.Escape,
    'Key_32': KeyboardCode.Space,
    'Key_9': KeyboardCode.Tab,
    'Key_8': KeyboardCode.Backspace,
    'Key_45': KeyboardCode.Insert,
    'Key_46': KeyboardCode.Delete,
    'Key_33': KeyboardCode.PageUp,
    'Key_34': KeyboardCode.PageDown,
    'Key_36': KeyboardCode.Home,
    'Key_35': KeyboardCode.End,
    'Key_20': KeyboardCode.CapsLock,
    'Key_145': KeyboardCode.ScrollLock,
    'Key_44': KeyboardCode.PrintScreen,
    'Key_19': KeyboardCode.Pause,
    'Key_144': KeyboardCode.NumLock,
    'Key_48': KeyboardCode.Digit0,
    'Key_49': KeyboardCode.Digit1,
    'Key_50': KeyboardCode.Digit2,
    'Key_51': KeyboardCode.Digit3,
    'Key_52': KeyboardCode.Digit4,
    'Key_53': KeyboardCode.Digit5,
    'Key_54': KeyboardCode.Digit6,
    'Key_55': KeyboardCode.Digit7,
    'Key_56': KeyboardCode.Digit8,
    'Key_57': KeyboardCode.Digit9,
    'Key_65': KeyboardCode.KeyA,
    'Key_66': KeyboardCode.KeyB,
    'Key_67': KeyboardCode.KeyC,
    'Key_68': KeyboardCode.KeyD,
    'Key_69': KeyboardCode.KeyE,
    'Key_70': KeyboardCode.KeyF,
    'Key_71': KeyboardCode.KeyG,
    'Key_72': KeyboardCode.KeyH,
    'Key_73': KeyboardCode.KeyI,
    'Key_74': KeyboardCode.KeyJ,
    'Key_75': KeyboardCode.KeyK,
    'Key_76': KeyboardCode.KeyL,
    'Key_77': KeyboardCode.KeyM,
    'Key_78': KeyboardCode.KeyN,
    'Key_79': KeyboardCode.KeyO,
    'Key_80': KeyboardCode.KeyP,
    'Key_81': KeyboardCode.KeyQ,
    'Key_82': KeyboardCode.KeyR,
    'Key_83': KeyboardCode.KeyS,
    'Key_84': KeyboardCode.KeyT,
    'Key_85': KeyboardCode.KeyU,
    'Key_86': KeyboardCode.KeyV,
    'Key_87': KeyboardCode.KeyW,
    'Key_88': KeyboardCode.KeyX,
    'Key_89': KeyboardCode.KeyY,
    'Key_90': KeyboardCode.KeyZ,
    'Key_96': KeyboardCode.Numpad0,
    'Key_97': KeyboardCode.Numpad1,
    'Key_98': KeyboardCode.Numpad2,
    'Key_99': KeyboardCode.Numpad3,
    'Key_100': KeyboardCode.Numpad4,
    'Key_101': KeyboardCode.Numpad5,
    'Key_102': KeyboardCode.Numpad6,
    'Key_103': KeyboardCode.Numpad7,
    'Key_104': KeyboardCode.Numpad8,
    'Key_105': KeyboardCode.Numpad9,
    'Key_111': KeyboardCode.NumpadDivide,
    'Key_106': KeyboardCode.NumpadMultiply,
    'Key_109': KeyboardCode.NumpadSubtract,
    'Key_107': KeyboardCode.NumpadAdd,
    'Key_110': KeyboardCode.NumpadDecimal,
    'Key_192': KeyboardCode.Backquote,
    'Key_189': KeyboardCode.Minus,
    'Key_186': KeyboardCode.Semicolon,
    'Key_187': KeyboardCode.Equal,
    'Key_222': KeyboardCode.Quote,
    'Key_188': KeyboardCode.Comma,
    'Key_190': KeyboardCode.Period,
    'Key_191': KeyboardCode.Slash,
    'Key_220': KeyboardCode.Backslash
};

/**
 * Компонент ввода с клавиатуры
 * @class KeyBoardDevice
 */
class KeyBoardDevice {

    /**
     * Экземляр компонента
     * @private
     * @property {KeyBoardDevice} _instance
     */
    private static _instance: KeyBoardDevice;

    /**
     * Список состояний клавиш
     * @private
     * @readonly
     * @property {object} keyPressedList
     */
    private readonly keyPressedList: { [key in KeyboardCode]?: true } = {};

    /**
     * Объект события
     * @private
     * @readonly
     * @property {KeyboardDeviceEvent} keyboardEvent
     */
    private readonly keyboardEvent: KeyboardDeviceEvent = {
        keyList: this.keyPressedList,
        activeKeyCode: KeyboardCode.Escape,
        originalEvent: new KeyboardEvent( '' )
    };

    /**
     * Список подписчиков
     * @private
     * @readonly
     * @property {object} subscribers
     */
    private readonly subscribers: { [key in KeyboardEventType]: CustomEventHandler[]; } = {
        onkeydown: [],
        onkeyup: []
    };

    /**
     * @constructor KeyBoardDevice
     */
    constructor() {
        //singleton pattern
        if ( KeyBoardDevice._instance ) {
            return KeyBoardDevice._instance;
        }

        if ( !document ) {
            throw Error( 'document object has not been defined' );
        }

        document.addEventListener( 'keydown', this.keyDown.bind( this ) );
        document.addEventListener( 'keyup', this.keyUp.bind( this ) );
        KeyBoardDevice._instance = this;
    }

    /**
     * Обработчик нажатия клавиши
     * @private
     * @method keyDown
     */
    private keyDown( event: KeyboardEvent ) {

        this.keyboardEvent.originalEvent = event;

        const code = KeyBoardDevice.getKeyCode( event );

        this.keyboardEvent.activeKeyCode = code;
        this.keyPressedList[ code ] = true;

        const handlers = this.subscribers[ KeyboardEventType.KeyDown ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.keyboardEvent );
        }
        KeyBoardDevice.blockShortCut( code, event );
    }

    /**
     * Обработчик отпускания клавиши
     * @private
     * @method keyUp
     */
    private keyUp( event: KeyboardEvent ) {

        this.keyboardEvent.originalEvent = event;

        const code = KeyBoardDevice.getKeyCode( event );

        this.keyboardEvent.activeKeyCode = code;
        this.keyPressedList[ code ] = undefined;

        const handlers = this.subscribers[ KeyboardEventType.KeyUp ];
        for ( let i = 0; i < handlers.length; i++ ) {
            handlers[ i ]( this.keyboardEvent );
        }

        KeyBoardDevice.blockShortCut( code, event );
    }

    /**
     * Подписаться на событие клавиатуры
     * @method subscribe
     * @param eventName
     * @param handler {Function} Функция-обработчик
     */
    subscribe( eventName: KeyboardEventType, handler: CustomEventHandler ) {
        const subsribers = this.subscribers[ eventName ];
        if ( handler ) {
            subsribers.push( handler );
        }
    }

    /**
     * Отписаться от события клавиатуры
     * @method unsubscribe
     * @param eventName
     * @param handler {Function} Функция-обработчик
     */
    unsubscribe( eventName: KeyboardEventType, handler: CustomEventHandler ) {
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
        let eventName: keyof KeyBoardDevice['subscribers'];
        for ( eventName in this.subscribers ) {
            this.subscribers[ eventName ].length = 0;
        }
    }

    /**
     * Блокировка сочетаний клавиш браузера
     * @private
     * @static
     * @method blockShortCut
     */
    private static blockShortCut( code: KeyboardCode, event: KeyboardEvent ) {
        if ( event.ctrlKey ) {
            switch ( code ) {
                case KeyboardCode.Escape:
                case KeyboardCode.KeyS:
                    event.preventDefault();
                    event.stopPropagation();
            }
        }
    }

    /**
     * Получение кода клавиши (в IE нет свойства сode)
     * @private
     * @static
     * @method getKeyCode
     */
    private static getKeyCode( event: KeyboardEvent ) {
        let code = event.code as KeyboardCode;
        if ( code === undefined ) {
            const keyCode = 'Key_' + event.keyCode;
            code = KeyboardKey[ keyCode ];
        }
        return code;
    }
}

export default new KeyBoardDevice();


