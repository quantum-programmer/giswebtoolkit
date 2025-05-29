/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *    Создание объектов 3d карты по шаблонам классификатора         *
 *                                                                  *
 *******************************************************************/

//TODO: привести в порядок

import Parser3d, {
    ACT3DMATERIALMODE,
    BOLD_FLAG,
    COMMON_FLAG,
    DESCRIPTION3D,
    DIRECTION_BY_LONGEST_SERGMENT,
    ELEMENT3D,
    ELEMENT3DCYLINDER,
    ELEMENT3DFACESET,
    ELEMENT3DLINE,
    ELEMENT3DLINESET,
    ELEMENT3DQUAD,
    ELEMENT3DSPHERE,
    ELEMENT3DTYPE,
    EXTENSION,
    FUNCTION3D,
    FUNCTION3D_TYPE,
    FUNCTION3DHORIZONT,
    FUNCTION3DHORIZONTBYLINE,
    FUNCTION3DMARK,
    FUNCTION3DMARKBYLINE,
    FUNCTION3DMARKBYPOINT,
    FUNCTION3DMARKBYSQUARE,
    FUNCTION3DSECTIONBYLINE,
    FUNCTION3DSLOPEONSQUARE,
    FUNCTION3DSQUARECYLINDER,
    FUNCTION3DTEXT,
    FUNCTION3DVERTBYLINE,
    FUNCTIONTREE,
    IMG3DTRANSFORM,
    IMG3DVALUE, LOCALE,
    NODE3D,
    PAINT_FLAG, SECT_TYPE,
    SURFACE_TYPE,
    TEXTURE_REPEAT,
    TEXTUREMEASURE,
    TRANSFORM_FLAG,
    VECTOR_ORIENTATION3D,
    VISIBLE_PART
} from '~/3d/engine/worker/workerscripts/parse3dobject';
import { IMG3DRGBA } from '~/3d/engine/worker/workerscripts/parse3dtiles';
import { Vector2D, Vector3D, Vector4D, Vector2or3, Matrix4x4 } from '~/3d/engine/core/Types';
import { SimpleJson } from '~/types/CommonTypes';
import { Projection } from '~/3d/engine/core/geometry/projection';
import Geodetic3D from '../../core/geodetic3d';
import Trigonometry from '~/3d/engine/core/trigonometry';
import { Feature, FeatureProperties, FeatureSemanticItem, MultiLineGeometryType } from '~/utils/GeoJSON';
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import Mesh, { WindingOrder, PrimitiveType, MeshSerialized } from '~/3d/engine/core/geometry/mesh';
import HeightTile from '../../scene/terrain/heightsource/heighttile';
import EarClipping3d from '~/3d/engine/core/geometry/earclipping3d';
import Line2DCreator from '~/3d/engine/core/lines/line2d';
import TriangleMeshSubdivision from '~/3d/engine/utils/polygons/trianglemeshsubdivision';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import EllipsoidTangentPlane from '~/3d/engine/core/geometry/ellipsoidtangentplane';
import PolygonAlgorithms from '~/3d/engine/core/geometry/polygonalgorithms';
import Particles from '~/3d/engine/utils/particlesystemparticles';
import Utils from '~/services/Utils';
import { Calculate, mat4, vec2, vec3, vec4 } from '~/3d/engine/utils/glmatrix';
import FONT_METRICS from '~/../gwtkse/3d/fonts/OpenSans-Regular.json';
import TriangulatePanoramaAlgorithm from '~/3d/engine/utils/polygons/triangulatePanorama';
import { MapObjectType } from '~/mapobject/MapObject';

type FontCharacter = keyof typeof FONT_METRICS['chars'];


enum MEASURE {
    texNone = 0,              // Размер текстуры не определен
    texMetr = 1,              // Размер текстуры в метрах
    texUnit = 2               // Размер текстуры в разах
}


type LevelTemplate = {
    functionList: TemplateEMPTY[],
    minDistance: number;
}


type Material3D = {
    ambientColor: Vector4D;
    diffuseColor: Vector4D;
    specularColor: Vector4D;
    emissiveColor: Vector4D;
    shininess: number;
};

type TextureParams = {
    transparentTex: COMMON_FLAG,
    gUnit: MEASURE;
    gValue: number;
    vUnit: MEASURE;
    vValue: number;
}

type TemplateDescription = {
    color?: IMG3DDESCRIPTION['color'];
    material?: IMG3DDESCRIPTION['material'];
    texturePath?: IMG3DDESCRIPTION['textureSemPath'];
    textureId?: IMG3DDESCRIPTION['textureId'];
    smoothTex?: IMG3DDESCRIPTION['smoothTex'];
    transparent: IMG3DDESCRIPTION['transparent'];
    smooth: IMG3DDESCRIPTION['smooth'];
    paintFlag: IMG3DDESCRIPTION['paintFlag'];
    transformFlag: IMG3DDESCRIPTION['transformFlag'];
    guid: IMG3DDESCRIPTION['guid'];
}

export enum VIEWTYPE {
    LineString = 0,
    Polygon = 1,
    Point = 2,
    Title = 3,
    // Vector= 4,
    // Template=5
    Template = 4
}


export type TemplateOptions = {
    viewtype: VIEWTYPE;
    local: LOCALE;
    color?: Vector4D;
    height?: IMG3DVALUE;
}

export type FeatureMesh = {
    description?: TemplateDescription;
    mesh?: MeshSerialized;
    meshInstanced?: MeshSerialized;
    meshText?: MeshSerialized;
    properties: FeatureProperties;
}

type ElementMesh = {
    primitiveType: PrimitiveType;
    vertexList: Vector3D[];
    normalList: Vector3D[];
    textureCoordsList: Vector2or3[];
    colorList: Vector4D[];
    indexList: number[];
}

type TextMeshArrays = {
    instancedOffsetPosArray: Vector4D[];
    instancedTextureParamsArray: Vector4D[];
    instancedNormalArray: Vector4D[];
    instancedRightArray: Vector3D[];
    instancedUpArray: Vector4D[];
};

type TextSupportParams = { normal: Vector4D; normalBack: Vector4D; rightVector: Vector3D; upVector: Vector4D; };


/**
 * Класс шаблона 3D-объекта
 * @class Object3dTemplate
 * @constructor Object3dTemplate
 * @param layerId {string} Идентификатор слоя
 * @param code {string} Код шаблона
 * @param key {string} Ключ шаблона
 */
export default class Object3dTemplate {
    code: number;
    key: string;
    layerId: string;
    levelTemplates: { [ key: number ]: LevelTemplate } = {};

    constructor( layerId: string, code: number, key: string ) {
        this.code = code;
        this.key = key;
        this.layerId = layerId;

    }

    /**
     * Временный список мешей
     * @property mMeshList {Array}
     * @static
     */
    private mMeshList: { meshList: FeatureMesh[], minDistance: number }[] = [];

    /**
     * Добавить шаблон рисования
     * @method addTemplate
     * @public
     * @param level {number} Уровень шаблона рисования
     * @param f3dtree {Object} Описание шаблона рисования
     * @param minDistance {number} Минимальная дистанция отображения
     */
    addTemplate( level: number, f3dtree: FUNCTIONTREE, minDistance: number ) {
        const functionList: TemplateEMPTY[] = [];
        //заполнение списка функций рисования
        const funcArray = f3dtree.FUNCTIONLIST;
        for ( let i = 0; i < funcArray.length; i++ ) {
            const function3d = this._createFunction( funcArray[ i ] );
            if ( function3d ) {
                functionList.push( function3d );
            }
        }
        this.levelTemplates[ level ] = {
            functionList,
            minDistance: Math.round( minDistance ) || -Number.MAX_VALUE
        };
    }

    /**
     * Получить массив функций рисования по уровню
     * @method getFunctionListByLevel
     * @public
     * @param level {number} Уровень шаблона рисования
     * @return {array} Массив функций рисования
     */
    getFunctionListByLevel( level: number ) {
        return this.levelTemplates[ level ].functionList;
    }

    /**
     * Получить минимальную дистанцию отображения уровня
     * @method getDistanceByLevel
     * @public
     * @param level {number} Уровень шаблона рисования
     * @return {number} Минимальная дистанция отображения уровня
     */
    getDistanceByLevel( level: number ) {
        return this.levelTemplates[ level ].minDistance;
    }

    /**
     * Создать функцию рисования
     * @method _createFunction
     * @private
     * @param func {Object} Описание функции рисования
     */
    _createFunction( func: FUNCTION3D ) {
        let function3d: TemplateEMPTY | undefined = undefined;
        switch ( func.Number ) {
            case FUNCTION3D_TYPE.F3D_NULL:
                break;
            // case FUNCTION3D_TYPE.F3D_EMPTY:
            //     function3d = new TemplateEMPTY( func, this );
            //     break;
            case FUNCTION3D_TYPE.F3D_MARK:
                function3d = new TemplateMARKINPOINT( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_MARKBYLINE:
                function3d = new TemplateMARKBYLINE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_MARKBYPOINT:
                function3d = new TemplateMARKBYPOINT( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_MARKBYSQUARE:
                function3d = new TemplateMARKBYSQUARE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_VERTBYLINE:
                function3d = new TemplateVERTBYLINE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_HORIZONTBYLINE:
                function3d = new TemplateHORIZONTBYLINE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_HORIZONT:
                function3d = new TemplateHORIZONT( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_LINEBYSURFACE:
                break;
            // case FUNCTION3D_TYPE.F3D_TREE:
            //     break;
            case FUNCTION3D_TYPE.F3D_TOPONSQUARE:
                function3d = new TemplateTOPONSQUARE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_SQUARECYLINDER:
                function3d = new TemplateSQUARECYLINDER( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_FLATLINE:
                function3d = new TemplateFLATLINE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_SURFACE:
                function3d = new TemplateSURFACE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_SECTIONBYLINE:
                function3d = new TemplateSECTIONBYLINE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_SLOPEONSQUARE:
                function3d = new TemplateSLOPEONSQUARE( func, this );
                break;
            case FUNCTION3D_TYPE.F3D_TEXT:
                function3d = new TemplateTEXT( func, this );
                break;
            // case FUNCTION3D_TYPE.F3D_HORIZONT_ANIMATED:
            //     break;
        }

        return function3d;
    }

    /**
     * Функция получения относительной высоты по идентификатору функции
     * @method getRelativeHeightByFunction
     * @public
     * @param ident {number} Идентификатор функции
     * @param objectProperties {object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {number} Относительная высота
     */
    getRelativeHeightByFunction( ident: number, objectProperties: FeatureProperties, level: number ) {
        let relativeHeight = 0;
        const functionList = this.getFunctionListByLevel( level );
        for ( let i = 0; i < functionList.length; i++ ) {
            const function3d = functionList[ i ];
            if ( function3d.identifier === ident ) {
                relativeHeight = function3d.getRelativeHeight( objectProperties, level ) + function3d.getHeight( objectProperties );
                break;
            }
        }
        return relativeHeight;
    }

    /**
     * Создать список мешей для объекта карты
     * @method createMeshList
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param options {Object=} Описание для стандартного шаблона
     * @param [untiled] {boolean} Признак объекта вне тайлов
     * @return {array} Список мешей для объекта карты
     */
    createMeshList( feature: Feature, heightTile: HeightTile, options: TemplateOptions, untiled?: boolean ) { // TODO: untiled
        this.mMeshList.length = 0;
        // Изменения для стандартных шаблонов
        if ( options ) {
            this._applyOptions( options );
        }

        for ( const key in this.levelTemplates ) {
            const level = +key;
            const meshList: FeatureMesh[] = [];
            const functionList = this.getFunctionListByLevel( level );
            for ( let i = 0; i < functionList.length; i++ ) {
                const featureMeshList = functionList[ i ].createMesh( feature, heightTile, level, untiled ); // TODO: untiled
                if ( featureMeshList ) {
                    for ( let j = 0; j < featureMeshList.length; j++ ) {
                        meshList.push( featureMeshList[ j ] );
                    }
                }
            }
            if ( meshList.length > 0 ) {
                this.mMeshList.push( { meshList: meshList, minDistance: this.getDistanceByLevel( level ) } );
            }
        }


        // Восстановление стандартных шаблонов
        if ( options ) {
            this._restoreOptions();
        }
        return this.mMeshList;
    }

    /**
     * Применение описания для стандартного шаблона
     * @method _applyOptions
     * @private
     * @param options {Object} Описание для стандартного шаблона
     */
    _applyOptions( options: TemplateOptions ) {
        for ( const key in this.levelTemplates ) {
            const level = +key;
            const functionList = this.getFunctionListByLevel( level );
            for ( let k = 0; k < functionList.length; k++ ) {
                functionList[ k ].applyOptions( options, k === 0 );//fixme: этажность и подвал
            }
        }
    }

    /**
     * Восстановление описания стандартного шаблона
     * @method _restoreOptions
     * @private
     */
    _restoreOptions() {
        for ( const key in this.levelTemplates ) {
            const level = +key;
            const functionList = this.getFunctionListByLevel( level );
            for ( let k = 0; k < functionList.length; k++ ) {
                functionList[ k ].restoreOptions();
            }
        }
    }
}


/**
 * Класс пустого шаблона
 * @class TemplateEMPTY
 * @constructor TemplateEMPTY
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
abstract class TemplateEMPTY {
    identifier: number;
    surfaceFlag = SURFACE_TYPE.ALLFREE;
    nodeList: IMG3DNODE[] = [];
    mainObject: Object3dTemplate;
    height: IMG3DVALUE = {
        Value: 0,
        Type: 0,
        Factor: 0,
        Offset: 0
    };
    relativeHeight: IMG3DVALUE = {
        Value: 0,
        Type: 0,
        Factor: 0,
        Offset: 0
    };
    originalHeight?: IMG3DVALUE;

    protected constructor( func: FUNCTION3D, mainObject: Object3dTemplate ) {
        this.mainObject = mainObject;
        this.identifier = func.Ident;

        if ( func.Number === FUNCTION3D_TYPE.F3D_VERTBYLINE ||
            func.Number === FUNCTION3D_TYPE.F3D_TOPONSQUARE ||
            func.Number === FUNCTION3D_TYPE.F3D_FLATLINE ||
            func.Number === FUNCTION3D_TYPE.F3D_HORIZONTBYLINE ||
            func.Number === FUNCTION3D_TYPE.F3D_LINEBYSURFACE ||
            func.Number === FUNCTION3D_TYPE.F3D_SECTIONBYLINE ||
            func.Number === FUNCTION3D_TYPE.F3D_SLOPEONSQUARE ||
            func.Number === FUNCTION3D_TYPE.F3D_TEXT
        ) {
            this.surfaceFlag = func.FUNCTIONPARAMS.SurfaceFlag;
        }


        let functionparams;
        if ( func.Number !== FUNCTION3D_TYPE.F3D_NULL ) {
            if ( func.Number === FUNCTION3D_TYPE.F3D_MARK ||
                func.Number === FUNCTION3D_TYPE.F3D_MARKBYPOINT ||
                func.Number === FUNCTION3D_TYPE.F3D_MARKBYLINE ||
                func.Number === FUNCTION3D_TYPE.F3D_MARKBYSQUARE ) {
                functionparams = func.FUNCTIONPARAMS.Mark.FUNCTIONPARAMS;
            } else {
                functionparams = func.FUNCTIONPARAMS;
            }

            if ( functionparams ) {
                const height = Reflect.get(functionparams, 'Height');
                if ( height ) {
                    this.height = height;
                }

                const relativeHeight = Reflect.get(functionparams, 'RelativeHeight');
                if ( relativeHeight ) {
                    this.relativeHeight = relativeHeight;
                }

                const nodes = functionparams.NODELIST;
                if ( nodes ) {
                    for ( let i = 0; i < nodes.length; i++ ) {
                        this.nodeList.push( new IMG3DNODE( nodes[ i ], mainObject ) );
                    }
                }
            }
        }
        if ( !TemplateEMPTY.mGeoPoint ) {
            TemplateEMPTY.mGeoPoint = new Geodetic3D( 0, 0, 0 );
        }

    }

    static mGeoPoint: Geodetic3D;


    /**
     * Временный массив точек
     * @property mPositions {Array}
     * @static
     */
    mPositions: Vector3D[] = [];
    /**
     * Временный массив точек
     * @property mNarmilizedPositions {Array}
     * @static
     */
    mCleanedPositions: Vector3D[] = [];
    /**
     * Временный массив высот
     * @property mHeights {Array}
     * @static
     */
    static mHeights: number[] = [];


    static mCurNormal = vec3.create();

    /**
     * Функция получения относительной высоты части объекта
     * @method getRelativeHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {Number} Относительная высота
     */
    getRelativeHeight( objectProperties: FeatureProperties, level: number ) {
        let relativeHeightValue;
        if ( this.relativeHeight.Type < 0 ) {
            const ident = Math.abs( this.relativeHeight.Type );
            relativeHeightValue = this.mainObject.getRelativeHeightByFunction( ident, objectProperties, level );
        } else {
            relativeHeightValue = this.relativeHeight.Value;
        }
        return relativeHeightValue;
    }

    /**
     * Функция получения объекта описания
     * @method getDescriptionObject
     * @public
     * @result {IMG3DDESCRIPTION} Объект описания
     */
    getDescriptionObject() {
        let descriptionObject;
        // for (const i = 0; i < this.nodeList.length; i++) {
        //     const node = this.nodeList[i];
        //     for (const j = 0; j < node.descriptionList.length; j++) {
        //         const templateDescription = node.descriptionList[j].getDescription(feature.properties);
        //         textureParams = node.descriptionList[j].getTextureParams(feature.properties);
        //     }
        // }
        //TODO: описания для разных узлов

        if ( this.nodeList[ 0 ] && this.nodeList[ 0 ].descriptionList[ 0 ] ) {
            descriptionObject = this.nodeList[ 0 ].descriptionList[ 0 ];
        }
        return descriptionObject;
    }

    /** Функция получения высоты части объекта
     * @method getHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение высоты
     */
    getHeight( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.height, objectProperties );
    }

    static getSemValue( semantics: FeatureSemanticItem[], key: string ) {
        for ( let i = 0; i < semantics.length; i++ ) {
            const semantic = semantics[ i ];
            if ( semantic.key === key ) {
                return semantic.value;
            }
        }
        return '';
    }

    static getImg3dValue( value: IMG3DVALUE, objectProperties: FeatureProperties ) {
        let result, objectValue;
        if ( value.SemKey && objectProperties.semantics ) {
            objectValue = +this.getSemValue( objectProperties.semantics, value.SemKey );
        }
        if ( objectValue !== undefined ) {
            result = objectValue * value.Factor + value.Offset;
        } else {
            result = value.Value;
        }

        return result;
    }

    /** Функция получения нормализованных векторов по метрике объекта
     * @method computeNormalizedPositions
     * @public
     * @param positionsGeoJSON {Array} Метрика объекта (в градусах)
     * @param positionArray {Array=} Массив для заполнения
     * @result {Array} Массив нормализованных векторов
     */
    computeNormalizedPositions( positionsGeoJSON: Vector2or3[], positionArray: Vector3D[] = [] ) {
        for ( let i = 0; i < positionsGeoJSON.length; i++ ) {
            const geodetic = positionsGeoJSON[ i ];
            const lngDeg = geodetic[ 0 ] * Math.PI / 180;
            const latDeg = geodetic[ 1 ] * Math.PI / 180;

            const cosLatitude = Math.cos( latDeg );
            positionArray[ i ] = [
                cosLatitude * Math.cos( lngDeg ),
                cosLatitude * Math.sin( lngDeg ),
                Math.sin( latDeg )];

        }
        return positionArray;
    }

    /**
     * Применение описания для стандартного шаблона
     * @method applyOptions
     * @public
     * @param options {Object} Описание для стандартного шаблона
     * @param heightApply {boolean} Флаг для описания высот
     */
    applyOptions( options: TemplateOptions, heightApply: boolean ) {
        if ( options.height && heightApply ) {
            this.originalHeight = this.height;
            this.height = options.height;
        }
        if ( options.color ) {
            for ( let i = 0; i < this.nodeList.length; i++ ) {
                const node = this.nodeList[ i ];
                for ( let j = 0; j < node.descriptionList.length; j++ ) {
                    node.descriptionList[ j ].originalColor = node.descriptionList[ j ].color;
                    node.descriptionList[ j ].color = options.color;
                }
            }
        }
    }

    /**
     * Восстановление описания стандартного шаблона
     * @method restoreOptions
     * @public
     */
    restoreOptions() {
        if ( this.originalHeight ) {
            this.height = this.originalHeight;
            this.originalHeight = undefined;
        }
        for ( let i = 0; i < this.nodeList.length; i++ ) {
            const node = this.nodeList[ i ];
            for ( let j = 0; j < node.descriptionList.length; j++ ) {
                const description = node.descriptionList[ j ];
                if ( description.originalColor ) {
                    description.color = description.originalColor;
                    description.originalColor = undefined;
                }
            }
        }
    }

    /** Функция создания массива нормалей
     * @method _createNormals
     * @protected
     * @param indicesAttributeValues {Array} Массив индексов
     * @param posValues {Array} Массив координат
     * @result {Array} Массив нормалей
     */
    _createNormals( indicesAttributeValues: number[], posValues: Vector3D[] ) {
        //Добавление нормалей
        const curNormal = TemplateEMPTY.mCurNormal;
        const normals: Vector3D[] = [];
        for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {
            const ind1 = indicesAttributeValues[ i ];
            const ind2 = indicesAttributeValues[ i + 1 ];
            const ind3 = indicesAttributeValues[ i + 2 ];

            Calculate.calcNormal( posValues[ ind1 ], posValues[ ind2 ], posValues[ ind3 ], curNormal );

            let normal = normals[ ind1 ];
            if ( normal ) {
                vec3.add( normal, curNormal );
            } else {
                normals[ ind1 ] = curNormal.slice() as typeof curNormal;
            }

            normal = normals[ ind2 ];
            if ( normal ) {
                vec3.add( normal, curNormal );
            } else {
                normals[ ind2 ] = curNormal.slice() as typeof curNormal;
            }

            normal = normals[ ind3 ];
            if ( normal ) {
                vec3.add( normal, curNormal );
            } else {
                normals[ ind3 ] = curNormal.slice() as typeof curNormal;
            }
        }
        for ( let i = 0; i < normals.length; i++ ) {
            if ( !normals[ i ] ) {
                normals[ i ] = vec3.create();
            }
            vec3.normalize( normals[ i ] );
        }
        return normals;
    }

    /** Функция создания меша знака
     * @method createMesh
     * @public
     * @result {Array} Массив мешей объекта карты
     */
    abstract createMesh( feature: Feature, heightTile: HeightTile, level: number, untiled?: boolean ): FeatureMesh[];

    /** Функция создания списка мешей
     * @method createFeatureMeshList
     * @protected
     * @param mesh {Object} Объект параметров меша
     * @param feature {Object} Объект карты в формате GeoJSON
     * @result {Array} Массив мешей объекта карты
     */
    protected createFeatureMeshList( mesh: MeshSerialized, feature: Feature ) {
        const featureMeshList: FeatureMesh[] = [];
        // const mesh = new Mesh();
        // mesh.setPrimitiveType( meshParams.primitiveType );
        // mesh.setFrontFaceWindingOrder( meshParams.windingOrder );
        //
        // if ( meshParams.positionAttributeValues !== undefined ) {
        //     const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float );
        //     positionsAttribute.setValues( meshParams.positionAttributeValues );
        //     mesh.addAttribute( positionsAttribute );
        // }
        //
        // if ( meshParams.normalAttributeValues !== undefined ) {
        //     const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float );
        //     normalsAttribute.setValues( meshParams.normalAttributeValues );
        //     mesh.addAttribute( normalsAttribute );
        // }
        //
        // if ( meshParams.textureCoordAttributeValues !== undefined ) {
        //     const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float );
        //     textureCoordAttribute.setValues( meshParams.textureCoordAttributeValues );
        //     mesh.addAttribute( textureCoordAttribute );
        // }
        //
        // if ( meshParams.materialAttributeValues !== undefined ) {
        //     const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float );
        //     materialsAttribute.setValues( meshParams.materialAttributeValues );
        //     mesh.addAttribute( materialsAttribute );
        // }
        //
        // if ( meshParams.indicesAttributeValues !== undefined ) {
        //     const indicesAttribute = new Indices( IndicesType.uByte );
        //     indicesAttribute.setValues( meshParams.indicesAttributeValues );
        //     indicesAttribute.validateType();
        //     mesh.setIndices( indicesAttribute );
        // }
        //
        // if ( meshParams.options && meshParams.options.shadowVolume ) {
        //     mesh.shadowVolume = meshParams.options.shadowVolume;
        // }
        const descriptionObject = this.getDescriptionObject();
        let templateDescription;
        if ( descriptionObject ) {
            templateDescription = descriptionObject.getDescription( feature.properties );
        }
        featureMeshList.push( {
            properties: feature.properties,
            description: templateDescription,
            mesh
        } );

        return featureMeshList;
    }

    /**
     * Функция заполнения массива высот
     * @method _fillHeights
     * @private
     * @param heightTile {HeightTile} Тайл высот
     * @param resultPositions {array} Массив точек {x,y,z}
     * @result {number} Максимальная высота
     */
    _fillHeights( heightTile: HeightTile, resultPositions: Vector3D[] ) {

        const globeShape = heightTile.projection.getGlobeShape();
        TemplateEMPTY.mHeights.length = 0;
        let maxMetricHeight = -12000;
        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];
            const heightInPoint = heightTile.getHeightInPointInterpolated( globeShape.toGeodetic3d( position ) );
            TemplateEMPTY.mHeights.push( heightInPoint );
            if ( maxMetricHeight < heightInPoint ) {
                maxMetricHeight = heightInPoint;
            }
        }
        return maxMetricHeight;
    }

    /**
     * Функция заполнения массива высот вне тайла
     * @method _fillHeightsForUntiled
     * @private
     * @param htile
     * @param projection
     * @param resultPositions {array} Массив точек {x,y,z}
     * @result {number} Максимальная высота
     */
    _fillHeightsForUntiled( htile: HeightTile, projection: Projection, resultPositions: Vector3D[] ) { // TODO: untiled
        let maxMetricHeight = -12000;

        const globeShape = projection.getGlobeShape();
        TemplateEMPTY.mHeights.length = 0;

        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];
            const geoPoint = globeShape.toGeodetic3d( position );
            let heightTile = htile;
            // const heightTile = new HeightTile(projection);
            // heightTile.fromJSON(this.params.hTile);

            let heightInPoint;
            if ( heightTile ) {
                heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
            } else {
                heightInPoint = 0;
            }
            TemplateEMPTY.mHeights.push( heightInPoint );
            if ( maxMetricHeight < heightInPoint ) {
                maxMetricHeight = heightInPoint;
            }
        }
        return maxMetricHeight;
    }
}


/**
 * Класс шаблона знака
 * @class TemplateMARK
 * @constructor TemplateMARK
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateMARK extends TemplateEMPTY {

    private readonly sizeX: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['SizeX'];
    private readonly sizeZ: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['SizeZ'];
    private readonly scale: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['Scale'];
    readonly vector: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['Vector'];
    private readonly sizeScaleFactor: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['SizeScaleFactor'];
    private readonly transformFlag: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark']['FUNCTIONPARAMS']['TransformFlag'];
    private readonly transformMatrix: Matrix4x4;
    private readonly cScale: Vector3D = [1, 1, 1];
    private readonly mMatrix = mat4.create( mat4.IDENTITY );
    private readonly mNodeMatrix = mat4.create();

    // private mVector: number[] = [];


    constructor( func: FUNCTION3DMARKBYPOINT['FUNCTIONPARAMS']['Mark'], mainObject: Object3dTemplate ) {
        super( { ...func, Ident: -1, Number: -1 }, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
        this.sizeX = functionParams.SizeX;
        this.sizeZ = functionParams.SizeZ;
        this.scale = functionParams.Scale;
        this.vector = functionParams.Vector;

        this.sizeScaleFactor = functionParams.SizeScaleFactor / 100;
        // const points = functionParams.Point;
        // this.beginPoint = [points[0].X, points[0].Y, points[0].Z];

        this.transformFlag = functionParams.TransformFlag;
        if ( this.transformFlag === TRANSFORM_FLAG.IMG3DTRANSFORM && functionParams.IMG3DTRANSFORM ) {
            this.transformMatrix = Parser3d.createTransformMatrix( functionParams.IMG3DTRANSFORM );
        } else if ( this.transformFlag === TRANSFORM_FLAG.IMG3DMATRIX && functionParams.IMG3DTMATRIX ) {
            this.transformMatrix = functionParams.IMG3DTMATRIX.Matrix;
        } else {
            this.transformMatrix = mat4.IDENTITY;
        }

        mat4.rotate( this.mMatrix, vec3.UNITX, Math.PI * 0.5 );
    }

    /** Функция создания меша знака
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {
        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );

        const sizeXvalue = this.getSizeX( feature.properties );
        const heightValue = this.getHeight( feature.properties );
        const sizeZvalue = this.getSizeZ( feature.properties );


        const transform = mat4.set( this.transformMatrix, this.mNodeMatrix );

        const rotateMatrix = this.mMatrix;
        mat4.multiply( rotateMatrix, transform, transform );

        const xScale = this.scale[ 0 ] === 0 ? 1 : sizeXvalue / this.sizeX.Value;
        const yScale = this.scale[ 1 ] === 0 ? 1 : heightValue / this.height.Value;
        const zScale = this.scale[ 2 ] === 0 ? 1 : sizeZvalue / this.sizeZ.Value;

        mat4.scale( transform, [xScale, yScale, zScale] );

        // const translateVector = [0, relativeHeightValue, 0];
        // mat4.translate(transform, translateVector, transform);

        const featureMeshList: FeatureMesh[] = [];
        for ( let i = 0; i < this.nodeList.length; i++ ) {
            const nodeMeshList = this.nodeList[ i ].createNodeMesh( transform, feature, relativeHeightValue, this.vector );
            for ( let j = 0; j < nodeMeshList.length; j++ ) {
                featureMeshList.push( nodeMeshList[ j ] );
            }
        }

        return featureMeshList;
    }

    /** Функция получения размера знака по оси X
     * @method getSizeX
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение размера знака по оси X
     */
    getSizeX( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.sizeX, objectProperties );
    }

    /** Функция получения размера знака по оси Z
     * @method getSizeZ
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение размера знака по оси Z
     */
    getSizeZ( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.sizeZ, objectProperties );
    }

    /** Функция получения оси и угла поворота знака
     * @method getRotationByVector
     * @public
     * @param vector {Array} Направление знака
     * @param orthoVector {Array} Вектор, ортогональный поверхности
     * @result {object} Ось и угол поворота знака
     */
    getRotationByVector( vector: Vector3D | undefined, orthoVector: Vector3D ) {
        const ortho = (this.vector | VECTOR_ORIENTATION3D.VM_VERTICAL) === this.vector;
        let rotateAngle, rotationAxis: Vector3D;
        if ( (this.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_ANYTURN ) {
            rotationAxis = vec3.create( orthoVector );
            rotateAngle = Math.random() * 2 * Math.PI;
        } else if ( vector && ((this.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYCURCUT ||
            (this.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYLASTCUT ||
            (this.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYLARGSIDE ||
            (this.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYANGLE) ) {


            const matAxis = this.mMatrix;
            const xAxis = vec3.transformMat4( vec3.create( vec3.UNITX ), matAxis ); //TODO: было transformMat3???
            // При отрисовке знак поворачивается до совпадения оси Z знака с вектором из центра Земли
            // поэтому следует повернуть и ось X для расчета
            const zUp = orthoVector;
            const zxNorm = vec3.normalize( vec3.cross( vec3.create( vec3.UNITZ ), zUp ) );
            const zxNormAngle = Math.acos( vec3.dot( vec3.UNITZ, zUp ) );
            vec3.normalize( vec3.rotateAroundAxis( xAxis, zxNorm, zxNormAngle ) );

            const yAxis = vec3.normalize( vec3.cross( orthoVector, xAxis, vec3.create() ) );

            const curVector = vec3.create();
            curVector[ 0 ] = vec3.dot( vector, xAxis );
            curVector[ 1 ] = vec3.dot( vector, yAxis );
            if ( !ortho ) {
                curVector[ 2 ] = vec3.dot( vector, orthoVector );
            } else {
                curVector[ 2 ] = 0;
            }

            rotateAngle = Math.acos( vec3.dot( curVector, vec3.UNITX ) );

            //память
            const rotationXYZaxis = curVector;
            vec3.normalize( vec3.cross( vec3.UNITX, curVector, rotationXYZaxis ) );

            rotationAxis = [0, 0, 0];

            vec3.scaleAndAdd( rotationAxis, xAxis, rotationXYZaxis[ 0 ], rotationAxis );
            vec3.scaleAndAdd( rotationAxis, yAxis, rotationXYZaxis[ 1 ], rotationAxis );
            vec3.scaleAndAdd( rotationAxis, orthoVector, rotationXYZaxis[ 2 ], rotationAxis );

            if ( vec3.dot( rotationAxis, orthoVector ) < 0 ) {
                vec3.scale( rotationAxis, -1 );
                rotateAngle = -rotateAngle;
            }

        } else {
            rotationAxis = vec3.create( orthoVector );
            rotateAngle = 0;
        }


        return { axis: rotationAxis, angle: rotateAngle };
    }

    /** Функция добавление смещения
     * @method addOffsetToPoint
     * @public
     * @param point {Array} Изменяемая точка
     * @param offset {Array=} Вектор смещения
     * @result {object} Измененная точка
     */
    addOffsetToPoint( point: Vector2or3, offset?: Vector3D ) {
        for ( let i = 0; i < point.length; i++ ) {
            if ( offset && offset[ i ] != null ) {
                point[ i ] += offset[ i ];
            } else {
                point[ i ] += Math.random() * 10 - 5;
            }

        }
        return point;
    }

    /** Функция получения добавочного масштабирования
     * @method getAdditionalScale
     * @public
     * @result {array} Вектор масштабирования
     */
    getAdditionalScale() {
        let scale = this.cScale;
        if ( (this.vector | VECTOR_ORIENTATION3D.VM_ANYSIZE) === this.vector ) {
            const kScale = Math.random() * this.sizeScaleFactor + 1.;
            scale = this.cScale.slice() as typeof scale;
            scale[ 0 ] *= kScale;
            scale[ 1 ] *= kScale;
            scale[ 2 ] *= kScale;
        }
        return scale;
    }
}

/**
 * Класс шаблона знака в точке
 * @class TemplateMARKINPOINT
 * @constructor TemplateMARKINPOINT
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateMARKINPOINT extends TemplateEMPTY {
    private readonly mark: TemplateMARK;
    private static mAddVector = vec3.create();

    constructor( func: FUNCTION3DMARK, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        this.mark = new TemplateMARK( func.FUNCTIONPARAMS.Mark, mainObject );
    }


    /** Функция создания параметров анимированного объекта для mesh
     * @method createAnimatedFountainParam
     * @param aParamAnimatedFountain {object} параметры анимированного объектаобъекта
     * @param widthFountain  ширина фонтана
     * @return {{meshParam: {pSpinStartSpinSpeed: *, pColorMultArray: *, pVelocityStartSize: *, pOrientationArray: *, pAccelerationEndSize: *, pUvLifeTimeFrameStart: *, pPositionStartTime: *}, paramSetupFountain: *}}
     *
     * @private
     */
    private createAnimatedFountainParam( aParamAnimatedFountain: SimpleJson<any>, widthFountain: number ) { //TODO: тоже самое с `any`

        let g_randSeed = 0;
        const g_randRange = Math.pow( 2, 32 );


        const pPositionStartTime: Vector4D[] = [];
        const pUvLifeTimeFrameStart: Vector4D[] = [];
        const pVelocityStartSize: Vector4D[] = [];
        const pAccelerationEndSize: Vector4D[] = [];
        const pSpinStartSpinSpeed: Vector4D[] = [];
        const pOrientationArray: Vector4D[] = [];
        const pColorMultArray: Vector4D[] = [];

        const paramAnimatedFountain = aParamAnimatedFountain;
        Particles.validateParameters( paramAnimatedFountain );
        const parameters = paramAnimatedFountain;
        const numParticles = paramAnimatedFountain.numParticles;


        for ( let ii = 0; ii < paramAnimatedFountain.numParticles; ii++ ) {
            if ( paramAnimatedFountain.ripple ) {
                setParamFountainOrientationForRipple( ii, parameters, widthFountain );
            } else {
                setParamFountainOrientation( ii, parameters );
            }

            const pLifeTime = parameters.lifeTime;
            const pStartTime = (parameters.startTime === undefined) ?
                (ii * parameters.lifeTime / numParticles) : parameters.startTime;
            const pFrameStart =
                parameters.frameStart + plusMinus( parameters.frameStartRange );
            const pPosition = vec3.create();
            vec3.add( parameters.position, plusMinusVector( parameters.positionRange ), pPosition );
            const pVelocity = vec3.create();
            vec3.add( parameters.velocity, plusMinusVector( parameters.velocityRange ), pVelocity );
            const pStartSize = parameters.startSize + plusMinus( parameters.startSizeRange );
            const pAcceleration = vec3.create();
            vec3.add( parameters.acceleration, plusMinusVector( parameters.accelerationRange ), pAcceleration );
            const pSpinStart = parameters.spinStart + plusMinus( parameters.spinStartRange );
            const pOrientation = parameters.orientation;
            const pColorMultTemp = vec3.create();
            vec3.add( parameters.colorMult, plusMinusVector( parameters.colorMultRange ), pColorMultTemp );

            const pColorMult = vec4.create();
            vec4.fromVector3( pColorMultTemp, pColorMult );
            pColorMult[ 3 ] = parameters.colorMult[ 3 ];

            const pSpinSpeed = parameters.spinSpeed + plusMinus( parameters.spinSpeedRange );
            const pEndSize = parameters.endSize + plusMinus( parameters.endSizeRange );
            //угол для уаждой частицы
            for ( let jj = 0; jj < 6; jj++ ) {
                const ind: number = pPositionStartTime.length;
                switch ( jj ) {
                    case 0:
                    case 3:
                        pUvLifeTimeFrameStart[ ind ] = [
                            Particles.CORNERS[ 0 ][ 0 ],
                            Particles.CORNERS[ 0 ][ 1 ],
                            pLifeTime,
                            pFrameStart];

                        break;
                    case 1 :
                        pUvLifeTimeFrameStart[ ind ] = [
                            Particles.CORNERS[ 1 ][ 0 ],
                            Particles.CORNERS[ 1 ][ 1 ],
                            pLifeTime,
                            pFrameStart];

                        break;
                    case 2:
                    case 4 :
                        pUvLifeTimeFrameStart[ ind ] = [
                            Particles.CORNERS[ 2 ][ 0 ],
                            Particles.CORNERS[ 2 ][ 1 ],
                            pLifeTime,
                            pFrameStart];
                        break;
                    case 5 :
                        pUvLifeTimeFrameStart[ ind ] = [
                            Particles.CORNERS[ 3 ][ 0 ],
                            Particles.CORNERS[ 3 ][ 1 ],
                            pLifeTime,
                            pFrameStart];
                        break;
                }
                pPositionStartTime[ ind ] = [pPosition[ 0 ]
                    , pPosition[ 1 ]
                    , pPosition[ 2 ]
                    , pStartTime];

                pVelocityStartSize[ ind ] = [pVelocity[ 0 ]
                    , pVelocity[ 1 ]
                    , pVelocity[ 2 ]
                    , pStartSize];

                pAccelerationEndSize[ ind ] = [pAcceleration[ 0 ]
                    , pAcceleration[ 1 ]
                    , pAcceleration[ 2 ]
                    , pEndSize];

                pSpinStartSpinSpeed[ ind ] = [pSpinStart
                    , pSpinSpeed
                    , 0
                    , 0];

                pOrientationArray[ ind ] = [pOrientation[ 0 ]
                    , pOrientation[ 1 ]
                    , pOrientation[ 2 ]
                    , pOrientation[ 3 ]];

                pColorMultArray[ ind ] = [pColorMult[ 0 ]
                    , pColorMult[ 1 ]
                    , pColorMult[ 2 ]
                    , pColorMult[ 3 ]];

            }
        }
        return {
            paramSetupFountain: parameters,
            meshParam: {
                pPositionStartTime,
                pUvLifeTimeFrameStart,
                pVelocityStartSize,
                pAccelerationEndSize,
                pSpinStartSpinSpeed,
                pOrientationArray,
                pColorMultArray
            }
        };


        /**
         * Возвращает детерминированное псевдослучайное число от 0 до 1.
         * @return {number} случайное число от 0 до 1
         */
        function pseudoRandom() {
            return (g_randSeed = (134775813 * g_randSeed + 1) % g_randRange) /
                g_randRange;
        }

        function setParamFountainOrientationForRipple( particleIndex: number, parameters: SimpleJson<any>, widthFountain: number ) { //TODO: тоже самое с `any`
            const matrix = mat4.create( mat4.IDENTITY );
            mat4.rotateZ( matrix, pseudoRandom() * Math.PI * 2, matrix );
            const vector = pseudoRandom() * widthFountain;
            const position = vec3.create();
            position[ 0 ] = vector;
            vec3.transformMat4( position, matrix );
            position[ 2 ] = 4;
            parameters.position = position;
            parameters.orientation = Calculate.rotationToQuaternion( matrix );
        }

        function setParamFountainOrientation( particleIndex: number, parameters: SimpleJson<any> ) { //TODO: тоже самое с `any`
            const angle = pseudoRandom() * Math.PI * 2;
            const matrix1: Matrix4x4 = mat4.create( mat4.IDENTITY );
            mat4.rotateZ( matrix1, angle );
            parameters.orientation = Calculate.rotationToQuaternion( matrix1 );

        }

        function plusMinus( range: number ) {
            return (Math.random() - 0.5) * range * 2;
        }

        function plusMinusVector( range: number[] ) {
            const v = vec3.create();
            for ( let i = 0; i < range.length; i++ ) {
                v[ i ] = plusMinus( range[ i ] );
            }
            return v;
        }
    }

    /** Функция создания списка мешей
     * @method createFeatureMeshList
     * @protected
     * @param param {Object}
     * @param feature {Object} Объект карты в формате GeoJSON
     * @result {Array} Массив мешей объекта карты
     */
    _createFeatureMeshListEx( param: { meshParam: SimpleJson<Vector4D[]>, meshIndices?: number[] }, feature: Feature ) {
        const featureMeshList: FeatureMesh[] = [];
        const mesh = new Mesh();

        const uvLifeTimeAttribute = new VertexAttribute( 'uvLifeTimeFrameStart', VertexAttributeType.Float, 4 );
        uvLifeTimeAttribute.setValues( param.meshParam.pUvLifeTimeFrameStart );
        mesh.addAttribute( uvLifeTimeAttribute );

        const positionsAttribute = new VertexAttribute( 'positionStartTime', VertexAttributeType.Float, 4 );
        positionsAttribute.setValues( param.meshParam.pPositionStartTime );
        mesh.addAttribute( positionsAttribute );

        const velocityAttribute = new VertexAttribute( 'velocityStartSize', VertexAttributeType.Float, 4 );
        velocityAttribute.setValues( param.meshParam.pVelocityStartSize );
        mesh.addAttribute( velocityAttribute );

        const accelerationAttribute = new VertexAttribute( 'accelerationEndSize', VertexAttributeType.Float, 4 );
        accelerationAttribute.setValues( param.meshParam.pAccelerationEndSize );
        mesh.addAttribute( accelerationAttribute );

        const spinSpeedAttribute = new VertexAttribute( 'spinStartSpinSpeed', VertexAttributeType.Float, 4 );
        spinSpeedAttribute.setValues( param.meshParam.pSpinStartSpinSpeed );
        mesh.addAttribute( spinSpeedAttribute );

        const orientationAttribute = new VertexAttribute( 'orientationP', VertexAttributeType.Float, 4 );
        orientationAttribute.setValues( param.meshParam.pOrientationArray );
        mesh.addAttribute( orientationAttribute );

        const colorMultAttribute = new VertexAttribute( 'colorMult', VertexAttributeType.Float, 4 );
        colorMultAttribute.setValues( param.meshParam.pColorMultArray );
        mesh.addAttribute( colorMultAttribute );
        if ( param.meshIndices ) {
            const indicesAttribute = new Indices( IndicesType.uByte );
            indicesAttribute.setValues( param.meshIndices );
            indicesAttribute.validateType();
            mesh.setIndices( indicesAttribute );
        }


        const templateDescription = {
            guid: Utils.generateGUID(),
            transparent: COMMON_FLAG.DISABLED,
            smooth: COMMON_FLAG.DISABLED,
            paintFlag: PAINT_FLAG.FRONTFACE,
            transformFlag: TRANSFORM_FLAG.NONE
        };


        featureMeshList.push( {
            properties: feature.properties,
            description: templateDescription,
            mesh: mesh.toJSON()
        } );

        return featureMeshList;
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        const globeShape = heightTile.projection.getGlobeShape();
        const positionsGeoJSON = feature.getLineGeometryCoordinates();

        let featureMeshList: FeatureMesh[] = [];
        const centerPoint = heightTile.getCenter();

        let heightInPoint, geoPoint;
        if ( positionsGeoJSON[ 0 ].length === 2 ) {
            const point = Trigonometry.toRadians( positionsGeoJSON[ 0 ] );
            geoPoint = new Geodetic3D( point[ 0 ], point[ 1 ] );
            heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
            geoPoint.setHeight( heightInPoint );
        } else {
            const point = Trigonometry.toRadians( positionsGeoJSON[ 0 ] );
            geoPoint = new Geodetic3D( point[ 0 ], point[ 1 ], point[ 2 ] );
            heightInPoint = point[ 2 ];
        }

        const position = globeShape.toVector3d( geoPoint );

        let centerNormalize;
        if ( heightTile.level < 5 ) {
            centerNormalize = vec3.normalize( position, vec3.create() );
        } else {
            centerNormalize = vec3.normalize( centerPoint, vec3.create() );
        }

        const addVector = TemplateMARKINPOINT.mAddVector;
        vec3.set( vec3.ZERO, addVector );
        if ( (this.mark.vector | VECTOR_ORIENTATION3D.VM_ANYPOS) === this.mark.vector ) {
            const xyPoint = heightTile.projection.geo2xy( geoPoint );
            this.mark.addOffsetToPoint( xyPoint );
            const geoPointPos = heightTile.projection.xy2geo( xyPoint[ 0 ], xyPoint[ 1 ], geoPoint.getHeight() );
            const pointPos = globeShape.toVector3d( geoPointPos );
            vec3.sub( pointPos, position, addVector );
        }

        let vectorPoint: Vector3D | undefined = undefined;
        if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYCURCUT ) {
            if ( positionsGeoJSON.length > 1 ) {
                const ortho = (this.mark.vector | VECTOR_ORIENTATION3D.VM_VERTICAL) === this.mark.vector;

                let geoPoint;
                if ( positionsGeoJSON[ 1 ].length === 2 ) {
                    const point = Trigonometry.toRadians( positionsGeoJSON[ 1 ] );
                    geoPoint = new Geodetic3D( point[ 0 ], point[ 1 ] );
                    if ( !ortho ) {
                        heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
                        geoPoint.setHeight( heightInPoint );
                    }
                } else {
                    const point = Trigonometry.toRadians( positionsGeoJSON[ 1 ] );
                    geoPoint = new Geodetic3D( point[ 0 ], point[ 1 ], ortho ? point[ 2 ] : 0 );
                }

                const nextPosition = globeShape.toVector3d( geoPoint );
                vectorPoint = vec3.create();
                vec3.sub( nextPosition, position, vectorPoint );
                vec3.normalize( vectorPoint );
            }
        }


        const rotation = this.mark.getRotationByVector( vectorPoint, centerNormalize );

        const scale = this.mark.getAdditionalScale();


        // RTC coordinates

        vec3.sub( position, centerPoint );
        vec3.add( position, addVector );

        const instancedPosArray = [position];
        const instancedRotAxisArray = [rotation.axis];
        const instancedRotAngleArray = [rotation.angle];
        const instancedScaleArray = [scale];

        const instancedPosAttribute = new VertexAttribute( 'aVertexOffset', VertexAttributeType.Float, 3 );
        instancedPosAttribute.setValues( instancedPosArray );
        const instancedRotAxisAttribute = new VertexAttribute( 'aVertexAxis', VertexAttributeType.Float, 3 );
        instancedRotAxisAttribute.setValues( instancedRotAxisArray );
        const instancedRotAngleAttribute = new VertexAttribute( 'aVertexAngle', VertexAttributeType.Float, 1 );
        instancedRotAngleAttribute.setValues( instancedRotAngleArray );
        const instancedScaleAttribute = new VertexAttribute( 'aVertexScale', VertexAttributeType.Float, 3 );
        instancedScaleAttribute.setValues( instancedScaleArray );


        // анимированный объект
        if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_ANIMATION ) {

            const featureMeshListInstancedObjectFountain = this.mark.createMesh( feature, heightTile, level );
            for ( let kk = 0; kk < featureMeshListInstancedObjectFountain.length; kk++ ) {
                featureMeshList.push( featureMeshListInstancedObjectFountain[ kk ] );
            }
            const widthFountain = 1.5;
            const heightFountain = 20;
            const positionBlend = [0.5, 0.5, 1];
            // фонтан брызги
            const featureAnimWhite03 = JSON.parse( JSON.stringify( feature ) );
            if ( !featureAnimWhite03.properties.__service ) {
                featureAnimWhite03.properties.__service = {};
            }
            featureAnimWhite03.properties.__service.animated = true;

            const paramAnimatedFountainWhite03 = {
                numParticles: 500,
                position: positionBlend,
                lifeTime: 4,
                timeRange: 2,
                startTime: 0.3,
                startSize: 0.5,
                endSize: 0.5,
                startSizeRange: 0.01,
                endSizeRange: 0.1,
                spinSpeedRange: 1,
                colorMult: [0.61, 0.73, 0.77, 1.],
                velocity: [0, 0, heightFountain],
                velocityRange: [(widthFountain + widthFountain / 10), (widthFountain + widthFountain / 10), 1.2],
                acceleration: [0, 0, -(heightFountain / 2 + 1)],
                billboard: false,
                ripple: false
            };
            const paramFountainWhite03 = this.createAnimatedFountainParam( paramAnimatedFountainWhite03, widthFountain );
            featureAnimWhite03.properties.__service.animatedParam = paramFountainWhite03.paramSetupFountain;
            const featureMeshListFountainWhite03 = this._createFeatureMeshListEx( paramFountainWhite03, featureAnimWhite03 );
            for ( let kk = 0; kk < featureMeshListFountainWhite03.length; kk++ ) {
                featureMeshList.push( featureMeshListFountainWhite03[ kk ] );
            }

            const featureAnimWhite09 = JSON.parse( JSON.stringify( feature ) );
            if ( !featureAnimWhite09.properties.__service ) {
                featureAnimWhite09.properties.__service = {};
            }
            featureAnimWhite09.properties.__service.animated = true;

            const paramAnimatedFountainWhite09 = {
                numParticles: 500,
                position: positionBlend,
                lifeTime: 4,
                timeRange: 2,
                startTime: 0.9,
                startSize: 0.5,
                endSize: 0.5,
                startSizeRange: 0.01,
                endSizeRange: 0.1,
                spinSpeedRange: 1,
                colorMult: [0.61, 0.73, 0.77, 1.],
                velocity: [0, 0, heightFountain],
                velocityRange: [(widthFountain + widthFountain / 10), (widthFountain + widthFountain / 10), 1.2],
                acceleration: [0, 0, -(heightFountain / 2 + 1)],
                billboard: false,
                ripple: false
            };
            const paramFountainWhite09 = this.createAnimatedFountainParam( paramAnimatedFountainWhite09, widthFountain );
            featureAnimWhite09.properties.__service.animatedParam = paramFountainWhite09.paramSetupFountain;
            const featureMeshListFountainWhite09 = this._createFeatureMeshListEx( paramFountainWhite09, featureAnimWhite09 );
            for ( let kk = 0; kk < featureMeshListFountainWhite09.length; kk++ ) {
                featureMeshList.push( featureMeshListFountainWhite09[ kk ] );
            }


            const featureAnimFountainWhite15 = JSON.parse( JSON.stringify( feature ) );
            if ( !featureAnimFountainWhite15.properties.__service ) {
                featureAnimFountainWhite15.properties.__service = {};
            }
            featureAnimFountainWhite15.properties.__service.animated = true;

            const paramAnimatedFountainWhite15 = {
                numParticles: 500,
                position: positionBlend,
                lifeTime: 4,
                timeRange: 2,
                startTime: 1.5,
                startSize: 0.5,
                endSize: 0.3,
                startSizeRange: 0.01,
                endSizeRange: 0.1,
                spinSpeedRange: 1,
                colorMult: [0.61, 0.73, 0.77, 1.],
                velocity: [0, 0, heightFountain],
                velocityRange: [(widthFountain + widthFountain / 10), (widthFountain + widthFountain / 10), 1.2],
                acceleration: [0, 0, -(heightFountain / 2 + 1)],
                billboard: false,
                ripple: false
            };
            const paramFountainWhite15 = this.createAnimatedFountainParam( paramAnimatedFountainWhite15, widthFountain );
            featureAnimFountainWhite15.properties.__service.animatedParam = paramFountainWhite15.paramSetupFountain;
            const featureMeshListWhite15 = this._createFeatureMeshListEx( paramFountainWhite15, featureAnimFountainWhite15 );
            for ( let kk = 0; kk < featureMeshListWhite15.length; kk++ ) {
                featureMeshList.push( featureMeshListWhite15[ kk ] );
            }


            const featureAnim = JSON.parse( JSON.stringify( feature ) );
            if ( !featureAnim.properties.__service ) {
                featureAnim.properties.__service = {};
            }
            featureAnim.properties.__service.animated = true;

            const paramAnimatedFountain = {
                numParticles: 3000,
                position: positionBlend,
                lifeTime: 5,
                timeRange: 2,
                startSize: 0.5,
                endSize: 0.5,
                startSizeRange: 0.01,
                endSizeRange: 0.1,
                spinSpeedRange: 1,
                colorMult: [0.22745, 0.545, 0.6509, 1.],
                velocity: [0, 0, heightFountain],
                velocityRange: [widthFountain, widthFountain, 0.2],
                acceleration: [0, 0, -(heightFountain / 2)],
                billboard: false,
                ripple: false
            };
            const param = this.createAnimatedFountainParam( paramAnimatedFountain, widthFountain );
            featureAnim.properties.__service.animatedParam = param.paramSetupFountain;
            const featureMeshList2 = this._createFeatureMeshListEx( param, featureAnim );
            for ( let kk = 0; kk < featureMeshList2.length; kk++ ) {
                featureMeshList.push( featureMeshList2[ kk ] );
            }


            const featureAnimLightDrops = JSON.parse( JSON.stringify( feature ) );
            if ( !featureAnimLightDrops.properties.__service ) {
                featureAnimLightDrops.properties.__service = {};
            }
            featureAnimLightDrops.properties.__service.animated = true;

            const paramAnimatedFountainLightDrops = {
                numParticles: 2000,
                position: positionBlend,
                lifeTime: 5,
                timeRange: 2,
                startSize: 0.5,
                endSize: 0.5,
                startSizeRange: 0.01,
                endSizeRange: 0.1,
                spinSpeedRange: 1,
                colorMult: [0.61, 0.73, 0.77, 1.],
                velocity: [0, 0, heightFountain],
                velocityRange: [widthFountain, widthFountain, 0.2],
                acceleration: [0, 0, -(heightFountain / 2)],
                billboard: false,
                ripple: false
            };
            const paramFountainLightDrops = this.createAnimatedFountainParam( paramAnimatedFountainLightDrops, widthFountain );
            featureAnimLightDrops.properties.__service.animatedParam = paramFountainLightDrops.paramSetupFountain;
            const featureMeshListLightDrops = this._createFeatureMeshListEx( paramFountainLightDrops, featureAnimLightDrops );
            for ( let kk = 0; kk < featureMeshListLightDrops.length; kk++ ) {
                featureMeshList.push( featureMeshListLightDrops[ kk ] );
            }


        } else {
            featureMeshList = this.mark.createMesh( feature, heightTile, level );
        }

        const meshInstanced = new Mesh();
        meshInstanced.setPrimitiveType( PrimitiveType.Triangles );
        meshInstanced.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
        meshInstanced.addAttribute( instancedPosAttribute );
        meshInstanced.addAttribute( instancedRotAxisAttribute );
        meshInstanced.addAttribute( instancedRotAngleAttribute );
        meshInstanced.addAttribute( instancedScaleAttribute );

        if ( featureMeshList ) {
            for ( let j = 0; j < featureMeshList.length; j++ ) {
                const featureMesh = featureMeshList[ j ];
                featureMesh.meshInstanced = meshInstanced.toJSON();
            }
        }
        return featureMeshList;

    }

    /**
     * Функция получения относительной высоты части объекта
     * @method getRelativeHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {Number} Относительная высота
     */
    getRelativeHeight( objectProperties: FeatureProperties, level: number ) {
        return this.mark.getRelativeHeight( objectProperties, level );
    }

    /** Функция получения высоты части объекта
     * @method getHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение высоты
     */
    getHeight( objectProperties: FeatureProperties ) {
        return this.mark.getHeight( objectProperties );
    }
}

/**
 * Класс шаблона знака по линии
 * @class TemplateMARKBYLINE
 * @constructor TemplateMARKBYLINE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateMARKBYLINE extends TemplateEMPTY {

    private readonly distance: FUNCTION3DMARKBYLINE['FUNCTIONPARAMS']['Distance'];
    private readonly mark: TemplateMARK;
    private static mPosition = vec3.create();
    private static mCurPosition = vec3.create();
    private static mAddVector = vec3.create();

    constructor( func: FUNCTION3DMARKBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        this.distance = func.FUNCTIONPARAMS.Distance;
        this.mark = new TemplateMARK( func.FUNCTIONPARAMS.Mark, mainObject );
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {


        const globeShape = heightTile.projection.getGlobeShape();
        const positionsGeoJSON = feature.getLineGeometryCoordinates();

        const centerPoint = heightTile.getCenter();
        const centerNormalize = vec3.normalize( centerPoint, vec3.create() );

        const vectorList: Vector3D[] = [];

        const point = Trigonometry.toRadians( vec2.fromPoint( positionsGeoJSON[ 0 ] ) );
        const geoPoint = TemplateEMPTY.mGeoPoint;
        geoPoint.setLongitude( point[ 0 ] );
        geoPoint.setLatitude( point[ 1 ] );
        const heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
        geoPoint.setHeight( heightInPoint );

        const curPosition = globeShape.toVector3d( geoPoint, TemplateMARKBYLINE.mCurPosition );
        const startPosition = vec3.create( curPosition );

        for ( let i = 1; i < positionsGeoJSON.length; i++ ) {
            const point = positionsGeoJSON[ i ];
            geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
            geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
            const heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
            geoPoint.setHeight( heightInPoint );

            const position = globeShape.toVector3d( geoPoint, TemplateMARKBYLINE.mPosition );

            const curVector = vec3.sub( position, curPosition, vec3.create() );
            vectorList.push( curVector );

            vec3.set( position, curPosition );
        }

        const instancedPosArray: Vector3D[] = [];
        const instancedRotAxisArray: Vector3D[] = [];
        const instancedRotAngleArray: number[] = [];
        const instancedScaleArray: Vector3D[] = [];


        const markPlaces: Vector3D[] = [startPosition];
        const distanceValue = this.getDistance( feature.properties );

        let curDistance = distanceValue;
        const curPartVector = vec3.create();
        const curDirection = vec3.create();
        for ( let i = 0; i < vectorList.length; i++ ) {
            const curVector = vectorList[ i ];
            let length = vec3.len( curVector );
            vec3.normalize( curVector, curDirection );
            length -= curDistance;
            while ( length > 0 ) {
                const prevPosition = markPlaces[ markPlaces.length - 1 ];

                const position = vec3.add( prevPosition, vec3.scale( curDirection, curDistance, curPartVector ), vec3.create() );

                globeShape.toGeodetic3d( position, geoPoint );

                const addVector = TemplateMARKBYLINE.mAddVector;
                vec3.set( vec3.ZERO, addVector );
                if ( (this.mark.vector | VECTOR_ORIENTATION3D.VM_ANYPOS) === this.mark.vector ) {
                    const xyPoint = heightTile.projection.geo2xy( geoPoint );
                    this.mark.addOffsetToPoint( xyPoint );
                    const geoPointPos = heightTile.projection.xy2geo( xyPoint[ 0 ], xyPoint[ 1 ], geoPoint.getHeight() );
                    const pointPos = globeShape.toVector3d( geoPointPos );
                    vec3.sub( pointPos, position, addVector );
                }


                const rotation = this.mark.getRotationByVector( curDirection, centerNormalize );

                const scale = this.mark.getAdditionalScale();

                // RTC coordinates
                markPlaces.push( vec3.create( position ) );

                vec3.sub( position, centerPoint );
                vec3.add( position, addVector );

                instancedPosArray.push( position );
                instancedRotAxisArray.push( rotation.axis );
                instancedRotAngleArray.push( rotation.angle );
                instancedScaleArray.push( scale );

                length -= curDistance;
                curDistance = distanceValue;
            }
            length += curDistance;
            curDistance -= length;
        }


        const instancedPosAttribute = new VertexAttribute( 'aVertexOffset', VertexAttributeType.Float, 3 );
        instancedPosAttribute.setValues( instancedPosArray );
        const instancedRotAxisAttribute = new VertexAttribute( 'aVertexAxis', VertexAttributeType.Float, 3 );
        instancedRotAxisAttribute.setValues( instancedRotAxisArray );
        const instancedRotAngleAttribute = new VertexAttribute( 'aVertexAngle', VertexAttributeType.Float, 1 );
        instancedRotAngleAttribute.setValues( instancedRotAngleArray );
        const instancedScaleAttribute = new VertexAttribute( 'aVertexScale', VertexAttributeType.Float, 3 );
        instancedScaleAttribute.setValues( instancedScaleArray );

        const featureMeshList = this.mark.createMesh( feature, heightTile, level );

        const meshInstanced = new Mesh();
        meshInstanced.setPrimitiveType( PrimitiveType.Triangles );
        meshInstanced.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
        meshInstanced.addAttribute( instancedPosAttribute );
        meshInstanced.addAttribute( instancedRotAxisAttribute );
        meshInstanced.addAttribute( instancedRotAngleAttribute );
        meshInstanced.addAttribute( instancedScaleAttribute );

        if ( featureMeshList ) {
            for ( let j = 0; j < featureMeshList.length; j++ ) {
                const featureMesh = featureMeshList[ j ];
                featureMesh.meshInstanced = meshInstanced.toJSON();
            }
        }

        return featureMeshList;

    }


    /** Функция получения расстояния по линии между знаками
     * @method getDistance
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} Расстояние по линии между знаками
     */
    getDistance( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.distance, objectProperties );
    }


    /**
     * Функция получения относительной высоты части объекта
     * @method getRelativeHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {Number} Относительная высота
     */
    getRelativeHeight( objectProperties: FeatureProperties, level: number ) {
        return this.mark.getRelativeHeight( objectProperties, level );
    }


    /** Функция получения высоты части объекта
     * @method getHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение высоты
     */
    getHeight( objectProperties: FeatureProperties ) {
        return this.mark.getHeight( objectProperties );
    }
}

/**
 * Класс шаблона знака по точкам
 * @class TemplateMARKBYPOINT
 * @constructor TemplateMARKBYPOINT
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateMARKBYPOINT extends TemplateEMPTY {
    private readonly mark: TemplateMARK;
    private static mPosition = vec3.create();
    private static mNextPosition = vec3.create();
    private static mPrevPosition = vec3.create();
    private static mAddVector = vec3.create();

    constructor( func: FUNCTION3DMARKBYPOINT, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        this.mark = new TemplateMARK( func.FUNCTIONPARAMS.Mark, mainObject );
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {


        const globeShape = heightTile.projection.getGlobeShape();
        let positionsGeoJSON = feature.getLineGeometryCoordinates();

        this.mPositions.length = 0;
        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );

        // Pipeline Stage 1b:  Clean up - Swap winding order
        //this.mCleanedPositions.length=0;
        // const cleanPositions = PolygonAlgorithms.cleanup(normalizedPositions,this.mCleanedPositions);
        // закомментировал, чтобы лишнее не удалить

        const plane = new EllipsoidTangentPlane( globeShape, normalizedPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( normalizedPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            const reversedList: typeof positionsGeoJSON = [];
            for ( let i = positionsGeoJSON.length - 1; i >= 0; i-- ) {
                reversedList.push( positionsGeoJSON[ i ] );
            }
            positionsGeoJSON = reversedList;
        }


        // RTC coordinates
        const centerPoint = heightTile.getCenter();
        const centerNormalize = vec3.normalize( centerPoint, vec3.create() );

        const instancedPosArray: Vector3D[] = [];
        const instancedRotAxisArray: Vector3D[] = [];
        const instancedRotAngleArray: number[] = [];
        const instancedScaleArray: Vector3D[] = [];
        const geoPoint = TemplateEMPTY.mGeoPoint;
        for ( let i = 0; i < positionsGeoJSON.length; i++ ) {
            let vectorPoint;
            const point = positionsGeoJSON[ i ];
            geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
            geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
            const heightInPoint = heightTile.getHeightInPointInterpolated( geoPoint );
            geoPoint.setHeight( heightInPoint );
            const position = globeShape.toVector3d( geoPoint );

            const addVector = TemplateMARKBYPOINT.mAddVector;
            vec3.set( vec3.ZERO, addVector );
            if ( (this.mark.vector | VECTOR_ORIENTATION3D.VM_ANYPOS) === this.mark.vector ) {
                const xyPoint = heightTile.projection.geo2xy( geoPoint );
                this.mark.addOffsetToPoint( xyPoint );
                const geoPointPos = heightTile.projection.xy2geo( xyPoint[ 0 ], xyPoint[ 1 ], geoPoint.getHeight() );
                const pointPos = globeShape.toVector3d( geoPointPos );
                vec3.sub( pointPos, position, addVector );
            }


            if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYCURCUT && (i + 1 < positionsGeoJSON.length) ) {
                const point = positionsGeoJSON[ i + 1 ];
                geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
                geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
                const nextPosition = globeShape.toVector3d( geoPoint, TemplateMARKBYPOINT.mNextPosition );

                vectorPoint = vec3.normalize( vec3.sub( nextPosition, position, TemplateMARKBYPOINT.mPosition ) );
            } else if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYLASTCUT && (i > 0) ) {
                const point = positionsGeoJSON[ i - 1 ];
                geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
                geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
                const prevPosition = globeShape.toVector3d( geoPoint, TemplateMARKBYPOINT.mPrevPosition );

                vectorPoint = vec3.normalize( vec3.sub( position, prevPosition, TemplateMARKBYPOINT.mPosition ) );
            } else if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYANGLE ) {
                let prevVector, nextVector;
                if ( i > 0 ) {
                    const point = positionsGeoJSON[ i - 1 ];
                    geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
                    geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
                    const prevPosition = globeShape.toVector3d( geoPoint, TemplateMARKBYPOINT.mPrevPosition );
                    prevVector = vec3.normalize( vec3.sub( position, prevPosition, TemplateMARKBYPOINT.mPrevPosition ) );
                }

                if ( (i + 1) < positionsGeoJSON.length ) {
                    const point = positionsGeoJSON[ i + 1 ];
                    geoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
                    geoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );

                    const nextPosition = globeShape.toVector3d( geoPoint, TemplateMARKBYPOINT.mNextPosition );
                    nextVector = vec3.normalize( vec3.sub( nextPosition, position, TemplateMARKBYPOINT.mNextPosition ) );
                }

                if ( prevVector && nextVector ) {

                    const delta = vec3.sub( prevVector, nextVector, TemplateMARKBYPOINT.mPosition );
                    // иначе ось поворота определяется криво
                    if ( vec3.len( delta ) < 0.001 ) {
                        vectorPoint = vec3.normalize( vec3.rotateAroundAxis( prevVector, centerNormalize, Math.PI * 0.5, TemplateMARKBYPOINT.mPosition ) );
                    } else {
                        vectorPoint = vec3.normalize( vec3.sub( prevVector, nextVector, TemplateMARKBYPOINT.mPosition ) );
                    }
                } else if ( prevVector ) {
                    vectorPoint = vec3.normalize( vec3.rotateAroundAxis( prevVector, centerNormalize, Math.PI * 0.5, TemplateMARKBYPOINT.mPosition ) );
                } else if ( nextVector ) {
                    vectorPoint = vec3.normalize( vec3.rotateAroundAxis( nextVector, centerNormalize, Math.PI * 0.5, TemplateMARKBYPOINT.mPosition ) );
                }

            }


            const rotation = this.mark.getRotationByVector( vectorPoint, centerNormalize );
            const scale = this.mark.getAdditionalScale();

            // RTC coordinates
            vec3.sub( position, centerPoint );
            vec3.add( position, addVector );

            instancedPosArray.push( position );
            instancedRotAxisArray.push( rotation.axis );
            instancedRotAngleArray.push( rotation.angle );
            instancedScaleArray.push( scale );

        }

        const instancedPosAttribute = new VertexAttribute( 'aVertexOffset', VertexAttributeType.Float, 3 );
        instancedPosAttribute.setValues( instancedPosArray );
        const instancedRotAxisAttribute = new VertexAttribute( 'aVertexAxis', VertexAttributeType.Float, 3 );
        instancedRotAxisAttribute.setValues( instancedRotAxisArray );
        const instancedRotAngleAttribute = new VertexAttribute( 'aVertexAngle', VertexAttributeType.Float, 1 );
        instancedRotAngleAttribute.setValues( instancedRotAngleArray );
        const instancedScaleAttribute = new VertexAttribute( 'aVertexScale', VertexAttributeType.Float, 3 );
        instancedScaleAttribute.setValues( instancedScaleArray );

        const featureMeshList = this.mark.createMesh( feature, heightTile, level );

        const meshInstanced = new Mesh();
        meshInstanced.setPrimitiveType( PrimitiveType.Triangles );
        meshInstanced.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
        meshInstanced.addAttribute( instancedPosAttribute );
        meshInstanced.addAttribute( instancedRotAxisAttribute );
        meshInstanced.addAttribute( instancedRotAngleAttribute );
        meshInstanced.addAttribute( instancedScaleAttribute );

        if ( featureMeshList ) {
            for ( let j = 0; j < featureMeshList.length; j++ ) {
                const featureMesh = featureMeshList[ j ];
                featureMesh.meshInstanced = meshInstanced.toJSON();
            }
        }
        return featureMeshList;

    }


    /**
     * Функция получения относительной высоты части объекта
     * @method getRelativeHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {Number} Относительная высота
     */
    getRelativeHeight( objectProperties: FeatureProperties, level: number ) {
        return this.mark.getRelativeHeight( objectProperties, level );
    }


    /** Функция получения высоты части объекта
     * @method getHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение высоты
     */
    getHeight( objectProperties: FeatureProperties ) {
        return this.mark.getHeight( objectProperties );
    }

}

/**
 * Класс шаблона знака по площади
 * @class TemplateMARKBYSQUARE
 * @constructor TemplateMARKBYSQUARE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateMARKBYSQUARE extends TemplateEMPTY {
    private readonly distanceX: FUNCTION3DMARKBYSQUARE['FUNCTIONPARAMS']['DistanceX'];
    private readonly distanceZ: FUNCTION3DMARKBYSQUARE['FUNCTIONPARAMS']['DistanceZ'];
    private readonly mark: TemplateMARK;
    private static mList: (Vector3D | Geodetic3D)[] = [];
    private static markDir = vec3.create();
    private static markDirX = vec2.create();
    private static markDirY = vec2.create();
    private static mAddVector = vec3.create();

    constructor( func: FUNCTION3DMARKBYSQUARE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        this.distanceX = func.FUNCTIONPARAMS.DistanceX;
        this.distanceZ = func.FUNCTIONPARAMS.DistanceZ;
        this.mark = new TemplateMARK( func.FUNCTIONPARAMS.Mark, mainObject );
    }


    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        const projection = heightTile.projection;
        const globeShape = projection.getGlobeShape();

        this.mPositions.length = 0;
        TemplateEMPTY.mGeoPoint.setHeight( 0 );
        const distanceXValue = this.getDistanceX( feature.properties );
        const distanceYValue = this.getDistanceZ( feature.properties );

        const instancedPosArray: Vector3D[] = [];
        const instancedRotAxisArray: Vector3D[] = [];
        const instancedRotAngleArray: number[] = [];
        const instancedScaleArray: Vector3D[] = [];

        const centerPoint = heightTile.getCenter();
        const centerNormalize = vec3.normalize( centerPoint, vec3.create() );
        const centerPointGeo = globeShape.toGeodetic3d( centerPoint, TemplateEMPTY.mGeoPoint );
        const kMercator = 1 / Math.cos( centerPointGeo.getLatitude() );

        let positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        this.mCleanedPositions.length = 0;
        const cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            TemplateMARKBYSQUARE.mList.length = 0;
            for ( let i = positionsGeoJSON.length - 1; i >= 0; i-- ) {
                TemplateMARKBYSQUARE.mList.push( positionsGeoJSON[ i ] );
            }
            const curList = positionsGeoJSON;
            positionsGeoJSON = TemplateMARKBYSQUARE.mList as Vector3D[];
            TemplateMARKBYSQUARE.mList = curList;
        }
        TemplateMARKBYSQUARE.mList.length = 0;

        const positionsGeodetic = TemplateMARKBYSQUARE.mList as Geodetic3D[];
        for ( let i = positionsGeoJSON.length - 1; i >= 0; i-- ) {
            const point = positionsGeoJSON[ i ];
            TemplateEMPTY.mGeoPoint.setLongitude( Trigonometry.toRadians( point[ 0 ] ) );
            TemplateEMPTY.mGeoPoint.setLatitude( Trigonometry.toRadians( point[ 1 ] ) );
            // heightInPoint = heightTile.getHeightInPointInterpolated(this.mGeoPoint);
            // this.mGeoPoint.setHeight(heightInPoint);
            positionsGeodetic.push( TemplateEMPTY.mGeoPoint.copy() );
        }


        let markDir = vec3.UNITX;
        let markDirX = vec2.UNITX;
        let alpha = 0;
        if ( (this.mark.vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYLARGSIDE ) {
            markDir = TemplateMARKBYSQUARE.markDir;
            markDirX = TemplateMARKBYSQUARE.markDirX;
            let maxLen = 0;
            const curVec = vec3.create();
            let maxInd = 0;
            const curPoint = vec3.create();
            const nextPoint = vec3.create();
            for ( let i = 0; i < positionsGeodetic.length - 1; i++ ) {
                globeShape.toVector3d( positionsGeodetic[ i ], curPoint );
                globeShape.toVector3d( positionsGeodetic[ i + 1 ], nextPoint );
                vec3.sub( nextPoint, curPoint, curVec );
                const curLen = vec3.len( curVec );
                if ( curLen > maxLen ) {
                    vec3.normalize( curVec, markDir );
                    maxLen = curLen;
                    maxInd = i;
                }
            }

            const markVectorStart = projection.geo2xy( positionsGeodetic[ maxInd ] );
            const markVectorEnd = projection.geo2xy( positionsGeodetic[ maxInd + 1 ] );
            vec2.fromVector3( markVectorEnd, markDirX );
            vec2.normalize( vec2.sub( markDirX, [markVectorStart[ 0 ], markVectorStart[ 1 ]] ) );
            alpha = Math.acos( vec2.dot( markDirX, vec2.UNITX ) );
        }

        const markDirY = vec2.rotate( markDirX, Math.PI * 0.5, TemplateMARKBYSQUARE.markDirY );


        const positionsYX: Vector3D[] = [];


        const posXY = vec2.create();

        const posYX = projection.geo2xy( positionsGeodetic[ 0 ] );
        positionsYX.push( posYX );

        posXY[ 0 ] = posYX[ 1 ];
        posXY[ 1 ] = posYX[ 0 ];
        const bbox = {
            minimumX: vec2.dot( posXY, markDirX ),
            minimumY: vec2.dot( posXY, markDirY ),

            maximumX: vec2.dot( posXY, markDirX ),
            maximumY: vec2.dot( posXY, markDirY )
        };
        positionsYX[ 0 ][ 0 ] = bbox.minimumY;
        positionsYX[ 0 ][ 1 ] = bbox.minimumX;

        for ( let i = 1; i < positionsGeodetic.length; i++ ) {
            const posYX = projection.geo2xy( positionsGeodetic[ i ] );
            positionsYX.push( posYX );

            posXY[ 0 ] = posYX[ 1 ];
            posXY[ 1 ] = posYX[ 0 ];

            const curValueX = vec2.dot( posXY, markDirX );

            if ( curValueX < bbox.minimumX ) {
                bbox.minimumX = curValueX;
            }
            if ( curValueX > bbox.maximumX ) {
                bbox.maximumX = curValueX;
            }

            const curValueY = vec2.dot( posXY, markDirY );

            if ( curValueY < bbox.minimumY ) {
                bbox.minimumY = curValueY;
            }
            if ( curValueY > bbox.maximumY ) {
                bbox.maximumY = curValueY;
            }
            posYX[ 1 ] = curValueX;
            posYX[ 0 ] = curValueY;
        }

        const distanceYmin = distanceYValue * 0.25;
        const distanceXmin = distanceXValue * 0.25;

        const offsetTopRightYX: Vector2D = [vec2.dot( vec2.scale( markDirY, distanceYmin, vec2.create() ), vec2.UNITY ), vec2.dot( vec2.scale( markDirX, distanceXmin, vec2.create() ), vec2.UNITX )];
        const offsetBottomRightYX: Vector2D = [vec2.dot( vec2.scale( markDirY, -distanceYmin, vec2.create() ), vec2.UNITY ), vec2.dot( vec2.scale( markDirX, distanceXmin, vec2.create() ), vec2.UNITX )];
        const offsetBottomLeftYX: Vector2D = [vec2.dot( vec2.scale( markDirY, -distanceYmin, vec2.create() ), vec2.UNITY ), vec2.dot( vec2.scale( markDirX, -distanceXmin, vec2.create() ), vec2.UNITX )];
        const offsetTopLeftYX: Vector2D = [vec2.dot( vec2.scale( markDirY, distanceYmin, vec2.create() ), vec2.UNITY ), vec2.dot( vec2.scale( markDirX, -distanceXmin, vec2.create() ), vec2.UNITX )];


        const startYX: Vector2D = [bbox.minimumY, bbox.minimumX];


        let curDirX = distanceXValue * 0.5;


        const curAdd = vec2.create();
        const curDirXVector = vec2.create();
        const curDirYVector = vec2.create();
        const curPositionYX = vec2.create();
        const curOffsetPositionYX = vec2.create();

        const maxDirXValue = (bbox.maximumX - bbox.minimumX) + distanceXValue * 0.5;
        const maxDirYValue = (bbox.maximumY - bbox.minimumY) + distanceYValue * 0.5;

        const curAddYX = vec2.create();
        while ( curDirX < maxDirXValue ) {
            vec2.scale( markDirX, curDirX, curDirXVector );
            curDirXVector[ 1 ] = vec2.dot( curDirXVector, vec2.UNITY ) * kMercator;
            curDirX += distanceXValue;
            let curDirY = distanceYValue * 0.5;
            while ( curDirY < maxDirYValue ) {

                vec2.scale( markDirY, curDirY, curDirYVector );
                curDirYVector[ 1 ] = vec2.dot( curDirYVector, vec2.UNITY ) * kMercator;
                curDirY += distanceYValue;
                vec2.add( curDirXVector, curDirYVector, curAdd );
                curAddYX[ 0 ] = curAdd[ 1 ];
                curAddYX[ 1 ] = curAdd[ 0 ];

                vec2.add( startYX, curAddYX, curPositionYX );

                vec2.add( curPositionYX, offsetTopRightYX, curOffsetPositionYX );
                if ( !PolygonAlgorithms.inPoly( positionsYX, curOffsetPositionYX ) ) {
                    continue;
                }
                vec2.add( curPositionYX, offsetBottomRightYX, curOffsetPositionYX );
                if ( !PolygonAlgorithms.inPoly( positionsYX, curOffsetPositionYX ) ) {
                    continue;
                }
                vec2.add( curPositionYX, offsetBottomLeftYX, curOffsetPositionYX );
                if ( !PolygonAlgorithms.inPoly( positionsYX, curOffsetPositionYX ) ) {
                    continue;
                }

                vec2.add( curPositionYX, offsetTopLeftYX, curOffsetPositionYX );
                if ( !PolygonAlgorithms.inPoly( positionsYX, curOffsetPositionYX ) ) {
                    continue;
                }

                const positionYX = vec2.rotate( curPositionYX, -alpha, vec2.create() );

                const position = globeShape.toVector3d( projection.xy2geo( positionYX[ 0 ], positionYX[ 1 ] ) );

                const addVector = TemplateMARKBYSQUARE.mAddVector;
                vec3.set( vec3.ZERO, addVector );
                if ( (this.mark.vector | VECTOR_ORIENTATION3D.VM_ANYPOS) === this.mark.vector ) {
                    const xyPoint = curOffsetPositionYX;
                    this.mark.addOffsetToPoint( xyPoint );
                    const geoPointPos = heightTile.projection.xy2geo( xyPoint[ 0 ], xyPoint[ 1 ] );
                    const pointPos = globeShape.toVector3d( geoPointPos );
                    vec3.sub( pointPos, position, addVector );
                }


                const rotation = this.mark.getRotationByVector( markDir, centerNormalize );

                const scale = this.mark.getAdditionalScale();


                // RTC coordinates

                TemplateEMPTY.mGeoPoint = globeShape.toGeodetic3d( position, TemplateEMPTY.mGeoPoint );
                const heightInPoint = heightTile.getHeightInPointInterpolated( TemplateEMPTY.mGeoPoint );
                TemplateEMPTY.mGeoPoint.setHeight( heightInPoint );

                globeShape.toVector3d( TemplateEMPTY.mGeoPoint, position );

                vec3.sub( position, centerPoint );
                vec3.add( position, addVector );

                instancedPosArray.push( position );
                instancedRotAxisArray.push( rotation.axis );
                instancedRotAngleArray.push( rotation.angle );
                instancedScaleArray.push( scale );
            }
        }

        // add minimum 1 point
        // if(instancedPosArray.length==0){
        //
        //     vec2.scale(markDirX, distanceXValue * 0.5, curDirXVector);
        //     curDirXVector[1] = vec2.dot(curDirXVector, vec2.UNITY) * kMercator;
        //         vec2.scale(markDirY, distanceYValue * 0.5, curDirYVector);
        //         curDirYVector[1] = vec2.dot(curDirYVector, vec2.UNITY) * kMercator;
        //         vec2.add(curDirXVector, curDirYVector, curAdd);
        //         curAddYX[0] = curAdd[1];
        //         curAddYX[1] = curAdd[0];
        //
        //         vec2.add(startYX, curAddYX, curPositionYX);
        //
        //
        //         positionYX = vec3.rotateZ(curPositionYX, -alpha, []);
        //
        //
        //         position = globeShape.toVector3d(projection.xy2geo(positionYX[0], positionYX[1], curPositionYX[2]));
        //
        //
        //         addVector = vec3.ZERO;
        //         if ((this.mark.vector | VECTOR_ORIENTATION3D.VM_ANYPOS) === this.mark.vector) {
        //             xyPoint = curOffsetPositionYX;
        //             this.mark.addOffsetToPoint(xyPoint);
        //             geoPointPos = heightTile.projection.xy2geo(xyPoint[0], xyPoint[1]);
        //             pointPos = globeShape.toVector3d(geoPointPos);
        //             addVector = vec3.sub(pointPos, position, this.mAddVector);
        //         }
        //
        //
        //         rotation = this.mark.getRotationByVector(markDir, centerNormalize);
        //
        //         scale = this.mark.getAdditionalScale();
        //
        //
        //         // RTC coordinates
        //
        //         this.mGeoPoint = globeShape.toGeodetic3d(position, this.mGeoPoint);
        //         heightInPoint = heightTile.getHeightInPointInterpolated(this.mGeoPoint);
        //         this.mGeoPoint.setHeight(heightInPoint);
        //
        //         position = globeShape.toVector3d(this.mGeoPoint, position);
        //
        //         vec3.sub(position, centerPoint);
        //         vec3.add(position, addVector);
        //
        //         instancedPosArray.push(position);
        //         instancedRotAxisArray.push(rotation.axis);
        //         instancedRotAngleArray.push(rotation.angle);
        //         instancedScaleArray.push(scale);
        // }
        let featureMeshList: FeatureMesh[] = [];
        if ( instancedPosArray.length > 0 ) {

            const instancedPosAttribute = new VertexAttribute( 'aVertexOffset', VertexAttributeType.Float, 3 );
            instancedPosAttribute.setValues( instancedPosArray );
            const instancedRotAxisAttribute = new VertexAttribute( 'aVertexAxis', VertexAttributeType.Float, 3 );
            instancedRotAxisAttribute.setValues( instancedRotAxisArray );
            const instancedRotAngleAttribute = new VertexAttribute( 'aVertexAngle', VertexAttributeType.Float, 1 );
            instancedRotAngleAttribute.setValues( instancedRotAngleArray );
            const instancedScaleAttribute = new VertexAttribute( 'aVertexScale', VertexAttributeType.Float, 3 );
            instancedScaleAttribute.setValues( instancedScaleArray );

            featureMeshList = this.mark.createMesh( feature, heightTile, level );

            const meshInstanced = new Mesh();
            meshInstanced.setPrimitiveType( PrimitiveType.Triangles );
            meshInstanced.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
            meshInstanced.addAttribute( instancedPosAttribute );
            meshInstanced.addAttribute( instancedRotAxisAttribute );
            meshInstanced.addAttribute( instancedRotAngleAttribute );
            meshInstanced.addAttribute( instancedScaleAttribute );

            for ( let j = 0; j < featureMeshList.length; j++ ) {
                const featureMesh = featureMeshList[ j ];
                featureMesh.meshInstanced = meshInstanced.toJSON();
                // featureMeshList[j].mesh = this.createUninstancedMesh(featureMeshList[j].mesh, meshInstanced, centerNormalize);
            }
        }
        return featureMeshList;

    }

    // TemplateMARKBYSQUARE.prototype.createUninstancedMesh(mesh, instancedMesh, centerNormalize) {
    //
    //     const positionAttributeValues = [];
    //     const indicesAttributeValues = [];
    //     const textureAttrValues = [];
    //     const colorAttrValues = [];
    //     const materialAttrValues = [];
    //
    //
    //     const positions = mesh.attributes['aVertexPosition'].getValues();
    //     const textureValues = mesh.attributes['aVertexTextureCoords'] ? mesh.attributes['aVertexTextureCoords'].getValues() : null;
    //     const colorValues = mesh.attributes['aVertexColor'] ? mesh.attributes['aVertexColor'].getValues() : null;
    //     const materials = mesh.attributes['aVertexMaterial'] ? mesh.attributes['aVertexMaterial'].getValues() : null;
    //     const indices = mesh.indices.getValues();
    //
    //     const offsetPositions = instancedMesh.getAttributes()['aVertexOffset'].getValues();
    //     const scalePositions = instancedMesh.getAttributes()['aVertexScale'].getValues();
    //     const axisPositions = instancedMesh.getAttributes()['aVertexAxis'].getValues();
    //     const anglePositions = instancedMesh.getAttributes()['aVertexAngle'].getValues();
    //
    //     // const count=Math.min(30,offsetPositions.length);
    //
    //     for (const i = 0; i < offsetPositions.length; i++) {
    //         const vertexScale = scalePositions[i];
    //         const axis = axisPositions[i];
    //         const angle = anglePositions[i];
    //         const vertexOffset = offsetPositions[i];
    //         for (const j = 0; j < positions.length; j++) {
    //             const newPosition = [];
    //             const position = positions[j];
    //             const index = indices[j] + i * positions.length;
    //
    //
    //             newPosition[0] = position[0] * vertexScale[0];
    //             newPosition[1] = position[1] * vertexScale[1];
    //             newPosition[2] = position[2] * vertexScale[2];
    //             // newPosition[3] = position[3];
    //             vec3.rotateAroundAxis(newPosition, axis, angle);
    //             vec3.add(newPosition, vertexOffset);
    //             if (position[3]) {
    //                 vec3.scaleAndAdd(newPosition, centerNormalize, position[3], newPosition);
    //             }
    //             positionAttributeValues.push(newPosition);
    //             indicesAttributeValues.push(index);
    //
    //
    //             if (textureValues) {
    //                 textureAttrValues.push(textureValues[j]);
    //             }
    //
    //             if (colorValues) {
    //                 colorAttrValues.push(colorValues[j]);
    //             }
    //             if (materials) {
    //                 materialAttrValues.push(materials[j]);
    //             }
    //         }
    //     }
    //
    //     mesh.attributes['aVertexPosition'].setValues(positionAttributeValues);
    //     mesh.attributes['aVertexNormal'].setValues(this._createNormals(indicesAttributeValues, positionAttributeValues));
    //     if (textureValues) {
    //         mesh.attributes['aVertexTextureCoords'].setValues(textureAttrValues);
    //     }
    //     if (colorValues) {
    //         mesh.attributes['aVertexColor'].setValues(colorAttrValues);
    //     }
    //     if (materials) {
    //         mesh.attributes['aVertexMaterial'].setValues(materialAttrValues);
    //     }
    //
    //     mesh.indices.setValues(indicesAttributeValues);
    //
    //     return mesh;
    //
    // };

    /** Функция получения расстояния по линии между знаками по оси X
     * @method getDistanceX
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} Расстояние по линии между знаками
     */
    getDistanceX( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.distanceX, objectProperties );
    }


    /** Функция получения расстояния по линии между знаками по оси Z
     * @method getDistanceZ
     * @public
     * @param objectProperties {Object} Параметры объекта
     * @result {Number} Расстояние по линии между знаками
     */
    getDistanceZ( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.distanceZ, objectProperties );
    }

    /**
     * Функция получения относительной высоты части объекта
     * @method getRelativeHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @param level {number} Уровень шаблона
     * @result {Number} Относительная высота
     */
    getRelativeHeight( objectProperties: FeatureProperties, level: number ) {
        return this.mark.getRelativeHeight( objectProperties, level );
    }


    /** Функция получения высоты части объекта
     * @method getHeight
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} значение высоты
     */
    getHeight( objectProperties: FeatureProperties ) {
        return this.mark.getHeight( objectProperties );
    }
}


/**
 * Класс шаблона вертикальной плоскости по линии
 * @class TemplateVERTBYLINE
 * @constructor TemplateVERTBYLINE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateVERTBYLINE extends TemplateEMPTY {
    constructor( func: FUNCTION3DVERTBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @param [untiled] {boolean} Признак объекта вне тайлов
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number, untiled ?: true ) { // TODO: untiled


        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }


        const globeShape = heightTile.projection.getGlobeShape();


        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );
        const heightValue = this.getHeight( feature.properties );

        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        this.mPositions.length = 0;

        const cleanPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        // Pipeline Stage 3:  Subdivide
        // const result = LineMeshSubdivision.computeByHeightTile(cleanPositions, heightTile);
        //TODO: построение по рельефу убрано


        // Pipeline Stage 4:  Set height


        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];


        const resultPositions: Vector3D[] = [];
        // Дополнительные точки для граней (нормали)
        for ( let i = 0; i < cleanPositions.length - 1; i++ ) {
            resultPositions.push( cleanPositions[ i ] );
            resultPositions.push( cleanPositions[ i + 1 ] );
        }
        let maxMetricHeight;
        if ( !untiled ) { // TODO: untiled
            maxMetricHeight = this._fillHeights( heightTile, resultPositions );
        } else {
            maxMetricHeight = this._fillHeightsForUntiled( heightTile, heightTile.projection, resultPositions );
        }


        //bottom polygon
        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE ) {
                positionAttributeValues.push( globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue ) );
            } else {
                positionAttributeValues.push( globeShape.scaleToGeocentricSurface( position, TemplateEMPTY.mHeights[ i ] + relativeHeightValue ) );
            }
        }

        //top polygon
        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE || this.surfaceFlag === SURFACE_TYPE.TOPFREE ) {
                positionAttributeValues.push( globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue + heightValue ) );
            } else {
                positionAttributeValues.push( globeShape.scaleToGeocentricSurface( position, TemplateEMPTY.mHeights[ i ] + relativeHeightValue + heightValue ) );
            }
        }

        //Определение длины стенки
        const curVector = vec3.create();
        let fullLength = 0;
        for ( let i = resultPositions.length; i < positionAttributeValues.length - 1; i++ ) {
            const position = positionAttributeValues[ i ];
            const nextPostion = positionAttributeValues[ i + 1 ];
            fullLength += vec3.len( vec3.sub( nextPostion, position, curVector ) );
        }
        let maxHeightValue = 0;
        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = positionAttributeValues[ i ];
            const nextPostion = positionAttributeValues[ i + resultPositions.length ];
            maxHeightValue = Math.max( maxHeightValue, vec3.len( vec3.sub( nextPostion, position, curVector ) ) );
        }


        if ( textureParams ) {
            let textureWidth = 1;
            let textureHeight = 1;
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = fullLength / textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }
            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = maxHeightValue / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }

            let curLength = 0;
            for ( let i = resultPositions.length; i < positionAttributeValues.length - 1; i++ ) {
                const textureCoordAttributeValue = vec3.create();
                vec3.setValues( textureCoordAttributeValue, curLength / fullLength * textureWidth, textureHeight, textureParams.transparentTex );
                textureCoordAttributeValues[ i ] = textureCoordAttributeValue;

                const position = positionAttributeValues[ i ];
                const nextPostion = positionAttributeValues[ i + 1 ];
                curLength += vec3.len( vec3.sub( nextPostion, position, curVector ) );
            }
            const textureCoordAttributeValue = vec3.create();
            vec3.setValues( textureCoordAttributeValue, textureWidth, textureHeight, textureParams.transparentTex );
            textureCoordAttributeValues[ positionAttributeValues.length - 1 ] = textureCoordAttributeValue;

            let curHeight = 0;
            for ( let i = 0; i < resultPositions.length; i++ ) {
                const position = positionAttributeValues[ i ];
                const nextPostion = positionAttributeValues[ i + resultPositions.length ];
                curHeight = vec3.len( vec3.sub( nextPostion, position, curVector ) );
                let curVerTexCord;
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    curVerTexCord = (1 - curHeight / maxHeightValue) * textureHeight;
                } else {
                    curVerTexCord = 0;
                }

                const textureCoordAttributeValue = vec3.create( textureCoordAttributeValues[ i + resultPositions.length ] );
                textureCoordAttributeValue[ 1 ] = curVerTexCord;
                textureCoordAttributeValues[ i ] = textureCoordAttributeValue;
            }
        } else {
            const defaultTextCoords = vec3.create( vec3.UNITZ );
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                textureCoordAttributeValues[ i ] = defaultTextCoords;
            }
        }


        const centerPoint = heightTile.getCenter();
        // RTC coordinates

        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            const point = positionAttributeValues[ i ];
            vec3.sub( point, centerPoint );
        }

        if ( paintFlag ) {
            //Добавить в обратном направлении
            for ( let i = positionAttributeValues.length - 1; i >= 0; i-- ) {
                positionAttributeValues.push( positionAttributeValues[ i ] );
            }

            //Добавить в обратном направлении
            for ( let i = textureCoordAttributeValues.length - 1; i >= 0; i-- ) {
                textureCoordAttributeValues.push( textureCoordAttributeValues[ i ] );
            }


        }

        const count = resultPositions.length;
        for ( let i = 0; i < count - 1; i++ ) {
            const downFirst = i;
            const upFirst = downFirst + count;

            const downSecond = downFirst + 1;
            const upSecond = downSecond + count;

            indicesAttributeValues.push( upFirst );
            indicesAttributeValues.push( downFirst );
            indicesAttributeValues.push( upSecond );


            indicesAttributeValues.push( downFirst );
            indicesAttributeValues.push( downSecond );
            indicesAttributeValues.push( upSecond );
        }

        if ( paintFlag ) {
            const startIndex = count * 2;
            for ( let i = 0; i < count - 1; i++ ) {

                const upFirst = startIndex + i;
                const downFirst = upFirst + count;

                const upSecond = upFirst + 1;

                const downSecond = upSecond + count;

                indicesAttributeValues.push( upFirst );
                indicesAttributeValues.push( downFirst );
                indicesAttributeValues.push( upSecond );


                indicesAttributeValues.push( downFirst );
                indicesAttributeValues.push( downSecond );
                indicesAttributeValues.push( upSecond );
            }
        }


        // fill materials
        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        // fill normals
        const normalAttributeValues = this._createNormals( indicesAttributeValues, positionAttributeValues );


        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}


/**
 * Класс шаблона горизонтальной плоскости по линии
 * @class TemplateHORIZONTBYLINE
 * @constructor TemplateHORIZONTBYLINE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateHORIZONTBYLINE extends TemplateEMPTY {
    widthPlane: FUNCTION3DHORIZONTBYLINE['FUNCTIONPARAMS']['WidthPlane'];

    constructor( func: FUNCTION3DHORIZONTBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );

        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
        this.widthPlane = functionParams.WidthPlane;
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @param [untiled] {boolean} Признак объекта вне тайлов
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number, untiled ?: true ) { // TODO: untiled

        this.mPositions.length = 0;

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }


        const globeShape = heightTile.projection.getGlobeShape();
        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );

        // const heightValue = this.getHeight(feature.properties);//(равна 0)
        let widthValue = this.getWidth( feature.properties );
        const lineWidth = widthValue;

        const centerPoint = heightTile.getCenter() || [0, 0, 0];
        const centerPointGeo = globeShape.toGeodetic3d( centerPoint );

        const r = vec3.len( centerPoint );
        const alpha = widthValue / r;

        const newPoint = new Geodetic3D( centerPointGeo.getLongitude() + alpha, centerPointGeo.getLatitude(), centerPointGeo.getHeight() );

        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );
        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );

        // Pipeline Stage 1b:  Clean up - Swap winding order
        // this.mCleanedPositions.length=0;
        // const cleanPositions = PolygonAlgorithms.cleanup(normalizedPositions,this.mCleanedPositions);
        // закомментировал, чтобы лишнее не удалить
        // if (feature.geometry.type == 'Polygon') {
        //     cleanPositions.push(cleanPositions[0].slice());
        // }
        const plane = new EllipsoidTangentPlane( globeShape, normalizedPositions );
        let positionsOnPlane = plane.computePositionsOnPlane( normalizedPositions );// Координаты на плоскости
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            normalizedPositions.reverse(); //Координаты вершин полигона без учета высоты
            positionsOnPlane = plane.computePositionsOnPlane( normalizedPositions );// Координаты на плоскости
        }

        const widthPositions = plane.computePositionsOnPlane( [vec3.normalize( centerPoint, vec3.create() ), vec3.normalize( globeShape.toVector3d( newPoint ) )] );// Координаты на плоскости
        widthValue = vec2.len( vec2.sub( widthPositions[ 0 ], widthPositions[ 1 ] ) );


        let maxMetricHeight;
        if ( !untiled ) { // TODO: untiled
            maxMetricHeight = this._fillHeights( heightTile, normalizedPositions );
        } else {
            maxMetricHeight = this._fillHeightsForUntiled( heightTile, heightTile.projection, normalizedPositions );
        }

        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];
        const pointList: Vector2D[] = [];
        this._getLinePointObject( positionsOnPlane, widthValue, pointList, indicesAttributeValues );
        const resultPositions = plane.planePositionsOnEllipsoid( pointList );


        let textureHeight = 1.;
        let textureWidth = 1.;
        if ( textureParams ) {
            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = lineWidth / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = 1 / textureParams.gValue;
                }
            }
        }

        //scale points
        const curVec = vec3.create();
        const curVec1 = vec3.create();
        for ( let i = 0; i < normalizedPositions.length - 1; i++ ) {
            let height, nextHeight;
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE ) {
                height = maxMetricHeight + relativeHeightValue;
                nextHeight = maxMetricHeight + relativeHeightValue;
            } else {
                height = TemplateEMPTY.mHeights[ i ] + relativeHeightValue;
                nextHeight = TemplateEMPTY.mHeights[ i + 1 ] + relativeHeightValue;
            }

            if ( i !== 0 ) {
                //add triangle
                const start = positionAttributeValues.length;

                let point: Vector3D = globeShape.scaleToGeocentricSurface( resultPositions[ start ], height );
                vec3.sub( point, centerPoint );
                positionAttributeValues.push( point );
                point = globeShape.scaleToGeocentricSurface( resultPositions[ start + 1 ], height );
                vec3.sub( point, centerPoint );
                positionAttributeValues.push( point );
                point = globeShape.scaleToGeocentricSurface( resultPositions[ start + 2 ], height );
                vec3.sub( point, centerPoint );
                positionAttributeValues.push( point );


                if ( textureParams ) {
                    const point0 = positionAttributeValues[ start ];
                    const point1 = positionAttributeValues[ start + 1 ];
                    const point2 = positionAttributeValues[ start + 2 ];
                    const len1 = vec3.len( vec3.sub( point2, point0, curVec ) );
                    const len0 = Math.abs( vec3.dot( vec3.sub( point0, point1, curVec1 ), vec3.normalize( curVec ) ) );

                    if ( textureParams.gValue !== 0 && textureParams.gUnit === MEASURE.texMetr ) {
                        textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );
                        textureCoordAttributeValues.push( [len0 * textureWidth, 0, textureParams.transparentTex] );
                        textureCoordAttributeValues.push( [len1 * textureWidth, textureHeight, textureParams.transparentTex] );
                    } else {
                        textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );
                        textureCoordAttributeValues.push( [len0 / len1 * textureWidth, 0, textureParams.transparentTex] );
                        textureCoordAttributeValues.push( [textureWidth, textureHeight, textureParams.transparentTex] );
                    }
                }
            }

            //add plane
            const start = positionAttributeValues.length;

            let point: Vector3D = globeShape.scaleToGeocentricSurface( resultPositions[ start ], height );
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );
            point = globeShape.scaleToGeocentricSurface( resultPositions[ start + 1 ], height );
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );
            point = globeShape.scaleToGeocentricSurface( resultPositions[ start + 2 ], nextHeight );
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );
            point = globeShape.scaleToGeocentricSurface( resultPositions[ start + 3 ], nextHeight );
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            if ( textureParams ) {

                const point0 = positionAttributeValues[ start ];
                const point1 = positionAttributeValues[ start + 1 ];
                const point2 = positionAttributeValues[ start + 2 ];
                const point3 = positionAttributeValues[ start + 3 ];

                const len0 = vec3.len( vec3.sub( point2, point0, curVec ) );
                const len1 = vec3.len( vec3.sub( point3, point1, curVec ) );
                const unitX = vec3.normalize( curVec );

                let len0add = 0;
                let len1add = 0;

                const dot01 = vec3.dot( unitX, vec3.sub( point1, point0, curVec1 ) );
                if ( dot01 > 0 ) {
                    len1add = dot01;
                } else {
                    len0add = Math.abs( dot01 );
                }

                const dot23 = vec3.dot( unitX, vec3.sub( point2, point3, curVec1 ) );
                let maxLen;
                if ( dot23 > 0 ) {
                    maxLen = len0add + len0;
                } else {
                    maxLen = len1add + len1;
                }

                if ( textureParams.gValue !== 0 && textureParams.gUnit === MEASURE.texMetr ) {

                    textureCoordAttributeValues.push( [len0add * textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [len1add * textureWidth, textureHeight, textureParams.transparentTex] );

                    textureCoordAttributeValues.push( [(len0add + len0) * textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [(len1add + len1) * textureWidth, textureHeight, textureParams.transparentTex] );

                } else {
                    textureCoordAttributeValues.push( [len0add / maxLen * textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [len1add / maxLen * textureWidth, textureHeight, textureParams.transparentTex] );

                    textureCoordAttributeValues.push( [(len0add + len0) / maxLen * textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [(len1add + len1) / maxLen * textureWidth, textureHeight, textureParams.transparentTex] );
                }
            }

        }


        if ( !textureParams ) {
            const defaultTextCoords: Vector3D = [0, 0, 1];
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                textureCoordAttributeValues[ i ] = defaultTextCoords;
            }
        }


        // fill normals
        const normalAttributeValues = this._createNormals( indicesAttributeValues, positionAttributeValues );

        //fill materials
        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }


        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }


        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );


        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }


    /** Функция получения ширины полосы
     * @method getWidth
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} Значение ширины полосы
     */
    getWidth( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.widthPlane, objectProperties );
    }


    /**
     * Функция создание массива координат вершин линии
     * @method _getLinePointObject
     * @private
     * @param coords {Array} Метрика объекта
     * @param widthPlane {number} Ширина полосы
     * @param vertexList {Array} Массив для записи вершин
     * @param indicesList {Array} Массив для записи индексов
     * @result {Object} Массив координат вершин линии
     */
    _getLinePointObject( coords: Vector2or3[ ], widthPlane: number, vertexList: Vector2D[], indicesList: number[ ] ) {

        const w = widthPlane / 2;


        for ( let i = 1; i < coords.length; i++ ) {

            let startIndex = vertexList.length - 2;

            const previous = coords[ i - 1 ];
            const current = coords[ i ];
            const next = coords[ i + 1 ];

            //линия по метрике (текущая)
            const line0 = Line2DCreator.createLineByPoints( previous, current );
            const n = line0.getNormal();
            const translateVector = vec2.create();

            //линия слева (текущая)
            const line0Left = line0.copy();
            //translateLeft
            vec2.scale( n, w, translateVector );
            line0Left.translateByVector( translateVector );

            //линия справа (текущая)
            const line0Right = line0.copy();
            //translateRight
            vec2.scale( n, -w, translateVector );
            line0Right.translateByVector( translateVector );


            // стартовые точки
            if ( i === 1 ) {
                const lineN = Line2DCreator.createLineByNormalAndPoint( line0.getDirection(), previous );
                const point0 = IntersectionTests.tryLineLine2D( line0Right, lineN );
                const point1 = IntersectionTests.tryLineLine2D( line0Left, lineN );
                if ( point0 && point1 ) {
                    vertexList.push( point0 );
                    vertexList.push( point1 );
                }
                startIndex = 0;
            }

            const lineN0 = Line2DCreator.createLineByNormalAndPoint( line0.getDirection(), current );

            if ( next ) {

                //линия по метрике (следующая)
                const line1 = Line2DCreator.createLineByPoints( current, next );
                const n = line1.getNormal();

                //линия слева (следующая)
                const line1Left = line1.copy();
                //translateLeft
                vec2.scale( n, w, translateVector );
                line1Left.translateByVector( translateVector );

                //линия справа (следующая)
                const line1Right = line1.copy();
                //translateRight
                vec2.scale( n, -w, translateVector );
                line1Right.translateByVector( translateVector );

                const lineN1 = Line2DCreator.createLineByNormalAndPoint( line1.getDirection(), current );


                // точка пересечения линий слева
                const pLeft = IntersectionTests.tryLineLine2D( line0Left, line1Left );
                // const pLeftVector = vec2.sub(pLeft, current,[]);

                // точка пересечения линий справа
                const pRight = IntersectionTests.tryLineLine2D( line0Right, line1Right );
                if ( pLeft && pRight ) {
                    const pRightVector = vec2.sub( pRight, [current[ 0 ], current[ 1 ]], vec2.create() );


                    //определяем с какой стороны пересечение будем считать вершиной доп треугольника
                    if ( vec2.dot( pRightVector, line0.getDirection() ) > 0 ) {
                        // пересечение линий справа

                        // вершины текущего прямоугольника
                        vertexList.push( pRight );//точка пересечения плоскостей
                        const pointCur = IntersectionTests.tryLineLine2D( line0Left, lineN0 );
                        if ( pointCur ) {
                            vertexList.push( pointCur );// точка текущего прямоугольника

                            //вершины добавочного треугольника
                            vertexList.push( pointCur );
                            vertexList.push( pRight );
                        }
                        const pointNext = IntersectionTests.tryLineLine2D( line1Left, lineN1 );
                        if ( pointNext ) {
                            vertexList.push( pointNext );// точка следующего прямоугольника


                            // вершины следующего прямоугольника
                            vertexList.push( pRight );
                            vertexList.push( pointNext );
                        }
                    } else {
                        // пересечение линий слева

                        // вершины текущего прямоугольника
                        const pointCur = IntersectionTests.tryLineLine2D( line0Right, lineN0 );
                        if ( pointCur ) {
                            vertexList.push( pointCur );// точка текущего прямоугольника
                            vertexList.push( pLeft );//точка пересечения плоскостей

                            //вершины добавочного треугольника
                            vertexList.push( pLeft );
                            vertexList.push( pointCur );
                        }
                        const pointNext = IntersectionTests.tryLineLine2D( line1Right, lineN1 );
                        if ( pointNext ) {
                            vertexList.push( pointNext );// точка следующего прямоугольника

                            // вершины следующего прямоугольника
                            vertexList.push( pointNext );
                            vertexList.push( pLeft );
                        }
                    }
                    // индексы текущего прямоугольника
                    indicesList.push( startIndex + 1 );
                    indicesList.push( startIndex + 2 );
                    indicesList.push( startIndex );
                    indicesList.push( startIndex + 1 );
                    indicesList.push( startIndex + 3 );
                    indicesList.push( startIndex + 2 );


                    // индексы добавочного треугольника
                    indicesList.push( startIndex + 4 );
                    indicesList.push( startIndex + 6 );
                    indicesList.push( startIndex + 5 );
                }
            } else {

                let point = IntersectionTests.tryLineLine2D( line0Right, lineN0 );
                if ( point ) {
                    vertexList.push( point );
                }
                point = IntersectionTests.tryLineLine2D( line0Left, lineN0 );
                if ( point ) {
                    vertexList.push( point );
                }
                indicesList.push( startIndex + 1 );
                indicesList.push( startIndex + 2 );
                indicesList.push( startIndex );
                indicesList.push( startIndex + 1 );
                indicesList.push( startIndex + 3 );
                indicesList.push( startIndex + 2 );

            }
        }
    }
}

/**
 * Класс шаблона горизонтальной плоскости
 * @class TemplateHORIZONT
 * @constructor TemplateHORIZONT
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateHORIZONT extends TemplateEMPTY {
    constructor( func: FUNCTION3DHORIZONT, mainObject: Object3dTemplate ) {
        super( func, mainObject );

        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
    }


    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        let positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );
        if ( positionsGeoJSON.length < 3 ) {
            return [];
        }

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }
        const deltaRad = Math.PI / 20;

        const globeShape = heightTile.projection.getGlobeShape();
        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );
        const heightValue = this.getHeight( feature.properties );


        const centerPoint = heightTile.getCenter();


        this.mPositions.length = 0;

        let normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        this.mCleanedPositions.length = 0;
        let cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
        let plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        let positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        // Pipeline Stage 2:  Triangulate
        let indices = EarClipping3d.triangulate( cleanPositions );

        if ( !indices ) {  // TODO: заглушка для сложных полигонов - неправильная триангуляция
            if ( feature.geometry.type === 'MultiPolygon' ) {
                feature.geometry.coordinates.length = 1;
                (feature.geometry.coordinates as Vector3D[][])[ 0 ].length = 1;
            }
            if ( feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 1 ) {
                feature.geometry.coordinates.length = 1;
            }
            positionsGeoJSON = feature.getLineGeometryCoordinates() as Vector3D[];

            if ( positionsGeoJSON.length < 3 ) {
                return [];
            }
            this.mPositions.length = 0;
            normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
            // Pipeline Stage 1b:  Clean up - Swap winding order
            this.mCleanedPositions.length = 0;
            cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
            plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
            positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
            if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
                cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
            }

            // Pipeline Stage 2:  Triangulate
            indices = EarClipping3d.triangulate( cleanPositions );
        }

        let result;
        // Pipeline Stage 3:  Subdivide
        if ( indices ) {
            result = TriangleMeshSubdivision.compute( cleanPositions, indices, deltaRad );
        }
        // Pipeline Stage 4:  Set height
        if ( !result ) {
            return [];
        }

        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];

        const resultPositions = result.getPositions();
        // fill indices
        const indicesAttributeValues = result.getIndices();

        const maxMetricHeight = this._fillHeights( heightTile, resultPositions );

        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];

            // fill positions WC
            // scale to surface
            const point = globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue + heightValue );
            // RTC coordinates
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            // fill materials
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        // fill texture coords
        if ( textureParams ) {

            const normalCenter = vec3.normalize( centerPoint, vec3.create() );
            const curSub = vec3.create();
            let maxLenIndex = -1;
            let maxLen = 0;
            for ( let i = 1; i < positionAttributeValues.length; i++ ) {
                // const point = positionAttributeValues[ i ];
                const curLen = vec3.len( vec3.sub( positionAttributeValues[ i ], positionAttributeValues[ i - 1 ], curSub ) );
                if ( curLen > maxLen ) {
                    maxLen = curLen;
                    maxLenIndex = i;
                }
            }
            const unitXvec = vec3.normalize( vec3.sub( positionAttributeValues[ maxLenIndex ], positionAttributeValues[ maxLenIndex - 1 ], curSub ), vec3.create() );
            const unitYvec = vec3.cross( normalCenter, unitXvec, vec3.create() );

            let minX = Number.MAX_VALUE;
            let maxX = -Number.MAX_VALUE;
            let minY = Number.MAX_VALUE;
            let maxY = -Number.MAX_VALUE;
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                const point = positionAttributeValues[ i ];
                const curTex: Vector3D = [vec3.dot( point, unitXvec ), vec3.dot( point, unitYvec ), textureParams.transparentTex];
                textureCoordAttributeValues.push( curTex );
                if ( curTex[ 0 ] < minX ) {
                    minX = curTex[ 0 ];
                }
                if ( curTex[ 0 ] > maxX ) {
                    maxX = curTex[ 0 ];
                }
                if ( curTex[ 1 ] < minY ) {
                    minY = curTex[ 1 ];
                }
                if ( curTex[ 1 ] > maxY ) {
                    maxY = curTex[ 1 ];
                }
            }

            const maxWidth = maxX - minX;
            const maxHeight = maxY - minY;


            let textureWidth = 1;
            let textureHeight = 1;
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = maxWidth / textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }
            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = maxHeight / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }


            for ( let i = 0; i < textureCoordAttributeValues.length; i++ ) {
                const curTex = textureCoordAttributeValues[ i ];
                curTex[ 0 ] = (curTex[ 0 ] - minX) / maxWidth * textureWidth;
                curTex[ 1 ] = (curTex[ 1 ] - minY) / maxHeight * textureHeight;
            }
        } else {
            const defaultTextCoords: Vector3D = [0, 0, 1];
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                textureCoordAttributeValues[ i ] = defaultTextCoords;
            }
        }

        // fill normals
        const normalAttributeValues = this._createNormals( indicesAttributeValues, positionAttributeValues );

        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }

        if ( this.mainObject.code === -100000021 ) {
            feature.properties.__service = { simplePolygon: true };
        }

        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}

/**
 * Класс шаблона поверхности
 * @class TemplateSURFACE
 * @constructor TemplateSURFACE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateSURFACE extends TemplateEMPTY {
    constructor( func: FUNCTION3DHORIZONT, mainObject: Object3dTemplate ) {
        super( func, mainObject );

        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile ) {

        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );
        if ( positionsGeoJSON.length < 3 ) {
            return [];
        }

        const descObject = this.getDescriptionObject();
        let templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
        }
        const deltaRad = Math.PI / 2;

        const globeShape = heightTile.projection.getGlobeShape();


        const centerPoint = heightTile.getCenter();

        this.mPositions.length = 0;

        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        this.mCleanedPositions.length = 0;
        const cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        // Pipeline Stage 2:  Triangulate
        const indices = EarClipping3d.triangulate( cleanPositions );

        let result;
        // Pipeline Stage 3:  Subdivide
        if ( indices ) {
            result = TriangleMeshSubdivision.compute( cleanPositions, indices, deltaRad );
        }
        // Pipeline Stage 4:  Set height
        if ( !result ) {
            return [];
        }

        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        // const normalAttributeValues;
        const materialAttributeValues: number[] = [];
        // const textureCoordAttributeValues = [];

        const resultPositions = result.getPositions();
        // fill indices
        const indicesAttributeValues = result.getIndices();

        const topHeight = heightTile.maxHeight + 10;
        const bottomHeight = heightTile.minHeight - 10;

        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];

            // fill positions WC
            // scale to surface
            const point = globeShape.scaleToGeocentricSurface( position, topHeight );
            // RTC coordinates
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            // fill materials
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];

            // fill positions WC
            // scale to surface
            const point = globeShape.scaleToGeocentricSurface( position, bottomHeight );
            // RTC coordinates
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            // fill materials
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        //bottom plane
        const count = indicesAttributeValues.length;
        const maxIndex = resultPositions.length;
        for ( let i = 0; i < count; i += 3 ) {
            indicesAttributeValues.push( maxIndex + indicesAttributeValues[ i ] );
            indicesAttributeValues.push( maxIndex + indicesAttributeValues[ i + 2 ] );
            indicesAttributeValues.push( maxIndex + indicesAttributeValues[ i + 1 ] );
        }

        //sides
        for ( let i = 0; i < maxIndex; i++ ) {
            const currentTop = i;
            let nextTop = i + 1;
            if ( nextTop === maxIndex ) {
                nextTop = 0;
            }
            const currentBottom = maxIndex + currentTop;
            const nextBottom = maxIndex + nextTop;

            indicesAttributeValues.push( currentTop );
            indicesAttributeValues.push( currentBottom );
            indicesAttributeValues.push( nextTop );

            indicesAttributeValues.push( nextBottom );
            indicesAttributeValues.push( nextTop );
            indicesAttributeValues.push( currentBottom );
        }

        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );
        mesh.shadowVolume = true;

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}

/**
 * Класс шаблона двускатной крыши
 * @class TemplateTOPONSQUARE
 * @constructor TemplateTOPONSQUARE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateTOPONSQUARE extends TemplateEMPTY {

    BANDCOUNT = 21;

    constructor( func: FUNCTION3DVERTBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;
    }


    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {


        const heightValue = this.getHeight( feature.properties );
        if ( heightValue < 1e-6 ) {
            return [];
        }
        const globeShape = heightTile.projection.getGlobeShape();
        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );
        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }

        this.mPositions.length = 0;

        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        this.mCleanedPositions.length = 0;
        const cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );

        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }


        if ( cleanPositions.length < 4 || feature.geometry.type !== 'Polygon' || cleanPositions.length > this.BANDCOUNT + 1 )
            return [];

        const bandList: Vector3D[] = [];
        const drawableFlag = this._isSguareBand( cleanPositions, bandList );

        if ( drawableFlag !== 1 ) {
            return [];
        }

        // Pipeline Stage 4:  Set height
        const posValues: Vector3D[] = [];
        const maxMetricHeight = this._fillHeights( heightTile, bandList );


        //border polygon
        for ( let i = 0; i < bandList.length; i++ ) {
            const position = bandList[ i ];
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE || this.surfaceFlag === SURFACE_TYPE.TOPFREE ) {
                posValues.push( globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue ) );
            } else {
                posValues.push( globeShape.scaleToGeocentricSurface( position, TemplateEMPTY.mHeights[ i ] + relativeHeightValue ) );
            }
        }


        const planeCount = bandList.length / 2 - 1;
        //roof top points
        for ( let i = 0; i <= planeCount; i++ ) {
            const currPosition = bandList[ i ];
            const oppositePosition = bandList[ bandList.length - i - 1 ];

            const position = vec3.add( currPosition, oppositePosition, vec3.create() );
            vec3.scale( position, 0.5 );
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE || this.surfaceFlag === SURFACE_TYPE.TOPFREE ) {
                posValues.push( globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue + heightValue ) );
            } else {
                posValues.push( globeShape.scaleToGeocentricSurface( position, TemplateEMPTY.mHeights[ i ] + relativeHeightValue + heightValue ) );
            }
        }

        let textureWidth = 1, textureHeight = 1;
        if ( textureParams ) {
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }
            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }
        }


        const centerPoint = heightTile.getCenter();
        // RTC coordinates
        for ( let i = 0; i < posValues.length; i++ ) {
            const point = posValues[ i ];
            vec3.sub( point, centerPoint );
        }


        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];


        for ( let i = 0; i < planeCount; i++ ) {

            let upFirstIndex = i + bandList.length;
            let upSecondIndex = upFirstIndex + 1;
            let downFirstIndex = i;
            let downSecondIndex = downFirstIndex + 1;

            positionAttributeValues.push( posValues[ upFirstIndex ] );
            positionAttributeValues.push( posValues[ downFirstIndex ] );
            positionAttributeValues.push( posValues[ downSecondIndex ] );
            positionAttributeValues.push( posValues[ upSecondIndex ] );

            upFirstIndex = i + bandList.length + 1;
            upSecondIndex = upFirstIndex - 1;
            downFirstIndex = bandList.length - (i + 2);
            downSecondIndex = downFirstIndex + 1;

            positionAttributeValues.push( posValues[ upFirstIndex ] );
            positionAttributeValues.push( posValues[ downFirstIndex ] );
            positionAttributeValues.push( posValues[ downSecondIndex ] );
            positionAttributeValues.push( posValues[ upSecondIndex ] );
        }


        const curVec = vec3.create();
        if ( textureParams ) {
            for ( let i = 0; i < planeCount; i++ ) {
                const p0 = positionAttributeValues[ 8 * i ];
                const p1 = positionAttributeValues[ 8 * i + 1 ];
                const p2 = positionAttributeValues[ 8 * i + 2 ];
                const p3 = positionAttributeValues[ 8 * i + 3 ];
                const p4 = positionAttributeValues[ 8 * i + 4 ];
                const p5 = positionAttributeValues[ 8 * i + 5 ];
                const p6 = positionAttributeValues[ 8 * i + 6 ];
                const p7 = positionAttributeValues[ 8 * i + 7 ];


                let curHeight1 = vec3.len( vec3.sub( p0, p1, curVec ) );
                let curHeight2 = vec3.len( vec3.sub( p2, p3, curVec ) );
                let minHeight = Math.min( curHeight1, curHeight2 );


                let curWidth1 = vec3.len( vec3.sub( p1, p2, curVec ) );
                let curWidth2 = vec3.len( vec3.sub( p0, p3, curVec ) );
                let maxWidth = Math.min( curWidth1, curWidth2 );

                let y0 = 0;
                let y1;
                if ( textureParams.vUnit === MEASURE.texMetr && textureParams.vValue !== 0 ) {
                    y1 = minHeight / textureParams.vValue;
                } else {
                    y1 = textureHeight;
                }

                let x00 = 0;
                let x01 = 0;

                let x10, x11;
                if ( textureParams.gUnit === MEASURE.texMetr && textureParams.gValue !== 0 ) {
                    x10 = curWidth1 / textureParams.gValue;
                    x11 = curWidth2 / textureParams.gValue;
                } else {
                    x10 = curWidth1 / maxWidth * textureWidth;
                    x11 = curWidth2 / maxWidth * textureWidth;
                }


                textureCoordAttributeValues.push( [x01, y1, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x00, y0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x10, y0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x11, y1, textureParams.transparentTex] );


                curHeight1 = vec3.len( vec3.sub( p4, p5, curVec ) );
                curHeight2 = vec3.len( vec3.sub( p6, p7, curVec ) );
                minHeight = Math.min( curHeight1, curHeight2 );


                curWidth1 = vec3.len( vec3.sub( p5, p6, curVec ) );
                curWidth2 = vec3.len( vec3.sub( p4, p7, curVec ) );
                maxWidth = Math.min( curWidth1, curWidth2 );

                y0 = 0;
                if ( textureParams.vUnit === MEASURE.texMetr && textureParams.vValue !== 0 ) {
                    y1 = minHeight / textureParams.vValue;
                } else {
                    y1 = textureHeight;
                }

                x00 = 0;
                x01 = 0;

                if ( textureParams.gUnit === MEASURE.texMetr && textureParams.gValue !== 0 ) {
                    x00 = -curWidth1 / textureParams.gValue;
                    x01 = -curWidth2 / textureParams.gValue;
                } else {
                    x00 = -curWidth1 / maxWidth * textureWidth;
                    x01 = -curWidth2 / maxWidth * textureWidth;
                }

                x10 = 0;
                x11 = 0;

                textureCoordAttributeValues.push( [x01, y1, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x00, y0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x10, y0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [x11, y1, textureParams.transparentTex] );
            }

        }

        for ( let i = 0; i < planeCount * 2; i++ ) {
            const upFirst = i * 4;
            const downFirst = upFirst + 1;
            const downSecond = downFirst + 1;
            const upSecond = downSecond + 1;

            indicesAttributeValues.push( upFirst );
            indicesAttributeValues.push( downFirst );
            indicesAttributeValues.push( upSecond );

            indicesAttributeValues.push( downFirst );
            indicesAttributeValues.push( downSecond );
            indicesAttributeValues.push( upSecond );
        }


        //торцы
        indicesAttributeValues.push( positionAttributeValues.length );
        indicesAttributeValues.push( positionAttributeValues.length + 1 );
        indicesAttributeValues.push( positionAttributeValues.length + 2 );

        positionAttributeValues.push( posValues[ 0 ] );
        positionAttributeValues.push( posValues[ bandList.length ] );
        positionAttributeValues.push( posValues[ bandList.length - 1 ] );


        if ( textureParams ) {
            const curHeight = vec3.len( vec3.sub( positionAttributeValues[ positionAttributeValues.length - 2 ], positionAttributeValues[ positionAttributeValues.length - 3 ], curVec ) );
            const curWidth = vec3.len( vec3.sub( positionAttributeValues[ positionAttributeValues.length - 1 ], positionAttributeValues[ positionAttributeValues.length - 3 ], curVec ) );
            const height = Math.sqrt( curHeight * curHeight - 0.25 * curWidth * curWidth );
            const y0 = 0;
            let y1;
            if ( textureParams.vUnit === MEASURE.texMetr && textureParams.vValue !== 0 ) {
                y1 = height / textureParams.vValue;
            } else {
                y1 = textureHeight;
            }
            const x0 = 0;
            let x1;
            if ( textureParams.gUnit === MEASURE.texMetr && textureParams.gValue !== 0 ) {
                x1 = curWidth / textureParams.gValue;
            } else {
                x1 = textureWidth;
            }
            textureCoordAttributeValues.push( [x1, y0, textureParams.transparentTex] );
            textureCoordAttributeValues.push( [0.5 * x1, y1, textureParams.transparentTex] );
            textureCoordAttributeValues.push( [x0, y0, textureParams.transparentTex] );
        }

        indicesAttributeValues.push( positionAttributeValues.length );
        indicesAttributeValues.push( positionAttributeValues.length + 1 );
        indicesAttributeValues.push( positionAttributeValues.length + 2 );

        positionAttributeValues.push( posValues[ bandList.length / 2 ] );
        positionAttributeValues.push( posValues[ posValues.length - 1 ] );
        positionAttributeValues.push( posValues[ bandList.length / 2 - 1 ] );


        if ( textureParams ) {
            const curHeight = vec3.len( vec3.sub( positionAttributeValues[ positionAttributeValues.length - 2 ], positionAttributeValues[ positionAttributeValues.length - 3 ], curVec ) );
            const curWidth = vec3.len( vec3.sub( positionAttributeValues[ positionAttributeValues.length - 1 ], positionAttributeValues[ positionAttributeValues.length - 3 ], curVec ) );
            const height = Math.sqrt( curHeight * curHeight - 0.25 * curWidth * curWidth );

            const y0 = 0;
            let y1;
            if ( textureParams.vUnit === MEASURE.texMetr && textureParams.vValue !== 0 ) {
                y1 = height / textureParams.vValue;
            } else {
                y1 = textureHeight;
            }
            const x0 = 0;
            let x1;
            if ( textureParams.gUnit === MEASURE.texMetr && textureParams.gValue !== 0 ) {
                x1 = curWidth / textureParams.gValue;
            } else {
                x1 = textureWidth;
            }
            textureCoordAttributeValues.push( [x1, y0, textureParams.transparentTex] );
            textureCoordAttributeValues.push( [0.5 * x1, y1, textureParams.transparentTex] );
            textureCoordAttributeValues.push( [x0, y0, textureParams.transparentTex] );
        }

        if ( !textureParams ) {
            const defaultTextCoords: Vector3D = [0, 0, 1];
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                textureCoordAttributeValues[ i ] = defaultTextCoords;
            }
        }

        // fill normals
        const normalAttributeValues = this._createNormals( indicesAttributeValues, positionAttributeValues );

        // fill materials
        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }

        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }

    /** Функция определения возможности построения крыши
     * @method _isSguareBand
     * @private
     * @param coords {Array} Метрика объекта
     * @param bandList {Array} Массив для заполнения
     * @result результат: 0 - построение невозможно
     *                    1 - построение возможно
     */
    _isSguareBand( coords: Vector2or3[ ], bandList: Vector2or3[ ] ) {
        const sorttab: { Point: Vector2or3; Length: number; }[] = [];

        // Идем по точкам
        const pointcount = coords.length;

        // нечетное число сторон - не умею
        if ( pointcount % 2 !== 0 )
            return 0; // нечетное число сторон

        // Заполнили значения начальных точек отрезка
        for ( let i = 0; i < pointcount; i++ ) {
            sorttab[ i ] = { Point: coords[ i ], Length: 0 };
        }

        const firstPoint = vec2.create();
        const secondPoint = vec2.create();
        // Заполнили длины
        for ( let i = 0; i < pointcount - 1; i++ ) {
            firstPoint[ 0 ] = sorttab[ i ].Point[ 0 ];
            firstPoint[ 1 ] = sorttab[ i ].Point[ 1 ];
            secondPoint[ 0 ] = sorttab[ i + 1 ].Point[ 0 ];
            secondPoint[ 1 ] = sorttab[ i + 1 ].Point[ 1 ];

            sorttab[ i ].Length = vec2.len( vec2.sub( secondPoint, firstPoint, vec2.create() ) );
        }
        const zeroPoint: Vector2D = [sorttab[ 0 ].Point[ 0 ], sorttab[ 0 ].Point[ 1 ]];
        const lastPoint: Vector2D = [sorttab[ pointcount - 1 ].Point[ 0 ], sorttab[ pointcount - 1 ].Point[ 1 ]];
        sorttab[ pointcount - 1 ].Length = vec2.len( vec2.sub( zeroPoint, lastPoint, vec2.create() ) );

        // Цикл по количеству отрезков

        // Цикл по количеству сторон - ищем торец
        for ( let j = 0; j < pointcount; j++ ) {
            let minlength = Number.MAX_VALUE;
            let minindex = 0;

            // Нашли минимальную сторону
            for ( let k = 0; k < pointcount; k++ ) {
                const currentLength = sorttab[ k ].Length;
                if ( currentLength <= minlength ) {
                    minlength = currentLength;
                    minindex = k;
                }
            }
            if ( minlength < 1e-6 ) {
                return 0; // все отрезки проверили, а не построили
            }

            // Заполнили ленту начиная с минимального отрезка (ширины ленты)
            for ( let k = minindex + 1; k < pointcount; k++ ) {
                bandList.push( sorttab[ k ].Point );
            }
            for ( let k = 0; k < minindex + 1; k++ ) {
                bandList.push( sorttab[ k ].Point );
            }

            // Проверили, что ширина ленты нигде расшир¤етс¤ более чем в 2 раза
            const count = pointcount / 2;
            const curSide = vec2.create();
            let exFlag = false;
            for ( let k = 0; k < count; k++ ) {
                firstPoint[ 0 ] = bandList[ k ][ 0 ];
                firstPoint[ 1 ] = bandList[ k ][ 1 ];
                secondPoint[ 0 ] = bandList[ pointcount - 1 - k ][ 0 ];
                secondPoint[ 1 ] = bandList[ pointcount - 1 - k ][ 1 ];

                vec2.sub( firstPoint, secondPoint, curSide );
                if ( vec2.len( curSide ) > minlength * 2 ) {
                    exFlag = true;
                    break;
                }
            }

            if ( exFlag ) {// нашли слишком большую ширину - берем следующий отрезок

                sorttab[ minindex ].Length = 0;
                continue;
            }

            const point = curSide;
            exFlag = false;
            // Проверили, что линия ширины ленты лежит внутри метрики объекта
            for ( let k = 1; k < count - 1; k++ ) {

                firstPoint[ 0 ] = bandList[ k ][ 0 ];
                firstPoint[ 1 ] = bandList[ k ][ 1 ];
                secondPoint[ 0 ] = bandList[ pointcount - 1 - k ][ 0 ];
                secondPoint[ 1 ] = bandList[ pointcount - 1 - k ][ 1 ];

                // середина
                vec2.add( firstPoint, secondPoint, point );
                vec2.scale( point, 0.5 );
                if ( !PolygonAlgorithms.inPoly( coords, point ) ) { // снаружи
                    exFlag = true;
                    break;
                }

                // около начальной точки
                vec2.sub( firstPoint, secondPoint, point );
                vec2.scaleAndAdd( firstPoint, point, -0.01, point );

                if ( !PolygonAlgorithms.inPoly( coords, point ) ) { // снаружи
                    exFlag = true;
                    break;
                }

                // около последней точки
                vec2.sub( firstPoint, secondPoint, point );
                vec2.scaleAndAdd( secondPoint, point, 0.01, point );
                if ( !PolygonAlgorithms.inPoly( coords, point ) ) {// снаружи
                    exFlag = true;
                    break;
                }
            }

            if ( exFlag ) { // полученные линии вне крыши

                sorttab[ minindex ].Length = 0;
                continue;
            }

            return 1; // все правильно
        }
        return 0;
    }
}

/**
 * Класс шаблона горизонтального конуса по метрике
 * @class TemplateSQUARECYLINDER
 * @constructor TemplateSQUARECYLINDER
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateSQUARECYLINDER extends TemplateEMPTY {
    Part: FUNCTION3DSQUARECYLINDER['FUNCTIONPARAMS']['Part'];
    directLong: boolean;

    constructor( func: FUNCTION3DSQUARECYLINDER, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.height = functionParams.Height;
        this.relativeHeight = functionParams.RelativeHeight;

        this.Part = functionParams.Part;
        this.directLong = functionParams.Direct === DIRECTION_BY_LONGEST_SERGMENT.ALONG;
    }


    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }


        const globeShape = heightTile.projection.getGlobeShape();
        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );

        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        this.mPositions.length = 0;
        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        this.mCleanedPositions.length = 0;
        const cleanPositions: Vector3D[] = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        // const planeNormal = plane._normal;
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        if ( cleanPositions.length !== 4 || feature.geometry.type !== 'Polygon' )
            return [];


        // Pipeline Stage 4:  Set height
        const maxMetricHeight = this._fillHeights( heightTile, cleanPositions );


        //border polygon
        for ( let i = 0; i < cleanPositions.length; i++ ) {
            const position = cleanPositions[ i ];
            cleanPositions[ i ] = globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue );
        }


        const centerPoint = heightTile.getCenter();
        const centerPointVector = vec3.normalize( centerPoint, vec3.create() );

        let maxLengthStartIndex = -1;
        let maxLen = -1;
        const curVec = vec3.create();

        for ( let i = 0; i < cleanPositions.length; i++ ) {
            const curPoint = cleanPositions[ i ];
            let nextPoint;
            if ( i < cleanPositions.length - 1 ) {
                nextPoint = cleanPositions[ i + 1 ];
            } else {
                nextPoint = cleanPositions[ 0 ];
            }

            const curLen = vec3.len( vec3.sub( nextPoint, curPoint, curVec ) );
            if ( maxLen < curLen ) {
                maxLen = curLen;
                maxLengthStartIndex = i;
            }
        }


        if ( !this.directLong ) {
            maxLengthStartIndex++;
            if ( maxLengthStartIndex === cleanPositions.length ) {
                maxLengthStartIndex = 0;
            }
        }

        const newPositions: Vector3D[] = [];
        for ( let i = 0; i < cleanPositions.length; i++ ) {
            let index = i + maxLengthStartIndex;
            if ( index >= cleanPositions.length ) {
                index -= cleanPositions.length;
            }
            newPositions.push( cleanPositions[ index ] );
        }


        const sideVector = vec3.sub( newPositions[ 1 ], newPositions[ 0 ], vec3.create() );
        const curAxisX = vec3.normalize( sideVector, vec3.create() );
        const oppositeVector = vec3.sub( newPositions[ 3 ], newPositions[ 2 ], curVec );

        const height = Math.max( vec3.len( sideVector ), Math.abs( vec3.dot( oppositeVector, curAxisX ) ) );

        const curAxisY = vec3.normalize( vec3.cross( centerPointVector, curAxisX, vec3.create() ) );

        const radius = 0.5 * Math.max(
            Math.abs( vec3.dot( vec3.sub( newPositions[ 2 ], newPositions[ 1 ], curVec ), curAxisY ) ),
            Math.abs( vec3.dot( vec3.sub( newPositions[ 0 ], newPositions[ 3 ], curVec ), curAxisY ) )
        );

        const cylinderCenterPoint = vec3.add( newPositions[ 0 ], newPositions[ 3 ], vec3.create() );
        vec3.scale( cylinderCenterPoint, 0.5 );

        const rotateVector = vec3.cross( vec3.UNITY, curAxisX, vec3.create() );
        const rotateAngle = Math.acos( vec3.dot( vec3.UNITY, curAxisX ) );

        const element: ELEMENT3DCYLINDER = {
            'Type': ELEMENT3DTYPE.IMG3D_CYLINDER,
            'GEOMETRY': {
                'Point': {
                    'X': 0,
                    'Y': 0,
                    'Z': 0
                },
                'Rotate': {
                    'X': rotateVector[ 0 ],
                    'Y': rotateVector[ 1 ],
                    'Z': rotateVector[ 2 ],
                    'Angle': Trigonometry.toDegrees( rotateAngle )
                },
                'Part': this.Part,
                'Radius': radius,
                'RadiusH': radius,
                'Height': height
            }
        };

        const cylinder = new IMG3DCYLINDER( element );
        const cylinderMesh = cylinder.createElementMesh( [], PAINT_FLAG.BOTH, textureParams );

        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const normalAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];

        const positions = cylinderMesh.vertexList;
        for ( let j = 0; j < positions.length; j++ ) {

            // fill positions WC
            const point = vec3.add( positions[ j ], cylinderCenterPoint, vec3.create() );
            // RTC coordinates
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            // fill materials
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }


        // fill normals
        const normals = cylinderMesh.normalList;
        for ( let j = 0; j < normals.length; j++ ) {
            normalAttributeValues.push( normals[ j ] );
        }

        // fill texture coords
        const textureCoords = cylinderMesh.textureCoordsList;
        for ( let j = 0; j < textureCoords.length; j++ ) {
            const curTextureCoordAttributeValue = vec3.fromPoint( textureCoords[ j ] );
            textureCoordAttributeValues.push( curTextureCoordAttributeValue );
        }

        const indices = cylinderMesh.indexList;
        for ( let j = 0; j < indices.length; j++ ) {
            indicesAttributeValues.push( indices[ j ] );
        }


        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }
        const mesh = new Mesh();
        mesh.setPrimitiveType( cylinderMesh.primitiveType );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}

/**
 * Класс шаблона плоской линии
 * @class TemplateFLATLINE
 * @constructor TemplateFLATLINE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateFLATLINE extends TemplateEMPTY {

    constructor( func: FUNCTION3DVERTBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        const globeShape = heightTile.projection.getGlobeShape();

        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );

        const positionsGeoJSON = feature.getLineGeometryCoordinates();
        const centerPoint = heightTile.getCenter();

        const descObject = this.getDescriptionObject();
        let templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
        }

        this.mPositions.length = 0;
        let maxMetricHeight = -12000;
        for ( let i = 0; i < positionsGeoJSON.length; i++ ) {
            const position = positionsGeoJSON[ i ];
            if ( position.length === 3 ) {
                TemplateEMPTY.mHeights[ i ] = position[ 2 ];
                maxMetricHeight = Math.max( maxMetricHeight, TemplateEMPTY.mHeights[ i ] );
            }
        }


        const cleanPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        const resultPositions = cleanPositions;

        if ( maxMetricHeight === -12000 ) {
            maxMetricHeight = this._fillHeights( heightTile, resultPositions );
        }

        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const normalAttributeValues: Vector3D[] = [];
        const materialAttributeValues: number[] = [];
        const indicesAttributeValues: number[] = [];

        for ( let i = 0; i < resultPositions.length; i++ ) {
            const position = resultPositions[ i ];

            // fill positions WC
            // scale to surface
            let point;
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE ) {
                point = globeShape.scaleToGeocentricSurface( position, maxMetricHeight + relativeHeightValue );
            } else {
                point = globeShape.scaleToGeocentricSurface( position, TemplateEMPTY.mHeights[ i ] + relativeHeightValue );
            }
            // RTC coordinates
            vec3.sub( point, centerPoint );
            positionAttributeValues.push( point );

            // fill normalized normals
            normalAttributeValues.push( position );

            // fill materials
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }


            //fill indices
            if ( i < resultPositions.length - 1 ) {
                indicesAttributeValues.push( i );
                indicesAttributeValues.push( i + 1 );
            } else if ( feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon' ) {
                indicesAttributeValues.push( i );
                indicesAttributeValues.push( 0 );
            }
        }

        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Lines );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );

    }
}


/**
 * Класс шаблона заданного сечения вдоль линии
 * @class TemplateSECTIONBYLINE
 * @constructor TemplateSECTIONBYLINE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateSECTIONBYLINE extends TemplateEMPTY {

    private readonly radius: FUNCTION3DSECTIONBYLINE['FUNCTIONPARAMS']['Radius'];
    private readonly type: FUNCTION3DSECTIONBYLINE['FUNCTIONPARAMS']['Type'];
    private readonly begin: boolean;
    private readonly end: boolean;
    private readonly Part = VISIBLE_PART.IMG3D_SIDES;

    constructor( func: FUNCTION3DSECTIONBYLINE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.radius = functionParams.Radius;
        this.type = functionParams.Type;

        this.begin = !!(VISIBLE_PART.IMG3D_BEGIN & functionParams.PlugFlag);
        this.end = !!(VISIBLE_PART.IMG3D_END & functionParams.PlugFlag);
    }

    /** Функция получения радиуса сечения
     * @method getRadius
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} Значение радиуса сечения
     */
    getRadius( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.radius, objectProperties );
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        //на данный момент доступно только сечение круга
        if ( this.type !== SECT_TYPE.SECT_CIRCLE ) {
            return [];
        }

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }


        const globeShape = heightTile.projection.getGlobeShape();

        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );
        const radiusValue = this.getRadius( feature.properties );
        if ( radiusValue === 0 ) {
            return [];
        }

        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        this.mPositions.length = 0;
        const cleanPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        // Pipeline Stage 4:  Set height
        const maxMetricHeight = this._fillHeights( heightTile, cleanPositions );


        //scale points
        for ( let i = 0; i < cleanPositions.length; i++ ) {
            let height;
            if ( this.surfaceFlag !== SURFACE_TYPE.ALLBYRELIEF ) {
                height = maxMetricHeight + relativeHeightValue;
            } else {
                height = TemplateEMPTY.mHeights[ i ] + relativeHeightValue;

            }
            cleanPositions[ i ] = globeShape.scaleToGeocentricSurface( cleanPositions[ i ], height );
        }


        const centerPoint = heightTile.getCenter();
        // RTC coordinates
        for ( let i = 0; i < cleanPositions.length; i++ ) {
            const point = cleanPositions[ i ];
            vec3.sub( point, centerPoint );
        }


        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const normalAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];


        for ( let i = 0; i < cleanPositions.length - 1; i++ ) {

            const sideVector = vec3.sub( cleanPositions[ i + 1 ], cleanPositions[ i ], vec3.create() );
            const curAxisX = vec3.normalize( sideVector, vec3.create() );

            const height = vec3.len( sideVector );

            const cylinderCenterPoint = cleanPositions[ i ];

            const rotateVector = vec3.cross( vec3.UNITY, curAxisX, vec3.create() );
            const rotateAngle = Math.acos( vec3.dot( vec3.UNITY, curAxisX ) );

            const element: ELEMENT3DCYLINDER = {
                'Type': ELEMENT3DTYPE.IMG3D_CYLINDER,
                'GEOMETRY': {
                    'Point': {
                        'X': 0,
                        'Y': 0,
                        'Z': 0
                    },
                    'Rotate': {
                        'X': rotateVector[ 0 ],
                        'Y': rotateVector[ 1 ],
                        'Z': rotateVector[ 2 ],
                        'Angle': Trigonometry.toDegrees( rotateAngle )
                    },
                    'Part': this.Part,
                    'Radius': radiusValue,
                    'RadiusH': radiusValue,
                    'Height': height
                }
            };

            const cylinder = new IMG3DCYLINDER( element );
            const cylinderMesh = cylinder.createElementMesh( [], undefined, textureParams );

            const addIndex = positionAttributeValues.length;

            const positions = cylinderMesh.vertexList;
            for ( let j = 0; j < positions.length; j++ ) {
                const point = vec3.add( positions[ j ], cylinderCenterPoint, vec3.create() );
                positionAttributeValues.push( point );
            }


            const normals = cylinderMesh.normalList;
            for ( let j = 0; j < normals.length; j++ ) {
                normalAttributeValues.push( normals[ j ] );
            }


            const textureCoords = cylinderMesh.textureCoordsList;
            for ( let j = 0; j < textureCoords.length; j++ ) {
                const curTextureCoordAttributeValue = vec3.fromPoint( textureCoords[ j ] );
                textureCoordAttributeValues.push( curTextureCoordAttributeValue );
            }

            const indices = cylinderMesh.indexList;
            for ( let j = 0; j < indices.length; j++ ) {
                indicesAttributeValues.push( indices[ j ] + addIndex );
            }

        }
        let start;
        if ( this.begin ) {
            start = 0;
        } else {
            start = 1;
        }

        let end;
        if ( this.end ) {
            end = cleanPositions.length;
        } else {
            end = cleanPositions.length - 1;
        }

        for ( let i = start; i < end; i++ ) {

            const element: ELEMENT3DSPHERE = {
                'Type': ELEMENT3DTYPE.IMG3D_SPHERE,
                'GEOMETRY': {
                    'Point': {
                        'X': cleanPositions[ i ][ 0 ],
                        'Y': cleanPositions[ i ][ 1 ],
                        'Z': cleanPositions[ i ][ 2 ]
                    },
                    'Rotate': {
                        'X': 0,
                        'Y': 0,
                        'Z': 0,
                        'Angle': 0
                    },
                    'Radius': radiusValue
                }
            };

            if ( textureParams ) {
                const sphere = new IMG3DSPHERE( element );
                sphere.PARTS = 6;
                const sphereMesh = sphere.createElementMesh( [], PAINT_FLAG.BOTH, textureParams );

                const addIndex = positionAttributeValues.length;

                const positions = sphereMesh.vertexList;
                for ( let j = 0; j < positions.length; j++ ) {
                    positionAttributeValues.push( positions[ j ] );
                }

                const normals = sphereMesh.normalList;
                for ( let j = 0; j < normals.length; j++ ) {
                    normalAttributeValues.push( normals[ j ] );
                }

                const textureCoords = sphereMesh.textureCoordsList;
                for ( let j = 0; j < textureCoords.length; j++ ) {
                    const curTextureCoordAttributeValue = vec3.fromPoint( textureCoords[ j ] );
                    textureCoordAttributeValues.push( curTextureCoordAttributeValue );
                }

                const indices = sphereMesh.indexList;
                for ( let j = 0; j < indices.length; j++ ) {
                    indicesAttributeValues.push( indices[ j ] + addIndex );
                }
            }
        }


        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }

        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }
        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}

/**
 * Класс шаблона склона над площадным объектом
 * @class TemplateSLOPEONSQUARE
 * @constructor TemplateSLOPEONSQUARE
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateSLOPEONSQUARE extends TemplateEMPTY {

    private readonly extension: FUNCTION3DSLOPEONSQUARE['FUNCTIONPARAMS']['Extension'];
    private readonly bottomExtension: boolean;
    private readonly rightExtension: boolean;
    private readonly topExtension: boolean;
    private readonly leftExtension: boolean;
    private readonly extensionFlag: boolean;

    private readonly top: boolean;
    private readonly right: boolean;
    private readonly left: boolean;
    private readonly back: boolean;

    constructor( func: FUNCTION3DSLOPEONSQUARE, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.extension = functionParams.Extension;

        this.bottomExtension = !!(EXTENSION.IMG3D_EXTENSION1 & functionParams.ExtensionPart);
        this.rightExtension = !!(EXTENSION.IMG3D_EXTENSION2 & functionParams.ExtensionPart);
        this.topExtension = !!(EXTENSION.IMG3D_EXTENSION3 & functionParams.ExtensionPart);
        this.leftExtension = !!(EXTENSION.IMG3D_EXTENSION4 & functionParams.ExtensionPart);

        this.extensionFlag = this.bottomExtension || this.rightExtension || this.topExtension || this.leftExtension;

        if ( functionParams.Part === VISIBLE_PART.IMG3D_ALL ) {
            this.top = this.right = this.left = this.back = true;
        } else {
            this.top = !!(VISIBLE_PART.IMG3D_TOP & functionParams.Part);
            this.right = !!(VISIBLE_PART.IMG3D_RIGHTSIDE & functionParams.Part);
            this.left = !!(VISIBLE_PART.IMG3D_LEFTSIDE & functionParams.Part);
            this.back = !!(VISIBLE_PART.IMG3D_BACK & functionParams.Part);
        }
    }

    /** Функция получения выноса крыши
     * @method getExtension
     * @public
     * @param objectProperties {Object} Свойства объекта карты
     * @result {Number} Значение выноса крыши
     */
    getExtension( objectProperties: FeatureProperties ) {
        return TemplateEMPTY.getImg3dValue( this.extension, objectProperties );
    }


    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @param level {number} Уровень шаблона
     * @result {Array|undefined} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile, level: number ) {

        let paintFlag = false;
        const descObject = this.getDescriptionObject();
        let textureParams, templateDescription;
        if ( descObject ) {
            templateDescription = descObject.getDescription( feature.properties );
            textureParams = descObject.getTextureParams( feature.properties );
            if ( templateDescription.paintFlag === PAINT_FLAG.BOTH ) {
                paintFlag = true;
            }
        }


        const globeShape = heightTile.projection.getGlobeShape();

        const relativeHeightValue = this.getRelativeHeight( feature.properties, level );
        const heightValue = this.getHeight( feature.properties );


        const positionsGeoJSON = TriangulatePanoramaAlgorithm.start( feature, heightTile );

        this.mPositions.length = 0;
        const normalizedPositions = this.computeNormalizedPositions( positionsGeoJSON, this.mPositions );
        this.mCleanedPositions.length = 0;
        const cleanPositions = PolygonAlgorithms.cleanup( normalizedPositions, this.mCleanedPositions );
        // Pipeline Stage 1b:  Clean up - Swap winding order
        const plane = new EllipsoidTangentPlane( globeShape, cleanPositions );
        const positionsOnPlane = plane.computePositionsOnPlane( cleanPositions );
        if ( PolygonAlgorithms.computeWindingOrder( positionsOnPlane ) === WindingOrder.Clockwise ) {
            cleanPositions.reverse(); //Координаты вершин полигона без учета высоты
        }

        if ( (cleanPositions.length !== 4 && cleanPositions.length !== 3) || feature.geometry.type !== 'Polygon' )
            return [];


        // Pipeline Stage 4:  Set height
        const maxMetricHeight = this._fillHeights( heightTile, cleanPositions );


        //scale points
        for ( let i = 0; i < cleanPositions.length; i++ ) {
            let height;
            if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE ) {
                height = maxMetricHeight + relativeHeightValue;
            } else {
                height = TemplateEMPTY.mHeights[ i ] + relativeHeightValue;

            }
            cleanPositions[ i ] = globeShape.scaleToGeocentricSurface( cleanPositions[ i ], height );
        }


        const centerPoint = heightTile.getCenter();


        // fill attributes
        const positionAttributeValues: Vector3D[] = [];
        const indicesAttributeValues: number[] = [];
        const materialAttributeValues: number[] = [];
        const textureCoordAttributeValues: Vector3D[] = [];


        const posValues: Vector3D[] = [];
        for ( let i = 0; i < 3; i++ ) {
            posValues.push( cleanPositions[ i ] );
        }
        let extensionValue;
        if ( this.extensionFlag ) {
            extensionValue = this.getExtension( feature.properties );
        } else {
            extensionValue = 0;
        }

        if ( heightValue === 0 ) {
            positionAttributeValues.push( posValues[ 0 ] );
            positionAttributeValues.push( posValues[ 1 ] );
            positionAttributeValues.push( posValues[ 2 ] );
            let textureHeight = 1;
            if ( textureParams ) {
                const maxWidth = vec3.len( vec3.sub( posValues[ 1 ], posValues[ 0 ], vec3.create() ) );
                const maxHeight = vec3.len( vec3.sub( posValues[ 2 ], posValues[ 1 ], vec3.create() ) );

                let textureWidth = 1;
                if ( textureParams.gValue !== 0 ) {
                    if ( textureParams.gUnit === MEASURE.texMetr ) {
                        textureWidth = maxWidth / textureParams.gValue;
                    } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                        textureWidth = textureParams.gValue;
                    }
                }
                if ( textureParams.vValue !== 0 ) {
                    if ( textureParams.vUnit === MEASURE.texMetr ) {
                        textureHeight = maxHeight / textureParams.vValue;
                    } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                        textureHeight = textureParams.vValue;
                    }
                }

                textureCoordAttributeValues.push( [0, 0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [textureWidth, 0, textureParams.transparentTex] );
                textureCoordAttributeValues.push( [textureWidth, textureHeight, textureParams.transparentTex] );
            }
            indicesAttributeValues.push( 0 );
            indicesAttributeValues.push( 1 );
            indicesAttributeValues.push( 2 );

            if ( cleanPositions.length === 4 ) {
                positionAttributeValues.push( cleanPositions[ 3 ] );
                if ( textureParams ) {
                    textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );
                }
                indicesAttributeValues.push( 0 );
                indicesAttributeValues.push( 2 );
                indicesAttributeValues.push( 3 );
            }

            // RTC coordinates
            for ( let i = 0; i < positionAttributeValues.length; i++ ) {
                const point = positionAttributeValues[ i ];
                vec3.sub( point, centerPoint );
            }

        } else {


            const geoPoint = globeShape.toGeodetic3d( cleanPositions[ 2 ] );
            geoPoint.setHeight( geoPoint.getHeight() + heightValue );
            posValues.push( globeShape.toVector3d( geoPoint ) );

            if ( cleanPositions.length === 4 ) {
                posValues.push( cleanPositions[ 3 ] );
                globeShape.toGeodetic3d( cleanPositions[ 3 ], geoPoint );
                geoPoint.setHeight( geoPoint.getHeight() + heightValue );
                posValues.push( globeShape.toVector3d( geoPoint ) );
            }


            // RTC coordinates
            for ( let i = 0; i < posValues.length; i++ ) {
                const point = posValues[ i ];
                vec3.sub( point, centerPoint );
            }
            let textureWidth = 1, textureHeight = 1;
            if ( textureParams ) {
                if ( textureParams.gValue !== 0 ) {
                    if ( textureParams.gUnit === MEASURE.texUnit ) {
                        textureWidth = textureParams.gValue;
                    }
                }
                if ( textureParams.vValue !== 0 ) {
                    if ( textureParams.vUnit === MEASURE.texUnit ) {
                        textureHeight = textureParams.vValue;
                    }
                }
            }


            if ( this.top ) {


                const startIndex = positionAttributeValues.length;
                positionAttributeValues.push( posValues[ 0 ].slice() as typeof posValues[ 0 ] );
                positionAttributeValues.push( posValues[ 1 ].slice() as typeof posValues[ 1 ] );
                positionAttributeValues.push( posValues[ 3 ].slice() as typeof posValues[ 3 ] );

                indicesAttributeValues.push( startIndex );
                indicesAttributeValues.push( startIndex + 1 );
                indicesAttributeValues.push( startIndex + 2 );
                if ( cleanPositions.length === 4 ) {
                    positionAttributeValues.push( posValues[ 5 ].slice() as typeof posValues[ 5 ] );
                    indicesAttributeValues.push( startIndex );
                    indicesAttributeValues.push( startIndex + 2 );
                    indicesAttributeValues.push( startIndex + 3 );
                }


                if ( extensionValue !== 0 ) {
                    let leftUpVector = vec3.create(), topRightVector = vec3.create();
                    if ( cleanPositions.length === 4 ) {
                        leftUpVector = vec3.normalize( vec3.sub( posValues[ 5 ], posValues[ 0 ], leftUpVector ) );
                        topRightVector = vec3.normalize( vec3.sub( posValues[ 3 ], posValues[ 5 ], topRightVector ) );
                    } else {
                        leftUpVector = vec3.normalize( vec3.sub( posValues[ 3 ], posValues[ 0 ], leftUpVector ) );
                    }
                    const rightUpVector = vec3.normalize( vec3.sub( posValues[ 3 ], posValues[ 1 ], vec3.create() ) );
                    const bottomRightVector = vec3.normalize( vec3.sub( posValues[ 1 ], posValues[ 0 ], vec3.create() ) );

                    if ( this.bottomExtension ) {
                        vec3.scaleAndAdd( positionAttributeValues[ 0 ], leftUpVector, -extensionValue, positionAttributeValues[ 0 ] );
                        vec3.scaleAndAdd( positionAttributeValues[ 1 ], rightUpVector, -extensionValue, positionAttributeValues[ 1 ] );
                    }


                    if ( this.rightExtension ) {
                        vec3.scaleAndAdd( positionAttributeValues[ 1 ], bottomRightVector, extensionValue, positionAttributeValues[ 1 ] );
                        if ( cleanPositions.length === 4 ) {
                            vec3.scaleAndAdd( positionAttributeValues[ 2 ], topRightVector, extensionValue, positionAttributeValues[ 2 ] );
                        }
                    }

                    if ( this.topExtension ) {
                        vec3.scaleAndAdd( positionAttributeValues[ 2 ], rightUpVector, extensionValue, positionAttributeValues[ 2 ] );
                        if ( cleanPositions.length === 4 ) {
                            vec3.scaleAndAdd( positionAttributeValues[ 3 ], leftUpVector, extensionValue, positionAttributeValues[ 3 ] );
                        } else {
                            vec3.scaleAndAdd( positionAttributeValues[ 2 ], leftUpVector, extensionValue, positionAttributeValues[ 2 ] );
                        }
                    }

                    if ( this.leftExtension ) {
                        vec3.scaleAndAdd( positionAttributeValues[ 0 ], bottomRightVector, -extensionValue, positionAttributeValues[ 0 ] );

                        if ( cleanPositions.length === 4 ) {
                            vec3.scaleAndAdd( positionAttributeValues[ 3 ], topRightVector, -extensionValue, positionAttributeValues[ 3 ] );
                        }
                    }
                }


                if ( textureParams ) {


                    if ( textureParams.gUnit === MEASURE.texMetr ) {
                        const width0 = vec3.len( vec3.sub( positionAttributeValues[ startIndex + 1 ], positionAttributeValues[ startIndex ], vec3.create() ) );
                        textureWidth = width0 / textureParams.gValue;
                    }
                    if ( textureParams.vUnit === MEASURE.texMetr ) {
                        const length0 = vec3.len( vec3.sub( positionAttributeValues[ startIndex + 2 ], positionAttributeValues[ startIndex + 1 ], vec3.create() ) );
                        textureHeight = length0 / textureParams.vValue;
                    }

                    textureCoordAttributeValues.push( [0, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, textureHeight, textureParams.transparentTex] );
                    if ( cleanPositions.length === 4 ) {
                        textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );
                    }
                }
            }

            if ( this.right ) {

                const startIndex = positionAttributeValues.length;
                positionAttributeValues.push( posValues[ 1 ] );
                positionAttributeValues.push( posValues[ 2 ] );
                positionAttributeValues.push( posValues[ 3 ] );
                indicesAttributeValues.push( startIndex );
                indicesAttributeValues.push( startIndex + 1 );
                indicesAttributeValues.push( startIndex + 2 );


                if ( textureParams ) {
                    if ( textureParams.vUnit === MEASURE.texMetr ) {
                        textureHeight = heightValue / textureParams.vValue;
                    }

                    if ( textureParams.gUnit === MEASURE.texMetr ) {
                        const width0 = vec3.len( vec3.sub( positionAttributeValues[ startIndex + 1 ], positionAttributeValues[ startIndex ], vec3.create() ) );
                        textureWidth = width0 / textureParams.gValue;
                    }

                    textureCoordAttributeValues.push( [0, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, textureHeight, textureParams.transparentTex] );

                }


            }

            if ( this.back && cleanPositions.length === 4 ) {
                const startIndex = positionAttributeValues.length;
                positionAttributeValues.push( posValues[ 2 ] );
                positionAttributeValues.push( posValues[ 4 ] );
                positionAttributeValues.push( posValues[ 5 ] );
                indicesAttributeValues.push( startIndex );
                indicesAttributeValues.push( startIndex + 1 );
                indicesAttributeValues.push( startIndex + 2 );
                positionAttributeValues.push( posValues[ 3 ] );
                indicesAttributeValues.push( startIndex );
                indicesAttributeValues.push( startIndex + 2 );
                indicesAttributeValues.push( startIndex + 3 );


                if ( textureParams ) {
                    if ( textureParams.vUnit === MEASURE.texMetr ) {
                        textureHeight = heightValue / textureParams.vValue;
                    }

                    if ( textureParams.gUnit === MEASURE.texMetr ) {
                        const width0 = vec3.len( vec3.sub( positionAttributeValues[ startIndex + 1 ], positionAttributeValues[ startIndex ], vec3.create() ) );
                        textureWidth = width0 / textureParams.gValue;
                    }

                    textureCoordAttributeValues.push( [0, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [textureWidth, textureHeight, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );

                }


            }

            if ( this.left ) {
                const startIndex = positionAttributeValues.length;

                if ( cleanPositions.length === 3 ) {
                    positionAttributeValues.push( posValues[ 0 ] );
                    positionAttributeValues.push( posValues[ 3 ] );
                    positionAttributeValues.push( posValues[ 2 ] );
                    indicesAttributeValues.push( startIndex );
                    indicesAttributeValues.push( startIndex + 1 );
                    indicesAttributeValues.push( startIndex + 2 );
                } else {
                    positionAttributeValues.push( posValues[ 0 ] );
                    positionAttributeValues.push( posValues[ 5 ] );
                    positionAttributeValues.push( posValues[ 4 ] );
                    indicesAttributeValues.push( startIndex );
                    indicesAttributeValues.push( startIndex + 1 );
                    indicesAttributeValues.push( startIndex + 2 );
                }

                if ( textureParams ) {
                    if ( textureParams.vUnit === MEASURE.texMetr ) {
                        textureHeight = heightValue / textureParams.vValue;
                    }

                    if ( textureParams.gUnit === MEASURE.texMetr ) {
                        const width0 = vec3.len( vec3.sub( positionAttributeValues[ startIndex + 2 ], positionAttributeValues[ startIndex ], vec3.create() ) );
                        textureWidth = width0 / textureParams.gValue;
                    }

                    textureCoordAttributeValues.push( [textureWidth, 0, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [0, textureHeight, textureParams.transparentTex] );
                    textureCoordAttributeValues.push( [0, 0, textureParams.transparentTex] );

                }
            }
        }

        // fill normals
        const normalAttributeValues = this._createNormals( indicesAttributeValues, positionAttributeValues );

        // fill materials
        for ( let i = 0; i < positionAttributeValues.length; i++ ) {
            if ( templateDescription && (templateDescription.color || templateDescription.material) ) {
                materialAttributeValues.push( 0 );
            } else {
                materialAttributeValues.push( -1 );
            }
        }


        if ( paintFlag ) {
            for ( let i = indicesAttributeValues.length - 1; i >= 0; i-- ) {
                indicesAttributeValues.push( indicesAttributeValues[ i ] );
            }
        }

        const mesh = new Mesh();
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( positionAttributeValues );
        mesh.addAttribute( positionsAttribute );

        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalAttributeValues );
        mesh.addAttribute( normalsAttribute );

        const textureCoordAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
        textureCoordAttribute.setValues( textureCoordAttributeValues );
        mesh.addAttribute( textureCoordAttribute );

        const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
        materialsAttribute.setValues( materialAttributeValues );
        mesh.addAttribute( materialsAttribute );

        const indicesAttribute = new Indices( IndicesType.uByte );
        indicesAttribute.setValues( indicesAttributeValues );
        indicesAttribute.validateType();
        mesh.setIndices( indicesAttribute );

        return this.createFeatureMeshList( mesh.toJSON(), feature );
    }
}


/**
 * Класс шаблона подписи
 * @class TemplateTEXT
 * @constructor TemplateTEXT
 * @param func {Object} Описание из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на родителя
 */
class TemplateTEXT extends TemplateEMPTY {
    private readonly vector: FUNCTION3DTEXT['FUNCTIONPARAMS']['Vector'];
    private readonly _meshArrays: TextMeshArrays = {
        instancedOffsetPosArray: [],
        instancedTextureParamsArray: [],
        instancedNormalArray: [],
        instancedRightArray: [],
        instancedUpArray: []
    };

    private static readonly METRICS = FONT_METRICS;

    constructor( func: FUNCTION3DTEXT, mainObject: Object3dTemplate ) {
        super( func, mainObject );
        const functionParams = func.FUNCTIONPARAMS;
        this.vector = functionParams.Vector;
    }

    /** Функция создания меша объекта карты
     * @method createMesh
     * @public
     * @param feature {Object} Объект карты в формате GeoJSON
     * @param heightTile {HeightTile} Тайл высот
     * @result {Array} Массив мешей объекта карты
     */
    createMesh( feature: Feature, heightTile: HeightTile ) {

        let description;
        for ( let i = 0; i < this.nodeList.length; i++ ) {
            const descriptionList = this.nodeList[ i ].descriptionList;
            if ( descriptionList[ 0 ] ) {
                description = descriptionList[ 0 ].getDescription( feature.properties );
            }
            if ( description ) {
                break;
            }
        }
        if ( description ) {
            description.guid = Utils.generateGUID();
            description.textureId = TemplateTEXT.METRICS.family + TemplateTEXT.METRICS.style;
        }

        let titleArray = feature.properties.title!;
        let featureGeometry: MultiLineGeometryType;
        const curGeometry = feature.getGeometry();
        if ( !Array.isArray( titleArray ) && curGeometry.type === MapObjectType.LineString ) {
            titleArray = [titleArray];
            featureGeometry = {
                type: MapObjectType.MultiLineString,
                coordinates: [curGeometry.coordinates] as MultiLineGeometryType['coordinates']
            };
        } else {
            featureGeometry = curGeometry as MultiLineGeometryType;
        }
        let smooth = 1;
        if ( description && description.smooth ) {
            smooth = description.smooth + 1;
        }
        const size = feature.properties.fontSize || this.getHeight( feature.properties ) || TemplateTEXT.METRICS.size;
        const scale = size / TemplateTEXT.METRICS.size;   // масштаб (отношение текущего размера шрифта к размеру шрифта создания SDF атласа)

        const vector = this.vector;
        let vectorMode = 0;

        if ( (vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYOBSER ) {
            vectorMode = 1;
        } else if ( (vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYOBSERVER ) {
            vectorMode = 2;
        }

        if ( (vector | VECTOR_ORIENTATION3D.VM_NOSCALE) === vector ) {
            vectorMode += 3;
        }

        const support = {
            normal: vec4.create(),
            rightVector: vec3.create(),
            upVector: vec4.create(),
            normalBack: vec4.create()
        };

        const featureMeshList: FeatureMesh[] = [];

        for ( let t = 0; t < titleArray.length; t++ ) {
            const title = titleArray[ t ];
            const coordinates = featureGeometry.coordinates[ t ];

            const featureMesh = this._createSymbolMesh( coordinates, feature.properties, heightTile, support );

            if ( coordinates.length > 1 ) {
                support.normal[ 3 ] = vectorMode;
            } else {
                support.normal[ 3 ] = 4;
            }

            const meshArrays = this._meshArrays;
            meshArrays.instancedOffsetPosArray.length = 0;
            meshArrays.instancedTextureParamsArray.length = 0;
            meshArrays.instancedNormalArray.length = 0;
            meshArrays.instancedRightArray.length = 0;
            meshArrays.instancedUpArray.length = 0;

            const stringArray = title.split( '\n' ) as unknown as FontCharacter[][];
            let length = 0;
            let height = 0;
            for ( let s = 0; s < stringArray.length; s++ ) {
                const word = stringArray[ s ];
                length = Math.max( this._textLength( word, scale, smooth ), length );
                height += this._textHeight( word, scale );
            }

            const pen = { x: -length * 0.5, y: height, back: false };
            for ( let s = 0; s < stringArray.length; s++ ) {
                const word = stringArray[ s ];
                pen.x = -length * 0.5;
                pen.y -= this._textHeight( word, scale );
                pen.back = false;

                for ( let i = 0; i < word.length; i++ ) {
                    const chr = word[ i ];
                    this._createGlyph( chr, pen, scale, smooth, support, meshArrays );
                }

                if ( support.normal[ 3 ] === 0 || support.normal[ 3 ] === 3 ) {
                    pen.x += length;
                    pen.x -= this._textLength( word, scale, smooth );
                    pen.back = true;
                    support.normalBack = support.normalBack || vec4.create();
                    support.normalBack[ 0 ] = -support.normal[ 0 ];
                    support.normalBack[ 1 ] = -support.normal[ 1 ];
                    support.normalBack[ 2 ] = -support.normal[ 2 ];
                    support.normalBack[ 3 ] = support.normal[ 3 ];

                    for ( let i = 0; i < word.length; i++ ) {
                        const chr = word[ i ];
                        this._createGlyph( chr, pen, scale, smooth, support, meshArrays );
                    }
                }
            }

            const instancedOffsetPosAttribute = new VertexAttribute( 'aVertexOffset', VertexAttributeType.Float, 4 );
            instancedOffsetPosAttribute.setValues( meshArrays.instancedOffsetPosArray.slice() );
            const instancedTextureParamsAttribute = new VertexAttribute( 'aVertexTextureParams', VertexAttributeType.Float, 4 );
            instancedTextureParamsAttribute.setValues( meshArrays.instancedTextureParamsArray.slice() );

            const instancedNormalAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 4 );
            instancedNormalAttribute.setValues( meshArrays.instancedNormalArray.slice() );
            const instancedUpAttribute = new VertexAttribute( 'aVertexUp', VertexAttributeType.Float, 4 );
            instancedUpAttribute.setValues( meshArrays.instancedUpArray.slice() );
            const instancedRightAttribute = new VertexAttribute( 'aVertexRight', VertexAttributeType.Float, 3 );
            instancedRightAttribute.setValues( meshArrays.instancedRightArray.slice() );


            const meshInstanced = new Mesh();
            meshInstanced.setPrimitiveType( PrimitiveType.Triangles );
            meshInstanced.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
            meshInstanced.addAttribute( instancedOffsetPosAttribute );
            meshInstanced.addAttribute( instancedTextureParamsAttribute );
            meshInstanced.addAttribute( instancedNormalAttribute );
            meshInstanced.addAttribute( instancedUpAttribute );
            meshInstanced.addAttribute( instancedRightAttribute );
            const meshText = meshInstanced.toJSON();

            featureMeshList.push( { ...featureMesh, meshText, description } );

        }

        return featureMeshList;
    }


    /**
     * Функция создания аттрибутов символа текста
     * @method _createGlyph
     * @private
     * @param chr {string} Буква из семантики объекта
     * @param pen {object} Положение буквы в тексте
     * @param scale {number} Масштаб шрифта
     * @param smooth {number} Толщина контура
     * @param support {object} Вспомогательные параметры
     * @param meshArrays {object} Массивы вершинных атрибутов
     */
    _createGlyph( chr: FontCharacter, pen: {
        x: number;
        y: number;
        back: boolean;
    }, scale: number, smooth: number, support: TextSupportParams, meshArrays: TextMeshArrays ) {

        const metric = TemplateTEXT.METRICS.chars[ chr ];
        if ( metric ) {
            const {
                instancedOffsetPosArray,
                instancedTextureParamsArray,
                instancedNormalArray,
                instancedRightArray,
                instancedUpArray
            } = meshArrays;

            const buffer = TemplateTEXT.METRICS.buffer;       // буферная зона буквы
            const imageWidth = TemplateTEXT.METRICS.width;    // ширина текстуры в px
            const imageHeight = TemplateTEXT.METRICS.height;  // высота текстуры в px

            const factor = 1;
            const back = pen.back ? -1 : 1;

            let width = metric[ 0 ];          // ширина буквы в px
            let height = metric[ 1 ];         // высота буквы в px
            const horiBearingX = metric[ 2 ];   // сдвиг от левого верхнего угла области символа до левого нижнего угла начала символа по X
            const horiBearingY = metric[ 3 ];   // сдвиг от левого верхнего угла области символа до левого нижнего угла начала символа по Y
            const horiAdvance = metric[ 4 ] + 1.5 * smooth;    // расстояние между буквами (сколько по X занимает символ в текстовой строке)
            const posX = metric[ 5 ];           // координата X левого верхнего угла области символа
            const posY = metric[ 6 ];           // координата Y левого верхнего угла области символа

            if ( width > 0 && height > 0 ) {
                width += buffer * 2;
                height += buffer * 2;

                // Add a quad (= two triangles) per glyph.
                //(5)2----4
                //   |\   |
                //   | \  |
                //   |  \ |
                //   |   \|
                //   0----1(3)
                instancedOffsetPosArray.push( [
                    factor * (pen.x + ((horiBearingX - buffer) * back * scale)), // Смещение по X
                    factor * (pen.y + (horiBearingY - height) * scale),   // Смещение по Y
                    factor * width * back * scale,                               // Ширина символа
                    factor * height * scale                               // Высота символа
                ] );

                instancedTextureParamsArray.push( [
                    posX / imageWidth,                                      // Смещение по X
                    (imageHeight - (posY + height)) / imageHeight,          // Смещение по Y
                    width / imageWidth,                                     // Ширина символа
                    height / imageHeight                                    // Высота символа
                ] );
                let normal = support.normal;
                if ( pen.back ) {
                    normal = support.normalBack;
                }
                instancedNormalArray.push( normal );
                instancedRightArray.push( support.rightVector );
                instancedUpArray.push( support.upVector );
            }

            // pen.x += Math.ceil(horiAdvance * scale);
            pen.x = pen.x + horiAdvance * back * scale;
        }
    }


    /** Функция создания меша символа текста
     * @method _createSymbolMesh
     * @public
     * @param coordinates {array} Координаты положения текста на карте
     * @param properties {Object} Свойства объекта
     * @param heightTile {HeightTile} Тайл высот
     * @param support {object} Вспомогательные параметры
     * @param level {number} Уровень шаблона
     * @result {Array} Массив мешей объекта карты
     */
    _createSymbolMesh( coordinates: Vector2or3[ ], properties: FeatureProperties, heightTile: HeightTile, support: TextSupportParams, level: number = 0 ) {


        const centerPoint = heightTile.getCenter();
        const globeShape = heightTile.projection.getGlobeShape();
        const relativeHeightValue = this.getRelativeHeight( properties, level );

        const symbolMesh = new Mesh();

        const positionGeo = coordinates[ 0 ];
        const geoPoint = new Geodetic3D( Trigonometry.toRadians( positionGeo[ 0 ] ), Trigonometry.toRadians( positionGeo[ 1 ] ), 0 );
        let heigthCurPoint: number;
        if ( positionGeo.length === 3 ) {
            heigthCurPoint = positionGeo[ 2 ];
        } else {
            heigthCurPoint = heightTile.getHeightInPoint( geoPoint, true )!;
        }


        const nextPositionGeo = coordinates[ 1 ];
        let heigthNextPoint = heigthCurPoint;
        let geoNextPoint;
        if ( nextPositionGeo ) {
            geoNextPoint = new Geodetic3D( Trigonometry.toRadians( nextPositionGeo[ 0 ] ), Trigonometry.toRadians( nextPositionGeo[ 1 ] ), 0 );
            if ( nextPositionGeo.length === 3 ) {
                heigthNextPoint = nextPositionGeo[ 2 ];
            } else {
                heigthNextPoint = heightTile.getHeightInPoint( geoNextPoint, true )!;
            }
        }

        if ( this.surfaceFlag === SURFACE_TYPE.ALLFREE || this.surfaceFlag === SURFACE_TYPE.TOPFREE ) {
            heigthCurPoint = heigthNextPoint = Math.max( heigthCurPoint, heigthNextPoint );
        }

        geoPoint.setHeight( heigthCurPoint );
        const curPoint = globeShape.toVector3d( geoPoint );
        vec3.sub( curPoint, centerPoint );
        let nextPoint;
        if ( geoNextPoint ) {
            geoNextPoint.setHeight( heigthNextPoint );
            nextPoint = globeShape.toVector3d( geoNextPoint );
            vec3.sub( nextPoint, centerPoint );

            // центр между точками
            vec3.add( curPoint, nextPoint );
            vec3.scale( curPoint, 0.5 );
        }

        const posAttrValues: Vector3D[] = [];
        posAttrValues.push( curPoint );
        posAttrValues.push( curPoint );
        posAttrValues.push( curPoint );
        posAttrValues.push( curPoint );

        const textureAttrValues: Vector2D[] = [];
        textureAttrValues.push( [0, 0] );
        textureAttrValues.push( [1, 0] );
        textureAttrValues.push( [0, 1] );
        textureAttrValues.push( [1, 1] );

        const indicesAttributeValues = [0, 1, 2, 3, 2, 1];

        symbolMesh.setPrimitiveType( PrimitiveType.Triangles );
        symbolMesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( posAttrValues );
        symbolMesh.addAttribute( positionsAttribute );

        const textureCoordsAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 2 );
        textureCoordsAttribute.setValues( textureAttrValues );
        symbolMesh.addAttribute( textureCoordsAttribute );

        const indicesAttribute = new Indices( IndicesType.uShort );
        indicesAttribute.add( indicesAttributeValues );
        indicesAttribute.validateType();
        symbolMesh.setIndices( indicesAttribute );

        let rightVector;
        if ( nextPoint ) {
            rightVector = vec3.sub( nextPoint, curPoint );
            vec3.normalize( rightVector );
        } else {
            rightVector = vec3.create( vec3.UNITX );
        }


        const normal = vec3.cross( rightVector, centerPoint, vec3.create() );
        vec3.normalize( normal );

        const upVector = vec3.cross( normal, rightVector, vec3.create() );
        vec3.normalize( upVector );

        support.normal = [...normal, 0];
        support.rightVector = rightVector;
        support.upVector = [...upVector, relativeHeightValue];

        return {
            mesh: symbolMesh.toJSON(),
            properties: properties
        };

    }


    /**
     * Функция создания текстовой картинки для 3d
     * @method _textLength
     * @private
     * @param text {string} Текст
     * @param scale {Number} Масштаб шрифта
     * @param smooth {Number} Ширина контура
     * @return {Object} Canvas и длина текста
     */
    _textLength( text: FontCharacter[], scale: number, smooth: number ) {
        let length = 0;
        for ( let i = 0; i < text.length; i++ ) {
            const horiAdvance = TemplateTEXT.METRICS.chars[ text[ i ] ][ 4 ] + 1.5 * smooth;
            length += horiAdvance * scale;
        }

        return length;
    }

    /**
     * Функция создания текстовой картинки для 3d
     * @method _textHeight
     * @private
     * @param text {string} Текст
     * @param scale {Number} Масштаб шрифта
     * @return {Object} Canvas и длина текста
     */
    _textHeight( text: FontCharacter[], scale: number ) {
        let height = 0;
        const SYMBOL_ADDITIONAL_DELTA = 6; // Добавочная величина к высоте символа
        for ( let i = 0; i < text.length; i++ ) {
            const metric = TemplateTEXT.METRICS.chars[ text[ i ] ];
            height = Math.max( (metric[ 1 ] + SYMBOL_ADDITIONAL_DELTA) * scale, height );
        }
        return height;
    }

}

/**
 * Класс узла шаблона
 * @class IMG3DNODE
 * @constructor IMG3DNODE
 * @param node {Object} Описание узла из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на объект шаблона
 */
class IMG3DNODE {
    descriptionList: IMG3DDESCRIPTION[] = [];
    transformFlag: TRANSFORM_FLAG;
    size: [IMG3DVALUE, IMG3DVALUE, IMG3DVALUE];
    private readonly transformMatrix: Matrix4x4;

    mNodeMatrix: Matrix4x4;

    constructor( node: NODE3D, mainObject: Object3dTemplate ) {
        this.transformFlag = node.TransformFlag;
        this.size = node.Size;
        if ( this.transformFlag === TRANSFORM_FLAG.IMG3DTRANSFORM && node.IMG3DTRANSFORM ) {
            this.transformMatrix = Parser3d.createTransformMatrix( node.IMG3DTRANSFORM );
        } else if ( this.transformFlag === TRANSFORM_FLAG.IMG3DMATRIX && node.IMG3DTMATRIX ) {
            this.transformMatrix = node.IMG3DTMATRIX.Matrix;
        } else {
            this.transformMatrix = mat4.IDENTITY;
        }
        const desriptions = node.DESCRIPTIONLIST;
        for ( let i = 0; i < desriptions.length; i++ ) {
            this.descriptionList.push( new IMG3DDESCRIPTION( desriptions[ i ], mainObject ) );
        }
        this.mNodeMatrix = mat4.create();
    }


    mTransformMatrixList: Matrix4x4[] = [];

    /** Функция создания мешей узла знака
     * @method createNodeMesh
     * @public
     * @param transformMarkMatrix {Array} Матрица трансформирования знака
     * @param feature {object} Объект карты
     * @param relativeHeightValue {number} Относительная высота
     * @param vector {number} Тип вектора
     * @result {Array} Массив мешей узла знака
     */
    createNodeMesh( transformMarkMatrix: Matrix4x4, feature: Feature, relativeHeightValue: number, vector: VECTOR_ORIENTATION3D ) {
        const nodeMeshList: FeatureMesh[] = [];
        const transformMatrix = mat4.set( transformMarkMatrix, this.mNodeMatrix );
        mat4.multiply( transformMatrix, this.transformMatrix, transformMatrix );

        const transformMatrixList = this.mTransformMatrixList;
        transformMatrixList.length = 0;
        transformMatrixList[ 0 ] = transformMatrix;

        for ( let i = 0; i < this.descriptionList.length; i++ ) {
            const descriptionMeshList = this.descriptionList[ i ].createDescriptionMesh( transformMatrixList, feature, relativeHeightValue, vector );
            for ( let j = 0; j < descriptionMeshList.length; j++ ) {
                nodeMeshList.push( descriptionMeshList[ j ] );
            }
        }
        return nodeMeshList;
    }
}

/**
 * Класс описания узла
 * @class IMG3DDESCRIPTION
 * @constructor IMG3DDESCRIPTION
 * @param desc {Object} Параметры описания узла из классификатора
 * @param mainObject {Object3dTemplate} Ссылка на объект шаблона
 */
class IMG3DDESCRIPTION {
    private readonly guid = Utils.generateGUID();
    layerId: string;
    colorFlag: COMMON_FLAG;
    materialFlag: COMMON_FLAG;
    textureFlag: COMMON_FLAG;
    semColorFlag: COMMON_FLAG;
    transparent: COMMON_FLAG;
    smooth: COMMON_FLAG | BOLD_FLAG;
    paintFlag: PAINT_FLAG;
    transformFlag: TRANSFORM_FLAG;

    elementList: IMG3DELEMENT[] = [];

    color?: Vector4D;
    originalColor?: Vector4D;
    material?: Material3D;

    textureId?: string;
    textureSemPath?: string;
    flagMeasure = 0;
    transparentTex: COMMON_FLAG = COMMON_FLAG.DISABLED;
    smoothTex?: COMMON_FLAG;
    wrapTex?: TEXTURE_REPEAT;
    wrapValue: [IMG3DVALUE, IMG3DVALUE] = [{
        Value: 0,
        Type: 0,
        Factor: 0,
        Offset: 0
    }, {
        Value: 0,
        Type: 0,
        Factor: 0,
        Offset: 0
    }];

    constructor( desc: DESCRIPTION3D, mainObject: Object3dTemplate ) {
        this.layerId = mainObject.layerId;
        this.colorFlag = desc.ColorFlag;
        this.materialFlag = desc.MaterialFlag;
        this.textureFlag = desc.TextureFlag;
        this.semColorFlag = desc.SemColorFlag;
        if ( this.colorFlag === COMMON_FLAG.ENABLED ) {
            this.color = this.getColor( desc.Color as IMG3DRGBA );
        } else if ( this.semColorFlag === COMMON_FLAG.ENABLED ) {
            const Color = desc.Color as IMG3DVALUE;
            this.color = [...this.floatToRGB( Color.Value ), this.floatToRGB( Color.Factor )[ 0 ]];
            // this.colorSem = desc.Color.ColorSem;// сейчас не используется
        }
        if ( this.materialFlag === COMMON_FLAG.ENABLED ) {
            this.material = this.getMaterial( desc.Material );
        }
        if ( this.textureFlag === COMMON_FLAG.ENABLED ) {
            this.textureId = this.layerId + '_' + desc.Texture.Key + '_' + desc.Texture.Level;

            if ( desc.Texture.SemKey ) {
                this.textureId = undefined;
                this.textureSemPath = desc.Texture.SemKey;
            }
            this.flagMeasure = desc.FlagMeasure;
            this.transparentTex = desc.TransparentTex;
            this.smoothTex = desc.SmoothTex;
            this.wrapTex = desc.WrapTex;

            this.wrapValue = desc.WrapValue;
        }

        this.transparent = desc.Transparent;
        this.smooth = desc.Smooth;
        this.paintFlag = desc.PaintFlag;
        this.transformFlag = desc.TransformFlag;

        for ( let i = 0; i < desc.ELEMENTLIST.length; i++ ) {
            const element = IMG3DDESCRIPTION.createElement( desc.ELEMENTLIST[ i ] );
            if ( element ) {
                this.elementList.push( element );
            }
        }
    }

    /** Функция преобразования числа в 3 канала цвета
     * @method floatToRGB
     * @public
     * @param value {Number} Число
     * @result {Array} Массив каналов цвета ([R,G,B]);
     */
    floatToRGB( value: number ): Vector3D {
        const enc = [1.0, 255.0, 65025.0, 16581375.0];
        for ( let i = 0; i < enc.length; i++ ) {
            enc[ i ] = enc[ i ] * value;
            enc[ i ] = enc[ i ] - Math.floor( enc[ i ] );
        }
        enc[ 0 ] -= enc[ 1 ] / 255.0;
        enc[ 1 ] -= enc[ 2 ] / 255.0;
        enc[ 2 ] -= enc[ 3 ] / 255.0;

        return [enc[ 0 ], enc[ 1 ], enc[ 2 ]];
    }

    /** Функция получение цвета в виде массива
     * @method getColor
     * @public
     * @param colorObj {Object} Цвет ({R,G,B,A})
     * @result {Array} Массив каналов цвета ([R,G,B,A]);
     */
    getColor( colorObj: IMG3DRGBA ): Vector4D {
        return [
            Math.floor( colorObj.R * 255 ) / 255,
            Math.floor( colorObj.G * 255 ) / 255,
            Math.floor( colorObj.B * 255 ) / 255,
            Math.floor( colorObj.A * 255 ) / 255];
    }

    /** Функция получение материала
     * @method getMaterial
     * @public
     * @param materialObj {Object} Материал из классификатора
     * @result {Object} Материал ({ambientColor,diffuseColor,specularColor,emissiveColor,shininess})
     */
    getMaterial( materialObj: ACT3DMATERIALMODE ): Material3D {
        return {
            ambientColor: this.getColor( materialObj.AmbientColor ),
            diffuseColor: this.getColor( materialObj.DiffuseColor ),
            specularColor: this.getColor( materialObj.SpecularColor ),
            emissiveColor: this.getColor( materialObj.EmissiveColor ),
            shininess: materialObj.Shininess
        };
    }

    // /** Функция получение текстуры
    //  * @method getTexture
    //  * @public
    //  * @result {Object} Описание текстуры
    //  */
    // getTexture() {
    //     const textureDescription = {};
    //
    //     textureDescription.textureId = this.textureId;
    //     textureDescription.path = this.textureSemPath;
    //
    //     textureDescription.textureMultiply_transparentBlack = this.transparentTex;
    //
    //     if (this.smoothTex === 1) {
    //         textureDescription.textureSample = TextureSamplers.linearMipmapLinearClamp;
    //     } else {
    //         textureDescription.textureSample = TextureSamplers.linearMipmapNearestClamp;
    //     }
    //
    //     return textureDescription;
    // }

    getTextureParams( objectProperties: FeatureProperties ) {
        let params: TextureParams | undefined = undefined;
        if ( this.textureFlag ) {
            params = {
                transparentTex: this.transparentTex !== undefined ? this.transparentTex : COMMON_FLAG.ENABLED,
                gUnit: MEASURE.texNone,
                gValue: 0,
                vUnit: MEASURE.texNone,
                vValue: 0
            };
            if ( this.wrapTex !== TEXTURE_REPEAT.NOT ) {
                const wrapValue = this.getWrapValue( objectProperties );
                if ( this.wrapTex === TEXTURE_REPEAT.HOR || this.wrapTex === TEXTURE_REPEAT.ALL ) {
                    params.gValue = wrapValue[ 0 ];
                    if ( (TEXTUREMEASURE.texGMetr & this.flagMeasure) !== 0 ) {
                        params.gUnit = MEASURE.texMetr;
                    } else if ( (TEXTUREMEASURE.texGUnit & this.flagMeasure) !== 0 ) {
                        params.gUnit = MEASURE.texUnit;
                    }
                }
                if ( this.wrapTex === TEXTURE_REPEAT.VER || this.wrapTex === TEXTURE_REPEAT.ALL ) {
                    params.vValue = wrapValue[ 1 ];
                    if ( (TEXTUREMEASURE.texVMetr & this.flagMeasure) !== 0 ) {
                        params.vUnit = MEASURE.texMetr;
                    } else if ( (TEXTUREMEASURE.texVUnit & this.flagMeasure) !== 0 ) {
                        params.vUnit = MEASURE.texUnit;
                    }
                }
            }
        }
        return params;
    }

    /** Функция получения значения повторяемости текстуры по двум текстурным координатам(или 0 при произвольной повторяемости)
     * @method getWrapValue
     * @public
     * @result {array} Вектор масштабирования
     */
    getWrapValue( objectProperties: FeatureProperties ) {
        const wrapValue = vec2.create();
        for ( let i = 0; i < this.wrapValue.length; i++ ) {
            const curWrapValue = this.wrapValue[ i ];
            let value, objectValue;
            if ( curWrapValue.SemKey && objectProperties.semantics ) {

                objectValue = +TemplateEMPTY.getSemValue( objectProperties.semantics, curWrapValue.SemKey );
            }
            if ( objectValue !== undefined ) {
                // value = parseFloat(objectProperties[key]) * curWrapValue.Factor + curWrapValue.Offset;
                value = objectValue;
            } else {
                value = curWrapValue.Value;
            }
            wrapValue[ i ] = value;
        }
        return wrapValue;
    }

    /**
     * Создать элемент
     * @method createElement
     * @private
     * @param currentElement {Object} Описание элемента
     */
    private static createElement( currentElement: ELEMENT3D ) {
        let element: IMG3DELEMENT | undefined = undefined;
        switch ( currentElement.Type ) {
            // case ELEMENT3DTYPE.IMG3D_ANY:   // Произвольный
            //     element = new IMG3DANY( currentElement );
            //     break;
            case ELEMENT3DTYPE.IMG3D_CUBE:   // Куб
                break;
            case ELEMENT3DTYPE.IMG3D_SPHERE:   // Сфера
                element = new IMG3DSPHERE( currentElement );
                break;
            case ELEMENT3DTYPE.IMG3D_CYLINDER:   // Цилиндр и конус
                // case ELEMENT3DTYPE.IMG3D_CONE:   // Конус
                element = new IMG3DCYLINDER( currentElement );
                break;
            case ELEMENT3DTYPE.IMG3D_QUAD:   // Четырехугольник
                element = new IMG3DQUAD( currentElement );
                break;
            case ELEMENT3DTYPE.IMG3D_ADJOINQUAD:   // Примыкающий четырехугольник
                break;
            // case ELEMENT3DTYPE.IMG3D_COMBPOLYGON:   // Связанный многоугольник
            //     break;
            case ELEMENT3DTYPE.IMG3D_LINE:   // Линия сплошная
                // element = new IMG3DLINE(currentElement);
                break;
            case ELEMENT3DTYPE.IMG3D_FACESET:   // Массив многоугольников (поверхность)
                element = new IMG3DFACESET( currentElement );
                break;
            case ELEMENT3DTYPE.IMG3D_POINTSET:   // Массив точек
                break;
            case ELEMENT3DTYPE.IMG3D_LINESET:   // Массив линий
                element = new IMG3DLINESET( currentElement );
                break;
            case ELEMENT3DTYPE.IMG3D_GRID:   // Сетка
                break;
            // case ELEMENT3DTYPE.IMG3D_SURFSPHERE:   // Сферическая поверхность
            //     break;
            case ELEMENT3DTYPE.IMG3D_EXTRUSION:   // ЭКСТРУЗИЯ
                break;
        }
        return element;
    }

    /** Функция получение копии описания
     * @method getDescription
     * @public
     * @result {Object} Копия описания
     */
    getDescription( objectProperties: FeatureProperties ): TemplateDescription {
        let color;
        if ( this.colorFlag ) {
            const key = this.semColorFlag;
            const objectValue = (objectProperties as SimpleJson<Vector4D>)[ key ];
            if ( key != null && objectValue !== undefined ) {
                color = objectValue;
            } else {
                color = this.color;
            }
        }
        let material;
        if ( this.materialFlag ) {
            material = this.material;
        }

        let texturePath, textureId, smoothTex;
        if ( this.textureFlag ) {
            if ( this.textureSemPath ) {
                const objectValue = (objectProperties as SimpleJson<Vector4D>)[ this.textureSemPath ];
                if ( objectValue !== undefined ) {
                    texturePath = this.textureSemPath;
                }
            }
            textureId = this.textureId;
            smoothTex = this.smoothTex;
        }
        const transparent = this.transparent;
        const smooth = this.smooth;
        const paintFlag = this.paintFlag;
        const transformFlag = this.transformFlag;
        const guid = this.guid;

        return { color, material, texturePath, textureId, smoothTex, transparent, smooth, paintFlag, transformFlag, guid };
    }

    /** Функция создания мешей описания узла знака
     * @method createDescriptionMesh
     * @public
     * @param transformNodeMatrixList {Array} Список матриц трансформирования узла
     * @param feature {object} Объект карты
     * @param relativeHeightValue {number} Относительная высота
     * @param vector {number} Тип вектора
     * @result {Array} Массив мешей описания узла знака
     */
    createDescriptionMesh( transformNodeMatrixList: Matrix4x4[], feature: Feature, relativeHeightValue: number, vector: VECTOR_ORIENTATION3D ) {
        const decriptionMeshList: FeatureMesh[] = [];


        let primitiveType;
        const indicesAttributeValues: number[] = [];
        const posAttrValues: Vector4D[] = [];
        const normalAttrValues: Vector4D[] = [];
        const textureAttrValues: Vector3D[] = [];
        const colorAttrValues: Vector4D[] = [];

        let vectorMode = 0;

        if ( (vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYOBSER ) {
            vectorMode = 1;
        } else if ( (vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYOBSERVER ) {
            vectorMode = 2;
        }

        if ( (vector | VECTOR_ORIENTATION3D.VM_NOSCALE) === vector ) {
            vectorMode += 3;
        }

        for ( let j = 0; j < this.elementList.length; j++ ) {
            const elementMesh = this.elementList[ j ].createElementMesh( transformNodeMatrixList, this.paintFlag, this.getTextureParams( feature.properties ) );
            if ( elementMesh ) {
                const indicesValues = elementMesh.indexList;
                const posValues = elementMesh.vertexList;
                const normalValues = elementMesh.normalList;
                const textureCoordsValues = elementMesh.textureCoordsList;
                const colorValues = elementMesh.colorList;
                primitiveType = elementMesh.primitiveType;

                const addIndexValue = posAttrValues.length;
                for ( let i = 0; i < posValues.length; i++ ) {
                    const posValue = vec4.fromVector3( posValues[ i ] );
                    posValue[ 3 ] = relativeHeightValue;
                    posAttrValues.push( posValue );
                }
                if ( textureCoordsValues ) {
                    for ( let i = 0; i < textureCoordsValues.length; i++ ) {
                        const curTexCoords = vec3.fromPoint( textureCoordsValues[ i ] );
                        textureAttrValues.push( curTexCoords );
                    }
                }
                if ( colorValues ) {
                    for ( let i = 0; i < colorValues.length; i++ ) {
                        colorAttrValues.push( colorValues[ i ] );
                    }
                }

                if ( normalValues ) {
                    for ( let i = 0; i < normalValues.length; i++ ) {
                        const normalValue = vec4.fromVector3( normalValues[ i ] );
                        normalValue[ 3 ] = vectorMode;
                        normalAttrValues.push( normalValue );
                    }
                }
                for ( let i = 0; i < indicesValues.length; i++ ) {
                    indicesAttributeValues.push( addIndexValue + indicesValues[ i ] );
                }
            }
        }

        if ( normalAttrValues.length === 0 ) {
            //Добавление нормалей
            const curNormal = vec3.create();
            const normals: Vector3D[] = [];
            const firstPoint = vec3.create();
            const secondPoint = vec3.create();
            const thirdPoint = vec3.create();
            for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {

                const ind1 = indicesAttributeValues[ i ];
                const ind2 = indicesAttributeValues[ i + 1 ];
                const ind3 = indicesAttributeValues[ i + 2 ];

                vec3.fromVector4( posAttrValues[ ind1 ], firstPoint );
                vec3.fromVector4( posAttrValues[ ind2 ], secondPoint );
                vec3.fromVector4( posAttrValues[ ind3 ], thirdPoint );

                Calculate.calcNormal( firstPoint, secondPoint, thirdPoint, curNormal );

                let normal = normals[ ind1 ];
                if ( normal ) {
                    vec3.add( normal, curNormal );
                } else {
                    normals[ ind1 ] = vec3.create( curNormal );
                }

                normal = normals[ ind2 ];
                if ( normal ) {
                    vec3.add( normal, curNormal );
                } else {
                    normals[ ind2 ] = vec3.create( curNormal );
                }

                normal = normals[ ind3 ];
                if ( normal ) {
                    vec3.add( normal, curNormal );
                } else {
                    normals[ ind3 ] = vec3.create( curNormal );
                }
            }

            for ( let i = 0; i < normals.length; i++ ) {
                const normal = normals[ i ];
                if ( normal ) {
                    vec3.normalize( normal );
                    normalAttrValues.push( vec4.fromVector3( normal ) );
                } else {
                    normalAttrValues.push( vec4.create() );
                }
            }

        }

        const materials: number[] = [];
        for ( let i = 0; i < posAttrValues.length; i++ ) {
            if ( this.colorFlag || this.materialFlag ) {
                materials.push( 0 );
            } else {
                materials.push( -1 );
            }
        }


        if ( posAttrValues.length > 0 ) {
            if ( primitiveType == null ) {
                primitiveType = PrimitiveType.Triangles;
            }
            //создание меша
            const mesh = new Mesh();
            mesh.setPrimitiveType( primitiveType );
            mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );

            const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 4 );
            positionsAttribute.setValues( posAttrValues );
            mesh.addAttribute( positionsAttribute );

            const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 4 );
            normalsAttribute.setValues( normalAttrValues );
            mesh.addAttribute( normalsAttribute );

            const indicesAttribute = new Indices( IndicesType.uShort );
            indicesAttribute.add( indicesAttributeValues );
            indicesAttribute.validateType();
            mesh.setIndices( indicesAttribute );

            if ( textureAttrValues.length > 0 ) {
                const textureCoordsAttribute = new VertexAttribute( 'aVertexTextureCoords', VertexAttributeType.Float, 3 );
                textureCoordsAttribute.setValues( textureAttrValues );
                mesh.addAttribute( textureCoordsAttribute );
            }

            if ( colorAttrValues.length > 0 ) {
                const colorsAttribute = new VertexAttribute( 'aVertexColor', VertexAttributeType.Float, 4 );
                colorsAttribute.setValues( colorAttrValues );
                mesh.addAttribute( colorsAttribute );
            }

            if ( materials.length > 0 ) {
                const materialsAttribute = new VertexAttribute( 'aVertexMaterial', VertexAttributeType.Float, 1 );
                materialsAttribute.setValues( materials );
                mesh.addAttribute( materialsAttribute );
            }

            const featureMesh = {
                description: this.getDescription( feature.properties ),
                mesh: mesh.toJSON(),
                properties: feature.properties
            };
            decriptionMeshList.push( featureMesh );
        }
        return decriptionMeshList;
    }
}

/**
 * Класс элемента описания
 * @class IMG3DELEMENT
 * @constructor IMG3DELEMENT
 * @param elem {Object} Описание элемента из классификатора
 */
abstract class IMG3DELEMENT {
    type: ELEMENT3D['Type'];
    protected readonly transformMatrix: Matrix4x4;
    matrixLevel: IMG3DTRANSFORM['Level'] = -1;
    mTransformMatrix: Matrix4x4;

    protected static mCurNormal = vec3.create();

    protected constructor( elem: ELEMENT3D ) {
        this.type = elem.Type;
        if ( elem.IMG3DTRANSFORM ) {
            this.transformMatrix = Parser3d.createTransformMatrix( elem.IMG3DTRANSFORM );
            this.matrixLevel = elem.IMG3DTRANSFORM.Level;
        } else if ( elem.IMG3DTMATRIX ) {
            this.transformMatrix = elem.IMG3DTMATRIX.Matrix;
        } else {
            this.transformMatrix = mat4.IDENTITY;
        }
        this.mTransformMatrix = mat4.create( mat4.IDENTITY );
    }

    /** Функция создания меша элемента
     * @method createElementMesh
     * @public
     * @param transformMatrixList {Array} Список матриц трансформирования знака
     * @param paintFlag {PAINT_FLAG} Флаг отборажения поверхности с обеих сторон
     * @param textureParams {object} Параметры наложения текстуры
     * @result {Object} Меш элемента
     */
    abstract createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams?: TextureParams ): ElementMesh | void;
}

/**
 * Класс элемента-сферы
 * @class IMG3DSPHERE
 * @constructor IMG3DSPHERE
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DSPHERE extends IMG3DELEMENT {
    point: Vector3D;
    rotateVector: Vector3D;
    rotateAngle: number;
    radius: number;
    PARTS = 16;

    constructor( elem: ELEMENT3DSPHERE ) {
        super( elem );
        const GEOMETRY = elem.GEOMETRY;
        this.point = [GEOMETRY.Point.X, GEOMETRY.Point.Y, GEOMETRY.Point.Z];
        this.rotateVector = [GEOMETRY.Rotate.X, GEOMETRY.Rotate.Y, GEOMETRY.Rotate.Z];
        this.rotateAngle = Trigonometry.toRadians( GEOMETRY.Rotate.Angle );
        this.radius = GEOMETRY.Radius;
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ): ElementMesh {
        let parentMatrix;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }

        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );


        const offsetVector = this.point;
        const radius = this.radius;

        const textureFlag = !!textureParams;

        let textureWidth = 1, textureHeight = 1;
        if ( textureFlag ) {
            const equator = 2 * Math.PI * radius;
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = equator / textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }

            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = equator / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }
        }

        const vertexList: Vector3D[] = [];
        const textureCoordsList: Vector3D[] = [];
        //north pole
        const northPoint: Vector3D = [0, 0, radius];
        vec3.add( northPoint, offsetVector );
        if ( this.rotateAngle !== 0 && !(this.rotateVector[ 0 ] === 0 && this.rotateVector[ 1 ] === 0 && this.rotateVector[ 2 ] === 0) ) {
            vec3.rotateAroundAxis( northPoint, this.rotateVector, this.rotateAngle );
        }
        mat4.multiplyPoint3( transformMatrix, northPoint, northPoint );
        for ( let j = 0; j <= this.PARTS; j++ ) {
            vertexList.push( northPoint );
            if ( textureFlag ) {
                textureCoordsList.push( [textureWidth * j / this.PARTS, textureHeight, textureParams.transparentTex] );
            }
        }

        for ( let i = 1; i < this.PARTS; i++ ) {
            const phi = i * Math.PI / this.PARTS;
            const sinPhi = Math.sin( phi );
            const cosPhi = Math.cos( phi );
            for ( let j = 0; j <= this.PARTS; j++ ) {
                const theta = j * 2 * Math.PI / this.PARTS;
                const sinTheta = Math.sin( theta );
                const cosTheta = Math.cos( theta );
                const point: Vector3D = [
                    radius * cosTheta * sinPhi,
                    radius * sinTheta * sinPhi,
                    radius * cosPhi
                ];

                vec3.add( point, offsetVector );
                if ( this.rotateAngle !== 0 && !(this.rotateVector[ 0 ] === 0 && this.rotateVector[ 1 ] === 0 && this.rotateVector[ 2 ] === 0) ) {
                    vec3.rotateAroundAxis( point, this.rotateVector, this.rotateAngle );
                }
                mat4.multiplyPoint3( transformMatrix, point, point );
                vertexList.push( point );
                if ( textureFlag ) {
                    textureCoordsList.push( [textureWidth * j / this.PARTS, textureHeight * (1 - i / this.PARTS), textureParams.transparentTex] );
                }
            }
        }

        //south pole
        const southPoint: Vector3D = [0, 0, -radius];
        vec3.add( southPoint, offsetVector );
        if ( this.rotateAngle !== 0 && !(this.rotateVector[ 0 ] === 0 && this.rotateVector[ 1 ] === 0 && this.rotateVector[ 2 ] === 0) ) {
            vec3.rotateAroundAxis( southPoint, this.rotateVector, this.rotateAngle );
        }
        mat4.multiplyPoint3( transformMatrix, southPoint, southPoint );

        for ( let j = 0; j <= this.PARTS; j++ ) {
            vertexList.push( southPoint );
            if ( textureFlag ) {
                textureCoordsList.push( [textureWidth * j / this.PARTS, 0.0, textureParams.transparentTex] );
            }
        }


        // Заполнение массива индексов
        const indexList: number[] = [];
        for ( let i = 0; i < this.PARTS; i++ ) {
            const firstLineIndex = i * (this.PARTS + 1);
            const secondLineIndex = (i + 1) * (this.PARTS + 1);
            for ( let j = 0; j < this.PARTS; j++ ) {
                indexList.push( firstLineIndex + j );
                indexList.push( secondLineIndex + j );
                indexList.push( firstLineIndex + j + 1 );

                indexList.push( secondLineIndex + j );
                indexList.push( secondLineIndex + j + 1 );
                indexList.push( firstLineIndex + j + 1 );
            }
        }

        if ( !textureFlag ) {
            const defaultTextCoords: Vector3D = [0, 0, 1];
            for ( let i = 0; i < vertexList.length; i++ ) {
                textureCoordsList.push( defaultTextCoords );
            }
        }

        const normalList = this.calcNormals( vertexList, indexList );

        const colorList: Vector4D[] = [];
        const defColor: Vector4D = [1, 1, 1, 1];
        for ( let i = 0; i < vertexList.length; i++ ) {
            colorList.push( defColor );
        }

        return {
            primitiveType: PrimitiveType.Triangles,
            vertexList,
            normalList,
            textureCoordsList,
            colorList,
            indexList
        };
    }

    private calcNormals( posAttrValues: Vector3D[], indicesAttributeValues: number[] ) {
        //Добавление нормалей
        const curNormal: Vector3D = IMG3DELEMENT.mCurNormal;
        const normals: Vector3D[] = [];

        const northPole = vec3.create();
        const southPole = vec3.create();

        for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {

            const ind1 = indicesAttributeValues[ i ];
            const ind2 = indicesAttributeValues[ i + 1 ];
            const ind3 = indicesAttributeValues[ i + 2 ];

            Calculate.calcNormal( posAttrValues[ ind1 ], posAttrValues[ ind2 ], posAttrValues[ ind3 ], curNormal );
            let normal: Vector3D;
            if ( ind1 <= this.PARTS ) {
                normal = northPole;
            } else if ( ind1 >= posAttrValues.length - (this.PARTS + 2) ) {
                normal = southPole;
            } else if ( (ind1 + 1) % (this.PARTS + 1) === 0 ) {
                normal = normals[ ind1 - this.PARTS ];
            } else {
                normal = normals[ ind1 ];
            }
            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind1 ] = normal;
            } else {
                normals[ ind1 ] = curNormal.slice() as typeof curNormal;
            }

            if ( ind2 <= this.PARTS ) {
                normal = northPole;
            } else if ( ind2 >= posAttrValues.length - (this.PARTS + 2) ) {
                normal = southPole;
            } else if ( (ind2 + 1) % (this.PARTS + 1) === 0 ) {
                normal = normals[ ind2 - this.PARTS ];
            } else {
                normal = normals[ ind2 ];
            }
            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind2 ] = normal;
            } else {
                normals[ ind2 ] = curNormal.slice() as typeof curNormal;
            }

            if ( ind3 <= this.PARTS ) {
                normal = northPole;
            } else if ( ind3 >= posAttrValues.length - (this.PARTS + 2) ) {
                normal = southPole;
            } else if ( (ind3 + 1) % (this.PARTS + 1) === 0 ) {
                normal = normals[ ind3 - this.PARTS ];
            } else {
                normal = normals[ ind3 ];
            }
            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind3 ] = normal;
            } else {
                normals[ ind3 ] = curNormal.slice() as typeof curNormal;
            }
        }
        for ( let i = 0; i < normals.length; i++ ) {
            vec3.normalize( normals[ i ] );
        }

        return normals;
    }
}

/**
 * Класс элемента-цилиндра
 * @class IMG3DCYLINDER
 * @constructor IMG3DCYLINDER
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DCYLINDER extends IMG3DELEMENT {
    point: Vector3D;
    rotateVector: Vector3D;
    rotateAngle: number;
    radius: number;
    radiusH: number;
    height: number;
    PARTS = 16;
    top: boolean;
    side: boolean;
    bottom: boolean;

    constructor( elem: ELEMENT3DCYLINDER ) {
        super( elem );
        const GEOMETRY = elem.GEOMETRY;

        this.point = [GEOMETRY.Point.X, GEOMETRY.Point.Y, GEOMETRY.Point.Z];
        this.rotateVector = [GEOMETRY.Rotate.X, GEOMETRY.Rotate.Y, GEOMETRY.Rotate.Z];
        this.rotateAngle = Trigonometry.toRadians( GEOMETRY.Rotate.Angle );
        if ( GEOMETRY.Part === VISIBLE_PART.IMG3D_ALL ) {
            this.top = this.side = this.bottom = true;
        } else {
            this.top = !!(VISIBLE_PART.IMG3D_TOP & GEOMETRY.Part);
            this.side = !!(VISIBLE_PART.IMG3D_SIDES & GEOMETRY.Part);
            this.bottom = !!(VISIBLE_PART.IMG3D_BOTTOM & GEOMETRY.Part);
        }

        this.radius = GEOMETRY.Radius;
        this.radiusH = GEOMETRY.RadiusH;// Радиус цилиндра на заданной высоте Height или ноль(если это конус)
        this.height = GEOMETRY.Height;
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag?: PAINT_FLAG, textureParams?: TextureParams ): ElementMesh {

        const radius0 = this.radius;
        const radiusH = this.radiusH;
        const height = this.height;

        let parentMatrix: Matrix4x4;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }
        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );

        let textureWidth = 1, textureHeight = 1;
        if ( textureParams ) {
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = 2 * Math.PI * (radius0 + radiusH) * 0.5 / textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }

            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = height / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }
        }


        const offsetPoint = vec3.create( this.point );
        // const offsetPointH = vec3.add(offsetPoint, vec3.scale(vec3.UNITY, height, []),[]);
        const offsetVectorH = vec3.scale( vec3.UNITY, height, vec3.create() );
        const bottomVector = vec3.scale( vec3.UNITX, radius0, vec3.create() );
        const topVector = vec3.scale( vec3.UNITX, radiusH, vec3.create() );

        if ( this.rotateAngle !== 0 && !(this.rotateVector[ 0 ] === 0 && this.rotateVector[ 1 ] === 0 && this.rotateVector[ 2 ] === 0) ) {
            // vec3.rotateAroundAxis(offsetPoint, this.rotateVector, this.rotateAngle);
            vec3.rotateAroundAxis( offsetVectorH, this.rotateVector, this.rotateAngle );
            vec3.rotateAroundAxis( bottomVector, this.rotateVector, this.rotateAngle );
            vec3.rotateAroundAxis( topVector, this.rotateVector, this.rotateAngle );

        }

        const planeNormal = vec3.scale( vec3.normalize( offsetVectorH, vec3.create() ), -1 );

        const positions: Vector3D[] = [];
        //bottom
        let curPoint = vec3.create( offsetPoint );
        mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
        positions.push( curPoint );
        const point = vec3.create(), theta = 2 * Math.PI / this.PARTS;
        for ( let i = 0; i <= this.PARTS; i++ ) {
            vec3.rotateAroundAxis( bottomVector, planeNormal, theta * i, point );
            const curPoint = vec3.add( point, offsetPoint, vec3.create() );
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            positions.push( curPoint );
        }

        //top
        const offsetPointH = vec3.add( offsetPoint, offsetVectorH, vec3.create() );
        curPoint = vec3.create( offsetPointH );
        mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
        positions.push( curPoint );
        for ( let i = 0; i <= this.PARTS; i++ ) {
            vec3.rotateAroundAxis( topVector, planeNormal, theta * i, point );
            curPoint = vec3.add( point, offsetPointH, vec3.create() );
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            positions.push( curPoint );
        }

        const indexList: number[] = [];
        const vertexList: Vector3D[] = [];
        const textureCoordsList: Vector3D[] = [];
        const deltaAngle = 2 * Math.PI / this.PARTS;
        if ( this.bottom ) {
            //bottom
            const centerIndex = vertexList.length;
            for ( let i = 0; i <= this.PARTS + 1; i++ ) {
                vertexList.push( positions[ i ] );
            }

            if ( textureParams ) {
                textureCoordsList.push( [0.5 * textureWidth, 0.5 * textureHeight, textureParams.transparentTex] );
                for ( let i = 0; i <= this.PARTS; i++ ) {
                    const alpha = deltaAngle * i;
                    textureCoordsList.push( [0.5 * textureWidth * (1 + Math.cos( alpha )), 0.5 * textureHeight * (1 + Math.sin( alpha )), textureParams.transparentTex] );
                }
            }


            // Заполнение массива индексов
            for ( let i = 1; i <= this.PARTS; i++ ) {
                indexList.push( centerIndex );
                indexList.push( centerIndex + i );
                indexList.push( centerIndex + i + 1 );
            }
        }

        if ( this.side ) {
            //side
            const addIndex = vertexList.length;
            for ( let i = 0; i <= this.PARTS; i++ ) {
                vertexList.push( positions[ i + 1 ] );
                vertexList.push( positions[ i + 1 + this.PARTS + 2 ] );
                if ( textureParams ) {
                    textureCoordsList.push( [textureWidth * i / this.PARTS, 0, textureParams.transparentTex] );
                    textureCoordsList.push( [textureWidth * i / this.PARTS, textureHeight, textureParams.transparentTex] );
                }
            }
            // Заполнение массива индексов
            for ( let i = 0; i < this.PARTS; i++ ) {
                const ind = i * 2;
                indexList.push( addIndex + ind );
                indexList.push( addIndex + ind + 1 );
                indexList.push( addIndex + ind + 2 );

                indexList.push( addIndex + ind + 1 );
                indexList.push( addIndex + ind + 3 );
                indexList.push( addIndex + ind + 2 );
            }
        }

        if ( this.top ) {
            //top
            const centerIndex = vertexList.length;
            for ( let i = 0; i <= this.PARTS + 1; i++ ) {
                vertexList.push( positions[ i + this.PARTS + 2 ] );
            }

            if ( textureParams ) {
                textureCoordsList.push( [0.5 * textureWidth, 0.5 * textureHeight, textureParams.transparentTex] );
                for ( let i = 0; i <= this.PARTS; i++ ) {
                    const alpha = deltaAngle * i;
                    textureCoordsList.push( [0.5 * textureWidth * (1 + Math.cos( alpha )), 0.5 * textureHeight * (1 + Math.sin( alpha )), textureParams.transparentTex] );
                }
            }

            // Заполнение массива индексов
            for ( let i = 1; i <= this.PARTS; i++ ) {
                indexList.push( centerIndex );
                indexList.push( centerIndex + i + 1 );
                indexList.push( centerIndex + i );
            }
        }

        if ( !textureParams ) {
            const defaultTextCoords: Vector3D = [0, 0, 1];
            for ( let i = 0; i < vertexList.length; i++ ) {
                textureCoordsList.push( defaultTextCoords );
            }
        }

        const normalList = this.calcNormals( vertexList, indexList );

        const colorList: Vector4D[] = [];
        const defColor: Vector4D = [1, 1, 1, 1];
        for ( let i = 0; i < vertexList.length; i++ ) {
            colorList.push( defColor );
        }

        return {
            primitiveType: PrimitiveType.Triangles,
            vertexList,
            normalList,
            textureCoordsList,
            colorList,
            indexList
        };
    }

    private calcNormals( posAttrValues: Vector3D[], indicesAttributeValues: number[] ) {
        //Добавление нормалей
        const curNormal: Vector3D = IMG3DELEMENT.mCurNormal;
        const normals: Vector3D[] = [];


        const northPole = vec3.create();
        const southPole = vec3.create();


        const PARTS = this.PARTS;

        let bottomLastIndex: number;
        if ( this.bottom ) {
            bottomLastIndex = PARTS + 1;
            // const bottom = true;
        } else {
            bottomLastIndex = -1;
            // bottom = false;
        }

        let sideLastIndex: number, side: boolean;
        if ( this.side ) {
            sideLastIndex = bottomLastIndex + PARTS * 6;
            side = true;
        } else {
            sideLastIndex = bottomLastIndex;
            side = false;
        }

        const top = this.top;

        for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {

            const ind1 = indicesAttributeValues[ i ];
            const ind2 = indicesAttributeValues[ i + 1 ];
            const ind3 = indicesAttributeValues[ i + 2 ];

            Calculate.calcNormal( posAttrValues[ ind1 ], posAttrValues[ ind2 ], posAttrValues[ ind3 ], curNormal );
            let normal: Vector3D;

            normal = getNormal( ind1 );

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind1 ] = normal;
            } else {
                normals[ ind1 ] = curNormal.slice() as typeof curNormal;
            }

            normal = getNormal( ind2 );
            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind2 ] = normal;
            } else {
                normals[ ind2 ] = curNormal.slice() as typeof curNormal;
            }

            normal = getNormal( ind3 );

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind3 ] = normal;
            } else {
                normals[ ind3 ] = curNormal.slice() as typeof curNormal;
            }
        }
        for ( let i = 0; i < normals.length; i++ ) {
            const normal = normals[ i ];
            vec3.normalize( normal );
        }
        return normals;


        function getNormal( ind: number ) {
            let normal: Vector3D;
            if ( ind <= bottomLastIndex ) {
                normal = southPole;
            } else if ( top && ind > sideLastIndex ) {
                normal = northPole;
            } else if ( side && (ind === sideLastIndex || ind === sideLastIndex - 1) ) {
                normal = normals[ ind - 2 * PARTS ];
            } else {
                normal = normals[ ind ];
            }
            return normal;
        }
    }
}

/**
 * Класс элемента-четырехугольника
 * @class IMG3DQUAD
 * @constructor IMG3DQUAD
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DQUAD extends IMG3DELEMENT {
    vertexList: [Vector3D, Vector3D, Vector3D, Vector3D];

    constructor( elem: ELEMENT3DQUAD ) {
        super( elem );
        const vertexList = elem.GEOMETRY.Vertex;
        let curPoint = vertexList[ 0 ];
        const vertex0: Vector3D = [curPoint.X, curPoint.Y, curPoint.Z];
        curPoint = vertexList[ 1 ];
        const vertex1: Vector3D = [curPoint.X, curPoint.Y, curPoint.Z];
        curPoint = vertexList[ 2 ];
        const vertex2: Vector3D = [curPoint.X, curPoint.Y, curPoint.Z];
        curPoint = vertexList[ 3 ];
        const vertex3: Vector3D = [curPoint.X, curPoint.Y, curPoint.Z];

        this.vertexList = [
            vertex0, vertex1, vertex2, vertex3
        ];
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ): ElementMesh {
        let parentMatrix;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }
        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );


        const positions: Vector3D[] = [];
        for ( let i = 0; i < this.vertexList.length; i++ ) {
            const curPoint = vec3.create( this.vertexList[ i ] );
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            positions.push( curPoint );
        }

        const width = vec3.len( vec3.sub( this.vertexList[ 1 ], this.vertexList[ 0 ], vec3.create() ) );
        const height = vec3.len( vec3.sub( this.vertexList[ 3 ], this.vertexList[ 0 ], vec3.create() ) );


        const indexList: number[] = [];
        const vertexList: Vector3D[] = [];
        const textureCoordsList: Vector2D[] = [];

        const textureFlag = !!textureParams;

        let textureWidth = 1, textureHeight = 1;
        if ( textureFlag ) {
            if ( textureParams.gValue !== 0 ) {
                if ( textureParams.gUnit === MEASURE.texMetr ) {
                    textureWidth = width / textureParams.gValue;
                } else if ( textureParams.gUnit === MEASURE.texUnit ) {
                    textureWidth = textureParams.gValue;
                }
            }

            if ( textureParams.vValue !== 0 ) {
                if ( textureParams.vUnit === MEASURE.texMetr ) {
                    textureHeight = height / textureParams.vValue;
                } else if ( textureParams.vUnit === MEASURE.texUnit ) {
                    textureHeight = textureParams.vValue;
                }
            }
        }


        //face
        let startIndex = vertexList.length;
        vertexList.push( positions[ 0 ] );
        vertexList.push( positions[ 1 ] );
        vertexList.push( positions[ 3 ] );
        vertexList.push( positions[ 2 ] );
        if ( textureFlag ) {
            textureCoordsList.push( [0, 0] );
            textureCoordsList.push( [textureWidth, 0] );
            textureCoordsList.push( [0, textureHeight] );
            textureCoordsList.push( [textureWidth, textureHeight] );
        }
        indexList.push( startIndex + 2 );
        indexList.push( startIndex );
        indexList.push( startIndex + 3 );

        indexList.push( startIndex );
        indexList.push( startIndex + 1 );
        indexList.push( startIndex + 3 );

        if ( paintFlag === PAINT_FLAG.BOTH ) {
            //back
            startIndex = vertexList.length;
            vertexList.push( positions[ 1 ] );
            vertexList.push( positions[ 0 ] );
            vertexList.push( positions[ 2 ] );
            vertexList.push( positions[ 3 ] );
            if ( textureFlag ) {
                textureCoordsList.push( [0, 0] );
                textureCoordsList.push( [textureWidth, 0] );
                textureCoordsList.push( [0, textureHeight] );
                textureCoordsList.push( [textureWidth, textureHeight] );
            }

            indexList.push( startIndex + 2 );
            indexList.push( startIndex );
            indexList.push( startIndex + 3 );

            indexList.push( startIndex );
            indexList.push( startIndex + 1 );
            indexList.push( startIndex + 3 );
        }

        if ( !textureFlag ) {
            const defaultTextCoords = vec2.create();
            for ( let i = 0; i < vertexList.length; i++ ) {
                textureCoordsList.push( defaultTextCoords );
            }
        }

        const normalList = IMG3DQUAD.calcNormals( vertexList, indexList );

        const colorList: Vector4D[] = [];
        const defColor: Vector4D = [1, 1, 1, 1];
        for ( let i = 0; i < vertexList.length; i++ ) {
            colorList.push( defColor );
        }

        return {
            primitiveType: PrimitiveType.Triangles,
            vertexList,
            normalList,
            textureCoordsList,
            colorList,
            indexList
        };
    }

    private static calcNormals( posAttrValues: Vector3D[], indicesAttributeValues: number[] ) {
        //Добавление нормалей
        const curNormal: Vector3D = IMG3DELEMENT.mCurNormal;
        const normals: Vector3D[] = [];


        const face = vec3.create();
        const back = vec3.create();

        for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {

            const ind1 = indicesAttributeValues[ i ];
            const ind2 = indicesAttributeValues[ i + 1 ];
            const ind3 = indicesAttributeValues[ i + 2 ];

            Calculate.calcNormal( posAttrValues[ ind1 ], posAttrValues[ ind2 ], posAttrValues[ ind3 ], curNormal );
            let normal;

            if ( ind1 <= 3 ) {
                normal = face;
            } else {
                normal = back;
            }

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind1 ] = normal;
            }

            if ( ind2 <= 3 ) {
                normal = face;
            } else {
                normal = back;
            }

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind2 ] = normal;
            }
            if ( ind3 <= 3 ) {
                normal = face;
            } else {
                normal = back;
            }

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind3 ] = normal;
            }
        }
        for ( let i = 0; i < normals.length; i++ ) {
            vec3.normalize( normals[ i ] );
        }
        return normals;
    }
}


/**
 * Класс элемента-набора треугольников
 * @class IMG3DFACESET
 * @constructor IMG3DFACESET
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DFACESET extends IMG3DELEMENT {
    windingOrder: WindingOrder;
    Convex: ELEMENT3DFACESET['GEOMETRY']['Convex'];
    IndexCount: ELEMENT3DFACESET['GEOMETRY']['IndexCount'];
    solid: PAINT_FLAG;
    Vertex: ELEMENT3DFACESET['GEOMETRY']['Vertex'];
    VertexIndex: ELEMENT3DFACESET['GEOMETRY']['VertexIndex'];
    TexCoord: ELEMENT3DFACESET['GEOMETRY']['TexCoord'];
    Color: ELEMENT3DFACESET['GEOMETRY']['Color'];

    constructor( elem: ELEMENT3DFACESET ) {
        super( elem );
        const GEOMETRY = elem.GEOMETRY;

        this.windingOrder = GEOMETRY.FlagFrontFace === COMMON_FLAG.ENABLED ? WindingOrder.Counterclockwise : WindingOrder.Clockwise;

        this.Convex = GEOMETRY.Convex;
        this.IndexCount = GEOMETRY.IndexCount;

        this.solid = GEOMETRY.Solid === COMMON_FLAG.ENABLED ? PAINT_FLAG.FRONTFACE : PAINT_FLAG.BOTH;

        this.Vertex = GEOMETRY.Vertex;
        this.VertexIndex = GEOMETRY.VertexIndex;

        // if (this.solid === PAINT_FLAG.BOTH) {
        //     for (const i = this.VertexIndex.length - 1; i >= 0; i--) {
        //         this.VertexIndex.push(this.VertexIndex[i]);
        //     }
        // }
        // this.Normal = GEOMETRY.Normal;
        //this.creaseAngle = GEOMETRY.CreaseAngle;// сейчас не используется
        this.TexCoord = GEOMETRY.TexCoord;
        this.Color = GEOMETRY.Color;

    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ): ElementMesh {
        let parentMatrix;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }
        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );


        const vertexArray = this.Vertex;
        const vertexIndexArray = this.VertexIndex;

        // if (this.Normal) {
        //     const normalArray = this.Normal;
        // }

        const vertexList: Vector3D[] = []; // Координаты вершин
        // Заполнение массива координат вершин
        for ( let i = 0; i < vertexArray.length; i++ ) {
            const currentVertex = vertexArray[ i ];
            const curPoint: Vector3D = [currentVertex.X, currentVertex.Y, currentVertex.Z];
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            // Координаты точек
            vertexList.push( curPoint );
        }

        let indexList: number[];
        if ( this.windingOrder === WindingOrder.Counterclockwise ) {
            indexList = vertexIndexArray.slice();
        } else {
            indexList = [];
            for ( let i = 0; i < vertexIndexArray.length; i += 3 ) {
                indexList.push( vertexIndexArray[ i + 2 ] );
                indexList.push( vertexIndexArray[ i + 1 ] );
                indexList.push( vertexIndexArray[ i ] );
            }
        }

        const textureCoordsList: Vector3D[] = [];
        const transparentTex = this.Color ? 1 : 0;
        if ( this.TexCoord ) {
            // Заполнение массива координат текстур граней
            for ( let i = 0; i < this.TexCoord.length; i++ ) {
                const currentTexCoord = this.TexCoord[ i ];
                // Координаты точек
                textureCoordsList.push( [currentTexCoord.X, currentTexCoord.Y, transparentTex] );
            }
        } else {
            const defTextureCoords = vec3.create();
            for ( let i = 0; i < vertexArray.length; i++ ) {
                textureCoordsList.push( defTextureCoords );
            }
        }
        const colorList: Vector4D[] = [];
        if ( this.Color ) {
            // Заполнение массива координат текстур граней
            for ( let i = 0; i < this.Color.length; i++ ) {
                const currentColor = this.Color[ i ];
                // Координаты точек
                colorList.push( [currentColor.R, currentColor.G, currentColor.B, currentColor.A] );
            }
        } else {
            const defColor: Vector4D = [1, 1, 1, 1];
            for ( let i = 0; i < vertexArray.length; i++ ) {
                colorList.push( defColor );
            }

        }

        if ( paintFlag === PAINT_FLAG.BOTH ) {
            //back
            const vertexCount = vertexList.length;
            for ( let i = 0; i < vertexCount; i++ ) {
                colorList.push( colorList[ i ] );
            }

            for ( let i = 0; i < vertexCount; i++ ) {
                vertexList.push( vertexList[ i ] );
            }
            for ( let i = 0; i < vertexCount; i++ ) {
                textureCoordsList.push( textureCoordsList[ i ] );
            }
            const indexCount = indexList.length;
            for ( let i = 0; i < indexCount; i += 3 ) {
                indexList.push( vertexCount + indexList[ i + 2 ] );
                indexList.push( vertexCount + indexList[ i + 1 ] );
                indexList.push( vertexCount + indexList[ i ] );
            }
        }


        const normalList = IMG3DFACESET.calcNormals( vertexList, indexList );

        for ( let i = 0; i < vertexList.length; i++ ) {
            if ( normalList[ i ] === undefined ) {
                normalList[ i ] = vec3.create( vec3.UNITZ );
            }
        }

        return {
            primitiveType: PrimitiveType.Triangles,
            vertexList,
            normalList,
            textureCoordsList,
            colorList,
            indexList
        };
    }

    private static calcNormals( posAttrValues: Vector3D[], indicesAttributeValues: number[] ) {
        //Добавление нормалей

        const curNormal: Vector3D = IMG3DELEMENT.mCurNormal;
        const normals: Vector3D[] = [];

        for ( let i = 0; i < indicesAttributeValues.length; i += 3 ) {

            const ind1 = indicesAttributeValues[ i ];
            const ind2 = indicesAttributeValues[ i + 1 ];
            const ind3 = indicesAttributeValues[ i + 2 ];

            Calculate.calcNormal( posAttrValues[ ind1 ], posAttrValues[ ind2 ], posAttrValues[ ind3 ], curNormal );

            let normal = normals[ ind1 ];

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind1 ] = normal;
            } else {
                normals[ ind1 ] = curNormal.slice() as typeof curNormal;
            }


            normal = normals[ ind2 ];

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind2 ] = normal;
            } else {
                normals[ ind2 ] = curNormal.slice() as typeof curNormal;
            }

            normal = normals[ ind3 ];

            if ( normal ) {
                vec3.add( normal, curNormal );
                normals[ ind3 ] = normal;
            } else {
                normals[ ind3 ] = curNormal.slice() as typeof curNormal;
            }
        }
        for ( let i = 0; i < normals.length; i++ ) {
            if ( normals[ i ] !== undefined ) { //TODO: ???
                vec3.normalize( normals[ i ] );
            }
        }
        return normals;
    }
}

/**
 * Класс элемента линий
 * @class IMG3DLINE
 * @constructor IMG3DLINE
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DLINE extends IMG3DELEMENT {
    Vertex: ELEMENT3DLINE['GEOMETRY']['Vertex'];

    constructor( elem: ELEMENT3DLINE ) {
        super( elem );
        const GEOMETRY = elem.GEOMETRY;
        this.Vertex = GEOMETRY.Vertex;
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ): ElementMesh {
        let parentMatrix;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }
        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );


        const vertexArray = this.Vertex;

        const vertexList: Vector3D[] = []; // Координаты вершин
        // Заполнение массива координат вершин
        for ( let i = 0; i < vertexArray.length; i++ ) {
            const currentVertex = vertexArray[ i ];
            const curPoint: Vector3D = [currentVertex.X, currentVertex.Y, currentVertex.Z];
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            // Координаты точек
            vertexList.push( curPoint );
        }

        const normalList: Vector3D[] = [];
        const indexList: number[] = [];
        const defNormal: Vector3D = [0, 0, 1];
        for ( let i = 0; i < vertexArray.length; i++ ) {
            normalList.push( defNormal );
            indexList.push( i );
        }

        return {
            primitiveType: PrimitiveType.Lines,
            vertexList,
            normalList,
            textureCoordsList: [],
            colorList: [],
            indexList
        };
    }
}

/**
 * Класс элемента-набора линий
 * @class IMG3DLINESET
 * @constructor IMG3DLINESET
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DLINESET extends IMG3DELEMENT {
    Vertex: ELEMENT3DLINESET['GEOMETRY']['Vertex'];
    Color: ELEMENT3DLINESET['GEOMETRY']['Color'];

    constructor( elem: ELEMENT3DLINESET ) {
        super( elem );
        const GEOMETRY = elem.GEOMETRY;

        this.Vertex = GEOMETRY.Vertex;
        this.Color = GEOMETRY.Color;
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ): ElementMesh {
        let parentMatrix;
        if ( this.matrixLevel !== -1 ) {
            parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
        } else {
            parentMatrix = transformMatrixList[ 0 ];
        }
        const transformMatrix = mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );


        const vertexArray = this.Vertex;

        const vertexList: Vector3D[] = []; // Координаты вершин
        // Заполнение массива координат вершин
        for ( let i = 0; i < vertexArray.length; i++ ) {
            const currentVertex = vertexArray[ i ];
            const curPoint: Vector3D = [currentVertex.X, currentVertex.Y, currentVertex.Z];
            mat4.multiplyPoint3( transformMatrix, curPoint, curPoint );
            // Координаты точек
            vertexList.push( curPoint );
        }

        const colorList: Vector4D[] = [];
        if ( this.Color ) {
            for ( let i = 0; i < this.Color.length; i++ ) {
                const color = this.Color[ i ];
                colorList.push( [color.R, color.G, color.B, color.A] );
            }
        }

        const normalList: Vector3D[] = [];
        const indexList: number[] = [];
        const textureCoordsList: Vector2D[] = [];
        const defNormal: Vector3D = [1, 1, 1];
        const defTextureCoords = vec2.create();
        for ( let i = 0; i < vertexArray.length; i++ ) {
            normalList.push( defNormal );
            indexList.push( i );
            textureCoordsList.push( defTextureCoords );
        }

        return {
            primitiveType: PrimitiveType.Lines,
            vertexList,
            normalList,
            textureCoordsList,
            colorList,
            indexList
        };
    }
}

/**
 * Класс произвольного элемента
 * @class IMG3DANY
 * @constructor IMG3DANY
 * @param elem {Object} Описание элемента из классификатора
 */
class IMG3DANY extends IMG3DELEMENT {
    constructor( elem: ELEMENT3D ) {
        super( elem );
    }

    createElementMesh( transformMatrixList: Matrix4x4[], paintFlag: PAINT_FLAG, textureParams: TextureParams ) {
        if ( this.matrixLevel !== -1 ) {
            const parentMatrix = transformMatrixList[ this.matrixLevel - 1 ];
            transformMatrixList[ this.matrixLevel ] = this.mTransformMatrix;
            mat4.multiply( parentMatrix, this.transformMatrix, this.mTransformMatrix );
        }
    }
}
