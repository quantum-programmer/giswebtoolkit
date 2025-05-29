/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                           Класс GeoJSON                          *
 *                                                                  *
 *******************************************************************/

import { Vector2or3, Vector4D } from '~/3d/engine/core/Types';
import { MapObjectType } from '~/mapobject/MapObject';
import { LOCALE } from '~/types/CommonTypes';
import {StatisticList} from '~/services/Search/mappers/GISWebServiceSEMapper';


export type FeatureGeometry =
    PointGeometryType
    | MultiPointGeometryType
    | LineGeometryType
    | PolygonGeometryType
    | MultiLineGeometryType
    | MultiPolygonGeometryType;

export type PointGeometryType = {
    type: MapObjectType.Point;
    coordinates: Vector2or3;
}
export type MultiPointGeometryType = {
    type: MapObjectType.MultiPoint;
    coordinates: Vector2or3[];
}
export type LineGeometryType = {
    type: MapObjectType.LineString;
    coordinates: Vector2or3[];
}
export type PolygonGeometryType = {
    type: MapObjectType.Polygon;
    coordinates: Vector2or3[][];
}
export type MultiLineGeometryType = {
    type: MapObjectType.MultiLineString;
    coordinates: Vector2or3[][];
}
export type MultiPolygonGeometryType = {
    type: MapObjectType.MultiPolygon;
    coordinates: Vector2or3[][][];
}

export type FeatureProperties = {
    id?: string;
    key?: string;
    layer?: string;
    layerid?: string;
    mapid?: string;
    name?: string;
    objectfirstpointx?: number;
    objectfirstpointy?: number;
    schema?: string;
    semantics?: FeatureSemanticItem[];

    code?: number;
    SEM3DVIEWFILE?: string;
    height?: {
        heightDef: number;
        heightSem?: number;
        heightConstSem?: number;
        keySem?: string;
    };
    viewtype?: number;
    local?: LOCALE;
    localization?: LOCALE;// пока для 3D
    colorValue?: Vector4D;

    __service?: { simplePolygon?: true; };
    title?: string | string[];

    fontSize?: number;

    topscale?: number;
    bottomscale?: number;

    area?: number;
    perimeter?: number;
    LinesLength?: number[];

    sld?: CommonServiceSVG[];
    ClusterId?: string;
    ClusterIdRef?: string;
    ClusterViewPath?: string;

    relative?: boolean;
    type?: string;
    targetMode?: boolean;
    cameraHeightsMode?: boolean;
    description?: string;
    looped?: boolean;
};

export type CommonServiceSVG =
    ({ 'type': 'LineSymbolizer'; } & SvgStroke)
    | ({ 'type': 'PolygonSymbolizer'; } & SvgFill)
    | ({ 'type': 'HatchSymbolizer'; } & SvgHatch)
    | ({ 'type': 'PointSymbolizer'; } & SvgMarker)
    | ({ 'type': 'TextSymbolizer'; } & SvgText);

export type SvgStroke = {
    'stroke'?: string;                                                           //'#000000' цвет
    'stroke-opacity'?: number;                                                   // непрозрачность
    'stroke-width'?: string;                                                     // толщина
    'stroke-linejoin'?: 'mitre' | 'round' | 'bevel';                             // скругление соединений
    'stroke-linecap'?: 'butt' | 'round' | 'square';                              // скругление углов
    'stroke-dasharray'?: string;                                                 // пунктир
    'stroke-dashoffset'?: number;                                                // смещение
    // 'type'?: 'solid' | { graphic: Graphic; }
}

export type SvgFill = {
    'fill'?: string;                                                             //'#FFFFFF' цвет
    'fill-opacity'?: number;                                                     // непрозрачность
    // 'type'?: 'solid' | { graphic: Graphic; }
}

// export type SvgContour = {
//     'stroke'?: string;
// }

type SvgFont = {
    'font-family'?: string;                                                  // имя шрифта
    'font-style'?: 'normal' | 'italic' | 'oblique';                          // стиль шрифта
    'font-weight'?: 'bold' | 'normal';                                       // насыщенность(толщина?) шрифта bold(полужирное)|normal(нормальное)
    'font-size'?: string;                                                    // высота шрифта
    //проверить в SVG

    // 'font-stretch': 'condensed' | 'normal' | 'expanded';                    // начертание (condensed(узкое)|normal(нормальное)|expanded(широкое)
    // 'text-decoration': 'line-through' | 'overline' | 'underline';           // line-through (перечеркнутый) || overline (над текстом)|| underline(подчеркнутый )
    // 'letter-spacing': number;                                               // расстояние между буквами
    // 'text-shadow': string;                                                  // тень text-shadow: 1px 1px 1px #000000;
    //'writing-mode'?: 'lr' | 'rl' | 'tb' | 'lr-tb' | 'rl-tb' | 'tb-rl' |
    //     'bt-rl' | 'tb-lr' | 'bt-lr';


    // Направление текста на странице
    //     lr - Устанавливает направление текста слева направо.
    //     rl - Задает направление текста справа налево.
    //     tb - Текст располагается вертикально сверху вниз.

    // lr-tb Устанавливает направление текста слева направо.
    // rl-tb Задает направление текста справа налево.
    // tb-rl Текст располагается вертикально и выравнивается по верхнему и правому краю.
    // bt-rl Текст располагается вертикально и выравнивается по нижнему и правому краю.
    // tb-lr Текст располагается вертикально и выравнивается по верхнему и левому краю.
    // bt-lr Текст располагается вертикально и выравнивается по нижнему и левому краю.

}

export type SvgText = SvgFont & {
    'fill'?: string;
    'stroke'?: string;
    'stroke-width'?: string;
    'style'?: string;
    'text-shadow'?: string;
}

export type SvgMarker = {
    'refX'?: number;
    'refY'?: number;
    'width'?: number;
    'height'?: number;
    'markerId'?: string;
    'image'?: string;
    'path'?: string;
    'size'?: '1';
};

export type SvgHatch = {
    'stroke'?: string;                                                           //'#000000' цвет
    'stroke-opacity'?: number;                                                   // непрозрачность
    'stroke-width'?: string;                                                     // толщина
    'stroke-angle'?: number;                                                     // наклон штриховки в градусах
    'stroke-step'?: string;                                                      // шаг штриховки 3.794 = 1 мл
};


export type FeatureSemanticItem = {
    key: string;
    name: string;
    code?: string;
    value: string;
    view?: '0' | '1' | '2' | '3' | '4' | '5';
    type?:number;
    isNotNull?: boolean;
    isErrorInput?: boolean;
    maxLength?: string;
    editable?: boolean;
};

export type Bbox = Vector4D | [number, number, number, number, number, number];

export type FeatureType = {
    readonly type: 'Feature' | string;
    readonly bbox?: Bbox;
    readonly geometry: FeatureGeometry;
    readonly properties: FeatureProperties;
}


export type GeoJsonType = {
    type: 'FeatureCollection';
    bbox?: Bbox;
    crs?: CRS;
    features: FeatureType[];
    properties?: FeatureCollectionProperties;
}

type FeatureCollectionProperties = {
    numberMatched: number;
    numberReturned: number;
}

export type GetStatisticsResponse = {
    type: 'FeatureCollection';
    bbox?: Bbox;
    crs?: CRS;
    features: FeatureType[];
    properties?: FeatureCollectionProperties;
    statistic: StatisticList;
};


/**
 * Класс GeoJSON
 * @class GeoJSON
 * @param json {string} JSON-строка
 */
export default class GeoJSON {
    private readonly json: GeoJsonType;
    readonly featureCollection: FeatureCollection;

    constructor( json?: string | GeoJsonType ) {
        if ( json ) {
            if ( typeof json === 'string' ) {
                this.json = JSON.parse( json );
            } else {
                this.json = json;
            }
        } else {
            this.json = {
                'type': 'FeatureCollection',
                'features': []
            };
        }
        this.featureCollection = new FeatureCollection( this.json );
    }

    /**
     * Получить json
     * @method getOrigin
     * @return {Object} JSON-объект
     */
    getOrigin() {
        return this.json;
    }

    /**
     * Получить всю геометрию в виде одномерного массива
     * @method getFullLineGeometry
     * @param [out] {Vector2or3[]} Результат
     * @return {Vector2or3[]} Результат
     */
    getFullLineGeometry( out: Vector2or3[] ) {
        return this.featureCollection.getFullLineGeometry( out );
    }

    /**
     * Добавить объект
     * @method addFeature
     * @param feature {Feature} Объект
     */
    addFeature( feature: FeatureType ) {
        this.json.features.push( feature );
        this.featureCollection.addFeature( feature );
    }

    /**
     * Удалить объект
     * @method removeFeature
     * @param id {string} Идентификатор объекта
     */
    removeFeature( id: string ) {
        for ( let i = 0; i < this.json.features.length; i++ ) {
            if ( this.json.features[ i ].properties.id === id ) {
                this.json.features.splice( i, 1 );
                break;
            }
        }

        this.featureCollection.removeFeature( id );

    }

    /**
     * Удалить все объекты
     * @method removeAllFeatures
     */
    removeAllFeatures() {
        this.json.features.length = 0;

        this.featureCollection.removeAllFeatures();

    }

    /**
     * Получить объект
     * @method getFeature
     * @param index {number} Индекс объекта
     * @return {Feature} Описание объекта
     */
    getFeature( index: number ) {
        return this.featureCollection.getFeature( index );
    }

    /**
     * Создать объект
     * @method createFeature
     * @param properties {Object} Параметры объекта
     * @param geometry {object} Объект геометрии
     * @return {Object} Описание объекта
     */
    static createFeature( properties: FeatureProperties, geometry: FeatureGeometry ) {
        return {
            'type': 'Feature',
            'geometry': geometry,
            'properties': properties || {}
        } as FeatureType;
    }

    /**
     * Создать геометрию объекта
     * @method createFeature
     * @param type {String} Тип геометрии
     * @param coordinates {Array} Массив координат
     * @return {Object} Геометрия объекта
     */
    static createGeometry( type: FeatureGeometry['type'], coordinates: FeatureGeometry['coordinates'] ) {
        let geometry;
        switch ( type ) {
            case MapObjectType.Point:
                geometry = GeoJSON._createPoint( coordinates as PointGeometryType['coordinates'] );
                break;
            case MapObjectType.LineString:
                geometry = GeoJSON._createLineString( coordinates as LineGeometryType['coordinates'] );
                break;
            case MapObjectType.Polygon:
                geometry = GeoJSON._createPolygon( coordinates as PolygonGeometryType['coordinates'] );
                break;
        }
        return geometry;
    }

    /**
     * Создать геометрию точечного объекта
     * @private
     * @method _createPoint
     * @param coordinates {Array} Массив координат
     * @return {Object} Геометрия точечного объекта
     */
    private static _createPoint( coordinates: PointGeometryType['coordinates'] ) {
        return {
            'type': MapObjectType.Point,
            'coordinates': coordinates || []
        };
    }

    /**
     * Создать геометрию линейного объекта
     * @method _createLineString
     * @private
     * @param coordinates {Array} Массив координат
     * @return {Object} Геометрия линейного объекта
     */
    private static _createLineString( coordinates: LineGeometryType['coordinates'] ) {
        return {
            'type': MapObjectType.LineString,
            'coordinates': coordinates || []
        };
    }

    /**
     * Создать геометрию площадного объекта
     * @method _createPolygon
     * @private
     * @param coordinates {Array} Массив координат
     * @return {Object} Геометрия площадного объекта
     */
    private static _createPolygon( coordinates: PolygonGeometryType['coordinates'] ) {
        return {
            'type': MapObjectType.Polygon,
            'coordinates': coordinates || []
        };
    }

    /**
     * Вывод JSON в текстовую строку
     * @method toString
     * @return {string} JSON строка
     */
    toString() {
        return JSON.stringify( this.json );
    }

}


export type CRS = {
    type: 'name';
    properties: {
        name: string;
    };
} | {
    type: 'link',
    properties: {
        href: string;
        type: string;
    }
}

/**
 * Класс коллекции объектов GeoJSON
 * @class FeatureCollection
 * @param json {object} Описания JSON объектов
 */
export class FeatureCollection {
    readonly type = 'FeatureCollection';
    readonly properties?: FeatureCollectionProperties;
    readonly bbox: Bbox;
    readonly crs?: CRS;
    private readonly features: Feature[] = [];

    constructor( json: GeoJsonType ) {
        this.properties = json.properties;
        this.bbox = json.bbox || [-180, -90, 180, 90];

        this.crs = json.crs;

        for ( let i = 0; i < json.features.length; i++ ) {
            this.features.push( new Feature( json.features[ i ] ) );
        }
    }

    /**
     * Получить объект
     * @method addFeature
     * @param [index] {number} Порядковый номер в коллекции
     * @return {Feature} JSON объект
     */
    getFeature( index = 0 ) {
        return (index < this.features.length) ? this.features[index] : undefined;
    }

    /**
     * Получить количество объектов
     * @method getFeatureCount
     * @return {number} Количество объектов
     */
    getFeatureCount() {
        return this.features.length;
    }

    /**
     * Добавить объект
     * @method addFeature
     * @param feature {Feature} JSON объект
     */
    addFeature( feature: FeatureType ) {
        this.features.push( new Feature( feature ) );
    }

    /**
     * Удалить объект
     * @method removeFeature
     * @param id {string} Идентификатор объекта
     */
    removeFeature( id: string ) {
        for ( let i = 0; i < this.features.length; i++ ) {
            if ( this.features[ i ].properties.id === id ) {
                this.features.splice( i, 1 );
                break;
            }
        }
    }

    /**
     * Удалить все объекты
     * @method removeAllFeatures
     */
    removeAllFeatures() {
        this.features.length = 0;
    }


    /**
     * Получить всю геометрию в виде одномерного массива
     * @method getFullLineGeometry
     * @param [out] {Vector2or3[]} Результат
     * @return {Vector2or3[]} Геометрия в виде одномерного массива
     */
    getFullLineGeometry( out: Vector2or3[] = [] ) {
        const geometry = new Geometry( { type: MapObjectType.LineString, coordinates: out } );

        for ( let i = 0; i < this.features.length; i++ ) {
            const featureLineGeometryCoordinates = this.features[ i ].getLineGeometryCoordinates();
            Array.prototype.push.apply( geometry.coordinates, featureLineGeometryCoordinates );
        }
        return geometry;
    }
}


/**
 * Класс объекта GeoJSON
 * @class Feature
 * @param jsonFeature {FeatureType} JSON объект
 */
export class Feature {
    readonly type = 'Feature';
    readonly bbox?: Bbox;
    readonly geometry: Geometry;
    readonly properties: FeatureProperties;//TODO в настоящем ответе отсутствуют многие ключи которые описаны в типизации

    constructor( jsonFeature: FeatureType ) {
        this.bbox = jsonFeature.bbox;
        this.geometry = new Geometry( jsonFeature.geometry );
        this.properties = jsonFeature.properties;

        // Для старой версии GeoJSON, когда стили записывали в Feature
        //@ts-ignore
        const style = jsonFeature.style as any;
        if ( !this.properties.sld && style ) {

            let fill: CommonServiceSVG | undefined, stroke: CommonServiceSVG | undefined;

            if ( style.fillColor ) {
                fill = {
                    type: 'PolygonSymbolizer',
                    fill: style.fillColor
                };
            }

            if ( style.color ) {
                stroke = {
                    type: 'LineSymbolizer',
                    stroke: style.color,
                    'stroke-width': style.weight || '1'
                };
            }

            if ( fill ) {
                if ( !this.properties.sld ) {
                    this.properties.sld = [];
                }
                this.properties.sld.push( fill );
            }

            if ( stroke ) {
                if ( !this.properties.sld ) {
                    this.properties.sld = [];
                }
                this.properties.sld.push( stroke );
            }

        }
    }

    /**
     * Получить всю геометрию в виде одномерного массива
     * @method getLineGeometryCoordinates
     * @return {Vector2or3[]} Массив координат
     */
    getLineGeometryCoordinates() {
        return this.geometry.getLineCoordinates();
    }

    /**
     * Получить всю геометрию в виде массивов полигонов
     * @method getLineGeometryCoordinates
     * @return {Vector2or3[][][]} Массив координат
     */
    getFullGeometryCoordinates() {
        return this.geometry.getMultiPolygonCoordinates();
    }

    /**
     * Получить геометрию
     * @method getGeometry
     * @return {Geometry} Геометрия
     */
    getGeometry() {
        return this.geometry;
    }

    toJSON(): FeatureType {
        return {
            type: this.type,
            bbox: this.bbox,
            geometry: this.geometry.toJSON(),
            properties: this.properties
        };
    }

}

/**
 * Класс геометрии
 * @class Geometry
 * @param jsonGeometry {FeatureGeometry} JSON геометрия
 */
class Geometry {
    type: FeatureGeometry['type'];
    coordinates: FeatureGeometry['coordinates'];

    constructor( jsonGeometry: FeatureGeometry ) {
        this.type = jsonGeometry.type;
        this.coordinates = jsonGeometry.coordinates;
    }

    /**
     * Получить всю геометрию в виде одномерного массива
     * @method getLineCoordinates
     * @return {Vector2or3[]} Массив координат
     */
    getLineCoordinates() {
        const lineCoordinates: Vector2or3[] = [];
        switch ( this.type ) {
            case MapObjectType.Point:
                lineCoordinates.push( this.coordinates as PointGeometryType['coordinates'] );
                break;
            case MapObjectType.MultiPoint:
            case MapObjectType.LineString:
                Array.prototype.push.apply( lineCoordinates, this.coordinates as LineGeometryType['coordinates'] );
                break;
            case MapObjectType.Polygon:
            case MapObjectType.MultiLineString:
                for ( let i = 0; i < this.coordinates.length; i++ ) {
                    Array.prototype.push.apply( lineCoordinates, this.coordinates[ i ] as LineGeometryType['coordinates'] );
                }
                break;
            case MapObjectType.MultiPolygon:
                for ( let j = 0; j < this.coordinates.length; j++ ) {
                    const coordinates = this.coordinates[ j ] as PolygonGeometryType['coordinates'];
                    for ( let k = 0; k < coordinates.length; k++ ) {
                        Array.prototype.push.apply( lineCoordinates, coordinates[ k ] );
                    }
                }
                break;
        }
        return lineCoordinates;

    }

    /**
     * Получить всю геометрию в виде массива координат [объект, подобъекты...]
     * @method getMultiPolygonCoordinates
     * @return {Vector2or3[][][]} Массив координат
     */
    getMultiPolygonCoordinates(): Vector2or3[][][] {
        const result: Vector2or3[][][] = [];
        switch ( this.type ) {
            case MapObjectType.Point:
                result.push( [[this.coordinates as PointGeometryType['coordinates']]] );
                break;
            case MapObjectType.MultiPoint:
            case MapObjectType.LineString:
                const lineCoordinates = (this.coordinates as LineGeometryType['coordinates']).map(coordinates => coordinates.slice() as Vector2or3);
                result.push( [lineCoordinates] );
                break;
            case MapObjectType.Polygon:
            case MapObjectType.MultiLineString:
                const contour = [];
                for ( let i = 0; i < this.coordinates.length; i++ ) {
                    const lineCoordinates = (this.coordinates[i] as LineGeometryType['coordinates']).map(coordinates => coordinates.slice() as Vector2or3);
                    contour.push( lineCoordinates );
                }
                result.push( contour );
                break;
            case MapObjectType.MultiPolygon:
                for ( let j = 0; j < this.coordinates.length; j++ ) {
                    const contour = [];
                    const coordinates = this.coordinates[ j ] as PolygonGeometryType['coordinates'];
                    for ( let k = 0; k < coordinates.length; k++ ) {
                        const lineCoordinates = coordinates[ k ].map(coordinates => coordinates.slice() as Vector2or3);
                        contour.push( lineCoordinates );
                    }
                    result.push( contour );
                }
                break;
        }
        return result;

    }

    /**
     * Получить копию объекта
     * @method clone
     * @return {object} Копия объекта
     */
    clone() {
        return JSON.parse( JSON.stringify( this ) );
    }

    toJSON(): FeatureGeometry {
        return {
            type: this.type,
            coordinates: this.coordinates
        } as FeatureGeometry;
    }

}
