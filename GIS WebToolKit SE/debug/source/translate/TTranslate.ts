import {
    MAPPROJECTION,
    MAPTYPE,
    TRANSFORMTYPE,
    EllipsoideKind,
    WORKTYPE,
    HEIGHTSYSTEM,
    COORDINATESYSTEM
} from './Enumrables';
import { Spheroids } from './Spheroids';
import TranslateConst from './TranslateConst';
import { Bounds } from '~/geometry/Bounds';
import {
    DatumParam,
    EllipsoidParam,
    LocalDatumParam,
    LocalTransform,
    MapRegisterEx,
    OffsetScaleRotate,
    AffinCoff,
    TDouble,
    TTranslateRule, TranslateDescription
} from '~/translate/Types';
import TranslateFactory from '~/translate/TranslateFactory';
import OgcMatrixFactory from '~/translate/matrixes/OgcMatrixFactory';
import { TileMatrix } from '~/translate/matrixes/TileMatrix';
import { MapPoint } from '~/geometry/MapPoint';
import Trigonometry from '~/geo/Trigonometry';
import MapCalculations from '~/geo/MapCalculations';
import { vec3 } from '~/3d/engine/utils/glmatrix';
import { Vector2or3 } from '~/3d/engine/core/Types';


type DirectPositionResult = {
    b: number;
    l: number;
    angle: number;
}

type InversePositionResult = {
    azimuth: number;
    azimuthreverse: number;
    path: [number, number][];
}

/**
 * Базовый класс перевода координат из различных проекций
 * @class TTranslate
 */
export class TTranslate {

    /**
     * Осевой меридиан
     */
    private AxisMeridian = 0;
    /**
     * Базовый масштаб карты
     */
    BaseScale = 100000;
    /**
     * Система координат
     */
    private CoordinateSystem = 0;

    /**
     * Код EPSG
     */
    EpsgCode = 0;

    /**
     * Флаг поддержка геодезии
     */
    IsGeoSupported = 0;

    /**
     * Габариты карты
     */
    MapFrame = new Bounds( new MapPoint() );

    /**
     * Идентификатор проекции
     */
    ProjectionId = '';

    /**
     * Тип проекции
     */
    private ProjectionType = MAPPROJECTION.LATITUDELONGITUDE;

    /**
     * Тип системы координат 1 - метрическая 2 - геодезическая
     */
    private SystemType = 0;

    /**
     * Первая главная параллель
     */
    private FirstMainParallel = 0;

    /**
     * Вторая главная параллель
     */
    private SecondMainParallel = 0;

    /**
     * Параллель главной точки
     */
    private MainPointParallel = 0;

    /**
     * Широта полюса проекции
     */
    private PoleLatitude = 0;

    /**
     * Долгота полюса проекции
     */
    private PoleLongitude = 0;

    /**
     * Смещение координат по оси Y
     */
    private FalseEast = 0;

    /**
     * Смещение координат по оси X
     */
    private FalseNorth = 0;

    /**
     * Масштабный коэффициент
     */
    private ScaleFactor = 0;

    /**
     * Угол разворота осей для МСК
     */
    private TurnAngle = 0;

    // Описание данных для разных систем и проекций
    // --------------------------------------------

    /**
     * Условное начало прямоугольных координат
     */
    private X0 = 0;

    /**
     * в СК
     */
    private Y0 = 0;

    /**
     * Долгота осевого меридиана первой зоны
     */
    private L1 = 0;

    /**
     * Долгота осевого меридиана первой зоны (радианы)
     */
    private L1radian = 0;

    /**
     * Ширина координатной зоны
     */
    private DL = 0;

    /**
     * Ширина координатной зоны (радианы)
     */
    private DLradian = 0;

    /**
     * Квадрат первого эксцентриситета
     */
    private E2 = 0;

    /**
     * Квадрат второго эксцентриситета
     */
    private E2_2 = 0;

    /**
     * (м) большая полуось текущего эллипсоида
     */
    private BigAxis = 0;

    /**
     * Эксцентриситет меридианного эллипса
     */
    private ExcentricMeridian = 0;

    /**
     * Полярное сжатие эллипсоида
     */
    private Alfa = 0;

    /**
     * (1.0 - Alfa)
     */
    private AlfaTo1 = 0;

    /**
     * Средний радиус эллипсоида
     */
    private MiddleRadius = 0;

    // Параметры пересчета для текущего эллипсоида
    // к WGS-84

    /**
     * Параметры пересчета к WGS-84
     */
    private Datum = TranslateFactory.createDatumParam();

    /**
     * Разность больших полуосей эллипсоидов (Текущего и WGS84)
     */
    private DatumDA = 0;

    /**
     * Разность полярных сжатий
     */
    private DatumDF = 0;

    /**
     * Cos
     */
    private CosAngle = 0;

    /**
     * Sin
     */
    private SinAngle = 0;

    /**
     * Признак местной системы
     */
    private LocalSystem = 0;

    /**
     * Идентификатор зоны (для МСК 63: A-X или 0)
     */
    private ZoneIdent = 0;

    /**
     * Вид эллипсоида
     */
    private Ellipsoid = EllipsoideKind.UNDEFINED;


    /**
     * Номер зоны
     */
    private NumberZone = 0;

    /**
     * Тип карты
     */
    private MapType: MAPTYPE | WORKTYPE = MAPTYPE.MAPSPHERE;

    /**
     * Признак разворота осей
     */
    private IsTurnAngle = 0;

    /**
     * Вид проекции (полярная северная -1, полярная южная -2,
     * нормальная поперечная - 0, косая - 1)
     */
    private ProjectionKind = 0;

    /**
     * Знак
     */
    private Sign = 0;

    /**
     * Тип высоты
     */
    private HeightSystem = 0;

    /**
     * Тип системы координат (1 - плоские прямоугольные, 2 - геодезические) или 0
     */
    private CrsType = 0;

    /**
     * Признак пересчета датума через геоцентрический сдвиг
     */
    private IsGeoShift = 0;

    /**
     * Подготовка констант TransverseMercator USGS formulas  EPSG:9807
     */
    private kf = 0;
    private ksin2f = 0;
    private ksin4f = 0;
    private ksin6f = 0;
    private kM0 = 0;
    private ke1 = 0;
    private ke2 = 0;
    private ksin2m = 0;
    private ksin4m = 0;
    private ksin6m = 0;
    private ksin8m = 0;

    /**
     * Полярная равноугольная азимутальная(стереографическая)проекция
     * Константы для различных проекций
     */
    private va = 0;
    private vb = 0;
    private vc = 0;
    private vd = 0;
    private ve = 0;
    private vg = 0;
    private vh = 0;

    /**
     * (Прямая) Равнопромежуточная коническая проекция секущий и касательный конус
     * (Прямая) Равновеликая коническая проекция секущий конус
     */
    private alva = 0;
    // private cccc = 0;
    // private qqqq = 0;

    /**
     * (Прямая) Равноугольная коническая проекция секущий конус
     */
    // private kkkk = 0;

    /**
     * Видоизмененная простая поликоническая проекция (международная)
     * постоянные для трапеции: высота листа и синусы
     */
    private hh = 0;
    private sinfi1 = 0;
    private sinfi2 = 0;
    private r1 = 0;
    private r2 = 0;
    private ll = 0;

    /**
     * Стереографическая + двойная стереографическая проекции
     */
    private EDiv2 = 0;
    private SinKsi0 = 0;
    private CosKsi0 = 0;
    private Ksi0 = 0;
    private RK02 = 0;
    private C = 0;
    private N = 0;
    private G = 0;
    private H = 0;

    /**
     * Нелинейные коэффициенты аффинного преобразования ИЗ деформированной системы координат
     * x = a1 * (X - AffinCoef.A0) + a2 * (Y - AffinCoef.B0)
     * y = b1 * (X - AffinCoef.A0) + b2 * (Y - AffinCoef.B0)
     */
    private affa1 = 0;
    private affa2 = 0;
    private affb1 = 0;
    private affb2 = 0;

    /**
     * Параметры деформации системы координат на плоскости
     * параметры преобразования сдвиг масштаб поворот
     */
    private OffsetScaleRotate = TranslateFactory.createOffsetScaleRotate();

    /**
     * Параметры аффинного преобразования в деформированную СК
     * X = A0 + A1 * x + A2 * y   Y = B0 + B1 * x + B2 * y
     */
    private AffinCoef = {
        A0: 0,
        A1: 0,
        A2: 0,
        B0: 0,
        B1: 0,
        B2: 0
    };

    /**
     * Тип преобразования  (TRANSFORMTYPE)
     */
    private TransformType = 0;

    /**
     * Идентификатор матрицы тайлов
     */
    private readonly tileMatrix: TileMatrix;

    constructor( matrixname: string, description: TranslateDescription ) {
        this.init();
        this.initEllipsoid( EllipsoideKind.WGS_84 );
        this.initByCrs( matrixname, description );


        const ogcMatrix = OgcMatrixFactory.create( this );
        // Зарегистрировать матрицу
        this.tileMatrix = new TileMatrix( this.ProjectionId, this.isGeoSys(), ogcMatrix );
    }

    /**
     * Определение прямоугольных координат X и Y по геодезическим B и L
     * Входные данные:
     * геодезические координаты точки в радианах
     * Выходные данные:
     * прямоугольные координаты точки в метрах
     * @param b
     * @param l
     */
    bl2xy_one( b: TDouble, l: TDouble ) {
        const x = b.Value;
        const y = l.Value;
        this.bl2xy( x, y, b, l );
    }

    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * на эллипсоид WGS-84
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @returns
     */
    geoToGeo3dWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsToWGS84( b, l, h );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsToWGS84Ex( b, l, h );

        return 0;
    }

    /**
     * Преобразование геодезических координат на текущий эллипсоид
     * с эллипсоида WGS-84
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @returns
     */
    geoWGS84ToGeo( b: TDouble, l: TDouble ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsFromWGS842D( b, l );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsFromWGS842D( b, l );

        return 0;
    }

    /**
     * Запросить матрицу тайлов
     * @returns
     */
    getTileMatix(): TileMatrix {
        return this.tileMatrix;
    }

    /**
     * Является ли проекция геодезической
     * @returns
     */
    isGeoSys(): boolean {
        return this.SystemType === 2;
    }

    /**
     * Проверить необходимо ли перевернуть координаты для посылки в запрос
     * @returns
     */
    needTurnCoordinate(): boolean {
        if ( this.EpsgCode === 0 || ((this.EpsgCode >= 28401) && (this.EpsgCode <= 28460)) ||
            ((this.EpsgCode >= 20001) && (this.EpsgCode <= 20060)) ) {
            return false;
        }

        if ( this.isGeoSys() ) {
            return false;
        }

        if ( (this.ProjectionType == MAPPROJECTION.GAUSSCONFORMAL) || ((this.Datum.M == 1) && (this.ProjectionType == MAPPROJECTION.UTM)) ) {
            return false;
        }

        return true;
    }

    /**
     * Определение геодезических координат B и L по прямоугольным X и Y
     * Входные данные:
     * прямоугольные координаты точки в метрах
     * Выходные данные:
     * широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    xy2bl( x: number, y: number, b: TDouble, l: TDouble ) {
        // Учитываем деформацию на плоскости
        if ( (this.TransformType == TRANSFORMTYPE.ROTATESCALEOFFSET) || (this.TransformType == TRANSFORMTYPE.AFFINETRANSFORM) ) {
            const ax = x - this.AffinCoef.A0;
            const ay = y - this.AffinCoef.B0;
            x = this.affa1 * ax + this.affa2 * ay;
            y = this.affb1 * ax + this.affb2 * ay;
        }

        switch ( this.ProjectionType ) {
            case MAPPROJECTION.GAUSSCONFORMAL:
            case MAPPROJECTION.UTM:
            case MAPPROJECTION.GAUSSCONFORMAL_SYSTEM_63:
                this.xy2bl_TransverseMercator( x, y, b, l );
                break;

            case MAPPROJECTION.WORLDMERCATOR:
                this.xy2bl_MercatorProjection( x, y, b, l );
                break;
            case MAPPROJECTION.LATITUDELONGITUDE:
                this.xy2bl_LATLON( x, y, b, l );
                break;
            case MAPPROJECTION.MERCATOR_2SP:
                this.xy2bl_Mercator_2SP( x, y, b, l );
                break;

            case MAPPROJECTION.LAMBERTAZIMUTHALEQUALAREA:
            case MAPPROJECTION.LAMBERT:
            case MAPPROJECTION.AZIMUTHALOBLIQUE:
            case MAPPROJECTION.LAMBERTOBLIQUEAZIMUTHAL:
                this.xy2bl_LambertObliqueAzimuthal( x, y, b, l );
                break;

            case MAPPROJECTION.CONICALORTHOMORPHIC:
            case MAPPROJECTION.CONICALDIRECTORTHOMORPHIC:
                this.xy2bl_LambertConformalConic( x, y, b, l );
                break;

            case MAPPROJECTION.MERCATORMAP:
                this.xy2bl_MercatorMap( x, y, b, l );
                break;
            case MAPPROJECTION.MILLERCYLINDRICAL:
                this.xy2bl_MILLER( x, y, b, l );
                break;
            case MAPPROJECTION.CYLINDRICALEQUALSPACED:
                this.xy2bl_CylindricalEqualSpaced( x, y, b, l );
                break;
            case MAPPROJECTION.CYLINDRICALSPECIALBLANK:
                TTranslate.xy2bl_BLANK( x, y, b, l );
                break;
            case MAPPROJECTION.CYLINDRICALSPECIAL:
                TTranslate.xy2bl_GLOBE( x, y, b, l );
                break;
            case MAPPROJECTION.KAVRAJSKY:
                this.xy2bl_Kavrajsky( x, y, b, l );
                break;
            case MAPPROJECTION.MOLLWEIDE:
                this.xy2bl_Mollweide( x, y, b, l );
                break;
            case MAPPROJECTION.CONICALEQUIDISTANT:
                this.xy2bl_ConicalEquidistant( x, y, b, l );
                break;
            case MAPPROJECTION.CONICALEQUALAREA:
                this.xy2bl_ConicalEqualArea( x, y, b, l );
                break;

            case MAPPROJECTION.STEREOGRAPHICPOLAR:
            case MAPPROJECTION.AZIMUTHALORTHOMORPHICPOLAR:
                this.xy2bl_AzimuthalOrthomorphicPolar( x, y, b, l );
                break;

            case MAPPROJECTION.STEREOGRAPHIC:
                this.xy2bl_Stereographic( x, y, b, l );
                break;
            case MAPPROJECTION.DOUBLESTEREOGRAPHIC:
                this.xy2bl_DoubleStereographic( x, y, b, l );
                break;
            case MAPPROJECTION.POSTEL:
                this.xy2bl_Postel( x, y, b, l );
                break;
            case MAPPROJECTION.MODIFIEDAZIMUTALEQUIDISTANT:
                this.xy2bl_ModifiedAzimutalEquidistant( x, y, b, l );
                break;
            case MAPPROJECTION.AZIMUTALEQUIDISTANTGUAM:
                this.xy2bl_AzimutalEquidistantGuam( x, y, b, l );
                break;

            case MAPPROJECTION.URMAEV:
            case MAPPROJECTION.URMAEVSINUSOIDAL:
                this.xy2bl_UrmaevSinusoidal( x, y, b, l );
                break;

            case MAPPROJECTION.AITOFF:
                this.xy2bl_Aitoff( x, y, b, l );
                break;
            case MAPPROJECTION.LAMBERTCYLINDRICALEQUALAREA:
                this.xy2bl_LambertCylindricalEqualArea( x, y, b, l );
                break;
            case MAPPROJECTION.MODIFIEDPOLYCONICAL:
                this.xy2bl_ModifiedPolyconical( x, y, b, l );
                break;
            case MAPPROJECTION.TRANSVERSECYLINDRICAL:
                this.xy2bl_TransverseCylindrical( x, y, b, l );
                break;
            case MAPPROJECTION.GNOMONIC:
                this.xy2bl_Gnomonic( x, y, b, l );
                break;
            case MAPPROJECTION.BONNE:
                this.xy2bl_Bonne( x, y, b, l );
                break;

            default:
                console.error( 'TTranslateErrorCode:' + TranslateConst.IDS_PROJECTPARM );
                b.Value = 0;
                l.Value = 0;
        }
    }

    /**
     * Определение геодезических координат B и L по прямоугольным X и Y
     * Входные данные:
     * pointin - прямоугольные координаты точки в метрах
     * Выходные данные:
     * pointin - широта и долгота точки в радианах
     * @param b
     * @param l
     */
    xy2bl_one( b: TDouble, l: TDouble ) {
        const x = b.Value;
        const y = l.Value;
        this.xy2bl( x, y, b, l );
    }

    /**
     * Проинициализировать параметры по crs
     * @param matrixname
     * @param description
     * @returns
     */
    private initByCrs( matrixname: string, description: TranslateDescription ) {
        this.ProjectionId = matrixname;
        try {
            const {
                mapRegisterEx,
                ellipsoid,
                datum,
                translateParam
            } = TranslateFactory.parseGetTranslateResponse( description );
            if ( translateParam.SystemType !== undefined ) {
                this.SystemType = translateParam.SystemType;
            }
            if (translateParam.IsGeoSupported !== undefined) {
                this.IsGeoSupported = translateParam.IsGeoSupported;
            }
            if (translateParam.MapFrame !== undefined) {
                this.MapFrame = translateParam.MapFrame.clone();
            }
            if (translateParam.BaseScale !== undefined) {
                this.BaseScale = translateParam.BaseScale;
            }
            this.setProjection(mapRegisterEx, datum, ellipsoid);
        } catch (error) {
            console.log('Can`t parse input data, it is not valid JSON object');
            return 0;
        }
        return 1;
    }

    /**
     * Инициализация по параметру
     * @param translate
     */
    private initTranslate( translate: TTranslate ) {
        this.init();
        const mapreg = TranslateFactory.createMapRegisterEx();
        const datum = TranslateFactory.createDatumParam();
        const ellipsoid = TranslateFactory.createEllipsoidParam();
        const ttype: TDouble = { Value: 0 };
        const tparm = TranslateFactory.createLocalTransform();
        if ( translate.getProjectionEx( mapreg, datum, ellipsoid, ttype, tparm ) )
            this.setProjection( mapreg, datum, ellipsoid, ttype.Value, tparm );
    }

    /**
     * Установка проекции исходного материала и справочных данных по
     * проекции исходного материала
     * @param mapreg
     * @param datum
     * @param ellparam
     * @param ttype
     * @param tparm
     */
    private setProjection( mapreg: MapRegisterEx, datum?: DatumParam, ellparam?: EllipsoidParam, ttype?: number, tparm?: LocalTransform ): number {
        if ( !mapreg )
            return 0;

        this.ZoneIdent = mapreg.ZoneIdent;
        this.LocalSystem = 0;
        this.TransformType = 0;
        this.EpsgCode = mapreg.EPSGCode;

        if ( (ttype == TRANSFORMTYPE.ROTATESCALEOFFSET) && (tparm) )
            this.setRotateScaleOffset( tparm.Rotate );
        else if ( (ttype == TRANSFORMTYPE.AFFINETRANSFORM) && (tparm) )
            this.setAffineTransformation( tparm.Affine );

        this.MapType = mapreg.MapType;

        if ( (this.MapType == WORKTYPE.MCK_CK42) || (this.MapType == MAPTYPE.MCK_CK63) || (this.MapType == WORKTYPE.MCK_CK95) || (this.MapType == WORKTYPE.MCK_UTM) || (this.MapType == MAPTYPE.TOPOLOCAL) ) {
            this.LocalSystem = 1;
            if ( this.MapType != MAPTYPE.MCK_CK63 ) {
                if ( mapreg.ZoneNumber != 0 ) {
                    // Признак вывода номера зоны
                    this.ZoneIdent = mapreg.ZoneNumber;
                } else {
                    this.ZoneIdent = 0;
                }
            }

            if ( (this.MapType == WORKTYPE.MCK_CK42) || (this.MapType == MAPTYPE.MCK_CK63) || (this.MapType == WORKTYPE.MCK_CK95) ) {
                mapreg.EllipsoideKind = EllipsoideKind.KRASOVSKY42;
                if ( this.MapType == WORKTYPE.MCK_CK42 )
                    mapreg.CoordinateSystem = COORDINATESYSTEM.ORTHOGONAL;    // СК-42
                else if ( this.MapType == WORKTYPE.MCK_CK95 )
                    mapreg.CoordinateSystem = COORDINATESYSTEM.SYSTEM_95;    // СК-95
                else
                    mapreg.CoordinateSystem = COORDINATESYSTEM.SYSTEM_63;    // СК-63
            }
        } else if ( this.MapType < 0 )
            this.MapType = -1;

        if ( (this.MapType == MAPTYPE.CK_63) || (this.MapType == MAPTYPE.MCK_CK63) ) {
            mapreg.CoordinateSystem = COORDINATESYSTEM.SYSTEM_63;
            mapreg.EllipsoideKind = EllipsoideKind.KRASOVSKY42;

            if ( (this.LocalSystem != 0) && (this.ZoneIdent > 0) )
                this.NumberZone = mapreg.ZoneNumber;
        }

        if ( (this.MapType == MAPTYPE.CK_42) && ((!datum) || (datum.Count == 0)) ) {
            datum = TranslateFactory.createDefaultDatumParam( EllipsoideKind.KRASOVSKY42, COORDINATESYSTEM.ORTHOGONAL );
        }

        this.X0 = 0;
        this.Y0 = 0;

        this.IsTurnAngle = 0;       // Признак разворота осей
        this.CosAngle = 1;
        this.SinAngle = 0;

        this.CoordinateSystem = mapreg.CoordinateSystem;
        this.ProjectionType = mapreg.MaterialProjection;

        this.FirstMainParallel = mapreg.FirstMainParallel;
        this.SecondMainParallel = mapreg.SecondMainParallel;
        this.AxisMeridian = mapreg.AxisMeridian;
        this.MainPointParallel = mapreg.MainPointParallel;
        this.PoleLatitude = mapreg.PoleLatitude;
        this.PoleLongitude = mapreg.PoleLongitude;
        this.FalseEast = mapreg.FalseEasting;
        this.FalseNorth = mapreg.FalseNorthing;
        this.HeightSystem = mapreg.HeightSystem;

        if ( (mapreg.ScaleFactor > 0.5) && (mapreg.ScaleFactor < 1.5) )
            this.ScaleFactor = mapreg.ScaleFactor;
        else
            this.ScaleFactor = 1;

        this.TurnAngle = mapreg.TurnAngle;

        this.initEllipsoid( mapreg.EllipsoideKind, datum, ellparam );

        if ( (this.MapType == MAPTYPE.TOPOLOCAL) || ((this.MapType == MAPTYPE.GEOGRAPHIC) && (this.ProjectionType == MAPPROJECTION.GAUSSCONFORMAL)) )
            this.ProjectionType = MAPPROJECTION.UTM;

        if ( (this.ProjectionType == MAPPROJECTION.UNDEFINED) || (this.ProjectionType == 0) )
            return 0;

        if ( this.MapType != -1 )
            switch ( this.ProjectionType ) {
                case MAPPROJECTION.CYLINDRICALEQUALSPACED:  // Равнопромежуточная цилиндрическая проекция

                    this.initCylindricalEqualSpaced();
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.GEOGRAPHIC;
                    return 1;

                case MAPPROJECTION.MERCATOR_2SP:
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.GEOGRAPHIC;
                    this.initMercator_2SP();
                    return 1;

                case MAPPROJECTION.WORLDMERCATOR:
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.GEOGRAPHIC;
                    this.initMercatorProjection();
                    return 1;

                case MAPPROJECTION.LATITUDELONGITUDE:       // Широта/Долгота на шаре
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.MAPSPHERE;
                    return 1;

                case MAPPROJECTION.MILLERCYLINDRICAL:       // Цилиндрическая Миллера на шаре ESRI:54003
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.WORLDMAP;
                    return 1;

                case MAPPROJECTION.UTM:

                    // Инициализация системы WGS84 и проекции UTM
                    this.initUTM( 0 );

                    // Подготовка констант
                    this.initTransverseMercator();

                    // Не отображать в координате Y номер зоны
                    this.NumberZone = 0;

                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.UTMTYPE;
                    break;

                case MAPPROJECTION.GAUSSCONFORMAL:

                    if ( this.LocalSystem == 0 ) {
                        if ( (this.MapType == MAPTYPE.GCK_2011) || (this.MapType == MAPTYPE.Pulkovo2017) ) {
                            this.initGKfor42( 0 );
                            this.setNumberZone( this.AxisMeridian );
                        } else if ( (this.MapType == MAPTYPE.CK_42) || (this.MapType == MAPTYPE.CK_95) || (this.MapType == MAPTYPE.CK_63) || (this.MapType == MAPTYPE.MCK_CK63) ) {
                            let ellipsoid = 0;
                            if ( this.Ellipsoid != EllipsoideKind.KRASOVSKY42 )
                                ellipsoid = EllipsoideKind.KRASOVSKY42;

                            if ( this.CoordinateSystem != COORDINATESYSTEM.SYSTEM_63 ) {
                                this.FalseEast = 500000;
                                mapreg.FalseEasting = 500000;

                                this.initGKfor42( ellipsoid );
                                this.setNumberZone( this.AxisMeridian );
                            } else {
                                this.initCK63( ellipsoid );
                                this.setNumberZone( this.AxisMeridian );
                                this.MainPointParallel = 0;
                            }
                        }
                    } else {
                        this.initGKfor42( 0 );
                        this.ScaleFactor = 1;
                        this.MainPointParallel = 0;
                    }

                    // Подготовка констант
                    this.initTransverseMercator();

                    break;

                case MAPPROJECTION.CONICALORTHOMORPHIC:

                    if ( this.FalseEast == 0 ) {
                        this.FalseEast = 8000000;
                        mapreg.FalseEasting = 8000000;
                    }

                    this.initLambertConformalConic();

                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.GEOGRAPHIC;
                    return 1;

                case MAPPROJECTION.KAVRAJSKY:           // Псевдоцилиндрическая равновеликая
                    // синусоидальная проекция Каврайского
                    this.initKavrajsky();
                    break;

                case MAPPROJECTION.MOLLWEIDE:           // Псевдоцилиндрическая равновеликая
                    // эллиптическая проекция Мольвейде
                    this.initMollweide();
                    break;

                case MAPPROJECTION.CONICALEQUIDISTANT:  // (Прямая) равнопромежуточная
                    // коническая проекция
                    this.initConicalEquidistant();
                    break;

                case MAPPROJECTION.CONICALEQUALAREA:    // (Прямая) равновеликая коническая проекция

                    this.initConicalEqualArea();
                    break;

                case MAPPROJECTION.CONICALDIRECTORTHOMORPHIC:  // (Прямая) равноугольная
                    // коническая проекция
                    this.initLambertConformalConic();
                    break;

                case MAPPROJECTION.STEREOGRAPHICPOLAR:
                case MAPPROJECTION.AZIMUTHALORTHOMORPHICPOLAR:  // Полярная равноугольная
                    // азимутальная(стереографическая) проекция
                    this.initAzimuthalOrthomorphicPolar();
                    break;

                case MAPPROJECTION.STEREOGRAPHIC :  // Стереографическая проекция
                    this.initStereographic();
                    break;

                case MAPPROJECTION.DOUBLESTEREOGRAPHIC :  // Двойная стереографическая проекция (EPSG:9809)
                    this.initDoubleStereographic();
                    break;

                // (Нормальная) равновеликая
                case MAPPROJECTION.LAMBERTAZIMUTHALEQUALAREA:
                    this.initLambertObliqueAzimuthal();
                    break;
                // азимутальная проекция Ламберта
                case MAPPROJECTION.LAMBERT:
                    this.initLambertObliqueAzimuthal();
                    break;

                case MAPPROJECTION.AZIMUTHALOBLIQUE:
                    this.initLambertObliqueAzimuthal();
                    break;

                case MAPPROJECTION.LAMBERTOBLIQUEAZIMUTHAL:  // Косая равновеликая азимутальная
                    // проекция Ламберта
                    this.initLambertObliqueAzimuthal();
                    break;

                case MAPPROJECTION.POSTEL:      // (Нормальная) равнопромежуточная
                    // азимутальная проекция Постеля
                    this.initPostel();
                    break;

                case MAPPROJECTION.MODIFIEDAZIMUTALEQUIDISTANT:

                    this.initModifiedAzimutalEquidistant();
                    break;

                case MAPPROJECTION.AZIMUTALEQUIDISTANTGUAM:
                    this.initAzimutalEquidistantGuam();
                    break;

                case MAPPROJECTION.URMAEV:
                    this.initUrmaevSinusoidal();
                    break;

                case MAPPROJECTION.URMAEVSINUSOIDAL:      // Псевдоцилиндрическая синусоидальная
                    // проекция Урмаева для карт
                    // океанов(Тихого и Индийского)
                    this.initUrmaevSinusoidal();
                    break;

                case MAPPROJECTION.AITOFF:              // Производная равновеликая
                    // проекция Аитова-Гамера
                    break;

                case MAPPROJECTION.LAMBERTCYLINDRICALEQUALAREA:  // Равновеликая цилиндрическая
                    // проекция Ламберта
                    this.initLambertCylindricalEqualArea();
                    break;

                case MAPPROJECTION.MODIFIEDPOLYCONICAL:  // Видоизмененная простая поликоническая
                    // проекция (международная)
                    this.initModifiedPolyconical();
                    break;

                case MAPPROJECTION.TRANSVERSECYLINDRICAL:  // Равноугольная поперечно-цилиндрическая
                    // проекция
                    this.initTransverseCylindrical();
                    break;

                case MAPPROJECTION.GAUSSCONFORMAL_SYSTEM_63: // Система 63 года

                    if ( (this.LocalSystem == 0) || (this.CoordinateSystem != COORDINATESYSTEM.SYSTEM_63) || (this.ZoneIdent <= 0) ) {
                        let ellipsoid = 0;
                        if ( this.Ellipsoid != EllipsoideKind.KRASOVSKY42 )
                            ellipsoid = EllipsoideKind.KRASOVSKY42;

                        this.initCK63( ellipsoid );
                        this.setNumberZone( this.AxisMeridian );

                        if ( (this.AxisMeridian == 0) || (this.X0 == 0) || (this.Y0 == 0) ) {
                            // Эти параметры для СК-63 не д.б. нулевыми
                            return 0;
                        }

                        if ( this.MapType == 0 )
                            this.MapType = MAPTYPE.CK_63;
                    }

                    this.MainPointParallel = 0;

                    // Подготовка констант
                    this.initTransverseMercator();
                    break;

                case MAPPROJECTION.MERCATORMAP:
                    this.initMercatorMap();
                    if ( this.MapType == 0 )
                        this.MapType = MAPTYPE.SEANAUTICOLD;
                    return 1;

                case MAPPROJECTION.GNOMONIC:
                    this.initGnomonic();
                    return 1;

                case MAPPROJECTION.BONNE:
                    this.initBonne();
                    return 1;
            }

        if ( this.MapType == MAPTYPE.TOPOLOCAL ) {
            this.X0 = 0;
            this.Y0 = 0;
            this.NumberZone = 0;

            if ( this.TurnAngle != 0 ) {
                this.IsTurnAngle = 1;       // Признак разворота осей

                this.CosAngle = Math.cos( this.TurnAngle );
                this.SinAngle = Math.sin( this.TurnAngle );
            }

            this.X0 = this.FalseNorth;
            this.Y0 = this.FalseEast;

            if ( (mapreg.ScaleFactor > 0.5) && (mapreg.ScaleFactor < 1.5) )
                this.ScaleFactor = mapreg.ScaleFactor;

            // Учесть номер зоны
            // Учитывать в FalseEast
            if ( (this.ZoneIdent > 0) && (this.ZoneIdent < 60) ) {
                this.NumberZone = this.ZoneIdent;

                this.DLradian = this.SecondMainParallel;
                this.DL = this.DLradian * 180 / Math.PI;

                this.L1radian = this.AxisMeridian;
                this.L1 = this.L1radian * 180 / Math.PI;
            }
        } else if ( this.LocalSystem != 0 ) {
            if ( this.TurnAngle != 0 ) {
                this.IsTurnAngle = 1;       // Признак разворота осей

                this.CosAngle = Math.cos( this.TurnAngle );
                this.SinAngle = Math.sin( this.TurnAngle );
            }

            if ( (this.CoordinateSystem == COORDINATESYSTEM.SYSTEM_63) && (this.ZoneIdent > 0) ) {
                let ellipsoid = 0;
                if ( this.Ellipsoid != EllipsoideKind.KRASOVSKY42 )
                    ellipsoid = EllipsoideKind.KRASOVSKY42;

                // Заполнить параметры для заданной зоны
                this.initMCK63ByZone( ellipsoid );

                // Внести поправку в осевой меридиан
                this.AxisMeridian += this.PoleLongitude;
            } else if ( this.ZoneIdent == 0 ) {
                this.NumberZone = 0;
            } else {
                const zone = this.calcZoneNumber( this.AxisMeridian );
                if ( zone > 0 )
                    this.NumberZone = zone;
            }

            this.X0 += this.FalseNorth;
            this.Y0 += this.FalseEast;
        }

        return 1;
    }

    /**
     * Проверка на цилиндрическую проекцию текущих параметров
     * @returns
     */
    private checkCylindrical(): number {
        if ( (this.ProjectionType == MAPPROJECTION.CYLINDRICALSPECIAL) || (this.ProjectionType == MAPPROJECTION.MERCATORMAP) ||
            (this.ProjectionType == MAPPROJECTION.CYLINDRICALSPECIALBLANK) || (this.ProjectionType == MAPPROJECTION.CYLINDRICALEQUALSPACED) ||
            (this.ProjectionType == MAPPROJECTION.LAMBERTCYLINDRICALEQUALAREA) || (this.ProjectionType == MAPPROJECTION.LATITUDELONGITUDE) ||
            (this.ProjectionType == MAPPROJECTION.MILLERCYLINDRICAL) || (this.ProjectionType == MAPPROJECTION.WORLDMERCATOR) ||
            (this.ProjectionType == MAPPROJECTION.MERCATOR_2SP) )
            return 1;
        return 0;
    }

    /**
     * Установка параметров преобразования поворот, масштаб, смещение
     * @param parm
     * @returns
     */
    private setRotateScaleOffset( parm?: OffsetScaleRotate ): number {
        if ( !parm ) {
            this.TransformType = 0;
            return 0;
        }

        this.TransformType = TRANSFORMTYPE.ROTATESCALEOFFSET;
        this.OffsetScaleRotate = parm;

        // Заменяем отрицательный или равный нулю масштаб на единицу
        // (я бы вышел с 0)
        let scale = parm.Scale;
        if ( parm.Scale < TranslateConst.DOUBLENULL ) {
            scale = 1;
        }

        // Вычисляем коэффициенты аффинного преобразования
        // при пересчете в деформированную СК
        const sinA = Math.sin( parm.Angle );
        const cosA = Math.cos( parm.Angle );
        this.AffinCoef.A0 = parm.dX;
        this.AffinCoef.A1 = scale * cosA;
        this.AffinCoef.A2 = -scale * sinA;
        this.AffinCoef.B0 = parm.dY;
        this.AffinCoef.B1 = -this.AffinCoef.A2;
        this.AffinCoef.B2 = this.AffinCoef.A1;

        // Вычисляем коэффициенты аффинного преобразования
        // при пересчете из деформированной СК
        this.affa1 = cosA / scale;
        this.affa2 = sinA / scale;
        this.affb1 = -this.affa2;
        this.affb2 = this.affa1;
        return 1;
    }

    /**
     * Установка параметров афинного преобразования
     * @param parm
     * @returns
     */
    private setAffineTransformation( parm?: AffinCoff ): number {
        if ( !parm ) {
            this.TransformType = 0;
            return 0;
        }

        this.TransformType = TRANSFORMTYPE.AFFINETRANSFORM;
        this.AffinCoef = parm;

        // Устраняем недопустимое сочетание коэффициентов,
        // которое приведет к делению на ноль (определитель матрицы = 0)
        let det = parm.B2 * parm.A1 - parm.A2 * parm.B1;
        if ( Math.abs( det ) < TranslateConst.DOUBLENULL ) {
            det = TranslateConst.DOUBLENULL;
        }

        // Вычисляем коэффициенты аффинного преобразования
        // при пересчете из деформированной СК
        this.affa1 = parm.B2 / det;
        this.affa2 = -parm.A2 / det;
        this.affb1 = -parm.B1 / det;
        this.affb2 = parm.A1 / det;

        return 1;
    }

    /**
     * Запросить параметры преобразования координат
     * @param parm
     * @returns
     */
    private getLocalTransformationParm( parm: LocalTransform ): number {
        if ( this.TransformType == TRANSFORMTYPE.ROTATESCALEOFFSET )
            parm.Rotate = this.OffsetScaleRotate;
        else if ( this.TransformType == TRANSFORMTYPE.AFFINETRANSFORM )
            parm.Affine = this.AffinCoef;
        else
            return 0;

        return this.TransformType;
    }

    /**
     * Заполнить TTranslate для топокарты по произвольному осевому меридиану
     * @param l
     * @param ellipsoid
     * @param ellparam
     * @returns
     */
    setTopoTranslate( l: number, ellipsoid = 0, ellparam?: EllipsoidParam ): number {
        const mapreg = TranslateFactory.createMapRegisterEx( {
            EllipsoideKind: EllipsoideKind.WGS_84,
            MapType: MAPTYPE.TOPOLOCAL,
            HeightSystem: HEIGHTSYSTEM.PEACEOCEAN,
            MaterialProjection: MAPPROJECTION.UTM,
            CoordinateSystem: COORDINATESYSTEM.UNIVERSALMERCATOR,
            FalseEasting: 500000,
            ScaleFactor: 1.0
        } );


        if ( ellipsoid != 0 ) {
            mapreg.EllipsoideKind = ellipsoid;
            this.setProjection( mapreg, undefined, ellparam );
        } else
            this.setProjection( mapreg );

        this.AxisMeridian = l;                       // Нестандартный меридиан !
        this.NumberZone = 0;

        return 1;
    }

    /**
     * Заполнить TTranslate для проекции Широта\Долгота
     * @param ellipsoid
     * @param ellparam
     * @returns
     */
    private setLatLonTranslate( ellipsoid: number, ellparam?: EllipsoidParam ): number {

        const mapreg = TranslateFactory.createMapRegisterEx( {
            MaterialProjection: MAPPROJECTION.LATITUDELONGITUDE,    // Широта/Долгота
            EllipsoideKind: EllipsoideKind.WGS_84,                  // WGS 84
            HeightSystem: HEIGHTSYSTEM.PEACEOCEAN,                  // MSL
            CoordinateSystem: COORDINATESYSTEM.CONDITION,           // Прямоугольная условная для обзорных карт
            ScaleFactor: 1.0,
            DataProjection: 1
        } );

        if ( ellipsoid != 0 ) {
            mapreg.EllipsoideKind = ellipsoid;
            this.setProjection( mapreg, undefined, ellparam );
        } else
            this.setProjection( mapreg );

        return 1;
    }

    /**
     * Осевой меридиан
     * @returns
     */
    getAxisMeridian(): number {
        return this.AxisMeridian;
    }

    /**
     * Осевой меридиан
     * @param meridian
     * @returns
     */
    SetAxisMeridian( meridian: number ): number {
        this.setNumberZone( meridian );
        return this.AxisMeridian;
    }

    /**
     * Возврат типа проекции
     * @returns
     */
    getProjectionType(): number {
        return this.ProjectionType;
    }

    /**
     * Запросить тип карты
     * @returns
     */
    getMapType(): number {
        return this.MapType;
    }

    /**
     * Возврат вида эллипсоида
     * @returns
     */
    private getEllipsoid(): number {
        return this.Ellipsoid;
    }

    /**
     * Система координат
     * @returns
     */
    getCoordinateSystem(): number {
        return this.CoordinateSystem;
    }

    /**
     * Запросить тип системы координат (геодезическая - 2, плоская прямоугольная - 1)
     * @returns
     */
    getCrsType(): number {
        return this.CrsType;
    }

    /**
     * Установить тип системы координат (геодезическая - 2, плоская прямоугольная - 1)
     * @param type
     * @returns
     */
    private setCrsType( type: number ): number {
        return this.CrsType = type;
    }

    /**
     * Запросить идентификатор зоны для МСК-63
     * @returns
     */
    getZoneIdent(): number {
        return this.ZoneIdent;
    }

    /**
     * Запросить номер зоны для топографических карт
     * @returns
     */
    getNumberZone(): number {
        return this.NumberZone;
    }

    /**
     * Установка номера зоны и осевого меридиана по номеру зоны
     * @param numberzone
     * @param issetaxis
     * @returns
     */
    private setNumberZoneByZone( numberzone: number, issetaxis = 0 ): number {
        if ( numberzone <= 0 )
            numberzone = 1;

        this.NumberZone = numberzone;

        if ( issetaxis )
            this.AxisMeridian = this.calcAxisMeridianByNumberZone( numberzone );

        return this.NumberZone;
    }

    /**
     * Установка номера зоны и осевого меридиана по долготе
     * @param l
     * @returns
     */
    private setNumberZone( l: number ): number {
        if ( this.DL <= 0. )
            this.DL = 6.0;

        this.NumberZone = this.calcZoneNumber( l );

        // При установке номера зоны по осевому меридиану меняем и осевой меридиан
        if ( this.LocalSystem == 0 )
            this.AxisMeridian = this.calcAxisMeridianByNumberZone( this.NumberZone );
        else
            this.AxisMeridian = l;

        return this.NumberZone;
    }

    /**
     * Вычисление номера зоны по осевому меридиану
     * @param l
     * @returns
     */
    private calcZoneNumber( l: number ): number {
        let zone;
        let dl = this.DL;
        if ( dl <= 0. ) {
            dl = 6.0;
        }

        if ( this.L1 == 0 ) {
            if ( (this.MapType >= MAPTYPE.UTMNAD27) && (this.MapType <= MAPTYPE.UTMTYPE) )
                this.L1 = 183.;
            else
                this.L1 = 3.;
        }

        const L = l * TranslateConst.RAD;

        const lll = this.L1 - dl / 2.;
        if ( L >= lll )
            zone = Math.floor( ((L - lll) / dl) + 1 );
        else
            zone = Math.floor( ((360 + L - lll) / dl) + 1 );

        if ( zone <= 0 )
            zone = 1;
        else if ( zone > 60 )
            zone = 60;

        return zone;
    }

    /**
     * Вычисление осевого меридиана по номеру зоны
     * @param zone
     * @returns
     */
    private calcAxisMeridianByNumberZone( zone: number ): number {
        let axis = (this.L1 + this.DL * (zone - 1.)) * Math.PI / 180;
        if ( axis > TranslateConst.PI2 ) {
            axis = axis - TranslateConst.PI2;
        }
        return axis;
    }

    /**
     * Вычисление осевого меридиана по долготе для 6-градусной зоны
     * @param l
     * @returns
     */
    private calcAxisMeridianByL( l: number ): number {
        const zone = this.calcZoneNumber( l );
        return this.calcAxisMeridianByNumberZone( zone );
    }

    /**
     * Определить - совпадают ли параметры Datum
     * Сранивает текущие параметры с заданными с учетом параметров проекций
     * Если необходим пересчет - возвращает ненулевое значени
     * @param datum
     * @returns
     */
    private compareDatum( datum: DatumParam ): number {
        if ( this.Datum.Count != datum.Count ) {
            if ( (this.Datum.Count == 7) && (datum.Count == 14) ) {
                // Возможно СК-42 или СК-95 и там и там
                let delta = this.Datum.DX - datum.DX - TranslateConst.DX_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.Datum.DY - datum.DY - TranslateConst.DY_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.Datum.RZ - datum.RZ - TranslateConst.RZ_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;
            } else if ( (this.Datum.Count == 14) && (datum.Count == 7) ) {
                // Возможно СК-42 или СК-95 и там и там
                let delta = datum.DX - this.Datum.DX - TranslateConst.DX_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = datum.DY - this.Datum.DY - TranslateConst.DY_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = datum.RZ - this.Datum.RZ - TranslateConst.RZ_SGS85_WGS84;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;
            } else
                return 1;
        } else if ( this.Datum.Count >= 3 ) {
            let delta = this.Datum.DX - datum.DX;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }

            delta = this.Datum.DY - datum.DY;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }

            delta = this.Datum.DZ - datum.DZ;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }

            delta = this.Datum.RX - datum.RX;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }

            delta = this.Datum.RY - datum.RY;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }

            delta = this.Datum.RZ - datum.RZ;
            if ( (delta < -0.000001) || (delta > 0.000001) ) {
                return 1;
            }
        }

        return 0;
    }


    /**
     * Определить необходимо ли трансформирование данных между
     * проекциями и системами координат
     * Сранивает текущие параметры с заданными с учетом параметров проекций
     * Если необходим пересчет - возвращает ненулевое значение
     * @param translate
     * @returns
     */
    private compareProjection( translate: TTranslate ): number {
        if ( (this.MapType <= 0) || (this.MapType == MAPTYPE.LARGESCALE) )
            return 0;

        if ( (translate.MapType <= 0) || (translate.MapType == MAPTYPE.LARGESCALE) )
            return 0;

        if ( translate.ProjectionType != this.ProjectionType ) {
            if ( !((translate.ProjectionType == MAPPROJECTION.GAUSSCONFORMAL) && (this.ProjectionType == MAPPROJECTION.UTM) && (this.Datum.M == 1.)) ) {
                if ( !((this.ProjectionType == MAPPROJECTION.GAUSSCONFORMAL) && (translate.ProjectionType == MAPPROJECTION.UTM) && (translate.Datum.M == 1.)) ) {
                    return 1;
                }
            }
        }


        let delta = translate.AxisMeridian - this.AxisMeridian;
        if ( delta < 0 ) {
            delta = -delta;
        }

        let step = delta - (2. * Math.PI);       // Проверка расхождения на 2PI
        if ( step < 0 ) step = -step;
        if ( step < 0.000001 )
            delta = 0;

        if ( delta > 0.00001 )
            return 1;

        delta = translate.FirstMainParallel - this.FirstMainParallel;
        if ( delta < 0 )
            delta = -delta;
        if ( delta > 0.00001 )
            return 1;

        delta = translate.SecondMainParallel - this.SecondMainParallel;
        if ( delta < 0 )
            delta = -delta;
        if ( delta > 0.00001 )
            return 1;

        delta = translate.MainPointParallel - this.MainPointParallel;
        if ( delta < 0 )
            delta = -delta;
        if ( delta > 0.00001 )
            return 1;

        if ( (this.MapType == MAPTYPE.CK_63) || (this.MapType == MAPTYPE.MCK_CK63) ) {
            delta = translate.PoleLongitude - this.PoleLongitude;
            if ( delta < 0 )
                delta = -delta;
            if ( delta > 0.00001 )
                return 1;
        }

        delta = this.BigAxis - translate.BigAxis;
        if ( (delta < -0.1) || (delta > 0.1) )
            return 1;

        delta = this.Alfa - translate.Alfa;
        if ( (delta < -0.0001) || (delta > 0.0001) )
            return 1;

        if ( this.compareDatum( translate.Datum ) )
            return 1;

        if ( translate.ScaleFactor != this.ScaleFactor )
            return 1;

        if ( Math.abs( translate.FalseEast - this.FalseEast ) > TranslateConst.DOUBLENULL )
            return 1;

        if ( Math.abs( translate.FalseNorth - this.FalseNorth ) > TranslateConst.DOUBLENULL )
            return 1;

        if ( ((translate.TransformType > 0) && (translate.TransformType < 255)) || ((this.TransformType > 0) && (this.TransformType < 255)) ) {
            if ( translate.TransformType != this.TransformType )
                return 1;

            if ( this.TransformType == TRANSFORMTYPE.ROTATESCALEOFFSET ) {
                // Проверить 4 коэффициента
                delta = this.OffsetScaleRotate.Angle - translate.OffsetScaleRotate.Angle;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.OffsetScaleRotate.Scale - translate.OffsetScaleRotate.Scale;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.OffsetScaleRotate.dX - translate.OffsetScaleRotate.dX;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.OffsetScaleRotate.dY - translate.OffsetScaleRotate.dY;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;
            } else if ( this.TransformType == TRANSFORMTYPE.AFFINETRANSFORM ) {
                // Проверить 6 коэффициентов
                delta = this.AffinCoef.A0 - translate.AffinCoef.A0;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.AffinCoef.A1 - translate.AffinCoef.A1;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.AffinCoef.A2 - translate.AffinCoef.A2;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.AffinCoef.B0 - translate.AffinCoef.B0;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.AffinCoef.B1 - translate.AffinCoef.B1;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;

                delta = this.AffinCoef.B2 - translate.AffinCoef.B2;
                if ( (delta < -0.000001) || (delta > 0.000001) )
                    return 1;
            }
        }

        return 0;
    }


    /**
     * Определение прямоугольных координат X и Y по геодезическим B и L
     * Входные данные:
     * pointin - геодезические координаты точки в радианах
     * Выходные данные:
     * pointout - прямоугольные координаты точки в метрах
     * @param B
     * @param L
     * @param x
     * @param y
     */

    private bl2xy( B: number, L: number, x: TDouble, y: TDouble ) {
        // Не даем широте выйти за 90 градусов
        if ( B < -TranslateConst.M_PI_2 )
            B = -TranslateConst.M_PI_2;
        else if ( B > TranslateConst.M_PI_2 )
            B = TranslateConst.M_PI_2;

        switch ( this.ProjectionType ) {
            case MAPPROJECTION.GAUSSCONFORMAL              :
            case MAPPROJECTION.UTM                         :
            case MAPPROJECTION.GAUSSCONFORMAL_SYSTEM_63    :
                this.bl2xy_TransverseMercator( B, L, x, y );
                break;

            case MAPPROJECTION.WORLDMERCATOR               :
                this.bl2xy_MercatorProjection( B, L, x, y );
                break; // проекция геопорталов
            case MAPPROJECTION.LATITUDELONGITUDE           :
                this.bl2xy_LATLON( B, L, x, y );
                break;
            case MAPPROJECTION.MERCATOR_2SP                :
                this.bl2xy_Mercator_2SP( B, L, x, y );
                break;

            case MAPPROJECTION.LAMBERTAZIMUTHALEQUALAREA   :
            case MAPPROJECTION.LAMBERT                     :
            case MAPPROJECTION.AZIMUTHALOBLIQUE            :
            case MAPPROJECTION.LAMBERTOBLIQUEAZIMUTHAL     :
                this.bl2xy_LambertObliqueAzimuthal( B, L, x, y );
                break;

            case MAPPROJECTION.CONICALORTHOMORPHIC         :
            case MAPPROJECTION.CONICALDIRECTORTHOMORPHIC   :
                this.bl2xy_LambertConformalConic( B, L, x, y );
                break;

            case MAPPROJECTION.MERCATORMAP                 :
                this.bl2xy_MercatorMap( B, L, x, y );
                break;
            case MAPPROJECTION.MILLERCYLINDRICAL           :
                this.bl2xy_MILLER( B, L, x, y );
                break;
            case MAPPROJECTION.CYLINDRICALEQUALSPACED      :
                this.bl2xy_CylindricalEqualSpaced( B, L, x, y );
                break;
            case MAPPROJECTION.CYLINDRICALSPECIALBLANK     :
                TTranslate.bl2xy_BLANK( B, L, x, y );
                break;
            case MAPPROJECTION.CYLINDRICALSPECIAL          :
                TTranslate.bl2xy_GLOBE( B, L, x, y );
                break;
            case MAPPROJECTION.KAVRAJSKY                   :
                this.bl2xy_Kavrajsky( B, L, x, y );
                break;
            case MAPPROJECTION.MOLLWEIDE                   :
                this.bl2xy_Mollweide( B, L, x, y );
                break;
            case MAPPROJECTION.CONICALEQUIDISTANT          :
                this.bl2xy_ConicalEquidistant( B, L, x, y );
                break;
            case MAPPROJECTION.CONICALEQUALAREA            :
                this.bl2xy_ConicalEqualArea( B, L, x, y );
                break;

            case MAPPROJECTION.STEREOGRAPHICPOLAR:
            case MAPPROJECTION.AZIMUTHALORTHOMORPHICPOLAR  :
                this.bl2xy_AzimuthalOrthomorphicPolar( B, L, x, y );
                break;

            case MAPPROJECTION.STEREOGRAPHIC               :
                this.bl2xy_Stereographic( B, L, x, y );
                break;
            case MAPPROJECTION.DOUBLESTEREOGRAPHIC         :
                this.bl2xy_DoubleStereographic( B, L, x, y );
                break;
            case MAPPROJECTION.POSTEL                      :
                this.bl2xy_Postel( B, L, x, y );
                break;
            case MAPPROJECTION.MODIFIEDAZIMUTALEQUIDISTANT :
                this.bl2xy_ModifiedAzimutalEquidistant( B, L, x, y );
                break;
            case MAPPROJECTION.AZIMUTALEQUIDISTANTGUAM     :
                this.bl2xy_AzimutalEquidistantGuam( B, L, x, y );
                break;
            case MAPPROJECTION.URMAEV:
            case MAPPROJECTION.URMAEVSINUSOIDAL            :
                this.bl2xy_UrmaevSinusoidal( B, L, x, y );
                break;
            case MAPPROJECTION.AITOFF                      :
                this.bl2xy_Aitoff( B, L, x, y );
                break;
            case MAPPROJECTION.LAMBERTCYLINDRICALEQUALAREA :
                this.bl2xy_LambertCylindricalEqualArea( B, L, x, y );
                break;
            case MAPPROJECTION.MODIFIEDPOLYCONICAL         :
                this.bl2xy_ModifiedPolyconical( B, L, x, y );
                break;
            case MAPPROJECTION.TRANSVERSECYLINDRICAL       :
                this.bl2xy_TransverseCylindrical( B, L, x, y );
                break;
            case MAPPROJECTION.GNOMONIC                    :
                this.bl2xy_Gnomonic( B, L, x, y );
                break;
            case MAPPROJECTION.BONNE                       :
                this.bl2xy_Bonne( B, L, x, y );
                break;

            default                          :
                console.error( 'TTranslateErrorCode:' + TranslateConst.IDS_PROJECTPARM );
                x.Value = 0;
                y.Value = 0;
        }

        // Учитываем деформацию на плоскости
        if ( (this.TransformType == TRANSFORMTYPE.ROTATESCALEOFFSET) || (this.TransformType == TRANSFORMTYPE.AFFINETRANSFORM) ) {
            const ax = this.AffinCoef.A0 + this.AffinCoef.A1 * x.Value + this.AffinCoef.A2 * y.Value;
            const ay = this.AffinCoef.B0 + this.AffinCoef.B1 * x.Value + this.AffinCoef.B2 * y.Value;
            x.Value = ax;
            y.Value = ay;
        }
    }


    /**
     * Определение геодезических координат B и L по прямоугольным X и Y
     * с преобразованием к заданному эллипсоиду
     * Входные данные:
     * прямоугольные координаты точки в метрах
     * Выходные данные:
     * широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     * @param translate
     */
    private xy2blByTranslate( x: number, y: number, b: TDouble, l: TDouble, translate: TTranslate ) {
        this.xy2bl( x, y, b, l );
        const h: TDouble = { Value: 0 };
        this.blz2blByTranslate( b, l, h, translate );
    }

    /**
     * Определение геодезических координат B и L по прямоугольным X и Y
     * с преобразованием к заданному эллипсоиду
     * Входные данные:
     * прямоугольные координаты точки в метрах
     * Выходные данные:
     * широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     * @param h
     * @param translate
     */
    private xy2blzByTranslate( x: number, y: number, b: TDouble, l: TDouble, h: TDouble, translate: TTranslate ) {
        this.xy2bl( x, y, b, l );
        this.blz2blByTranslate( b, l, h, translate );
    }

    /**
     * Определение прямоугольных координат X и Y по геодезическим B и L
     * с преобразованием из заданного эллипсоида
     * Входные данные:
     * геодезические координаты точки в радианах
     * Выходные данные:
     * прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     * @param translate
     */
    private bl2xyByTranslate( b: number, l: number, x: TDouble, y: TDouble, translate: TTranslate ) {
        const h: TDouble = { Value: 0 };
        const bb: TDouble = { Value: b };
        const ll: TDouble = { Value: l };
        translate.blz2blByTranslate( bb, ll, h, this );
        this.bl2xy( b, l, x, y );
    }

    /**
     * Вычисление прямоугольных координат на текущем эллипсоиде
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_TransverseMercator( b: number, l: number, x: TDouble, y: TDouble ) {
        if ( b >= TranslateConst.M_PI_2 )
            b = TranslateConst.M_PI_2 - 0.00001;
        else if ( b <= -TranslateConst.M_PI_2 )
            b = -TranslateConst.M_PI_2 + 0.00001;

        if ( (l < 0.) && ((this.AxisMeridian - l) > Math.PI) )
            l += 2. * Math.PI;
        else if ( (this.AxisMeridian < 57. * Math.PI / 180) && (l > 300 * Math.PI / 180) )
            l -= 2. * Math.PI;
        else if ( (this.AxisMeridian > 303. * Math.PI / 180) && (l < 60 * Math.PI / 180) )
            l += 2. * Math.PI;

        const tanf = Math.tan( b );
        const T = tanf * tanf;
        const T2 = T * T;

        const cosf = Math.cos( b );
        const cosf2 = cosf * cosf;
        const sinf = Math.sin( b );
        const sinf2 = sinf * sinf;

        const lC = this.ke2 * cosf2;
        const C2 = lC * lC;
        const A = (l - this.AxisMeridian) * cosf;
        const A2 = A * A;
        const A3 = A2 * A;
        const A4 = A3 * A;
        const A5 = A4 * A;
        const A6 = A5 * A;

        let v = 1. - this.E2 * sinf2;
        if ( v > 0 ) {
            v = this.BigAxis / Math.sqrt( v );
        } else {
            v = this.BigAxis;
        }

        const M = this.BigAxis * (this.kf * b - this.ksin2f * Math.sin( 2. * b ) + this.ksin4f * Math.sin( 4. * b ) - this.ksin6f * Math.sin( 6. * b ));

        y.Value = this.ScaleFactor * v * (A + (1. - T + lC) * A3 / 6. + (5. - 18 * T + T2 + 72. * lC - 58. * this.ke2) * A5 / 120);

        x.Value = this.ScaleFactor * (M - this.kM0 + v * tanf * (A2 / 2. + (5. - T + 9. * lC + 4 * C2) * A4 / 24. +
            (61. - 58. * T + T2 + 600 * lC - 330 * this.ke2) * A6 / 720));

        y.Value += (this.Y0 + this.NumberZone * 1000000);
        x.Value += this.X0;

        if ( this.IsTurnAngle ) {
            const tx = x.Value * this.CosAngle + y.Value * this.SinAngle;
            y.Value = y.Value * this.CosAngle - x.Value * this.SinAngle;
            x.Value = tx;
        }
    }

    /**
     * Вычисление геодезических координат на текущем эллипсоиде
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_TransverseMercator( x: number, y: number, b: TDouble, l: TDouble ) {
        if ( this.IsTurnAngle ) {
            const tx = x * this.CosAngle - y * this.SinAngle;
            y = y * this.CosAngle + x * this.SinAngle;
            x = tx;
        }

        x -= this.X0;
        y -= (this.Y0 + this.NumberZone * 1000000);

        const M1 = this.kM0 + x / this.ScaleFactor;
        const m1 = M1 / (this.BigAxis * this.kf);

        let f1 = m1 + this.ksin2m * Math.sin( 2. * m1 ) + this.ksin4m * Math.sin( 4. * m1 ) + this.ksin6m * Math.sin( 6. * m1 ) + this.ksin8m * Math.sin( 8. * m1 );

        const cosf1 = Math.cos( f1 );
        const cosf12 = cosf1 * cosf1;
        const sinf1 = Math.sin( f1 );
        const sinf12 = sinf1 * sinf1;
        const C1 = this.ke2 * cosf12;
        const C12 = C1 * C1;
        let t = 1. - this.E2 * sinf12;

        if ( t <= 0 ) {
            t = 0.000001;
        }

        const t32 = Math.sqrt( t * t * t );
        const lr1 = this.BigAxis * (1. - this.E2) / t32;
        const v1 = this.BigAxis / Math.sqrt( t );

        if ( f1 >= TranslateConst.M_PI_2 ) {
            f1 = TranslateConst.M_PI_2 - 0.00001;
        } else if ( f1 <= -TranslateConst.M_PI_2 ) {
            f1 = -TranslateConst.M_PI_2 + 0.00001;
        }

        const tanf1 = Math.tan( f1 );
        const T1 = tanf1 * tanf1;
        const T12 = T1 * T1;
        const D = y / (v1 * this.ScaleFactor);
        const D2 = D * D;
        const D3 = D2 * D;
        const D4 = D3 * D;
        const D5 = D4 * D;
        const D6 = D5 * D;

        l.Value = this.AxisMeridian;

        if ( cosf1 != 0 ) {
            let delta = (D - (1. + 2. * T1 + C1) * D3 / 6. + (5. - 2. * C1 + 28. * T1 - 3. * C12 + 8. * this.ke2 + 24 * T12) * D5 / 120) / cosf1;

            if ( delta > TranslateConst.M_PI_2 ) {
                delta = TranslateConst.M_PI_2;
            } else if ( delta < -TranslateConst.M_PI_2 ) {
                delta = -TranslateConst.M_PI_2;
            }

            l.Value += delta;
        }

        b.Value = f1 - (v1 * tanf1 / lr1) * (D2 / 2. - (5. + 3. * T1 + 10 * C1 - 4. * C12 - 9. * this.ke2) * D4 / 24. +
            (61. + 90 * T1 + 298. * C1 + 45. * T12 - 252. * this.ke2 - 3. * C12) * D6 / 720);

        if ( b.Value >= TranslateConst.M_PI_2 )
            b.Value = TranslateConst.M_PI_2 - 0.00001;
        else if ( b.Value <= -TranslateConst.M_PI_2 )
            b.Value = -TranslateConst.M_PI_2 + 0.00001;
    }

    /**
     * Преобразование геодезических координат в геоцентрические
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @param x
     * @param y
     * @param z
     * @returns
     */
    private bl2xyz( b: number, l: number, h: number, x: TDouble, y: TDouble, z: TDouble ): number {
        const sinB = Math.sin( b );
        const cosB = Math.cos( b );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l );
        const cosL = Math.cos( l );

        const MZ = (1.0 - this.E2 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        const v = this.BigAxis / Math.sqrt( MZ );
        x.Value = (v + h) * cosB * cosL;
        y.Value = (v + h) * cosB * sinL;
        z.Value = ((1. - this.E2) * v + h) * sinB;

        return 1;
    }

    /**
     *
     * @param b
     * @param l
     * @param h
     * @param x
     * @param y
     * @param z
     * @returns
     */
    private static bl2xyz_WGS84( b: number, l: number, h: number, x: TDouble, y: TDouble, z: TDouble ): number {
        const sinB = Math.sin( b );
        const cosB = Math.cos( b );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l );
        const cosL = Math.cos( l );

        const MZ = (1.0 - TranslateConst.E2_EARTH_WGS84 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        const v = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );
        x.Value = (v + h) * cosB * cosL;
        y.Value = (v + h) * cosB * sinL;
        z.Value = ((1. - TranslateConst.E2_EARTH_WGS84) * v + h) * sinB;

        return 1;
    }

    /**
     * Преобразование геоцентрических координат в геодезические
     * При ошибке возвращает ноль
     * @param x
     * @param y
     * @param z
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private xyz2bl( x: number, y: number, z: number, b: TDouble, l: TDouble, h: TDouble ): number {
        let vp = x * x + y * y;
        if ( vp < TranslateConst.DOUBLENULL ) {
            let MZ = (1. - this.E2);
            if ( MZ <= TranslateConst.DOUBLENULL ) {
                MZ = 1;
            }
            const v = this.BigAxis / Math.sqrt( MZ );

            if ( z > 0 ) {
                b.Value = Math.PI / 2;
                h.Value = z - MZ * v;
            } else {
                b.Value = -Math.PI / 2;
                h.Value = -z - MZ * v;
            }

            l.Value = 0;
            return 1;
        }

        vp = Math.sqrt( vp );

        const lve = this.E2_2;
        const lvb = this.BigAxis * (1. - this.Alfa);

        const vq = Math.atan( z / (vp * (1. - this.Alfa)) );

        const sinq = Math.sin( vq );
        const sinq_3 = sinq * sinq * sinq;
        const cosq = Math.cos( vq );
        const cosq_3 = cosq * cosq * cosq;
        b.Value = Math.atan( (z + lve * lvb * sinq_3) / (vp - this.E2 * this.BigAxis * cosq_3) );

        l.Value = Math.atan2( y, x );

        const sinB = Math.sin( b.Value );
        const sinB_2 = sinB * sinB;
        const MZ = (1.0 - this.E2 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;
        const v = this.BigAxis / Math.sqrt( MZ );

        h.Value = (vp / Math.cos( b.Value )) - v;
        return 1;
    }

    /**
     * Преобразование геоцентрических координат в геодезические
     * При ошибке возвращает ноль
     * @param X
     * @param Y
     * @param Z
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private static xyz2bl_WGS84( X: number, Y: number, Z: number, b: TDouble, l: TDouble, h: TDouble ): number {
        let vp = X * X + Y * Y;
        if ( vp < TranslateConst.DOUBLENULL ) {
            let MZ = (1. - TranslateConst.E2_EARTH_WGS84);
            if ( MZ <= TranslateConst.DOUBLENULL ) {
                MZ = 1;
            }
            const v = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );

            if ( Z > 0 ) {
                b.Value = Math.PI / 2;
                h.Value = Z - MZ * v;
            } else {
                b.Value = -Math.PI / 2;
                h.Value = -Z - MZ * v;
            }

            l.Value = 0;
            return 1;
        }

        vp = Math.sqrt( vp );

        const lve = TranslateConst.E2_2_EARTH_WGS84;
        const lvb = TranslateConst.A_EARTH_WGS84 * (1. - TranslateConst.ALFA_EARTH_WGS84);

        const vq = Math.atan( Z / (vp * (1. - TranslateConst.ALFA_EARTH_WGS84)) );

        const sinq = Math.sin( vq );
        const sinq_3 = sinq * sinq * sinq;
        const cosq = Math.cos( vq );
        const cosq_3 = cosq * cosq * cosq;
        b.Value = Math.atan( (Z + lve * lvb * sinq_3) / (vp - TranslateConst.E2_EARTH_WGS84 * TranslateConst.A_EARTH_WGS84 * cosq_3) );

        l.Value = Math.atan2( Y, X );

        const sinB = Math.sin( b.Value );
        const sinB_2 = sinB * sinB;
        const MZ = (1.0 - TranslateConst.E2_EARTH_WGS84 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;
        const v = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );

        h.Value = (vp / Math.cos( b.Value )) - v;
        return 1;
    }

    /**
     * Преобразование геоцентрических координат с текущего эллипсоида на заданный эллипсоид
     * При ошибке возвращает ноль
     * @param x
     * @param y
     * @param z
     * @param datum
     */
    private static xyz2xyz( x: TDouble, y: TDouble, z: TDouble, datum: LocalDatumParam ) {
        const rx = datum.RX / TranslateConst.SECONDINRAD;
        const ry = datum.RY / TranslateConst.SECONDINRAD;
        const rz = datum.RZ / TranslateConst.SECONDINRAD;
        const m = 1 + datum.M;

        const newx = m * (x.Value + y.Value * rz - z.Value * ry) + datum.DX;
        const newy = m * (-x.Value * rz + y.Value + z.Value * rx) + datum.DY;
        z.Value = m * (x.Value * ry - y.Value * rx + z.Value) + datum.DZ;

        x.Value = newx;
        y.Value = newy;
    }

    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * на заданный эллипсоид
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @param translate
     * @returns
     */
    private blz2blByTranslate( b: TDouble, l: TDouble, h: TDouble, translate: TTranslate ): number {
        const deltaL: TDouble = { Value: 0 };

        // Параметры эллипсоидов совпадают
        if ( this.checkDatumTranslate( translate, deltaL ) == 0 )
            return 1;

        // Перейти к WGS-84
        this.geoToGeo3dWGS84( b, l, h );

        l.Value += deltaL.Value;

        // Перейти к целевому эллипсоиду
        translate.geoWGS84ToGeo3D( b, l, h );

        return 1;
    }

    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * на заданный эллипсоид
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param translate
     * @returns
     */
    private bl2blByTranslate( b: TDouble, l: TDouble, translate: TTranslate ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsFromWGS842D( b, l );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsFromWGS842D( b, l );

        // Трансформировать к WGS-84 через ПЗ-90.02
        if ( (this.Ellipsoid == EllipsoideKind.KRASOVSKY42) && (this.getDatumCount() == 14) )
            return this.transformationsSGS85FromWGS842D( b, l );

        return 0;
    }

    /**
     * Установить правила преобразования геодезических координат
     * между заданными DATUM
     * Если преобразование не требуется - возвращает ноль
     * @param rule
     * @param target
     * @returns
     */
    private setTranslateRule( rule: TTranslateRule, target: TTranslate ) {
        rule.Source = this;
        rule.Target = target;
        rule.StepOne = 0;
        rule.StepOne2D = 0;
        rule.StepTwo = 0;
        rule.StepTwo2D = 0;
        rule.StepTwo_Back = 0;
        rule.StepTwo2D_Back = 0;
        rule.StepOne_Back = 0;
        rule.StepOne2D_Back = 0;
        rule.DeltaL.Value = 0;

        if ( this.checkDatumTranslate( target, rule.DeltaL ) == 0 )
            return 0;

        if ( this.getDatumCount() == 3 ) {
            rule.StepOne = this.molodenskyTransformationsToWGS84;
            rule.StepOne2D = this.molodenskyTransformationsToWGS842D;
            rule.StepTwo_Back = this.molodenskyTransformationsFromWGS84;
            rule.StepTwo2D_Back = this.molodenskyTransformationsFromWGS842D;
        } else if ( this.getDatumCount() == 7 ) {
            rule.StepOne = this.transformationsToWGS84;
            rule.StepOne2D = this.transformationsToWGS842D;
            rule.StepTwo_Back = this.transformationsFromWGS84;
            rule.StepTwo2D_Back = this.transformationsFromWGS842D;
        }

        if ( target.getDatumCount() == 3 ) {
            rule.StepTwo = target.molodenskyTransformationsFromWGS84;
            rule.StepTwo2D = target.molodenskyTransformationsFromWGS842D;
            rule.StepOne_Back = target.molodenskyTransformationsToWGS84;
            rule.StepOne2D_Back = target.molodenskyTransformationsToWGS842D;
        } else if ( target.getDatumCount() == 7 ) {
            rule.StepTwo = target.transformationsFromWGS84;
            rule.StepTwo2D = target.transformationsFromWGS842D;
            rule.StepOne_Back = target.transformationsToWGS84;
            rule.StepOne2D_Back = target.transformationsToWGS842D;
        }

        return 1;
    }


    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * на эллипсоид WGS-84
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @returns
     */
    private geoToGeoWGS84( b: TDouble, l: TDouble ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsToWGS842D( b, l );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsToWGS842D( b, l );

        return 0;
    }

    /**
     * Преобразование геодезической высоты на текущий эллипсоид
     * с эллипсоида WGS-84
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private geoWGS84HeightToGeo( b: TDouble, l: TDouble, h: TDouble ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsHeightFromWGS84( b, l, h );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsHeightFromWGS84( b, l, h );

        return 0;
    }

    /**
     * Преобразование геодезических координат на текущий эллипсоид
     * с эллипсоида WGS-84
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private geoWGS84ToGeo3D( b: TDouble, l: TDouble, h: TDouble ): number {
        // Пересчет не требуется
        if ( this.getDatumCount() == 0 )
            return 1;

        if ( this.getDatumCount() == 3 )
            return this.molodenskyTransformationsFromWGS84( b, l, h );

        // Трансформирование по 7 параметрам
        if ( this.getDatumCount() == 7 )
            return this.transformationsFromWGS84Ex( b, l, h );

        return 0;
    }


    /**
     * Преобразование высоты на текущий эллипсоид
     * по 3 параметрам способом Молоденского
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private molodenskyTransformationsHeightFromWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        if ( h.Value < -111000 )
            return 0;

        const sinB = Math.sin( b.Value );
        const cosB = Math.cos( b.Value );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l.Value );
        const cosL = Math.cos( l.Value );

        // const M = TranslateConst.A_EARTH_WGS84 * (1.0 - TranslateConst.E2_EARTH_WGS84);
        const MZ = (1.0 - TranslateConst.E2_EARTH_WGS84 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        // M = M / Math.sqrt( MZ * MZ * MZ );

        const nn = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );

        h.Value += -this.Datum.DX * cosB * cosL - this.Datum.DY * cosB * sinL - this.Datum.DZ * sinB + this.DatumDA * TranslateConst.A_EARTH_WGS84 / nn - this.DatumDF * nn * TranslateConst.ALFATO1_EARTH_WGS84 * sinB_2;

        return 1;
    }

    /**
     * Преобразование геодезических координат к текущему эллипсоида
     * по 3 параметрам
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private molodenskyTransformationsToWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        if ( h.Value < -111000 )
            return this.molodenskyTransformationsToWGS842D( b, l );

        const sinB = Math.sin( b.Value );
        const cosB = Math.cos( b.Value );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l.Value );
        const cosL = Math.cos( l.Value );

        let M = this.BigAxis * (1.0 - this.E2);
        const MZ = (1.0 - this.E2 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        M = M / Math.sqrt( MZ * MZ * MZ );

        const nn = this.BigAxis / Math.sqrt( MZ );

        b.Value += (-this.Datum.DX * sinB * cosL - this.Datum.DY * sinB * sinL + this.Datum.DZ * cosB + this.DatumDA * nn * this.E2 * sinB * cosB / this.BigAxis + this.DatumDF * (M / this.AlfaTo1 + nn * this.AlfaTo1) *
            sinB * cosB) / (M + h.Value);                    // (9605 : / M)

        // На полюсе может быть выброс
        if ( (cosB > 0.01) || (cosB < -0.01) )
            l.Value += (-this.Datum.DX * sinL + this.Datum.DY * cosL) / (nn + h.Value) / cosB;     // (9605: / nn)

        h.Value += this.Datum.DX * cosB * cosL + this.Datum.DY * cosB * sinL + this.Datum.DZ * sinB - this.DatumDA * this.BigAxis / nn +
            this.DatumDF * nn * this.AlfaTo1 * sinB_2;

        return 1;
    }

    /**
     * Преобразование геодезических координат к текущему эллипсоида
     * по 2 параметрам
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @returns
     */
    private molodenskyTransformationsToWGS842D( b: TDouble, l: TDouble ): number {
        const sinB = Math.sin( b.Value );
        const cosB = Math.cos( b.Value );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l.Value );
        const cosL = Math.cos( l.Value );

        let M = this.BigAxis * (1.0 - this.E2);
        const MZ = (1.0 - this.E2 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        M = M / Math.sqrt( MZ * MZ * MZ );

        const nn = this.BigAxis / Math.sqrt( MZ );

        b.Value += (-this.Datum.DX * sinB * cosL - this.Datum.DY * sinB * sinL + this.Datum.DZ * cosB + this.DatumDA * nn * this.E2 * sinB * cosB / this.BigAxis + this.DatumDF * (M / this.AlfaTo1 + nn * this.AlfaTo1) *
            sinB * cosB) / M;                    // (9605 : / M)

        // На полюсе может быть выброс
        if ( (cosB > 0.01) || (cosB < -0.01) )
            l.Value += (-this.Datum.DX * sinL + this.Datum.DY * cosL) / nn / cosB;     // (9605: / nn)

        return 1;
    }

    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * по 3 параметрам
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private molodenskyTransformationsFromWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        if ( h.Value < -111000 )
            return this.molodenskyTransformationsFromWGS842D( b, l );

        const sinB = Math.sin( b.Value );
        const cosB = Math.cos( b.Value );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l.Value );
        const cosL = Math.cos( l.Value );

        let M = TranslateConst.A_EARTH_WGS84 * (1.0 - TranslateConst.E2_EARTH_WGS84);
        const MZ = (1.0 - TranslateConst.E2_EARTH_WGS84 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        M = M / Math.sqrt( MZ * MZ * MZ );

        const nn = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );

        b.Value += (this.Datum.DX * sinB * cosL + this.Datum.DY * sinB * sinL - this.Datum.DZ * cosB - this.DatumDA * nn * this.E2 * sinB * cosB / TranslateConst.A_EARTH_WGS84 -
            this.DatumDF * (M / TranslateConst.ALFATO1_EARTH_WGS84 + nn * TranslateConst.ALFATO1_EARTH_WGS84) * sinB * cosB) / (M + h.Value);                    // (9605 : / M)

        // На полюсе может быть выброс
        if ( (cosB > 0.01) || (cosB < -0.01) ) {
            l.Value += (this.Datum.DX * sinL - this.Datum.DY * cosL) / (nn + h.Value) / cosB;     // (9605: / nn)
        }

        h.Value += -this.Datum.DX * cosB * cosL - this.Datum.DY * cosB * sinL - this.Datum.DZ * sinB + this.DatumDA * TranslateConst.A_EARTH_WGS84 / nn -
            this.DatumDF * nn * TranslateConst.ALFATO1_EARTH_WGS84 * sinB_2;

        return 1;
    }

    /**
     * Преобразование геодезических координат с текущего эллипсоида
     * по 2 параметрам
     * При ошибке возвращает ноль
     * @param b
     * @param l
     * @returns
     */
    private molodenskyTransformationsFromWGS842D( b: TDouble, l: TDouble ): number {
        const sinB = Math.sin( b.Value );
        const cosB = Math.cos( b.Value );
        const sinB_2 = sinB * sinB;
        const sinL = Math.sin( l.Value );
        const cosL = Math.cos( l.Value );

        let M = TranslateConst.A_EARTH_WGS84 * (1.0 - TranslateConst.E2_EARTH_WGS84);
        const MZ = (1.0 - TranslateConst.E2_EARTH_WGS84 * sinB_2);
        if ( MZ < TranslateConst.DOUBLENULL )
            return 0;

        M = M / Math.sqrt( MZ * MZ * MZ );

        const nn = TranslateConst.A_EARTH_WGS84 / Math.sqrt( MZ );

        b.Value += (this.Datum.DX * sinB * cosL + this.Datum.DY * sinB * sinL - this.Datum.DZ * cosB - this.DatumDA * nn * this.E2 * sinB * cosB / TranslateConst.A_EARTH_WGS84 -
            this.DatumDF * (M / TranslateConst.ALFATO1_EARTH_WGS84 + nn * TranslateConst.ALFATO1_EARTH_WGS84) * sinB * cosB) / M;                    // (9605 : / M)

        // На полюсе может быть выброс
        if ( (cosB > 0.01) || (cosB < -0.01) )
            l.Value += (this.Datum.DX * sinL - this.Datum.DY * cosL) / nn / cosB;     // (9605: / nn)

        return 1;
    }


    /**
     * Перевод геодезических координат из одной системы в другую
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * point - точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @param eaxis
     * @param ealfa
     * @returns
     */
    private transformationsToEllipsoid( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam, eaxis: number, ealfa: number ): number {
        let isfreeh = 0;
        const saveh = h.Value;
        if ( h.Value < -111000 ) {
            h.Value = 0;
            isfreeh = 1;
        }

        const la1 = this.BigAxis;
        const la2 = eaxis;
        const alfa1 = this.Alfa;
        const alfa2 = ealfa;
        const dx = datum.DX;
        const dy = datum.DY;
        const dz = datum.DZ;
        const wx = datum.RX;
        const wy = datum.RY;
        const wz = datum.RZ;
        const mm = datum.M;

        let lflag = 0;
        if ( l.Value < 0. ) {
            l.Value += TranslateConst.PI2;
            lflag = 1;
        }

        const e12 = (2. * alfa1) - (alfa1 * alfa1);
        const e22 = (2. * alfa2) - (alfa2 * alfa2);
        const da = la2 - la1;
        const de2 = e22 - e12;
        const as = (la2 + la1) / 2.;
        const es = (e12 + e22) / 2.;
        const w1 = 1.0 - es;

        const Sinb = Math.sin( b.Value );
        const Cosb = Math.cos( b.Value );
        const Sinl = Math.sin( l.Value );
        const Cosl = Math.cos( l.Value );
        const Cos2b = Math.cos( 2. * b.Value );

        const w2 = 1.0 - es * Sinb * Sinb;
        const m = as * w1 * (Math.pow( w2, -1.5 ));

        const n = as * (Math.pow( w2, -0.5 ));
        if ( n == 0 )
            return 0;

        let dbsec = ((n * da * es * Sinb * Cosb / as + (n * n / as / as + 1.) * n * de2 * Sinb * Cosb / 2. - dx * Sinb * Cosl - dy * Sinb * Sinl + dz * Cosb) * TranslateConst.PCONST_03) / (m + h.Value);
        const d6 = es * mm * Sinb * Cosb * TranslateConst.PCONST_03 + (wx * Sinl - wy * Cosl) * (1. + es * Cos2b);
        dbsec -= d6;

        const mpi64 = Math.PI / 648000.0;  //648000 = 180*60*60(секунды)

        let dlsec;

        // На полюсе может быть выброс
        if ( (Cosb > 0.0001) || (Cosb < -0.0001) )
            dlsec = ((dy * Cosl - dx * Sinl) * TranslateConst.PCONST_03) / ((n + h.Value) * Cosb) + Math.tan( b.Value ) * (1. - es) * (wx * Cosl + wy * Sinl) - wz;
        else
            dlsec = -wz;

        b.Value += dbsec * mpi64;
        l.Value += dlsec * mpi64;

        if ( isfreeh == 0 ) {
            const dh = -as * da / n + n * de2 * Sinb * Sinb / 2. + (dx * Cosl + dy * Sinl) * Cosb + dz * Sinb - n * es * Sinb * Cosb * (wx * Sinl - wy * Cosl) / TranslateConst.PCONST_03 +
                (as * as / n + h.Value) * mm;

            h.Value += dh;
        } else
            h.Value = saveh;

        if ( lflag != 0 )
            l.Value -= TranslateConst.PI2;

        return 1;
    }

    /**
     * Перевод геодезических координат из одной системы в другую
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * point - точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @param ellparam
     * @returns
     */
    private transformationsToEllipsoidEx( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam, ellparam: EllipsoidParam ): number {
        return this.transformationsToEllipsoid( b, l, h, datum, ellparam.SemiMajorAxis, ellparam.InverseFlattening );
    }

    /**
     * Перевод геодезических координат из одной системы в WGS-84
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * point - точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @returns
     */
    private transformationsToWGS84( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam ): number {
        if ( this.IsGeoShift ) {
            let isfreeh = 0;
            const saveh = h.Value;
            if ( h.Value < -111000 ) {
                h.Value = 0;
                isfreeh = 1;
            }

            // Дает такой же результат, как и Хельмерт
            const X: TDouble = { Value: 0 };
            const Y: TDouble = { Value: 0 };
            const Z: TDouble = { Value: 0 };

            if ( this.bl2xyz( b.Value, l.Value, h.Value, X, Y, Z ) != 0 ) {
                X.Value += datum.DX;
                Y.Value += datum.DY;
                Z.Value += datum.DZ;

                const ret = TTranslate.xyz2bl_WGS84( X.Value, Y.Value, Z.Value, b, l, h );

                if ( isfreeh )
                    h.Value = saveh;

                return ret;
            }
        }

        return this.transformationsToEllipsoid( b, l, h, datum, TranslateConst.A_EARTH_WGS84, TranslateConst.ALFA_EARTH_WGS84 );
    }

    /**
     * Перевод геодезических координат из одной системы в WGS-84
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private transformationsToWGS84Ex( b: TDouble, l: TDouble, h: TDouble ): number {
        return this.transformationsToWGS84( b, l, h, this.Datum );
    }

    /**
     * Перевод геодезических координат из одной системы в WGS-84
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @returns
     */
    private transformationsToWGS842D( b: TDouble, l: TDouble ): number {
        const h: TDouble = { Value: -111111 };
        return this.transformationsToWGS84Ex( b, l, h );
    }

    /**
     * Перевод геодезических координат из СК42/95 в WGS-84
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private transformationsSGS85ToWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        const datum = TranslateFactory.createDatumParam();
        datum.Count = 7;

        if ( (Math.abs( this.Datum.DX - TranslateConst.DX_S42_SGS85 ) < 0.005) && (Math.abs( this.Datum.DY - TranslateConst.DY_S42_SGS85 ) < 0.005) ) {
            datum.DX = TranslateConst.DX_S42_WGS84;      // Pulkovo 42
            datum.DY = TranslateConst.DY_S42_WGS84;
            datum.DZ = TranslateConst.DZ_S42_WGS84;
            datum.RX = TranslateConst.RX_S42_WGS84;
            datum.RY = TranslateConst.RY_S42_WGS84;
            datum.RZ = TranslateConst.RZ_S42_WGS84;
            datum.M = TranslateConst.M_S42_WGS84;
        } else {
            datum.DX = TranslateConst.DX_S95_WGS84;      // Pulkovo 95
            datum.DY = TranslateConst.DY_S95_WGS84;
            datum.DZ = TranslateConst.DZ_S95_WGS84;
            datum.RX = TranslateConst.RX_S95_WGS84;
            datum.RY = TranslateConst.RY_S95_WGS84;
            datum.RZ = TranslateConst.RZ_S95_WGS84;
            datum.M = TranslateConst.M_S95_WGS84;
        }

        return this.transformationsToWGS84( b, l, h, datum );
    }

    /**
     * Перевод геодезических координат из СК42/95 в WGS-84
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @returns
     */
    private transformationsSGS85ToWGS842D( b: TDouble, l: TDouble ): number {
        const h: TDouble = { Value: -111111. };
        return this.transformationsSGS85ToWGS84( b, l, h );
    }

    /**
     * Перевод высоты с заданного эллипсоида на текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @param eaxis
     * @param ealfa
     * @returns
     */
    private transformationsFromEllipsoid( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam, eaxis: number, ealfa: number ): number {
        let isfreeh = 0;
        const saveh = h.Value;
        if ( h.Value < -111000 ) {
            h.Value = 0;
            isfreeh = 1;
        }

        const la1 = eaxis;
        const la2 = this.BigAxis;
        const alfa1 = ealfa;
        const alfa2 = this.Alfa;
        const dx = -datum.DX;
        const dy = -datum.DY;
        const dz = -datum.DZ;
        const wx = -datum.RX;
        const wy = -datum.RY;
        const wz = -datum.RZ;
        const mm = -datum.M;

        let lflag = 0;
        if ( l.Value < 0. ) {
            l.Value += TranslateConst.PI2;
            lflag = 1;
        }

        const e12 = (2. * alfa1) - (alfa1 * alfa1);
        const e22 = (2. * alfa2) - (alfa2 * alfa2);
        const da = la2 - la1;
        const de2 = e22 - e12;
        const as = (la2 + la1) / 2.;
        const es = (e12 + e22) / 2.;
        const w1 = 1.0 - es;

        const Sinb = Math.sin( b.Value );
        const Cosb = Math.cos( b.Value );
        const Sinl = Math.sin( l.Value );
        const Cosl = Math.cos( l.Value );
        const Cos2b = Math.cos( 2. * b.Value );

        const w2 = 1.0 - es * Sinb * Sinb;
        const m = as * w1 * (Math.pow( w2, -1.5 ));
        const n = as * (Math.pow( w2, -0.5 ));
        if ( n == 0 )
            return 0;

        const dbsec = ((n * da * es * Sinb * Cosb / as + (n * n / as / as + 1.) * n * de2 * Sinb * Cosb / 2.
                - dx * Sinb * Cosl - dy * Sinb * Sinl + dz * Cosb) * TranslateConst.PCONST_03) / (m + h.Value) -
            es * mm * Sinb * Cosb * TranslateConst.PCONST_03 - (wx * Sinl - wy * Cosl) * (1. + es * Cos2b);

        const mpi64 = Math.PI / 648000.0;  //648000 = 180*60*60(секунды)

        let dlsec;

        // На полюсе может быть выброс
        if ( (Cosb > 0.0001) || (Cosb < -0.0001) ) {
            dlsec = ((dy * Cosl - dx * Sinl) * TranslateConst.PCONST_03) / ((n + h.Value) * Cosb) + Math.tan( b.Value ) * (1. - es) * (wx * Cosl + wy * Sinl) - wz;
        } else
            dlsec = -wz;

        b.Value += dbsec * mpi64;
        l.Value += dlsec * mpi64;

        if ( isfreeh == 0 ) {
            const dh = -as * da / n + n * de2 * Sinb * Sinb / 2. + (dx * Cosl + dy * Sinl) * Cosb + dz * Sinb - n * es * Sinb * Cosb * (wx * Sinl - wy * Cosl) / TranslateConst.PCONST_03 +
                (as * as / n + h.Value) * mm;

            h.Value += dh;
        } else
            h.Value = saveh;

        if ( lflag != 0 )
            l.Value -= TranslateConst.PI2;

        return 1;
    }

    /**
     * Перевод высоты с заданного эллипсоида на текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @param ellparam
     * @returns
     */
    private transformationsFromEllipsoidEx( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam, ellparam: EllipsoidParam ): number {
        return this.transformationsFromEllipsoid( b, l, h, datum, ellparam.SemiMajorAxis, ellparam.InverseFlattening );
    }

    /**
     * Перевод высоты из WGS-84 на текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private transformationsHeightFromWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        return this.transformationsFromEllipsoid( b, l, h, this.Datum, TranslateConst.A_EARTH_WGS84, TranslateConst.ALFA_EARTH_WGS84 );
    }

    /**
     * Перевод геодезических координат из WGS-84 в текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @param datum
     * @returns
     */
    private transformationsFromWGS84( b: TDouble, l: TDouble, h: TDouble, datum: LocalDatumParam ): number {
        if ( this.IsGeoShift ) {
            let isfreeh = 0;
            const saveh = h.Value;
            if ( h.Value < -111000 ) {
                h.Value = 0;
                isfreeh = 1;
            }

            const X: TDouble = { Value: 0 };
            const Y: TDouble = { Value: 0 };
            const Z: TDouble = { Value: 0 };
            if ( TTranslate.bl2xyz_WGS84( b.Value, l.Value, h.Value, X, Y, Z ) != 0 ) {
                X.Value -= datum.DX;
                Y.Value -= datum.DY;
                Z.Value -= datum.DZ;

                const ret = this.xyz2bl( X.Value, Y.Value, Z.Value, b, l, h );

                if ( isfreeh )
                    h.Value = saveh;

                return ret;
            }
        }

        return this.transformationsFromEllipsoid( b, l, h, datum, TranslateConst.A_EARTH_WGS84, TranslateConst.ALFA_EARTH_WGS84 );
    }

    /**
     * Перевод геодезических координат из WGS-84 в текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private transformationsFromWGS84Ex( b: TDouble, l: TDouble, h: TDouble ): number {
        return this.transformationsFromWGS84( b, l, h, this.Datum );
    }

    /**
     * Перевод геодезических координат из WGS-84 в текущий эллипсоид
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @returns
     */
    private transformationsFromWGS842D( b: TDouble, l: TDouble ): number {
        const h: TDouble = { Value: -111111. };
        return this.transformationsFromWGS84Ex( b, l, h );
    }

    /**
     * Перевод геодезических координат из WGS-84 в СК42/95
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * point - точка в радианах
     * @param b
     * @param l
     * @param h
     * @returns
     */
    private transformationsSGS85FromWGS84( b: TDouble, l: TDouble, h: TDouble ): number {
        const datum = TranslateFactory.createDatumParam();
        datum.Count = 7;

        if ( (Math.abs( this.Datum.DX - TranslateConst.DX_S42_SGS85 ) < 0.005) && (Math.abs( this.Datum.DY - TranslateConst.DY_S42_SGS85 ) < 0.005) ) {
            datum.DX = TranslateConst.DX_S42_WGS84;      // Pulkovo 42
            datum.DY = TranslateConst.DY_S42_WGS84;
            datum.DZ = TranslateConst.DZ_S42_WGS84;
            datum.RX = TranslateConst.RX_S42_WGS84;
            datum.RY = TranslateConst.RY_S42_WGS84;
            datum.RZ = TranslateConst.RZ_S42_WGS84;
            datum.M = TranslateConst.M_S42_WGS84;
        } else {
            datum.DX = TranslateConst.DX_S95_WGS84;      // Pulkovo 95
            datum.DY = TranslateConst.DY_S95_WGS84;
            datum.DZ = TranslateConst.DZ_S95_WGS84;
            datum.RX = TranslateConst.RX_S95_WGS84;
            datum.RY = TranslateConst.RY_S95_WGS84;
            datum.RZ = TranslateConst.RZ_S95_WGS84;
            datum.M = TranslateConst.M_S95_WGS84;
        }

        return this.transformationsFromWGS84( b, l, h, datum );
    }

    /**
     * Перевод геодезических координат из WGS-84 в СК42/95
     * Формулы соответствуют ГОСТ Р 51794-2001
     * Точность 0.3 м
     * точка в радианах
     * @param b
     * @param l
     * @returns
     */
    private transformationsSGS85FromWGS842D( b: TDouble, l: TDouble ): number {
        const h: TDouble = { Value: -111111. };
        return this.transformationsSGS85FromWGS84( b, l, h );
    }

    /**
     * Запросить параметры Datum
     * @returns
     */
    private getDatumDX(): number {
        return this.Datum.DX;
    }

    /**
     * Запросить параметры Datum
     * @returns
     */
    private getDatumDY(): number {
        return this.Datum.DY;
    }

    /**
     * Запросить параметры Datum
     * @returns
     */
    private getDatumDZ(): number {
        return this.Datum.DZ;
    }

    /**
     * Запросить кол-во параметров пересчета
     * @returns
     */
    private getDatumCount(): number {
        return this.Datum.Count;
    }

    /**
     * Запросить - нужен ли пересчет геодезических координат из-за
     * различия Datum
     * @param target
     * @param deltaL
     * @returns
     */
    private checkDatumTranslate( target: TTranslate, deltaL: TDouble ): number {
        deltaL.Value = 0;

        if ( this.AxisMeridian < target.AxisMeridian ) {
            if ( (target.AxisMeridian - this.AxisMeridian) > Math.PI ) {
                // Далеко на западе - сместить на восток
                deltaL.Value = 2 * Math.PI;
            }
        } else if ( (this.AxisMeridian - target.AxisMeridian) > Math.PI ) {
            // Далеко на востоке - сместить на запад
            deltaL.Value = -(2 * Math.PI);
        }

        if ( (this.getDatumCount() == 0) && (target.getDatumCount() == 0) ) {
            // Пересчет не требуется
            return 0;
        }

        if ( (target.getEllipsoid() == this.getEllipsoid()) && (target.getDatumCount() == this.getDatumCount()) ) {
            let delta = Math.floor( target.getDatumDX() - this.getDatumDX() );
            if ( delta != 0 )
                return 1;

            delta = Math.floor( target.getDatumDY() - this.getDatumDY() );
            if ( delta != 0 )
                return 1;

            delta = Math.floor( target.getDatumDZ() - this.getDatumDZ() );
            if ( delta == 0 ) {
                // Параметры эллипсоидов совпадают
                return 0;
            }
        }

        return 1;
    }

    /**
     * Запрос проекции исходного материала и справочных данных по
     * проекции исходного материала
     * При ошибке возвращает ноль
     * @param mapreg
     * @param datum
     * @param ellipsoid
     * @param ttype
     * @param tparm
     * @returns
     */
    private getProjectionEx( mapreg?: MapRegisterEx, datum?: DatumParam, ellipsoid?: EllipsoidParam, ttype?: TDouble, tparm?: LocalTransform ): number {
        if ( mapreg ) {
            mapreg.MapType = this.MapType;
            mapreg.CoordinateSystem = this.CoordinateSystem;
            mapreg.MaterialProjection = this.ProjectionType;
            mapreg.ZoneNumber = this.NumberZone;
            mapreg.ZoneIdent = this.ZoneIdent;
            mapreg.EllipsoideKind = this.Ellipsoid;

            mapreg.FirstMainParallel = this.FirstMainParallel;
            mapreg.SecondMainParallel = this.SecondMainParallel;
            mapreg.AxisMeridian = this.AxisMeridian;

            if ( this.CoordinateSystem != COORDINATESYSTEM.SYSTEM_63 )
                mapreg.MainPointParallel = this.MainPointParallel;
            else
                mapreg.MainPointParallel = this.Y0 / 100000;                                 // 14/02/21

            mapreg.PoleLatitude = this.PoleLatitude;
            mapreg.PoleLongitude = this.PoleLongitude;
            mapreg.FalseEasting = this.FalseEast;
            mapreg.FalseNorthing = this.FalseNorth;
            mapreg.ScaleFactor = this.ScaleFactor;
            mapreg.TurnAngle = this.TurnAngle;
            mapreg.HeightSystem = this.HeightSystem;
            mapreg.EPSGCode = this.EpsgCode;
        }

        if ( datum )
            this.getDatum( datum );

        if ( ellipsoid )
            this.getEllipsoidParam( ellipsoid );

        if ( ttype && tparm )
            ttype.Value = this.getLocalTransformationParm( tparm );

        return 1;
    }

    /**
     * Установить Datum
     * @param datum
     */
    private setDatum( datum: DatumParam ) {
        if ( (datum.Count != 0) && (datum.Count != 3) && (datum.Count != 7) && (datum.Count != 14) )
            return;

        this.Datum = datum;

        this.IsGeoShift = 0;
        if ( (this.Datum.Count == 7) && (this.Datum.RX == 0) && (this.Datum.RY == 0) && (this.Datum.RZ == 0) && (this.Datum.M == 0) ) {
            this.IsGeoShift = 1;
            if ( (this.Datum.DX == 0) && (this.Datum.DY == 0) && (this.Datum.DZ == 0) )
                this.Datum.Count = 0;
        }
    }

    /**
     * Установить Datum из 3-х параметров
     * @param dx
     * @param dy
     * @param dz
     */
    private setDatumEx( dx: TDouble, dy: TDouble, dz: TDouble ) {
        this.Datum.Count = 3;
        this.Datum.DX = dx.Value;
        this.Datum.DY = dy.Value;
        this.Datum.DZ = dz.Value;
        this.Datum.RX = 0;
        this.Datum.RY = 0;
        this.Datum.RZ = 0;
        this.Datum.M = 0;

        this.DatumDA = this.BigAxis - TranslateConst.A_EARTH_WGS84;
        this.DatumDF = this.Alfa - TranslateConst.ALFA_EARTH_WGS84;

        if ( (this.Datum.DX == 0) && (this.Datum.DY == 0) && (this.Datum.DZ == 0) )
            this.Datum.Count = 0;
    }

    /**
     * Запросить датум
     * @param datum
     */
    private getDatum( datum: DatumParam ) {
        // datum = this.Datum;//fixme: не сработает!
    }

    /**
     * Запросить параметры эллипсойда
     * @param ellipsoid
     */
    private getEllipsoidParam( ellipsoid: EllipsoidParam ) {
        ellipsoid.SemiMajorAxis = this.BigAxis;
        ellipsoid.InverseFlattening = this.Alfa;
    }

    /**
     * Инициализация системы WGS84 и проекции UTM
     */
    private initUTMforWGS84() {
        this.FalseNorth = 0.0;
        this.FalseEast = 500000.0;
        this.initUTM( EllipsoideKind.WGS_84 );

        // Подготовка констант
        this.initTransverseMercator();

        this.MapType = MAPTYPE.UTMTYPE;
    }

    /**
     * Обнулить переменные
     */
    private init() {
        this.LocalSystem = 0;
        this.Datum.Count = 0;
        this.ZoneIdent = 0;

        this.AxisMeridian = 0;
        this.FalseEast = 0;
        this.FalseNorth = 0;
        this.ScaleFactor = 1;
        this.NumberZone = 0;

        this.FirstMainParallel = 0;
        this.SecondMainParallel = 0;
        this.MainPointParallel = 0;
        this.PoleLatitude = 0;
        this.PoleLongitude = 0;
        this.TurnAngle = 0;

        this.X0 = 0;
        this.Y0 = 0;
        this.E2 = 0;
        this.E2_2 = 0;
        this.BigAxis = 0;
        this.ExcentricMeridian = 0;
        this.Alfa = 0;
        this.AlfaTo1 = 1;
        this.MiddleRadius = 0;

        this.DL = 6;
        this.DLradian = (this.DL * Math.PI) / 180;
        this.L1 = 3;
        this.L1radian = this.L1 / 180 * Math.PI;

        this.IsTurnAngle = 0;       // Признак разворота осей
        this.CosAngle = 1;
        this.SinAngle = 0;
        this.CrsType = 0;
        this.IsGeoShift = 0;

        this.TransformType = 0;
        this.EpsgCode = 0;
    }

    /**
     * Инициализация системы XXX и проекции UTM на эллипсоиде XXX
     * @param ellipsoid
     */
    private initUTM( ellipsoid: EllipsoideKind ) {
        this.X0 = this.FalseNorth;
        this.Y0 = this.FalseEast;

        this.ScaleFactor = 0.9996;
        this.L1 = 183.;
        this.L1radian = (this.L1) * Math.PI / 180;
        this.DL = 6.;
        this.DLradian = (this.DL) * Math.PI / 180;
        this.ProjectionType = MAPPROJECTION.UTM;

        if ( ellipsoid != 0 )
            this.initEllipsoid( ellipsoid );
    }

    /**
     * Инициализация системы 42 года в проекции ГК
     * @param ellipsoid
     */
    private initGKfor42( ellipsoid = EllipsoideKind.KRASOVSKY42 ) {
        this.X0 = 0.0;
        this.Y0 = 500000.0;
        this.ScaleFactor = 1;
        this.L1 = 3.;
        this.L1radian = (this.L1) * Math.PI / 180;
        this.DL = 6.;
        this.DLradian = (this.DL) * Math.PI / 180;

        if ( ellipsoid != 0 )
            this.initEllipsoid( ellipsoid );
    }

    /**
     * Инициализация системы 63 года в проекции ГК
     * @param ellipsoid
     */
    private initCK63( ellipsoid = EllipsoideKind.KRASOVSKY42 ) {
        this.X0 = -this.PoleLongitude * 10000;
        this.Y0 = this.MainPointParallel * 100000;
        this.ScaleFactor = 1;
        this.L1radian = this.FirstMainParallel;
        this.L1 = this.L1radian * 180 / Math.PI;
        this.DLradian = this.SecondMainParallel;
        this.DL = this.DLradian * 180 / Math.PI;

        if ( ellipsoid != 0 )
            this.initEllipsoid( ellipsoid );
    }

    /**
     * Заполнить параметры МСК-63 для зоны
     * @param ellipsoid
     */
    private initMCK63ByZone( ellipsoid = EllipsoideKind.KRASOVSKY42 ) {
        let i = this.ZoneIdent;
        if ( i > 0x60 )
            i -= 0x60;
        else
            i -= 0x40;

        if ( (i > 26) || (i < 1) )
            i = 16;

        this.X0 = -TranslateConst.FalseX[ i ];
        this.Y0 = TranslateConst.FalseY[ i ];

        this.AxisMeridian = (TranslateConst.GradMsk[ i ] + TranslateConst.MinMsk[ i ] / 60.0) * Math.PI / 180;

        this.ScaleFactor = 1;
        this.L1radian = this.AxisMeridian;
        this.L1 = this.L1radian * 180 / Math.PI;

        this.DL = TranslateConst.WidthMsk[ i ];
        this.DLradian = (this.DL) / 180 * Math.PI;

        if ( ellipsoid != 0 )
            this.initEllipsoid( ellipsoid );

        if ( this.NumberZone > 1 )
            this.AxisMeridian += (this.NumberZone - 1) * this.DLradian;
    }

    /**
     * Инициализация параметров эллипсоида
     * @param ellipsoid
     * @param datum
     * @param ellparam
     */
    private initEllipsoid( ellipsoid: EllipsoideKind, datum?: DatumParam, ellparam?: EllipsoidParam ) {
        if ( (ellipsoid == EllipsoideKind.USERELLIPSOID) && (ellparam) && (ellparam.SemiMajorAxis > 0) && (ellparam.InverseFlattening >= 0) ) {
            this.BigAxis = ellparam.SemiMajorAxis;
            this.Alfa = ellparam.InverseFlattening;
        } else {
            if ( (ellipsoid <= 0) || (ellipsoid > EllipsoideKind.ELLIPSOIDCOUNT) )
                ellipsoid = EllipsoideKind.WGS_84;

            this.BigAxis = Spheroids[ ellipsoid ].SemiMajorAxis;
            this.Alfa = Spheroids[ ellipsoid ].InverseFlattening;
        }

        this.Ellipsoid = ellipsoid;

        this.AlfaTo1 = 1.0 - this.Alfa;

        this.E2 = 2. * this.Alfa - this.Alfa * this.Alfa;
        if ( this.E2 > 0 )
            this.ExcentricMeridian = Math.sqrt( this.E2 );
        else
            this.ExcentricMeridian = 0;

        this.E2_2 = this.E2 / (1. - this.E2);

        this.MiddleRadius = this.BigAxis * (1. - this.Alfa / 2.);

        if ( datum )
            this.setDatum( datum );

        if ( (!datum) || (!datum.Count) ) {
            if ( (this.MapType == WORKTYPE.MCK_CK42) || (this.MapType == MAPTYPE.MCK_CK63) || (this.MapType == WORKTYPE.MCK_CK95) ) {
                // Заполнение коэффициентов пересчета по умолчанию
                TranslateFactory.createDefaultDatumParam( this.Ellipsoid, this.CoordinateSystem, this.Datum );
            } else if ( (this.MapType == MAPTYPE.VN_2000) || (this.MapType == MAPTYPE.VN_2000_TM3) ) {
                // Заполнение коэффициентов пересчета по умолчанию
                this.Datum.DX = TranslateConst.DX_VN2000_WGS84;
                this.Datum.DY = TranslateConst.DY_VN2000_WGS84;
                this.Datum.DZ = TranslateConst.DZ_VN2000_WGS84;
                this.Datum.RX = TranslateConst.RX_VN2000_WGS84;
                this.Datum.RY = TranslateConst.RY_VN2000_WGS84;
                this.Datum.RZ = TranslateConst.RZ_VN2000_WGS84;
                this.Datum.M = TranslateConst.M_VN2000_WGS84;
            }
        }
    }

    /**
     * Вычисление радиуса кривизны первого вертикала широты b (четная)
     * @param b
     * @returns
     */
    private firstVerticalCurvatureRadius( b: number ): number {
        const sinb = Math.sin( b );
        return (this.BigAxis / Math.sqrt( 1 - this.E2 * sinb * sinb ));
    }

    /**
     * Вычисление радиуса кривизны меридиана широты b (MeridianCurvatureRadius четная)
     * @param b
     * @returns
     */
    private meridianCurvatureRadius( b: number ): number {
        const sinb = Math.sin( b );
        return (this.BigAxis * (1. - this.E2) / Math.pow( 1. - this.E2 * sinb * sinb, 1.5 ));
    }

    /**
     * Вычисление изометрической широты b
     * -90 до +90 возрастает
     * @param b
     * @returns
     */
    private isometricLatitude( b: number ): number {
        const temp = this.ExcentricMeridian * Math.sin( b );
        return (Math.tan( TranslateConst.M_PI_4 - b / 2.0 ) / Math.pow( (1 - temp) / (1 + temp), this.ExcentricMeridian / 2.0 ));
    }

    /**
     * Вычисление радиуса кривизны параллели широты b на единичном шаре
     * @param b
     * @returns
     */
    private parallelCurvatureRadius( b: number ): number {
        let temp = Math.sin( b );
        temp = 1.0 - this.E2 * temp * temp;
        if ( temp > 0 )
            return Math.cos( b ) / Math.sqrt( temp );

        return 1.0;
    }

    /**
     * Вычисление длины дуги от экватора до широты b
     * @param b
     * @returns
     */
    private arcLength( b: number ): number {
        return this.BigAxis * (1. - this.E2) * ((1. + 3. / 4. * this.E2) * b - 3. / 4. * this.E2 * Math.sin( b ) * Math.cos( b ));
    }

    /**
     * Вычисление площади трапеций от экватора до широты b (1 радиан шириной)
     * @param b
     * @returns
     */
    private trapeziumAreaOne( b: number ): number {
        const sinb = Math.sin( b );

        // Сфероидическая трапеция шириной 1 радиан - Учебник Мат. Картография
        if ( this.ExcentricMeridian != 0 )
            return b * b * 0.5 * (sinb / (1. - this.E2 * sinb * sinb) + 0.5 / this.ExcentricMeridian * Math.log( (1. + this.ExcentricMeridian * sinb) / (1. - this.ExcentricMeridian * sinb) ));
        else
            return b * b * 0.5 * sinb;
    }

    /**
     * Подготовка констант TransverseMercator USGS formulas  EPSG:9807
     */
    private initTransverseMercator() {
        const E4 = this.E2 * this.E2;
        const E6 = E4 * this.E2;

        this.kf = 1. - this.E2 / 4. - 3. * E4 / 64. - 5. * E6 / 256.;
        this.ksin2f = 3. * this.E2 / 8. + 3. * E4 / 32. + 45. * E6 / 1024.;
        this.ksin4f = 15. * E4 / 256. + 45. * E6 / 1024.;
        this.ksin6f = 35. * E6 / 3072;

        this.kM0 = 0;
        if ( this.MainPointParallel != 0 )
            this.kM0 = this.BigAxis * (this.kf * this.MainPointParallel - this.ksin2f * Math.sin( 2. * this.MainPointParallel ) +
                this.ksin4f * Math.sin( 4. * this.MainPointParallel ) - this.ksin6f * Math.sin( 6. * this.MainPointParallel ));

        this.ke2 = this.E2 / (1. - this.E2);
        let se = 1. - this.E2;
        if ( se > 0 ) {
            se = Math.sqrt( se );
        } else {
            se = 0;
        }

        this.ke1 = (1. - se) / (1. + se);
        const ke12 = this.ke1 * this.ke1;
        const ke13 = ke12 * this.ke1;
        const ke14 = ke13 * this.ke1;
        this.ksin2m = (3. * this.ke1 / 2. - 27. * ke13 / 32.);
        this.ksin4m = (21. * ke12 / 16. - 55. * ke14 / 32.);
        this.ksin6m = 151. * ke13 / 96.;
        this.ksin8m = 1097. * ke14 / 512.;
    }

    /**
     * Цилиндрическая прямая равноугольная Меркатора EPSG:3395
     */
    private initMercatorProjection() {
        if ( this.ExcentricMeridian == 0 ) {
            // Проекция на шаре
            this.va = 0;
            this.vb = 0;
            this.vc = 0;
            this.vd = 0;
        } else {
            const E4 = this.E2 * this.E2;
            const E6 = E4 * this.E2;
            const E8 = E6 * this.E2;

            this.va = this.E2 / 2. + E4 * 5. / 24. + E6 / 12 + E8 * 13. / 360;
            this.vb = E4 * 7. / 48. + E6 * 29. / 240 + E8 * 811. / 11520;
            this.vc = E6 * 7. / 120 + E8 * 81. / 1120;
            this.vd = E8 * 4279. / 161280;
        }

        if ( (this.ScaleFactor < 0.5) || (this.ScaleFactor > 2) )
            this.ScaleFactor = 1.;

        this.ve = this.ScaleFactor * this.BigAxis;
    }

    /**
     * Вычисление геодезических координат B,L по прямоугольным координатам X,Y
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_MercatorProjection( x: number, y: number, b: TDouble, l: TDouble ) {
        l.Value = (y - this.FalseEast) / this.ve + this.AxisMeridian;
        const ksi = Math.PI / 2.0 - 2.0 * Math.atan( Math.exp( -(x - this.FalseNorth) / this.ve ) );
        b.Value = ksi + this.va * Math.sin( 2. * ksi ) + this.vb * Math.sin( 4. * ksi ) + this.vc * Math.sin( 6 * ksi ) + this.vd * Math.sin( 8 * ksi );
    }


    /**
     * Вычисление прямоугольных координат X,Y по геодезическим координатам B,L
     * в проекции Цилиндрическая прямая равноугольная Меркатора на шаре
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_MercatorProjection( b: number, l: number, x: TDouble, y: TDouble ) {
        let flag = 0;
        // Перевод геодезических координат точки в прямоугольные координаты
        if ( b < (this.MainPointParallel) ) {
            b = -b;
            flag = 1;
        }

        const esinb = this.ExcentricMeridian * Math.sin( b );
        let temp = (1. - esinb) / (1 + esinb);
        const e = this.ExcentricMeridian / 2.;
        temp = Math.pow( temp, e );
        temp = Math.tan( Math.PI / 4. + b / 2. ) * temp;

        if ( (temp < 0.000001) && (temp > -0.000001) )
            temp = 0.000001;

        x.Value = this.ve * Math.log( temp );        // Натуральный логарифм

        if ( flag != 0 )
            x.Value = -x.Value;

        x.Value += this.FalseNorth;
        y.Value = this.ve * (l - this.AxisMeridian) + this.FalseEast;
    }

    /**
     * Вычисление геодезических координат точки B,L по координатам
     * точки X,Y в цилиндрической специальной проекции ("бланковка")
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private static xy2bl_BLANK( x: number, y: number, b: TDouble, l: TDouble ) {
        b.Value = (x - 8000000) * Math.PI / 24000000;
        l.Value = (y - 16000000 * 168. / 180) * Math.PI / 16000000;
    }

    /**
     * Вычисление координат X,Y точки по геодезическим координатам
     * точки B,L в цилиндрической специальной проекции ("бланковка")
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private static bl2xy_BLANK( b: number, l: number, x: TDouble, y: TDouble ) {
        // Контроль входных данных
        if ( l < -270 / 180 * Math.PI )
            l = l + 2. * Math.PI;
        if ( l > 270 / 180 * Math.PI )
            l = l - 2. * Math.PI;

        x.Value = b * 24000000 / Math.PI + 8000000;
        y.Value = (l * 16000000) / Math.PI + 168. * 16000000 / 180;
    }

    /**
     * Вычисление геодезических координат точки B,L по координатам
     * точки X,Y в цилиндрической проекции "Широта/Долгота" на шаре
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_LATLON( x: number, y: number, b: TDouble, l: TDouble ) {
        b.Value = (x - this.FalseNorth) / this.BigAxis + this.MainPointParallel;
        l.Value = (y - this.FalseEast) / this.BigAxis + this.AxisMeridian;
    }

    /**
     * Вычисление координат X,Y точки по геодезическим координатам
     * точки B,L в цилиндрической проекции "Широта/Долгота" на шаре
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_LATLON( b: number, l: number, x: TDouble, y: TDouble ) {
        x.Value = (b - this.MainPointParallel) * this.BigAxis + this.FalseNorth;
        y.Value = (l - this.AxisMeridian) * this.BigAxis + this.FalseEast;
    }

    /**
     * Вычисление геодезических координат точки B,L по координатам
     * точки X,Y в цилиндрической проекции Миллера на шаре
     * "EPSG:54003 - World Miller Cylindrical"
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_MILLER( x: number, y: number, b: TDouble, l: TDouble ) {
        l.Value = (y - this.FalseEast) / this.MiddleRadius + this.AxisMeridian;

        b.Value = Math.exp( 0.8 * (x - this.FalseNorth) / this.MiddleRadius );
        b.Value = 2.5 * Math.atan( b.Value ) - 0.625 * Math.PI;
    }

    /**
     * // Вычисление координат X,Y точки по геодезическим координатам
     * точки B,L в цилиндрической проекции Миллера на шаре
     * "EPSG:54003 - World Miller Cylindrical"
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_MILLER( b: number, l: number, x: TDouble, y: TDouble ) {
        y.Value = this.MiddleRadius * (l - this.AxisMeridian) + this.FalseEast;
        let temp = Math.tan( Math.PI / 4.0 + 0.4 * (b - this.MainPointParallel) );
        if ( temp < 0.000001 )
            temp = 0.000001;

        x.Value = 1.25 * this.MiddleRadius * Math.log( temp ) + this.FalseNorth;
    }

    /**
     * Вычисление геодезических координат точки B,L по координатам
     * точки X,Y в специальной проекции ("Глобус")
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private static xy2bl_GLOBE( x: number, y: number, b: TDouble, l: TDouble ) {
        b.Value = 2.0 * Math.atan( (x - TranslateConst.XC) / 11888664.2823464 );
        l.Value = (y - TranslateConst.YC) / 5528348.8;
    }

    /**
     * Вычисление координат X,Y точки по геодезическим координатам
     * точки B,L в специальной проекции ("Глобус")
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private static bl2xy_GLOBE( b: number, l: number, x: TDouble, y: TDouble ) {
        if ( b > Math.PI / 2. )
            b = Math.PI / 2.;
        else if ( b < -Math.PI / 2. )
            b = -Math.PI / 2.;

        if ( (l < -(2 * Math.PI)) || (l > (Math.PI * 2)) ) {
            const k = Math.floor( l / TranslateConst.PI2 );
            l = l - k * TranslateConst.PI2;
            if ( l < -Math.PI )
                l += TranslateConst.PI2;
            else {
                if ( l > Math.PI )
                    l -= TranslateConst.PI2;
            }
        }

        x.Value = TranslateConst.XC + 11888664.2823464 * Math.tan( b / 2. );
        y.Value = TranslateConst.YC + (l * 5528348.8);
    }

    //***************************************************************************
    //  Цилиндрическая прямая равноугольная Меркатора 2SP                       *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initMercator_2SP() {
        if ( this.ExcentricMeridian == 0 ) {
            // Проекция на шаре
            this.va = 0;
            this.vb = 0;
            this.vc = 0;
            this.vd = 0;
        } else {
            const E4 = this.E2 * this.E2;
            const E6 = E4 * this.E2;
            const E8 = E6 * this.E2;

            this.va = this.E2 / 2. + E4 * 5. / 24. + E6 / 12 + E8 * 13. / 360;
            this.vb = E4 * 7. / 48. + E6 * 29. / 240 + E8 * 811. / 11520;
            this.vc = E6 * 7. / 120 + E8 * 81. / 1120;
            this.vd = E8 * 4279. / 161280;
        }

        // вычисление постоянных по FirstMainParal
        // this.parallelCurvatureRadius
        let temp = Math.sin( this.FirstMainParallel );
        temp = 1.0 - this.E2 * temp * temp;
        if ( temp > 0 ) {
            temp = Math.sqrt( temp );
        } else {
            temp = 1;
        }

        this.ve = this.BigAxis * Math.cos( this.FirstMainParallel ) / temp;      // a * k0
    }

    /**
     * Вычисление геодезических координат точки B,L по прямоугольным координатам точки X,Y
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_Mercator_2SP( x: number, y: number, b: TDouble, l: TDouble ) {
        l.Value = (y - this.FalseEast) / this.ve + this.AxisMeridian;
        x = (x - this.FalseNorth) / this.ve;
        const ksi = Math.PI / 2. - 2. * Math.atan( Math.exp( -x ) );
        b.Value = ksi + this.va * Math.sin( 2. * ksi ) + this.vb * Math.sin( 4. * ksi ) + this.vc * Math.sin( 6 * ksi ) + this.vd * Math.sin( 8 * ksi );
    }

    /**
     * Вычисление прямоугольных координат X,Y по геодезическим координатам B,L
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Mercator_2SP( b: number, l: number, x: TDouble, y: TDouble ) {
        let flag = 0;

        // Перевод геодезических координат точки в прямоугольные координаты
        if ( b < (this.MainPointParallel) ) {
            b = -b;
            flag = 1;
        }

        const esinb = this.ExcentricMeridian * Math.sin( b );
        let temp = (1. - esinb) / (1 + esinb);
        temp = Math.pow( temp, this.ExcentricMeridian / 2. );
        temp = Math.tan( Math.PI / 4. + b / 2. ) * temp;

        if ( (temp < 0.000001) && (temp > -0.000001) ) {
            temp = 0.000001;
        }

        x.Value = this.ve * Math.log( temp );        // Натуральный логарифм

        if ( flag != 0 )
            x.Value = -x.Value;

        x.Value += this.FalseNorth;
        y.Value = this.ve * (l - this.AxisMeridian) + this.FalseEast;
    }

    //***************************************************************************
    //  Цилиндрическая прямая равноугольная Меркатора (УСТАРЕВШАЯ)              *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initMercatorMap() {
        // вычисление постоянных по FirstMainParal
        this.va = this.BigAxis * Math.cos( this.FirstMainParallel );
    }

    /**
     * Вычисление геодезических координат точки B,L по прямоугольным координатам точки X,Y
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_MercatorMap( x: number, y: number, b: TDouble, l: TDouble ) {
        let xx;
        let fd;
        let fh;
        let fc;
        let d;
        let h;
        let c;
        let rab;
        const delta = 0.000000001;   // 10-9

        const mod = TranslateConst.CONSTMOD;

        // Перевод координат точки из равноугольной проекции в
        //                            геодезические координаты

        y -= this.FalseEast;
        x -= this.FalseNorth;

        // Ищем долготу
        l.Value = y / this.va;     // yy
        l.Value += (this.AxisMeridian);

        // Ищем широту
        if ( x < 0.0 )
            xx = -x;
        else
            xx = x;

        h = Math.PI / 2. - 0.000001;        // Меркатор определен где-то до 87 градусов

        const step = xx * mod / this.va;   // x / radius -> this.parallelCurvatureRadius(this.FirstMainParallel) ???
        if ( step <= 300 ) {
            rab = Math.pow( 10, step );
            d = 0;

            fd = (1 + Math.sin( d )) * Math.pow( 1 - this.ExcentricMeridian * Math.sin( d ), this.ExcentricMeridian ) / ((1 - Math.sin( d )) * Math.pow( 1 + this.ExcentricMeridian * Math.sin( d ), this.ExcentricMeridian ));
            if ( fd <= 0 )
                fd = -rab;
            else
                fd = Math.sqrt( fd ) - rab;

            fh = (1 + Math.sin( h )) * Math.pow( 1 - this.ExcentricMeridian * Math.sin( h ), this.ExcentricMeridian ) / ((1 - Math.sin( h )) * Math.pow( 1 + this.ExcentricMeridian * Math.sin( h ), this.ExcentricMeridian ));
            if ( fh <= 0 )
                fh = -rab;
            else
                fh = Math.sqrt( fh ) - rab;

            if ( Math.abs( fd ) >= delta ) {
                if ( Math.abs( fh ) >= delta ) {
                    while ( h - d > delta ) {
                        if ( fd * fh < 0 ) {
                            c = (h + d) / 2.;

                            const sinc = Math.sin( c );
                            const exscsinc = this.ExcentricMeridian * sinc;
                            fc = Math.sqrt( (1. + sinc) * Math.pow( 1. - exscsinc, this.ExcentricMeridian ) / ((1. - sinc) * Math.pow( 1 + exscsinc, this.ExcentricMeridian )) ) - rab;

                            if ( Math.abs( fc ) < delta ) {
                                b.Value = c;
                                break;
                            }

                            if ( fd * fc < 0 )
                                h = c;
                            else {
                                d = c;
                                fd = fc;
                            }
                        } else {
                            b.Value = 0.0;
                            break;
                        }

                        b.Value = c;
                    }
                } else
                    b.Value = h;
            } else
                b.Value = d;
        } else
            b.Value = h;

        if ( x < 0.0 )
            b.Value = -(b.Value);
    }

    /**
     * Вычисление прямоугольных координат X,Y по геодезическим координатам B,L
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_MercatorMap( b: number, l: number, x: TDouble, y: TDouble ) {
        const mod = TranslateConst.CONSTMOD;
        let flag = 0;

        // Перевод геодезических координат точки в прямоугольные координаты
        if ( b < (this.MainPointParallel) ) {
            b = -b;
            flag = 1;
        }

        const kci1 = Math.asin( this.ExcentricMeridian * Math.sin( b ) );
        let u1 = Math.tan( Math.PI / 4. + b / 2. ) / Math.pow( Math.tan( Math.PI / 4. + kci1 / 2. ), this.ExcentricMeridian );

        if ( (u1 < 0.000001) && (u1 > -0.000001) )
            u1 = 0.000001;

        const xx = this.va / mod * Math.log10( u1 );
        const yy = this.va * (l - this.AxisMeridian);

        if ( flag == 0 )
            x.Value = xx;
        else
            x.Value = -xx;

        x.Value += this.FalseNorth;
        y.Value = yy + this.FalseEast;
    }

    //***************************************************************************
    //  Коническая равноугольная Ламберта                                       *
    //  Lambert conformal conic                                                 *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initLambertConformalConic() {
        if ( this.FirstMainParallel >= (Math.PI / 2. - 0.001) )
            this.FirstMainParallel = 89. * Math.PI / 180;
        if ( this.SecondMainParallel >= (Math.PI / 2. - 0.001) )
            this.SecondMainParallel = 89. * Math.PI / 180;

        const m1 = this.parallelCurvatureRadius( this.FirstMainParallel );
        const t1 = this.isometricLatitude( this.FirstMainParallel );

        const delta = this.FirstMainParallel - this.SecondMainParallel;
        if ( (delta > 0.01) || (delta < -0.01) ) {
            const m2 = this.parallelCurvatureRadius( this.SecondMainParallel );
            const t2 = this.isometricLatitude( this.SecondMainParallel );

            let temp = Math.log( t1 ) - Math.log( t2 );
            if ( temp == 0 ) {
                temp = 1;
            }

            this.va = (Math.log( m1 ) - Math.log( m2 )) / temp;                           // N
        } else {
            this.va = Math.sin( this.FirstMainParallel );
            if ( this.va == 0 )
                this.va = 1;
        }

        let temp2 = this.va * Math.pow( t1, this.va );
        if ( temp2 == 0 ) {
            temp2 = 1;
        }

        this.vb = this.BigAxis * m1 / temp2;                               // F * a  (R)

        temp2 = this.isometricLatitude( this.MainPointParallel );
        if ( temp2 < 0.0000000001 ) {
            temp2 = 1;
        }

        this.vc = this.vb * Math.pow( temp2, this.va ); // r0
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_LambertConformalConic( b: number, l: number, x: TDouble, y: TDouble ) {
        // Долгота от осевого меридиана должна быть не далее 180 градусов
        const step = 180.0 / TranslateConst.RAD;
        if ( l > this.AxisMeridian ) {
            if ( (l - this.AxisMeridian) > step )
                l -= (2.0 * step);
        } else {
            if ( (this.AxisMeridian - l) > step )
                l += (2.0 * step);
        }

        const sigma = this.va * (l - this.AxisMeridian);
        const r = this.vb * Math.pow( this.isometricLatitude( b ), this.va );

        x.Value = this.vc - r * Math.cos( sigma ) + this.FalseNorth;
        y.Value = r * Math.sin( sigma ) + this.FalseEast;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_LambertConformalConic( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const sigma = Math.atan( y / (this.vc - x) );
        l.Value = this.AxisMeridian + sigma / this.va;

        let temp = this.vc - x;
        let r = y * y + temp * temp;
        if ( r > 0 ) {
            r = Math.sqrt( r );
        }

        if ( this.va < 0 ) {           // sign(N)
            r = -r;
        }

        const t = Math.pow( r / this.vb, 1.0 / this.va );

        let tb = t;

        const e = this.ExcentricMeridian / 2.0;

        b.Value = TranslateConst.M_PI_4;                    // начальное значение 45 градусов

        for ( let i = 0; i < 40; i++ ) {
            temp = this.ExcentricMeridian * Math.sin( b.Value );
            temp = (1.0 - temp) / (1.0 + temp);
            b.Value = (Math.PI / 2) - 2 * Math.atan( t * Math.pow( temp, e ) );
            temp = (b.Value - tb);
            if ( temp < 0 )
                temp = -temp;

            if ( temp < TranslateConst.TRANSLATEPRECISION )
                break;

            tb = b.Value;
        }
    }

    //***************************************************************************
    //  Азимутальная равнопромежуточная проекция Гуам                           *
    //  Guam Projection (EPSG:9831)                                             *
    //***************************************************************************

    /**
     * Инициализация
     * @returns
     */
    private initAzimutalEquidistantGuam() {
        this.ProjectionKind = 0;

        const top = TranslateConst.M_PI_2 - 0.000001;

        // Полярная северная
        if ( this.MainPointParallel >= top ) {
            this.MainPointParallel = TranslateConst.M_PI_2;
            this.ProjectionKind = -1;
        }

        // Полярная южная
        if ( this.MainPointParallel <= -top ) {
            this.MainPointParallel = -TranslateConst.M_PI_2;
            this.ProjectionKind = -2;
        }

        const sin1 = Math.sin( this.MainPointParallel );
        const cos1 = Math.cos( this.MainPointParallel );

        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            this.va = sin1;
            this.vb = cos1;
            return;
        }

        const temp = Math.sqrt( 1 - this.E2 );
        const e1 = (1. - temp) / (1 + temp);
        const e12 = e1 * e1;
        const e13 = e12 * e1;
        const e14 = e13 * e1;

        this.ksin2m = 3. * e1 / 2. - 27. * e13 / 32.;
        this.ksin4m = 21. * e12 / 16. - 55. * e14 / 32.;
        this.ksin6m = 151. * e13 / 96.;
        this.ksin8m = 1097. * e14 / 512.;

        const E4 = this.E2 * this.E2;
        const E6 = E4 * this.E2;

        this.kf = 1. - this.E2 / 4. - 3. * E4 / 64. - 5 * E6 / 256.;
        this.ksin2f = 3. * this.E2 / 8. + 3. * E4 / 32. + 45 * E6 / 1024;
        this.ksin4f = 15. * E4 / 256. + 45. * E6 / 1024.;
        this.ksin6f = 35. * E6 / 3072.;

        this.va = this.BigAxis * (this.kf * this.MainPointParallel - this.ksin2f * Math.sin( 2. * this.MainPointParallel ) +
            this.ksin4f * Math.sin( 4. * this.MainPointParallel ) - this.ksin6f * Math.sin( 6. * this.MainPointParallel ));
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_AzimutalEquidistantGuam( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        let ro = (x * x + y * y);
        if ( ro == 0 ) {
            b.Value = this.MainPointParallel;
            l.Value = this.AxisMeridian;
            return;
        }

        ro = Math.sqrt( ro );

        l.Value = this.AxisMeridian;

        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            const c = this.BigAxis / ro;
            const cosc = Math.cos( c );
            const sinc = Math.sin( c );
            b.Value = Math.asin( cosc * this.va + (x * sinc * this.vb / ro) );

            // Южный полюс
            if ( this.ProjectionKind == -2 ) {
                if ( y != 0 )
                    l.Value += Math.atan( x / y );
                return;
            }

            // Северный полюс
            if ( this.ProjectionKind == -1 ) {
                if ( y != 0 )
                    l.Value += Math.atan( x / -y );
                return;
            }

            // Косая
            l.Value += Math.atan( y * sinc / (ro * this.vb * cosc - x * this.va * sinc) );
            return;
        }

        if ( this.ProjectionKind < 0 ) {
            let M;
            // Южный полюс
            if ( this.ProjectionKind == -2 ) {
                M = ro - this.va;

                if ( y != 0 )
                    l.Value += Math.atan( x / y );
            } else {
                M = this.va - ro;

                if ( y != 0 )
                    l.Value += Math.atan( x / -y );
            }

            const mu = M / this.BigAxis / this.kf;

            b.Value = mu + this.ksin2m * Math.sin( 2. * mu ) + this.ksin4m * Math.sin( 4. * mu ) +
                this.ksin6m * Math.sin( 6. * mu ) + this.ksin8m * Math.sin( 8. * mu );
            return;
        }

        // Итерационное вычисление широты
        b.Value = this.MainPointParallel;
        let count = 12;
        while ( count-- > 0 ) {
            const sinb = Math.sin( b.Value );
            const M = this.va + x - y * y * Math.tan( b.Value ) * Math.sqrt( 1. - this.E2 * sinb * sinb ) / 2. / this.BigAxis;

            const mu = M / this.BigAxis / this.kf;

            let b1 = b.Value;
            b.Value = mu + this.ksin2m * Math.sin( 2. * mu ) + this.ksin4m * Math.sin( 4. * mu ) +
                this.ksin6m * Math.sin( 6. * mu ) + this.ksin8m * Math.sin( 8. * mu );

            b1 -= b.Value;
            if ( Math.abs( b1 ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        // Косая
        const sinb = Math.sin( b.Value );
        l.Value += y * Math.sqrt( 1. - this.E2 * sinb * sinb ) / this.BigAxis / Math.cos( b.Value );
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     * @returns
     */
    private bl2xy_AzimutalEquidistantGuam( b: number, l: number, x: TDouble, y: TDouble ) {
        l = l - this.AxisMeridian;

        if ( (this.MainPointParallel == 0) && (this.AxisMeridian < TranslateConst.M_PI_2) && (this.AxisMeridian > -TranslateConst.M_PI_2) ) {
            // Отсечение горизонта проекции
            let b1 = b - this.MainPointParallel;
            const r1 = b * b + l * l;
            if ( r1 > 0 ) {
                if ( r1 > (TranslateConst.M_PI_2 * TranslateConst.M_PI_2) ) {
                    // Сажаем точку на горизонт
                    const k = Math.sqrt( r1 ) / TranslateConst.M_PI_2;
                    l = l / k;
                    b1 = b1 / k;
                    b = b1 + this.MainPointParallel;
                }
            }
        }

        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            if ( this.ProjectionKind < 0 ) {
                let ro;
                // Южный полюс
                if ( this.ProjectionKind == -2 ) {
                    ro = this.BigAxis * (TranslateConst.M_PI_2 + b);
                    x.Value = ro * Math.cos( l ) + this.FalseNorth;
                } else {
                    ro = this.BigAxis * (TranslateConst.M_PI_2 - b);
                    x.Value = -ro * Math.cos( l ) + this.FalseNorth;
                }

                y.Value = ro * Math.sin( l ) + this.FalseEast;
                return;
            }

            let k = 1;
            const cosc = this.va * Math.sin( b ) + this.vb * Math.cos( b ) * Math.cos( l );
            if ( cosc != -1. ) {
                const c = Math.acos( cosc );
                const temp = Math.sin( c );
                if ( temp != 0 ) {
                    k = c / temp;
                }
            }

            y.Value = this.BigAxis * k * Math.cos( b ) * Math.sin( l ) + this.FalseEast;
            x.Value = this.BigAxis * k * (this.vb * Math.sin( b ) - this.va * Math.cos( b ) * Math.cos( l )) + this.FalseNorth;
            return;
        }

        const M = this.BigAxis * (this.kf * b - this.ksin2f * Math.sin( 2. * b ) + this.ksin4f * Math.sin( 4. * b ) - this.ksin6f * Math.sin( 6. * b ));

        // Северный полюс
        if ( this.ProjectionKind == -1 ) {
            const ro = this.va - M;

            y.Value = ro * Math.sin( l ) + this.FalseEast;
            x.Value = -ro * Math.cos( l ) + this.FalseNorth;
            return;
        }

        // Южный полюс
        if ( this.ProjectionKind == -2 ) {
            const ro = this.va + M;

            y.Value = ro * Math.sin( l ) + this.FalseEast;
            x.Value = ro * Math.cos( l ) + this.FalseNorth;
            return;
        }

        const sinb = Math.sin( b );
        const temp = Math.sqrt( 1. - this.E2 * sinb * sinb );
        y.Value = this.BigAxis * l * Math.cos( b ) / temp;
        x.Value = M - this.va + y.Value * y.Value * Math.tan( b ) * temp / 2. / this.BigAxis + this.FalseNorth;
        y.Value += this.FalseEast;
    }

    //***************************************************************************
    //  Косая равнопромежуточная азимутальная проекция                          *
    //  Modified Azimuthal Equidistant (EPSG:9832)                              *
    //***************************************************************************

    /**
     * Инициализация
     * @returns
     */
    private initModifiedAzimutalEquidistant() {
        this.ProjectionKind = 0;

        const top = TranslateConst.M_PI_2 - 0.000001;

        // Полярная северная
        if ( this.MainPointParallel >= top ) {
            this.MainPointParallel = TranslateConst.M_PI_2;
            this.ProjectionKind = -1;
            return;
        }

        // Полярная южная
        if ( this.MainPointParallel <= -top ) {
            this.MainPointParallel = -TranslateConst.M_PI_2;
            this.ProjectionKind = -2;
            return;
        }

        // Косая проекция
        const sin1 = Math.sin( this.MainPointParallel );
        const sin12 = sin1 * sin1;
        const temp12 = 1.0 - this.E2 * sin12;
        const cos1 = Math.cos( this.MainPointParallel );
        const cos12 = cos1 * cos1;

        if ( this.ExcentricMeridian == 0 ) {
            this.va = this.BigAxis;
            this.vb = 0;
            this.vc = 0;
            this.vd = sin1;
            this.ve = cos1;
            this.vg = 0;
            this.vh = 0;
        } else {
            this.va = this.BigAxis / Math.sqrt( temp12 );
            this.vb = this.E2 * this.va * sin1;
            this.vc = this.E2 * cos12;
            this.vd = sin1;
            this.ve = cos1;
            this.vg = this.ExcentricMeridian * sin1 / Math.sqrt( 1. - this.E2 );
            this.vh = this.ExcentricMeridian * cos1 / Math.sqrt( 1. - this.E2 );
        }
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_ModifiedAzimutalEquidistant( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        let cs = x * x + y * y;
        if ( cs == 0 ) {
            b.Value = this.MainPointParallel;
            l.Value = this.AxisMeridian;
            return;
        }

        cs = Math.sqrt( cs );
        const D = cs / this.va;

        if ( x == 0 ) {
            b.Value = this.MainPointParallel;

            const J = D;
            const psis = Math.asin( this.vd * Math.cos( J ) );
            l.Value = Math.asin( Math.sin( J ) / Math.cos( psis ) ) + this.AxisMeridian;
            return;
        }

        const as = Math.atan( y / x );
        const cosas = Math.cos( as );
        const A = -this.vc * cosas * cosas / (1 - this.E2);
        const B = 3 * this.E2 * (1. - A) * this.vd * this.ve * cosas / (1. - this.E2);

        const D3 = D * D * D;
        const D4 = D3 * D;
        const J = D - (A * (1. + A) * D3 / 6.) - (B * (1. + 3. * A) * D4 / 24.);
        const J2 = J * J;
        const J3 = J2 * J;
        const K = 1. - (A * J2 / 2.) - (B * J3 / 6.);
        const psis = Math.asin( this.vd * Math.cos( J ) + this.ve * Math.sin( J ) * cosas );

        b.Value = Math.atan( (1. - this.E2 * K * this.vd / Math.sin( psis )) * Math.tan( psis ) / (1. - this.E2) );
        l.Value = Math.asin( Math.sin( as ) * Math.sin( J ) / Math.cos( psis ) ) + this.AxisMeridian;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     * @returns
     */
    private bl2xy_ModifiedAzimutalEquidistant( b: number, l: number, x: TDouble, y: TDouble ) {
        l = l - this.AxisMeridian;

        if ( (this.MainPointParallel == 0) && (this.AxisMeridian < TranslateConst.M_PI_2) && (this.AxisMeridian > -TranslateConst.M_PI_2) ) {
            // Отсечение горизонта проекции
            let b1 = b - this.MainPointParallel;
            const r1 = b * b + l * l;
            if ( r1 > 0 ) {
                if ( r1 > (TranslateConst.M_PI_2 * TranslateConst.M_PI_2) ) {
                    // Сажаем точку на горизонт
                    const k = Math.sqrt( r1 ) / TranslateConst.M_PI_2;
                    l = l / k;
                    b1 = b1 / k;
                    b = b1 + this.MainPointParallel;
                }
            }
        }
        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            if ( this.ProjectionKind < 0 ) {
                let ro;
                // Южный полюс
                if ( this.ProjectionKind == -2 ) {
                    ro = this.BigAxis * (TranslateConst.M_PI_2 + b);
                    x.Value = ro * Math.cos( l ) + this.FalseNorth;
                } else {
                    ro = this.BigAxis * (TranslateConst.M_PI_2 - b);
                    x.Value = -ro * Math.cos( l ) + this.FalseNorth;
                }

                y.Value = ro * Math.sin( l ) + this.FalseEast;
                return;
            }
        }

        let v = this.BigAxis;
        if ( this.ExcentricMeridian != 0 ) {
            const sinb = Math.sin( b );
            const sinb2 = sinb * sinb;
            v = v / Math.sqrt( 1. - this.E2 * sinb2 );
        }

        let psi;
        let temp;

        if ( b >= TranslateConst.M_PI_2 )
            psi = TranslateConst.M_PI_2;
        else if ( b <= -TranslateConst.M_PI_2 )
            psi = -TranslateConst.M_PI_2;
        else {
            temp = (1. - this.E2) * Math.tan( b ) + this.vb / (v * Math.cos( b ));
            psi = Math.atan( temp );
        }

        temp = this.ve * Math.tan( psi ) - this.vd * Math.cos( l );
        const alfa = Math.atan( Math.sin( l ) / temp );

        const cosa = Math.cos( alfa );
        const H = cosa * this.vh;
        const H2 = H * H;
        const sina = Math.sin( alfa );
        let s;
        if ( sina == 0 ) {
            s = Math.asin( this.ve * Math.sin( psi ) - this.vd * Math.cos( psi ) );
            if ( cosa < 0 )
                s = -s;
        } else {
            s = Math.asin( Math.sin( l ) * Math.cos( psi ) / sina );
        }

        const s2 = s * s;
        const s3 = s2 * s;
        const s4 = s3 * s;
        const s5 = s4 * s;
        const c = this.va * s * ((1. - s2 * H2 * (1. - H2) / 6.) + (s3 / 8.) * this.vg * H * (1. - 2. * H2) +
            (s4 / 120) * (H2 * (4. - 7. * H2) - 3 * this.vg * this.vg * (1. - 7. * H2) - (s5 / 48.) * this.vg * H));

        y.Value = c * sina + this.FalseEast;
        x.Value = c * cosa + this.FalseNorth;
    }

    //***************************************************************************
    //  Косая равновеликая азимутальная проекция Ламберта                       *
    //  Lambert azimuthal equal-area projection                                 *
    //***************************************************************************

    /**
     * Инициализация
     * @returns
     */
    private initLambertObliqueAzimuthal() {
        this.ProjectionKind = 0;

        this.va = 1;
        this.vb = 0.;
        this.vc = 1.;
        this.vd = 1;
        this.ve = 1;

        if ( this.ExcentricMeridian == 0 ) {
            this.va = Math.sin( this.MainPointParallel );
            this.vb = Math.cos( this.MainPointParallel );
            return;
        }

        const E4 = this.E2 * this.E2;
        const E6 = E4 * this.E2;
        this.ksin2f = this.E2 / 3. + 31. * E4 / 180 + 517. * E6 / 5040;
        this.ksin4f = 23. * E4 / 360 + 251. * E6 / 3780;
        this.ksin6f = 761. * E6 / 45360;

        const qp = (1.0 - this.E2) * (1.0 / (1.0 - this.E2) - (0.5 / this.ExcentricMeridian) * Math.log( (1 - this.ExcentricMeridian) / (1 + this.ExcentricMeridian) ));
        this.va = qp;

        const top = TranslateConst.M_PI_2 - 0.000001;

        // Полярная северная
        if ( this.MainPointParallel >= top ) {
            this.MainPointParallel = TranslateConst.M_PI_2;
            this.ProjectionKind = -1;

            this.ve = this.BigAxis * this.BigAxis * (1. - (1. - this.E2) / (2. * this.ExcentricMeridian) * Math.log( (1 - this.ExcentricMeridian) / (1 + this.ExcentricMeridian) ));
            return;
        }

        // Полярная южная
        if ( this.MainPointParallel <= -top ) {
            this.MainPointParallel = -TranslateConst.M_PI_2;
            this.ProjectionKind = -2;

            this.ve = this.BigAxis * this.BigAxis * (1. - (1. - this.E2) / (2. * this.ExcentricMeridian) * Math.log( (1 - this.ExcentricMeridian) / (1 + this.ExcentricMeridian) ));
            return;
        }

        const rq = this.BigAxis * Math.sqrt( qp / 2.0 );

        // Поперечная проекция
        if ( this.MainPointParallel == 0 ) {
            // Запомнить рабочие переменные
            this.va = qp;
            this.vd = this.BigAxis / rq;
            this.ve = rq;
            return;
        }

        // Косая проекция
        const sin1 = Math.sin( this.MainPointParallel );
        const sin12 = sin1 * sin1;
        const temp1 = this.ExcentricMeridian * sin1;
        const temp12 = 1.0 - this.E2 * sin12;
        const m1 = Math.cos( this.MainPointParallel ) / Math.sqrt( temp12 );
        let q1 = (1.0 - this.E2) * (sin1 / temp12 - (0.5 / this.ExcentricMeridian) * Math.log( (1 - temp1) / (1 + temp1) )) / qp;
        if ( q1 > 1 ) {
            q1 = 1;
        } else if ( q1 < -1 ) {
            q1 = -1;
        }

        const b1 = Math.asin( q1 );
        const d = this.BigAxis * m1 / (rq * Math.cos( b1 ));

        // Запомнить рабочие переменные
        this.va = qp;
        this.vb = Math.sin( b1 );
        this.vc = Math.cos( b1 );
        this.vd = d;
        this.ve = rq;
    }

    /**
     * Вычислить параметр
     * @param b
     * @returns
     */
    private lambertObliqueAzimuthal_Q( b: number ): number {
        const sin1 = Math.sin( b );
        const sin12 = sin1 * sin1;
        const temp1 = this.ExcentricMeridian * sin1;
        const temp12 = 1.0 - this.E2 * sin12;

        return (1.0 - this.E2) * (sin1 / temp12 - (0.5 / this.ExcentricMeridian) * Math.log( (1 - temp1) / (1 + temp1) ));
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_LambertObliqueAzimuthal( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            let ro = x * x + y * y;
            if ( ro <= 0.0001 ) {
                b.Value = this.MainPointParallel;
                l.Value = this.AxisMeridian;
                return;
            }

            ro = Math.sqrt( ro );
            let temp = ro / (2. * this.BigAxis);
            if ( temp > 1 ) {
                temp = 1;
            }

            const c = 2. * Math.asin( temp );

            temp = Math.cos( c ) * this.va + (x * Math.sin( c ) * this.vb / ro);
            if ( temp > 1 ) {
                temp = 1;
            } else if ( temp < -1 ) {
                temp = -1;
            }

            b.Value = Math.asin( temp );
            l.Value = this.AxisMeridian;

            if ( this.MainPointParallel >= TranslateConst.M_PI_2 ) {
                if ( x != 0 )
                    l.Value += Math.atan( y / (-x) );
            } else if ( this.MainPointParallel <= -TranslateConst.M_PI_2 ) {
                if ( x != 0 )
                    l.Value += Math.atan( y / x );
            } else {
                temp = y * Math.sin( c ) / (ro * this.vb * Math.cos( c ) - x * this.va * Math.sin( c ));
                if ( temp >= TranslateConst.M_PI_2 )
                    temp = TranslateConst.M_PI_2 - 0.0001;
                else if ( temp <= -TranslateConst.M_PI_2 )
                    temp = -TranslateConst.M_PI_2 + 0.0001;

                l.Value += Math.atan( temp );
            }

            return;
        }

        let q;

        if ( this.ProjectionKind < 0 ) {
            let ro = x * x + y * y;
            if ( ro <= 0.0001 ) {
                b.Value = this.MainPointParallel;
                l.Value = this.AxisMeridian;
                return;
            }

            ro = Math.sqrt( ro );
            q = 1. - ro * ro / this.ve;

            // Южный полюс
            if ( this.ProjectionKind == -2 ) {
                q = -q;
                l.Value = this.AxisMeridian;
                if ( x != 0 )
                    l.Value += Math.atan( y / x );

                if ( x < 0 )
                    l.Value += Math.PI;
            } else {
                l.Value = this.AxisMeridian;
                if ( x != 0 )
                    l.Value += Math.atan( y / -x );
                if ( x > 0 )
                    l.Value += Math.PI;
            }
        } else {
            const dy = y / this.vd;
            const dx = x * this.vd;
            let ro = dx * dx + dy * dy;

            if ( ro <= 0.00001 ) {
                b.Value = this.MainPointParallel;
                l.Value = this.AxisMeridian;
                return;
            }

            ro = Math.sqrt( ro );

            let temp = ro / (2.0 * this.ve);
            if ( temp > 1 ) {
                temp = 1;
            } else if ( temp < -1 ) {
                temp = -1;
            }

            const ce = 2 * Math.asin( temp );
            const cce = Math.cos( ce );
            const sce = Math.sin( ce );

            q = /*this.va * */(cce * this.vb + this.vd * x * sce * this.vc / ro);
            const z = this.vd * (ro * this.vc * cce - this.vd * x * this.vb * sce);

            if ( Math.abs( z ) < 0.00001 ) {
                if ( ((z >= 0) && (y > 0)) || ((z < 0) && (y < 0)) )
                    l.Value = this.AxisMeridian + TranslateConst.M_PI_2;
                else
                    l.Value = this.AxisMeridian - TranslateConst.M_PI_2;
            } else {
                l.Value = this.AxisMeridian + Math.atan( y * sce / z );
            }

            // Since the denominator of the argument for arctain is negative, add 180.
            if ( z < 0 )
                l.Value += Math.PI;
        }

        if ( q > 1 )
            q = 1;
        else if ( q < -1 )
            q = -1;

        const db = Math.asin( q );

        b.Value = db + this.ksin2f * Math.sin( 2. * db ) + this.ksin4f * Math.sin( 4. * db ) + this.ksin6f * Math.sin( 6. * db );

        if ( l.Value > Math.PI )
            l.Value -= (2. * Math.PI);
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     * @returns
     */
    private bl2xy_LambertObliqueAzimuthal( b: number, l: number, x: TDouble, y: TDouble ) {
        l -= this.AxisMeridian;

        if ( (this.MainPointParallel == 0) && (this.AxisMeridian < TranslateConst.M_PI_2) && (this.AxisMeridian > -TranslateConst.M_PI_2) ) {
            // Отсечение горизонта проекции
            let b1 = b - this.MainPointParallel;
            const r1 = b * b + l * l;
            if ( r1 > 0 ) {
                if ( r1 > (TranslateConst.M_PI_2 * TranslateConst.M_PI_2) ) {
                    // Сажаем точку на горизонт
                    const k = Math.sqrt( r1 ) / TranslateConst.M_PI_2;
                    l = l / k;
                    b1 = b1 / k;
                    b = b1 + this.MainPointParallel;
                }
            }
        }

        if ( this.ExcentricMeridian == 0 ) {
            let temp = 1. + this.va * Math.sin( b ) + this.vb * Math.cos( b ) * Math.cos( l );
            if ( temp > 0 ) {
                temp = Math.sqrt( 2. / temp );
            }

            y.Value = this.BigAxis * temp * Math.cos( b ) * Math.sin( l ) + this.FalseEast;
            x.Value = this.BigAxis * temp * (this.vb * Math.sin( b ) - this.va * Math.cos( b ) * Math.cos( l )) + this.FalseNorth;
            return;
        }

        let q = this.lambertObliqueAzimuthal_Q( b );

        if ( this.ProjectionKind < 0 ) {
            let ro;
            // Южный полюс
            if ( this.ProjectionKind == -2 ) {
                ro = this.BigAxis * Math.sqrt( this.va + q );
                x.Value = ro * Math.cos( l ) + this.FalseNorth;
            } else {
                ro = this.BigAxis * Math.sqrt( this.va - q );
                x.Value = -ro * Math.cos( l ) + this.FalseNorth;
            }

            y.Value = ro * Math.sin( l ) + this.FalseEast;
            return;
        }

        // this.va = qp
        q = q / this.va;
        if ( q > 1 )
            q = 1;
        else if ( q < -1 )
            q = -1;

        const cb = Math.asin( q );
        const scb = Math.sin( cb );
        const ccb = Math.cos( cb );

        const temp = ccb * Math.cos( l );

        const bb = this.ve * Math.sqrt( 2.0 / (1.0 + this.vb * scb + this.vc * temp) );

        y.Value = bb * this.vd * ccb * Math.sin( l ) + this.FalseEast;
        x.Value = (bb / this.vd) * (this.vc * scb - this.vb * temp) + this.FalseNorth;
    }

    //***************************************************************************
    //  Псевдоцилиндрическая равновеликая эллиптическая проекция Мольвейде      *
    //  Mollweide projection                                                    *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initMollweide() {
        this.va = Math.sqrt( 2. ) * this.MiddleRadius;
        this.vb = this.MiddleRadius * Math.sqrt( 8. ) / Math.PI;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_Mollweide( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const psi = Math.asin( x / this.va );
        l.Value = y / (this.vb * Math.cos( psi )) + this.AxisMeridian;
        b.Value = Math.asin( (2. * psi + Math.sin( 2. * psi )) / Math.PI );
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Mollweide( b: number, l: number, x: TDouble, y: TDouble ) {
        let dT;
        const SinB = Math.sin( b );
        let T = b;
        do {
            dT = (Math.PI * SinB - T - Math.sin( T )) / (1. + Math.cos( T ));
            T += dT;
        }
        while ( dT > TranslateConst.TRANSLATEPRECISION );

        T /= 2.;

        l = l - this.AxisMeridian;

        x.Value = this.va * Math.sin( T ) + this.FalseNorth;
        y.Value = this.vb * l * Math.cos( T ) + this.FalseEast;
    }

    //***************************************************************************
    // Коническая проекция                                                      *
    //***************************************************************************

    /**
     * Инициализировать константы для пересчета координат
     */
    private initConicalOrthomorphic() {
        this.Sign = 1;

        if ( this.FirstMainParallel >= (Math.PI / 2. - 0.001) )
            this.FirstMainParallel = 89. * Math.PI / 180;
        if ( this.SecondMainParallel >= (Math.PI / 2. - 0.001) )
            this.SecondMainParallel = 89. * Math.PI / 180;

        if ( (this.FirstMainParallel < 0) || ((this.FirstMainParallel == 0) && (this.SecondMainParallel < 0)) ) {
            this.Sign = -1;
            this.FirstMainParallel = -this.FirstMainParallel;
            this.SecondMainParallel = -this.SecondMainParallel;
        }

        const la1 = Math.PI;
        let kci1 = Math.asin( this.ExcentricMeridian * Math.sin( this.FirstMainParallel ) );
        const kci2 = Math.asin( this.ExcentricMeridian * Math.sin( this.SecondMainParallel ) );
        let u1 = Math.tan( la1 / 4 + this.FirstMainParallel / 2 ) / Math.pow( Math.tan( la1 / 4 + kci1 / 2 ), this.ExcentricMeridian );
        const u2 = Math.tan( la1 / 4 + this.SecondMainParallel / 2 ) / Math.pow( Math.tan( la1 / 4 + kci2 / 2 ), this.ExcentricMeridian );
        const lr1 = this.BigAxis * Math.cos( this.FirstMainParallel ) / Math.sqrt( 1 - Math.pow( this.ExcentricMeridian * Math.sin( this.FirstMainParallel ), 2 ) );
        const lr2 = this.BigAxis * Math.cos( this.SecondMainParallel ) / Math.sqrt( 1 - Math.pow( this.ExcentricMeridian * Math.sin( this.SecondMainParallel ), 2 ) );
        this.va = (Math.log10( lr1 ) - Math.log10( lr2 )) / (Math.log10( u2 ) - Math.log10( u1 ));

        if ( this.va == 0 )
            this.va = 1;

        this.vd = lr1 * Math.pow( u1, this.va ) / this.va;

        // Перевод геодезических координат левого нижнего угла в
        // прямоугольные координаты

        kci1 = Math.asin( this.ExcentricMeridian * Math.sin( this.MainPointParallel ) );
        u1 = Math.tan( la1 / 4 + this.MainPointParallel / 2 ) / Math.pow( Math.tan( la1 / 4 + kci1 / 2 ), this.ExcentricMeridian );

        this.vb = this.vd / Math.pow( u1, this.va );

        this.vc = Math.PI / 2.0 / this.va;
    }


    /**
     * Вычисление геодезических координат точки B,L(равноугольной конической
     * проекции) по координатам точки X,Y
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - широта и долгота точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_ConicalOrthomorphic( x: number, y: number, b: TDouble, l: TDouble ) {
        // Перевод координат точки из равноугольной проекции в
        // геодезические координаты
        // ищем долготу

        const delta = 0.00000001;      // 1E-8

        y = y - this.FalseEast;
        x = (x - this.FalseNorth) * this.Sign;

        if ( Math.abs( y ) > delta ) {
            let dqx = this.vb - x;
            if ( Math.abs( dqx ) < delta ) {
                dqx = delta;
            }

            // Переход через Полюс
            if ( dqx < 0 ) {
                let zero = this.vc;
                if ( y < 0 ) {
                    zero = -zero;
                }

                l.Value = zero + zero - Math.atan( y / (-dqx) ) / this.va;
            } else {
                l.Value = Math.atan( y / dqx ) / this.va;
            }
        } else {
            l.Value = 0.0;
            if ( y > 0 )
                y = delta * 2;
            else
                y = -delta * 2;
        }

        let sigma = this.va * l.Value;
        if ( l.Value == 0 ) {
            sigma = this.va * y;
        }

        l.Value += this.AxisMeridian;

        // Ищем широту
        let d = -Math.PI / 4;
        let h = Math.PI / 2 - 0.0001;

        let rab1 = Math.sin( sigma ) * this.vd / y;
        let fd, fh, c, fc;

        {
            if ( rab1 > delta ) {
                rab1 = Math.pow( rab1, 1. / this.va );
            } else {
                rab1 = 0;
            }

            fd = Math.sqrt( (1 + Math.sin( d )) * Math.pow( 1 - this.ExcentricMeridian * Math.sin( d ), this.ExcentricMeridian ) / ((1 - Math.sin( d )) * Math.pow( 1 + this.ExcentricMeridian * Math.sin( d ), this.ExcentricMeridian )) ) -
                rab1;
            fh = Math.sqrt( (1 + Math.sin( h )) * Math.pow( 1 - this.ExcentricMeridian * Math.sin( h ), this.ExcentricMeridian ) / ((1 - Math.sin( h )) * Math.pow( 1 + this.ExcentricMeridian * Math.sin( h ), this.ExcentricMeridian )) ) -
                rab1;

            if ( rab1 < delta ) {
                rab1 = (fd + fh) / 2;
                fd -= rab1;
                fh -= rab1;
            }
        }

        if ( fd == 0 ) {
            b.Value = d;
            b.Value = b.Value * this.Sign;
            return;
        }

        if ( fh == 0 ) {
            b.Value = h;
            b.Value = b.Value * this.Sign;
            return;
        }

        let k = 40;
        while ( (h - d > delta) && (k-- > 0) ) {
            //   if (fd*fh < 0)
            {
                c = (h - d) / 2;
                c += d;

                fc = Math.sqrt( (1 + Math.sin( c )) * Math.pow( 1 - this.ExcentricMeridian * Math.sin( c ), this.ExcentricMeridian ) / ((1 - Math.sin( c )) * Math.pow( 1 + this.ExcentricMeridian * Math.sin( c ), this.ExcentricMeridian )) ) - rab1;

                if ( Math.abs( fc ) < delta ) {
                    b.Value = c;
                    b.Value = b.Value * this.Sign;
                    return;
                }

                if ( fd * fc < 0 )
                    h = c;
                else {
                    d = c;
                    fd = fc;
                }
            }

            b.Value = c;
        }

        b.Value = b.Value * this.Sign;
    }

    /**
     * Вычисление координат X,Y точки (равноугольной
     * конической проекции) по геодезическим координатам точки B,L
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_ConicalOrthomorphic( b: number, l: number, x: TDouble, y: TDouble ) {
        const la1 = Math.PI;

        // Перевод геодезических координат точки в прямоугольные координаты
        b = b * this.Sign;

        const kci1 = Math.asin( this.ExcentricMeridian * Math.sin( b ) );
        const u1 = Math.tan( la1 / 4 + b / 2 ) / Math.pow( Math.tan( la1 / 4 + kci1 / 2 ), this.ExcentricMeridian );

        let p = Math.pow( u1, this.va );                     // this.va -> Dlog

        if ( p < TranslateConst.DOUBLENULL ) {
            p = 1;
        }

        p = this.vd / p;                                   // this.vd -> K

        const sigma = this.va * (l - this.AxisMeridian);

        y.Value = p * Math.sin( sigma );
        x.Value = this.vb - p * Math.cos( sigma );

        // Перевод координат точки в систему листа
        y.Value = y.Value + this.FalseEast;
        x.Value = x.Value * this.Sign + this.FalseNorth;
    }

    //***************************************************************************
    //  Псевдоцилиндрическая равновеликая синусоидальная проекция Каврайского   *
    //  х у координаты прямоугольные в метрах  х на север у на восток           *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initKavrajsky() {
        this.va = Math.pow( 3, 0.25 ) * this.MiddleRadius;
        this.vb = 2.0 / 3.0 * this.va;
        this.vc = Math.sqrt( 3.0 ) / 2.0;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_Kavrajsky( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const psi = x / this.va;

        let temp = Math.sin( psi ) / this.vc;
        if ( temp > 1 ) {
            temp = 1;
        } else if ( temp < -1 ) {
            temp = -1;
        }

        b.Value = Math.asin( temp );
        l.Value = y / (this.vb * Math.cos( psi )) + this.AxisMeridian;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Kavrajsky( b: number, l: number, x: TDouble, y: TDouble ) {
        l = l - this.AxisMeridian;

        let temp = this.vc * Math.sin( b );
        if ( temp > 1 ) {
            temp = 1;
        } else if ( temp < -1 ) {
            temp = -1;
        }

        const psi = Math.asin( temp );

        x.Value = this.va * psi + this.FalseNorth;
        y.Value = this.vb * l * Math.cos( psi ) + this.FalseEast;
    }

    //***************************************************************************
    // Псевдоцилиндрическая синусоидальная проекция Урмаева для карт океанов    *
    // (Тихого и Индийского)                                                    *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initUrmaevSinusoidal() {
        this.va = 1.42469 * this.MiddleRadius;
        this.vb = 0.138175;
        this.vc = 0.877383 * this.MiddleRadius;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_UrmaevSinusoidal( x: number, y: number, b: TDouble, l: TDouble ) {
        let psi, abc, abegin, aend;

        y -= this.FalseEast;
        x -= this.FalseNorth;

        psi = 0;                          // начальное значение      0
        abegin = -TranslateConst.M_PI_2;
        aend = TranslateConst.M_PI_2;  // начальный интервал -90--.--90

        for ( let i = 2; i < 91; i++ ) {
            // метод половинного деления 35 итераций 9 знаков 10 минут 1мгb метрики (133мг )
            abc = x - this.va * (psi + this.vb * psi * psi * psi);
            if ( abc < 0 ) {
                aend = psi;
                psi = (psi + abegin) / 2;
            } else {
                abegin = psi;
                psi = (psi + aend) / 2;
            }

            if ( Math.abs( abegin - aend ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        psi = (abegin + aend) / 2.0;

        let temp = 1.25 * Math.sin( psi );
        if ( temp > 1 ) {
            temp = 1;
        } else if ( temp < -1 ) {
            temp = -1;
        }

        b.Value = Math.asin( temp );
        l.Value = y / (this.vc * Math.cos( psi )) + this.AxisMeridian;               // долготу получили
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_UrmaevSinusoidal( b: number, l: number, x: TDouble, y: TDouble ) {
        l -= this.AxisMeridian;

        let temp = 0.8 * Math.sin( b );
        if ( temp > 1 ) {
            temp = 1;
        } else if ( temp < -1 ) {
            temp = -1;
        }

        const psi = Math.asin( temp );
        x.Value = this.va * (psi + this.vb * psi * psi * psi) + this.FalseNorth;
        y.Value = this.vc * Math.cos( psi ) * l + this.FalseNorth;
    }

    //***************************************************************************
    //  (Нормальная) равнопромежуточная азимутальная проекция  П О С Т Е Л Я    *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initPostel() {
        this.va = this.arcLength( TranslateConst.M_PI_2 );
        if ( Math.abs( this.FirstMainParallel - TranslateConst.M_PI_2 ) < 0.0001 )
            this.vb = 1; // касательная плоскость
        else
            this.vb = this.BigAxis * this.parallelCurvatureRadius( this.FirstMainParallel ) / (this.va - this.arcLength( this.FirstMainParallel ));
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_Postel( x: number, y: number, b: TDouble, l: TDouble ) {
        y -= this.FalseEast;
        x -= this.FalseNorth;

        let ro, sigma;    // полярные координаты

        if ( Math.abs( y ) < TranslateConst.DOUBLENULL ) {
            sigma = Math.PI / 2;
            if ( x > 0 )
                sigma = -sigma;
            ro = 0;
        } else {
            sigma = Math.atan( x / y );           // полярные
            ro = y / Math.cos( sigma );           // координаты

            if ( y > 0 ) {
                if ( x < 0 )
                    sigma = sigma + Math.PI;
                else if ( x > 0 )
                    sigma = sigma - Math.PI;
            }

            ro = Math.abs( ro );
        }

        l.Value = sigma + this.AxisMeridian;       // долготу получили
        const s1 = this.va - ro / this.vb;          // длина дуги меридиана от экватора до широты b
        b.Value = TranslateConst.M_PI_4;                      // начальное значение   45

        let abegin = 0;
        let aend: number = TranslateConst.M_PI_2;          // начальный интервал 0--.--90
        for ( let i = 2; i < 35; i++ ) {
            // метод половинного деления
            const abc = s1 - this.arcLength( b.Value );
            if ( abc < 0 ) {
                aend = b.Value;
                b.Value = (b.Value + abegin) / 2.;
            } else {
                abegin = b.Value;
                b.Value = (b.Value + aend) / 2.;
            }

            if ( Math.abs( abegin - aend ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        b.Value = (abegin + aend) / 2.;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Postel( b: number, l: number, x: TDouble, y: TDouble ) {
        let ro = this.vb * (this.va - this.arcLength( b ));     // полярные
        ro = Math.abs( ro );
        const sigma = l - this.AxisMeridian;          // координаты

        y.Value = -ro * Math.cos( sigma ) + this.FalseEast;      // прямоугольные
        x.Value = -ro * Math.sin( sigma ) + this.FalseNorth;     // координаты в метрах
    }

    //***************************************************************************
    //  Равновеликая цилиндрическая проекция Л А М Б Е Р Т А                    *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initLambertCylindricalEqualArea() {
        if ( this.FirstMainParallel < 0 ) {
            this.FirstMainParallel = -this.FirstMainParallel;
        }
        let temp = Math.cos( this.FirstMainParallel );
        if ( temp < 0.01 ) {
            temp = 0.01;
        }

        this.va = temp;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_LambertCylindricalEqualArea( x: number, y: number, b: TDouble, l: TDouble ) {
        y -= this.FalseEast;
        x -= this.FalseNorth;

        l.Value = y / this.MiddleRadius / this.va + this.AxisMeridian;

        let temp = x / this.MiddleRadius * this.va;
        if ( temp > 1 ) {
            temp = 1;
        } else if ( temp < -1 ) {
            temp = -1;
        }

        b.Value = Math.asin( temp );
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_LambertCylindricalEqualArea( b: number, l: number, x: TDouble, y: TDouble ) {
        x.Value = this.MiddleRadius * Math.sin( b ) / this.va + this.FalseNorth;               // прямоугольные
        y.Value = this.MiddleRadius * (l - this.AxisMeridian) * this.va + this.FalseEast;  // координаты в метрах
    }

    //***************************************************************************
    //  Равнопромежуточная цилиндрическая проекция                              *
    //***************************************************************************

    /**
     * Инициализация
     */
    private initCylindricalEqualSpaced() {
        // Вычисление постоянных по FirstMainParal
        this.va = this.parallelCurvatureRadius( this.FirstMainParallel ) * this.BigAxis; // this.MiddleRadius; // this.BigAxis; ???
        if ( this.va == 0 )
            this.va = 1;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_CylindricalEqualSpaced( x: number, y: number, b: TDouble, l: TDouble ) {
        y -= this.FalseEast;
        x -= this.FalseNorth;

        l.Value = y / this.va + this.AxisMeridian;  // долготу получили
        b.Value = TranslateConst.M_PI_4;               // начальное значение   45

        let sign = 0;
        if ( x < 0 ) {
            x = -x;
            sign = 1;
        }

        let abc, abegin, aend;
        abegin = 0;
        aend = TranslateConst.M_PI_2;  //начальный интервал 0--.--90
        for ( let i = 2; i < 18; i++ ) {
            // метод половинного деления
            abc = x - this.arcLength( b.Value );
            if ( abc < 0 ) {
                aend = b.Value;
                b.Value = (b.Value + abegin) / 2.;
            } else {
                abegin = b.Value;
                b.Value = (b.Value + aend) / 2.;
            }
            if ( Math.abs( abegin - aend ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        if ( sign == 0 )
            b.Value = (abegin + aend) / 2.0;
        else
            b.Value = -(abegin + aend) / 2.0;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_CylindricalEqualSpaced( b: number, l: number, x: TDouble, y: TDouble ) {
        if ( b >= 0 )
            x.Value = this.arcLength( b );                                   // прямоугольные
        else
            x.Value = -this.arcLength( -b );                                 // прямоугольные

        x.Value += this.FalseNorth;

        y.Value = this.va * (l - this.AxisMeridian) + this.FalseEast;          // координаты в метрах
    }

    //*****************************************************************************
    // (Прямая) равнопромежуточная коническая проекция секущий и касательный конус*
    //*****************************************************************************

    /**
     * Инициализация
     */
    private initConicalEquidistant() {
        let s1, s2;  // длина дуги от экватора
        let r1, r2;  // радиусы параллелей широт где маштабы равны 1

        if ( this.FirstMainParallel >= (Math.PI / 2. - 0.001) )
            this.FirstMainParallel = 89. * Math.PI / 180;
        if ( this.SecondMainParallel >= (Math.PI / 2. - 0.001) )
            this.SecondMainParallel = 89. * Math.PI / 180;

        // вычисление постоянных alva и cccc по FirstMainParal,SecondMainParal
        if ( this.FirstMainParallel == this.SecondMainParallel ) {
            // касательный конус
            this.va = Math.sin( this.FirstMainParallel );        // alva

            // this.vb = r1 / this.va + s1;
            this.vb = this.BigAxis * this.parallelCurvatureRadius( this.FirstMainParallel ) / this.va + this.arcLength( this.FirstMainParallel ); // cccc
        } else {
            // секущий  конус
            r1 = this.BigAxis * this.parallelCurvatureRadius( this.FirstMainParallel );
            r2 = this.BigAxis * this.parallelCurvatureRadius( this.SecondMainParallel );
            s1 = this.arcLength( this.FirstMainParallel );
            s2 = this.arcLength( this.SecondMainParallel );
            this.va = (r1 - r2) / (s2 - s1);
            this.vb = (r1 * s2 - r2 * s1) / (r1 - r2);
        }

        // вычисление нижней границы района по this.MainPointParallel
        this.vc = this.vb - this.arcLength( this.MainPointParallel );             // qqqq
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_ConicalEquidistant( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const X = this.vc - x;             // от полюса до точки
        let sigma = 0;
        if ( X != 0 ) {
            sigma = Math.atan( y / X );           // полярные
        }

        const ro = X / Math.cos( sigma );        // координаты

        l.Value = sigma / this.va + this.AxisMeridian;   // долготу получили

        const s1 = this.vb - ro;           // s1 длина дуги от экватора до широты b
        b.Value = TranslateConst.M_PI_4;                    // начальное значение   45
        let abegin = 0;
        let aend: number = TranslateConst.M_PI_2;          // начальный интервал 0--.--90

        for ( let i = 2; i < 32; i++ ) {
            const abc = s1 - this.arcLength( b.Value );
            if ( abc < 0 ) {
                aend = b.Value;
                b.Value = (b.Value + abegin) / 2.;
            } else {
                abegin = b.Value;
                b.Value = (b.Value + aend) / 2.;
            }

            if ( Math.abs( abegin - aend ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        b.Value = (abegin + aend) / 2.;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_ConicalEquidistant( b: number, l: number, x: TDouble, y: TDouble ) {
        const s1 = this.arcLength( b );      // s1 длина дуги от экватора до широты b
        const ro = this.vb - s1;                     // полярные
        const sigma = this.va * (l - this.AxisMeridian);  // координаты

        x.Value = this.vc - ro * Math.cos( sigma ) + this.FalseEast;   // прямоугольные
        y.Value = ro * Math.sin( sigma ) + this.FalseEast;   // координаты в метрах
    }

    //****************************************************************************
    //  (Прямая) равновеликая коническая проекция секущий конус                  *
    //****************************************************************************

    /**
     * Инициализация
     */
    private initConicalEqualArea() {
        if ( this.FirstMainParallel >= (Math.PI / 2. - 0.001) )
            this.FirstMainParallel = 89. * Math.PI / 180;
        if ( this.SecondMainParallel >= (Math.PI / 2. - 0.001) )
            this.SecondMainParallel = 89. * Math.PI / 180;

        let p1, p2; // площадь от экватора до широты с разностью долгот 1 гр
        let r1, r2; // радиусы параллелей широт где маштабы равны 1

        r1 = this.parallelCurvatureRadius( this.FirstMainParallel );
        p1 = this.trapeziumAreaOne( this.FirstMainParallel );

        if ( this.FirstMainParallel == this.SecondMainParallel ) {
            // касательный конус
            this.va = Math.sin( this.FirstMainParallel );                // alva
        } else {
            // вычисление постоянных по FirstMainParal SecondMainParal
            r2 = this.parallelCurvatureRadius( this.SecondMainParallel );
            p2 = this.trapeziumAreaOne( this.SecondMainParallel );  // 17/05/13

            this.va = 0.5 * (r1 * r1 - r2 * r2) / (p2 - p1);           // alva
        }

        if ( this.va == 0 )
            this.va = 0.001;

        this.vb = r1 * r1 * 2. / this.va + p1;                      // cccc

        // вычисление нижней границы района qqqq по this.MainPointParallel
        p1 = this.trapeziumAreaOne( this.MainPointParallel );

        this.vc = Math.sqrt( 2. * (this.vb - p1) / this.va );                                // qqqq
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_ConicalEqualArea( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const X = this.vc * this.BigAxis - x;                  // от полюса до точки
        const sigma = Math.atan( y / X );           // полярные
        const ro = X / Math.cos( sigma ) / this.BigAxis;   // координаты
        l.Value = sigma / this.va + this.AxisMeridian;        // долготу получили

        // p1 площадь от экватора до широты b
        const p1 = this.vb - ro * ro * this.va / 2.;

        b.Value = TranslateConst.M_PI_4;                 //начальное значение 45
        let abegin = 0;
        let aend: number = TranslateConst.M_PI_2;     //начальный интервал
        for ( let i = 2; i < 32; i++ ) {
            // метод половинного деления 35 итераций 9 знаков
            const abc = p1 - this.trapeziumAreaOne( b.Value );
            if ( abc < 0 ) {
                aend = b.Value;
                b.Value = (b.Value + abegin) / 2.;
            } else {
                abegin = b.Value;
                b.Value = (b.Value + aend) / 2.;
            }

            if ( Math.abs( abegin - aend ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }

        b.Value = (abegin + aend) / 2.;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_ConicalEqualArea( b: number, l: number, x: TDouble, y: TDouble ) {
        // площадь от экватора до широты b разность долгот 1 гр
        const p1 = this.trapeziumAreaOne( b );

        const ro = this.BigAxis * Math.sqrt( 2. * (this.vb - p1) / this.va );       // полярные
        const sigma = this.va * (l - this.AxisMeridian);             // координаты

        x.Value = this.vc * this.BigAxis - ro * Math.cos( sigma ) + this.FalseNorth;
        y.Value = ro * Math.sin( sigma ) + this.FalseEast;
    }

    //****************************************************************************
    // Производная  равновеликая  проекция А И Т О В А - Г А М Е Р А             *
    //****************************************************************************

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_Aitoff( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        let sigma;
        if ( x == 0 ) {
            sigma = 0;
        } else {
            sigma = Math.atan( 0.5 * y / x );                              // полярные
        }

        let temp = Math.cos( sigma );
        if ( temp == 0 ) {
            temp = 0.00001;
        }

        const ro = x / temp;                                       // координаты
        l.Value = sigma + this.AxisMeridian;                                 // долготу получили
        b.Value = TranslateConst.M_PI_2 - 2. * Math.asin( ro / (2 * this.MiddleRadius) );                  // vi=90-z(PoleLatitude?)
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Aitoff( b: number, l: number, x: TDouble, y: TDouble ) {
        const ro = 2. * this.MiddleRadius * Math.sin( (TranslateConst.M_PI_2 - b) / 2. );    // полярные
        const sigma = l - this.AxisMeridian;                     // координаты
        x.Value = ro * Math.cos( sigma ) + this.FalseNorth;                   // прямоугольные
        y.Value = 2. * ro * Math.sin( sigma ) + this.FalseEast;                 // координаты в метрах
    }

    //****************************************************************************
    // Гномоническая проекция                                                    *
    //****************************************************************************

    /**
     * Инициализация
     */
    private initGnomonic() {
        // Вычисление постоянных
        this.va = Math.sin( this.MainPointParallel );
        this.vb = Math.cos( this.MainPointParallel );

        // Область определения проекции в пределах +\- 60 градусов по радиусу
        this.vc = Math.PI / 3.;
        this.vd = this.vc * this.vc;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_Gnomonic( x: number, y: number, b: TDouble, l: TDouble ) {
        y -= this.FalseEast;
        x -= this.FalseNorth;

        let dr = (x * x + y * y);
        if ( dr == 0 ) {
            l.Value = this.AxisMeridian;
            b.Value = this.MainPointParallel;
            return;
        }

        dr = Math.sqrt( dr );
        const c = Math.atan( dr / this.BigAxis );
        const sinc = Math.sin( c );
        const cosc = Math.cos( c );

        l.Value = Math.atan( y * sinc / (dr * this.vb * cosc - x * this.va * sinc) ) + this.AxisMeridian;

        b.Value = cosc * this.va + x * sinc * this.vb / dr;

        if ( b.Value > 1 )
            b.Value = 1;
        else if ( b.Value < -1 )
            b.Value = -1;

        b.Value = Math.asin( b.Value );
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Gnomonic( b: number, l: number, x: TDouble, y: TDouble ) {
        let dl = l - this.AxisMeridian;
        let adl = dl;
        if ( adl < 0. ) {
            adl = -dl;
            if ( adl > Math.PI ) {
                dl += (Math.PI * 2.);
                adl -= (Math.PI * 2.);
            }
        } else {
            if ( adl > Math.PI ) {
                dl -= (Math.PI * 2.);
                adl -= (Math.PI * 2.);
            }
        }

        // Северное полушарие?
        if ( this.MainPointParallel > 0 ) {
            // По долготе дальше 90 градусов?
            if ( adl > Math.PI / 2. ) {
                // Другое полушарие по долготе
                b = Math.PI - b;
            }
        } else {
            // По долготе дальше 90 градусов?
            if ( adl > Math.PI / 2. ) {
                // Другое полушарие по долготе
                b = -Math.PI - b;
            }
        }

        const db = b - this.MainPointParallel;

        // Удаление больше 60 градусов?
        let temp = (dl * dl) + (db * db);
        if ( temp > this.vd ) {
            temp = Math.sqrt( temp );

            // Притянуть точку на границу проецирования по радиусу
            // в 60 градусов от полюса - грубо, пропорционально расстоянию в градусах
            dl = dl * this.vc / temp;
            // l = this.AxisMeridian + dl;
            b = this.MainPointParallel + db * this.vc / temp;
        }

        const cosb = Math.cos( b );
        const sinb = Math.sin( b );

        const cosbl = cosb * Math.cos( dl );
        const cosc = this.va * sinb + this.vb * cosbl;

        y.Value = this.BigAxis / cosc * cosb * Math.sin( dl ) + this.FalseEast;
        x.Value = this.BigAxis / cosc * (this.vb * sinb - this.va * cosbl) + this.FalseNorth;
    }

    //****************************************************************************
    // Проекция Бонне                                                            *
    //****************************************************************************

    /**
     * Инициализация
     * @returns
     */
    private initBonne() {
        if ( (this.MainPointParallel >= (Math.PI / 2. - TranslateConst.DELTANULL)) || (this.MainPointParallel <= (-Math.PI / 2. + TranslateConst.DELTANULL)) )
            this.MainPointParallel = 0;

        const sin1 = Math.sin( this.MainPointParallel );
        const cos1 = Math.cos( this.MainPointParallel );

        // На шаре
        if ( this.ExcentricMeridian == 0 ) {
            this.va = this.BigAxis;
            this.vb = this.BigAxis * cos1 / sin1;
            this.ksin2m = 0;
            this.ksin4m = 0;
            this.ksin6m = 0;
            this.ksin8m = 0;
            this.kf = 1;
            this.ksin2f = 0;
            this.ksin4f = 0;
            this.ksin6f = 0;
            return;
        }

        const se = Math.sqrt( 1 - this.E2 );
        this.ke1 = (1. - se) / (1. + se);
        const e1 = this.ke1;
        const e12 = e1 * e1;
        const e13 = e12 * e1;
        const e14 = e13 * e1;

        this.ksin2m = 3. * e1 / 2. - 27. * e13 / 32.;
        this.ksin4m = 21. * e12 / 16. - 55. * e14 / 32.;
        this.ksin6m = 151. * e13 / 96.;
        this.ksin8m = 1097. * e14 / 512.;

        const E4 = this.E2 * this.E2;
        const E6 = E4 * this.E2;

        this.kf = 1. - this.E2 / 4. - 3. * E4 / 64. - 5 * E6 / 256.;
        this.ksin2f = 3. * this.E2 / 8. + 3. * E4 / 32. + 45 * E6 / 1024;
        this.ksin4f = 15. * E4 / 256. + 45. * E6 / 1024.;
        this.ksin6f = 35. * E6 / 3072.;

        this.va = this.BigAxis * (this.kf * this.MainPointParallel - this.ksin2f * Math.sin( 2. * this.MainPointParallel ) +
            this.ksin4f * Math.sin( 4. * this.MainPointParallel ) - this.ksin6f * Math.sin( 6. * this.MainPointParallel ));

        const sin12 = sin1 * sin1;
        const temp12 = 1.0 - this.E2 * sin12;
        const m0 = cos1 / Math.sqrt( temp12 );
        this.vb = this.BigAxis * m0 / sin1;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_Bonne( x: number, y: number, b: TDouble, l: TDouble ) {
        y -= this.FalseEast;
        x -= this.FalseNorth;

        const temp = this.vb - x;
        let ro = y * y + temp * temp;
        if ( ro == 0 ) {
            b.Value = this.MainPointParallel;
            l.Value = this.AxisMeridian;
            return;
        }

        ro = Math.sqrt( ro );
        if ( this.MainPointParallel < 0 )
            ro = -ro;

        const M = this.vb + this.va - ro;
        const mu = M / (this.BigAxis * this.kf);

        b.Value = mu + this.ksin2m * Math.sin( 2. * mu ) + this.ksin4m * Math.sin( 4. * mu ) + this.ksin6m * Math.sin( 6. * mu ) + this.ksin8m * Math.sin( 8. * mu );

        if ( (b.Value >= (Math.PI / 2. - TranslateConst.DELTANULL)) || (b.Value <= (-Math.PI / 2. + TranslateConst.DELTANULL)) ) {
            l.Value = this.AxisMeridian;
            return;
        }

        const sinb = Math.sin( b.Value );
        const m = Math.cos( b.Value ) / Math.sqrt( 1. - this.E2 * sinb * sinb );

        l.Value = this.AxisMeridian + ro * Math.atan( y / temp ) / (this.BigAxis * m);
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Bonne( b: number, l: number, x: TDouble, y: TDouble ) {
        const cosb = Math.cos( b );
        const sinb = Math.sin( b );
        const m = cosb / Math.sqrt( 1. - this.E2 * sinb * sinb );
        const M = this.BigAxis * (this.kf * b - this.ksin2f * Math.sin( 2. * b ) + this.ksin4f * Math.sin( 4. * b ) - this.ksin6f * Math.sin( 6. * b ));

        const ro = this.vb + this.va - M;
        const T = this.BigAxis * m * (l - this.AxisMeridian) / ro;

        y.Value = ro * Math.sin( T ) + this.FalseEast;
        x.Value = this.vb - ro * Math.cos( T ) + this.FalseNorth;
    }

    //******************************************************************************
    // Полярная равноугольная азимутальная(стереографическая)проекция              *
    // параметры: FirstMainParal сохраняющая длины на паралели FirstMainParal      *
    //   пример:старостин стр 49 fi1=75 b=88 l=4 -> x=7.299,y=0.510 1:3 000 000    *
    //  карта полушария                                                            *
    //   ro=rk(1+coszk)tn(z/2)  или ro=c1*tn(z/2)    sigma=a    где zk=90-fi a =l  *
    //   x=rocos(sigma) y=rosin(sigma) ro=rk*(1+Math.cos(zk)) *tn(z/2) sigma=a          *
    //******************************************************************************

    /**
     * Инициализация
     */
    private initAzimuthalOrthomorphicPolar() {
        let mainparallel = this.FirstMainParallel;

        // вычисление постоянной this.va по FirstMainParal
        if ( mainparallel < 0 ) {
            mainparallel = -mainparallel;
        }

        this.va = Math.sqrt( this.firstVerticalCurvatureRadius( mainparallel ) * this.meridianCurvatureRadius( mainparallel ) ) * (1. + Math.cos( TranslateConst.M_PI_2 - mainparallel ));
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - геодезические координаты точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_AzimuthalOrthomorphicPolar( x: number, y: number, b: TDouble, l: TDouble ) {
        let ro, sigma;

        x -= this.FalseNorth;
        y -= this.FalseEast;

        if ( x == 0 ) {
            if ( y >= 0 ) {
                sigma = TranslateConst.M_PI_2;
            } else {
                sigma = (Math.PI + TranslateConst.M_PI_2);
            }
        } else if ( x > 0 ) {
            sigma = Math.PI - Math.atan( y / x );
        } else {
            sigma = Math.atan( y / -x );
        }

        ro = -x / Math.cos( sigma );            // полярные координаты

        if ( sigma > Math.PI ) {
            sigma = sigma - (2.0 * Math.PI);
        }

        // Северный полюс?
        if ( this.FirstMainParallel > 0 ) {
            l.Value = sigma + this.AxisMeridian;                    // долготу получили
            b.Value = TranslateConst.M_PI_2 - 2 * Math.atan( ro / this.va );
        } else {
            l.Value = Math.PI - sigma + this.AxisMeridian;            // долготу получили
            b.Value = 2 * Math.atan( ro / this.va ) - TranslateConst.M_PI_2;
        }

        if ( l.Value > Math.PI )
            l.Value -= 2 * Math.PI;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * const x,y - прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     * @returns
     */
    private bl2xy_AzimuthalOrthomorphicPolar( b: number, l: number, x: TDouble, y: TDouble ) {
        let ro, sigma;

        if ( (b >= Math.PI / 2) || (b <= -Math.PI / 2) ) {
            x.Value = this.FalseNorth;
            y.Value = this.FalseEast;
            return;
        }

        // Северный полюс?
        if ( this.FirstMainParallel > 0 ) {
            ro = this.va * Math.tan( (TranslateConst.M_PI_2 - b) / 2 );             // полярные
            sigma = l - this.AxisMeridian;                 // координаты
        } else {
            ro = this.va * Math.tan( (TranslateConst.M_PI_2 + b) / 2 );             // полярные
            sigma = Math.PI - l - this.AxisMeridian;          // координаты
        }

        x.Value = -ro * Math.cos( sigma ) + this.FalseNorth;
        y.Value = ro * Math.sin( sigma ) + this.FalseEast;
    }

    //******************************************************************************
    // Стереографическая проекция (ESRI Stereographic)                             *
    // описана в John P. Snyder (Map Projections - A Working Manual,               *
    // U.S. Geological Survey Professional Paper 1395, 1987)                       *
    //******************************************************************************

    /**
     * Инициализация
     */
    private initStereographic() {
        if ( this.FirstMainParallel == 0 ) {
            if ( this.MainPointParallel > 0 ) {
                if ( this.FirstMainParallel <= 0 )
                    this.FirstMainParallel = 71. * Math.PI / 180;
            } else {
                if ( this.FirstMainParallel >= 0 )
                    this.FirstMainParallel = -71. * Math.PI / 180;
            }
        }

        this.EDiv2 = this.ExcentricMeridian / 2.;

        const E4 = this.E2 * this.E2;
        const E6 = E4 * this.E2;
        const E8 = E6 * this.E2;

        this.va = this.E2 / 2. + E4 * 5. / 24. + E6 / 12 + E8 * 13. / 360;
        this.vb = E4 * 7. / 48. + E6 * 29. / 240 + E8 * 811. / 11520;
        this.vc = E6 * 7. / 120 + E8 * 81. / 1120;
        this.vd = E8 * 4279. / 161280;

        const sinB0 = Math.sin( this.FirstMainParallel );
        const esinB0 = this.ExcentricMeridian * sinB0;

        let t = 1 + this.ExcentricMeridian;
        const t1 = Math.pow( t, t );
        t = 1 - this.ExcentricMeridian;
        const t2 = Math.pow( t, t );
        this.ve = Math.sqrt( t1 * t2 );

        const mf = Math.cos( this.FirstMainParallel ) / Math.sqrt( 1. - this.E2 * sinB0 * sinB0 );
        let tf;

        if ( this.MainPointParallel > 0 )
            tf = Math.tan( TranslateConst.M_PI_4 - this.FirstMainParallel / 2. ) / Math.pow( (1. - esinB0) / (1. + esinB0), this.EDiv2 );
        else
            tf = Math.tan( TranslateConst.M_PI_4 + this.FirstMainParallel / 2. ) / Math.pow( (1. + esinB0) / (1. - esinB0), this.EDiv2 );

        this.RK02 = mf * this.ve / (2. * tf);
        this.RK02 = 2. * this.BigAxis * this.RK02;    // 2*a*k0
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - геодезические координаты точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_Stereographic( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        let ro1 = x * x + y * y;
        if ( ro1 < (TranslateConst.DELTANULL / 10) ) {
            b.Value = this.MainPointParallel;
            l.Value = this.AxisMeridian;
            return;
        }

        ro1 = Math.sqrt( x * x + y * y );

        const t1 = ro1 * this.ve / this.RK02;

        let ksi;

        if ( this.MainPointParallel > 0 ) {
            ksi = TranslateConst.M_PI_2 - 2. * Math.atan( t1 );
            l.Value = this.AxisMeridian + Math.atan2( y, -x );
        } else {
            ksi = 2. * Math.atan( t1 ) - TranslateConst.M_PI_2;
            l.Value = this.AxisMeridian + Math.atan2( y, x );
        }

        b.Value = ksi + this.va * Math.sin( 2. * ksi ) + this.vb * Math.sin( 4. * ksi ) + this.vc * Math.sin( 6 * ksi ) + this.vd * Math.sin( 8 * ksi );
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_Stereographic( b: number, l: number, x: TDouble, y: TDouble ) {
        const esinB = this.ExcentricMeridian * Math.sin( b );
        const l_l0 = l - this.AxisMeridian;
        const cosl_l0 = Math.cos( l_l0 );
        const sinl_l0 = Math.sin( l_l0 );

        let t;

        if ( this.MainPointParallel > 0 )
            t = Math.tan( TranslateConst.M_PI_4 - b / 2. ) / Math.pow( (1. - esinB) / (1. + esinB), this.EDiv2 );
        else
            t = Math.tan( TranslateConst.M_PI_4 + b / 2. ) / Math.pow( (1. + esinB) / (1. - esinB), this.EDiv2 );

        const ro = this.RK02 * t / this.ve;

        if ( this.MainPointParallel > 0 )
            x.Value = this.FalseNorth - ro * cosl_l0;
        else
            x.Value = this.FalseNorth + ro * cosl_l0;

        y.Value = this.FalseEast + ro * sinl_l0;
    }

    //******************************************************************************
    // Двойная стереографическая проекция                                          *
    // (Oblique and Equatorial Stereographic EPSG:9809 = ESRI Double Stereographic)*
    // описана в "Coordinate Conversions and Transformations including Formulas"   *
    // Guidance Note Number 7, part 2                                              *
    //******************************************************************************

    /**
     * Инициализация
     */
    private initDoubleStereographic() {
        this.EDiv2 = this.ExcentricMeridian / 2.;

        const SinB0 = Math.sin( this.MainPointParallel );
        const CosB0 = Math.cos( this.MainPointParallel );
        const R = this.BigAxis * Math.sqrt( 1. - this.E2 ) / (1. - this.E2 * SinB0 * SinB0);

        this.N = Math.sqrt( 1. + this.E2 * CosB0 * CosB0 * CosB0 * CosB0 / (1. - this.E2) );

        const S1 = (1. + SinB0) / (1. - SinB0);
        const S2 = (1. - this.ExcentricMeridian * SinB0) / (1. + this.ExcentricMeridian * SinB0);
        const w1 = Math.pow( S1 * Math.pow( S2, this.ExcentricMeridian ), this.N );
        const SinKsi = (w1 - 1.) / (w1 + 1.);

        this.C = (this.N + SinB0) * (1. - SinKsi) / ((this.N - SinB0) * (1. + SinKsi));
        const w2 = this.C * w1;

        this.SinKsi0 = (w2 - 1.) / (w2 + 1.);
        this.Ksi0 = Math.asin( this.SinKsi0 );
        this.CosKsi0 = Math.cos( this.Ksi0 );

        this.RK02 = 2. * R * this.ScaleFactor;

        this.G = this.RK02 * Math.tan( TranslateConst.M_PI_4 - this.Ksi0 / 2. );

        // По идее для this.Ksi0 = 45 градусов функция Math.tan должна падать,
        // но этого не происходит (получается 3e16)
        this.H = 4. * R * this.ScaleFactor * Math.tan( this.Ksi0 ) + this.G;
    }

    /**
     * Перевод прямоугольных координат в геодезические
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - геодезические координаты точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     */
    private xy2bl_DoubleStereographic( x: number, y: number, b: TDouble, l: TDouble ) {
        x -= this.FalseNorth;
        y -= this.FalseEast;

        const i = Math.atan( y / (this.H + x) );
        const j = Math.atan( y / (this.G - x) ) - i;

        const Ksi = this.Ksi0 + 2. * Math.atan( (x - y * Math.tan( j / 2. )) / this.RK02 );
        const D_D0 = j + 2. * i;

        l.Value = D_D0 / this.N + this.AxisMeridian;

        // Приводим долготу к диапазону от -180 до +180
        while ( l.Value < -Math.PI )
            l.Value += 2. * Math.PI;
        while ( l.Value > Math.PI )
            l.Value -= 2. * Math.PI;

        const SinKsi = Math.sin( Ksi );
        const Psi = 0.5 * Math.log( (1. + SinKsi) / (this.C * (1. - SinKsi)) ) / this.N;

        b.Value = 2. * Math.atan( Math.exp( Psi ) ) - TranslateConst.M_PI_2;

        // Олег сказал 40 итераций
        for ( let k = 0; k < 40; k++ ) {
            const SinB = Math.sin( b.Value );
            const ESinB = this.ExcentricMeridian * SinB;
            const NewPsi = Math.log( Math.tan( b.Value / 2. + TranslateConst.M_PI_4 ) * Math.pow( (1. - ESinB) / (1. + ESinB), this.EDiv2 ) );
            const DeltaB = (NewPsi - Psi) * Math.cos( b.Value ) * (1. - this.E2 * SinB * SinB) / (1. - this.E2);
            b.Value -= DeltaB;
            if ( Math.abs( DeltaB ) < TranslateConst.TRANSLATEPRECISION )
                break;
        }
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * x,y - прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_DoubleStereographic( b: number, l: number, x: TDouble, y: TDouble ) {
        const SinB = Math.sin( b );
        const Sa = (1. + SinB) / (1. - SinB);
        const ESinB = this.ExcentricMeridian * SinB;
        const Sb = (1. - ESinB) / (1. + ESinB);
        const W = this.C * Math.pow( Sa * Math.pow( Sb, this.ExcentricMeridian ), this.N );

        const SinKsi = (W - 1.) / (W + 1.);
        const Ksi = Math.asin( SinKsi );
        const CosKsi = Math.cos( Ksi );

        // В функциях Math.sin,Math.cos учитывается переход через 2Pi, поэтому
        // приведение к диапазону (-Pi..Pi) не требуется
        const D_D0 = this.N * (l - this.AxisMeridian);
        const CosD_D0 = Math.cos( D_D0 );
        const B = 1. + SinKsi * this.SinKsi0 + CosKsi * this.CosKsi0 * CosD_D0;

        y.Value = this.FalseEast + this.RK02 * CosKsi * Math.sin( D_D0 ) / B;
        x.Value = this.FalseNorth + this.RK02 * (SinKsi * this.CosKsi0 - CosKsi * this.SinKsi0 * CosD_D0) / B;
    }


    //******************************************************************************
    // Видоизмененная простая поликоническая проекция   (международная)            *
    //   параметры проекции:                                                       *
    //  FirstMainParal  SecondMainParal на этих параллелях сохраняется маштаб      *
    //              this.AxisMeridian  осевой меридиан листа                            *
    //  для обратного пересчета из  х у эти параметры тоже используются            *
    //  с чужой трапеции не надо подовати х у                                      *
    //  Похожа на Гаусса трапеции и номенклатура теже можно поправки к Гауссу ++   *
    //  Все меридианы проекции прямые линии Крайние параллели-окружности           *
    //  на широте 60 разрыв около 1500 метров между листов                         *
    //  2 меридиана отстоящие от среднего на  2 ( 4 8) градуса без искажений       *
    //  ( другое искажение маштабов не придусмотрено)                              *
    //  начало координат у каждой трапеции меньшая параллель и осевой меридиан     *
    //  пример  старостин стр 123   1:1 000 000                                    *
    //     справочник 95   старостин стр 122 соловьев стр 131   навигация стр100   *
    //******************************************************************************

    /**
     * Инициализация
     */
    private initModifiedPolyconical() {
        if ( this.FirstMainParallel >= (Math.PI / 2. - 0.001) )
            this.FirstMainParallel = 89. * Math.PI / 180;
        if ( this.SecondMainParallel >= (Math.PI / 2. - 0.001) )
            this.SecondMainParallel = 89. * Math.PI / 180;

        this.sinfi1 = Math.sin( this.FirstMainParallel );
        this.sinfi2 = Math.sin( this.SecondMainParallel );
        this.r1 = this.parallelCurvatureRadius( this.FirstMainParallel );
        this.r2 = this.parallelCurvatureRadius( this.SecondMainParallel );
        const s = this.arcLength( this.SecondMainParallel ) - this.arcLength( this.FirstMainParallel );

        // h=(0.999695-0.000305*Math.cos(data->SecondMainParal+data->FirstMainParal)) *s; // высота листа
        // h=( 1-10*(1-0.999695+0.000305*Math.cos(data->SecondMainParal+data->FirstMainParal))) *s;
        // h=s-10000*0.271*Math.cos((data->SecondMainParal+data->FirstMainParal)/2)*Math.cos((data->SecondMainParal+data->FirstMainParal)/2);
        // высота листа Соловьев стр 132  this.H=s-0.0006092s*cosfi*cosfi  в справочнике
        // тоже самое но подругому 0.0006092*s=271=k*1000 000
        this.hh = s - 10 * 0.0006092 * s * Math.cos( (this.SecondMainParallel + this.FirstMainParallel) / 2. ) * Math.cos( (this.SecondMainParallel + this.FirstMainParallel) / 2. );

        // не бют но с 10 для карты мира 1 1 000 000 укорочение совпало
        this.ll = 3. * Math.PI / 180.0;                                //3  гр по долготе влево и вправо
        if ( this.FirstMainParallel >= 60 * Math.PI / 180.0 )
            this.ll *= 2;    //6  гр  только для границы поиска
        if ( this.FirstMainParallel >= 76. * Math.PI / 180.0 )
            this.ll *= 2;    //12 гр    решения
    }


    /**
     * Перевод прямоугольных координат в геодезические
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - геодезические координаты точки в радианах
     * @param x
     * @param y
     * @param br
     * @param lr
     */
    private xy2bl_ModifiedPolyconical( x: number, y: number, br: TDouble, lr: TDouble ) {
        let l = 0;                      // начальное значение   45
        let abegin = -this.ll;
        let aend = this.ll;               // начальный интервал 0--.--90
        for ( let i = 2; i < 91; i++ ) {
            const l2 = l * l;
            const xs = l2 * 0.5 * this.sinfi1 * this.r1;                      // южная
            const ys = l * this.r1 * (1. - this.sinfi1 * this.sinfi1 * l2 / 6.0);  // параллель
            const xn = xs + this.hh;
            const yn = l * this.r2 * (1. - this.sinfi2 * this.sinfi2 * l2 / 6.0);

            const abc = -(x - xs) * (yn - ys) + (y - ys) * (xn - xs);
            if ( abc < 0 ) {
                aend = l;
                l = (l + abegin) / 2.;
            } else {
                abegin = l;
                l = (l + aend) / 2.;
            }

            if ( Math.abs( abegin - aend ) < TranslateConst.k10000 )
                break;
        }

        l = (abegin + aend) / 2.;
        const l2 = l * l;
        const xs = l2 * 0.5 * this.sinfi1 * this.r1;              // еще раз поточней
        const xn = xs + this.hh;                              // точки

        const lam = (xn - x) / (x - xs);
        br.Value = (this.SecondMainParallel + lam * this.FirstMainParallel) / (1. + lam);
        lr.Value = l + this.AxisMeridian;
    }

    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * const x,y - прямоугольные координаты точки в метрах
     * @param br
     * @param lr
     * @param x
     * @param y
     */
    private bl2xy_ModifiedPolyconical( br: number, lr: number, x: TDouble, y: TDouble ) {
        const l = lr - this.AxisMeridian;
        const xs = l * l * 0.5 * this.sinfi1 * this.r1;                       // южная
        const ys = l * this.r1 * (1. - this.sinfi1 * this.sinfi1 * l * l / 6.0);   // параллель

        const xn = xs + this.hh;
        const yn = l * this.r2 * (1. - this.sinfi2 * this.sinfi2 * l * l / 6.0);
        const lam = (br - this.FirstMainParallel) / (this.SecondMainParallel - br);

        x.Value = (xn * lam + xs) / (1. + lam);
        y.Value = (yn * lam + ys) / (1. + lam);
    }

    //**************************************************************************************
    //  Равнугольная поперечно-цилиндрическая проекция на секущем цилиндре Л А М Б Е Р Т А *
    //  параметры проекции: PoleLatitude PoleLongitude   координаты полюса                 *
    //  FirstMainParal (широта относительно старого полюса )                               *
    //  на этой параллели сохраняется главный маштаб                                       *
    //  начало координат в центре круга                                                    *
    //  х у координаты прямоугольные в метрах  х вверх у направо                           *
    //**************************************************************************************

    /**
     * Инициализация
     */
    private initTransverseCylindrical() {
        // this.alva = 5016316.173;   //   Подобрано
        this.alva = this.parallelCurvatureRadius( this.FirstMainParallel );
    }


    /**
     * Перевод прямоугольных координат в геодезические
     * Входные данные:
     * x,y - координаты точки в метрах
     * Выходные данные:
     * b,l - геодезические координаты точки в радианах
     * @param x
     * @param y
     * @param b
     * @param l
     * @returns
     */
    private xy2bl_TransverseCylindrical( x: number, y: number, b: TDouble, l: TDouble ) {
        const aai = x / this.alva;
        const zzi = 2. * Math.atan( Math.exp( y / this.alva ) );

        b.Value = Math.asin( Math.sin( zzi ) * Math.cos( aai ) );
        const z = Math.tan( aai ) * Math.tan( b.Value );

        if ( z > 1. ) {
            l.Value = Math.PI;
            return;
        } else if ( z < -1. ) {
            l.Value = 0.;
            return;
        }

        l.Value = Math.asin( z );

        if ( y < 0 )
            l.Value = 2 * Math.PI - l.Value;
        else if ( y > 0 )
            l.Value = Math.PI + l.Value;

        if ( l.Value > 2. * Math.PI )
            l.Value = l.Value - 2. * Math.PI;
    }


    /**
     * Перевод геодезических координат в прямоугольные
     * Входные данные:
     * b,l - геодезические координаты точки в радианах
     * Выходные данные:
     * const x,y - прямоугольные координаты точки в метрах
     * @param b
     * @param l
     * @param x
     * @param y
     */
    private bl2xy_TransverseCylindrical( b: number, l: number, x: TDouble, y: TDouble ) {
        const sinl = Math.sin( l );
        const cosb = Math.cos( b );
        const cosl = Math.cos( l );
        let zi = Math.acos( cosb * cosl );
        if ( zi < 0. ) {
            zi = zi + Math.PI;
        }

        const ai = Math.asin( cosb * sinl / Math.sin( zi ) );

        y.Value = this.alva * Math.log( Math.tan( zi / 2. ) );
        x.Value = this.alva * ai;
        x.Value = -x.Value;
    }

    /**
     * Прямая геодезическая задача
     * Для расстояния не более 250 км с ошибкой до 0,0001"
     * Триангуляция 1 класса
     * @param b1 {number} Широта начальной точки, градусы
     * @param l1 {number} Долгота начальной точки, градусы
     * @param angle1 {number} Угол задачи, градусы
     * @param distance {number} Расстояние задачи, метры
     * @return {DirectPositionResult} Результат, градусы
     */
    directGeodetic( b1: number, l1: number, angle1: number, distance: number ): DirectPositionResult {
        b1 = Trigonometry.toRadians( b1 );
        l1 = Trigonometry.toRadians( l1 );
        angle1 = Trigonometry.toRadians( angle1 );
        let b2 = 0, l2 = 0, angle2 = 0;
        if ( distance <= 0 ) {
            b2 = b1;
            l2 = l1;

            let da = Math.PI;
            if ( angle1 >= da ) {
                da -= da;
            }

            angle2 = angle1 + da;

            return {
                b: Trigonometry.toDegrees( b2 ),
                l: Trigonometry.toDegrees( l2 ),
                angle: Trigonometry.toDegrees( angle2 )
            };
        } else if ( distance < 30000 ) {
            return this.directGeodetic50( b1, l1, angle1, distance );
        } else {
            return this.directGeodetic250( b1, l1, angle1, distance );
        }
    }

    /**
     * Вычисление расстояния между двумя точками, заданными в геодезических координатах
     * @method distanceXY
     * @param b1 {number} Широта начальной точки, градусы
     * @param l1 {number} Долгота начальной точки, градусы
     * @param b2 {number} Широта конечной точки, градусы
     * @param l2 {number} Долгота конечной точки, градусы
     * @return {number} Результат, метры
     */
    distanceXY( b1: number, l1: number, b2: number, l2: number ): number {
        b1 = Trigonometry.toRadians( b1 );
        l1 = Trigonometry.toRadians( l1 );
        b2 = Trigonometry.toRadians( b2 );
        l2 = Trigonometry.toRadians( l2 );

        if ( l1 < 0 ) {                                      // Требует проверки для отрицательных L
            if ( (l2 < 0) || ((l2 - l1) < Math.PI) ) {
                l1 = l1 + 2.0 * Math.PI;
                l2 = l2 + 2.0 * Math.PI;
            } else
                l1 = l1 + 2.0 * Math.PI;
        } else if ( l2 < 0 ) {
            if ( (l1 - l2) < Math.PI ) {
                l1 = l1 + 2.0 * Math.PI;
                l2 = l2 + 2.0 * Math.PI;
            } else
                l2 = l2 + 2.0 * Math.PI;
        }

        // Пересчитать координаты в метры
        const b1d: TDouble = { Value: b1 };
        const l1d: TDouble = { Value: l1 };
        const b2d: TDouble = { Value: b2 };
        const l2d: TDouble = { Value: l2 };
        this.bl2xy_one( b1d, l1d );
        this.bl2xy_one( b2d, l2d );
        b1 = b1d.Value;
        b2 = b2d.Value;
        l1 = l1d.Value;
        l2 = l2d.Value;

        const dx = b1 - b2;
        const dy = l1 - l2;

        const distance = dx * dx + dy * dy;
        if ( distance < TranslateConst.DOUBLENULL )
            return 0;

        return Math.sqrt( distance );
    }

    /**
     * Вычисление азимута отрезка, заданного в геодезических координатах
     * @deprecated
     * @method _azimuthOld
     * @param b1 {number} Широта начальной точки, градусы
     * @param l1 {number} Долгота начальной точки, градусы
     * @param b2 {number} Широта конечной точки, градусы
     * @param l2 {number} Долгота конечной точки, градусы
     * @return {number} Результат, градусы
     */
    private _azimuthOld( b1: number, l1: number, b2: number, l2: number ): number {

        b1 = Trigonometry.toRadians( b1 );
        l1 = Trigonometry.toRadians( l1 );
        b2 = Trigonometry.toRadians( b2 );
        l2 = Trigonometry.toRadians( l2 );

        let bg = b1 + 0.01;
        let lg = l1;

        // Пересчитать координаты в метры
        const b1d: TDouble = { Value: b1 };
        const l1d: TDouble = { Value: l1 };
        const b2d: TDouble = { Value: b2 };
        const l2d: TDouble = { Value: l2 };
        const bgd: TDouble = { Value: bg };
        const lgd: TDouble = { Value: lg };
        this.bl2xy_one( b1d, l1d );
        this.bl2xy_one( bgd, lgd );
        this.bl2xy_one( b2d, l2d );
        b1 = b1d.Value;
        b2 = b2d.Value;
        l1 = l1d.Value;
        l2 = l2d.Value;
        bg = bgd.Value;
        lg = lgd.Value;

        const la1 = TTranslate.directionAngle( b1, l1, b2, l2 );
        let la2 = TTranslate.directionAngle( b1, l1, bg, lg );

        if ( la2 > Math.PI ) {
            la2 = la2 - 2 * Math.PI;
        }

        return Trigonometry.toDegrees( la1 - la2 );
    }

    /**
     * Обратная геодезической задача
     * @method inverseGeodetic
     * @param b1 {number} Широта начальной точки, градусы
     * @param l1 {number} Долгота начальной точки, градусы
     * @param b2 {number} Широта конечной точки, градусы
     * @param l2 {number} Долгота конечной точки, градусы
     * @return {InversePositionResult} Результат
     */
    inverseGeodetic( b1: number, l1: number, b2: number, l2: number ): InversePositionResult {
        const path = MapCalculations.buildOrthodrome( b1, l1, b2, l2 );

        const result = this.sideAzimuth( Trigonometry.toRadians( path[ 0 ][ 0 ] ), Trigonometry.toRadians( path[ 0 ][ 1 ] ), Trigonometry.toRadians( path[ 1 ][ 0 ] ), Trigonometry.toRadians( path[ 1 ][ 1 ] ) );
        const azimuthreverse = this.sideAzimuth( Trigonometry.toRadians( path[ 1 ][ 0 ] ), Trigonometry.toRadians( path[ 1 ][ 1 ] ), Trigonometry.toRadians( path[ 0 ][ 0 ] ), Trigonometry.toRadians( path[ 0 ][ 1 ] ) );
        return {
            azimuth: Trigonometry.toDegrees( result ),
            azimuthreverse: Trigonometry.toDegrees( azimuthreverse ),
            path
        };
    }

    /**
     * Вычисление азимута отрезка, заданного в геодезических координатах
     * @method sideAzimuth
     * @param b1 {number} Широта начальной точки, радианы
     * @param l1 {number} Долгота начальной точки, радианы
     * @param b2 {number} Широта конечной точки, радианы
     * @param l2 {number} Долгота конечной точки, радианы
     * @return {number} Результат, радианы
     */
    private sideAzimuth( b1: number, l1: number, b2: number, l2: number ): number {
        if ( l1 < 0 ) {
            if ( (l2 < 0) || ((l2 - l1) < Math.PI) ) {
                l1 = l1 + 2.0 * Math.PI;
                l2 = l2 + 2.0 * Math.PI;
            } else {
                l1 = l1 + 2.0 * Math.PI;
            }
        } else if ( l2 < 0 ) {
            if ( (l1 - l2) < Math.PI ) {
                l1 = l1 + 2.0 * Math.PI;
                l2 = l2 + 2.0 * Math.PI;
            } else {
                l2 = l2 + 2.0 * Math.PI;
            }
        }

        // Пересчитать координаты в метры
        const b1d: TDouble = { Value: b1 };
        const l1d: TDouble = { Value: l1 };
        const b2d: TDouble = { Value: b2 };
        const l2d: TDouble = { Value: l2 };

        this.bl2xy_one( b1d, l1d );
        this.bl2xy_one( b2d, l2d );

        b1 = b1d.Value;
        b2 = b2d.Value;
        l1 = l1d.Value;
        l2 = l2d.Value;

        return TTranslate.directionAngle( b1, l1, b2, l2 );
    }

    /**
     * Вычисление длины ломаной
     * @method calcPathLength
     * @param path {Vector2or3} Массив для вычисления длины (радианы) [[широта, долгота]]
     * @return {DirectPositionResult} Результат, метры
     */
    calcPathLength( path: Vector2or3[] ): number {
        const n = vec3.create();
        const _radiiSquared = vec3.create( [this.BigAxis, this.BigAxis, this.AlfaTo1 * this.BigAxis] );
        vec3.multiply( _radiiSquared, _radiiSquared );

        const geoCentricVectors = path.map( vector => {
            const latitude = vector[ 0 ];
            const longitude = vector[ 1 ];
            const height = vector[ 2 ] || 0;
            const cosF = Math.cos( latitude );

            vec3.setValues( n, cosF * Math.cos( longitude ), cosF * Math.sin( longitude ), Math.sin( latitude ) );

            const result = vec3.multiply( _radiiSquared, n, vec3.create() );
            const gamma = Math.sqrt( n[ 0 ] * result[ 0 ] + n[ 1 ] * result[ 1 ] + n[ 2 ] * result[ 2 ] );
            vec3.scale( result, 1 / gamma );
            vec3.scale( n, height );
            vec3.add( result, n );

            return result;
        } );

        let distance = 0;
        const curVec = vec3.create();
        for ( let i = 1; i < geoCentricVectors.length; i++ ) {
            distance += vec3.len( vec3.sub( geoCentricVectors[ i - 1 ], geoCentricVectors[ i ], curVec ) );
        }

        return distance;
    }

    // Вычисление дирекционного угла в радианах
    private static directionAngle( x1: number, y1: number, x2: number, y2: number ): number {
        if ( y1 == y2 ) {
            if ( x1 <= x2 )
                return 0;
            else
                return Math.PI;
        }

        if ( x1 == x2 ) {
            if ( y1 <= y2 )
                return (Math.PI * 0.5);
            else
                return (Math.PI * 1.5);
        }

        const alfa = Math.atan2( y2 - y1, x2 - x1 );

        if ( alfa < 0 )
            return (2 * Math.PI + alfa);

        return alfa;
    }

    /**
     * Прямая геодезическая задача
     * Для расстояния не более 60 км с ошибкой до 0,0001"
     * Триангуляция 1 класса
     * Способ вспомогательной точки по методу Красовского
     * @param b1 {number} Широта начальной точки, радианы
     * @param l1 {number} Долгота начальной точки, радианы
     * @param angle1 {number} Угол задачи, радианы
     * @param distance {number} Расстояние задачи, метры
     * @return {DirectPositionResult} Результат, градусы
     */
    private directGeodetic50( b1: number, l1: number, angle1: number, distance: number ): DirectPositionResult {

        const sina = Math.sin( angle1 );
        const cosa = Math.cos( angle1 );
        const sinb = Math.sin( b1 );

        const N1 = this.BigAxis / Math.sqrt( 1. - this.E2 * sinb * sinb );

        const rd = distance / N1;
        const u = rd * cosa;
        const v = rd * sina;

        const b = u * (1 + v * v / 3.);
        const c = v * (1 - u * u / 6.);

        const f0 = b1 + b; // * TranslateConst.RADSEC;
        const ta = c * Math.tan( f0 );

        let la = Math.cos( f0 );
        if ( la != 0 ) {
            la = c / la;
        } else {
            la = c * 1000000000;
        }

        const ta2 = ta * ta;
        const la2 = la * la;

        const d = c * ta / 2. * (1 - la2 / 12. - ta2 / 6.);

        const df = b - d;

        const cosb = Math.cos( b1 );
        const V1_2 = 1. + this.E2_2 * cosb * cosb;

        const db = V1_2 * df * (1. - 3. / 4. * this.E2_2 * Math.sin( 2. * b1 ) * df -    // Math.sqrt(this.E2_2) ???
            this.E2_2 / 2. * Math.cos( 2. * b1 ) * df * df);  // * RADSEC;
        const b2 = b1 + db;

        const dl = la * (1 - ta2 / 3.); // * RADSEC;
        const l2 = l1 + dl;

        let da = Math.PI;
        if ( angle1 >= da ) {
            da -= da;
        }

        const t = ta * (1. - la2 / 6. - ta2 / 6.);  // * RADSEC;
        const eps = b * c / 2. / V1_2;                // * RADSEC;
        const angle2 = angle1 + da + t - eps;

        return {
            b: Trigonometry.toDegrees( b2 ),
            l: Trigonometry.toDegrees( l2 ),
            angle: Trigonometry.toDegrees( angle2 )
        };
    }

    /**
     * Прямая геодезическая задача
     * Для расстояния не более 250 км с ошибкой до 0,0001"
     * Триангуляция 1 класса
     * Метод со средним аргументом
     * @param b1 {number} Широта начальной точки, радианы
     * @param l1 {number} Долгота начальной точки, радианы
     * @param angle1 {number} Угол задачи, радианы
     * @param distance {number} Расстояние задачи, метры
     * @return {DirectPositionResult} Результат, градусы
     */
    private directGeodetic250( b1: number, l1: number, angle1: number, distance: number ): DirectPositionResult {
        let b2 = 0, l2 = 0;
        let sina = Math.sin( angle1 );
        let sina2 = sina * sina;
        let cosa = Math.cos( angle1 );
        let cosb = Math.cos( b1 );

        const c = this.BigAxis / this.AlfaTo1;
        const spc = distance / c;
        const spc2 = spc * spc;

        let Vm = Math.sqrt( 1. + this.E2_2 * cosb * cosb );

        let db = Vm * Vm * Vm * spc * cosa;

        let dl = Vm * spc * sina / cosb;

        let dt = Vm * spc * sina * Math.tan( b1 );

        let bm = b1;
        let lm = l1;
        let am = angle1;


        let nu2;
        let Vm2;
        let temp;
        let t, t2;
        let cosa2;

        for ( let i = 0; i < 30; i++ ) {
            b2 = b1 + db / 2.;
            l2 = l1 + dl / 2.;
            am = angle1 + (dt / 2.);

            let ddb = b2 - bm;
            let ddl = l2 - lm;

            // Где-то 0,0002"
            if ( ddb < 0 ) {
                ddb = -ddb;
            }
            if ( ddl < 0 ) {
                ddl = -ddl;
            }
            if ( (ddb < 0.000000001) && (ddl < 0.000000001) ) {
                break;
            }

            bm = b2;
            lm = l2;

            sina = Math.sin( am );
            sina2 = sina * sina;
            cosa = Math.cos( am );
            cosa2 = cosa * cosa;
            cosb = Math.cos( bm );
            t = Math.tan( bm );
            t2 = t * t;

            Vm2 = 1. + this.E2_2 * cosb * cosb;
            nu2 = Vm2 - 1;
            Vm = Math.sqrt( Vm2 );

            temp = sina2 * (2. + 3. * t2 + 2. * nu2) +
                3. * nu2 * cosa2 * (t2 - 1. - nu2 - 4. * nu2 * t2);

            temp = 1. + Vm2 * spc2 / 24. * temp;
            db = Vm2 * Vm * spc * cosa * temp;

            temp = sina2 * t2 - cosa2 * (1. + nu2 - 9. * nu2 * t2);
            temp = 1. + Vm2 * spc2 / 24. * temp;
            dl = Vm * spc * sina / cosb * temp;

            temp = cosa2 * (2. + 7. * nu2 + 9. * nu2 * t2 + 5. * nu2 * nu2) +
                sina2 * (2. + t2 + 2. * nu2);
            temp = 1. + Vm2 * spc2 / 24. * temp;
            dt = Vm * spc * sina * t * temp;
        }

        b2 = b1 + db;
        l2 = l1 + dl;
        let da = Math.PI;
        if ( angle1 >= da ) {
            da -= da;
        }

        const angle2 = angle1 + da + dt;

        return {
            b: Trigonometry.toDegrees( b2 ),
            l: Trigonometry.toDegrees( l2 ),
            angle: Trigonometry.toDegrees( angle2 )
        };
    }

    /**
     * Получить название проекции по коду
     * @property projectionName
     * @returns {string}
     */
    get projectionName() {
        let text = '';
        switch ( this.ProjectionType ) {
            case MAPPROJECTION.WORLDMERCATOR:
                text = 'Web Mercator';
                break;
            case MAPPROJECTION.MERCATORMAP:
                text = 'Mercator WGS-84';
                break;
            case MAPPROJECTION.UTM:
                text = 'Transverse Mercator';
                break;
            case MAPPROJECTION.MILLERCYLINDRICAL:
                text = 'Miller Cylindrical';
                break;
            case MAPPROJECTION.UNDEFINED:
                break;
        }

        if ( this.EpsgCode !== 0 ) {
            const epsgCodeName = `EPSG:${this.EpsgCode}`;

            text += text ? `(${epsgCodeName})` : epsgCodeName;
        }

        return text || 'Undefined';
    }

    /**
     * Получить признак местной системы координат карты
     * @property isLocalCoordinateSystem
     * @returns {boolean}
     */
    get isLocalCoordinateSystem() {
        return this.EpsgCode > 65000;

    }

    /**
     * Получить признак поддержки геодезии
     * @property isGeoTransform
     * @returns {boolean}
     */
    get isGeoTransform(): boolean {
        return this.IsGeoSupported !== 0;
    }

}
