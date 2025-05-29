import { GwtkComponentPanel } from '~/MapWindow';

export interface SimpleJson<T = string> {
    [ key: string ]: T;
}

export type ContainsSomeOf<T> = {
    [K in keyof T]?: T[K]
}

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type TileNumber = {
    col: number;
    row: number;
    zoom: number;
}

export type AuthParams = {
    options: { url: string, authheader?: string };
    authTypeServer: ( value: string ) => boolean;
    authTypeExternal: ( value: string ) => boolean;
    getToken?: () => string;
}


export enum LOCALE {//Массив номеров локализаций (соответствует ГИС карте: 0 - линейный, 1- площадной, 2 - точечный, 3 - подпись, 4 - векторный, 5 - шаблон)
    Undefined = -1,
    Line = 0,
    Plane = 1,
    Point = 2,
    Text = 3,
    Vector = 4,
    Template = 5
}

export const AUTH_TOKEN = 'AUTHORIZATION-TOKEN';

export const AUTH_HEADER = 'Authorization';

export type PluginDescription = {
    id: string;
    icon: string;
    title: string;
    className?: string;
    specifiedToolbar?: GwtkComponentPanel;
};

export enum LogEventType {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Debug = 'debug'
}

export type LogMessage = {
    text: string;                   // текст
    description?: string;             // Дополнительно описание
    type?: LogEventType;            // тип сообщения
    display?: boolean;              // вывод сообщения на экран
    icon?: string;                  // имя изображения в окне, "error"/"warning" или ничего - deprecated
    stack?: string;                 //стек вызовов
    // уже не используются - остались при вызове из js файлов
    // height          :number,   // высота всплывающего окна, пикселы
    // width:          :number,   // ширина всплывающего окна, пикселы
    // top             :number,   // положение окна сверху, пикселы
    // left            :number,   // положение окна слева, пикселы
    // classname       :''        // имя css класса окна
}

export type LogRecord = {
    text: string;
    time: number;
    type: LogEventType;
    description?: string;             // Дополнительно описание
    stack?: string;
}