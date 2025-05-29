/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Сервис взаимодействия с браузером                  *
 *                                                                  *
 *******************************************************************/

import Utils from '../Utils';
import { LocalStorage } from './LocalStorage';
import axios from 'axios';
import Style from '~/style/Style';
import { LOCALE } from '~/types/CommonTypes';
import * as XLSX from 'xlsx';

export const MIME_TYPES =
    {
        '3gp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        'a': 'application/octet-stream',
        'ai': 'application/postscript',
        'aif': 'audio/x-aiff',
        'aifc': 'audio/x-aiff',
        'aiff': 'audio/x-aiff',
        'au': 'audio/basic',
        'avi': 'video/x-msvideo',
        'bat': 'text/plain',
        'bin': 'application/octet-stream',
        'bmp': 'image/x-ms-bmp',
        'c': 'text/plain',
        'cdf': 'application/x-cdf',
        'csh': 'application/x-csh',
        'css': 'text/css',
        'dll': 'application/octet-stream',
        'doc': 'application/msword',
        'docx': 'application/msword',
        'dot': 'application/msword',
        'dvi': 'application/x-dvi',
        'eml': 'message/rfc822',
        'eps': 'application/postscript',
        'etx': 'text/x-setext',
        'exe': 'application/octet-stream',
        'gif': 'image/gif',
        'gtar': 'application/x-gtar',
        'h': 'text/plain',
        'hdf': 'application/x-hdf',
        'htm': 'text/html',
        'html': 'text/html',
        'jpe': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'js': 'application/x-javascript',
        'ksh': 'text/plain',
        'latex': 'application/x-latex',
        'm1v': 'video/mpeg',
        'man': 'application/x-troff-man',
        'me': 'application/x-troff-me',
        'mht': 'message/rfc822',
        'mhtml': 'message/rfc822',
        'mif': 'application/x-mif',
        'mov': 'video/quicktime',
        'movie': 'video/x-sgi-movie',
        'mp2': 'audio/mpeg',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'mpa': 'video/mpeg',
        'mpe': 'video/mpeg',
        'mpeg': 'video/mpeg',
        'mpg': 'video/mpeg',
        'ms': 'application/x-troff-ms',
        'nc': 'application/x-netcdf',
        'nws': 'message/rfc822',
        'o': 'application/octet-stream',
        'obj': 'application/octet-stream',
        'oda': 'application/oda',
        'ogv': 'video/ogg',
        'pbm': 'image/x-portable-bitmap',
        'pdf': 'application/pdf',
        'pfx': 'application/x-pkcs12',
        'pgm': 'image/x-portable-graymap',
        'png': 'image/png',
        'pnm': 'image/x-portable-anymap',
        'pot': 'application/vnd.ms-powerpoint',
        'ppa': 'application/vnd.ms-powerpoint',
        'ppm': 'image/x-portable-pixmap',
        'pps': 'application/vnd.ms-powerpoint',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.ms-powerpoint',
        'ps': 'application/postscript',
        'pwz': 'application/vnd.ms-powerpoint',
        'py': 'text/x-python',
        'pyc': 'application/x-python-code',
        'pyo': 'application/x-python-code',
        'qt': 'video/quicktime',
        'ra': 'audio/x-pn-realaudio',
        'ram': 'application/x-pn-realaudio',
        'ras': 'image/x-cmu-raster',
        'rdf': 'application/xml',
        'rgb': 'image/x-rgb',
        'roff': 'application/x-troff',
        'rtx': 'text/richtext',
        'sgm': 'text/x-sgml',
        'sgml': 'text/x-sgml',
        'sh': 'application/x-sh',
        'shar': 'application/x-shar',
        'snd': 'audio/basic',
        'so': 'application/octet-stream',
        'src': 'application/x-wais-source',
        'swf': 'application/x-shockwave-flash',
        't': 'application/x-troff',
        'tar': 'application/x-tar',
        'tcl': 'application/x-tcl',
        'tex': 'application/x-tex',
        'texi': 'application/x-texinfo',
        'texinfo': 'application/x-texinfo',
        'tif': 'image/tiff',
        'tiff': 'image/tiff',
        'tr': 'application/x-troff',
        'tsv': 'text/tab-separated-values',
        'txt': 'text/plain',
        'ustar': 'application/x-ustar',
        'vcf': 'text/x-vcard',
        'wav': 'audio/x-wav',
        'webm': 'video/webm',
        'wiz': 'application/msword',
        'wmv': 'video/x-ms-wmv',
        'wsdl': 'application/xml',
        'xbm': 'image/x-xbitmap',
        'xlb': 'application/vnd.ms-excel',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.ms-excel',
        'xml': 'text/xml',
        'xpdl': 'application/xml',
        'xpm': 'image/x-xpixmap',
        'xsl': 'application/xml',
        'xwd': 'image/x-xwindowdump',
        'zip': 'application/zip'
    };

//поддерживаются элементом video в HTML5
export const VIDEO_EXTENSIONS = [
    '3gp', '3g2', 'm1v', 'mov', 'mp4', 'mpa', 'mpe', 'mpeg', 'mpg', 'ogv', 'qt', 'webm'
];

export const IMAGE_EXTENSIONS = [
    'jpg', 'png', 'bmp', 'jpeg'
];

/**
 * Класс взаимодействия с браузером
 * @class BrowserService
 */
class BrowserService {

    private urlApi = (self || window).URL || (self || window).webkitURL;
    private readonly anchorElement?: HTMLAnchorElement;
    private readonly inputElement?: HTMLInputElement;
    private readonly canvasElement?: HTMLCanvasElement;
    public localStorage = LocalStorage;

    private readonly colorArray = [
        '#3F85F2',
        '#dd4039',
        '#f5b420',
        '#009e5a',
        '#ad44ba',
        '#00adc0',
        '#ff6e46',
        '#9e9d2e',
        '#5c6bbe',
        '#f25f91',
        '#007a6b',
        '#c40c5b',
        '#5330C4',
        '#dd7339',
        '#d3dd39',
        '#39dd99',
        '#6f39dd',
        '#2786bd',
        '#df5732',
        '#df3283'
    ];

    get isSecureContext() {
        // return (window.location.protocol == 'https:');
        return window.isSecureContext;
    }

    private readonly inputOnChangeBind: () => void;
    private inputFileResolveHandler?: (files?: FileList) => void;

    constructor() {

        this.inputOnChangeBind = this.inputOnChange.bind(this);

        if ((self || window).document) {
            this.anchorElement = document.createElement('a');
            this.anchorElement.style.display = 'none';
            if (document.body) {
                document.body.appendChild(this.anchorElement);
            }


            this.inputElement = document.createElement('input');
            this.inputElement.setAttribute('type', 'file');
            this.inputElement.style.display = 'none';
            this.inputElement.addEventListener('change', this.inputOnChangeBind);

            this.canvasElement = document.createElement('canvas');
        }
    }

    /**
     * Создать ссылку из данных
     * @private
     * @method makeObjectURL
     * @param data {object} Входные данные
     * @return {string} Ссылка для скачивания
     */
    makeObjectURL(data: Blob | MediaSource | undefined) {
        if (data === undefined) {
            return '';
        }
        return this.urlApi.createObjectURL(data);

    }

    /**
     * Освободить данные по ссылке
     * @method clearObjectURL
     * @param objectUrl {string} Ссылка на объект
     */
    clearObjectURL(objectUrl: string) {
        this.urlApi.revokeObjectURL(objectUrl);
    }

    /**
     * Обработчик очистки после загрузки
     * @private
     * @method afterDownload
     * @param objectUrl {string} Ссылка на объект
     */
    private afterDownload(objectUrl: string) {
        setTimeout(() => this.urlApi.revokeObjectURL(objectUrl));
    }

    /**
     * Скачать данные
     * @method downloadContent
     * @param content {Blob} Данные для скачивания
     * @param [fileName] {string} Имя файла
     */
    downloadContent(content: Blob, fileName = Utils.generateGUID() + '.unknown') {

        if (!this.anchorElement) {
            return;
        }

        const objectUrl = this.makeObjectURL(content);

        if (!this.anchorElement.parentNode) {
            document.body.appendChild(this.anchorElement);
        }

        this.anchorElement.href = objectUrl;
        this.anchorElement.download = fileName;
        this.anchorElement.click();

        this.afterDownload(objectUrl);
    }


    /**
     * Скачать данные по ссылке
     * @method downloadContent
     * @param href {string} Ссылка для скачивания
     * @param [fileName] {string} Имя файла
     */
    downloadLink(href: string, fileName?: string) {

        if (!this.anchorElement) {
            return;
        }


        if (!this.anchorElement.parentNode) {
            document.body.appendChild(this.anchorElement);
        }

        this.anchorElement.href = href;
        this.anchorElement.download = fileName || href.slice(href.lastIndexOf('/') + 1);
        this.anchorElement.click();
    }

    /**
     * Открыть данные по ссылке
     * @method downloadContent
     * @param href {string} Ссылка для скачивания
     * @param target {string} Атрибут вкладки
     */
    openLink(href: string, target = '_blank') {
        if (!this.anchorElement) {
            return;
        }

        if (!this.anchorElement.parentNode) {
            document.body.appendChild(this.anchorElement);
        }

        this.anchorElement.href = href;
        this.anchorElement.target = target;
        this.anchorElement.click();

    }

    /**
     * Получить данные из localStorage
     * @method retrieveFromLocalStorage
     * @param key {string} Ключ в localStorage
     * @param [jsonFlag] {boolean} Преобразовать строку в JSON формат
     * @return {string|undefined} Данные из localStorage
     */
    retrieveFromLocalStorage<T>(key: string, jsonFlag = false) {
        return this.localStorage.getItem<T>(key, jsonFlag);
    }

    /**
     * Перевести Blob в XML
     * @async
     * @method readBlobAsXml
     * @param blob {Blob} Данные для перевода
     * @return {Document} Данные в виде XML
     */
    async readBlobAsXml(blob: Blob) {
        const uri = URL.createObjectURL(blob);
        const result = await axios.get<Document>(uri, { responseType: 'document' });
        return result.data;
    }

    /**
     * Перевести Text в XML
     * @method readTextAsXml
     * @param text {string} Данные для перевода
     * @return {Document} Данные в виде XML
     */
    readTextAsXml(text: string) {
        return new DOMParser().parseFromString(text, 'text/xml');
    }

    /**
     * Отобразить диалог выбора файла на клиенте
     * @method openFileDialog
     * @return {Promise} Promise выбора файла
     */
    openFileDialog(accept?: string[], multiply?: true) {

        if (!this.inputElement) {
            return Promise.reject('Input is not defined');
        }

        if (accept) {
            this.inputElement.setAttribute('accept', accept.join(','));
        } else {
            this.inputElement.removeAttribute('accept');
        }

        if (multiply) {
            this.inputElement.setAttribute('multiple', 'multiple');
        } else {
            this.inputElement.removeAttribute('multiple');
        }

        this.inputElement.value = '';

        return new Promise<FileList | undefined>(resolve => {
            this.inputFileResolveHandler = resolve;
            this.inputElement?.dispatchEvent(new MouseEvent('click'));
        });
    }

    /**
     * Обработчик выбора файла
     * @private
     * @method inputOnChange
     */
    private inputOnChange() {
        if (this.inputFileResolveHandler) {
            this.inputFileResolveHandler(this.inputElement?.files || undefined);
            this.inputFileResolveHandler = undefined;
        }
    }

    /**
     * Проверить доступность сервиса определения местоположения
     * @method checkGeolocation
     * @return  {boolean} Доступность сервиса определения местоположения
     */
    checkGeolocation() {
        return navigator && navigator.geolocation && this.isSecureContext;
    }

    /**
     * Получить местоположение пользователя
     * @method getUserPosition
     * @param [options] {PositionOptions} Параметры запроса местоположения
     * @return  {Promise} Promise получения местоположения
     */
    getUserPosition(options?: PositionOptions) {
        if (this.checkGeolocation()) {
            const geoOptions: PositionOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0, ...options
            };

            return new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    position => resolve(position),
                    failure => reject(failure),
                    geoOptions
                );
            });
        } else {
            return Promise.reject('Geolocation service is not available');
        }
    }

    /**
     * Следить за изменением местоположения пользователя
     * @method watchUserPosition
     * @param resolve {function} Обработчик успешного получения местоположения
     * @param reject {function} Обработчик ошибки получения местоположения
     * @param [options] {PositionOptions} Параметры запроса местоположения
     * @return {number|undefined} Идентификатор функции слежения
     */
    watchUserPosition(resolve: (val: GeolocationPosition) => void, reject: (val: GeolocationPositionError) => void, options?: PositionOptions): number | undefined {
        if (this.checkGeolocation()) {
            const geoOptions: PositionOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0, ...options
            };

            return navigator.geolocation.watchPosition(resolve, reject, geoOptions);
        } else {
            reject({
                code: 1,
                message: '',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3
            });
        }
    }

    /**
     * Прекратить слежения за изменением местоположения пользователя
     * @method watchUserPosition
     * @param watchId {number} Идентификатор функции слежения
     */
    stopWatchUserPosition(watchId: number): void {
        if (this.checkGeolocation()) {
            navigator.geolocation.clearWatch(watchId);
        }
    }

    /**
     * Скопировать текст в буфер обмена
     * @method copyToClipboard
     * @param text {string} Строка для копирования
     * @return {Promise}
     */
    copyToClipboard(text: string) {
        return new Promise<boolean>((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    resolve(true);
                }).catch((e) => {
                    reject(e);
                });
            } else if ((window as any).clipboardData) { // для Internet Explorer
                (window as any).clipboardData.setData('text', text);
                resolve(true);
            } else {
                reject('clipboard is undefined');
            }
        });
    }

    /**
     * Преобразовать SVG в строку Base64
     * @method svgToBase64
     * @param svgElement {SVGSVGElement} Элемент SVG
     * @return {Promise} строка Base64
     */
    async svgToBase64(svgElement: SVGSVGElement) {

        if (!this.canvasElement) {
            return Promise.reject('Canvas is not defined');
        }

        const image = await this.svgToImage(svgElement);

        this.canvasElement.width = image.width;
        this.canvasElement.height = image.height;
        const context = this.canvasElement.getContext('2d');
        if (!context) {
            throw new Error('Cannot get Canvas2D context');
        }
        context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        context.drawImage(image, 0, 0);

        return this.canvasElement.toDataURL();
    }

    stylesToSvgElement(styleOptions: Style[], locale: LOCALE): SVGSVGElement {

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttributeNS('', 'width', '160');
        svg.setAttributeNS('', 'height', '110');

        if (styleOptions.length > 0) {
            const hatchDefs = document.createElementNS('', 'defs');
            styleOptions.forEach(({ hatch }, index) => {
                if (hatch && hatch.notEmpty) {
                    const pattern = document.createElementNS('', 'pattern');
                    pattern.setAttributeNS('', 'id', 'diagonalHatch' + index);
                    if (hatch.step !== undefined) {
                        pattern.setAttributeNS('', 'width', hatch.step);

                    }
                    pattern.setAttributeNS('', 'height', '10');
                    if (hatch.angle !== undefined) {
                        pattern.setAttributeNS('', 'patternTransform', 'rotate(' + (-hatch.angle - 90) + ')');
                    }
                    pattern.setAttributeNS('', 'patternUnits', 'userSpaceOnUse');

                    const line = document.createElementNS('', 'line');
                    if (hatch.color !== undefined) {
                        line.setAttributeNS('', 'stroke', hatch.color);
                    }
                    if (hatch.width !== undefined) {
                        line.setAttributeNS('', 'stroke-width', hatch.width);
                    }
                    if (hatch.opacity !== undefined) {
                        line.setAttributeNS('', 'stroke-opacity', hatch.opacity + '');
                    }
                    line.setAttributeNS('', 'x1', '5');
                    line.setAttributeNS('', 'x2', '5');
                    line.setAttributeNS('', 'y1', '0');
                    line.setAttributeNS('', 'y2', '10');

                    pattern.appendChild(line);
                    hatchDefs.appendChild(pattern);
                }
            });
            if (hatchDefs.children.length !== 0) {
                svg.appendChild(hatchDefs);
            }
        }

        if (locale === LOCALE.Line) {
            styleOptions.forEach(({ stroke }) => {
                if (stroke) {
                    const line = document.createElementNS('', 'line');
                    if (stroke.color !== undefined) {
                        line.setAttributeNS('', 'stroke', stroke.color);
                    }
                    if (stroke.width !== undefined) {
                        line.setAttributeNS('', 'stroke-width', stroke.width);
                    }
                    if (stroke.opacity !== undefined) {
                        line.setAttributeNS('', 'stroke-opacity', stroke.opacity + '');
                    }
                    line.setAttributeNS('', 'stroke-dasharray', stroke.dasharray !== undefined ? stroke.dasharray : '0 0');
                    line.setAttributeNS('', 'x1', '10');
                    line.setAttributeNS('', 'x2', '150');
                    line.setAttributeNS('', 'y1', '90');
                    line.setAttributeNS('', 'y2', '10');

                    svg.appendChild(line);
                }
            });
        }

        if (locale === LOCALE.Plane) {
            styleOptions.forEach(({ fill, stroke, hatch }, index) => {
                if (fill) {
                    const rect = document.createElementNS('', 'rect');
                    rect.setAttributeNS('', 'x', '10');
                    rect.setAttributeNS('', 'y', '10');
                    rect.setAttributeNS('', 'width', '140');
                    rect.setAttributeNS('', 'height', '90');
                    rect.setAttributeNS('', 'fill', fill.color !== undefined ? fill.color : 'rgba(0,0,0,0)');
                    if (fill.opacity !== undefined) {
                        rect.setAttributeNS('', 'fill-opacity', fill.opacity * 100 + '%');
                    }

                    svg.appendChild(rect);
                }
                if (stroke) {
                    const rect = document.createElementNS('', 'rect');
                    rect.setAttributeNS('', 'x', '10');
                    rect.setAttributeNS('', 'y', '10');
                    rect.setAttributeNS('', 'width', '140');
                    rect.setAttributeNS('', 'height', '90');
                    rect.setAttributeNS('', 'fill', 'transparent');
                    rect.setAttributeNS('', 'fill-opacity', '0%');

                    rect.setAttributeNS('', 'stroke', stroke.color !== undefined ? stroke.color : '');
                    if (stroke.width !== undefined) {
                        rect.setAttributeNS('', 'stroke-width', stroke.width);
                    }
                    if (stroke.opacity !== undefined) {
                        rect.setAttributeNS('', 'stroke-opacity', stroke.opacity * 100 + '%');
                    }
                    rect.setAttributeNS('', 'stroke-dasharray', stroke.dasharray !== undefined ? stroke.dasharray : '0 0');

                    svg.appendChild(rect);
                }
                if (hatch) {
                    const rect = document.createElementNS('', 'rect');
                    rect.setAttributeNS('', 'x', '10');
                    rect.setAttributeNS('', 'y', '10');
                    rect.setAttributeNS('', 'width', '140');
                    rect.setAttributeNS('', 'height', '90');
                    rect.setAttributeNS('', 'fill', 'url(#diagonalHatch' + index + ')');

                    svg.appendChild(rect);
                }
            });
        }

        if (locale === LOCALE.Point) {
            const graphicTemplatesDefs = document.createElementNS('', 'defs');

            svg.appendChild(graphicTemplatesDefs);

            styleOptions.forEach(({ marker }, index) => {
                if (marker) {
                    const markerLocalGUID = 'm' + Utils.generateGUID();

                    const markerElement = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                    markerElement.setAttribute('id', markerLocalGUID);

                    graphicTemplatesDefs.appendChild(markerElement);

                    let image = '<svg><circle stroke="#1672EC" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="white" fill-opacity="0.8" pointer-events="none" cx="15" cy="15" r="12"/></svg>';
                    let width = 32, height = 32, refX = 16, refY = 16;

                    if (marker.markerDescription) {
                        if (marker.markerDescription.image) {
                            image = marker.markerDescription.image;
                        }
                        if (marker.markerDescription.width) {
                            width = marker.markerDescription.width;
                        }
                        if (marker.markerDescription.height) {
                            height = marker.markerDescription.height;
                        }
                        if (marker.markerDescription.refX !== undefined) {
                            refX = marker.markerDescription.refX;
                        }
                        if (marker.markerDescription.refY !== undefined) {
                            refY = marker.markerDescription.refY;
                        }
                    }

                    if (image[0] !== '<') {
                        let imageAttribute = markerElement.querySelector('image');
                        if (!imageAttribute) {
                            imageAttribute = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                            markerElement.appendChild(imageAttribute);
                        }
                        imageAttribute.setAttribute('href', image);
                    } else {
                        const template = document.createElement('template');
                        template.innerHTML = image.trim();

                        const svgElements = template.content.querySelector('svg')?.childNodes as NodeListOf<SVGElement>;
                        if (svgElements) {
                            svgElements.forEach(element => markerElement.appendChild(element));
                        }
                    }

                    markerElement.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
                    markerElement.setAttribute('refX', refX + '');
                    markerElement.setAttribute('refY', refY + '');
                    markerElement.setAttribute('markerWidth', width + '');
                    markerElement.setAttribute('markerHeight', height + '');

                    const path = document.createElementNS('', 'path');
                    path.setAttributeNS('', 'd', 'M' + (80 + index * 32) + ' 55');
                    path.setAttributeNS('', 'marker-start', 'url(#' + markerLocalGUID + ')');
                    path.setAttributeNS('', 'marker-end', 'url(#' + markerLocalGUID + ')');

                    svg.appendChild(path);
                }
            });
        }

        if (locale === LOCALE.Text) {

            const textDefs = document.createElementNS('', 'defs');
            const path = document.createElementNS('', 'path');
            path.setAttributeNS('', 'id', 'textpath');
            path.setAttributeNS('', 'd', 'M 0,100 200,0');
            textDefs.appendChild(path);

            if (textDefs.children.length !== 0) {
                svg.appendChild(textDefs);
            }

            styleOptions.forEach(({ text }) => {
                if (text) {
                    const textEl = document.createElementNS('', 'text');
                    textEl.setAttributeNS('', 'x', '15');
                    if (text.font) {
                        if (text.font.family) {
                            textEl.setAttributeNS('', 'font-family', text.font.family);
                        }
                        if (text.font.weight) {
                            textEl.setAttributeNS('', 'font-weight', text.font.weight);
                        }
                        if (text.font.style) {
                            textEl.setAttributeNS('', 'font-style', text.font.style);
                        }
                        if (text.font.size) {
                            textEl.setAttributeNS('', 'font-size', text.font.size);
                        }
                    }
                    if (text.color) {
                        textEl.setAttributeNS('', 'fill', text.color);
                    }
                    if (text.contour.color) {
                        textEl.setAttributeNS('', 'stroke', text.contour.color);
                    }
                    if (text.contour.width) {
                        textEl.setAttributeNS('', 'stroke-width', text.contour.width);
                    }
                    if (text.shadow.offset && text.shadow.color) {
                        textEl.setAttributeNS('', 'style', 'text-shadow: ' + text.shadow.offset.x + 'px ' + text.shadow.offset.y + 'px ' + text.shadow.color);
                    }

                    const textPath = document.createElementNS('', 'textPath');
                    textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#textpath');
                    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
                    textPath.innerHTML = 'text text text text';

                    textEl.appendChild(textPath);

                    svg.appendChild(textEl);
                }
            });
        }

        return svg;
    }

    /**
     * Преобразовать SVG в изображение
     * @method svgToImage
     * @param svgElement {SVGSVGElement} Элемент SVG
     * @return {Promise} Элемент HTMLImageElement
     */
    svgToImage(svgElement: SVGSVGElement) {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            if (!window.btoa) {
                reject('window["btoa"] is not defined!');
            }

            const width = svgElement.width.baseVal.value;
            const height = svgElement.height.baseVal.value;

            const image = new Image(width, height);
            image.src = 'data:image/svg+xml;base64,' + window.btoa(svgElement.outerHTML);
            image.onload = () => {
                resolve(image);
            };
            image.onerror = (event: Event | string) => {
                reject(event);
            };
        });
    }

    /**
     * Получить значение параметра из CSS переменной
     * @method getCssVariableValue
     * @param value {string} CSS переменная вида `--v-secondary-base`
     * @return {string} Значение параметра
     */
    getCssVariableValue(value: string) {
        return window.getComputedStyle(document.documentElement).getPropertyValue(value);
    }

    /**
     * Получить значение цвета из CSS переменной
     * @method getCssVariableColor
     * @param value {string} CSS переменная вида `--v-secondary-base`
     * @return {object} Значение цвета
     */
    getCssVariableColor(value: string) {
        let color = '#000000';
        let opacity = 1;
        const rgba = this.getCssVariableValue(value).replaceAll(' ', '');
        if (rgba.indexOf('#') === 0) {
            color = rgba.substr(0, 7);
            if (rgba.length > 7) {
                opacity = parseInt(rgba.substr(7, 2), 16);
            }
        } else {
            const regex = /rgba?\((\d+),(\d+),(\d+),?(\d?\.?\d+)?\)/gm;
            const m = regex.exec(rgba);
            if (m) {
                const result: string[] = [];
                m.forEach((match, index) => {
                    if (index > 0) {
                        result.push(match);
                    }
                });
                color = '#';
                opacity = result[3] !== undefined ? parseFloat(result[3]) : 1;
                for (let i = 0; i < 3; i++) {
                    color += parseInt(result[i]).toString(16).toUpperCase();
                }
            }
        }

        return { color, opacity };
    }

    /**
     * Получить ссылку на корень приложения
     * @method getAppURL
     */
    getAppURL() {
        const { protocol, hostname, port, pathname } = window.location;

        let url = protocol + '//' + hostname;
        if (port !== '80')
            url += ':' + port;

        url += pathname;

        return url;
    }

    getColorByIndex(index: number): string {
        const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);
        const randomRGB = () => `rgb(${randomNum()}, ${randomNum()}, ${randomNum()}, 1)`;

        let color;
        if (index < this.colorArray.length) {
            color = this.colorArray[index];
        } else {
            color = randomRGB();
        }

        return color;
    }

    blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }

    blobToImageBase64(blob: Blob): Promise<ImageBase64> {
        return new Promise((resolve) => {

            const imageBase64: ImageBase64 = { src: '', width: 0, height: 0, fileSize: 0 };

            const reader = new FileReader();
            reader.onloadend = () => resolve(imageBase64);
            reader.readAsDataURL(blob);
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    const image = new Image();

                    image.onload = () => {
                        imageBase64.width = image.width;
                        imageBase64.height = image.height;

                    };

                    image.src = e.target.result;
                    imageBase64.src = image.src;

                    imageBase64.fileSize = blob.size;
                }
            };
        });
    }

    /**
     * Копирование таблицы в буфер обмена
     * @method copyTableToClipBoard
     * @static
     * @param table {HTMLTableElement} HTML таблица
     */
    copyTableToClipBoard(table: HTMLTableElement) {
        if (window.ClipboardItem) {
            const type = 'text/html';
            const blob = new Blob([table.outerHTML], { type });
            const clipboardItem = [new ClipboardItem({ [type]: blob })];
            return new Promise<boolean>((resolve, reject) => {
                navigator.clipboard.write(clipboardItem).then(() => {
                    resolve(true);
                }).catch((e) => {
                    reject(e);

                });
            });
        } else {
            return this.copyToClipboard(table.innerText);
        }
    }

    /**
     * Coxpанение таблицы HTML в Excel
     * @method saveTableToXLSX
     * @static
     * @property table {HTMLTableElement} Список со строками таблицы
     */
    saveTableToXLSX(table: HTMLTableElement) {
        const wb = XLSX.utils.table_to_book(table, { sheet: 'objectsList', raw: true });
        return XLSX.writeFile(wb, 'objectsList' + '.xlsx');
    }

    getMimeType(fileName: string) {
        const index = fileName.slice(fileName.lastIndexOf('.') + 1) as keyof typeof MIME_TYPES;
        return MIME_TYPES[index] || 'application/octet-stream';
    }

    getCurrentStack(depth= 3, pass= 1) {
        const result:string[] = [];
        const stack = new Error().stack;
        if(stack) {
            const regex = /\n\s+at ([\w.]+)\s[([]/gm;
            let m;
            let counter = 0;
            while (stack && (m = regex.exec(stack)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (counter > 1 && m[1]) {
                    result.push(m[1]+'()');
                }
                counter++;
                if (counter === 5) {
                    break;
                }
            }
        }

        return result;
    }
}


export default new BrowserService();

export interface ImageBase64 {
    src: string,
    width: number,
    height: number,
    fileSize: number
}
