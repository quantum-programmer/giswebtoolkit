import {
    AffinCoff,
    DatumParam,
    EllipsoidParam,
    LocalDatumParam,
    LocalTransform, MapRegisterEx, MatrixIdent,
    OffsetScaleRotate,
    TDouble, TranslateDescription
} from '~/translate/Types';
import { ContainsSomeOf } from '~/types/CommonTypes';
import { COORDINATESYSTEM, EllipsoideKind } from '~/translate/Enumrables';
import TranslateConst from '~/translate/TranslateConst';
import OgcMatrixFactory from '~/translate/matrixes/OgcMatrixFactory';
import { Bounds } from '~/geometry/Bounds';


export default class TranslateFactory {

    static createAffinCoff( params: ContainsSomeOf<AffinCoff> = {} ): AffinCoff {
        return { A0: 0, A1: 0, A2: 0, B0: 0, B1: 0, B2: 0, ...params };
    }

    static createEllipsoidParam( params: ContainsSomeOf<EllipsoidParam> = {} ): EllipsoidParam {
        return { SemiMajorAxis: 0, InverseFlattening: 0, ...params };
    }

    static createDatumParam( params: ContainsSomeOf<DatumParam> = {} ): DatumParam {
        return { DX: 0, DY: 0, DZ: 0, RX: 0, RY: 0, RZ: 0, M: 0, Count: 0, ...params };
    }

    static createLocalDatumParam( params: ContainsSomeOf<LocalDatumParam> = {} ): LocalDatumParam {
        return { DX: 0, DY: 0, DZ: 0, RX: 0, RY: 0, RZ: 0, M: 0, ...params };
    }

    static createMapRegisterEx( params: ContainsSomeOf<MapRegisterEx> = {} ): MapRegisterEx {
        return {
            Name: '',
            Scale: 0,
            EPSGCode: 0,
            EllipsoideKind: 0,
            HeightSystem: 0,
            MaterialProjection: 0,
            CoordinateSystem: 0,
            PlaneUnit: 0,
            HeightUnit: 0,
            FrameKind: 0,
            MapType: 0,
            DeviceCapability: 0,
            DataProjection: 0,
            ZoneIdent: 0,
            FlagRealPlace: 0,
            ZoneNumber: 0,
            FirstMainParallel: 0,
            SecondMainParallel: 0,
            AxisMeridian: 0,
            MainPointParallel: 0,
            PoleLatitude: 0,
            PoleLongitude: 0,
            FalseEasting: 0,
            FalseNorthing: 0,
            ScaleFactor: 0,
            TurnAngle: 0,
            ...params
        };
    }


    static createTDouble( Value = 0 ): TDouble {
        return { Value };
    }

    static createOffsetScaleRotate( params: ContainsSomeOf<OffsetScaleRotate> = {} ): OffsetScaleRotate {
        return { Angle: 0, Scale: 0, dX: 0, dY: 0, ...params };
    }

    static createLocalTransform( params: ContainsSomeOf<LocalTransform> = {} ): LocalTransform {
        return {
            Rotate: { Angle: 0, Scale: 0, dX: 0, dY: 0, ...params.Rotate },
            Affine: { A0: 0, A1: 0, A2: 0, B0: 0, B1: 0, B2: 0, ...params.Affine }
        };
    }

    static createDefaultDatumParam( ellipsoid: EllipsoideKind, system: number, param = TranslateFactory.createDatumParam() ): DatumParam {
        // Заполнение коэффициентов пересчета по умолчанию
        if ( ellipsoid == EllipsoideKind.KRASOVSKY42 ) {
            if ( system == COORDINATESYSTEM.SYSTEM_95 ) {
                param.Count = 7;
                param.DX = TranslateConst.DX_S95_WGS84;
                param.DY = TranslateConst.DY_S95_WGS84;
                param.DZ = TranslateConst.DZ_S95_WGS84;
                param.RX = TranslateConst.RX_S95_WGS84;
                param.RY = TranslateConst.RY_S95_WGS84;
                param.RZ = TranslateConst.RZ_S95_WGS84;
                param.M = TranslateConst.M_S95_WGS84;
            } else {
                param.Count = 7;
                param.DX = TranslateConst.DX_S42_WGS84;
                param.DY = TranslateConst.DY_S42_WGS84;
                param.DZ = TranslateConst.DZ_S42_WGS84;
                param.RX = TranslateConst.RX_S42_WGS84;
                param.RY = TranslateConst.RY_S42_WGS84;
                param.RZ = TranslateConst.RZ_S42_WGS84;
                param.M = TranslateConst.M_S42_WGS84;
            }
        } else if ( ellipsoid == EllipsoideKind.SGS_85 ) {
            // ПЗ-90.02
            param.Count = 7;
            param.DX = TranslateConst.DX_SGS85_WGS84;
            param.DY = TranslateConst.DY_SGS85_WGS84;
            param.DZ = TranslateConst.DZ_SGS85_WGS84;
            param.RX = TranslateConst.RX_SGS85_WGS84;
            param.RY = TranslateConst.RY_SGS85_WGS84;
            param.RZ = TranslateConst.RZ_SGS85_WGS84;
            param.M = TranslateConst.M_SGS85_WGS84;
        } else if ( ellipsoid == EllipsoideKind.SGS_85_2011 ) {
            // ПЗ-90.11
            param.Count = 7;
            param.DX = TranslateConst.DX_SGS85_11_WGS84;
            param.DY = TranslateConst.DY_SGS85_11_WGS84;
            param.DZ = TranslateConst.DZ_SGS85_11_WGS84;
            param.RX = TranslateConst.RX_SGS85_11_WGS84;
            param.RY = TranslateConst.RY_SGS85_11_WGS84;
            param.RZ = TranslateConst.RZ_SGS85_11_WGS84;
            param.M = TranslateConst.M_SGS85_11_WGS84;
        } else if ( ellipsoid == EllipsoideKind.GCK_2011_EE ) {
            // ГСК-2011
            param.Count = 7;
            param.DX = TranslateConst.DX_GCK2011_WGS84;
            param.DY = TranslateConst.DY_GCK2011_WGS84;
            param.DZ = TranslateConst.DZ_GCK2011_WGS84;
            param.RX = TranslateConst.RX_GCK2011_WGS84;
            param.RY = TranslateConst.RY_GCK2011_WGS84;
            param.RZ = TranslateConst.RZ_GCK2011_WGS84;
            param.M = TranslateConst.M_GCK2011_WGS84;
        } else {
            // Пересчет по умолчанию не выполняется
            param.Count = 0;
            param.DX = 0;
            param.DY = 0;
            param.DZ = 0;
            param.RX = 0;
            param.RY = 0;
            param.RZ = 0;
            param.M = 0;
        }

        return param;
    }


    static parseGetTranslateResponse( description: TranslateDescription ): {
        mapRegisterEx: MapRegisterEx, datum: DatumParam, ellipsoid: EllipsoidParam, translateParam: ContainsSomeOf<{
            SystemType: number;
            IsGeoSupported: 0 | 1;
            MapFrame: Bounds;
            BaseScale: number;
        }>
    } {
        const count = description.length;
        const mapRegisterEx: ContainsSomeOf<MapRegisterEx> = {};
        const ellipsoidParam: ContainsSomeOf<EllipsoidParam> = {};
        const datumParam: ContainsSomeOf<DatumParam> = {};
        const translateParam: ContainsSomeOf<{
            SystemType: number;
            IsGeoSupported: 0 | 1;
            MapFrame: Bounds;
            BaseScale: number;
        }> = {};
        for ( let i: number = 0; i < count; i++ ) {
            const param = description[ i ];
            switch ( param.name ) {
                case 'Name' :
                    mapRegisterEx.Name = param.value;
                    break;
                case 'Scale' :
                    mapRegisterEx.Scale = param.value;
                    break;
                case 'EPSGCode' :
                    mapRegisterEx.EPSGCode = param.value;
                    break;
                case 'EllipsoideKind' :
                    mapRegisterEx.EllipsoideKind = param.value;
                    break;
                case 'HeightSystem' :
                    mapRegisterEx.HeightSystem = param.value;
                    break;
                case 'MaterialProjection' :
                    mapRegisterEx.MaterialProjection = param.value;
                    break;
                case 'CoordinateSystem' :
                    mapRegisterEx.CoordinateSystem = param.value;
                    break;
                case 'PlaneUnit' :
                    mapRegisterEx.PlaneUnit = param.value;
                    break;
                case 'HeightUnit' :
                    mapRegisterEx.HeightUnit = param.value;
                    break;
                case 'FrameKind' :
                    mapRegisterEx.FrameKind = param.value;
                    break;
                case 'MapType' :
                    mapRegisterEx.MapType = param.value;
                    break;
                case 'DeviceCapability' :
                    mapRegisterEx.DeviceCapability = param.value;
                    break;
                case 'DataProjection' :
                    mapRegisterEx.DataProjection = param.value;
                    break;
                case 'ZoneIdent' :
                    mapRegisterEx.ZoneIdent = param.value;
                    break;
                case 'FlagRealPlace' :
                    mapRegisterEx.FlagRealPlace = param.value;
                    break;
                case 'ZoneNumber' :
                    mapRegisterEx.ZoneNumber = param.value;
                    break;
                case 'FirstMainParallel' :
                    mapRegisterEx.FirstMainParallel = param.value;
                    break;
                case 'SecondMainParallel' :
                    mapRegisterEx.SecondMainParallel = param.value;
                    break;
                case 'AxisMeridian' :
                    mapRegisterEx.AxisMeridian = param.value;
                    break;
                case 'MainPointParallel' :
                    mapRegisterEx.MainPointParallel = param.value;
                    break;
                case 'PoleLatitude' :
                    mapRegisterEx.PoleLatitude = param.value;
                    break;
                case 'PoleLongitude' :
                    mapRegisterEx.PoleLongitude = param.value;
                    break;
                case 'FalseEasting' :
                    mapRegisterEx.FalseEasting = param.value;
                    break;
                case 'ScaleFactor' :
                    mapRegisterEx.ScaleFactor = param.value;
                    break;
                case 'TurnAngle' :
                    mapRegisterEx.TurnAngle = param.value;
                    break;
                case 'DX' :
                    datumParam.DX = param.value;
                    break;
                case 'DY' :
                    datumParam.DY = param.value;
                    break;
                case 'DZ' :
                    datumParam.DZ = param.value;
                    break;
                case 'RX' :
                    datumParam.RX = param.value;
                    break;
                case 'RY' :
                    datumParam.RY = param.value;
                    break;
                case 'RZ' :
                    datumParam.RZ = param.value;
                    break;
                case 'M' :
                    datumParam.M = param.value;
                    break;
                case 'Count' :
                    datumParam.Count = param.value;
                    break;
                case 'SemiMajorAxis' :
                    ellipsoidParam.SemiMajorAxis = param.value;
                    break;
                case 'InverseFlattening' :
                    ellipsoidParam.InverseFlattening = param.value;
                    break;
                case 'SystemType' :
                    translateParam.SystemType = param.value;
                    break;
                case 'IsGeoSupported' :
                    translateParam.IsGeoSupported = param.value;
                    break;
                case 'MinX' :
                    if ( !translateParam.MapFrame ) {
                        translateParam.MapFrame = new Bounds();
                    }
                    translateParam.MapFrame.min.x = param.value;
                    break;
                case 'MinY' :
                    if ( !translateParam.MapFrame ) {
                        translateParam.MapFrame = new Bounds();
                    }
                    translateParam.MapFrame.min.y = param.value;
                    break;
                case 'MaxX' :
                    if ( !translateParam.MapFrame ) {
                        translateParam.MapFrame = new Bounds();
                    }
                    translateParam.MapFrame.max.x = param.value;
                    break;
                case 'MaxY' :
                    if ( !translateParam.MapFrame ) {
                        translateParam.MapFrame = new Bounds();
                    }
                    translateParam.MapFrame.max.y = param.value;
                    break;
                case 'BaseScale' :
                    translateParam.BaseScale = param.value;
                    break;

            }
        }

        return {
            mapRegisterEx: TranslateFactory.createMapRegisterEx( mapRegisterEx ),
            datum: TranslateFactory.createDatumParam( datumParam ),
            ellipsoid: TranslateFactory.createEllipsoidParam( ellipsoidParam ),
            translateParam
        };
    }


    static createMatrixIdent( crsIdent: string ): MatrixIdent {

        let LayerId, TileSize, Url, Crs;

        const idpos = crsIdent.indexOf( 'Id=' );
        const urlpos = crsIdent.indexOf( 'Url=' );


        if ( (idpos != -1) && (urlpos != -1) ) {
            LayerId = crsIdent.slice( idpos + 3, urlpos );
        } else {
            LayerId = '';
        }

        const tilepos = crsIdent.indexOf( 'TileSize=' );
        if ( tilepos != -1 ) {
            const stileSize = crsIdent.slice( tilepos + 9 );
            TileSize = +stileSize;
        } else {
            TileSize = OgcMatrixFactory.getTileSizeByMatrix( crsIdent );
        }

        if ( (idpos != -1) && (tilepos != -1) ) {
            Url = crsIdent.slice( urlpos + 4, tilepos );
        } else {
            Url = '';
        }

        const epsgpos = crsIdent.indexOf( 'EPSG=' );
        if ( epsgpos != -1 ) {
            const sCrs = crsIdent.slice( epsgpos + 5, tilepos );
            Crs = +sCrs;
        } else {
            Crs = OgcMatrixFactory.getEpsgByMatrix( crsIdent );
        }

        return { LayerId, TileSize, Url, Crs };
    }

}