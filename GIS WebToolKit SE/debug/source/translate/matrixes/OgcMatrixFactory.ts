import OgcMatrix from '~/translate/matrixes/OgcMatrix';
import { TTranslate } from '~/translate/TTranslate';
import { COORDINATESYSTEM, MAPPROJECTION } from '~/translate/Enumrables';
import { Bounds } from '~/geometry/Bounds';
import { MapPoint } from '~/geometry/MapPoint';
import { MatrixDescription } from '~/translate/Types';
import ogcMatrixDescriptions from './ogcMatrixDescriptions.json';

export default class OgcMatrixFactory {

    static create( translate: Readonly<TTranslate> ): OgcMatrix {
        const matrixName = translate.ProjectionId;
        const description: MatrixDescription = (ogcMatrixDescriptions as { matrixList: MatrixDescription[] }).matrixList.find( description => description.Name === matrixName ) || OgcMatrixFactory.createMatrixDescription( translate );

        return new OgcMatrix( description );
    }


    private static createMatrixDescription( translate: Readonly<TTranslate> ): MatrixDescription {

        const Name = translate.ProjectionId;
        const Epsg = translate.EpsgCode;
        const Type = translate.isGeoSys() ? 2 : 1;

        const bounds = new Bounds( new MapPoint( 90, -180, 0, translate.ProjectionId ), new MapPoint( -90, 180, 0, translate.ProjectionId ) );

        if ( translate.IsGeoSupported ) {
            // Для границ метрических систем границы не больше 10 градусов
            if ( translate.getProjectionType() == MAPPROJECTION.GAUSSCONFORMAL ||
                translate.getProjectionType() == MAPPROJECTION.UTM ||
                translate.getCoordinateSystem() == COORDINATESYSTEM.SYSTEM_63 ) {
                const mer: number = translate.getAxisMeridian() * 180 / Math.PI;
                const delta: number = 10;
                if ( bounds.min.y < mer - delta ) {
                    bounds.min.y = mer - delta;
                }
                if ( bounds.max.y > mer + delta ) {
                    bounds.max.y = mer + delta;
                }
                bounds.min.x = 85.;
                bounds.max.x = -85.;
            }

            if ( !translate.isGeoSys() ) {
                bounds.toRadian();
                const planeFrame: Bounds | undefined = OgcMatrix.getPlaneFrameFromGeoFrame( bounds, translate );
                if ( !planeFrame ) {
                    throw Error( 'Cannot create matrix description' );
                }
                bounds.fromBounds( planeFrame );
                const val = bounds.max.x;
                bounds.max.x = bounds.min.x;
                bounds.min.x = val;
            }
        } else {
            bounds.fromBounds( translate.MapFrame );
            const val = bounds.max.x;
            bounds.max.x = bounds.min.x;
            bounds.min.x = val;
        }


        const Frame = {
            min: {
                x: bounds.min.x,
                y: bounds.min.y
            },
            max: {
                x: bounds.max.x,
                y: bounds.max.y
            }
        };

        const ScaleDenominator = [
            500000000,
            250000000,
            100000000,
            50000000,
            25000000,
            10000000,
            5000000,
            2500000,
            1000000,
            500000,
            250000,
            100000,
            50000,
            25000,
            10000,
            5000,
            2500,
            1000,
            500,
            250,
            100,
            50,
            25,
            10,
            5,
            2.5,
            1
        ];

        if ( !translate.IsGeoSupported ) {
            let delta = 100000 / translate.BaseScale;
            if ( delta > 1 ) {
                let koef = 1;
                while ( (delta = (delta / 2)) > 1 ) {
                    koef++;
                }
                for ( let ii: number = 0; ii < koef; ii++ ) {
                    ScaleDenominator.shift();
                }
            }
        }


        const TileSize = 256;
        const MinZoom = 0;
        const MaxZoom = 24;


        return { Name, Epsg, Type, Frame, ScaleDenominator, TileSize, MinZoom, MaxZoom };
    }

    /**
     * Зпросить размер тайла по матрице
     * @param matrixName имя матрицы
     * @returns
     */
    static getTileSizeByMatrix( matrixName: string ): number {

        const description = (ogcMatrixDescriptions as { matrixList: MatrixDescription[] }).matrixList.find( description => description.Name === matrixName );

        return description ? description.TileSize : 256;
    }

    /**
     * Зпросить код системы координат по матрице
     * @param matrixName имя матрицы
     * @returns
     */
    static getEpsgByMatrix( matrixName: string ): number {
        const description = (ogcMatrixDescriptions as { matrixList: MatrixDescription[] }).matrixList.find( description => description.Name === matrixName );

        return description ? description.Epsg : 0;
    }

}