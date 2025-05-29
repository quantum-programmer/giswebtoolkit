/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Вспомогательные функции                        *
 *                                                                  *
 *******************************************************************/

import axios from 'axios';
import XMLElement from '~/services/Utils/XMLElement';
import { ParseTextToXml } from '~/services/Utils/XMLDoc';
import { XMLRpcData } from '~/services/Utils/Types';
import { HttpParams } from '~/services/RequestServices/common/RequestService';
import { AUTH_HEADER, AUTH_TOKEN, AuthParams, SimpleJson } from '~/types/CommonTypes';
import { JsonParam } from '~/services/RequestServices/RestService/Types';
import MapObject from '~/mapobject/MapObject';
import CsvEditor, { Cell } from '~/services/Utils/CsvEditor';
import { AngleUnit, Unit } from '~/utils/WorkspaceManager';
import Trigonometry from '~/geo/Trigonometry';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';


/**
 * Директива final для методов класса
 * @function final
 * @param target {object}
 * @param key { string | symbol}
 * @param descriptor {PropertyDescriptor}
 */
export function final( target: Object, key: string | symbol, descriptor: PropertyDescriptor ) {
    descriptor.writable = false;
}

export type ExceptionJSON = {
    exceptionCode: string;
    exceptionText: string;
    exceptionLocator?: string;
    description?: string;
}

export type ExportToCsvHeader = { key: string, value: string }[];

/**
 * Класс вспомогательных функций
 * @static
 * @class Utils
 */
class Utils {

    // private static ExceptionRegex = /<Exception[^>lc]*code="(?<exceptionCode>[^"]*)"[^>lc]*(locator="(?<exceptionLocator>[^"]*)"|>).+<ExceptionText>(?<exceptionText>.+)<\/ExceptionText>/gsm;
    // private static ServiceExceptionRegex = /<ServiceException[^>lc]*code="(?<exceptionCode>[^"]*)"[^>lc]*(locator="(?<exceptionLocator>[^"]*)"|>)(?<exceptionText>.*)<\/ServiceException>/gsm;

    /**
     * Список описаний ошибок
     * @private
     * @static
     * @property ERROR_LIST
     */
    private static ERROR_LIST: { [ key: number ]: string } = {
        0: 'Data length error',
        1836597052: 'Service Exception Report',
        1329865020: 'Error page'
    };

    /**
     * Список стандартных исключений
     * @private
     * @static
     * @readonly
     * @property DEFAULT_EXCEPTION
     */
    private static readonly DEFAULT_EXCEPTION = {
        exceptionCode: 'InvalidResponseDataError',
        exceptionText: 'Invalid data from server'
    };

    /**
     * Сгенерировать комбинацию из четырех случайных шестнадцатеричных цифр
     * @private
     * @static
     * @method generateRandomHexId
     * @return {string} Комбинация из четырех случайных шестнадцатеричных цифр
     */
    private static generateRandomHexId() {
        return Math.floor( (1 + Math.random()) * 0x10000 ).toString( 16 ).substring( 1 );
    }

    /**
     * Проверка исключения
     * @static
     * @method checkException
     * @param arrayBuffer {ArrayBufferLike} Поток данных ответа сервиса
     * @return {boolean} Если исключение, то вернет `true`
     */
    static checkException( arrayBuffer: ArrayBufferLike ) {
        let check, code;
        if ( arrayBuffer.byteLength === 0 ) {
            check = true;
            code = 0;
        } else {
            const dataView = new DataView( arrayBuffer, 0, 4 );
            code = dataView.getUint32( 0, true );
            check = (code === 1836597052 || code === 1329865020);
        }

        if ( check ) {
            console.error( Utils.ERROR_LIST[ code ] );
        }
        return check;
    }

    /**
     * Проверка XML на исключения
     * @static
     * @method checkXMLException
     * @param text {string} Ответ сервиса
     * @return {boolean} Если исключение, то вернет объект
     */
    static checkXMLException(text?: string) {
        let result: ExceptionJSON | undefined = undefined;
        if (typeof text === 'string' && text.length > 0) {
            const defaultText = 'Request Error';
            const xml = ParseTextToXml(text);
            if (!xml.findByTag('WMS_Capabilities')) {
                const res = xml.findByTag('Exception') || xml.findByTag('ServiceException');
                if (res) {
                    result = {
                        exceptionCode: res.attributes.code,
                        exceptionLocator: res.attributes.locator,
                        exceptionText: res.data || defaultText
                    };
                    const textElement = res.findByTag('ExceptionText');
                    if (textElement && textElement.data) {
                        result.exceptionText = textElement.data;
                    }
                    const descriptionElement = res.findByTag('Description');
                    if (descriptionElement && descriptionElement.data) {
                        result.description = descriptionElement.data;
                    }
                }
            }
        } else {
            result = Utils.DEFAULT_EXCEPTION;
        }

        if (result) {
            throw new Error(JSON.stringify(result));
        }
    }

    /**
     * Получить параметры из строки URL
     * @static
     * @method parseUrl
     * @param url {string} Строка запроса (url)
     * @return {object} Параметры url в виде пар ключ:значение
     */
    static parseUrl( url: string ) {

        const link = url.split( '?' );
        const server = link[ 0 ].split( /\/+/ );
        let path = '';
        if ( server.length > 2 ) {
            path = server.slice( 2 ).join( '/' );
        }
        let signPos = url.indexOf( '?' );
        if ( signPos === -1 ) {
            signPos = url.length - 1;
        }
        let folder = url.slice( 0, signPos );
        folder = folder.slice( 0, folder.lastIndexOf( '/' ) );
        return {
            folderpath: folder,
            href: url,
            protocol: server[ 0 ],
            origin: server[ 0 ] + '//' + server[ 1 ],
            pathname: path
        };
    }
    /**
     * Получить параметры idLayer и objectNumber из ключа 'idLayer:objectNumber'
     * @static
     * @method parseIdLayerObjectNumberKey
     * @param idLayerObjectNumberKey {string} Ключ 'idLayer:objectNumber'
     * @return {idLayer: string, objectNumber: string} Параметры idLayer и objectNumber
     */
    static parseIdLayerObjectNumberKey( idLayerObjectnumberKey: string ) {
        return {
            idLayer: idLayerObjectnumberKey.split(':')[0],
            objectNumber: idLayerObjectnumberKey.split(':')[1]
        };
    }

    /**
     * Получить параметры из objcard
     * @static
     * @method parseObjectCardUrlParam
     * @param objcard {string} Ключ 'layerId:attrKey:attrValue'
     */
    static parseObjectCardUrlParam(objcard: string) {
        const regex = /^([^:]+):([^:]+):(.+)$/gm;

        const match = regex.exec(objcard);
        if (match && match[1] !== undefined && match[2] !== undefined && match[3] !== undefined) {
            return {layerId: match[1], attrKey: match[2], attrValue: match[3]};
        }
    }

    /**
     * Получить параметры запроса слоя из строки URL
     * @static
     * @method getParamsFromURL
     * @param url {string} Строка запроса (url)
     * @return {object} Параметры запроса слоя в виде пар ключ:значение
     */
    static getParamsFromURL( url: string ): SimpleJson {
        //url = url.replace(/\% ?/g, "");                                              // 22/10/18

        const params: SimpleJson = {};

        let pieces, parts, i;
        if ( url ) {
            const hash = url.lastIndexOf( '#' );
            if ( hash !== -1 ) {
                // isolate just the hash value
                url = url.slice( hash + 1 );
            }
            const question = url.indexOf( '?' );
            if ( question !== -1 ) {
                url = url.slice( question + 1 );
                pieces = url.split( '&' );
                for ( i = 0; i < pieces.length; i++ ) {
                    parts = pieces[ i ].split( '=' );
                    if ( parts.length < 2 ) {
                        parts.push( '' );
                    }
                    //params[decodeURIComponent(parts[0]).toLowerCase()] = decodeURIComponent(parts[1]); // 22/10/18
                    params[ parts[ 0 ].toLowerCase() ] = parts[ 1 ];
                }
            }
        }
        return params;
    }

    /**
     * Проверка строки URL на валидность
     * @static
     * @method isValidUrl
     * @param url {string} Строка запроса (url)
     * @return {boolean}
     */
    static isValidUrl(url: string) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
        return urlPattern.test(url);
    }

    /**
     * Создание GUID
     * @static
     * @method generateGUID
     * @return {string} GUID
     */
    static generateGUID() {
        const s4 = Utils.generateRandomHexId;
        return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
    }

    /**
     * Перевести Blob в text
     * @static
     * @async
     * @method readBlobAsText
     * @param blob {Blob} Данные
     * @return {string} Текст
     */
    static async readBlobAsText( blob: Blob ) {
        const uri = URL.createObjectURL( blob );
        const result = await axios.get<string>( uri, { responseType: 'text' } );
        return result.data;
    }

    /**
     * Получить случайное целое число из диапазона
     * @static
     * @method randomInt
     * @param min {number} Нижняя граница
     * @param max {number} Верхняя граница
     * @return {number} Случайное целое число из диапазона
     */
    static randomInt( min: number, max: number ) {
        return Math.floor( Math.random() * (max - min) ) + min;
    }

    /**
     * Функция преобразования json-объекта в XmlRpc для подготовки запроса
     * @static
     * @method createXmlRpcString
     * @param jsRpc {XMLRpcData[]} Массив описаний для xml-запроса по количеству слоев
     * @param [xdata] {string[]} XML-данные в кодировке base64 (область, метрика, ...)
     * @return {string} XmlRpc-строка для запроса
     */
    static createXmlRpcString( jsRpc: XMLRpcData[ ], xdata?: string[] ): string {

        const methodCall = new XMLElement( 'methodCall' );

        // if ( methodName ) {
        //     methodCall.addChild( new XMLElement( 'methodName', methodName ) );
        // }
        methodCall.addChild( new XMLElement( 'methodName', 'CREATETHEMATICMAPBYFILE' ) );

        const params = new XMLElement( 'params' );
        const param = new XMLElement( 'param' );
        const value = new XMLElement( 'value' );

        if ( xdata !== undefined ) {
            for ( let i = 0; i < xdata.length; i++ ) {
                const base64 = new XMLElement( 'base64', xdata[ i ] );
                value.addChild( base64 );
            }
        }

        for ( let k = 0; k < jsRpc.length; k++ ) {

            const jsRpcByLayer = jsRpc[ k ];

            const arrayTag = new XMLElement( 'array' );

            const data = new XMLElement( 'data' );

            const name = jsRpcByLayer.LAYER || jsRpcByLayer.CLASSIFIERNAME;
            if ( name ) {
                const layerIdValue = new XMLElement( 'value' );
                layerIdValue.addChild( new XMLElement( 'string', name ) );
                data.addChild( layerIdValue );
            }

            const struct = new XMLElement( 'struct' );


            for ( let key in jsRpcByLayer ) {

                if ( ['layer'].indexOf( key.toLowerCase() ) !== -1 ) {
                    continue;
                }

                const member = new XMLElement( 'member' );

                const name = new XMLElement( 'name', key );
                member.addChild( name );

                const value = new XMLElement( 'value' );

                let valueTag = 'string';
                if ( key.toLowerCase() === 'filedata' ) {
                    valueTag = 'i4';
                    if ( jsRpcByLayer[ key ]?.indexOf( 'CDATA' ) !== -1 ) {
                        valueTag = 'bit';
                    }
                }

                const textValue = jsRpcByLayer[ key ];

                if ( textValue !== undefined ) {

                    const valueElement = new XMLElement( valueTag, textValue );

                    value.addChild( valueElement );

                    member.addChild( value );

                    struct.addChild( member );
                }
            }

            data.addChild( struct );
            arrayTag.addChild( data );
            value.addChild( arrayTag );
        }

        param.addChild( value );
        params.addChild( param );
        methodCall.addChild( params );

        return '<?xml version=\'1.0\' encoding=\'utf-8\'?>' + methodCall.toString();
    }


    /**
     * Функция преобразования json-объекта в JsonRpc для подготовки запроса
     * @static
     * @method createJsonRpcString
     * @param jsRpc {XMLRpcData[]} Массив описаний параметров слоев для запроса
     * @param [linkedParams] {JsonParam[]} XML-данные в кодировке base64 (область, метрика, ...)
     * @return {string} JsonRpc-строка для запроса
     */
    static createJsonRpcString( jsRpc: XMLRpcData[ ], linkedParams?: JsonParam<any>[] ): string {
        const restMethod = jsRpc[ 0 ]?.RESTMETHOD;
        if ( !restMethod ) {
            return '';
        }
        const result: any = {
            name: restMethod,
            layerlist: []
        };

        let params;
        if ( linkedParams ) {
            params = [];
            for ( let i = 0; i < linkedParams.length; i++ ) {
                params.push( linkedParams[ i ] );
            }
        }
        if ( params ) {
            result.params = params;
        }

        for ( let k = 0; k < jsRpc.length; k++ ) {
            const jsRpcByLayer = jsRpc[ k ];

            let id = jsRpcByLayer.LAYER;
            if ( id === undefined ) {
                id = jsRpcByLayer.CLASSIFIERNAME;
            }

            if ( id === undefined ) {
                id = '';
            }

            if ( id ) {
                try {
                    id = decodeURIComponent(id);
                } catch (error) {
                    console.log('Decoding identifier error!');
                }
            }

            let params = undefined;
            for ( const name in jsRpcByLayer ) {

                if ( ['restmethod', 'layer'].indexOf( name.toLowerCase() ) !== -1 ) {
                    continue;
                }

                const value = jsRpcByLayer[ name ];
                let type = name.toLowerCase() === 'filedata' ? 'i4' : 'string';
                // let type = name.toLowerCase() === 'filedata' ? 'bit' : 'string';
                if ( name.toLowerCase() === 'textfilter' || (name.toLowerCase() === 'filedata' && typeof value !== 'string') )
                    type = 'json';

                if ( value !== undefined ) {
                    if ( !params ) {
                        params = [];
                    }
                    params.push( { name, value, type } );
                }
            }


            if ( id === '' ) {
                result.common = params;
            } else {
                const layerParams = {
                    id,
                    params
                };
                result.layerlist.push( layerParams );
            }

        }

        return JSON.stringify( { restmethod: result } );
    }

    /**
     * Составить XML текст ошибки выполнения запроса
     * @static
     * @method createXmlExceptionString
     * @param [textStatus] {string} Статус ошибки
     * @param [errorCode] {string} Код ошибки
     * @return {string} XML текст ошибки выполнения запроса
     */
    static createXmlExceptionString( textStatus?: string, errorCode?: string ): string {
        let txt = 'Request Error';
        if ( textStatus !== undefined ) {
            txt = textStatus;
        }
        const exceptionReport = new XMLElement( 'ExceptionReport', undefined, {
            'version': '1.0.0',
            // 'xmlns': 'http://www.opengis.net/ows/2.0',
            // 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            // 'xsi:schemaLocation': 'http://www.opengis.net/ows/2.0  owsExceptionReport.xsd'
        } );

        const exception = new XMLElement( 'Exception', undefined, { code: errorCode || 'RequestError' } );
        const exceptionText = new XMLElement( 'ExceptionText', txt );

        exception.addChild( exceptionText );

        exceptionReport.addChild( exception );

        return '<?xml version=\'1.0\' encoding=\'utf-8\'?>' + exceptionReport.toString();
    }

    /**
     * Формировать url для запроса getMap
     * @static
     * @method buildGetMapUrl
     * @param src {string} Ссылка запроса
     * @param params {object} Значения переменных
     * @returns {string} Заполненная ссылка запроса
     */
    static buildGetMapUrl( src: string, params: { bbox: string, width: number, height: number, crs: string, idList?: string } ) {
        let sDT;
        if ( src.indexOf( '%date' ) !== -1 ) {
            const date = new Date();
            date.setHours( 0, 0, 0, 0 );
            date.setHours( -1 );
            let month = date.getMonth() + 1;
            let monthstr = month < 10 ? '0' + month : month.toString();

            let day = date.getDate();
            let daystr = day < 10 ? '0' + day : day.toString();
            sDT = date.getFullYear() + '-' + monthstr + '-' + daystr + ' 00:00:00';
            src = src.replace( /%date/, sDT );
        }


        const mapObj: SimpleJson = {
            '%bbox': params.bbox,
            '%w': params.width.toString(),
            '%h': params.height.toString(),
            '%crs': `EPSG:${params.crs}`,
            '%size': `${params.width},${params.height}`     // Атлас земель сельхоз назначения
        };
        if ( sDT ) {
            mapObj[ '%date' ] = sDT;                            // Сервис ВЕГА
        }

        const re = new RegExp( Object.keys( mapObj ).join( '|' ), 'gi' );
        src = src.replace( re, ( matched ) => mapObj[ matched ] );

        if ( params.idList !== undefined && params.idList.length > 0 ) {
            src += '&idlist=' + params.idList;
        }

        return src;
    }

    /**
     * Формировать объект http-параметров запроса по
     * информации из карты
     * @static
     * @method createHttpParams
     * @param mapOptions {AuthParams} Экземпляр карты
     * @param [options] {HttpParams} Http-параметры запроса
     * @returns {HttpParams|undefined}Объект http-параметров запроса
     */
    static createHttpParams( mapOptions: AuthParams, options?: HttpParams ) {
        const url = options?.url || mapOptions.options.url;
        const result: HttpParams = {
            ...options,
            url
        };
        if ( typeof mapOptions.getToken === 'function' && mapOptions.getToken() ) {
            result.headers = {
                ...result.headers,
                [ AUTH_TOKEN ]: mapOptions.getToken(),
            };
        }

        if (mapOptions.options.authheader) {
            result.headers = {
                ...result.headers,
                [ AUTH_HEADER ]: mapOptions.options.authheader,
            };
        }

        return result;
    }

    /**
     * Определение версии IE
     * @static
     * @method isIE
     * @return {number} Номер версии IE, либо -1
     */
    static isIE( global: { navigator: { userAgent: string; } } ) {
        let rv = -1;

        const ua = global.navigator.userAgent;
        const msie = ua.indexOf( 'MSIE ' );
        if ( msie > 0 ) {
            // IE 10 or older => return version number
            return parseInt( ua.substring( msie + 5, ua.indexOf( '.', msie ) ), 10 );
        }
        const trident = ua.indexOf( 'Trident/' );
        if ( trident > 0 ) {
            // IE 11 => return version number
            rv = ua.indexOf( 'rv:' );
            return parseInt( ua.substring( rv + 3, ua.indexOf( '.', rv ) ), 10 );
        }
        const edge = ua.indexOf( 'Edge/' );
        if ( edge > 0 ) {
            // Edge (IE 12+) => return version number
            return parseInt( ua.substring( edge + 5, ua.indexOf( '.', edge ) ), 10 );
        }
        return rv;
    }

    /**
     * Оборачивание функции для срабатывания только после
     * выдерживания временного интервала (каждый вызов заново сбрасывает счетчик)
     * @method debounce
     * @static
     * @params func {Function} Функция
     * @params delay {Number} Задержка в мс
     * @params [immediate] {Boolean} Флаг срабатывания вначале временного отрезка
     */
    static debounce( func: Function, delay: number, immediate?: boolean ) {
        let inDebounce: number | null = null;
        return function () {
            //@ts-ignore
            const context = this,
                args = arguments;
            if ( inDebounce !== null ) {
                window.clearTimeout( inDebounce );
            }
            inDebounce = window.setTimeout( function () {
                inDebounce = null;
                if ( !immediate )
                    func.apply( context, args );
            }, delay );
            if ( immediate && !inDebounce ) func.apply( context, args );
        };
    }

    /**
     * Оборачивание функции для срабатывания не чаще временного интервала
     * @method throttle
     * @static
     * @params func {Function} Функция
     * @params limit {Number} Задержка в мс
     */
    static throttle<K extends Function>( func: K, limit: number ) {
        let inThrottle: boolean, lastFunc: number, lastRan: number;
        return function () {
            //@ts-ignore
            const context = this,
                args = arguments;
            if ( !inThrottle ) {
                func.apply( context, args );
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout( lastFunc );
                lastFunc = window.setTimeout( function () {
                    if ( (Date.now() - lastRan) >= limit ) {
                        func.apply( context, args );
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan) );
            }
        } as unknown as K;
    }

    /**
     * Оборачивания списка объектов в *.csv формат
     * @method mapObjectsToCsv
     * @static
     * @property mapObjects {MapObject[]} Список объектов
     * @property headersKeysList {ExportToCsvHeader} Список заголовков
     */
    static mapObjectsToCsv( mapObjects: readonly MapObject[], headersKeysList: ExportToCsvHeader ): Blob {

        const editor = new CsvEditor( '' );
        editor.columnCount = headersKeysList.length;
        const csvRowsList = this.mapObjectsToCellRows(mapObjects, headersKeysList);
        editor.addCells( csvRowsList );
        const csvFileString = editor.toString();

        return new Blob( ['\ufeff', csvFileString], { type: 'text/plain' } );
    }

    /**
     * Оборачивание списка метрик объектов в *.csv формат
     * @method mapObjectsToCsvGeometry
     * @static
     * @property mapObjects {MapObject[]} Список объектов
     */
    static mapObjectsToCsvGeometry(mapObjects: readonly MapObject[]): Blob {

        const headersKeysList: ExportToCsvHeader = [
            {key: 'OBJECT', value: 'OBJECT'},
            {key: 'MULTIOBJECT', value: 'MULTIOBJECT'},
            {key: 'SUBJECT', value: 'SUBJECT'},
            {key: 'POINT', value: 'POINT'},
            {key: 'X', value: 'X'},
            {key: 'Y', value: 'Y'}
        ];

        const csvRowsList: Cell[] = [];

        let row = 0;
        // получение "Заголовков"
        headersKeysList.forEach((headerItem, col) => csvRowsList.push({
            col,
            row,
            value: Utils.prepareExportValue(headerItem.value),
            type: 'String'
        }));
        row++;

        mapObjects.forEach((mapObject, mapObjectNumber) => {
            const objectsCount = mapObject.getObjectSubObjectsCount();
            for (let objectNumber = 0; objectNumber < objectsCount; objectNumber++) {
                const contoursCount = mapObject.getObjectContoursCount(objectNumber);

                for (let contourNumber = 0; contourNumber < contoursCount; contourNumber++) {
                    const pointsCount = mapObject.getContourPointsCount(objectNumber, contourNumber);

                    for (let positionNumber = 0; positionNumber < pointsCount; positionNumber++) {
                        const mapPoint = mapObject.getPoint({objectNumber, contourNumber, positionNumber});

                        headersKeysList.forEach((headerItem, col) => {
                            let value;
                            if (headerItem.key === 'OBJECT') {
                                value = mapObjectNumber + 1;
                            } else if (headerItem.key === 'MULTIOBJECT') {
                                value = objectNumber;
                            } else if (headerItem.key === 'SUBJECT') {
                                value = contourNumber;
                            } else if (headerItem.key === 'POINT') {
                                value = positionNumber + 1;
                            } else if (headerItem.key === 'X') {
                                value = mapPoint!.x;
                            } else if (headerItem.key === 'Y') {
                                value = mapPoint!.y;
                            }

                            csvRowsList.push({col, row, value: value + '', type: 'String'});
                        });

                        row++;
                    }
                }
            }
        });

        const editor = new CsvEditor('');
        editor.columnCount = headersKeysList.length;
        editor.addCells(csvRowsList);

        return new Blob(['\ufeff', editor.toString()], {type: 'text/plain'});
    }

    /**
     * Проверить значение для экспорта в csv, если строка содержит разделитель, добавить ""
     * экранировать ""
     * @private
     * @static
     * @method prepareExportValue
     * @param text {string}
     * @return {string}
     */
    private static prepareExportValue( text: string ): string {
        text = text.replace( /"/g, '"""' );

        if ( text.indexOf( ',' ) !== -1 ) {
            text = `"${text}"`;
        }

        return text;
    }


    /**
     * Преобразовать значение длины из метров в текущие единицы измерения
     * @static
     * @method linearMetersToUnits
     * @param meters {number} длина линии в метрах
     * @param unit {Unit} единицы измерения
     * @return {number}
     */
    static linearMetersToUnits( meters: number, unit: Unit ): { value: number; unit: Unit } {
        let result = meters;

        switch ( unit ) {
            case Unit.Foots:
                result /= 0.3048;
                break;
            case Unit.NauticalMiles:
                result *= 0.00053995680345572;
                break;
            case Unit.Miles:
                result *= 0.00062137119223733;
                break;
            case Unit.Meters:
                break;
            case Unit.Kilometers:
                result = result / 1000;
                break;
        }

        return { value: result, unit };
    }

    /**
     * Преобразовать значение длины из текущей единицы измерения в метры
     * @static
     * @method unitsToLinearMeter
     * @param unitMeters {number} - длина линии в единице измерения
     * @param unit {Unit} единицы измерения
     * @return {number}
     */
    static unitsToLinearMeter( unitMeters: number, unit: Unit ): number {
        let result: number = unitMeters;

        switch ( unit ) {
            case Unit.Foots:
                result = unitMeters * 0.3048;
                break;
            case  Unit.NauticalMiles:
                result = unitMeters * 1852;//1853,248
                break;
            case  Unit.Miles:
                result = unitMeters * 1609.344;
                break;
            case Unit.Meters:
                break;
            case Unit.Kilometers:
                result = unitMeters * 1000;
                break;
        }

        return result;
    }


    /**
     * Преобразовать значение площади из квадратных метров в текущие единицы измерения
     * @static
     * @method squareMetersToUnits
     * @param sqMeters {number} значение площади в кв. м
     * @param unit {Unit}  единицы измерения
     * @return {number}
     */
    static squareMetersToUnits( sqMeters: number, unit: Unit ): { value: number; unit: Unit } {
        let result = sqMeters;

        switch ( unit ) {
            case Unit.Hectares:
                result = result / 10000;
                break;
            case Unit.SquareMeters:
                break;
            case Unit.SquareKilometers:
                result = result / 1000000;
                break;
        }
        return { value: result, unit };
    }

    /**
     * Преобразовать значение площади из текущей единицы измерения в квадратный метр
     * @static
     * @method unitsToSquareMeters
     * @param unitSqMeters {number} значение площади в единице измерения
     * @param unit {Unit}  единицы измерения
     * @return {number}
     */
    static unitsToSquareMeters( unitSqMeters: number, unit: Unit ): number {
        let result: number = unitSqMeters;

        switch ( unit ) {
            case Unit.Hectares:
                result = unitSqMeters * 10000;
                break;
            case Unit.SquareMeters:
                break;
            case Unit.SquareKilometers:
                result = result * 1000000;
                break;
        }

        return result;
    }


    /**
     * Конвертация результата измерения угла
     * @static
     * @method degreesToUnits
     * @param degrees {string} значение угла в градусах
     * @param unit {AngleUnit}  единицы измерения
     * @return {string} Результат в нужных единицах измерения
     */
    static degreesToUnits( degrees: number, unit: AngleUnit ): { value: number; unit: AngleUnit.Degrees | AngleUnit.Radians } | { value: [number, number, number]; unit: AngleUnit.DegreesMinutesSeconds } {
        let result;
        switch ( unit ) {
            case AngleUnit.Radians:
                result = Trigonometry.toRadians( degrees );
                return { value: result, unit };
            case AngleUnit.DegreesMinutesSeconds:
                result = Utils.degrees2DegreesMinutesSeconds( degrees );
                return { value: result, unit };
            default:
                result = degrees;
                return { value: result, unit };
        }
    }

    /**
     * Конвертация результата измерения угла
     * @static
     * @method radiansToUnits
     * @param radians {string} значение угла в радианах
     * @param unit {AngleUnit}  единицы измерения
     * @return {string} Результат в нужных единицах измерения
     */
    static radiansToUnits( radians: number, unit: AngleUnit ): { value: number; unit: AngleUnit.Degrees | AngleUnit.Radians } | { value: [number, number, number]; unit: AngleUnit.DegreesMinutesSeconds } {
        let result;
        const degrees = Trigonometry.toDegrees( radians );
        switch ( unit ) {
            case AngleUnit.Degrees:
                result = degrees;
                return { value: result, unit };
            case AngleUnit.DegreesMinutesSeconds:
                result = Utils.degrees2DegreesMinutesSeconds( degrees );
                return { value: result, unit };
            default:
                result = degrees;
                return { value: result, unit };
        }
    }

    /**
     * Получить строку с координатой в формате (градусы, минуты, секунды)
     * @private
     * @static
     * @method degrees2DegreesMinutesSeconds
     * @param degrees {number} Угол в градусах
     * @return {string} Строка с координатой в формате (градусы, минуты, секунды)
     */
    private static degrees2DegreesMinutesSeconds( degrees: number ): [number, number, number] {

        let iDegrees = Math.floor( degrees );

        const minutes = (degrees - iDegrees) * 60.0;

        let iMinutes = Math.floor( minutes );

        let seconds = (minutes - iMinutes) * 60.0;

        if ( (seconds + 0.000001) > 60.0 ) {
            seconds = 0;
            iMinutes += 1;
        }

        if ( iMinutes >= 60 ) {
            iMinutes = 0;
            iDegrees += 1;
        }

        iDegrees = iDegrees % 360;

        iMinutes = Math.abs( iMinutes );

        return [iDegrees, iMinutes, seconds];
    }

    /**
     * Получить строку с координатой в формате (градусы, минуты, секунды)
     * @method createDegreesMinutesSecondsStr
     * @private
     * @param iDegrees {number} Целые градусы
     * @param iMinutes {number} Целые минуты
     * @param seconds {number} Секунды
     * @return {string} Строка с координатой в формате (градусы, минуты, секунды)
     */
    static createDegreesMinutesSecondsStr( iDegrees: number, iMinutes: number, seconds: number ): string {

        let result = '';

        if ( iDegrees < 0 ) {
            result = '-';
            iDegrees = Math.abs( iDegrees );
        }

        if ( iDegrees < 10 )
            result = result + '00';
        else if ( iDegrees < 100 )
            result = result + '0';

        result = result + iDegrees.toString( 10 ) + '° ';

        iMinutes = Math.abs( iMinutes );
        iMinutes < 10 ? result += '0' + iMinutes + '\' ' : result += iMinutes + '\' ';

        seconds = Math.floor( Math.abs( seconds ) * 100 ) / 100;

        if ( seconds < 10 )
            result = result + '0';

        let secondsStr = '' + seconds;

        const secondsDot = Math.max( secondsStr.indexOf( '.' ), secondsStr.indexOf( ',' ) );

        if ( secondsDot === -1 ) {
            secondsStr += '.00';
        } else if ( secondsDot === secondsStr.length - 2 ) {
            secondsStr += '0';
        }

        result = (result + secondsStr + '"');


        return result;
    }

    /**
     * Преобразовать в число
     * @static
     * @method toNumber
     * @param value {unknown} Значение
     * @return {number | undefined} Число из заданного значения
     */
    static toNumber( value: unknown ): number | undefined {
        let result: number = NaN;

        if ( typeof (value) === 'number' ) {
            result = value;
        } else if ( typeof value === 'string' ) {
            result = parseFloat( value );
        }

        if ( !isNaN( result ) ) {
            return result;
        }
    }

    /**
     * Сортировка строк
     * @static
     * @method sortAlphaNum
     * @param a {string} Строка 1
     * @param b {string} Строка 2
     * @return {number} Результат сравнения
     */
    static sortAlphaNum( a: string, b: string ): number {
        return a.localeCompare( b, 'en', { numeric: true, sensitivity: 'accent' } );
    }

    /**
     * Преобразование версии сервиса
     * @static
     * @method getServiceVersionValue
     * @param serviceVersion {string} Версия сервиса вида 15.10.1
     * @return {string} Версия сервиса вида 151001
     */
    static getServiceVersionValue( serviceVersion: string ): string {
        const versionArray = serviceVersion.trim().split( '.' );
        if ( versionArray && versionArray.length === 3 ) {
            const major = versionArray[ 0 ];
            const minor = versionArray[ 1 ].length < 2 ? '0' + versionArray[ 1 ] : versionArray[ 1 ];
            const micro = versionArray[ 2 ].length < 2 ? '0' + versionArray[ 2 ] : versionArray[ 2 ];

            return `${major}${minor}${micro}`;
        }
        return '0';
    }

    /**
     * Сформировать Blob с текстом в кодировке Win-1251
     * @static
     * @method UnicodeToWin1251Blob
     * @param input {string} Текст
     * @return {Blob} Бинарные данные
     */
    static unicodeToWin1251Blob( input: string ): Blob {
        const length = input.length;
        const result = new Uint8Array( length );
        for ( let index = 0; index < length; index++ ) {
            const codePoint = input.charCodeAt( index );
            let byteCharCode = this.DMap[ codePoint ];
            if ( byteCharCode === undefined ) {
                byteCharCode = 63;
            }
            result[ index ] = (byteCharCode);
        }

        return new Blob( [result] );
    }

    private static DMap: { [ i: number ]: number } = {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        11: 11,
        12: 12,
        13: 13,
        14: 14,
        15: 15,
        16: 16,
        17: 17,
        18: 18,
        19: 19,
        20: 20,
        21: 21,
        22: 22,
        23: 23,
        24: 24,
        25: 25,
        26: 26,
        27: 27,
        28: 28,
        29: 29,
        30: 30,
        31: 31,
        32: 32,
        33: 33,
        34: 34,
        35: 35,
        36: 36,
        37: 37,
        38: 38,
        39: 39,
        40: 40,
        41: 41,
        42: 42,
        43: 43,
        44: 44,
        45: 45,
        46: 46,
        47: 47,
        48: 48,
        49: 49,
        50: 50,
        51: 51,
        52: 52,
        53: 53,
        54: 54,
        55: 55,
        56: 56,
        57: 57,
        58: 58,
        59: 59,
        60: 60,
        61: 61,
        62: 62,
        63: 63,
        64: 64,
        65: 65,
        66: 66,
        67: 67,
        68: 68,
        69: 69,
        70: 70,
        71: 71,
        72: 72,
        73: 73,
        74: 74,
        75: 75,
        76: 76,
        77: 77,
        78: 78,
        79: 79,
        80: 80,
        81: 81,
        82: 82,
        83: 83,
        84: 84,
        85: 85,
        86: 86,
        87: 87,
        88: 88,
        89: 89,
        90: 90,
        91: 91,
        92: 92,
        93: 93,
        94: 94,
        95: 95,
        96: 96,
        97: 97,
        98: 98,
        99: 99,
        100: 100,
        101: 101,
        102: 102,
        103: 103,
        104: 104,
        105: 105,
        106: 106,
        107: 107,
        108: 108,
        109: 109,
        110: 110,
        111: 111,
        112: 112,
        113: 113,
        114: 114,
        115: 115,
        116: 116,
        117: 117,
        118: 118,
        119: 119,
        120: 120,
        121: 121,
        122: 122,
        123: 123,
        124: 124,
        125: 125,
        126: 126,
        127: 127,
        1027: 129,
        8225: 135,
        1046: 198,
        8222: 132,
        1047: 199,
        1168: 165,
        1048: 200,
        1113: 154,
        1049: 201,
        1045: 197,
        1050: 202,
        1028: 170,
        160: 160,
        1040: 192,
        1051: 203,
        164: 164,
        166: 166,
        167: 167,
        169: 169,
        171: 171,
        172: 172,
        173: 173,
        174: 174,
        1053: 205,
        176: 176,
        177: 177,
        1114: 156,
        181: 181,
        182: 182,
        183: 183,
        8221: 148,
        187: 187,
        1029: 189,
        1056: 208,
        1057: 209,
        1058: 210,
        8364: 136,
        1112: 188,
        1115: 158,
        1059: 211,
        1060: 212,
        1030: 178,
        1061: 213,
        1062: 214,
        1063: 215,
        1116: 157,
        1064: 216,
        1065: 217,
        1031: 175,
        1066: 218,
        1067: 219,
        1068: 220,
        1069: 221,
        1070: 222,
        1032: 163,
        8226: 149,
        1071: 223,
        1072: 224,
        8482: 153,
        1073: 225,
        8240: 137,
        1118: 162,
        1074: 226,
        1110: 179,
        8230: 133,
        1075: 227,
        1033: 138,
        1076: 228,
        1077: 229,
        8211: 150,
        1078: 230,
        1119: 159,
        1079: 231,
        1042: 194,
        1080: 232,
        1034: 140,
        1025: 168,
        1081: 233,
        1082: 234,
        8212: 151,
        1083: 235,
        1169: 180,
        1084: 236,
        1052: 204,
        1085: 237,
        1035: 142,
        1086: 238,
        1087: 239,
        1088: 240,
        1089: 241,
        1090: 242,
        1036: 141,
        1041: 193,
        1091: 243,
        1092: 244,
        8224: 134,
        1093: 245,
        8470: 185,
        1094: 246,
        1054: 206,
        1095: 247,
        1096: 248,
        8249: 139,
        1097: 249,
        1098: 250,
        1044: 196,
        1099: 251,
        1111: 191,
        1055: 207,
        1100: 252,
        1038: 161,
        8220: 147,
        1101: 253,
        8250: 155,
        1102: 254,
        8216: 145,
        1103: 255,
        1043: 195,
        1105: 184,
        1039: 143,
        1026: 128,
        1106: 144,
        8218: 130,
        1107: 131,
        8217: 146,
        1108: 186,
        1109: 190
    };
    /**
     * Формирование данных таблицы для вставки в текстовый редактор
     * @method mapObjectsToTable
     * @static
     * @param mapObjects {MapObject[]} Список объектов
     * @param headersKeysList {ExportToCsvHeader} Список заголовков
     * @return {Cell[]} Массив ячеек таблицы
     */
    static mapObjectsToCellRows(mapObjects: readonly MapObject[] | undefined, headersKeysList: ExportToCsvHeader): Cell[] {

        const dataRowsList: Cell[] = [];

        let row = 0;
        // получение "Заголовков"
        headersKeysList.forEach((headerItem, col) => dataRowsList.push({
            col,
            row,
            value: Utils.prepareExportValue(headerItem.value),
            type: 'String'
        }));
        row++;
        if (mapObjects) {

            mapObjects.forEach((mapObject) => {
                const semanticList = mapObject.getSemantics();
                headersKeysList.forEach((headerItem, col) => {
                    let value = '';
                    if (headerItem.key === '__objectName') {
                        value = Utils.prepareExportValue(mapObject.objectName || '');
                    } else if (headerItem.key === '__layerAlias') {
                        value = Utils.prepareExportValue(mapObject.vectorLayer.alias);
                    } else if (headerItem.key === '__sheetName') {
                        value = mapObject.sheetName || '';
                    } else if (headerItem.key === '__gmlId') {
                        value = Utils.prepareExportValue('' + (mapObject.objectNumber || 0));
                    } else if (headerItem.key === '__objectPerimeter') {
                        const mapObjectContent = new MapObjectContent(mapObject);
                        const objectPerimeterStringParts = mapObjectContent.objectPerimeterString.split(' ').filter(part => part !== '');
                        value = objectPerimeterStringParts[0] !== undefined ? objectPerimeterStringParts[0].replace('.', ',') : '';
                    } else if (headerItem.key === '__objectArea') {
                        const mapObjectContent = new MapObjectContent(mapObject);
                        const objectAreaStringParts = mapObjectContent.objectAreaString.split(' ').filter(part => part !== '');
                        value = objectAreaStringParts[0] || '';
                    } else if (headerItem.key === '__measureUnitArea') {
                        const mapObjectContent = new MapObjectContent(mapObject);
                        const objectAreaStringParts = mapObjectContent.objectAreaString.split(' ').filter(part => part !== '');
                        value = objectAreaStringParts[objectAreaStringParts.length - 1] !== undefined ? objectAreaStringParts[objectAreaStringParts.length - 1] : '';
                    } else if (headerItem.key === '__measureUnitPerimeter') {
                        const mapObjectContent = new MapObjectContent(mapObject);
                        const objectPerimeterStringParts = mapObjectContent.objectPerimeterString.split(' ').filter(part => part !== '');
                        value = objectPerimeterStringParts[objectPerimeterStringParts.length - 1] !== undefined ? objectPerimeterStringParts[objectPerimeterStringParts.length - 1] : '';
                    } else {
                        const currentSemanticValue = semanticList.filter(semantic => headerItem.key === semantic.key && headerItem.value === semantic.name).map(semantic => semantic.value).join(';');
                        if (currentSemanticValue) {
                            value = Utils.prepareExportValue(currentSemanticValue);
                        }
                    }
                    dataRowsList.push({ col, row, value, type: 'String' });
                });
                row++;
            });
        }
        return dataRowsList;
    }


    /**
    * Создание таблицы
    * @method createHtmlTable
    * @static
    * @property dataRowsList {Cell[]} Список со строками таблицы
    * @return {HTMLTableElement} HTML таблица
    */
    static createHtmlTable(dataRowsList: Cell[]): HTMLTableElement {
        const table = document.createElement('table');
        const rowsLength = dataRowsList[dataRowsList.length - 1].row;
        for (let rowNumber = 0; rowNumber <= rowsLength; rowNumber++) {
            const row = document.createElement('tr');
            const rowData = dataRowsList.filter(item => item.row === rowNumber);
            rowData.forEach(data => {
                const cell = document.createElement('td');
                cell.style.border = '1px solid black';
                cell.style.padding = '2px';
                cell.style.textAlign = 'center';
                cell.textContent = data.value;
                row.appendChild(cell);
            });
            table.style.borderCollapse = 'collapse';
            table.appendChild(row);
        }
        return table;
    }

    /**
     * Выделение из полного имени файла имени и расширения
     * @method parseFileName
     * @static
     * @property filename {string} Имя файла
     * @return {filename:string; extension:string } Разобранное имя файла
     */
    static parseFileName(filename: string): { fileName: string; extension: string } {
        const fileNamePattern = /(.*)(\.[0-9A-Za-z]*)$/;
        const match = fileNamePattern.exec(filename);
        const parseResult = { fileName: '', extension: '' };
        if (match) {
            parseResult.fileName = match[1];
            parseResult.extension = match[2];
        }
        return parseResult;
    }

    static toFixed(value: number, digits: number ) {
        return (Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits)).toFixed(digits);
    }
}

export default Utils;
