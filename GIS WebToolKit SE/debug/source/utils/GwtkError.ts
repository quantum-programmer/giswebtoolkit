/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Класс ошибки                             *
 *                                                                  *
 *******************************************************************/

import { ErrorResponse } from '~/services/RequestServices/RestService/Types';

/**
 * Класс ошибки
 * @class GwtkError
 * @implements Error
 */
export default class GwtkError implements Error {

    /**
     * Название ошибки
     * @property {string} name
     * @readonly
     */
    readonly name: string = 'UnknownError';

    /**
     * Сообщение ошибки
     * @property {string} message
     * @readonly
     */
    readonly message: string = 'Unknown error';

    /**
     * Стек ошибки
     * @property {string} [stack]
     * @readonly
     */
    readonly stack?: string;

    /**
     * @constructor
     * @param error {unknown} Исключение от catch
     * ( варианты: Error, {message:string;}, string, number )
     */
    constructor(error: unknown) {

        let message;
        let name;

        if (error instanceof Error) {
            name = error.name;
            message = error.message;
            this.stack = error.stack;
        } else if (typeof error === 'object' &&
            error !== null &&
            Reflect.has(error, 'message')) {
            message = Reflect.get(error, 'message');
            if (typeof message === 'number') {
                message = '' + message;
            }
            name = Reflect.get(error, 'name');
        } else if (typeof error === 'string' || typeof error === 'number') {
            message = '' + error;
        } else if (typeof error === 'object' && error !== null && Reflect.has(error, 'ExceptionReport')) {
            const report = (error as ErrorResponse).ExceptionReport;
            name = 'ExceptionReport';
            message = `Code: ${report.code || -1}\nLocator: ${report.locator || 'Unknown'}${report.text ? '\nText: ' + report.text : ''}${report.description ? '\nDescription: ' + report.description : ''}`;
        } else {
            try {
                message = JSON.stringify(error);
            } catch {
                // fallback in case there's an error
                return new Error(String(error));
            }
        }

        if (typeof name === 'string' && name.length > 0) {
            this.name = name;
        }
        if (typeof message === 'string' && message.length > 0) {
            this.message = message;
        }
    }

    /**
     * Преобразование ошибки в строку
     * @method toString
     * @return {string} Строка вида:
     * "Название ошибки: Сообщение ошибки
     *  Стек ошибки (если есть)"
     */
    toString(): string {
        return `${this.name}: ${this.message}${this.stack ? '\n' + this.stack : ''}`;
    }
}
