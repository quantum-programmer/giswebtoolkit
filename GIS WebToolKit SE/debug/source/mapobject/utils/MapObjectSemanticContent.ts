/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Класс расширенного описания семантик              *
 *                                                                  *
 *******************************************************************/

import { ClassifierSemantic } from '~/mapobject/utils/MapObjectContent';
import { MapObjectSemanticType } from '~/mapobject/MapObjectSemantics';
import { RscSemantic } from '~/services/RequestServices/RestService/Types';
import { FeatureSemanticItem } from '~/utils/GeoJSON';


export enum FileExtension {
    image = 0,
    pdf = 1,
    csv = 2,
    bim = 3,
    video = 4
}

/**
 * Класс расширенного описания семантик
 * @class MapObjectSemanticContent
 */
export default class MapObjectSemanticContent {

    /**
     * Список типов документов
     * @private
     * @readonly
     * @property downloadTypesList {MapObjectSemanticType[]}
     */
    private readonly downloadTypesList = [
        MapObjectSemanticType.TANYFILE,
        MapObjectSemanticType.TBMPFILE,
        MapObjectSemanticType.TOLEFILE,
        MapObjectSemanticType.TMAPFILE,
        MapObjectSemanticType.TTXTFILE,
        MapObjectSemanticType.TPCXFILE,
        MapObjectSemanticType.TDOCREFMIN,
        MapObjectSemanticType.TDOCREFMAX
    ];

    /**
     * @constructor MapObjectSemanticContent
     * @param objectSemantic { FeatureSemanticItem} Семантика объекта
     * @param layerSemantic {RscSemantic} Семантика слоя
     * @param classifierSemanticList{Array} Семантики классификатора
     */
    constructor(
        private readonly objectSemantic?: FeatureSemanticItem,
        private readonly layerSemantic?: RscSemantic,
        private readonly classifierSemanticList: ClassifierSemantic[] = []
    ) {

    }

    get isNotNull() {
        let result = false;
        if (this.objectSemantic && this.objectSemantic.isNotNull) {
            result =  true;
        }
        return result;
    }

    get isEditable() {
        let result = false;
        if (this.objectSemantic && this.objectSemantic.editable) {
            result = true;
        } else if (this.objectSemantic === undefined || (this.objectSemantic && this.objectSemantic.editable === undefined) ) {
            result = true;
        }
        return result;
    }

    set isErrorInput(value: boolean) {
        if (this.objectSemantic) {
            this.objectSemantic.isErrorInput = value;
        }
    }

    get isErrorInput() {
        let result = false;
        if (this.objectSemantic && (this.objectSemantic.isErrorInput || (this.isNotNull && !String(this.value).length) )) {
            result = true;
        }
        return result;
    }


    /**
     * Получить ключ семантики
     * @method key
     */
    get key(): string {
        let result = '';
        if ( this.objectSemantic ) {
            result = this.objectSemantic.key;
        } else if ( this.layerSemantic ) {
            result = this.layerSemantic.shortname;
        }
        return result;
    }

    get isService(): boolean {
        let result = false;
        if ( this.layerSemantic ) {
            result = this.layerSemantic.service === '1';
        }
        return result;
    }

    get isMandatory(): boolean {
        let result = false;
        if ( this.layerSemantic ) {
            result = this.layerSemantic.enable === '2';
        }
        return result;
    }

    /**
     * Получить имя семантики
     * @method name
     */
    get name(): string {
        let result = '';
        if ( this.objectSemantic ) {
            result = this.objectSemantic.name;
        } else if ( this.layerSemantic ) {
            result = this.layerSemantic.name;
        }
        return result;
    }

    /**
     * Получить значение семантики
     * @method value
     */
    get value(): string {
        let result = '';
        if ( this.objectSemantic ) {
            result = this.objectSemantic.value;
        }
        return result;
    }

    /**
     * Получить код семантики
     * @method code
     */
    get code(): number {
        let result = 0;
        if ( this.layerSemantic ) {
            result = Number( this.layerSemantic.code );
        }
        return result;
    }

    /**
     * Получить десятичную дробь семантики
     * количество значения после плавающей запятой
     * используется для семантик числового типа
     * @method decimal
     */
    get decimal(): string {
        let result = '';
        if ( this.layerSemantic ) {
            result = this.layerSemantic.decimal;
        }
        return result;
    }

    /**
     * Получить значение семантики по умолчанию
     * @method defaultValue
     */
    get defaultValue(): string {
        let result = '';
        if ( this.layerSemantic ) {
            result = this.layerSemantic.defaultvalue;
        }
        return result;
    }

    get maximumLength() {
        let result = undefined;
        if (this.objectSemantic && this.objectSemantic.maxLength && this.objectSemantic.maxLength !== 'null') {
            result = '' + this.objectSemantic.maxLength;
        }
        return result;
    }

    /**
     * Получить максимальное значение семантики
     * @method maximumValue
     */
    get maximumValue(): string {
        let result = '';
        if (this.layerSemantic && this.isNumericType ) {
            result = this.layerSemantic.maximum || '2147483647';
        }
        return result;
    }

    /**
     * Получить минимальное значение семантики
     * @method minimumValue
     */
    get minimumValue(): string {
        let result = '';
        if ( this.layerSemantic && this.isNumericType ) {
            result = this.layerSemantic.minimum || '-2147483648';
        }
        return result;
    }

    /**
     * Получить признак повторения семантики в объекте
     * @method isReply
     */
    get isReply(): boolean {
        let result = false;
        if ( this.layerSemantic ) {
            result = Number( this.layerSemantic.reply ) === 1;
        }
        return result;
    }

    /**
     * Получить размер поля (количество символов) для семантики
     * @method size
     */
    get size(): number {
        let result = 0;
        if ( this.layerSemantic ) {
            result = Number( this.layerSemantic.size );
        }
        return result;
    }

    /**
     * Получить тип семантики
     * @method type
     */
    get type():MapObjectSemanticType {
        let result = MapObjectSemanticType.TSTRING;
        if ( this.layerSemantic ) {
            result = Number( this.layerSemantic.type ) as MapObjectSemanticType;
        }
        return result;
    }

    /**
     * Получить единицу измерения семантики
     * @method unit
     */
    get unit(): string {
        let result = '';
        if ( this.layerSemantic ) {
            result = this.layerSemantic.unit;
        }
        return result;
    }

    /**
     * Получить признак типа классификатор для семантики
     * @method isClassifierType
     */
    get isClassifierType() {
        return this.type === MapObjectSemanticType.TCODE;
    }

    /**
     * Получить признак BIM семантики
     * @method isBimSemantic
     */
    get isBimSemantic() {
        // 32775 ССЫЛКА НА ФАЙЛ BIM МОДЕЛИ
        return this.code === 32775 || MapObjectSemanticContent.checkFileExtension(this.value, FileExtension.bim);
    }

    get isImageSemantic() {
        return MapObjectSemanticContent.checkFileExtension(this.value, FileExtension.image);
    }

    get isVideoSemantic() {
        return MapObjectSemanticContent.checkFileExtension(this.value, FileExtension.video);
    }

    get isPdfSemantic() {
        return MapObjectSemanticContent.checkFileExtension(this.value, FileExtension.pdf);
    }

    get isCsvSemantic() {
        return MapObjectSemanticContent.checkFileExtension(this.value, FileExtension.csv);
    }

    /**
     * Получить список значения семантики, типа классификатор
     * @method classifierItems
     */
    get classifierItems(): { value: string; text: string; }[] {
        const result: { value: string; text: string; }[] = [];
        this.classifierSemanticList.filter( ( classifierSemanticItem: { code: string, key: string } ) => {
            return (isNaN(this.code)||Number( classifierSemanticItem.code ) === this.code) && classifierSemanticItem.key === this.key;
        } )[ 0 ]?.reference.forEach( ( referenceItem: { value: string, text: string } ) => {
            result.push( { value: referenceItem.value, text: referenceItem.text } );
        } );

        return result;
    }

    get text() {
        const item = this.classifierItems.find( classifierItems => classifierItems.value === this.value );
        return item ? item.text : this.value;
    }

    get codeValue() {
        const item = this.classifierItems.find( classifierItems => this.text === classifierItems.text );
        return item ? item.value : this.value;
    }

    /**
     * Получить признак числового типа семантики
     * @method isNumericType
     */
    get isNumericType() {
        return this.type === MapObjectSemanticType.TNUMBER;
    }
    /**
     * Получить признак даты
     * @method isDateType
     */
    get isDateType() {
        return this.type === MapObjectSemanticType.TDATE;
    }

    /**
     * Получить признак скачиваемого файла, типа семантики
     * @method isDownloadFile
     */
    get isDownloadFile() {
        return this.downloadTypesList.includes( this.type ) && !this.isLink && !this.isEmailLink;
    }

    /**
     * Получить имя скачиваемого файла из имени семантики
     * @method downloadFileName
     */
    get downloadFileName() {
        let fileNamePosition = 0;
        if ( this.value.lastIndexOf( '#' ) > -1 )
            fileNamePosition = this.value.lastIndexOf( '#' ) + 1;
        if ( this.value.lastIndexOf( '/' ) > -1 )
            fileNamePosition = this.value.lastIndexOf( '/' ) + 1;

        return this.value.substring( fileNamePosition );
    }

    /**
     * Получить признак ссылки на почту типа семантики
     * @method isEmailLink
     */
    get isEmailLink() {
        return String( this.value ).toLowerCase()
            .match( /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ );
    }

    /**
     * Получить признак ссылки типа семантики
     * @method isLink
     */
    get isLink() {
        const pattern = new RegExp( '^(ftp|http|https)+://', 'i' );
        return pattern.test( this.value );
    }


    static checkFileExtension(fileName: string, extension: FileExtension) {
        if (typeof fileName !== 'string') {
            return false;
        }
        switch (extension) {
            case FileExtension.image:
                if (fileName.includes('.jpeg') || fileName.includes('.png') || fileName.includes('.jpg') || fileName.includes('.bmp')) {
                    return true;
                }
                break;
            case FileExtension.pdf:
                if (fileName.includes('.pdf')) {
                    return true;
                }
                break;
            case FileExtension.csv:
                if (fileName.includes('.csv')) {
                    return true;
                }
                break;
            case FileExtension.bim:
                if (fileName.includes('.ifc')) {
                    return true;
                }
                break;
            case FileExtension.video:
                if (fileName.includes('.mp4') || fileName.includes('.mkv') || fileName.includes('.wmv')) {
                    return true;
                }
                break;
            default: return false;
        }
    }
}
