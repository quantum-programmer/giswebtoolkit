/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Класс Параметры слоя карты                  *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/
import Utils from '~/services/Utils';
import { ExternalFunctions, GwtkLayerDescription, LayerTooltip } from '~/types/Options';
import { GwtkMapLegendItemReduced, LAYERTYPE, LAYERTYPENAME, SldBuildObject } from '~/types/Types';
import { CommonServiceSVG } from '~/utils/GeoJSON';


type FilterProperty = {
    PropertyName: string;
    Literal: string;
};

export type FilterCondition = {
    PropertyIsLike?: FilterProperty[];
    PropertyIsEqualTo?: FilterProperty[];
    PropertyIsGreaterThan?: FilterProperty[];
    PropertyIsGreaterThanOrEqualTo?: FilterProperty[];
    PropertyIsLessThanOrEqualTo?: FilterProperty[];
}

export type LayerTextFilter = {
    Filter: {
        AND: ({ OR: FilterCondition[] } | { AND: FilterCondition[] })[];
        // OR?: ({ OR: FilterCondition[] } | { AND: FilterCondition[] })[];
    }
};

export type PermanentLayerFilter = {
    keylist?: string;
    textfilter?: LayerTextFilter;
    stylefilter?: { keylist: string; sld: CommonServiceSVG[] }[];
    idlist?: string;
    objkeys?: string[];
    objids?: string[];
};

export default class LayerOptions {
    protected options: GwtkLayerDescription;
    alias: string = '';
    authtype?: 'pam' = undefined;
    areapixel: number = 0;
    bbox: number[] = [];
    duty: boolean = false;
    export: string[] = [];
    folder: string = '';
    format: string = '';
    gis: boolean = false;
    hidden: boolean = false;
    id: string = '';
    idLayer: string = '';
    keyssearchbyname: string[] = [];
    linkedUrls: string[] = [];
    legend: string = '';
    maxzoomview: number = -1;
    minzoomview: number = -1;
    norpc: number = 0;
    opacityValue: number = 100;
    pkkmap: number = 0;
    selectObject: boolean = false;
    selectsearch: boolean = false;
    semanticfilter: string[] = [];
    imageSemantics: string[];
    schemename: string = '';
    tilematrixset: string = '';
    tilesize: number = 256;
    token: boolean = false;
    tilewms: number = 0;
    tms: number = 0;
    type: string = '';
    mapdb = false;
    url: string = '';
    version: string = '';
    waterColors: (string | number)[] = [];
    objnamesemantic?: string[];
    datatype: string[] = [];
    watch: number = 0;
    zIndex: number = 1;
    filter: {
        keylist?: string;
        textfilter?: LayerTextFilter;
        idlist?: string;
    } | undefined;
    externalFunctions: ExternalFunctions = [];
    selectedLegendObjectList: GwtkMapLegendItemReduced[] = [];
    selectedLegendObjectStyleOptions: SldBuildObject = { line: [], polygon: [], marker: [], text: [] };
    ownerLogin: string = '';
    isPublic: boolean = false;
    corsNotAllowed: boolean = false;

    protected layertype = LAYERTYPE.undefined;
    protected layertypename = LAYERTYPENAME.undefined;
    protected isValid: boolean = false;
    static readonly defaultZoomView = { 'minzoom': 2, 'maxzoom': 23 };
    readonly tags: GwtkLayerDescription['tags'];

    /**
     * @constructor LayerOptions
     * @public
     * @param layerdescription {object} JSON параметры слоя карты
     */
    constructor(layerdescription: GwtkLayerDescription) {
        this.options = layerdescription;
        if (this.options == undefined) {
            throw Error('Undefined layer options');
        }
        this.tags = this.options.tags || [];
        this.id = this.options.id || '';
        this.idLayer = '';
        this.url = this.options.url || '';
        this.alias = this.options.alias || 'Unknown';
        this.authtype = this.options.authtype || undefined;
        this.areapixel = this.options.areapixel || 0;
        this.hidden = !!this.options.hidden || false;
        this.gis = this.options.gis || false;
        this.duty = this.options.duty || false;
        this.selectObject = !!this.options.selectObject || false;
        this.selectsearch = !!this.options.selectsearch || false;
        this.semanticfilter = this.options.semanticfilter || [];
        this.schemename = this.options.schemename || '';
        this.waterColors = this.options.waterColors || [];
        this.bbox = Array.isArray(this.options.bbox) ? this.options.bbox : [];
        this.tilematrixset = this.options.tilematrixset || '';
        this.tilesize = this.options.tilesize || 256;
        this.token = !!this.options.token;
        this.linkedUrls = this.options.linkedUrls || [];
        this.legend = this.options.legend || '';
        this.mapdb = this.options.mapdb || false;
        this.objnamesemantic = this.options.objnamesemantic;
        if (this.options.zIndex !== undefined) {
            this.zIndex = this.options.zIndex;
        }

        this.imageSemantics = this.options.imageSemantics ? this.options.imageSemantics.slice() : [];

        this.norpc = 0;
        if (this.options.norpc !== undefined && this.options.norpc > 0) {
            this.norpc = 1;
        }

        this.options.watch ? this.watch = this.options.watch : this.watch = 0;

        if (typeof this.options.opacityValue == 'undefined')
            this.opacity = 100;
        else
            this.opacity = this.options.opacityValue;

        if (this.options.maxzoomview == undefined)
            this.maxzoomview = LayerOptions.defaultZoomView.maxzoom;
        else
            this.maxzoomview = this.options.maxzoomview;

        if (this.options.minzoomview == undefined)
            this.minzoomview = LayerOptions.defaultZoomView.minzoom;
        else
            this.minzoomview = this.options.minzoomview;

        this.keyssearchbyname = this.options.keyssearchbyname || [];

        this.export = this.options.export || [];

        this.pkkmap = this.options.pkkmap || 0;
        this.tilewms = this.options.tilewms || 0;

        this.tms = this.options.tms || 0;

        this.folder = this.options.folder || '';

        this.type = this.options.type || '';

        this.version = this.options.version || '';

        this.externalFunctions = this.options.externalFunctions || [];

        this.format = 'png';

        this.selectedLegendObjectStyleOptions = this.options.selectedLegendObjectStyleOptions || { line: [], polygon: [], marker: [], text: [] };
        this.selectedLegendObjectList = this.options.selectedLegendObjectList || [];

        this.ownerLogin = this.options.ownerLogin || '';
        this.isPublic = !!this.options.isPublic;
        this.corsNotAllowed = !!this.options.corsNotAllowed;

        if (this.options.filter) {
            const filter = JSON.stringify(this.options.filter);
            if (filter.length > 0) {
                this.filter = JSON.parse(filter);
                if (this.filter?.keylist) {
                    Reflect.deleteProperty(this, 'schemename');
                }
            }
        }


        // типы публикуемых слоев
        if (layerdescription.datatype) {
            if (Array.isArray(layerdescription.datatype)) {
                this.datatype.splice(0, 0, ...layerdescription.datatype);
            } else if (layerdescription.datatype.length > 0 && layerdescription.datatype !== '*') {
                this.datatype.splice(0, 0, ...layerdescription.datatype.split(','));
            }
        }


        if (!this.test())
            return;
        this.setLayerType();
        this.setServiceLayerId();
    }

    /**
     * Установить тип слоя
     * @method setLayerType
     * @protected
     */
    protected setLayerType() {
        this.layertype = LAYERTYPE.undefined;
        this.layertypename = LAYERTYPENAME.undefined;
        if (!this.options) {
            return this.layertype;
        }
        if (this.folder.length > 0) {
            this.layertype = LAYERTYPE.folder;
            this.layertypename = LAYERTYPENAME.folder;
            return this.layertype;
        }
        if (this.pkkmap == 1 || this.tilewms == 1) {
            this.layertype = LAYERTYPE.tilewms;
            this.layertypename = LAYERTYPENAME.tilewms;
            return this.layertype;
        }
        const type = this.type.toLowerCase();
        if (type === 'svg') {
            this.layertype = LAYERTYPE.svg;
            this.layertypename = LAYERTYPENAME.svg;
            return this.layertype;
        }
        if (type === 'geomarkers') {
            this.layertype = LAYERTYPE.geomarkers;
            this.layertypename = LAYERTYPENAME.geomarkers;
            return this.layertype;
        }
        const url = this.url.toLowerCase();
        if (url.indexOf('%z') >= 0 && url.indexOf('%x') >= 0 && url.indexOf('%y') >= 0) {
            this.layertype = LAYERTYPE.tile;
            this.layertypename = LAYERTYPENAME.tile;
        } else {
            this.layertype = LAYERTYPE.wms;
            this.layertypename = LAYERTYPENAME.wms;
        }

        return this.layertype;
    }

    /**
     * Установить идентификатор слоя на сервисе карт
     * @method setServiceLayerId
     * @protected
     * @returns {string} идентификатор слоя на сервисе карт
     */
    protected setServiceLayerId() {
        this.idLayer = '';
        let url = this.url; //this.url.toLowerCase();
        if (url.indexOf('http') == -1) {
            if (url.indexOf('?') == -1)
                url = '?' + url;
        }
        const params = Utils.getParamsFromURL(url);
        if (params['layer']) {
            this.idLayer = params['layer'];
        } else if (params['layers']) {
            this.idLayer = params['layers'];
        }
        if (params['format'])
            this.format = params['format'];

        try {
            this.idLayer = decodeURIComponent(this.idLayer);
        } catch (error) {
            error;
        }

        return this.idLayer;
    }

    /**
     * Получить тип слоя
     * @method getLayerType
     * @public
     * @returns {number} тип слоя ( LAYERTYPE )
     */
    get getLayerType() {
        return this.layertype;
    }

    /**
     * Получить название типа слоя
     * @method getLayerType
     * @public
     * @returns {number} тип слоя ( LAYERTYPE )
     */
    get getLayerTypeName() {
        return this.layertypename;
    }

    get legendLayerKeys() {
        const result = this.options.legendLayerKeys;
        if (Array.isArray(result) && result.length > 0) {
            return result;
        }
        return undefined;
    }

    get legendTextKeys() {
        return this.options.legendObjectTextValues;
    }

    /**
     * Проверка
     * @method test
     * @public
     * @returns {boolean} `true` - обязательные параметры установлены
     */
    test() {

        this.isValid = this.id.length > 0;// && this.url.length > 0;
        return this.isValid;
    }

    /**
     * Наличие ошибки
     * @method isError
     * @public
     * @returns {boolean} `true` - ошибка имеется
     */
    get isError() {
        return !this.isValid;
    }

    get opacity() {
        return this.opacityValue;
    }

    set opacity(newopacity: number) {
        let new_opacity = newopacity;
        if (newopacity > 100) {
            new_opacity = 100;
        } else if (new_opacity < 0) {
            new_opacity = 0;
        }

        this.opacityValue = new_opacity;
    }

    get tooltip(): LayerTooltip | undefined {
        return this.options.tooltip;
    }

}
