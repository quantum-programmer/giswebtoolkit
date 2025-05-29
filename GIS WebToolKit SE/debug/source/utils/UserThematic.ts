/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Класс утилит компонента Картограмма                *
 *                                                                  *
 *******************************************************************/

import {
    BuildParameterOptions,
    ThematicRangesData,
    UserAttribute,
    UserSymbolizer,
    UserThematicFilter,
    UserThematicRange
} from '~/types/Types';
import Utils from '~/services/Utils';
import { Cell } from '~/services/Utils/CsvEditor';
import { SvgFill, SvgMarker, SvgStroke, SvgText } from '~/utils/GeoJSON';
import CanvasRenderer from '~/renderer/CanvasRenderer';
import { BrowserService } from '~/services/BrowserService';
import { ClassifierTypeSemanticValue } from '~/classifier/Classifier';


/**
 * Класс утилит компонента Картограмма
 * @class UserThematicUtils
 */
export default class UserThematicUtils {

    static readonly DELTA_ADDITION: number = 0.00001;

    /**
     * Сгенерировать иконку по умолчанию для линейных графических объектов
     * @method getLineIconDefault
     * @param color
     */
    static getLineIconDefault(color: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 33;

        CanvasRenderer.drawLineToCanvas(canvas, 0, canvas.height, canvas.width, 0, 1, color);
        return canvas.toDataURL();
    }

    /**
     * Сгенерировать иконку по умолчанию для площадных графических объектов
     * @method getPolygonIconDefault
     * @param color
     */
    static getPolygonIconDefault(color: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 33;

        CanvasRenderer.drawPolygonToCanvas(canvas, 0, 0, canvas.width, canvas.height, color);
        return canvas.toDataURL();
    }

    /**
     * Сгенерировать иконку по умолчанию для точечных графических обектов
     * @method getMarkerIconDefault
     * @param color
     */
    static getMarkerIconDefault(color: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;

        CanvasRenderer.drawCircleToCanvas(canvas, canvas.width / 2, canvas.height / 2, 10, color);
        return canvas.toDataURL();
    }

    /**
     * Запонить эемент параметра FILTER для запроса CREATETHEMATICMAPBYCSV
     * @method fillFilterItem
     * @private
     * @param svgStyle
     * @param rule
     * @param filterItem
     */
    private static fillFilterItem(svgStyle: ({ type?: string; } & SvgStroke & SvgFill & SvgMarker & SvgText), rule: string, filterItem: UserSymbolizer) {
        let itemKey: keyof typeof svgStyle;
        for (itemKey in svgStyle) {

            if (itemKey === 'type') {
                continue;
            }

            let values = filterItem[itemKey];

            if (!values) {
                values = [];
                filterItem[itemKey] = values;
            }

            values.push({
                rule,
                value: svgStyle[itemKey] + ''
            });
        }
    }

    /**
     * Получить параметр FILTER для запроса CREATETHEMATICMAPBYCSV
     * @method getUserThematicFilter
     * @param buildParametersOptions
     */
    static getUserThematicFilter(buildParametersOptions: BuildParameterOptions[]): UserThematicFilter {

        const styles: UserThematicFilter['styles'] = {
            line: [],
            polygon: [],
            marker: [],
            text: []
        };

        const rules: { key: string, description: string, value: UserAttribute[] }[] = [];

        let attributeCount = 0;

        buildParametersOptions.forEach((parameter) => {

            attributeCount++;
            const attributeName = `attribute${attributeCount}`;
            const attributePath = `#/$rules/${attributeName}/`;

            const attributeRanges: UserAttribute[] = [];

            let count = -1;

            parameter.userThematicRangeList.forEach((range) => {

                count++;

                const attributeRange: UserAttribute = {
                    min: (count !== 0 || range.range.min === 0) ? range.range.min : range.range.min - this.DELTA_ADDITION,
                    max: count !== parameter.userThematicRangeList.length - 1 ? range.range.max : range.range.max + this.DELTA_ADDITION
                };

                attributeRanges.push(attributeRange);
                const rule = attributePath + attributeRanges.length;

                let stylesKey: keyof UserThematicRange['styles'];
                for (stylesKey in range.styles) {
                    range.styles[stylesKey].forEach((commonSVG, index) => {
                        const type = commonSVG.type;
                        switch (type) {
                            case 'LineSymbolizer':
                                break;
                            case 'PointSymbolizer':
                                break;
                            case 'PolygonSymbolizer':
                                break;
                            case 'HatchSymbolizer':
                                break;
                            case 'TextSymbolizer':
                                break;
                        }

                        let filterItem = styles[stylesKey][index];
                        if (!filterItem || filterItem.type !== type) {
                            filterItem = {
                                type
                            };
                            styles[stylesKey].push(filterItem);
                        }

                        UserThematicUtils.fillFilterItem(commonSVG as (SvgStroke & SvgFill & SvgMarker), rule, filterItem);
                    });
                }
            });

            rules.push({ key: attributeName, description: parameter.text, value: attributeRanges });

        });

        UserThematicUtils.fixFilterStyles(styles);

        return {
            $rules: rules,
            styles
        };

    }

    /**
     * Исправить формат значений стилей параметра FILTER для запроса CREATETHEMATICMAPBYCSV
     * @method fixFilterStyles
     * @private
     * @param styles
     */
    private static fixFilterStyles(styles: UserThematicFilter['styles']) {

        let stylesKey: keyof UserThematicRange['styles'];

        for (stylesKey in styles) {
            UserThematicUtils.fixStyle(styles[stylesKey]);

            if (!styles[stylesKey].length) {
                styles[stylesKey].splice(0);
            }
        }

    }

    /**
     * Исправить формат значений стиля параметра FILTER для запроса CREATETHEMATICMAPBYCSV
     * @method fixStyle
     * @private
     * @param userSymbolizerList
     * @deprecated
     */
    private static fixStyle(userSymbolizerList: UserSymbolizer[]) {
        for (let itemNumber = userSymbolizerList.length - 1; itemNumber >= 0; itemNumber--) {

            const userSymbolizer = userSymbolizerList[itemNumber];

            if (userSymbolizer['stroke']) {
                for (let strokeNumber = userSymbolizer['stroke'].length - 1; strokeNumber >= 0; strokeNumber--) {
                    const stroke = userSymbolizer['stroke'][strokeNumber];
                    if (stroke.value === 'undefined') {
                        userSymbolizer['stroke'].splice(strokeNumber, 1);
                    }
                }

                if (!userSymbolizer['stroke'].length) {
                    if (userSymbolizer['type'] !== 'TextSymbolizer') {
                        userSymbolizerList.splice(itemNumber, 1);
                    } else {
                        delete userSymbolizer['stroke'];
                    }
                }

            }

            if (userSymbolizer['stroke-step']) {
                for (let strokeNumber = userSymbolizer['stroke-step'].length - 1; strokeNumber >= 0; strokeNumber--) {
                    const stroke = userSymbolizer['stroke-step'][strokeNumber];
                    if (stroke.value === 'undefined') {
                        userSymbolizer['stroke-step'].splice(strokeNumber, 1);
                    } else {
                        stroke.value = stroke.value.replace('px', '');
                    }
                }

                if (!userSymbolizer['stroke-step'].length) {
                    userSymbolizer['stroke-step'] = undefined;
                }
            }

            if (userSymbolizer['stroke-width']) {
                for (let strokeNumber = userSymbolizer['stroke-width'].length - 1; strokeNumber >= 0; strokeNumber--) {
                    const stroke = userSymbolizer['stroke-width'][strokeNumber];
                    if (stroke.value === 'undefined') {
                        userSymbolizer['stroke-width'].splice(strokeNumber, 1);
                    } else {
                        stroke.value = stroke.value.replace('px', '');
                    }
                }

                if (!userSymbolizer['stroke-width'].length) {
                    if (userSymbolizer['type'] !== 'TextSymbolizer') {
                        userSymbolizer['stroke-width'] = undefined;
                    } else {
                        delete userSymbolizer['stroke-width'];
                    }
                }
            }

            if (userSymbolizer['stroke-linejoin']) {
                userSymbolizer['stroke-linejoin'] = undefined;
            }

            if (userSymbolizer['stroke-dasharray']) {
                for (let strokeNumber = userSymbolizer['stroke-dasharray'].length - 1; strokeNumber >= 0; strokeNumber--) {
                    const stroke = userSymbolizer['stroke-dasharray'][strokeNumber];
                    if (stroke.value === 'none none') {
                        userSymbolizer['stroke-dasharray'].splice(strokeNumber, 1);
                    }
                }

                if (!userSymbolizer['stroke-dasharray'].length) {
                    userSymbolizer['stroke-dasharray'] = undefined;
                }
            }

            if (userSymbolizer['image']) {
                for (let i = 0; i < userSymbolizer['image'].length; i++) {
                    const image = userSymbolizer['image'][i];
                    image.value = image.value.replace('data:image/png;base64,', '');
                }
            }

            if (userSymbolizer['markerId']) {
                for (let i = 0; i < userSymbolizer['markerId'].length; i++) {
                    const markerId = userSymbolizer['markerId'][i];
                    markerId.value = Utils.generateGUID() + '.png';
                }
            }

            if (userSymbolizer['style']) {
                for (let styleNumber = userSymbolizer['style'].length - 1; styleNumber >= 0; styleNumber--) {
                    const style = userSymbolizer['style'][styleNumber];
                    if (style.value === 'undefined') {
                        userSymbolizer['style'].splice(styleNumber, 1);
                    }
                }

                if (!userSymbolizer['style'].length) {
                    delete userSymbolizer['style'];
                }

            }
            if (userSymbolizer['text-shadow']) {
                for (let textShadowNumber = userSymbolizer['text-shadow'].length - 1; textShadowNumber >= 0; textShadowNumber--) {
                    const textShadow = userSymbolizer['text-shadow'][textShadowNumber];
                    if (textShadow.value === 'undefined') {
                        userSymbolizer['text-shadow'].splice(textShadowNumber, 1);
                    }
                }

                if (!userSymbolizer['text-shadow'].length) {
                    delete userSymbolizer['text-shadow'];
                }

            }
            if (userSymbolizer['font-style']) {
                for (let fontStyleNumber = userSymbolizer['font-style'].length - 1; fontStyleNumber >= 0; fontStyleNumber--) {
                    const fontStyle = userSymbolizer['font-style'][fontStyleNumber];
                    if (fontStyle.value === 'undefined') {
                        userSymbolizer['font-style'].splice(fontStyleNumber, 1);
                    }
                }

                if (!userSymbolizer['font-style'].length) {
                    delete userSymbolizer['font-style'];
                }

            }
            if (userSymbolizer['font-weight']) {
                for (let fontWeightNumber = userSymbolizer['font-weight'].length - 1; fontWeightNumber >= 0; fontWeightNumber--) {
                    const fontWeight = userSymbolizer['font-weight'][fontWeightNumber];
                    if (fontWeight.value === 'undefined') {
                        userSymbolizer['font-weight'].splice(fontWeightNumber, 1);
                    }
                }

                if (!userSymbolizer['font-weight'].length) {
                    delete userSymbolizer['font-weight'];
                }

            }

            if (userSymbolizer['font-size']) {
                for (let fontSizeNumber = userSymbolizer['font-size'].length - 1; fontSizeNumber >= 0; fontSizeNumber--) {
                    const fontSize = userSymbolizer['font-size'][fontSizeNumber];
                    if (fontSize.value === 'undefined') {
                        userSymbolizer['font-size'].splice(fontSizeNumber, 1);
                    } else {
                        fontSize.value = fontSize.value.replace('px', '');
                    }
                }

                if (!userSymbolizer['font-size'].length) {
                    userSymbolizer['font-size'] = undefined;
                }
            }

        }

    }

    /**
     * Заполнить градации параметра построения исходными значениями стилей графических объектов
     * @method fillRanges
     * @param thematicRangesData
     */
    static fillRanges(thematicRangesData: ThematicRangesData) {

        let range = { min: 0, max: 0 };
        let count = 0;
        let halfValue = 0;

        while (count < thematicRangesData.rangesCount) {

            if (count < thematicRangesData.rangesCount - 1) {
                halfValue = (thematicRangesData.maxValue - thematicRangesData.minValue) / 2 + thematicRangesData.minValue;
            }

            let leftCount = 0;
            let rightCount = 0;
            thematicRangesData.valueArray.forEach(value => {
                if (value < halfValue) {
                    leftCount++;
                } else {
                    rightCount++;
                }
            });

            if (count !== thematicRangesData.rangesCount - 1) {
                if (!leftCount) {
                    if (Math.abs(thematicRangesData.minValue - halfValue) < 0.0001) {
                        count = thematicRangesData.rangesCount - 1;
                    } else {
                        thematicRangesData.minValue = halfValue;
                        continue;
                    }
                }
                if (!rightCount) {
                    if (Math.abs(thematicRangesData.maxValue - halfValue) < 0.0001) {
                        count = thematicRangesData.rangesCount - 1;
                    } else {
                        thematicRangesData.maxValue = halfValue;
                        continue;
                    }
                }
            }

            let condition = leftCount <= rightCount;
            if (count === thematicRangesData.rangesCount - 1) {
                condition = leftCount > rightCount;
            }

            if (condition) {

                range = {
                    min: thematicRangesData.minValue,
                    max: halfValue
                };

                thematicRangesData.minValue = halfValue;

                for (let i = thematicRangesData.valueArray.length - 1; i >= 0; i--) {
                    if (thematicRangesData.valueArray[i] < halfValue) {
                        thematicRangesData.valueArray.splice(i, 1);
                    }
                }

            } else {

                range = {
                    min: halfValue,
                    max: thematicRangesData.maxValue
                };

                thematicRangesData.maxValue = halfValue;

                for (let i = thematicRangesData.valueArray.length - 1; i >= 0; i--) {
                    if (thematicRangesData.valueArray[i] > halfValue) {
                        thematicRangesData.valueArray.splice(i, 1);
                    }
                }

            }

            const color = BrowserService.getColorByIndex(thematicRangesData.ranges.length);
            const markerIconDefault = UserThematicUtils.getMarkerIconDefault(color);

            const userThematicRange: UserThematicRange = {
                range: range,
                styles: {
                    line: [{ type: 'LineSymbolizer', stroke: color, 'stroke-opacity': 1, 'stroke-width': '2' }],
                    polygon: [{ type: 'PolygonSymbolizer', fill: color, 'fill-opacity': 1 }],
                    //fixme: а сервис нормально маркер поймет, если не обновлять через легенду?
                    marker: [{
                        type: 'PointSymbolizer',
                        'refX': 16,
                        'refY': 16,
                        'width': 32,
                        'height': 32,

                        'markerId': 'm' + Utils.generateGUID(),
                        'image': markerIconDefault,
                        'path': ''
                    }],
                    text: [{ type: 'TextSymbolizer' }]
                },

                icons: {
                    line: UserThematicUtils.getLineIconDefault(color),
                    polygon: UserThematicUtils.getPolygonIconDefault(color),
                    marker: markerIconDefault
                }
            };

            thematicRangesData.ranges.push(userThematicRange);
            count++;
        }

        UserThematicUtils.fixRanges(thematicRangesData.ranges, thematicRangesData.minValue);

    }

    /**
     * Исправить пропуски между диапазонами граций
     * @method fixRanges
     * @private
     * @param ranges
     * @param minValue
     */
    private static fixRanges(ranges: UserThematicRange[], minValue: number) {

        if (ranges.length === 1) {
            ranges[0].range.min = minValue;
        }

        ranges.sort((a, b) => (a.range.min < b.range.min ? -1 : 1));

        for (let i = 0; i < ranges.length - 1; i++) {
            let rangeLeft = ranges[i];
            let rangeRight = ranges[i + 1];

            if (rangeLeft.range.max !== rangeRight.range.min) {
                const value = (rangeLeft.range.max + rangeRight.range.min) / 2;
                rangeLeft.range.max = value;
                rangeRight.range.min = value;
            }
        }
    }

    /**
     * Заменить значение на код семантики типа "классификатор"
     * @method replaceBySemCode
     * @private
     * @deprecated
     */
    static replaceBySemCode(cell: Cell, semValues?: ClassifierTypeSemanticValue[]) {
        if (cell.type === 'String' && semValues) {
            const value = cell.value.replaceAll('"', '');
            const semItem = semValues.find(semItem => semItem.name === value);
            if (semItem) {
                cell.value = semItem.value;
            }
        }
    }

    /**
     * Импортировать параметры построения картограммы из файла
     * @method importBuildParametersFromFile
     * @async
     * @param buildParametersOptionsTemp
     */
    static async importBuildParametersFromFile(buildParametersOptionsTemp: BuildParameterOptions & { rangesCount: number }) {
        const fileResult = await BrowserService.openFileDialog(['.json']);

        if (fileResult && fileResult[0]) {

            const file = fileResult[0];
            const reader = new FileReader();

            reader.readAsText(file);
            reader.onload = (e) => {

                if (e.target && typeof e.target.result === 'string') {

                    const record = e.target.result;
                    buildParametersOptionsTemp.userThematicRangeList = JSON.parse(record);
                    buildParametersOptionsTemp.rangesCount = buildParametersOptionsTemp.userThematicRangeList.length;
                }

            };

        }

    }

    /**
     * Сформировать иконки диапазона для диаграммы
     * @static
     * @method createRangeIcons
     * @param rangeItem {UserThematicRange} Диапазон
     */
    static createRangeIcons(rangeItem: UserThematicRange) {
        let lineColor;
        let lineIcon = rangeItem.icons.line;

        if (!lineIcon) {
            const style = rangeItem.styles.line[0];
            if (style && style.type === 'LineSymbolizer' && style.stroke) {
                lineIcon = style.stroke;
                lineColor = style.stroke;
            }
        }

        let polygonColor;
        let polygonIcon = rangeItem.icons.polygon;

        if (!polygonIcon) {
            const style = rangeItem.styles.polygon[0];
            if (style && style.type === 'PolygonSymbolizer' && style.fill) {
                polygonIcon = style.fill;
                polygonColor = style.fill;
            }
        }

        let markerIcon = rangeItem.icons.marker;

        if (!markerIcon) {
            const style = rangeItem.styles.marker[0];
            if (style && style.type === 'PointSymbolizer' && style.image) {
                markerIcon = style.image;
            }
        }

        return {
            color: polygonColor || lineColor || BrowserService.getColorByIndex(Number.MAX_SAFE_INTEGER),
            icon: [lineIcon, polygonIcon, markerIcon]
        };
    }

    /**
     * Посчитать количество вхождений в диапазон для диаграммы
     * @static
     * @method countRangeValues
     * @param valueArray {number[]} Массив значений
     * @param range {object} Диапазон для значений
     * @param [lastRangeFlag] Флаг крайнего диапазона
     */
    static countRangeValues(valueArray: number[], range: { min: number; max: number; }, lastRangeFlag = false): number {
        let result = 0;

        for (let i = 0; i < valueArray.length; i++) {

            const value = valueArray[i];

            if (lastRangeFlag) {
                if (value >= range.min && value <= range.max) {
                    result++;
                }
            } else {
                if (value >= range.min && value < range.max) {
                    result++;
                }
            }

        }
        return result;
    }

    static b64EncodeUnicode(str: string) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(
            encodeURIComponent(str).replace(
                /%([0-9A-F]{2})/g,
                (match: string, p1: string) => {
                    return String.fromCharCode(Number('0x' + p1));
                }
            )
        );
    }

}
