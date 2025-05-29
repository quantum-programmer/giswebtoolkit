import { TTranslate } from '~/translate/TTranslate';
import { COORDINATESYSTEM, EllipsoideKind, HEIGHTSYSTEM, MAPPROJECTION, MAPTYPE } from '~/translate/Enumrables';

/**
 * Параметры эллипсоида
 * @class EllipsoidParam
 */
export interface EllipsoidParam {
    /**
     * Длина большой полуоси эллипсоида
     */
    SemiMajorAxis: number;
    /**
     * Полярное сжатие эллипсоида
     */
    InverseFlattening: number;
}

export type MatrixDescription = {

    Name: string;
    Epsg: number;
    Type: 1 | 2;
    Frame: {
        min: {
            x: number;
            y: number;
        },
        max: {
            x: number;
            y: number;
        }
    },
    ScaleDenominator: number[];
    TileSize: number;
    MinZoom: number;
    MaxZoom: number;

}


/**
 * Параметры датума
 * Коэффициенты трансформирования геодезических координат
 * при переходе от одного эллипсоида к другому
 * Применяется преобразование по ГОСТ 32453-2017
 * (обратное преобразование Гельмерта, или Coordinate Frame Rotation;
 * EPSG dataset coordinate operation method code 1032)
 * Пример значений полей в LOCALDATUMPARAM:
 * 24.47; -130.89; -81.56; 0; 0; -0.13; -0.00000022;
 * @class LocalDatumParam
 */
export interface LocalDatumParam {

    /**
     * Сдвиги по осям в метрах
     */
    DX: number;
    DY: number;
    DZ: number;

    /**
     * Угловые поправки в секундах
     */
    RX: number;
    RY: number;
    RZ: number;

    /**
     * Поправка масштаба
     */
    M: number;
}

/**
 * Параметры датума
 * Коэффициенты трансформирования геодезических координат
 * при переходе от заданного эллипсоида к эллипсоиду WGS-84
 * Если задано 3 параметра, то применяется преобразование
 * Молоденского (Standard Molodensky Transformations),
 * если (6+1) - преобразование по ГОСТ 32453-2017
 * (обратное преобразование Гельмерта, или Coordinate Frame Rotation;
 * EPSG dataset coordinate operation method code 1032)
 * Пример значений полей в DATUMPARAM:
 * 24.47; -130.89; -81.56; 0; 0; -0.13; -0.00000022; 7; 0
 * @class LocalDatumParam
 */
export interface DatumParam extends LocalDatumParam {
    /**
     * 3 или 7  (14 - признак пересчета через ПЗ-90.02 для СК42\95)
     */
    Count: number;
}

/**
 * Параметры аффинного трансформирования
 * @class AffinCoff
 */
export interface AffinCoff {
    A0: number;
    A1: number;
    A2: number;
    B0: number;
    B1: number;
    B2: number;
}

/**
 * Параметры преобразования сдвиг, масштаб, поворот
 * @class OffsetScaleRotate
 */
export interface OffsetScaleRotate {
    /**
     * Угол поворота в радианах
     */
    Angle: number;

    /**
     * Масштаб
     */
    Scale: number;

    /**
     * Смещение по X
     */
    dX: number;

    /**
     * Смещение по Y
     */
    dY: number;
}


/**
 * Параметры трансформирования координат
 * @class LocalTransform
 */
export interface LocalTransform {
    Rotate: OffsetScaleRotate;
    Affine: AffinCoff;
}

/**
 * Пременная double
 */
export interface TDouble {
    Value: number;
}

export interface TTranslateRule {
    Source: Readonly<TTranslate> | null;
    Target: Readonly<TTranslate> | null;

    /**
     * Поправка на +/- 360 градусов к долготе
     */
    DeltaL: TDouble;

    /**
     * Внутрение переменные пересчета
     */
    StepOne: any;
    StepTwo: any;
    StepOne2D: any;
    StepTwo2D: any;
    StepOne_Back: any;
    StepTwo_Back: any;
    StepOne2D_Back: any;
    StepTwo2D_Back: any;
}


/**
 * Параметры района работ (карты)
 */
export interface MapRegisterEx {

    /**
     * Имя района
     */
    Name: string;

    /**
     * Знаменатель масштаба
     */
    Scale: number;

    /**
     * Код EPSG системы координат
     */
    EPSGCode: number;

    /**
     * Вид эллипсоида
     */
    EllipsoideKind: number;

    /**
     * Система высот
     */
    HeightSystem: number;

    /**
     * Проекция исх. материала
     */
    MaterialProjection: number;

    /**
     * Система координат (устаревшее)
     */
    CoordinateSystem: number;

    /**
     * Единица измерения в плане (0 - метры, 64 - радианы)
     */
    PlaneUnit: number;

    /**
     * Единица измерения по высоте
     */
    HeightUnit: number;

    /**
     * Вид рамки
     */
    FrameKind: number;

    /**
     * Обобщенный тип карты
     */
    MapType: number;

    /**
     * Разрешающая способность прибора
     * Обычно равна 20 000
     * Для карт повышенной точности:
     * -1 - максимальная точность
     * -2 - хранить координаты в сантиметрах
     * -3 - хранить координаты в миллиметрах
     * -7 - хранить координаты в радианах
     */
    DeviceCapability: number;

    /**
     * Наличие данных о проекции (0/1)
     */
    DataProjection: number;

    /**
     * Идентификатор района (для МСК 63: A-X или 0)
     */
    ZoneIdent: number;

    /**
     * Вид карты: 0 - MAP (многолистовая с рамками),
     * 1 - SIT (безразмерный лист), 2 - SITX (один файл),
     * -1 - SIT c рамкой,
     * -2 - SITX с рамкой
     */
    FlagRealPlace: number;

    /**
     * Номер зоны топокарты или 0
     */
    ZoneNumber: number;

    /**
     * Первая главная параллель StandardParallel1 в радианах
     */
    FirstMainParallel: number;

    /**
     * Вторая главная параллель StandardParallel2 в радианах
     */
    SecondMainParallel: number;

    /**
     * Осевой меридиан (Долгота полюса проекции) CentralMeridian в радианах
     */
    AxisMeridian: number;

    /**
     * Параллель главной точки (Широта полюса проекции) LatitudeOfOrigin в радианах
     */
    MainPointParallel: number;

    /**
     * (Latitude of false origin, etc) в радианах
     */
    PoleLatitude: number;

    /**
     * (Longitude of false origin, etc) в радианах
     */
    PoleLongitude: number;

    /**
     * Смещение координат по оси Y в метрах
     */
    FalseEasting: number;

    /**
     * Смещение координат по оси X в метрах
     */
    FalseNorthing: number;

    /**
     * Масштабный коэффициент на осевом меридиане (1.0 +\- ...)
     */
    ScaleFactor: number;

    /**
     * Угол разворота осей для локальных систем (МСК) в радианах (устаревшее, см. LOCALTRANSFORM)
     */
    TurnAngle: number;
}


/**
 * Идентификатор матрицы тайлов
 */
export interface MatrixIdent {


    /**
     * Код Epsg или 0
     */
    readonly Crs: number;

    /**
     * Размер тайла
     */
    readonly TileSize: number;

    /**
     * Адрес сервиса
     */
    readonly Url: string;

    /**
     * Идентификатор слоя для определения проекции
     */
    readonly LayerId: string;

}

export type TranslateDescription = [
    {
        name: 'Name';
        value: string;
        type: 'string';
    },
    {
        name: 'Scale';
        value: number;
        type: 'number';
    },
    {
        name: 'EPSGCode';
        value: number;
        type: 'number';
    },
    {
        name: 'EllipsoideKind';
        value: EllipsoideKind;
        type: 'number';
    },
    {
        name: 'HeightSystem';
        value: HEIGHTSYSTEM;
        type: 'number';
    },
    {
        name: 'MaterialProjection';
        value: MAPPROJECTION;
        type: 'number';
    },
    {
        name: 'CoordinateSystem';
        value: COORDINATESYSTEM;
        type: 'number';
    },
    {
        name: 'PlaneUnit';
        value: 0 | 64;
        type: 'number';
    },
    {
        name: 'HeightUnit',
        value: 0,
        type: 'number'
    },
    {
        name: 'FrameKind',
        value: number;
        type: 'number'
    },
    {
        name: 'MapType';
        value: MAPTYPE;
        type: 'number';
    },
    {
        name: 'DeviceCapability';
        value: -1 | -2 | -3 | -7;
        type: 'number';
    },
    {
        name: 'DataProjection';
        value: 0 | 1;
        type: 'number';
    },
    {
        name: 'ZoneIdent';
        value: number; // 0..60
        type: 'number';
    },
    {
        name: 'FlagRealPlace';
        value: -2 | -1 | 0 | 1 | 2;
        type: 'number';
    },
    {
        name: 'ZoneNumber';
        value: number;
        type: 'number';
    },
    {
        name: 'FirstMainParallel';
        value: number;
        type: 'number';
    },
    {
        name: 'SecondMainParallel';
        value: number;
        type: 'number';
    },
    {
        name: 'AxisMeridian';
        value: number;
        type: 'number';
    },
    {
        name: 'MainPointParallel';
        value: number;
        type: 'number';
    },
    {
        name: 'PoleLatitude';
        value: number;
        type: 'number';
    },
    {
        name: 'PoleLongitude';
        value: number;
        type: 'number';
    },
    {
        name: 'FalseEasting';
        value: number;
        type: 'number';
    },
    {
        name: 'ScaleFactor';
        value: number;
        type: 'number';
    },
    {
        name: 'TurnAngle';
        value: number;
        type: 'number';
    },
    {
        name: 'DX';
        value: number;
        type: 'number';
    },
    {
        name: 'DY';
        value: number;
        type: 'number';
    },
    {
        name: 'DZ';
        value: number;
        type: 'number';
    },
    {
        name: 'RX';
        value: number;
        type: 'number';
    },
    {
        name: 'RY';
        value: number;
        type: 'number';
    },
    {
        name: 'RZ';
        value: number;
        type: 'number';
    },
    {
        name: 'M';
        value: number;
        type: 'number';
    },
    {
        name: 'Count';
        value: number;
        type: 'number';
    },
    {
        name: 'SemiMajorAxis';
        value: number;
        type: 'number';
    },
    {
        name: 'InverseFlattening';
        value: number;
        type: 'number';
    },
    {
        name: 'SystemType',
        value: number;
        type: 'number'
    },

    {
        name: 'IsGeoSupported',
        value: 0 | 1,
        type: 'number'
    },
    {
        name: 'MinX';
        value: number;
        type: 'number';
    },
    {
        name: 'MinY';
        value: number;
        type: 'number';
    },
    {
        name: 'MaxX';
        value: number;
        type: 'number';
    },
    {
        name: 'MaxY';
        value: number;
        type: 'number';
    },
    {
        name: 'BaseScale';
        value: number;
        type: 'number';
    }
];