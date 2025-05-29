/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Разбор объектов 3d карты                      *
 *                                                                  *
 *******************************************************************/

//TODO: привести в порядок

import { SimpleJson } from '~/types/CommonTypes';
import { Matrix4x4, Vector3D } from '~/3d/engine/core/Types';
import { FLOATPOINT, IMG3DPOINT, IMG3DRGBA } from '~/3d/engine/worker/workerscripts/parse3dtiles';
import { mat4 } from '~/3d/engine/utils/glmatrix';

export enum FUNCTION3D_TYPE {
    F3D_UNDEFINED = -1,
    F3D_NULL = 0,  // Пустая функция - ничего не рисует
    F3D_EMPTY = 1,  // Пустая функция - рисует отсутствие объекта
    F3D_MARK = 2,  // Знак
    F3D_MARKBYLINE = 3,  // Знак по линии
    F3D_MARKBYPOINT = 4,  // Знак по точкам    (F3D_MARK)
    F3D_MARKBYSQUARE = 5,  // Знак по площади

    F3D_VERTBYLINE = 6,  // Вертикальная плоскость по линии
    F3D_HORIZONTBYLINE = 7,  // Горизонтальная плоскость по линии
    F3D_HORIZONT = 8,  // Горизонтальная плоскость
    F3D_LINEBYSURFACE = 9,  // Полоса учетом поверхности
    F3D_TREE = 10,  // Набор функций
    F3D_TOPONSQUARE = 11,  // "Крыша над площадным" (на основе F3D_VERTBYLINE)
    F3D_SQUARECYLINDER = 12,  // Цилиндр горизонтальный над площадным

    F3D_FLATLINE = 14,  // Плоская линия
    F3D_SURFACE = 15,  // Плоскость с учетом поверхности (поверхность по рельефу)
    F3D_SECTIONBYLINE = 16,  // Линия c заданным сечением
    F3D_SLOPEONSQUARE = 17,  // Склон над площадным
    F3D_TEXT = 18,  // Текст по вертикальной плоскости
    F3D_HORIZONT_ANIMATED = 19  // Горизонтальная плоскость анимированная
    // (эффект воды)
}

export enum ELEMENT3DTYPE {
    IMG3D_ANY = 0,  // Произвольный
    IMG3D_CUBE = 1,  // Куб
    IMG3D_SPHERE = 2,  // Сфера
    IMG3D_CYLINDER = 3,  // Цилиндр и конус
    // IMG3D_CONE = 3,  // Конус
    IMG3D_QUAD = 4,  // Четырехугольник
    IMG3D_ADJOINQUAD = 5,  // Примыкающий четырехугольник
    IMG3D_COMBPOLYGON = 6,  // Связанный многоугольник

    IMG3D_LINE = 11,  // Линия сплошная
    IMG3D_FACESET = 12,  // Массив многоугольников (поверхность)
    IMG3D_POINTSET = 13,  // Массив точек
    IMG3D_LINESET = 14,  // Массив линий
    IMG3D_GRID = 15,  // Сетка
    IMG3D_SURFSPHERE = 16,  // Сферическая поверхность
    IMG3D_EXTRUSION = 17  // ЭКСТРУЗИЯ
}

export enum VECTOR_ORIENTATION3D {      // Флаг ориентации для векторного знака:
    VM_UNDIRECTED = 0,           //   0 - неориентированный,
    VM_BYCURCUT = 1,             //   1 - ориентация вдоль метрики текущего отрезка,
    VM_BYLASTCUT = 2,            //   2 -  -"-  вдоль метрики предыдущего отрезка,
    VM_BYANGLE = 3,              //   3 -  -"-  вдоль биссектрисы угла, в вершине которого ставится знак
    VM_BYOBSERVER = 4,           //   4 -  -"-  на наблюдателя перпендикулярно поверхности
    VM_BYLARGSIDE = 5,           //   5 -  -"-  вдоль наибольшего отрезка метрики
    VM_BYOBSER = 6,              //   6 -  -"-  на наблюдателя
    VM_ANYTURN = 7,              //   7 -  случайный поворот
    VM_ANIMATION = 8,            //   8 -  знак анимированный
    VM_ORIENTATION = 15,         // Проверка наличия флагов от VM_BYCURCUT до VM_ANIMATION (1111)
    // Флаги VM_NOSCALE, VM_ANYSIZE, VM_ANYPOS, VM_VERTICAL - дополняют по "|":
    VM_NOSCALE = 16,             //  16 - не масштабируемый   // флаги до 16 - взаимоисключающие
    VM_ANYSIZE = 32,             //  32 - случайное изменение размера знака
    VM_ANYPOS = 64,              //  64 - случайное положение (для площадных)
    VM_VERTICAL = 128            //  128 - любая ориентация, но по высоте - вертикально вверх
}

export enum VISIBLE_PART {
    IMG3D_ALL = 0,
    IMG3D_SIDES = 1,       // Отображать стороны
    IMG3D_BOTTOM = 2,      //            низ
    IMG3D_TOP = 4,         //            верх
    IMG3D_CLIP = 8,        // Не отображать невидимую часть
    IMG3D_BEGIN = 16,      // Отображать сечение в первой точке метрики
    IMG3D_END = 32,        // Отображать сечение в последней точке метрики
    IMG3D_RIGHTSIDE = 64,  // Отображать стенку склона с 1 на 2 точку метрики
    IMG3D_LEFTSIDE = 128,  // Отображать стенку склона с 3 на 4 точку метрики
    IMG3D_BACK = 256       // Отображать заднюю стенку склона (2-3)
}

export enum EXTENSION {
    IMG3D_EXTENSION1 = 1,    // Вынос в 1 сторону метрики
    IMG3D_EXTENSION2 = 2,    // Вынос в 2 сторону метрики
    IMG3D_EXTENSION3 = 4,    // Вынос в 3 сторону метрики
    IMG3D_EXTENSION4 = 8     // Вынос в 4 сторону метрики
}

export enum SECT_TYPE {
    SECT_CIRCLE = 1,    // Oкружность
    SECT_RECT = 2,      // Прямоугольник
    SECT_MOUND = 3      // Трапеция(насыпь)
}

enum FLAG_VRML {    // Флаг загрузки знака из формата VRML
    COMMON = 0,     //   0 - обычный знак (редактируемый)
    VRML = 1,       //   1 - знак загруженный из VRML (нередактируемый)
    COLLADA = 2     //   2 - знак загруженный из коллада
}

export enum DIRECTION_BY_LONGEST_SERGMENT {
    ALONG = 0,      // 0 - вдоль самого длинного отрезка метрики объекта
    ACROSS = 1,     // 1 - поперек самого длинного отрезка метрики объекта

}

export enum TRANSFORM_FLAG {
    NONE = 0,            //   0 - нет "верхнего" трансформа у знака
    IMG3DTRANSFORM = 1,  //   1 - после структуры F3DMARK, лежит структура IMG3DTRANSFORM
    IMG3DMATRIX = 2      //   2 - после структуры F3DMARK, лежит структура IMG3DMATRIX
}


export enum SURFACE_TYPE {
    ALLBYRELIEF = 0, // с учетом рельефа местности
    ALLFREE = 1,     // без учета рельефа (построение по высотам ведется относительно максимальной высоты метрики объекта)
    TOPFREE = 2      // без учета рельфа для верхней границы плоскости (высота плоскости отладывается относительно максимальной
    // высоты метрики объекта + RelativeHeight)
}

export enum TEXTUREMEASURE {
    texGMetr = 1,               // Размер текстуры по горизонтали в метрах
    texGUnit = 2,               // Размер текстуры по горизонтали в разах
    texVMetr = 4,               // Размер текстуры по вертикали в метрах
    texVUnit = 8,               // Размер текстуры по вертикали в разах
    texGMetrVUnit = 9,          // Размер текстуры по горизонтали в метрах и по вертикали в разах
    texGUnitVUnit = 10          // Размер текстуры по горизонтали в разах и по вертикали в разах
}

export enum PAINT_FLAG {
    BOTH = 0,
    FRONTFACE = 1
}

export enum COMMON_FLAG {
    DISABLED = 0,
    ENABLED = 1
}

export enum BOLD_FLAG { // Флаг ширины окантовки
    THIN = 0,   // 0 - узкая
    NORMAL = 1, // 1 - нормальная
    THICK = 2   // 2 - широкая
}

export enum TEXTURE_REPEAT {
    NOT = 0,          // Не повторять (тянуть)
    HOR = 1,          // По горизонтали
    VER = 2,          // По вертикали
    ALL = 3          // По обоим направлениям
}

export enum LOCALE {//Массив номеров локализаций (соответствует ГИС карте: 0 - линейный, 1- площадной, 2 - точечный, 3 - подпись, 4 - векторный, 5 - шаблон)
    Line = 0,
    Plane = 1,
    Point = 2,
    Text = 3,
    Vector = 4,
    Template = 5
}


export type HeadWEB3D = {
    Ident: number;
    TreeCount: number;
    TextureCount: number;
    Version: number;
    Tree: number;
    Texture: number;
}


type TEXTURETYPE = {
    Type: number;
    Code: string;
    Key: number;
    Level: number;
    SemKey?: string;
}

type  RECTEXTURE = {
    Height: number;
    Width: number;
    Image: Uint8Array | ArrayBufferLike;
}

export type TEXTURE = TEXTURETYPE & { Texture?: RECTEXTURE; }


type WEB3DOBJECTIDENT = {
    Key: string;
    Code: number;
    Local: LOCALE;
    Level: number;
    Distance: number;
    LayerId: string;
    ClassifierName: string;
}

export type OBJECT3D = WEB3DOBJECTIDENT & { F3DTREE: FUNCTIONTREE }

type F3DTREE = {
    Ident: number;
    MaxIdent: number;
    Count: number;
}
export type FUNCTIONTREE = F3DTREE & { FUNCTIONLIST: FUNCTION3D[] };


type F3DHEAD = {
    Number: FUNCTION3D_TYPE;
    Ident: number;
}


type FUNCTION_NODELIST = { NODELIST?: NODE3D[]; }

type FUNCTIONHEADER = {
    Ident: number;
    FUNCTIONPARAMS?: FUNCTION_NODELIST
};

export type FUNCTION3D = FUNCTIONHEADER & ({
    Number: FUNCTION3D_TYPE.F3D_UNDEFINED;
} | {
    Number: FUNCTION3D_TYPE.F3D_NULL;
} |
    FUNCTION3DMARK | FUNCTION3DMARKBYPOINT | FUNCTION3DMARKBYLINE | FUNCTION3DMARKBYSQUARE |
    FUNCTION3DVERTBYLINE | FUNCTION3DHORIZONTBYLINE | FUNCTION3DHORIZONT | FUNCTION3DSQUARECYLINDER | FUNCTION3DSECTIONBYLINE | FUNCTION3DSLOPEONSQUARE | {
    Number: FUNCTION3D_TYPE.F3D_TEXT;
    FUNCTIONPARAMS: F3DTEXT;
});


export type FUNCTION3DMARK = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_MARK;
    FUNCTIONPARAMS: F3DMARKINPOINT;
}

export type FUNCTION3DMARKBYPOINT = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_MARKBYPOINT;
    FUNCTIONPARAMS: F3DMARKINPOINT;
}
export type FUNCTION3DMARKBYLINE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_MARKBYLINE;
    FUNCTIONPARAMS: F3DMARKBYLINE;
}
export type FUNCTION3DMARKBYSQUARE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_MARKBYSQUARE;
    FUNCTIONPARAMS: F3DMARKBYSQUARE;
}
export type FUNCTION3DVERTBYLINE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_VERTBYLINE | FUNCTION3D_TYPE.F3D_TOPONSQUARE | FUNCTION3D_TYPE.F3D_FLATLINE;
    FUNCTIONPARAMS: F3DVERTBYLINE;
}
export type FUNCTION3DHORIZONTBYLINE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_HORIZONTBYLINE | FUNCTION3D_TYPE.F3D_LINEBYSURFACE;
    FUNCTIONPARAMS: F3DHORIZONTBYLINE;
}
export type FUNCTION3DHORIZONT = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_HORIZONT | FUNCTION3D_TYPE.F3D_SURFACE;
    FUNCTIONPARAMS: F3DHORIZONT;
}
export type FUNCTION3DSQUARECYLINDER = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_SQUARECYLINDER;
    FUNCTIONPARAMS: F3DSQUARECYLINDER;
}
export type FUNCTION3DSECTIONBYLINE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_SECTIONBYLINE;
    FUNCTIONPARAMS: F3DSECTIONBYLINE;
}
export type FUNCTION3DSLOPEONSQUARE = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_SLOPEONSQUARE;
    FUNCTIONPARAMS: F3DSLOPEONSQUARE;
}
export type FUNCTION3DTEXT = FUNCTIONHEADER & {
    Number: FUNCTION3D_TYPE.F3D_TEXT;
    FUNCTIONPARAMS: F3DTEXT;
}

type TRANSFORM3D = { IMG3DTRANSFORM?: IMG3DTRANSFORM; IMG3DTMATRIX?: IMG3DTMATRIX; }

type F3DMARKINPOINT = { Mark: { FUNCTIONPARAMS: F3DMARK & TRANSFORM3D & FUNCTION_NODELIST } };
type F3DMARKBYLINE = F3DMARKINPOINT & {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Distance: IMG3DVALUE;
}

type F3DMARKBYSQUARE = F3DMARKINPOINT & {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    DistanceX: IMG3DVALUE;
    DistanceZ: IMG3DVALUE;
}

type F3DMARK = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    SizeX: IMG3DVALUE;
    SizeZ: IMG3DVALUE;
    Scale: Vector3D;
    Vector: VECTOR_ORIENTATION3D;
    FlagVRML: FLAG_VRML;
    TransformFlag: TRANSFORM_FLAG;
    SizeScaleFactor: number;
    Point: [IMG3DPOINT, IMG3DPOINT];
    Count: number;
    MarkIncode: number;
    SurfaceFlag?: SURFACE_TYPE
}


type F3DVERTBYLINE = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Removal: IMG3DVALUE;
    SurfaceFlag: SURFACE_TYPE;
    Count: number;
}
type F3DHORIZONTBYLINE = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    WidthPlane: IMG3DVALUE;
    Removal: IMG3DVALUE;
    SurfaceFlag: SURFACE_TYPE;
    Count: number;
}
type F3DHORIZONT = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Count: number;
}
type F3DSQUARECYLINDER = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Part: number;
    Direct: DIRECTION_BY_LONGEST_SERGMENT;
    Count: number;
}
type  F3DSECTIONBYLINE = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Removal: IMG3DVALUE;
    SurfaceFlag: SURFACE_TYPE;
    PlugFlag: VISIBLE_PART;
    Type: SECT_TYPE;
    Count: number;
    Radius: IMG3DVALUE;
}
type F3DSLOPEONSQUARE = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Extension: IMG3DVALUE;
    SurfaceFlag: SURFACE_TYPE;
    Part: VISIBLE_PART;
    ExtensionPart: EXTENSION;
    Count: number;
}
type  F3DTEXT = {
    Height: IMG3DVALUE;
    RelativeHeight: IMG3DVALUE;
    Removal: IMG3DVALUE;
    SurfaceFlag: SURFACE_TYPE;
    Vector: VECTOR_ORIENTATION3D;
    Count: number;
    TextParam: number[];
}

export type NODE3D = IMG3DNODE & TRANSFORM3D & { DESCRIPTIONLIST: DESCRIPTION3D[] };

type IMG3DNODE = {
    TransformFlag: TRANSFORM_FLAG;
    Size: [IMG3DVALUE, IMG3DVALUE, IMG3DVALUE];
    Count: number;
};

export type DESCRIPTION3D = IMG3DDESCRIPTION & { ELEMENTLIST: ELEMENT3D[]; }

type IMG3DDESCRIPTION = {
    ColorFlag: COMMON_FLAG;
    MaterialFlag: COMMON_FLAG;
    TextureFlag: COMMON_FLAG;
    SemColorFlag: COMMON_FLAG;
    Color: IMG3DRGBA | IMG3DVALUE;
    Material: ACT3DMATERIALMODE;
    Transparent: COMMON_FLAG;
    Smooth: COMMON_FLAG | BOLD_FLAG;
    Texture: TEXTURETYPE;
    FlagMeasure: TEXTUREMEASURE;
    TransparentTex: COMMON_FLAG;
    SmoothTex: COMMON_FLAG;
    WrapTex: TEXTURE_REPEAT;
    PaintFlag: PAINT_FLAG;
    WrapValue: [IMG3DVALUE, IMG3DVALUE]
    Count: number;
    TransformFlag: TRANSFORM_FLAG;
};


export type ELEMENT3D =
    ELEMENT3DCUBE
    | ELEMENT3DSPHERE
    | ELEMENT3DCYLINDER
    | ELEMENT3DQUAD
    | ELEMENT3DLINE
    | ELEMENT3DFACESET
    | ELEMENT3DPOINTSET
    | ELEMENT3DLINESET
    | ELEMENT3DGRID
    | ELEMENT3DEXTRUSION;

export type ELEMENT3DCUBE = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_CUBE;
    GEOMETRY: IMG3DCUBE;
}
export type ELEMENT3DSPHERE = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_SPHERE;
    GEOMETRY: IMG3DSPHERE;
}
export type ELEMENT3DCYLINDER = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_CYLINDER;
    GEOMETRY: IMG3DCYLINDER;
}
export type ELEMENT3DQUAD = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_QUAD | ELEMENT3DTYPE.IMG3D_ADJOINQUAD;
    GEOMETRY: IMG3DQUAD;
}
export type ELEMENT3DLINE = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_LINE;
    GEOMETRY: IMG3DLINE;
}
export type ELEMENT3DFACESET = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_FACESET;
    GEOMETRY: IMG3DFACESET;
}
export type ELEMENT3DPOINTSET = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_POINTSET;
    GEOMETRY: IMG3DPOINTSET;
}
export type ELEMENT3DLINESET = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_LINESET;
    GEOMETRY: IMG3DLINESET;
}
export type ELEMENT3DGRID = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_GRID;
    GEOMETRY: IMG3DGRID;
}
export type ELEMENT3DEXTRUSION = TRANSFORM3D & {
    Type: ELEMENT3DTYPE.IMG3D_EXTRUSION;
    GEOMETRY: IMG3DEXTRUSION;
}


type IMG3DELEMENT = {
    Type: ELEMENT3DTYPE;
};

type IMG3DCUBE = {
    Point: IMG3DPOINT;
    Rotate: IMG3DROTATION;
    Width: number;
    Height: number;
    Depth: number;
}

type IMG3DSPHERE = {
    Point: IMG3DPOINT;
    Rotate: IMG3DROTATION;
    Radius: number;
}

type IMG3DCYLINDER = {
    Point: IMG3DPOINT;
    Rotate: IMG3DROTATION;
    Part: VISIBLE_PART;
    Radius: number;
    RadiusH: number;
    Height: number;
};

type IMG3DQUAD = { Vertex: [IMG3DPOINT, IMG3DPOINT, IMG3DPOINT, IMG3DPOINT] };

type IMG3DLINE = {
    Count: number;
    Width: number;
    Vertex: IMG3DPOINT[]
};

type IMG3DFACESET = {
    CreaseAngle: number;
    FlagFrontFace: COMMON_FLAG;
    ColorPerVertex: COMMON_FLAG;
    Convex: COMMON_FLAG;
    Solid: COMMON_FLAG;
    IndexCount: number;
    Vertex: IMG3DPOINT[];
    VertexIndex: number[];
    TexCoord?: FLOATPOINT[];
    Color?: IMG3DRGBA[];
};

type IMG3DPOINTSET = {
    Count: number;
    ColorPlace: number;
    Vertex: IMG3DPOINT[];
    Color: IMG3DRGBA[];
};

type IMG3DLINESET = {
    LineCount: number;
    IndexCountPlace: number;
    VertexIndexPlace: number;
    ColorPlace: number;
    ColorIndexPlace: number;
    ColorPerVertex: COMMON_FLAG;
    IndexCount: number;
    VertexIndex: number[];
    VertexCount: number;
    Vertex: IMG3DPOINT[];
    Color?: IMG3DRGBA[];
};

type  IMG3DGRID = {
    XDimension: number;
    YDimension: number;
    XSpacing: number;
    YSpacing: number;
    TexCoordPlace: number;
    ColorPlace: number;
    NormalPlace: number;
    CreaseAngle: number;
    FlagFrontFace: COMMON_FLAG;
    ColorPerVertex: COMMON_FLAG;
    NormalPerVertex: COMMON_FLAG;
    Convex: COMMON_FLAG;
    Solid: COMMON_FLAG;
    VertexCount: number;
    Vertex: number[];
    TexCoord?: FLOATPOINT[];
    NormalCount: number;
    ColorCount: number;
    Color: IMG3DRGBA[];
    Normal: IMG3DPOINT[];

};

type IMG3DEXTRUSION = {
    BeginCap: COMMON_FLAG;
    EndCap: COMMON_FLAG;
    SectionVertexCount: number;
    SpinePointCount: number;
    SpinePlace: number;
    ScaleCount: number;
    ScalePlace: number;
    OrientationCount: number;
    OrientationPlace: number;
    CreaseAngle: number;
    FlagFrontFace: COMMON_FLAG;
    Convex: COMMON_FLAG;
    Solid: COMMON_FLAG;
    SectionVertex: FLOATPOINT[];
    SpinePoint: IMG3DPOINT[]
    Scale?: FLOATPOINT[];
    Orientation: IMG3DPOINT[];
}

type IMG3DSURFACEDESC = {
    FaceVertexCount: number;
    FaceCount: number;
};

export type IMG3DVALUE = {
    Value: number;
    Type: number;
    SemKey?: string;
    Factor: number;
    Offset: number;
};

export type ACT3DMATERIALMODE = {
    AmbientColor: IMG3DRGBA;
    DiffuseColor: IMG3DRGBA;
    SpecularColor: IMG3DRGBA;
    EmissiveColor: IMG3DRGBA;
    Shininess: number;
};

type IMG3DROTATION = IMG3DPOINT & {
    Angle: number;
}

export type IMG3DTRANSFORM = {
    Center: IMG3DPOINT;
    Translation: IMG3DPOINT;
    Removal: IMG3DROTATION;
    Scale: IMG3DPOINT;
    ScaleOrientation: IMG3DROTATION;
    Level: number;
}

type IMG3DTMATRIX = {
    Matrix: Matrix4x4;
    Rezerve: number[];
}


export default class Parser3d {
    private static littleEndian = true;
    private static mTextureDescription: TEXTURETYPE[] = [];
    private static SEMDICTIONARY?: SimpleJson;

    private static readonly nonMarkerList = [
        FUNCTION3D_TYPE.F3D_VERTBYLINE,
        FUNCTION3D_TYPE.F3D_TOPONSQUARE,
        FUNCTION3D_TYPE.F3D_FLATLINE,
        FUNCTION3D_TYPE.F3D_HORIZONTBYLINE,
        FUNCTION3D_TYPE.F3D_LINEBYSURFACE,
        FUNCTION3D_TYPE.F3D_HORIZONT,
        FUNCTION3D_TYPE.F3D_SURFACE,
        FUNCTION3D_TYPE.F3D_SQUARECYLINDER,
        FUNCTION3D_TYPE.F3D_SECTIONBYLINE,
        FUNCTION3D_TYPE.F3D_SLOPEONSQUARE,
        FUNCTION3D_TYPE.F3D_TEXT
    ];

    /**
     * Разбор шаблонов трёхмерных объектов
     * @method readObject3D
     * @public
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param SEMDICTIONARY {Object} Список семантик
     * @return {Object} Описание объекта
     */
    static readObject3D( Head3DArray: ArrayBuffer, SEMDICTIONARY?: SimpleJson ) {

        this.SEMDICTIONARY = SEMDICTIONARY;
        const structureHeadWEB3D = this.getHeadWEB3D( Head3DArray );
        const HeadWEB3D = structureHeadWEB3D.HeadWEB3D;
        if ( HeadWEB3D.Ident !== 0x3D && HeadWEB3D.Ident !== 0x3D01 ) {
            return null;
        }
        const ObjectArray: OBJECT3D[] = [];
        // обработка объектов
        let curoffset = HeadWEB3D.Tree + structureHeadWEB3D.HeadOffset;
        const leng = HeadWEB3D.TreeCount;
        for ( let ii = 0; ii < leng; ii++ ) {
            const structureWEB3DOBJECTIDENT = this.getWEB3DOBJECTIDENT( Head3DArray, curoffset, HeadWEB3D.Version );
            const currentObject = structureWEB3DOBJECTIDENT.WEB3DOBJECTIDENT;
            curoffset = structureWEB3DOBJECTIDENT.HeadOffset;

            const structureF3DTREE = this.getF3DTREE( Head3DArray, curoffset );
            const f3dtree = structureF3DTREE.F3DTREE;
            curoffset = structureF3DTREE.HeadOffset;
            // обработка функций
            const FUNCTIONLIST: FUNCTION3D[] = [];
            const len = f3dtree.Count;
            for ( let funcii = 0; funcii < len; funcii++ ) {
                const structureF3DHEAD = this.getF3DHEAD( Head3DArray, curoffset );
                const { Ident, Number } = structureF3DHEAD.F3DHEAD;

                let func: FUNCTION3D;
                curoffset = structureF3DHEAD.HeadOffset;

                switch ( Number ) {
                    case FUNCTION3D_TYPE.F3D_MARK:
                    case FUNCTION3D_TYPE.F3D_MARKBYPOINT:
                        const structureF3DMARKINPOINT = this.getF3DMARKINPOINT( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DMARKINPOINT.F3DMARKINPOINT };
                        curoffset = structureF3DMARKINPOINT.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_MARKBYLINE:
                        const structureF3DMARKBYLINE = this.getF3DMARKBYLINE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DMARKBYLINE.F3DMARKBYLINE };
                        curoffset = structureF3DMARKBYLINE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_MARKBYSQUARE:
                        const structureF3DMARKBYSQUARE = this.getF3DMARKBYSQUARE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DMARKBYSQUARE.F3DMARKBYSQUARE };
                        curoffset = structureF3DMARKBYSQUARE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_VERTBYLINE:
                    case FUNCTION3D_TYPE.F3D_TOPONSQUARE:
                    case FUNCTION3D_TYPE.F3D_FLATLINE:
                        const structureF3DVERTBYLINE = this.getF3DVERTBYLINE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DVERTBYLINE.F3DVERTBYLINE };
                        curoffset = structureF3DVERTBYLINE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_HORIZONTBYLINE:
                    case FUNCTION3D_TYPE.F3D_LINEBYSURFACE:
                        const structureF3DHORIZONTBYLINE = this.getF3DHORIZONTBYLINE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DHORIZONTBYLINE.F3DHORIZONTBYLINE };
                        curoffset = structureF3DHORIZONTBYLINE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_HORIZONT:
                    case FUNCTION3D_TYPE.F3D_SURFACE:
                        const structureF3DHORIZONT = this.getF3DHORIZONT( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DHORIZONT.F3DHORIZONT };
                        curoffset = structureF3DHORIZONT.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_SQUARECYLINDER:
                        const structureF3DSQUARECYLINDER = this.getF3DSQUARECYLINDER( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DSQUARECYLINDER.F3DSQUARECYLINDER };
                        curoffset = structureF3DSQUARECYLINDER.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_SECTIONBYLINE:
                        const structureF3DSECTIONBYLINE = this.getF3DSECTIONBYLINE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DSECTIONBYLINE.F3DSECTIONBYLINE };
                        curoffset = structureF3DSECTIONBYLINE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_SLOPEONSQUARE:
                        const structureF3DSLOPEONSQUARE = this.getF3DSLOPEONSQUARE( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DSLOPEONSQUARE.F3DSLOPEONSQUARE };
                        curoffset = structureF3DSLOPEONSQUARE.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_TEXT:
                        const structureF3DTEXT = this.getF3DTEXT( Head3DArray, curoffset );
                        func = { Ident, Number, FUNCTIONPARAMS: structureF3DTEXT.F3DTEXT };
                        curoffset = structureF3DTEXT.HeadOffset;
                        break;
                    case FUNCTION3D_TYPE.F3D_NULL:
                        func = { Ident, Number };
                        FUNCTIONLIST[ funcii ] = func;
                        break;
                    default:
                        continue;
                }

                let functionparams;
                if ( func.Number === FUNCTION3D_TYPE.F3D_NULL ) {
                    continue;
                } else if ( func.Number === FUNCTION3D_TYPE.F3D_MARK ||
                    func.Number === FUNCTION3D_TYPE.F3D_MARKBYPOINT ||
                    func.Number === FUNCTION3D_TYPE.F3D_MARKBYLINE ||
                    func.Number === FUNCTION3D_TYPE.F3D_MARKBYSQUARE ) {
                    functionparams = func.FUNCTIONPARAMS.Mark.FUNCTIONPARAMS;

                    // добавление трансформирования
                    if ( functionparams.TransformFlag === TRANSFORM_FLAG.IMG3DTRANSFORM ) {
                        const structureIMG3DTRANSFORM = this.getIMG3DTRANSFORM( Head3DArray, curoffset );
                        functionparams.IMG3DTRANSFORM = structureIMG3DTRANSFORM.IMG3DTRANSFORM;
                        curoffset = structureIMG3DTRANSFORM.HeadOffset;
                    } else if ( functionparams.TransformFlag === TRANSFORM_FLAG.IMG3DMATRIX ) {
                        const structureIMG3DTMATRIX = this.getIMG3DTMATRIX( Head3DArray, curoffset );
                        functionparams.IMG3DTMATRIX = structureIMG3DTMATRIX.IMG3DTMATRIX;
                        curoffset = structureIMG3DTMATRIX.HeadOffset;
                    }
                } else {
                    functionparams = func.FUNCTIONPARAMS;
                }


                if( functionparams === undefined ) {
                    continue;
                }

                const nodecount = Reflect.get( functionparams,'Count' );

                if ( nodecount === undefined ) {
                    continue;
                }


                // обработка узлов
                const NODELIST: NODE3D[] = [];
                for ( let nodeii = 0; nodeii < nodecount; nodeii++ ) {
                    const structureIMG3DNODE = this.getIMG3DNODE( Head3DArray, curoffset );
                    const node = structureIMG3DNODE.IMG3DNODE;
                    curoffset = structureIMG3DNODE.HeadOffset;
                    let IMG3DTRANSFORM, IMG3DTMATRIX;
                    // добавление трансформирования
                    if ( node.TransformFlag === TRANSFORM_FLAG.IMG3DTRANSFORM ) {
                        const structureIMG3DTRANSFORM = this.getIMG3DTRANSFORM( Head3DArray, curoffset );
                        IMG3DTRANSFORM = structureIMG3DTRANSFORM.IMG3DTRANSFORM;
                        curoffset = structureIMG3DTRANSFORM.HeadOffset;
                    } else if ( node.TransformFlag === TRANSFORM_FLAG.IMG3DMATRIX ) {
                        const structureIMG3DTMATRIX = this.getIMG3DTMATRIX( Head3DArray, curoffset );
                        IMG3DTMATRIX = structureIMG3DTMATRIX.IMG3DTMATRIX;
                        curoffset = structureIMG3DTMATRIX.HeadOffset;
                    }

                    // обработка описаний
                    const DESCRIPTIONLIST: DESCRIPTION3D[] = [];
                    for ( let descii = 0; descii < node.Count; descii++ ) {
                        const structureIMG3DDESCRIPTION = this.getIMG3DDESCRIPTION( Head3DArray, curoffset );
                        const description = structureIMG3DDESCRIPTION.IMG3DDESCRIPTION;
                        curoffset = structureIMG3DDESCRIPTION.HeadOffset;

                        // если не знак, то дальше ничего нет
                        if ( !this.isMarkType( func.Number ) ) {
                            DESCRIPTIONLIST[ descii ] = { ...description, ELEMENTLIST: [] };
                            continue;
                        }

                        const ELEMENTLIST: ELEMENT3D[] = [];
                        // обработка елементов
                        for ( let elemii = 0; elemii < description.Count; elemii++ ) {

                            let TRANSFORM3D: TRANSFORM3D | undefined = undefined;
                            // добавление трансформирования для каждого элемента                                  // 22/03/17
                            if ( description.TransformFlag === TRANSFORM_FLAG.IMG3DTRANSFORM ) {
                                const structureIMG3DTRANSFORM = this.getIMG3DTRANSFORM( Head3DArray, curoffset );
                                const IMG3DTRANSFORM = structureIMG3DTRANSFORM.IMG3DTRANSFORM;
                                TRANSFORM3D = { IMG3DTRANSFORM };
                                curoffset = structureIMG3DTRANSFORM.HeadOffset;
                            } else if ( description.TransformFlag === TRANSFORM_FLAG.IMG3DMATRIX ) {
                                const structureIMG3DTMATRIX = this.getIMG3DTMATRIX( Head3DArray, curoffset );
                                const IMG3DTMATRIX = structureIMG3DTMATRIX.IMG3DTMATRIX;
                                TRANSFORM3D = { IMG3DTMATRIX };
                                curoffset = structureIMG3DTMATRIX.HeadOffset;
                            }


                            const structureIMG3DELEMENT = this.getIMG3DELEMENT( Head3DArray, curoffset );
                            const elementHead: IMG3DELEMENT = structureIMG3DELEMENT.IMG3DELEMENT;
                            const Type = elementHead.Type;
                            curoffset = structureIMG3DELEMENT.HeadOffset;


                            let element: ELEMENT3D | undefined = undefined;
                            switch ( Type ) {
                                case ELEMENT3DTYPE.IMG3D_CUBE:
                                    const structureIMG3DCUBE = this.getIMG3DCUBE( Head3DArray, curoffset );
                                    curoffset = structureIMG3DCUBE.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DCUBE.IMG3DCUBE };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_SPHERE:
                                    const structureIMG3DSPHERE = this.getIMG3DSPHERE( Head3DArray, curoffset );
                                    curoffset = structureIMG3DSPHERE.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DSPHERE.IMG3DSPHERE };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_CYLINDER:
                                    const structureIMG3DCYLINDER = this.getIMG3DCYLINDER( Head3DArray, curoffset );
                                    curoffset = structureIMG3DCYLINDER.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DCYLINDER.IMG3DCYLINDER };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_QUAD:
                                case ELEMENT3DTYPE.IMG3D_ADJOINQUAD:
                                    const structureIMG3DQUAD = this.getIMG3DQUAD( Head3DArray, curoffset );
                                    curoffset = structureIMG3DQUAD.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DQUAD.IMG3DQUAD };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_LINE:
                                    const structureIMG3DLINE = this.getIMG3DLINE( Head3DArray, curoffset );
                                    curoffset = structureIMG3DLINE.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DLINE.IMG3DLINE };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_FACESET:
                                    const structureIMG3DFACESET = this.getIMG3DFACESET( Head3DArray, curoffset );
                                    curoffset = structureIMG3DFACESET.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DFACESET.IMG3DFACESET };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_POINTSET:
                                    const structureIMG3DPOINTSET = this.getIMG3DPOINTSET( Head3DArray, curoffset );
                                    curoffset = structureIMG3DPOINTSET.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DPOINTSET.IMG3DPOINTSET };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_LINESET:
                                    const structureIMG3DLINESET = this.getIMG3DLINESET( Head3DArray, curoffset );
                                    curoffset = structureIMG3DLINESET.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DLINESET.IMG3DLINESET };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_GRID:
                                    const structureIMG3DGRID = this.getIMG3DGRID( Head3DArray, curoffset );
                                    curoffset = structureIMG3DGRID.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DGRID.IMG3DGRID };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_EXTRUSION:
                                    const structureIMG3DEXTRUSION = this.getIMG3DEXTRUSION( Head3DArray, curoffset );
                                    curoffset = structureIMG3DEXTRUSION.HeadOffset;
                                    element = { Type, ...TRANSFORM3D, GEOMETRY: structureIMG3DEXTRUSION.IMG3DEXTRUSION };
                                    break;
                                case ELEMENT3DTYPE.IMG3D_ANY:
                                    continue;
                            }

                            if ( element ) {
                                ELEMENTLIST.push( element );
                            }
                        }
                        DESCRIPTIONLIST[ descii ] = { ...description, ELEMENTLIST };
                    }

                    NODELIST[ nodeii ] = { ...node, IMG3DTRANSFORM, IMG3DTMATRIX, DESCRIPTIONLIST };
                }
                functionparams.NODELIST = NODELIST;

                if ( func.Number === FUNCTION3D_TYPE.F3D_TEXT && (func.FUNCTIONPARAMS.Vector & VECTOR_ORIENTATION3D.VM_ORIENTATION) === VECTOR_ORIENTATION3D.VM_BYOBSER && NODELIST.length > 0 && NODELIST[ 0 ].DESCRIPTIONLIST ) {
                    const description = NODELIST[ 0 ].DESCRIPTIONLIST[ 0 ];
                    if ( description ) {
                        FUNCTIONLIST[ f3dtree.Count ] = this.createTextPointerLineset( func.Ident, func.FUNCTIONPARAMS.RelativeHeight.Value, description.Color, description.Material.AmbientColor );
                    } else {
                        FUNCTIONLIST[ f3dtree.Count ] = this.createTextPointerLineset( func.Ident, func.FUNCTIONPARAMS.RelativeHeight.Value );
                    }
                }

                FUNCTIONLIST[ funcii ] = func;
            }

            ObjectArray[ ii ] = { ...currentObject, F3DTREE: { ...f3dtree, FUNCTIONLIST } };
        }

        // обработка текстур
        let TextureArray: TEXTURE[] = [];
        curoffset = HeadWEB3D.Texture;
        for ( let ii = 0; ii < HeadWEB3D.TextureCount; ii++ ) {
            const structureTEXTURETYPE = this.getTEXTURETYPE( Head3DArray, curoffset );
            const currentTexture: TEXTURE = structureTEXTURETYPE.TEXTURETYPE;
            curoffset = structureTEXTURETYPE.HeadOffset;
            if ( HeadWEB3D.Version < 130200 || !SEMDICTIONARY ) {
                const structureRECTEXTURE = this.getRECTEXTURE( Head3DArray, curoffset );
                currentTexture.Texture = structureRECTEXTURE.RECTEXTURE;
                curoffset = structureRECTEXTURE.HeadOffset;
            }

            TextureArray[ ii ] = currentTexture;

        }

        if ( HeadWEB3D.Version >= 130200 && TextureArray.length === 0 ) {
            TextureArray = this.mTextureDescription.slice();
        }
        this.mTextureDescription.length = 0;
        this.SEMDICTIONARY = undefined;

        return {
            HeadWEB3D,
            ObjectArray,
            TextureArray
        };
    }

    /**
     * Проверка, является ли структура знаком
     * @method isMarkType
     * @private
     * @param num {Number} Номер функции структуры
     * @return {Boolean} true - тип структуры - знак,
     *                  false - тип структуры не знак
     */
    private static isMarkType( num: number ) {
        return this.nonMarkerList.indexOf( num ) === -1;
    }


    /**
     * Создать заголовок шаблона 3D-модели объекта
     * @method getHeadWEB3D
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @return {Object} Описание объекта
     */
    private static getHeadWEB3D( Head3DArray: ArrayBuffer ) {
        const dataView = new DataView( Head3DArray, 0, 24 );

        const Ident = dataView.getUint32( 0, this.littleEndian );         // Идентификатор записи 0x3D, обозначающий начало данных
        const TreeCount = dataView.getUint32( 4, this.littleEndian );      // Кол-во объектов
        const TextureCount = dataView.getUint32( 8, this.littleEndian );  // Кол-во текстур
        let Version = dataView.getUint32( 12, this.littleEndian );     // Версия ответа
        let Tree = dataView.getUint32( 16, this.littleEndian );         // Смещение на начало объектов (F3DTREE)
        const Texture = dataView.getUint32( 20, this.littleEndian );      // Смещение на начало текстур (RECTEXTURE)
        const HeadOffset = 24;
        if ( Ident === 0x3D ) {
            Version = 0;
            Tree = 0;
        }
        const HeadWEB3D: HeadWEB3D = {
            Ident,
            TreeCount,
            TextureCount,
            Version,
            Tree,
            Texture
        };

        return { HeadWEB3D, HeadOffset };
    }


    /**
     * Заполнить описание объекта F3DHEAD
     * @method getF3DHEAD
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DHEAD( Head3DArray: ArrayBuffer, offset: number ) {
        const dataView = new DataView( Head3DArray, offset, 16 );

        // Набор функций F3DHEAD
        // const Length = dataView.getUint32( 0, this.littleEndian );   // Длина параметров
        const Number = dataView.getUint32( 4, this.littleEndian );   // Номер функции
        const Ident = dataView.getInt32( 8, this.littleEndian );    // Идентификатор функции
        // const Reserve = dataView.getUint32( 12, this.littleEndian );  // Резерв
        const HeadOffset = offset + 16;

        const F3DHEAD: F3DHEAD = {
            Number,
            Ident
        };

        return {
            F3DHEAD,
            HeadOffset
        };
    }

    /**
     * Заполнить описание объекта GetF3DTREE
     * @method getF3DTREE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DTREE( Head3DArray: ArrayBuffer, offset: number ) {
        const dataView = new DataView( Head3DArray, offset, 16 );
        // Набор функций F3DTREE
        const Ident = dataView.getUint32( 0, this.littleEndian );    // Идентификатор записи 0x73DD73DD
        // const Length = dataView.getUint32( 4, this.littleEndian );   // Длина записи
        const MaxIdent = dataView.getUint32( 8, this.littleEndian ); // Максимальный использованный идентификатор функции
        const Count = dataView.getUint32( 12, this.littleEndian );    // Количество функций
        const HeadOffset = offset + 16;

        const F3DTREE: F3DTREE = {
            Ident,
            MaxIdent,
            Count
        };

        return {
            F3DTREE,
            HeadOffset
        };
    }

    /**
     * Заполнить структуру F3DMARK
     * @method getF3DMARK
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DMARK( Head3DArray: ArrayBuffer, offset: number ) {
        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset );
        const Height = structureIMG3DVALUE.IMG3DVALUE;           			                        // Высота знака (по Y)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;                                      // Высота расположения знака относительно метрики
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const SizeX = structureIMG3DVALUE.IMG3DVALUE;                                               // Размеры знака (ширина(по X))
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const SizeZ = structureIMG3DVALUE.IMG3DVALUE;                                               // Размеры знака (длина(по Z)))

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 16 );

        const Scale: Vector3D = [                                                                   // Флаги масштабируемости
            dataView.getInt32( 0, this.littleEndian ),        					        // по ширине (по X),
            dataView.getInt32( 4, this.littleEndian ),								    // по высоте(по Y),
            dataView.getInt32( 8, this.littleEndian )                                    // по длине(по Z)
        ];
        const Vector: VECTOR_ORIENTATION3D = dataView.getInt8( 12 );
        const FlagVRML: FLAG_VRML = dataView.getInt8( 13 );
        const TransformFlag: TRANSFORM_FLAG = dataView.getInt8( 14 );

        const SizeScaleFactor = dataView.getInt8( 15 );// Коэффициент масштабирования размеров знака
        // от 0 до 100 (%), если установлен Vector + ANYSIZEFLAG

        const curoffset = structureIMG3DVALUE.HeadOffset + 16;

        let structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );   // координаты точки начала знака относительно точки метрики
        const Point0 = structureIMG3DPOINT.IMG3DPOINT;   // координаты точки начала знака относительно точки метрики
        structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, structureIMG3DPOINT.HeadOffset ); // смещение минимума габаритов знака относительно
        const Point1 = structureIMG3DPOINT.IMG3DPOINT; // смещение минимума габаритов знака относительно
        // точки начала знака (задается двумя точками от нуля знака)
        const Point: [IMG3DPOINT, IMG3DPOINT] = [Point0, Point1];

        const dataView2 = new DataView( Head3DArray, structureIMG3DPOINT.HeadOffset, 8 );

        const Count = dataView2.getInt32( 0, this.littleEndian );       // Количество узлов
        const MarkIncode = dataView2.getInt32( 4, this.littleEndian );  // Внутренний код знака
        const HeadOffset = structureIMG3DPOINT.HeadOffset + 8;


        const FUNCTIONPARAMS: F3DMARK = {
            Height,
            RelativeHeight,
            SizeX,
            SizeZ,
            Scale,
            Vector,
            FlagVRML,
            TransformFlag,
            SizeScaleFactor,
            Point,
            Count,
            MarkIncode
        };

        return { F3DMARK: { FUNCTIONPARAMS }, HeadOffset };
    }


    /**
     * Заполнить структуру F3DMARKINPOINT
     * @method getF3DMARKINPOINT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DMARKINPOINT( Head3DArray: ArrayBuffer, offset: number ) {          // ЗНАК ПО ЛИНИИ

        const structureF3DMARK = this.getF3DMARK( Head3DArray, offset ); 				// Описание знака
        const F3DMARKINPOINT: F3DMARKINPOINT = { Mark: structureF3DMARK.F3DMARK }; 				// Описание знака
        const HeadOffset = structureF3DMARK.HeadOffset;
        return { F3DMARKINPOINT, HeadOffset };
    }

    /**
     * Заполнить структуру F3DMARKBYLINE
     * @method getF3DMARKBYLINE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DMARKBYLINE( Head3DArray: ArrayBuffer, offset: number ) {          // ЗНАК ПО ЛИНИИ
        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset );
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							                    // Высота знака (по Y)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	                                    // Высота расположения знака относительно метрики
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const Distance = structureIMG3DVALUE.IMG3DVALUE;	                                        // Расстояние по линии между знаками
        const structureF3DMARK = this.getF3DMARK( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const Mark = structureF3DMARK.F3DMARK; 				                                        // Описание знака
        const HeadOffset = structureF3DMARK.HeadOffset;

        const F3DMARKBYLINE: F3DMARKBYLINE = {
            Height,
            RelativeHeight,
            Distance,
            Mark
        };

        return { F3DMARKBYLINE, HeadOffset };
    }


    /**
     * Заполнить структуру F3DMARKBYSQUARE
     * @method getF3DMARKBYSQUARE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DMARKBYSQUARE( Head3DArray: ArrayBuffer, offset: number ) {         // ЗНАК ПО ПЛОЩАДИ

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset ); 							// Высота знака (по Y)
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							// Высота знака (по Y)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Высота расположения знака относительно метрики
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	// Высота расположения знака относительно метрики
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );// Расстояние по оси X между знаками
        const DistanceX = structureIMG3DVALUE.IMG3DVALUE;// Расстояние по оси X между знаками
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );		// Расстояние по оси Z между знаками
        const DistanceZ = structureIMG3DVALUE.IMG3DVALUE;		// Расстояние по оси Z между знаками
        const structureF3DMARK = this.getF3DMARK( Head3DArray, structureIMG3DVALUE.HeadOffset ); 			// Описание знака
        const Mark = structureF3DMARK.F3DMARK; 			// Описание знака
        const HeadOffset = structureF3DMARK.HeadOffset;

        const F3DMARKBYSQUARE: F3DMARKBYSQUARE = {
            Height,
            RelativeHeight,
            DistanceX,
            DistanceZ,
            Mark
        };

        return { F3DMARKBYSQUARE, HeadOffset };
    }


    /**
     * Заполнить структуру F3DVERTBYLINE
     * @method getF3DVERTBYLINE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DVERTBYLINE( Head3DArray: ArrayBuffer, offset: number ) {          // ВЕРТИКАЛЬНАЯ ПЛОСКОСТЬ ПО ЛИНИИ

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset ); 							// Высота плоскости(вверх)
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							// Высота плоскости(вверх)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Высота расположения плоскости относительно метрики объекта:
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	// Высота расположения плоскости относительно метрики объекта:
        //       положительная - вверх,
        //       отрицательная - внизметрики
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Смещение плоскости по поверхности, относительно метрики объекта(пока нет)
        const Removal = structureIMG3DVALUE.IMG3DVALUE;	// Смещение плоскости по поверхности, относительно метрики объекта(пока нет)

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 8 );

        const SurfaceFlag: SURFACE_TYPE = dataView.getInt32( 0, this.littleEndian );       						// Флаг расположения плоскости относительно поверхности: ALLBYRELIEF, ALLFREE, TOPFREE (см. выше)
        const Count = dataView.getInt32( 4, this.littleEndian );  									// Количество узлов
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 8;

        const F3DVERTBYLINE: F3DVERTBYLINE = {
            Height,
            RelativeHeight,
            Removal,
            SurfaceFlag,
            Count
        };

        return { F3DVERTBYLINE, HeadOffset };
    }

    /**
     * Заполнить структуру F3DHORIZONTBYLINE
     * @method getF3DHORIZONTBYLINE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DHORIZONTBYLINE( Head3DArray: ArrayBuffer, offset: number ) {         // Горизонтальная плоскость по линии

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset ); 							// Высота плоскости(вверх)(= 0)
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							// Высота плоскости(вверх)(= 0)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Высота расположения плоскости относительно метрики объекта
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	// Высота расположения плоскости относительно метрики объекта
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );// Ширина плоскости
        const WidthPlane = structureIMG3DVALUE.IMG3DVALUE;// Ширина плоскости
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );      // Смещение плоскости по поверхности, относительно метрики объекта(пока нет)
        const Removal = structureIMG3DVALUE.IMG3DVALUE;      // Смещение плоскости по поверхности, относительно метрики объекта(пока нет)

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 8 );

        const SurfaceFlag: SURFACE_TYPE = dataView.getInt32( 0, this.littleEndian );       						// Флаг расположения плоскости относительно поверхности: ALLBYRELIEF, ALLFREE, TOPFREE (см. выше)
        const Count = dataView.getInt32( 4, this.littleEndian );  									// Количество узлов
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 8;

        const F3DHORIZONTBYLINE: F3DHORIZONTBYLINE = {
            Height,
            RelativeHeight,
            WidthPlane,
            Removal,
            SurfaceFlag,
            Count
        };

        return { F3DHORIZONTBYLINE, HeadOffset };
    }

    /**
     * Заполнить структуру F3DHORIZONT
     * @method getF3DHORIZONT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DHORIZONT( Head3DArray: ArrayBuffer, offset: number ) {        // Горизонтальная плоскость

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset ); 							// Высота плоскости(вверх)(= 0)
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							// Высота плоскости(вверх)(= 0)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Высота расположения плоскости относительно метрики объекта
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	// Высота расположения плоскости относительно метрики объекта

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 8 );

        const Count = dataView.getInt32( 0, this.littleEndian );       						// Количество узлов
        // const Reserve = dataView.getInt32( 4, this.littleEndian );
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 8;

        const F3DHORIZONT: F3DHORIZONT = {
            Height,
            RelativeHeight,
            Count
        };

        return { F3DHORIZONT, HeadOffset };
    }


    /**
     * Заполнить структуру F3DSQUARECYLINDER
     * @method getF3DSQUARECYLINDER
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DSQUARECYLINDER( Head3DArray: ArrayBuffer, offset: number ) {          // Цилиндр горизонтальный погруженный по площади (четыре точки)

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset ); 							// Высота видимой части основания (если ноль-отображается половина цилиндра)
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							// Высота видимой части основания (если ноль-отображается половина цилиндра)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );	// Высота расположения плоскости относительно метрики объекта
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	// Высота расположения плоскости относительно метрики объекта

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 16 );

        const Part = dataView.getUint32( 0, this.littleEndian );       						// Отображаемые части (IMG3D_ALL - IMG3D_CLIP)
        const Direct: DIRECTION_BY_LONGEST_SERGMENT = dataView.getUint32( 4, this.littleEndian );
        // const Reserve = dataView.getUint32( 8, this.littleEndian );
        const Count = dataView.getInt32( 12, this.littleEndian );  							// Количество узлов
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 16;

        const F3DSQUARECYLINDER: F3DSQUARECYLINDER = {
            Height,
            RelativeHeight,
            Part,
            Direct,
            Count
        };

        return { F3DSQUARECYLINDER, HeadOffset };
    }

    /**
     * Заполнить структуру F3DSECTIONBYLINE
     * @method getF3DSECTIONBYLINE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DSECTIONBYLINE( Head3DArray: ArrayBuffer, offset: number ) {           // Линия c заданным сечением

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset );
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							                    // Высота плоскости(вверх)(= высоте эл-та)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	                                    // Высота расположения центра сечения относительно метрики объекта
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const Removal = structureIMG3DVALUE.IMG3DVALUE;                                             // Смещение сечения по поверхности, относительно метрики объекта(пока нет)

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 24 );

        const SurfaceFlag: SURFACE_TYPE = dataView.getInt32( 0, this.littleEndian );      // Флаг расположения сечения относительно поверхности: ALLBYRELIEF, ALLFREE(см. выше)
        const PlugFlag: VISIBLE_PART = dataView.getInt32( 4, this.littleEndian );
        const Type: SECT_TYPE = dataView.getInt32( 8, this.littleEndian );
        // const Length = dataView.getInt32( 12, this.littleEndian );  						// Длина параметров сечения(вместе с метрикой)
        const Count = dataView.getInt32( 16, this.littleEndian ); 						// Количество узлов
        // const Reserve = dataView.getInt32( 20, this.littleEndian );

        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset + 24 );
        const Radius = structureIMG3DVALUE.IMG3DVALUE;

        const HeadOffset = structureIMG3DVALUE.HeadOffset;


        const F3DSECTIONBYLINE: F3DSECTIONBYLINE = {
            Height,
            RelativeHeight,
            Removal,
            SurfaceFlag,
            PlugFlag,
            Type,
            Count,
            Radius
        };

        return { F3DSECTIONBYLINE, HeadOffset };
    }


    /**
     * Заполнить структуру F3DSLOPEONSQUARE
     * @method getF3DSLOPEONSQUARE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DSLOPEONSQUARE( Head3DArray: ArrayBuffer, offset: number ) {          // Склон над площадным

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset );
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							                    // Высота склона(вверх) положительная - вверх, отрицательная - вниз
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	                                    // Высота расположения шаблона относительно метрики объекта	положительная - над метрикой, отрицательная - под метрикой
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const Extension = structureIMG3DVALUE.IMG3DVALUE;                                           // Вынос (во все указанные стороны)

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 32 );

        const SurfaceFlag: SURFACE_TYPE = dataView.getInt32( 0, this.littleEndian );      // Флаг расположения плоскости относительно поверхности: ALLBYRELIEF, ALLFREE, TOPFREE (см. выше)
        const Part: VISIBLE_PART = dataView.getUint32( 4, this.littleEndian );            // Отображаемые части (IMG3D_ALL,IMG3D_TOP, IMG3D_RIGHTSIDE, IMG3D_LEFTSIDE,IMG3D_BACK)
        const ExtensionPart: EXTENSION = dataView.getUint32( 8, this.littleEndian );
        const Count = dataView.getInt32( 12, this.littleEndian );  		               // Количество узлов
        // const Reserve = dataView.getInt32( 16, this.littleEndian );
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 32;

        const F3DSLOPEONSQUARE: F3DSLOPEONSQUARE = {
            Height,
            RelativeHeight,
            Extension,
            SurfaceFlag,
            Part,
            ExtensionPart,
            Count
        };

        return { F3DSLOPEONSQUARE, HeadOffset };
    }

    /**
     * Заполнить структуру F3DTEXT
     * @method getF3DTEXT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getF3DTEXT( Head3DArray: ArrayBuffer, offset: number ) {          // TEKCT НА ВЕРТИКАЛЬНОЙ ПЛОСКОСТИ ПО МЕТРИКЕ

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset );
        const Height = structureIMG3DVALUE.IMG3DVALUE; 							                    // Высота плоскости(вверх)
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const RelativeHeight = structureIMG3DVALUE.IMG3DVALUE;	                                    // Высота расположения плоскости относительно метрики объекта: положительная - вверх, отрицательная - вниз
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const Removal = structureIMG3DVALUE.IMG3DVALUE;                                             // Смещение плоскости по поверхности, относительно метрики объекта(пока нет)

        const dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 144 );

        // const Length = dataView.getInt32( 0, this.littleEndian );       	                // Размер структуры (64+32)
        const SurfaceFlag: SURFACE_TYPE = dataView.getInt32( 4, this.littleEndian );	                // Флаг расположения плоскости относительно поверхности: ALLBYRELIEF, ALLFREE, TOPFREE (см. выше)
        const Vector: VECTOR_ORIENTATION3D = dataView.getInt32( 8, this.littleEndian );       	                // Флаг ориентации для подписей: 0 - неориентированный,	4 -  -"-  на наблюдателя перпендикулярно поверхности 6 -  -"-  на наблюдателя MARKSCALEFLAG - масштабируемый   // флаги до 16 - взаимоисключающие 16 (32,64)  - дополняют по ||.
        const Count = dataView.getInt32( 12, this.littleEndian );		                // Количество узлов

        const TextParam: number[] = [];
        for ( let ii = 0; ii < 32; ii++ ) {
            TextParam[ ii ] = dataView.getInt32( 16 + ii * 4, this.littleEndian );
        }
        ///            const HeadOffset = structureIMG3DVALUE.HeadOffset + 152;
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 144;

        const F3DTEXT: F3DTEXT = {
            Height,
            RelativeHeight,
            Removal,
            SurfaceFlag,
            Vector,
            Count,
            TextParam
        };

        return { F3DTEXT, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DVALUE
     * @method getIMG3DVALUE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DVALUE( Head3DArray: ArrayBuffer, offset: number ) {
        const dataView = new DataView( Head3DArray, offset, 16 );

        const Type = dataView.getInt32( 0, this.littleEndian ) as -1 | 0 | 1;     // 0 - брать значение
        // > 0 брать номер семантики
        // < 0  - брать по ссылке на функцию IMG3DRELATE

        let SemKey = '';
        let Factor = 0;
        let Offset = 0;

        const Value = dataView.getFloat32( 4, this.littleEndian );                // Значение

        if ( Type !== 0 ) {
            if ( Type > 0 && this.SEMDICTIONARY ) {
                SemKey = this.SEMDICTIONARY[ Type ];
            }
            Factor = dataView.getFloat32( 8, this.littleEndian );               // Коэффициент для значения( кроме Type == 0)
            Offset = dataView.getFloat32( 12, this.littleEndian );              // Сдвиг значения( кроме Type == 0)
        }
        const HeadOffset = offset + 16;

        const IMG3DVALUE: IMG3DVALUE = {
            Type,
            SemKey,
            Value,
            Factor,
            Offset
        };

        return { IMG3DVALUE, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DPOINT
     * @method getIMG3DPOINT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DPOINT( Head3DArray: ArrayBuffer, offset: number ) {         // ТОЧКА

        const dataView = new DataView( Head3DArray, offset, 24 );
        // Получение координат с учетом перевода из системы координат шаблона (локальной версии)
        // в систему WEB-приложения (Xw = Xл Yw = -Zл Zw = Yл)
        const X = dataView.getFloat64( 0, this.littleEndian );                    // 17/03/17
        const Y = dataView.getFloat64( 8, this.littleEndian );
        const Z = dataView.getFloat64( 16, this.littleEndian );
        const HeadOffset = offset + 24;

        const IMG3DPOINT: IMG3DPOINT = {
            X,
            Y,
            Z
        };

        return { IMG3DPOINT, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DSCALE
     * @method getIMG3DSCALE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DSCALE( Head3DArray: ArrayBuffer, offset: number ) {         // ТОЧКА               // 23/03/17

        const dataView = new DataView( Head3DArray, offset, 24 );
        // Получение коэффициентов масштабирования с учетом перевода из системы координат шаблона (локальной версии)
        // в систему WEB-приложения (Xw = Xл Yw = Zл Zw = Yл)
        const X = dataView.getFloat64( 0, this.littleEndian );
        const Y = dataView.getFloat64( 8, this.littleEndian );
        const Z = dataView.getFloat64( 16, this.littleEndian );
        const HeadOffset = offset + 24;

        const IMG3DSCALE: IMG3DPOINT = {
            X,
            Y,
            Z
        };

        return { IMG3DSCALE, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DELEMENT
     * @method getIMG3DELEMENT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DELEMENT( Head3DArray: ArrayBuffer, offset: number ) {           // ЭЛЕМЕНТ

        const dataView = new DataView( Head3DArray, offset, 8 );

        // const Length = dataView.getInt32( 0, this.littleEndian );
        //if (dataView.getInt32(4, this.littleEndian) == 12) { // 11/062018
        //    const Type = ELEMENT3DTYPE.IMG3D_CYLINDER;
        //} else {
        const Type: ELEMENT3DTYPE = dataView.getInt32( 4, this.littleEndian );
        //}

        const HeadOffset = offset + 8;

        const IMG3DELEMENT: IMG3DELEMENT = {
            Type
        };

        return { IMG3DELEMENT, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DNODE
     * @method getIMG3DNODE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DNODE( Head3DArray: ArrayBuffer, offset: number ) {          // УЗЕЛ

        const dataView = new DataView( Head3DArray, offset, 8 );

        // const Length = dataView.getInt32( 0, this.littleEndian );						// Длина записи
        const TransformFlag: TRANSFORM_FLAG = dataView.getInt8( 4 );					// Флаг наличия описания положения системы координат рисования узла 0 - структуры описания нет 1 - после IMG3DNODE идет структура описания положения IMG3DTRANSFORM (размер структуры входит в длину описания узла) 2 - после IMG3DNODE идет структура описания положения IMG3DTMATRIX (размер структуры входит в длину описания узла)

        // const Reserve1: number[] = [];
        // for ( let ii = 0; ii < 3; ii++ ) {
        //     Reserve1[ ii ] = dataView.getInt8( 5 + ii );
        // }

        // Размеры узла (ширина(по X), высота(по Y), длина(по Z))
        let newoffset = offset + 8;

        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, newoffset );
        const sizeX = structureIMG3DVALUE.IMG3DVALUE;
        newoffset = structureIMG3DVALUE.HeadOffset;
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, newoffset );
        const sizeY = structureIMG3DVALUE.IMG3DVALUE;
        newoffset = structureIMG3DVALUE.HeadOffset;
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, newoffset );
        const sizeZ = structureIMG3DVALUE.IMG3DVALUE;
        newoffset = structureIMG3DVALUE.HeadOffset;

        const Size: [IMG3DVALUE, IMG3DVALUE, IMG3DVALUE] = [sizeX, sizeY, sizeZ];
        const dataView2 = new DataView( Head3DArray, newoffset, 8 );

        const Count = dataView2.getInt32( 0, this.littleEndian );		// Количество описаний
        // const Reserve2 = dataView2.getInt32( 4, this.littleEndian );
        const HeadOffset = newoffset + 8;

        const IMG3DNODE: IMG3DNODE = {
            TransformFlag,
            Size,
            Count
        };

        return { IMG3DNODE, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DROTATION
     * @method getIMG3DROTATION
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DROTATION( Head3DArray: ArrayBuffer, offset: number ) {// ПОВОРОТ ЧАСТИ ОТНОСИТЕЛЬНО ТЕКУЩЕГО ПОЛОЖЕНИЯ

        const dataView = new DataView( Head3DArray, offset, 16 );
        // Получение вектора с учетом перевода из системы координат шаблона (локальной версии)
        // в систему WEB-приложения (Xw = Xл Yw = -Zл Zw = Yл)
        const X = dataView.getFloat32( 0, this.littleEndian );		// вектор-нормаль к плоскости вращения
        const Y = dataView.getFloat32( 4, this.littleEndian );
        const Z = dataView.getFloat32( 8, this.littleEndian );
        const Angle = dataView.getFloat32( 12, this.littleEndian );  // угол вращения против часовой стрелки в градусах
        const HeadOffset = offset + 16;

        const IMG3DROTATION: IMG3DROTATION = {
            X,
            Y,
            Z,
            Angle
        };

        return { IMG3DROTATION, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DTRANSFORM
     * @method getIMG3DTRANSFORM
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DTRANSFORM( Head3DArray: ArrayBuffer, offset: number ) {         // ОПИСАНИЕ ПОЛОЖЕНИЯ СИСТЕМЫ КООРДИНАТ РИСОВАНИЯ УЗЛА, ГРУППЫ ЭЛЕМЕНТОВ, ЭЛЕМЕНТА

        let structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, offset ); 							// Координаты центральной точки для преобразований координатной системы
        const Center = structureIMG3DPOINT.IMG3DPOINT; 							// Координаты центральной точки для преобразований координатной системы
        structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, structureIMG3DPOINT.HeadOffset );		// Смещения координатной системы относительно предыдущего рисования (родительской системы)
        const Translation = structureIMG3DPOINT.IMG3DPOINT;		// Смещения координатной системы относительно предыдущего рисования (родительской системы)
        let structureIMG3DROTATION = this.getIMG3DROTATION( Head3DArray, structureIMG3DPOINT.HeadOffset );  // Поворот координатной системы в системе координат знака
        const Removal = structureIMG3DROTATION.IMG3DROTATION;  // Поворот координатной системы в системе координат знака
        const structureIMG3DSCALE = this.getIMG3DSCALE( Head3DArray, structureIMG3DROTATION.HeadOffset );			// Масштабирование координатной системы
        const Scale = structureIMG3DSCALE.IMG3DSCALE;			// Масштабирование координатной системы
        structureIMG3DROTATION = this.getIMG3DROTATION( Head3DArray, structureIMG3DSCALE.HeadOffset );
        const ScaleOrientation = structureIMG3DROTATION.IMG3DROTATION;

        const dataView = new DataView( Head3DArray, structureIMG3DROTATION.HeadOffset, 40 );

        const Level = dataView.getInt32( 0, this.littleEndian );										// Уровень вложенности трасформирования элемента
        // const Reserve: number[] = [];
        // for ( let ii = 0; ii < 36; ii++ ) {
        //     Reserve[ ii ] = dataView.getInt8( 4 + ii );
        // }
        const HeadOffset = structureIMG3DROTATION.HeadOffset + 40;


        const IMG3DTRANSFORM: IMG3DTRANSFORM = {
            Center,
            Translation,
            Removal,
            Scale,
            ScaleOrientation,
            Level
        };

        return { IMG3DTRANSFORM, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DTMATRIX
     * @method getIMG3DTMATRIX
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DTMATRIX( Head3DArray: ArrayBuffer, offset: number ) {          // матрица моделирования МАТРИЦА ТРАНСФОРМИРОВАНИЯ СИСТЕМЫ КООРДИНАТ

        const dataView = new DataView( Head3DArray, offset, 144 );
        const Matrix = mat4.create( mat4.IDENTITY );	// Новая позиция системы отсчета относительно старой
        for ( let ii = 0; ii < 16; ii++ ) {
            Matrix[ ii ] = dataView.getFloat64( ii * 8, this.littleEndian );
        }

        const Rezerve: number[] = [];	// Уравнивание до размеров структуры IMG3DTRANSFORM
        for ( let ii = 0; ii < 16; ii++ ) {
            Rezerve[ ii ] = dataView.getInt8( 128 + ii );
        }
        const HeadOffset = offset + 144;
        const IMG3DTMATRIX: IMG3DTMATRIX = {
            Matrix,
            Rezerve
        };
        return { IMG3DTMATRIX, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DRGBA
     * @method getIMG3DRGBA
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DRGBA( Head3DArray: ArrayBuffer, offset: number ) {          // ЦВЕТ RGBA

        const dataView = new DataView( Head3DArray, offset, 16 );

        const R = dataView.getFloat32( 0, this.littleEndian );		// Красный
        const G = dataView.getFloat32( 4, this.littleEndian );       // Зеленый
        const B = dataView.getFloat32( 8, this.littleEndian );       // Синий
        const A = dataView.getFloat32( 12, this.littleEndian );  // Альфа, степень непрозрачности
        const HeadOffset = offset + 16;

        const IMG3DRGBA: IMG3DRGBA = {
            R,
            G,
            B,
            A
        };

        return { IMG3DRGBA, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DSURFACEDESC
     * @method getIMG3DSURFACEDESC
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DSURFACEDESC( Head3DArray: ArrayBuffer, offset: number ) {        // ОПИСАНИЕ ПОВЕРХНОСТИ

        const dataView = new DataView( Head3DArray, offset, 8 );

        const FaceVertexCount = dataView.getInt32( 0, this.littleEndian );	  // Количество вершин грани
        const FaceCount = dataView.getInt32( 4, this.littleEndian );       	  // Количество граней
        const HeadOffset = offset + 8;

        const IMG3DSURFACEDESC: IMG3DSURFACEDESC = {
            FaceVertexCount,
            FaceCount
        };

        return { IMG3DSURFACEDESC, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DFACESET
     * @method getIMG3DFACESET
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DFACESET( Head3DArray: ArrayBuffer, offset: number ) {          // МАССИВ МНОГОУГОЛЬНИКОВ

        const FACESETSIZE = 96;
        const dataView = new DataView( Head3DArray, offset, FACESETSIZE );

        const Length = dataView.getInt32( 0, this.littleEndian );	  		    // Длина записи
        const HeadOffset = Length + offset;

        const SurfaceDescCount = dataView.getInt32( 4, this.littleEndian );   // Количество записей типа IMG3DSURFACEDESC (т.е. количество поверхностей)
        const SurfaceDescPlace = dataView.getInt32( 8, this.littleEndian );   // Смещение на массив количества записей типа IMG3DSURFACEDESC
        const VertexCount = dataView.getInt32( 12, this.littleEndian );	    // Число координат вершин
        const VertexIndexPlace = dataView.getInt32( 16, this.littleEndian );  // Смещение на массив индексов вершин для построения поверхности от конца IMG3DFACESET, размерность LONG
        // const NormalPlace = dataView.getInt32(20, this.littleEndian);	    // Смещение на массив нормалей к поверхности от конца IMG3DFACESET, размерность членов массива IMG3DPOINT
        // const NormalIndexPlace = dataView.getInt32(24, this.littleEndian);  // Смещение на массив индексов нормалей к поверхности от конца IMG3DFACESET, размерность членов массива LONG
        const TexCoordPlace = dataView.getInt32( 28, this.littleEndian );	    // Смещение на массив координат текстуры от конца IMG3DFACESET, размерность членов массива DOUBLEPOINT
        const TexCoordIndexPlace = dataView.getInt32( 32, this.littleEndian );// Смещение на массив индексов координат текстуры от конца IMG3DFACESET, размерность членов массива LONG
        const ColorPlace = dataView.getInt32( 36, this.littleEndian );		// Смещение на массив цветов от конца IMG3DFACESET, размерность членов массива IMG3DRGBA
        const ColorIndexPlace = dataView.getInt32( 40, this.littleEndian );	// Смещение на массив индексов цветов от конца IMG3DFACESET, размерность членов массива LONG
        const CreaseAngle = dataView.getFloat32( 44, this.littleEndian );	    // Угол складки определяется как угол между двумя нормалями к поверхности на смежных гранях (в радианах)
        const FlagFrontFace: COMMON_FLAG = dataView.getInt8( 48 );		// Направление обхода при построении многоугольника (0 - по часовой стрелке, 1 - против часовой стрелки)
        const ColorPerVertex: COMMON_FLAG = dataView.getInt8( 49 );	// Распределение цветов (0 - по граням, 1 - по вершинам)
        // structure.NormalPerVertex = dataView.getInt8(50);	// Распределение нормалей (0 - по граням, 1 - по вершинам)
        const Convex: COMMON_FLAG = dataView.getInt8( 51 );			// Выпуклость поверхности (0 - неизвестно, 1 - выпуклая)
        const Solid: COMMON_FLAG = dataView.getInt8( 52 );				// Цельность фигуры (0 - неизвестно (освещение двустороннее), 1 - цельная (освещение снаружи))
        // structure.Reserve = [];											// После структуры располагается массив координат вершин (по числу), относительно нуля знака
        // for (const ii = 0; ii < 43; ii++) {
        //     structure.Reserve[ii] = dataView.getInt8(53 + ii);
        // }

        offset += FACESETSIZE;

        //  IMG3DPOINT     Vertex[1];
        const SurfaceDesc: IMG3DSURFACEDESC[] = [];
        //  кол-во индексов вершин (для четырехугольника будет 4)
        let IndexUniqCount = 0;
        //  кол-во граней (для четырехугольника будет 1)
        let TotalFaceCount = 0;
        // длина массива индексов (для четырехугольника будет 6)
        let IndexCount = 0;
        // кол-во нормалей
        let NormalCount = 0;

        let curoffset = offset + SurfaceDescPlace;
        for ( let ii = 0; ii < SurfaceDescCount; ii++ ) {
            const structureIMG3DSURFACEDESC = this.getIMG3DSURFACEDESC( Head3DArray, curoffset );
            const currentSurfaceDesc = SurfaceDesc[ ii ] = structureIMG3DSURFACEDESC.IMG3DSURFACEDESC;
            IndexUniqCount += currentSurfaceDesc.FaceVertexCount * currentSurfaceDesc.FaceCount;
            TotalFaceCount += currentSurfaceDesc.FaceCount;
            IndexCount += (currentSurfaceDesc.FaceVertexCount - 2) * 3 * currentSurfaceDesc.FaceCount;

            // по граням
            // if (structure.NormalPerVertex == 0) {
            //     NormalCount += currentSurfaceDesc.FaceCount;
            // }
            // по вершинам
            // else {
            NormalCount = VertexCount;
            // }
            curoffset = structureIMG3DSURFACEDESC.HeadOffset;
        }

        // массив вершин
        const Vertex: IMG3DPOINT[] = [];
        curoffset = offset;
        for ( let ii = 0; ii < VertexCount; ii++ ) {
            const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
            Vertex[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
            curoffset = structureIMG3DPOINT.HeadOffset;
        }

        curoffset = offset + VertexIndexPlace;
        // массив индексов вершин
        const structureLongArray = this.getLongArray( Head3DArray, curoffset, IndexUniqCount );
        let VertexIndex = structureLongArray.LArray;

        // if (NormalPlace != 0) {
        //     curoffset = offset + NormalPlace;
        //     // массив нормалей
        //     structure.Normal = [];
        //     for (ii = 0; ii < NormalCount; ii++) {
        //         const structureIMG3DPOINT = this.getIMG3DPOINT(Head3DArray, curoffset);
        //         structure.Normal[ii] = structureIMG3DPOINT.IMG3DPOINT;
        //         curoffset = structureIMG3DPOINT.HeadOffset;
        //     }
        //     // if (NormalIndexPlace != 0)
        //     //     curoffset = offset + NormalIndexPlace;
        //     // else
        //     //     curoffset = offset + VertexIndexPlace;
        //     // // массив индексов нормалей
        //     // structure.NormalIndex = this.getLongArray(Head3DArray, curoffset, NormalCount);
        // }

        let TexCoord;
        if ( TexCoordPlace !== 0 ) {
            let IndexUniqTextureCount = IndexUniqCount, TexCoordIndexArray;
            if ( TexCoordIndexPlace !== 0 ) {
                curoffset = offset + TexCoordIndexPlace;
                // массив индексов текстур
                const structureLongArray = this.getLongArray( Head3DArray, curoffset, IndexUniqCount );
                TexCoordIndexArray = structureLongArray.LArray;
                IndexUniqTextureCount = 0;
                for ( let ii = 0; ii < TexCoordIndexArray.length; ii++ ) {
                    IndexUniqTextureCount = Math.max( IndexUniqTextureCount, TexCoordIndexArray[ ii ] );
                }
                IndexUniqTextureCount += 1;
            }


            curoffset = offset + TexCoordPlace;
            // массив текстур
            const structureDOUBLEPOINTArray = this.getDOUBLEPOINTArray( Head3DArray, curoffset, IndexUniqTextureCount );
            TexCoord = structureDOUBLEPOINTArray.DArray;
            if ( TexCoordIndexArray ) {
                const texCoordNew: FLOATPOINT[] = [];
                // массив индексов текстур
                for ( let ii = 0; ii < VertexIndex.length; ii++ ) {
                    const vertextIndex = VertexIndex[ ii ];
                    const textureIndex = TexCoordIndexArray[ ii ];
                    texCoordNew[ vertextIndex ] = TexCoord[ textureIndex ];
                }
                const defCoord = { X: 0, Y: 0 };
                for ( let ii = 0; ii < texCoordNew.length; ii++ ) {
                    if ( !texCoordNew[ ii ] ) {
                        texCoordNew[ ii ] = defCoord;
                    }
                }
                TexCoord = texCoordNew;
            }
            Vertex.length = TexCoord.length;
        }

        let Color;
        if ( ColorPlace !== 0 ) {
            // по граням
            let ColorCount = IndexUniqCount;
            if ( ColorPerVertex === 0 ) {
                ColorCount = TotalFaceCount;
            }
            // по вершинам

            let IndexUniqColorCount = IndexUniqCount, ColorIndexArray;
            if ( ColorIndexPlace !== 0 ) {
                curoffset = offset + ColorIndexPlace;
                // массив индексов текстур
                const structureLongArray = this.getLongArray( Head3DArray, curoffset, ColorCount );
                ColorIndexArray = structureLongArray.LArray;
                IndexUniqColorCount = 0;
                for ( let ii = 0; ii < ColorIndexArray.length; ii++ ) {
                    IndexUniqColorCount = Math.max( IndexUniqColorCount, ColorIndexArray[ ii ] );
                }
                IndexUniqColorCount += 1;
            }


            curoffset = offset + ColorPlace;
            // массив цветов
            Color = [];
            for ( let ii = 0; ii < IndexUniqColorCount; ii++ ) {
                const structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, curoffset );
                Color[ ii ] = structureIMG3DRGBA.IMG3DRGBA;
                curoffset = structureIMG3DRGBA.HeadOffset;
            }

            if ( ColorIndexArray ) {
                const colorNew: IMG3DRGBA[] = [];
                for ( let ii = 0; ii < ColorCount; ii++ ) {
                    const colorIndex = ColorIndexArray[ Math.floor( ii / 3 ) ];
                    colorNew[ ii ] = Color[ colorIndex ];
                }
                //заглушка, если цветов меньше, чем вершин
                while ( colorNew.length < Vertex.length ) {
                    colorNew[ colorNew.length ] = colorNew[ 0 ];
                }
                Color = colorNew;
            }
        }


        // Количество выходных индексов посчитано с учетом наличия плоскостей с разным количество вершин
        // (треугольники, четырехугольники и т.д.). Пересчитывать не надо

        const indexPlane: number[] = [];// Массив индексов треугольников
        // но сами индексы надо переформировать
        let indexIn = 0;                   // Входные индексы
        let indexOut = 0;                  // Выходные индексы
        let indexNull = 0;
        for ( let k = 0; k < SurfaceDescCount; k++ ) {
            const surfaceDesc = SurfaceDesc[ k ];
            const indexCountCur = surfaceDesc.FaceVertexCount * surfaceDesc.FaceCount;
            // Поверхность строится по трем вершинам
            if ( surfaceDesc.FaceVertexCount === 3 ) {
                for ( let n = 0; n < indexCountCur; n++, indexIn++ ) {
                    indexPlane[ indexOut ] = VertexIndex[ indexIn ];
                    indexOut++;
                }
            } else {
                // Поверхность строится по четырем и более вершинам
                // Надо переформировывать индексы
                for ( let n = 0; n < surfaceDesc.FaceCount; n++ ) {
                    indexNull = indexIn;
                    for ( let m = 0; m < surfaceDesc.FaceVertexCount - 2; m++, indexIn++ ) {
                        indexPlane[ indexOut ] = VertexIndex[ indexNull ];
                        indexOut++;
                        indexPlane[ indexOut ] = VertexIndex[ indexIn + 1 ];
                        indexOut++;
                        indexPlane[ indexOut ] = VertexIndex[ indexIn + 2 ];
                        indexOut++;
                    }
                    indexIn = indexNull + surfaceDesc.FaceVertexCount;
                }
            }
        }
        VertexIndex = indexPlane;

        const IMG3DFACESET: IMG3DFACESET = {
            CreaseAngle,
            FlagFrontFace,
            ColorPerVertex,
            Convex,
            Solid,
            IndexCount,
            Vertex,
            VertexIndex,
            TexCoord,
            Color
        };


        return { IMG3DFACESET, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DDESCRIPTION
     * @method getIMG3DDESCRIPTION
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DDESCRIPTION( Head3DArray: ArrayBuffer, offset: number ) {        // ОПИСАНИЕ

        let dataView = new DataView( Head3DArray, offset, 8 );

        // const Length = dataView.getInt32( 0, this.littleEndian );			// Длина записи
        const ColorFlag: COMMON_FLAG = dataView.getInt8( 4 );          // 1 - наличие цвета,0 - отсутствие
        // Для подписи (ф-ция F3D_TEXT) всегда 1    // 28/07/20
        const MaterialFlag: COMMON_FLAG = dataView.getInt8( 5 );             // 1 - наличие материала,0 - отсутствие
        // Для подписи (ф-ция F3D_TEXT) всегда 1
        const TextureFlag: COMMON_FLAG = dataView.getInt8( 6 );		// 1 - наличие текстуры,0 - отсутствие
        const SemColorFlag: COMMON_FLAG = dataView.getInt8( 7 );		// IMG3DVALUE RGBA  value COLORREF

        let Color, colorHeadOffset;
        if ( SemColorFlag === COMMON_FLAG.ENABLED ) {
            const structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, offset + 8 );
            Color = structureIMG3DVALUE.IMG3DVALUE;
            colorHeadOffset = structureIMG3DVALUE.HeadOffset;
        } else {
            const structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, offset + 8 );	// Цвет (RGBA)
            Color = structureIMG3DRGBA.IMG3DRGBA;	// Цвет (RGBA)
            // Для подписи в Color - цвет шрифта
            colorHeadOffset = structureIMG3DRGBA.HeadOffset;
        }
        const structureACT3DMATERIALMODE = this.getACT3DMATERIALMODE( Head3DArray, colorHeadOffset );	// Материал
        const Material = structureACT3DMATERIALMODE.ACT3DMATERIALMODE;	// Материал
        // Для подписи в Material.AmbientColor - цвет контура

        dataView = new DataView( Head3DArray, structureACT3DMATERIALMODE.HeadOffset, 8 );
        const Transparent: COMMON_FLAG = dataView.getInt32( 0, this.littleEndian );	            // Прозрачность (0-нет, 1-прозрачна)
        // Для подписи не значим. Прозрачность хранится в альфа компоненте цветов.
        const Smooth: COMMON_FLAG | BOLD_FLAG = dataView.getInt32( 4, this.littleEndian );         // Размытость цветов(0-нет, 1-размыта)
        // Для подписи - это флаг ширины окантовки
        // (0-узкая, 1-нормальная. 2-широкая)

        const structureTEXTURETYPE = this.getTEXTURETYPE( Head3DArray, structureACT3DMATERIALMODE.HeadOffset + 8 );
        const Texture = structureTEXTURETYPE.TEXTURETYPE;	// Информация о текстуре

        if ( TextureFlag === COMMON_FLAG.ENABLED ) {
            this.mTextureDescription.push( Texture );   // массив описаний текстур для раздельного запроса
        }

        dataView = new DataView( Head3DArray, structureTEXTURETYPE.HeadOffset, 8 );
        const FlagMeasure: TEXTUREMEASURE = dataView.getInt8( 0 );		// Тип размера текстуры TEXTUREMEASURE
        const TransparentTex: COMMON_FLAG = dataView.getInt8( 1 );	// Прозрачность текстуры (0,1)
        const SmoothTex: COMMON_FLAG = dataView.getInt8( 2 );			// Размытость текстуры (0,1)
        const WrapTex: TEXTURE_REPEAT = dataView.getInt8( 3 );			// Повторяемость текстуры (см.ФЛАГ ПОВТОРЯЕМОСТИ ТЕКСТУР)
        const PaintFlag: PAINT_FLAG = dataView.getInt32( 4 );		// 0 - рисовать с двух сторон поверхности, 1 - с одной стороны поверхности (текстуру, цвет и т.д.)


        let structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureTEXTURETYPE.HeadOffset + 8 );
        const wrapValueX = structureIMG3DVALUE.IMG3DVALUE;
        structureIMG3DVALUE = this.getIMG3DVALUE( Head3DArray, structureIMG3DVALUE.HeadOffset );
        const wrapValueY = structureIMG3DVALUE.IMG3DVALUE;
        const WrapValue: [IMG3DVALUE, IMG3DVALUE] = [wrapValueX, wrapValueY];	// Значения повторяемости текстуры по двум текстурным координатам(или 0 при произвольной повторяемости)
        dataView = new DataView( Head3DArray, structureIMG3DVALUE.HeadOffset, 8 );
        const Count = dataView.getInt32( 0, this.littleEndian );		// Количество элементов с таким описанием
        const TransformFlag: TRANSFORM_FLAG = dataView.getInt8( 4 );	// Флаг наличия описаний положения системы координат рисования элементов 0 - структур описаний нет 1 - перед IMG3DELEMENT идет структура описания положения элемента IMG3DTRANSFORM (размер структуры в длину описания элемента не входит) 2 - перед IMG3DELEMENT идет структура описания положения IMG3DTMATRIX (размер структуры в длину описания элемента не входит)
        // const Reserve: number[] = [];
        // for ( let ii = 0; ii < 3; ii++ ) {
        //     Reserve[ ii ] = dataView.getInt8( 5 + ii );
        // }
        const HeadOffset = structureIMG3DVALUE.HeadOffset + 8;


        const IMG3DDESCRIPTION: IMG3DDESCRIPTION = {
            ColorFlag,
            MaterialFlag,
            TextureFlag,
            SemColorFlag,
            Color,
            Material,
            Transparent,
            Smooth,
            Texture,
            FlagMeasure,
            TransparentTex,
            SmoothTex,
            WrapTex,
            PaintFlag,
            WrapValue,
            Count,
            TransformFlag
        };

        return { IMG3DDESCRIPTION, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DPOINTSET
     * @method getIMG3DPOINTSET
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DPOINTSET( Head3DArray: ArrayBuffer, offset: number ) {       // МАССИВ ТОЧЕК

        const structsize = 24;
        const dataView = new DataView( Head3DArray, offset, structsize );

        const Length = dataView.getInt32( 0, this.littleEndian );		// Длина записи
        const Count = dataView.getInt32( 4, this.littleEndian );			// Число точек, цветов
        const ColorPlace = dataView.getInt32( 8, this.littleEndian );	// Смещение на массив цветов от конца IMG3DPOINTSET, размерность членов массива IMG3DRGBA

        // structure.Reserve = [];
        // for ( let ii = 0; ii < 12; ii++ ) {
        //     structure.Reserve[ ii ] = dataView.getInt8( 12 + ii );
        // }

        // массив вершин
        const Vertex: IMG3DPOINT[] = [];
        let curoffset = offset + structsize;
        for ( let ii = 0; ii < Count; ii++ ) {
            const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
            Vertex[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
            curoffset = structureIMG3DPOINT.HeadOffset;
        }

        // массив цветов
        const Color: IMG3DRGBA[] = [];
        if ( ColorPlace !== 0 ) {
            curoffset = offset + structsize + ColorPlace;
            for ( let ii = 0; ii < Count; ii++ ) {
                const structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, curoffset );
                Color[ ii ] = structureIMG3DRGBA.IMG3DRGBA;
                curoffset = structureIMG3DRGBA.HeadOffset;
            }
        }
        const HeadOffset = Length + offset;

        const IMG3DPOINTSET: IMG3DPOINTSET = {
            Count,
            ColorPlace,
            Vertex,
            Color
        };

        return { IMG3DPOINTSET, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DLINESET
     * @method getIMG3DLINESET
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DLINESET( Head3DArray: ArrayBuffer, offset: number ) {       // МАССИВ ЛИНИЙ

        const structsize = 64;
        const dataView = new DataView( Head3DArray, offset, structsize );

        const Length = dataView.getInt32( 0, this.littleEndian );			// Длина записи
        const LineCount = dataView.getInt32( 4, this.littleEndian );			// Число линий
        const IndexCountPlace = dataView.getInt32( 8, this.littleEndian );	// Смещение на массив количества точек полилиний от конца IMG3DLINESET, размерность от конца LONG
        const VertexIndexPlace = dataView.getInt32( 12, this.littleEndian );	// Смещение на массив индексов точек полилинии от конца IMG3DLINESET, размерность членов массива LONG
        const ColorPlace = dataView.getInt32( 16, this.littleEndian );		// Смещение на массив цветов от конца IMG3DLINESET, размерность членов массива IMG3DRGBA
        const ColorIndexPlace = dataView.getInt32( 20, this.littleEndian );	// Смещение на массив индексов цветов от конца IMG3DLINESET, размерность членов массива LONG
        const ColorPerVertex = dataView.getInt8( 24 );	// Распределение цветов (0 - по линиям, 1 - по вершинам)
        // structure.Reserve = [];											// После структуры располагается массив вершин (по числу), относительно нуля знака координат
        // for (const ii = 0; ii < 39; ii++) {
        //     structure.Reserve[ii] = dataView.getInt8(25 + ii);
        // }
        //  IMG3DPOINT     Vertex[1];

        let curoffset = offset + structsize + IndexCountPlace;
        // массив кол-ва вершин
        let structureLongArray = this.getLongArray( Head3DArray, curoffset, LineCount );
        const indexCountByLine = structureLongArray.LArray;
        // кол-во индексов
        let IndexCount = 0;
        for ( let ii = 0; ii < LineCount; ii++ ) {
            IndexCount += indexCountByLine[ ii ];
        }

        curoffset = offset + structsize + VertexIndexPlace;
        // массив индексов вершин
        structureLongArray = this.getLongArray( Head3DArray, curoffset, IndexCount );
        const VertexIndex = structureLongArray.LArray;

        // количество вершин
        let VertexCount = 0;
        for ( let i = 0; i < VertexIndex.length; i++ ) {
            VertexCount = Math.max( VertexCount, VertexIndex[ i ] );
        }

        // массив вершин
        const Vertex: IMG3DPOINT[] = [];
        curoffset = offset + structsize;
        for ( let ii = 0; ii < VertexCount; ii++ ) {
            const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
            Vertex[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
            curoffset = structureIMG3DPOINT.HeadOffset;
        }

        // распределение цветов
        const curcolorcount = VertexCount;

        // массив цветов
        let Color;
        if ( ColorPlace !== 0 ) {
            Color = [];
            if ( ColorPerVertex !== 0 ) {
                curoffset = offset + structsize + ColorPlace;
                for ( let ii = 0; ii < curcolorcount; ii++ ) {
                    const structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, curoffset );
                    Color[ ii ] = structureIMG3DRGBA.IMG3DRGBA;
                    curoffset = structureIMG3DRGBA.HeadOffset;
                }
            } else {
                //заглушка
                for ( let ii = 0; ii < curcolorcount; ii++ ) {
                    Color[ ii ] = { R: 0.5, G: 0.5, B: 0.5, A: 1 };
                }
            }
        }

        // // массив индексов цветов
        // if (structure.ColorIndexPlace !== 0) {
        //     curoffset = offset + structsize + structure.ColorIndexPlace;
        //     structure.ColorIndex = this.getLongArray(Head3DArray, curoffset, curcolorcount);
        // }
        const HeadOffset = Length + offset;

        const IMG3DLINESET: IMG3DLINESET = {
            LineCount,
            IndexCountPlace,
            VertexIndexPlace,
            ColorPlace,
            ColorIndexPlace,
            ColorPerVertex,
            IndexCount,
            VertexIndex,
            VertexCount,
            Vertex,
            Color
        };


        return { IMG3DLINESET, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DGRID
     * @method getIMG3DGRID
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DGRID( Head3DArray: ArrayBuffer, offset: number ) {       // СЕТКА

        const structsize = 72;
        const dataView = new DataView( Head3DArray, offset, structsize );

        const Length = dataView.getInt32( 0, this.littleEndian );		// Длина записи
        const XDimension = dataView.getInt32( 4, this.littleEndian );	// Количество узлов сетки по X
        const YDimension = dataView.getInt32( 8, this.littleEndian );	// Количество узлов сетки по Y (переход из локальной системы кординат в WEB-систему) // 17/03/17
        const XSpacing = dataView.getFloat32( 12, this.littleEndian );	// Расстояние между узлами в сетке по оси X
        const YSpacing = dataView.getFloat32( 16, this.littleEndian );	// Расстояние между узлами в сетке по оси Y
        const TexCoordPlace = dataView.getInt32( 20, this.littleEndian );// Смещение на массив координат текстуры от конца IMG3DGRID, размерность членов массива DOUBLEPOINT
        const ColorPlace = dataView.getInt32( 24, this.littleEndian );	// Смещение на массив цветов от конца IMG3DGRID, размерность членов массива IMG3DRGBA
        const NormalPlace = dataView.getInt32( 28, this.littleEndian );	// Смещение на массив нормалей к поверхности от конца IMG3DGRID, размерность членов массива IMG3DPOINT
        const CreaseAngle = dataView.getFloat32( 32, this.littleEndian );// Угол складки определяется как угол между двумя нормалями к поверхности на смежных гранях (в радианах)
        const FlagFrontFace: COMMON_FLAG = dataView.getInt8( 36 ); // Направление обхода при построении многоугольника (0 - по часовой стрелке, 1 - против часовой стрелки)
        const ColorPerVertex: COMMON_FLAG = dataView.getInt8( 37 );// Распределение цветов (0 - по граням, 1 - по вершинам)
        const NormalPerVertex: COMMON_FLAG = dataView.getInt8( 38 );// Распределение нормалей (0 - по граням, 1 - по вершинам)
        const Convex: COMMON_FLAG = dataView.getInt8( 39 );		// Выпуклость граней (0 - неизвестно, 1 - выпуклые)
        const Solid: COMMON_FLAG = dataView.getInt8( 40 );			// Замкнутость фигуры (0 - неизвестно, 1 - замкнутая)


        // const Reserve = [];										// После структуры располагается массив высотных координат вершин (по числу, слева на право, снизу вверх)
        // for ( let ii = 0; ii < 31; ii++ ) {
        //     Reserve[ ii ] = dataView.getInt8( 41 + ii );
        // }

        //  double         Height[1];

        // кол-во вершин
        const VertexCount = XDimension * YDimension;
        let curoffset = offset + structsize;
        // массив вершин
        const structureDoubleArray = this.getDoubleArray( Head3DArray, curoffset, VertexCount );
        const Vertex = structureDoubleArray.DArray;

        // массив координат текстур
        let TexCoord;
        if ( TexCoordPlace !== 0 ) {
            curoffset = offset + structsize + TexCoordPlace;
            const structureDOUBLEPOINTArray = this.getDOUBLEPOINTArray( Head3DArray, curoffset, VertexCount );
            TexCoord = structureDOUBLEPOINTArray.DArray;
        }

        let NormalCount = VertexCount;
        // распределение нормалей по граням
        if ( NormalPerVertex === 0 ) {
            NormalCount = (XDimension - 1) * (YDimension - 1);
        }

        let ColorCount = VertexCount;
        // распределение цветов по граням
        if ( ColorPerVertex === 0 ) {
            ColorCount = (XDimension - 1) * (YDimension - 1);
        }

        // массив цветов
        const Color: IMG3DRGBA[] = [];
        if ( ColorPlace !== 0 ) {
            curoffset = offset + structsize + ColorPlace;
            for ( let ii = 0; ii < ColorCount; ii++ ) {
                const structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, curoffset );
                Color[ ii ] = structureIMG3DRGBA.IMG3DRGBA;
                curoffset = structureIMG3DRGBA.HeadOffset;
            }
        }

        // массив нормалей
        const Normal: IMG3DPOINT[] = [];
        if ( NormalPlace !== 0 ) {
            curoffset = offset + structsize + NormalPlace;
            for ( let ii = 0; ii < NormalCount; ii++ ) {
                const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
                Normal[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
                curoffset = structureIMG3DPOINT.HeadOffset;
            }
        }
        const HeadOffset = Length + offset;

        const IMG3DGRID: IMG3DGRID = {
            XDimension,
            YDimension,
            XSpacing,
            YSpacing,
            TexCoordPlace,
            ColorPlace,
            NormalPlace,
            CreaseAngle,
            FlagFrontFace,
            ColorPerVertex,
            NormalPerVertex,
            Convex,
            Solid,
            VertexCount,
            Vertex,
            TexCoord,
            NormalCount,
            ColorCount,
            Color,
            Normal

        };

        return { IMG3DGRID, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DEXTRUSION
     * @method getIMG3DEXTRUSION
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DEXTRUSION( Head3DArray: ArrayBuffer, offset: number ) {       // ЭКСТРУЗИЯ (поверхность, созданная перемещением заданного cечения по заданной линии)

        const structsize = 88;
        const dataView = new DataView( Head3DArray, offset, structsize );

        const Length = dataView.getInt32( 0, this.littleEndian );		// Длина записи
        const BeginCap: COMMON_FLAG = dataView.getInt32( 4, this.littleEndian );		// Флаг отображения начального торца поверхности (1 - отображать, 0 - нет)
        const EndCap: COMMON_FLAG = dataView.getInt32( 8, this.littleEndian );		// Флаг отображения конечного торца поверхности (1 - отображать, 0 - нет)
        const SectionVertexCount = dataView.getInt32( 12, this.littleEndian );	// Число координат вершин сечения (сам массив вершин сечения типа DOUBLEPOINT расположен после IMG3DEXTRUSION)
        const SpinePointCount = dataView.getInt32( 16, this.littleEndian );	// Число координат точек линии основы ("хребта") типа IMG3DPOINT
        const SpinePlace = dataView.getInt32( 20, this.littleEndian );	// Смещение на массив точек линии основы ("хребта")от конца IMG3DEXTRUSION, размерность массива IMG3DPOINT
        const ScaleCount = dataView.getInt32( 24, this.littleEndian );	// Количество значений масштабного множителя в массиве типа DOUBLEPOINT
        const ScalePlace = dataView.getInt32( 28, this.littleEndian );	// Смещение на массив значений масштабного множителя от конца IMG3DEXTRUSION, размерность массива DOUBLEPOINT
        const OrientationCount = dataView.getFloat32( 32, this.littleEndian );// Количество значений поворотных векторов в массиве типа IMG3DROTATION
        const OrientationPlace = dataView.getInt32( 36, this.littleEndian ); // Смещение на массив значений поворотных векторов от конца IMG3DEXTRUSION, размерность массива IMG3DROTATION
        const CreaseAngle = dataView.getFloat32( 40, this.littleEndian );// Угол складки определяется как угол между двумя нормалями к поверхности на смежных гранях (в радианах)
        const FlagFrontFace: COMMON_FLAG = dataView.getInt8( 44 );// Направление обхода при построении многоугольника (0 - по часовой стрелке, 1 - против часовой стрелки)
        const Convex: COMMON_FLAG = dataView.getInt8( 45 );		// Выпуклость поверхности (0 - неизвестно, 1 - выпуклая)
        const Solid: COMMON_FLAG = dataView.getInt8( 46 );			// Цельность фигуры (0 - неизвестно (освещение двустороннее), 1 - цельная (освещение снаружи))

        // const Reserve = [];										// После структуры располагается массив высотных координат вершин сечения (по числу)
        // for ( let ii = 0; ii < 41; ii++ ) {
        //     Reserve[ ii ] = dataView.getInt8( 47 + ii );
        // }

        let curoffset = offset + structsize;
        const structureDOUBLEPOINTArray = this.getDOUBLEPOINTArray( Head3DArray, curoffset, SectionVertexCount );
        const SectionVertex = structureDOUBLEPOINTArray.DArray;

        // массив точек линии хребта
        const SpinePoint: IMG3DPOINT[] = [];
        if ( SpinePlace !== 0 ) {
            curoffset = offset + structsize + SpinePlace;
            for ( let ii = 0; ii < SpinePointCount; ii++ ) {
                const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
                SpinePoint[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
                curoffset = structureIMG3DPOINT.HeadOffset;
            }
        }

        // массив значений масштабного множителя
        let Scale;
        if ( ScalePlace !== 0 ) {
            curoffset = offset + structsize + ScalePlace;
            const structureDOUBLEPOINTArray = this.getDOUBLEPOINTArray( Head3DArray, curoffset, ScaleCount );
            Scale = structureDOUBLEPOINTArray.DArray;
        }

        // массив значений поворотных векторов
        const Orientation: IMG3DPOINT[] = [];
        if ( OrientationPlace !== 0 ) {
            curoffset = offset + structsize + OrientationPlace;
            for ( let ii = 0; ii < OrientationCount; ii++ ) {
                const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, curoffset );
                Orientation[ ii ] = structureIMG3DPOINT.IMG3DPOINT;
                curoffset = structureIMG3DPOINT.HeadOffset;
            }
        }

        const HeadOffset = Length + offset;

        const IMG3DEXTRUSION: IMG3DEXTRUSION = {
            BeginCap,
            EndCap,
            SectionVertexCount,
            SpinePointCount,
            SpinePlace,
            ScaleCount,
            ScalePlace,
            OrientationCount,
            OrientationPlace,
            CreaseAngle,
            FlagFrontFace,
            Convex,
            Solid,
            SectionVertex,
            SpinePoint,
            Scale,
            Orientation
        };

        return { IMG3DEXTRUSION, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DCUBE
     * @method getIMG3DCUBE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DCUBE( Head3DArray: ArrayBuffer, offset: number ) {       // (1)   КУБ

        const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, offset );
        const Point = structureIMG3DPOINT.IMG3DPOINT;                           // Координаты точки привязки элемента относительно нуля знака(передняя левая нижняя вершина-первая точка)
        const structureIMG3DROTATION = this.getIMG3DROTATION( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const Rotate = structureIMG3DROTATION.IMG3DROTATION;                    // Поворот элемента в системе координат знака

        const dataView = new DataView( Head3DArray, structureIMG3DROTATION.HeadOffset, 16 );

        const Width = dataView.getFloat32( 0, this.littleEndian );	// Ширина
        const Height = dataView.getFloat32( 4, this.littleEndian );	// Высота
        const Depth = dataView.getFloat32( 8, this.littleEndian );	// Глубина
        // const Reserve = dataView.getUint32( 12, this.littleEndian );

        const HeadOffset = structureIMG3DROTATION.HeadOffset + 16;

        const IMG3DCUBE: IMG3DCUBE = {
            Point,
            Rotate,
            Width,
            Height,
            Depth
        };

        return { IMG3DCUBE, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DSPHERE
     * @method getIMG3DSPHERE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DSPHERE( Head3DArray: ArrayBuffer, offset: number ) {      // (2) СФЕРА

        const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, offset );
        const Point = structureIMG3DPOINT.IMG3DPOINT; // Координаты точки привязки элемента относительно нуля знака
        const structureIMG3DROTATION = this.getIMG3DROTATION( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const Rotate = structureIMG3DROTATION.IMG3DROTATION; // Поворот элемента в системе координат знака

        const dataView = new DataView( Head3DArray, structureIMG3DROTATION.HeadOffset, 8 );

        const Radius = dataView.getFloat32( 0, this.littleEndian );	// Радиус
        // const Reserve = dataView.getUint32( 4, this.littleEndian );
        const HeadOffset = structureIMG3DROTATION.HeadOffset + 8;

        const IMG3DSPHERE: IMG3DSPHERE = {
            Point,
            Rotate,
            Radius
        };

        return { IMG3DSPHERE, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DCYLINDER
     * @method getIMG3DCYLINDER
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DCYLINDER( Head3DArray: ArrayBuffer, offset: number ) {       // (3) ЦИЛИНДР (КОНУС)

        const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, offset );
        const Point = structureIMG3DPOINT.IMG3DPOINT;                           // Координаты точки привязки элемента относительно нуля знака
        const structureIMG3DROTATION = this.getIMG3DROTATION( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const Rotate = structureIMG3DROTATION.IMG3DROTATION;                    // Поворот элемента в системе координат знака

        const dataView = new DataView( Head3DArray, structureIMG3DROTATION.HeadOffset, 16 );

        const Part: VISIBLE_PART = dataView.getUint32( 0, this.littleEndian );		// Отображаемые части (IMG3D_ALL - IMG3D_BOTTOM)
        const Radius = dataView.getFloat32( 4, this.littleEndian );	// Радиус основания
        const RadiusH = dataView.getFloat32( 8, this.littleEndian );	// Радиус цилиндра на заданной высоте Height или ноль(если это конус)
        const Height = dataView.getFloat32( 12, this.littleEndian ); // Высота
        const HeadOffset = structureIMG3DROTATION.HeadOffset + 16;

        const IMG3DCYLINDER: IMG3DCYLINDER = {
            Point,
            Rotate,
            Part,
            Radius,
            RadiusH,
            Height
        };

        return { IMG3DCYLINDER, HeadOffset };
    }

    /**
     * Заполнить структуру IMG3DQUAD
     * @method getIMG3DQUAD
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DQUAD( Head3DArray: ArrayBuffer, offset: number ) {      // (4,5) ЧЕТЫРЕХУГОЛЬНИК (ПРИМЫКАЮЩИЙ)

        let structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, offset );
        const vertex0 = structureIMG3DPOINT.IMG3DPOINT;                             // Координаты углов относительно нуля знака
        structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const vertex1 = structureIMG3DPOINT.IMG3DPOINT;                             // Координаты углов относительно нуля знака
        structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const vertex2 = structureIMG3DPOINT.IMG3DPOINT;                             // Координаты углов относительно нуля знака
        structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, structureIMG3DPOINT.HeadOffset );
        const vertex3 = structureIMG3DPOINT.IMG3DPOINT;                             // Координаты углов относительно нуля знака


        const Vertex: [IMG3DPOINT, IMG3DPOINT, IMG3DPOINT, IMG3DPOINT] = [vertex0, vertex1, vertex2, vertex3];
        const HeadOffset = structureIMG3DPOINT.HeadOffset;

        const IMG3DQUAD: IMG3DQUAD = { Vertex };

        return { IMG3DQUAD, HeadOffset };
    }


    /**
     * Заполнить структуру IMG3DLINE
     * @method getIMG3DLINE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DLINE( Head3DArray: ArrayBuffer, offset: number ) {     // (11) ЛИНИЯ СПЛОШНАЯ

        const dataView = new DataView( Head3DArray, offset, 8 );

        const Count = dataView.getUint32( 0, this.littleEndian );			// Число вершин ломаной
        const Width = dataView.getFloat32( 4, this.littleEndian );			// Ширина линии

        const Vertex: IMG3DPOINT[] = [];
        let newoffset = offset + 8;
        for ( let ii = 0; ii < Count; ii++ ) {
            const structureIMG3DPOINT = this.getIMG3DPOINT( Head3DArray, newoffset ); // Координаты углов относительно нуля знака
            Vertex[ ii ] = structureIMG3DPOINT.IMG3DPOINT; // Координаты углов относительно нуля знака
            newoffset = structureIMG3DPOINT.HeadOffset;
        }
        const HeadOffset = newoffset;

        const IMG3DLINE: IMG3DLINE = {
            Count,
            Width,
            Vertex
        };

        return { IMG3DLINE, HeadOffset };
    }

    /**
     * Заполнить структуру RECTEXTURE
     * @method getRECTEXTURE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getRECTEXTURE( Head3DArray: ArrayBuffer, offset: number ) {      // Текстура

        const dataView = new DataView( Head3DArray, offset, 16 );
        let RECTEXTURE: RECTEXTURE | undefined;
        let Length = dataView.getUint32( 0, this.littleEndian );		// Длина записи
        if ( Length !== 0 ) {
            const Height = dataView.getUint32( 4, this.littleEndian );		// Высота картинки
            const Width = dataView.getUint32( 8, this.littleEndian );		// Ширина картинки
            // structure.Transparent = dataView.getInt8(12);	// Прозрачность текстуры 0 - не установлена 1 - черный прозрачный

            // structure.Reserv = [];
            // for (const ii = 0; ii < 3; ii++) {
            //     structure.Reserv[ii] = dataView.getInt8(13 + ii);
            // }

            const bmpArray = new Uint8Array( Head3DArray, offset + 16, Length - 16 );

            const newBmpArray = new Uint8Array( new ArrayBuffer( bmpArray.length ) );
            let k = 0;
            for ( let j = 0; j < Height; j++ ) {
                for ( let i = 0; i < Width; i++ ) {
                    // Заполнение сверху вниз (для WebGL)
                    const ind = ((Height - 1 - j) * Width + i) * 4;

                    newBmpArray[ k++ ] = bmpArray[ ind ];
                    newBmpArray[ k++ ] = bmpArray[ ind + 1 ];
                    newBmpArray[ k++ ] = bmpArray[ ind + 2 ];
                    newBmpArray[ k++ ] = bmpArray[ ind + 3 ];
                }
            }

            const Image = newBmpArray;
            RECTEXTURE = {
                Height,
                Width,
                Image
            };
        } else {
            Length = 4;
        }


        const HeadOffset = offset + Length;

        return {
            RECTEXTURE,
            HeadOffset
        };
    }

    /**
     * Заполнить структуру WEB3DOBJECTIDENT
     * @method getWEB3DOBJECTIDENT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param [version] {number}  Версия
     * @return {Object} Описание объекта
     */
    private static getWEB3DOBJECTIDENT( Head3DArray: ArrayBuffer, offset: number, version: number ) {       // ЗАГОЛОВОК ОБЪЕКТА

        let dv = new DataView( Head3DArray, offset, 32 );
        const Key = this.ab2str( dv );				// Ключ объекта

        let newoffset = offset + 32;
        let dataView = new DataView( Head3DArray, newoffset, 16 );

        const Code = dataView.getUint32( 0, this.littleEndian );		// Код объекта
        const Local = dataView.getUint32( 4, this.littleEndian );	// Локализация
        const layerLen = dataView.getUint32( 8, this.littleEndian );		// Длина имени слоя
        const classifierLen = dataView.getUint32( 12, this.littleEndian );	// Длина имени классификатора
        newoffset = newoffset + 16;
        let Level = 0;	        // Номер уровня
        let Distance = 0;	    // Дальность уровня
        if ( version >= 130200 ) {
            dataView = new DataView( Head3DArray, newoffset, 8 );
            Level = dataView.getUint32( 0, this.littleEndian );	        // Номер уровня
            Distance = dataView.getUint32( 4, this.littleEndian );	    // Дальность уровня
            newoffset = newoffset + 8;
        }

        dv = new DataView( Head3DArray, newoffset, layerLen );
        const LayerId = this.ab2str( dv );
        newoffset = newoffset + layerLen;

        dv = new DataView( Head3DArray, newoffset, classifierLen );
        const ClassifierName = this.ab2str( dv );


        const WEB3DOBJECTIDENT: WEB3DOBJECTIDENT = {
            Key,
            Code,
            Local,
            Level,
            Distance,
            LayerId,
            ClassifierName
        };

        const HeadOffset = newoffset + classifierLen;

        return { WEB3DOBJECTIDENT, HeadOffset };


    }

    private static ab2str( buf: DataView ) {
        let stringKey = '';
        for ( let i = 0; i < buf.byteLength; i++ ) {
            const charNum = buf.getUint8( i );
            if ( charNum > 0 )
                stringKey += String.fromCharCode( charNum );
        }
        return stringKey.trim();
    }


    /**
     * Заполнить структуру DOUBLEPOINT
     * @method getDOUBLEPOINT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getDOUBLEPOINT( Head3DArray: ArrayBuffer, offset: number ) {         // КООРДИНАТЫ ТОЧКИ

        const dataView = new DataView( Head3DArray, offset, 16 );

        const X = dataView.getFloat64( 0, this.littleEndian );
        const Y = dataView.getFloat64( 8, this.littleEndian );
        const HeadOffset = offset + 16;
        const Point: FLOATPOINT = {
            X, Y
        };
        return { Point, HeadOffset };
    }


    /**
     * Заполнить массив структур DOUBLEPOINT
     * @method getDOUBLEPOINTArray
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param count {Number} Количество точек
     * @return {Object} Описание объекта
     */
    private static getDOUBLEPOINTArray( Head3DArray: ArrayBuffer, offset: number, count: number ) {           // КООРДИНАТЫ ТОЧЕК
        const DArray: FLOATPOINT[] = [];
        let newoffset = offset;
        for ( let ii = 0; ii < count; ii++ ) {
            const structureDOUBLEPOINT = this.getDOUBLEPOINT( Head3DArray, newoffset );
            DArray[ ii ] = structureDOUBLEPOINT.Point;
            newoffset = structureDOUBLEPOINT.HeadOffset;
        }
        const HeadOffset = newoffset;

        return { DArray, HeadOffset };
    }

    /**
     * Заполнить массив Long
     * @method getLongArray
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param count {Number} Количество точек
     * @return {Object} Описание объекта
     */
    private static getLongArray( Head3DArray: ArrayBuffer, offset: number, count: number ) {
        const LArray: number[] = [];

        const dataView = new DataView( Head3DArray, offset, count * 4 );
        for ( let ii = 0; ii < count; ii++ ) {
            LArray[ ii ] = dataView.getInt32( ii * 4, this.littleEndian );
        }
        const HeadOffset = offset + count * 4;

        return { LArray, HeadOffset };
    }

    /**
     * Заполнить массив Double
     * @method getDoubleArray
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param count {Number} Количество точек
     * @return {Object} Описание объекта
     */
    private static getDoubleArray( Head3DArray: ArrayBuffer, offset: number, count: number ) {
        const DArray: number[] = [];
        const dataView = new DataView( Head3DArray, offset, count * 8 );
        for ( let ii = 0; ii < count; ii++ ) {
            DArray[ ii ] = dataView.getFloat64( ii * 8 );
        }
        const HeadOffset = offset + count * 8;

        return { DArray, HeadOffset };
    }

    /**
     * Заполнить структуру TEXTURETYPE
     * @method getTEXTURETYPE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getTEXTURETYPE( Head3DArray: ArrayBuffer, offset: number ) {       // ИНФОРМАЦИЯ О ТЕКСТУРЕ

        const dataView = new DataView( Head3DArray, offset, 16 );

        const Type = dataView.getInt32( 0, this.littleEndian );		// 0 или номер семантики
        let SemKey;
        //FIXME: не работает получение текстур по семантике
        // if ( Type > 0 && this.SEMDICTIONARY ) {
        //     SemKey = this.SEMDICTIONARY[ Type ];
        // }
        const Code = '' + dataView.getInt32( 4, this.littleEndian );		// Номер текстуры  = 0
        const Key = dataView.getUint32( 8, this.littleEndian );		// Ключ текстуры - уникален в пределах файла
        const Level = dataView.getInt32( 12, this.littleEndian );  // Номер библиотеки
        const HeadOffset = offset + 16;

        const TEXTURETYPE: TEXTURETYPE = {
            Type,
            Code,
            Key,
            Level,
            SemKey
        };

        return { TEXTURETYPE, HeadOffset };
    }

    /**
     * Заполнить структуру ACT3DMATERIALMODE
     * @method getACT3DMATERIALMODE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getACT3DMATERIALMODE( Head3DArray: ArrayBuffer, offset: number ) {          // ПАРАМЕТРЫ МАТЕРИАЛА

        let structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, offset );
        const AmbientColor = structureIMG3DRGBA.IMG3DRGBA;							        // Рассеянный цвет
        structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, structureIMG3DRGBA.HeadOffset );
        const DiffuseColor = structureIMG3DRGBA.IMG3DRGBA;	                                // Диффузный  цвет
        structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, structureIMG3DRGBA.HeadOffset );
        const SpecularColor = structureIMG3DRGBA.IMG3DRGBA;	                                // Зеркальный
        structureIMG3DRGBA = this.getIMG3DRGBA( Head3DArray, structureIMG3DRGBA.HeadOffset );
        const EmissiveColor = structureIMG3DRGBA.IMG3DRGBA;	                                // Излучаемый

        const dataView = new DataView( Head3DArray, structureIMG3DRGBA.HeadOffset, 8 );

        const Shininess = dataView.getFloat64( 0, this.littleEndian );			// Зеркальная экспонента
        const HeadOffset = structureIMG3DRGBA.HeadOffset + 8;

        const ACT3DMATERIALMODE: ACT3DMATERIALMODE = {
            AmbientColor,
            DiffuseColor,
            SpecularColor,
            EmissiveColor,
            Shininess
        };

        return { ACT3DMATERIALMODE, HeadOffset };
    }

    /**
     * Функция получения матрицы трансформирования по параметрам трансформации
     * @method createTransformMatrix
     * @public
     * @param transform {object} Параметры трансформации
     * @result {array} Матрица трансформирования
     */
    static createTransformMatrix = function ( transform: IMG3DTRANSFORM ) {

        const tempMatrix = mat4.create( mat4.IDENTITY );
        // Делаем перенос в заданные точки
        const pointCenter = transform.Center;
        mat4.translate( tempMatrix, [pointCenter.X, pointCenter.Y, pointCenter.Z] );

        const pointTrans = transform.Translation;
        mat4.translate( tempMatrix, [pointTrans.X, pointTrans.Y, pointTrans.Z] );

        // Делаем поворот
        const rotation = transform.Removal;
        mat4.rotate( tempMatrix, [rotation.X, rotation.Y, rotation.Z], rotation.Angle / 180 * Math.PI );

        // Делаем масштабирование
        const scaling = transform.Scale;
        mat4.scale( tempMatrix, [scaling.X, scaling.Y, scaling.Z] );

        const orientation = transform.ScaleOrientation;
        const inclineMatrix = mat4.create();
        mat4.identity( inclineMatrix );
        mat4.rotate( inclineMatrix, [orientation.X, orientation.Y, orientation.Z], -orientation.Angle / 180 * Math.PI );

        return tempMatrix;
    };


    /**
     * Функция создания дополнительного шаблона - указателя для подписи
     * @method createTextPointerLineset
     * @public
     * @param ident {number} Идентификатор функции подписи
     * @param textPositionHeight {number} Высота подписи
     * @param [textColor] {array} Цвет текста
     * @param [borderColor] {array} Цвет обводки
     * @result {object} Шаблон указателя для подписи
     */
    static createTextPointerLineset( ident: number, textPositionHeight: number, textColor?: IMG3DRGBA | IMG3DVALUE, borderColor?: IMG3DRGBA | IMG3DVALUE ): FUNCTION3DMARK {
        return {
            'Number': FUNCTION3D_TYPE.F3D_MARK,
            'Ident': ident + Math.random(),
            'FUNCTIONPARAMS': {
                'Mark': {
                    'FUNCTIONPARAMS': {
                        'Height': {
                            'Type': 0,
                            'Value': textPositionHeight - 5,
                            'Factor': 1,
                            'Offset': 0
                        },
                        'RelativeHeight': {
                            'Type': 0,
                            'Value': 0,
                            'Factor': 1,
                            'Offset': 0
                        },
                        'SizeX': {
                            'Type': 0,
                            'Value': 0,
                            'Factor': 1,
                            'Offset': 0
                        },
                        'SizeZ': {
                            'Type': 0,
                            'Value': 0,
                            'Factor': 1,
                            'Offset': 0
                        },
                        'Scale': [
                            0,
                            0,
                            0
                        ],
                        'Vector': VECTOR_ORIENTATION3D.VM_BYOBSERVER,
                        'FlagVRML': 0,
                        'TransformFlag': 0,
                        'SizeScaleFactor': 0,
                        'Point': [
                            {
                                'X': 0,
                                'Y': 0,
                                'Z': 0
                            },
                            {
                                'X': 0,
                                'Y': 0,
                                'Z': 0
                            }
                        ],
                        'MarkIncode': 0,
                        'Count': 1,
                        'NODELIST': [
                            {
                                'TransformFlag': 0,
                                'Size': [
                                    {
                                        'Type': 0,
                                        'Value': 6,
                                        'Factor': 0,
                                        'Offset': 0
                                    },
                                    {
                                        'Type': 0,
                                        'Value': 100,
                                        'Factor': 0,
                                        'Offset': 0
                                    },
                                    {
                                        'Type': 0,
                                        'Value': 6,
                                        'Factor': 0,
                                        'Offset': 0
                                    }
                                ],
                                'Count': 1,
                                'DESCRIPTIONLIST': [
                                    {
                                        'ColorFlag': 0,
                                        'MaterialFlag': 0,
                                        'TextureFlag': 0,
                                        'SemColorFlag': 0,
                                        'Color': {
                                            'R': 0.501960813999176,
                                            'G': 0.501960813999176,
                                            'B': 0.501960813999176,
                                            'A': 1
                                        },
                                        'Material': {
                                            'AmbientColor': {
                                                'R': 0,
                                                'G': 0,
                                                'B': 0,
                                                'A': 1
                                            },
                                            'DiffuseColor': {
                                                'R': 0,
                                                'G': 0,
                                                'B': 0,
                                                'A': 1
                                            },
                                            'SpecularColor': {
                                                'R': 0,
                                                'G': 0,
                                                'B': 0,
                                                'A': 1
                                            },
                                            'EmissiveColor': {
                                                'R': 0,
                                                'G': 0,
                                                'B': 0,
                                                'A': 1
                                            },
                                            'Shininess': 0
                                        },
                                        'Transparent': 0,
                                        'Smooth': 0,
                                        'Texture': {
                                            'Level': 0,
                                            'Type': 0,
                                            'Code': '0',
                                            'Key': 0
                                        },
                                        'FlagMeasure': 10,
                                        'TransparentTex': 0,
                                        'SmoothTex': 0,
                                        'WrapTex': 0,
                                        'PaintFlag': 0,
                                        'WrapValue': [
                                            {
                                                'Type': 0,
                                                'Value': 1,
                                                'Factor': 0,
                                                'Offset': 0
                                            },
                                            {
                                                'Type': 0,
                                                'Value': 1,
                                                'Factor': 0,
                                                'Offset': 0
                                            }
                                        ],
                                        'TransformFlag': 0,
                                        'Count': 1,
                                        'ELEMENTLIST': [
                                            {
                                                'Type': ELEMENT3DTYPE.IMG3D_LINESET,
                                                'GEOMETRY': calcGEOMETRY( textPositionHeight - 5 )
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        };

        function calcGEOMETRY( height: number ): IMG3DLINESET {

            const Vertex: IMG3DPOINT[] = [];
            const Color: IMG3DRGBA[] = [];

            let firstColor: IMG3DRGBA;
            if ( textColor && Object.prototype.hasOwnProperty.call( textColor, 'R' ) ) {
                firstColor = textColor as IMG3DRGBA;
            } else {
                firstColor = {
                    'R': 0,
                    'G': 0,
                    'B': 0,
                    'A': 1
                };
            }

            let secondColor: IMG3DRGBA;
            if ( borderColor && Object.prototype.hasOwnProperty.call( borderColor, 'R' ) ) {
                secondColor = borderColor as IMG3DRGBA;
            } else {
                secondColor = {
                    'R': 1,
                    'G': 1,
                    'B': 1,
                    'A': 1
                };
            }

            let colorFlag = true;
            let LineCount = 0;
            while ( height > 0 ) {
                Vertex.push( {
                    'X': 0,
                    'Y': height,
                    'Z': 0
                } );

                Vertex.push( {
                    'X': 0,
                    'Y': height - 5,
                    'Z': 0
                } );

                const color = colorFlag ? firstColor : secondColor;

                Color.push( color );
                Color.push( color );

                colorFlag = !colorFlag;
                height -= 5;
                LineCount++;
            }
            return {
                LineCount,
                IndexCountPlace: 0,
                VertexIndexPlace: 0,
                ColorPlace: 0,
                ColorIndexPlace: 0,
                ColorPerVertex: 1,
                IndexCount: 0,
                VertexIndex: [],
                VertexCount: LineCount * 2,
                Vertex,
                Color
            };

        }
    }

    // /**
    //  * Запросить номер текстуры в массиве по коду
    //  * @method getTextureNumberByCode
    //  * @private
    //  * @param array {Object} Массив объектов типа ReadObject3D
    //  * @param code {Number} Код текстуры
    //  * @return {Number} Номер текстуры, при ошибке возвращает -1
    //  */
    // getTextureNumberByCode(array, code) {
    //     const ret = -1;
    //     for (const ii = 0; ii < array.HeadWEB3D.TextureCount; ii++) {
    //         if (array.TextureArray[ii].Code == code) {
    //             ret = ii;
    //             break;
    //         }
    //     }
    //     return ret;
    // }

    // /**
    //  * Запросить номер объекта в массиве array по коду и локализации
    //  * @method getObjectNumberByCode
    //  * @private
    //  * @param array {Object} Массив объектов типа ReadObject3D
    //  * @param code {Number} Код объекта
    //  * @param local {Number} Локализация
    //  * @return {Number} Номер объекта, при ошибке возвращает -1
    //  */
    // getObjectNumberByCode(array, code, local) {
    //     const ret = -1;
    //     for (const ii = 0; ii < array.HeadWEB3D.TreeCount; ii++) {
    //         if ((array.ObjectArray[ii].Code == code) && (array.ObjectArray[ii].Local == local)) {
    //             ret = ii;
    //             break;
    //         }
    //     }
    //     return ret;
    // }

}

