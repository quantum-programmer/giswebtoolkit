/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Тайл высот                                  *
 *                                                                  *
 *******************************************************************/
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import Geodetic3D from '~/3d/engine/core/geodetic3d';
import Mesh, { MeshSerialized, PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { Projection } from '~/3d/engine/core/geometry/projection';
import { HeightTileDescription } from '~/3d/engine/worker/workerscripts/commandExecutors';
import { Vector2D, Vector3D } from '~/3d/engine/core/Types';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import Line2DCreator from '~/3d/engine/core/lines/line2d';
import { IntersectionTests } from '~/3d/engine/core/collisiondetection/collisiondetection';
import OrientedBoundingBox3D from '~/3d/engine/core/boundingvolumes/orientedbbox3d';
import BoundingBox3D from '~/3d/engine/core/boundingvolumes/bbox3d';
import BoundingSphere3D from '~/3d/engine/core/boundingvolumes/boundingsphere3d';
import { Calculate, vec2, vec3 } from '~/3d/engine/utils/glmatrix';
import { BoundingVolume3DSerialized } from '~/3d/engine/core/boundingvolumes/Types';

export type HeightTileSerialised = {
    timeStamp: number;
    heights?: number[];
    normals?: Vector3D[];
    mesh?: MeshSerialized;
    tileWidthMtr: number;
    tileHeightMtr: number;
    description: {
        tileWidth: number;
        tileHeight: number;
        level: number;
        maxHeight: number;
        minHeight: number;
        row: number;
        col: number;
    };
    deltaPlaneRad?: number;
    center?: Vector2D;
    obb?: BoundingVolume3DSerialized;
};

/**
 * Класс тайла высот
 * @class HeightTile
 * @param projection {Projection} Проекция слоя
 * @param description {HeightTileDescription} Описание тайла высот
 */
export default class HeightTile {
    timeStamp: number;
    heights?: number[];
    normals?: Vector3D[];
    mesh?: Mesh;
    json?: HeightTileSerialised;
    projection: Projection;
    obb?: OrientedBoundingBox3D | BoundingSphere3D;
    averageHeight = 0;


    tileWidth = 0;
    tileHeight = 0;
    level = -1;
    maxHeight = 0;
    minHeight = 0;
    identifier?: TileIdentifier;
    deltaHeightUnit = 0;
    row = -1;
    col = -1;
    tileWidthMtr = 0;
    tileHeightMtr = 0;
    deltaPlaneRad?: number;

    centerYX?: Vector2D;

    constructor( projection: Projection, description?: HeightTileDescription ) {
        this.timeStamp = Date.now();
        this.projection = projection;
        if ( description ) {
            this.tileWidth = description.Width;
            this.tileHeight = description.Height;
            this.level = description.Level;
            this.maxHeight = description.MaxValue;
            this.minHeight = description.MinValue;

            this.identifier = new TileIdentifier( description.Level, description.WidthNumber, description.HeightNumber );

            // this.averageHeight = (this.minHeight + this.maxHeight) * 0.5;
            this.averageHeight = this.minHeight;
            this.deltaHeightUnit = (this.maxHeight - this.minHeight) / 255;

            this.row = description.HeightNumber;
            this.col = description.WidthNumber;

            this.tileWidthMtr = this.projection.getTileWidthMtr( this.level );
            this.tileHeightMtr = this.projection.getTileHeightMtr( this.level );

            this.centerYX = this.projection.getCenterByIdentifier( this.identifier, [0, 0] );

            const centerX = this.centerYX[ 1 ];
            const centerY = this.centerYX[ 0 ];

            const x0 = centerX - 0.5 * this.tileWidthMtr;
            const y0 = centerY - 0.5 * this.tileHeightMtr;

            const x1 = centerX + 0.5 * this.tileWidthMtr;
            const y1 = centerY + 0.5 * this.tileHeightMtr;


            const positions = HeightTile.mGeoPositions;
            positions.length = 0;

            positions.push( this.projection.xy2geo( y0, x0, this.minHeight ) );
            positions.push( this.projection.xy2geo( y1, x1, this.minHeight ) );
            positions.push( this.projection.xy2geo( y0, x1, this.minHeight ) );
            positions.push( this.projection.xy2geo( y1, x0, this.minHeight ) );
            positions.push( this.projection.xy2geo( y0, x0, this.maxHeight ) );
            positions.push( this.projection.xy2geo( y1, x1, this.maxHeight ) );
            positions.push( this.projection.xy2geo( y0, x1, this.maxHeight ) );
            positions.push( this.projection.xy2geo( y1, x0, this.maxHeight ) );

            positions.push( this.projection.xy2geo( centerY, centerX, this.minHeight ) );
            positions.push( this.projection.xy2geo( centerY, centerX, this.maxHeight ) );


            positions.push( this.projection.xy2geo( y0, centerX, this.minHeight ) );
            positions.push( this.projection.xy2geo( y1, centerX, this.minHeight ) );
            positions.push( this.projection.xy2geo( centerY, x1, this.minHeight ) );
            positions.push( this.projection.xy2geo( centerY, x0, this.minHeight ) );

            positions.push( this.projection.xy2geo( y0, centerX, this.maxHeight ) );
            positions.push( this.projection.xy2geo( y1, centerX, this.maxHeight ) );
            positions.push( this.projection.xy2geo( centerY, x1, this.maxHeight ) );
            positions.push( this.projection.xy2geo( centerY, x0, this.maxHeight ) );


            this.deltaPlaneRad = Math.abs( positions[ 0 ].getLongitude() - positions[ 1 ].getLongitude() ) / description.Width;
            this.deltaPlaneRad = Math.min( Math.abs( positions[ 0 ].getLatitude() - positions[ 1 ].getLatitude() ) / description.Height, this.deltaPlaneRad );

            const vectorList = HeightTile.mVectorPositions;
            vectorList.length = 0;
            for ( let i = 0; i < positions.length; i++ ) {
                vectorList[ i ] = this.projection.getGlobeShape().toVector3d( positions[ i ] );
            }
            if ( this.row === 0 ) {
                vectorList.push( this.projection.getGlobeShape().toVector3d( new Geodetic3D( 0, Math.PI / 2, 0 ) ) );
            }
            if ( this.row === this.projection.getColCount( this.level ) - 1 ) {
                vectorList.push( this.projection.getGlobeShape().toVector3d( new Geodetic3D( 0, -Math.PI / 2, 0 ) ) );
            }

            if ( this.row === 0 && this.col === 0 && this.level === this.projection.getMinimumTileLevel() ) {
                vectorList.push( this.projection.getGlobeShape().toVector3d( new Geodetic3D( -Math.PI / 2, 0, 0 ) ) );
                vectorList.push( this.projection.getGlobeShape().toVector3d( new Geodetic3D( Math.PI / 2, 0, 0 ) ) );
            }

            const bbox3d = new BoundingBox3D();
            bbox3d.fitPoints( vectorList );

            const center = bbox3d.getCenter();

            let axisFlag = true;

            let zAxis = vec3.normalize( center );
            if ( vec3.len( zAxis ) === 0 ) {
                axisFlag = false;
            }
            let xAxis = vec3.normalize( vec3.sub( vectorList[ 2 ], vectorList[ 0 ], vec3.create() ) );
            if ( !axisFlag || vec3.len( xAxis ) === 0 ) {
                axisFlag = false;
            }
            let axis;
            if ( axisFlag ) {
                axis = {
                    zAxis: zAxis,
                    xAxis: xAxis
                };
            }
            const obb = new OrientedBoundingBox3D( axis );
            obb.fitPoints( vectorList );
            this.setOBB( obb );
        }
    }

    /**
     * Вспомогательный массив
     * @static
     * @property {array} mSupport
     */
    static mSupport: [[0, 0, 1], Vector3D, Vector3D, Vector3D, Vector3D, Vector3D] = [[0, 0, 1], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    static mGeoPositions: Geodetic3D[] = [];
    static mVectorPositions: Vector3D[] = [];
    static mVector2dPositions: Vector2D[] = [];
    /**
     * Вспомогательный массив
     * @static
     * @property {array} mMeshSupport
     */
    static mMeshSupport: [Vector2D, Vector2D, Vector3D, Vector3D[], Vector3D, Vector3D, Vector3D, Vector3D, Vector3D, Vector3D, Vector3D, Vector3D, Vector3D] = [
        [0, 0], [0, 0], [0, 0, 0], [],
        [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
        [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]
    ];

    private static readonly centerPoint = vec3.create();

    /**
     * Получить высоту по номерам точки
     * @method getHeightByXY
     * @private
     * @param x {number} Номер точки по горизонтали
     * @param y {number} Номер точки по вертикали
     * @return {number|undefined} Высота в точке
     */
    private getHeightByXY( x: number, y: number ) {
        if ( !this.heights ) {
            return this.averageHeight;
        } else {
            y = this.tileHeight - 1 - y;
            const byteHeight = this.heights[ x + y * this.tileWidth ];
            if ( byteHeight !== undefined ) {
                return Math.round( byteHeight * this.deltaHeightUnit ) + this.minHeight;
            }
        }
    }

    /**
     * Получить высоту по номерам точки
     * @method getByteHeightByXY
     * @private
     * @param x {number} Номер точки по горизонтали
     * @param y {number} Номер точки по вертикали
     * @return {number} Высота в точке
     */
    private getByteHeightByXY( x: number, y: number ) {
        if ( !this.heights ) {
            return this.averageHeight;
        }
        y = this.tileHeight - 1 - y;
        return this.heights[ x + y * this.tileWidth ];
    }

    /**
     * Получить нормаль по номерам точки
     * @method getNormalByXY
     * @private
     * @param x {number} Номер точки по горизонтали
     * @param y {number} Номер точки по вертикали
     * @return {Vector3D} Нормаль в точке
     */
    private getNormalByXY( x: number, y: number ) {
        if ( !this.normals ) {
            return vec3.create( vec3.UNITZ );
        }
        y = this.tileHeight - 1 - y;
        return this.normals[ x + y * this.tileWidth ];
    }

    /**
     * Получить высоту в точке
     * @method getHeightInPoint
     * @param geoPoint {Geodetic3D} Геодезические координаты точки
     * @param [allowAverageValue] {boolean} Получать среднюю высоту, если нет данных
     * @return {number|undefined} Высота в точке
     */
    getHeightInPoint( geoPoint: Geodetic3D, allowAverageValue?: boolean ) {
        if ( !this.heights ) {
            return this.averageHeight;
        }
        const pointXY = this.projection.geo2xy( geoPoint );

        const topLeft = this.projection.getTopLeft();

        const xL = topLeft.y + this.tileWidthMtr * this.col;
        const yT = topLeft.x - this.tileHeightMtr * (this.row + 1);


        const dY = Math.round( (this.tileHeight - 1) * (pointXY[ 0 ] - yT) / this.tileHeightMtr );
        const dX = Math.round( (this.tileWidth - 1) * (pointXY[ 1 ] - xL) / this.tileWidthMtr );

        let value;
        if ( dX >= 0 && dX < this.tileWidth && dY >= 0 && dY < this.tileHeight ) {
            value = this.getHeightByXY( dX, dY );
        } else if ( allowAverageValue ) {
            value = this.averageHeight;
        }
        return value;
    }

    /**
     * Получить высоту в точке интреполированные
     * @method getHeightInPointAccurate
     * @param geoPoint {Geodetic3D} Геодезические координаты точки
     * @return {number|undefined} Высота в точке
     */
    getHeightInPointAccurate( geoPoint: Geodetic3D ) {
        if ( !this.heights ) {
            return this.averageHeight;
        }
        const pointXY = this.projection.geo2xy( geoPoint );

        const topLeft = this.projection.getTopLeft();

        const xL = topLeft.y + this.tileWidthMtr * this.col;
        const yT = topLeft.x - this.tileHeightMtr * (this.row + 1);

        const dY = (this.tileHeight - 1) * (pointXY[ 0 ] - yT) / this.tileHeightMtr;
        const dX = (this.tileWidth - 1) * (pointXY[ 1 ] - xL) / this.tileWidthMtr;

        let value;
        if ( dX >= 0 && dX <= this.tileWidth - 1 && dY >= 0 && dY <= this.tileHeight - 1 ) {
            const dY_min = Math.floor( dY );
            const dY_max = Math.ceil( dY );
            const dX_min = Math.floor( dX );
            const dX_max = Math.ceil( dX );

            const bottomLeftWeight = (1 - (dY - dY_min)) * (1 - (dX - dX_min));
            const topLeftWeight = (1 - (dY_max - dY)) * (1 - (dX - dX_min));
            const bottomRightWeight = (1 - (dY - dY_min)) * (1 - (dX_max - dX));
            const topRightWeight = (1 - (dY_max - dY)) * (1 - (dX_max - dX));

            value = 0;
            let height = this.getHeightByXY( dX_min, dY_min );
            if ( height !== undefined ) {
                value += height * bottomLeftWeight;
            }
            height = this.getHeightByXY( dX_min, dY_max );
            if ( height !== undefined ) {
                value += height * topLeftWeight;
            }
            height = this.getHeightByXY( dX_max, dY_min );
            if ( height !== undefined ) {
                value += height * bottomRightWeight;
            }
            height = this.getHeightByXY( dX_max, dY_max );
            if ( height !== undefined ) {
                value += height * topRightWeight;
            }
        }

        return value;
    }

    /**
     * Получить интерполированную высоту в точке
     * @method getHeightInPointInterpolated
     * @param geoPoint {Geodetic3D} Геодезические координаты точки
     * @return {number} Высота в точке
     */
    getHeightInPointInterpolated( geoPoint: Geodetic3D ) {
        if ( !this.heights ) {
            return this.averageHeight;
        }

        const xIndexMaxValue = this.tileWidth - 1;
        const yIndexMaxValue = this.tileHeight - 1;


        const pointXY = this.projection.geo2xy( geoPoint );

        const topLeft = this.projection.getTopLeft();

        const xL = topLeft.y + this.tileWidthMtr * this.col;
        const yT = topLeft.x - this.tileHeightMtr * (this.row + 1);

        let dY = yIndexMaxValue * (pointXY[ 0 ] - yT) / this.tileHeightMtr;
        let dX = xIndexMaxValue * (pointXY[ 1 ] - xL) / this.tileWidthMtr;

        if ( Math.abs( dY ) < 1e-6 ) {
            dY = 0;
        }

        if ( Math.abs( dX ) < 1e-6 ) {
            dX = 0;
        }

        if ( dY < 0 ) {
            dY = 0;
        } else if ( dY > yIndexMaxValue ) {
            dY = yIndexMaxValue;
        }

        if ( dX < 0 ) {
            dX = 0;
        } else if ( dX > xIndexMaxValue ) {
            dX = xIndexMaxValue;
        }

        const dXMin = Math.floor( dX );
        const dYMin = Math.floor( dY );

        const dXr = dX - dXMin;
        const dYr = dY - dYMin;

        const height1 = this.getHeightByXY( dXMin, dYMin ) || 0;
        let height2, height3;
        if ( dXMin + 1 <= xIndexMaxValue && dYMin + 1 <= yIndexMaxValue ) {
            height2 = this.getHeightByXY( dXMin + 1, dYMin + 1 ) || 0;
        } else {
            height2 = height1;
        }

        const top = (dYr - dXr > 0);

        const normal1 = HeightTile.mSupport[ 1 ];
        const normal2 = HeightTile.mSupport[ 2 ];
        const normal3 = HeightTile.mSupport[ 3 ];

        let planeNormal;
        if ( top ) {
            if ( dYMin + 1 <= yIndexMaxValue ) {
                height3 = this.getHeightByXY( dXMin, dYMin + 1 ) || 0;
            } else {
                height3 = height1;
            }
            normal1[ 0 ] = dXMin;
            normal1[ 1 ] = dYMin;
            normal1[ 2 ] = height1;

            normal2[ 0 ] = dXMin + 1;
            normal2[ 1 ] = dYMin + 1;
            normal2[ 2 ] = height2;

            normal3[ 0 ] = dXMin;
            normal3[ 1 ] = dYMin + 1;
            normal3[ 2 ] = height3;

            planeNormal = vec3.normalize( Calculate.calcNormal( normal1, normal2, normal3, HeightTile.mSupport[ 5 ] ), HeightTile.mSupport[ 5 ] );
        } else {
            if ( dXMin + 1 <= xIndexMaxValue ) {
                height3 = this.getHeightByXY( dXMin + 1, dYMin ) || 0;
            } else {
                height3 = height1;
            }

            normal1[ 0 ] = dXMin;
            normal1[ 1 ] = dYMin;
            normal1[ 2 ] = height1;

            normal2[ 0 ] = dXMin + 1;
            normal2[ 1 ] = dYMin;
            normal2[ 2 ] = height3;

            normal3[ 0 ] = dXMin + 1;
            normal3[ 1 ] = dYMin + 1;
            normal3[ 2 ] = height2;
            planeNormal = vec3.normalize( Calculate.calcNormal( normal1, normal2, normal3, HeightTile.mSupport[ 5 ] ), HeightTile.mSupport[ 5 ] );
        }

        const d = -(planeNormal[ 0 ] * dXMin + planeNormal[ 1 ] * dYMin + planeNormal[ 2 ] * height1);

        const rayOrigin = HeightTile.mSupport[ 4 ];
        rayOrigin[ 0 ] = dX;
        rayOrigin[ 1 ] = dY;
        rayOrigin[ 2 ] = Math.min( height1, height2, height3 );

        const point = IntersectionTests.tryRayPlane( rayOrigin, HeightTile.mSupport[ 0 ], planeNormal, d );

        if ( point !== undefined ) {
            return point[ 2 ];
        } else {
            return (height1 + height2 + height3) / 3;
        }
    }

    /**
     * Получить относительные координаты в точке
     * @method getIndicesByGeoPoint
     * @param geo {Geodetic3D} Геодезические координаты точки
     * @return {Vector2D} Относительные координаты в точке [x, y]
     */
    getIndicesByGeoPoint( geo: Geodetic3D ) {
        const pointXY = this.projection.geo2xy( geo );
        const topLeft = this.projection.getTopLeft();
        const xL = topLeft.y + this.tileWidthMtr * this.col;
        const yT = topLeft.x - this.tileHeightMtr * (this.row + 1);

        const dY = (this.tileHeight - 1) * (pointXY[ 0 ] - yT) / this.tileHeightMtr;
        const dX = (this.tileWidth - 1) * (pointXY[ 1 ] - xL) / this.tileWidthMtr;

        return vec2.setValues( vec2.create(), dX, dY );
    }

    /**
     * Получить геодезические координаты по относительным
     * @method getGeoPointByIndices
     * @param pointXY {Vector2D|Vector3D} Параметры в точке [x, y, h?]
     * @return geo {Geodetic3D} Геодезические координаты точки
     */
    getGeoPointByIndices( pointXY: Vector2D | Vector3D ) {
        const topLeft = this.projection.getTopLeft();
        const xL = topLeft.y + this.tileWidthMtr * this.col;
        const yT = topLeft.x - this.tileHeightMtr * (this.row + 1);

        const pointMtrXY = [
            pointXY[ 0 ] * this.tileWidthMtr / (this.tileWidth - 1) + xL,
            pointXY[ 1 ] * this.tileHeightMtr / (this.tileHeight - 1) + yT
        ];

        return this.projection.xy2geo( pointMtrXY[ 1 ], pointMtrXY[ 0 ], pointXY[ 2 ] );
    }

    /**
     * Установить масив высот
     * @method setHeights
     * @param heightsArray {array} Массив высот
     */
    setHeights( heightsArray: number[] ) {
        this.heights = heightsArray;
    }

    /**
     * Подготовить меш
     * @method prepareMesh
     * @return {Mesh} Меш
     */
    prepareMesh() {
        if ( !this.mesh && this.centerYX ) {
            const center = this.getCenter();
            for ( let i = 0; i < HeightTile.mMeshSupport.length; i++ ) {
                HeightTile.mMeshSupport[ i ].length = 0;
            }

            const bottomLeftYX = HeightTile.mMeshSupport[ 0 ];

            const topRightYX = HeightTile.mMeshSupport[ 1 ];
            const topLeft = this.projection.getTopLeft();
            const xyDeltaX = this.tileWidthMtr * 0.5;
            const xyDeltaY = this.tileHeightMtr * 0.5;
            const centerXY = this.centerYX;

            bottomLeftYX[ 0 ] = centerXY[ 0 ] - xyDeltaY;
            bottomLeftYX[ 1 ] = centerXY[ 1 ] - xyDeltaX;

            topRightYX[ 0 ] = centerXY[ 0 ] + xyDeltaY;
            topRightYX[ 1 ] = centerXY[ 1 ] + xyDeltaX;

            const northPole = Math.abs( topRightYX[ 0 ] + topLeft.y ) < 0.000001;
            const southPole = Math.abs( bottomLeftYX[ 0 ] - topLeft.y ) < 0.000001;

            const result = this.preparePositions( center, bottomLeftYX, topRightYX, southPole, northPole );
            if ( !this.normals ) {
                this.normals = this.prepareNormals( result.positions, center );
            }
            // const maxHeight = this.maxHeight;
            // if (northPole) {
            //     maxHeight = Math.max(vec3.len(vec3.sub(center, this.projection.getGlobeShape().toVector3d(new Geodetic3D(0, Math.PI / 2, 0),[]))), maxHeight);
            // } else if (southPole) {
            //     maxHeight = Math.max(vec3.len(vec3.sub(center, this.projection.getGlobeShape().toVector3d(new Geodetic3D(0, -1 * Math.PI / 2, 0), []))), maxHeight);
            // }
            // result.maxHeight = maxHeight;

            const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
            positionsAttribute.setValues( result.positions );

            const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
            normalsAttribute.setValues( this.normals );

            const textureAttribute = new VertexAttribute( 'aTextureCoord', VertexAttributeType.Float, 2 );
            textureAttribute.setValues( result.textureCoords );

            const indices = new Indices( IndicesType.uShort );
            indices.add( this.prepareIndices() );
            indices.validateType();

            const mesh = new Mesh();
            mesh.addAttribute( positionsAttribute );
            mesh.addAttribute( normalsAttribute );
            mesh.addAttribute( textureAttribute );
            mesh.setIndices( indices );
            mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
            mesh.setPrimitiveType( PrimitiveType.Triangles );
            this.mesh = mesh;
        }
        return this.mesh;
    }

    /**
     * Создать дочерний тайл
     * @method createHeightChildTile
     * @param identifier {TileIdentifier} Идентификатор тайла
     * @return {HeightTile} Тайл высот
     */
    createHeightChildTile( identifier: TileIdentifier ) {

        const childCol = identifier.getX();
        const childRow = identifier.getY();

        let horChildDelta = 1;
        let verChildDelta = 1;

        let childWidth = HeightTile.getHorPlaneCount( this.tileWidth ) / 2 + 1;
        let childHeight = HeightTile.getVerPlaneCount( this.tileHeight ) / 2 + 1;

        const existVerticesHorCount = HeightTile.getHorPlaneCount( this.tileWidth ) / 2;
        if ( existVerticesHorCount === 1 ) {
            horChildDelta = 0.5;
            childWidth = 3;
        }
        const existVerticesVerCount = HeightTile.getVerPlaneCount( this.tileHeight ) / 2;
        if ( existVerticesVerCount === 1 ) {
            verChildDelta = 0.5;
            childHeight = 3;
        }

        const horStart = Math.round( childCol / 2 - this.col ) * existVerticesHorCount;
        const verStart = Math.round( childRow / 2 - this.row ) * existVerticesVerCount;

        const horEnd = Math.round( childCol / 2 - this.col + 1 ) * existVerticesHorCount;
        const verEnd = Math.round( childRow / 2 - this.row + 1 ) * existVerticesVerCount;
        const heights: number[] = [];
        for ( let ver = verStart, y = 0; ver <= verEnd; ver += verChildDelta ) {
            const verY = this.tileHeight - 1 - ver;
            for ( let hor = horStart, x = 0; hor <= horEnd; hor += horChildDelta ) {
                let height;
                if ( verY % 1 !== 0 && hor % 1 === 0 ) {
                    height = 0.5 * (this.getByteHeightByXY( hor, verY - 0.5 ) + this.getByteHeightByXY( hor, verY + 0.5 ));
                } else if ( verY % 1 === 0 && hor % 1 !== 0 ) {
                    height = 0.5 * (this.getByteHeightByXY( hor - 0.5, verY ) + this.getByteHeightByXY( hor + 0.5, verY ));
                } else if ( verY % 1 !== 0 && hor % 1 !== 0 ) {
                    height = 0.25 * (this.getByteHeightByXY( hor - 0.5, verY - 0.5 ) + this.getByteHeightByXY( hor + 0.5, verY + 0.5 ) + this.getByteHeightByXY( hor + 0.5, verY - 0.5 ) + this.getByteHeightByXY( hor - 0.5, verY + 0.5 ));
                } else if ( verY % 1 === 0 && hor % 1 === 0 ) {
                    height = this.getByteHeightByXY( hor, verY );
                }
                if ( height !== undefined ) {
                    heights[ x + y * childWidth ] = height;
                }
                x++;
            }
            y++;
        }

        const normals: Vector3D[] = [];

        for ( let ver = verEnd, y = 0, additionalXYZ = childWidth * childHeight; ver >= verStart; ver -= verChildDelta ) {
            for ( let hor = horStart, x = 0; hor <= horEnd; hor += horChildDelta ) {
                let normal: Vector3D = [0, 0, 0];

                if ( ver % 1 !== 0 && hor % 1 === 0 ) {
                    normal = vec3.scale( vec3.add( this.getNormalByXY( hor, ver - 0.5 ), this.getNormalByXY( hor, ver + 0.5 ), normal ), 0.5 );
                } else if ( ver % 1 === 0 && hor % 1 !== 0 ) {
                    normal = vec3.scale( vec3.add( this.getNormalByXY( hor - 0.5, ver ), this.getNormalByXY( hor + 0.5, ver ), normal ), 0.5 );
                } else if ( ver % 1 !== 0 && hor % 1 !== 0 ) {
                    normal = vec3.add( this.getNormalByXY( hor - 0.5, ver - 0.5 ), this.getNormalByXY( hor + 0.5, ver + 0.5 ), normal );
                    normal = vec3.add( normal, this.getNormalByXY( hor + 0.5, ver - 0.5 ) );
                    normal = vec3.add( normal, this.getNormalByXY( hor - 0.5, ver + 0.5 ) );
                    normal = vec3.scale( normal, 0.25 );
                } else if ( ver % 1 === 0 && hor % 1 === 0 ) {
                    normal = this.getNormalByXY( hor, ver );
                }

                normals[ x + y * childWidth ] = normal;

                if ( (y === 0 || y === childHeight - 1) || (x === 0 || x === childWidth - 1) ) {
                    // граничные значения дублируются
                    normals[ additionalXYZ ] = normal;
                    additionalXYZ++;
                }
                x++;
            }
            y++;
        }

        const hTile = new HeightTile( this.projection, {
            Level: identifier.getLevel(),
            HeightNumber: childRow,
            WidthNumber: childCol,
            Width: childWidth,
            Height: childHeight,
            MaxValue: this.maxHeight,
            MinValue: this.minHeight,
            Ident: 0,
            Length: 0,
            Epsg: 0,
            Unit: 0,
            UnitPlane: 0,
            ItemWidth: 0,
            ItemHeight: 0,
            HeightPrecision: 0
        } );

        hTile.setHeights( heights );

        hTile.normals = normals;

        hTile.prepareMesh();
        return hTile;
    }

    /**
     * Получить количество частей по горизонтали
     * @method getHorPlaneCount
     * @param pointsBySide {number} Количество точек по горизонтали
     * @return {number} Количество частей по горизонтали
     */
    private static getHorPlaneCount( pointsBySide: number ) {
        return pointsBySide - 1;
    }

    /**
     * Получить количество частей по вертикали
     * @method getVerPlaneCount
     * @param pointsBySide {number} Количество точек по вертикали
     * @return {number} Количество частей по вертикали
     */
    private static getVerPlaneCount( pointsBySide: number ) {
        return pointsBySide - 1;
    }

    /**
     * Установить ограничивающий объем
     * @method setOBB
     * @param obb {OrientedBoundingBox3D| BoundingSphere3D} Ограничивающий объем
     */
    setOBB( obb: OrientedBoundingBox3D | BoundingSphere3D ) {
        this.obb = obb;
    }

    /**
     * Получить ограничивающий объем
     * @method getOBB
     * @return {OrientedBoundingBox3D| BoundingSphere3D } Ограничивающий объем
     */
    getOBB() {
        return this.obb;
    }

    /**
     * Получить центр тайла
     * @method getCenter
     * @return {Vector3D} Координаты центра [x,y,z]
     */
    getCenter() {
        return this.getOBB()?.getCenter() || HeightTile.centerPoint;
    }

    /**
     * Подготовить координаты вершин меша
     * @method preparePositions
     * @private
     * @param center {Vector3D} Координаты центра [x,y,z]
     * @param bottomLeftYX {Vector2D} Координаты левого нижнего угла [y,x]
     * @param topRightYX {Vector2D} Координаты верхнего правого угла [y,x]
     * @param southPole {boolean} Флаг южного полюса
     * @param northPole {boolean} Флаг северного полюса
     * @return {object} Координаты вершин и текстурных координат
     */
    private preparePositions( center: Vector3D, bottomLeftYX: Vector2D, topRightYX: Vector2D, southPole: boolean, northPole: boolean ) {
        const horPlaneCount = HeightTile.getHorPlaneCount( this.tileWidth );
        const verPlaneCount = HeightTile.getVerPlaneCount( this.tileHeight );

        const _D = 1 / horPlaneCount;
        const deltaX = (topRightYX[ 1 ] - bottomLeftYX[ 1 ]) / horPlaneCount;
        const deltaY = (topRightYX[ 0 ] - bottomLeftYX[ 0 ]) / verPlaneCount;
        const positions: Vector3D[] = [];
        const textureCoords: Vector2D[] = [];
        const curPointXY = HeightTile.mMeshSupport[ 2 ];

        let verTex0 = 0; // Начальный угол по вертикали в радианах

        for ( let ver = 0, xyz = 0, xy = 0, additionalXYZ = (horPlaneCount + 1) * (verPlaneCount + 1), axy = (horPlaneCount + 1) * (verPlaneCount + 1); ver <= verPlaneCount; ver++ ) {
            let horTex0 = 0; // Начальный угол по горизонтали в радианах
            // Проход по меридианам
            for ( let hor = 0; hor <= horPlaneCount; hor++ ) {
                curPointXY[ 1 ] = bottomLeftYX[ 1 ] + hor * deltaX;
                curPointXY[ 0 ] = bottomLeftYX[ 0 ] + ver * deltaY;
                curPointXY[ 2 ] = this.getHeightByXY( hor, ver ) || this.averageHeight;

                let curPoint;
                if ( ver === verPlaneCount && northPole ) {
                    // Для серверного полюса вытягиваем крайнюю верхнюю точку
                    curPoint = new Geodetic3D( 0, Math.PI / 2, 0 );
                } else if ( ver === 0 && southPole ) {
                    curPoint = new Geodetic3D( 0, -Math.PI / 2, 0 );
                } else {
                    curPoint = this.projection.xy2geo( curPointXY[ 0 ], curPointXY[ 1 ], curPointXY[ 2 ] );
                }
                positions[ xyz++ ] = this.projection.getGlobeShape().toVector3d( curPoint );

                // Кооординаты текстуры текущей грани
                textureCoords[ xy++ ] = [horTex0, verTex0];

                if ( (ver === 0 || ver === verPlaneCount) || (hor === 0 || hor === horPlaneCount) ) {
                    if ( ver === verPlaneCount && northPole ) {
                        curPoint = new Geodetic3D( 0, Math.PI / 2, -deltaX );
                        // Для серверного полюса вытягиваем крайнюю верхнюю точку
                    } else if ( ver === 0 && southPole ) {
                        curPoint = new Geodetic3D( 0, -Math.PI / 2, -deltaX );
                    } else {
                        curPoint = this.projection.xy2geo( curPointXY[ 0 ], curPointXY[ 1 ], curPointXY[ 2 ] - deltaX );
                    }
                    positions[ additionalXYZ++ ] = this.projection.getGlobeShape().toVector3d( curPoint );
                    // positions[additionalXYZ++] = vec3.sub(point, center);

                    // Кооординаты текстуры текущей грани
                    textureCoords[ axy++ ] = [horTex0, verTex0];
                }
                horTex0 += _D;
            }
            verTex0 += _D;
        }

        this.getOBB()?.fitPoints( positions );

        for ( let i = 0; i < positions.length; i++ ) {
            vec3.sub( positions[ i ], center );
        }
        return { positions: positions, textureCoords: textureCoords };
    }

    /**
     * Подготовить нормали вершин меша
     * @method prepareNormals
     * @private
     * @param positions {Vector3D} Массив координат вершин
     * @param center {Vector3D} Координаты центра [x,y,z]
     * @return {Vector3D[]} Массив нормалей вершин
     */
    private prepareNormals( positions: Vector3D[], center: Vector3D ) {
        const horPlaneCount = HeightTile.getHorPlaneCount( this.tileWidth );
        const verPlaneCount = HeightTile.getVerPlaneCount( this.tileHeight );
        const normals: Vector3D[] = [];


        const normalList = HeightTile.mMeshSupport[ 3 ];
        const normal = HeightTile.mMeshSupport[ 4 ];
        const dCenter = HeightTile.mMeshSupport[ 5 ], dTop = HeightTile.mMeshSupport[ 6 ],
            dRightTop = HeightTile.mMeshSupport[ 7 ],
            dRight = HeightTile.mMeshSupport[ 8 ], dBottom = HeightTile.mMeshSupport[ 9 ],
            dLeftBottom = HeightTile.mMeshSupport[ 10 ],
            dLeft = HeightTile.mMeshSupport[ 11 ];

        const supNormal = HeightTile.mMeshSupport[ 12 ];
        const pointFlags = {
            dTop: false,
            dRightTop: false,
            dRight: false,
            dBottom: false,
            dLeftBottom: false,
            dLeft: false
        };

        for ( let ver = 0, xyz = 0, additionalXYZ = (horPlaneCount + 1) * (verPlaneCount + 1); ver <= verPlaneCount; ver++ ) {
            // Начальный угол по горизонтали в радианах
            // Проход по меридианам
            for ( let hor = 0; hor <= horPlaneCount; hor++ ) {

                if ( this.row === 0 && ver === verPlaneCount ) {
                    normal[ 0 ] = normal[ 1 ] = 0;
                    normal[ 2 ] = 1;
                } else if ( ver === 0 && this.row === this.projection.getColCount( this.level ) - 1 ) {
                    normal[ 0 ] = normal[ 1 ] = 0;
                    normal[ 2 ] = -1;
                } else if ( this.heights ) {

                    normalList.length = 0;
                    pointFlags.dTop = false;
                    pointFlags.dRightTop = false;
                    pointFlags.dRight = false;
                    pointFlags.dBottom = false;
                    pointFlags.dLeftBottom = false;
                    pointFlags.dLeft = false;

                    vec3.add( positions[ xyz ], center, dCenter );

                    vec3.normalize( dCenter, supNormal );
                    vec3.scale( supNormal, 0.25 );

                    if ( ver !== verPlaneCount ) {
                        vec3.add( positions[ xyz + (verPlaneCount + 1) ], center, dTop );
                        pointFlags.dTop = true;
                        if ( hor !== horPlaneCount ) {
                            vec3.add( positions[ xyz + (verPlaneCount + 1) + 1 ], center, dRightTop );
                            pointFlags.dRightTop = true;
                        }
                    } else {
                        normalList.push( supNormal );
                    }

                    if ( hor !== horPlaneCount ) {
                        vec3.add( positions[ xyz + 1 ], center, dRight );
                        pointFlags.dRight = true;
                    } else {
                        normalList.push( supNormal );
                    }

                    if ( ver !== 0 ) {
                        vec3.add( positions[ xyz - (verPlaneCount + 1) ], center, dBottom );
                        pointFlags.dBottom = true;
                    } else {
                        normalList.push( supNormal );
                    }

                    if ( hor !== 0 ) {
                        vec3.add( positions[ xyz - 1 ], center, dLeft );
                        pointFlags.dLeft = true;
                        if ( ver !== 0 ) {
                            vec3.add( positions[ xyz - 1 - (verPlaneCount + 1) ], center, dLeftBottom );
                            pointFlags.dLeftBottom = true;
                        }
                    } else {
                        normalList.push( supNormal );
                    }

                    if ( pointFlags.dRightTop ) {
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dRightTop, dTop ) ) );
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dRight, dRightTop ) ) );
                    }

                    if ( pointFlags.dRight && pointFlags.dBottom ) {
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dBottom, dRight ) ) );
                    }

                    if ( pointFlags.dLeftBottom ) {
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dLeftBottom, dBottom ) ) );
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dLeft, dLeftBottom ) ) );
                    }

                    if ( pointFlags.dLeft && pointFlags.dTop ) {
                        normalList.push( vec3.normalize( Calculate.calcNormal( dCenter, dTop, dLeft ) ) );
                    }

                    normal[ 0 ] = normal[ 1 ] = normal[ 2 ] = 0;

                    for ( let i = 0, curNormal; (curNormal = normalList[ i ]); i++ ) {
                        vec3.add( normal, curNormal );
                    }
                } else {
                    vec3.add( positions[ xyz ], center, normal );
                }

                normals[ xyz ] = vec3.normalize( normal, vec3.create() );

                if ( (ver === 0 || ver === verPlaneCount) || (hor === 0 || hor === horPlaneCount) ) {
                    // граничные значения дублируются
                    normals[ additionalXYZ ] = normals[ xyz ];
                    additionalXYZ++;
                }
                xyz++;
            }
        }

        return normals;
    }

    /**
     * Подготовить индексы вершин меша
     * @method prepareIndices
     * @private
     * @return {array} Массив индексов вершин
     */
    private prepareIndices() {
        // Индексы вершин граней (i) с разбиением на треугольники
        // (по 6 индексов (2 треугольника) на каждую грань)
        const indexPlane: number[] = [];
        // ЗАПОЛНИТЬ МАССИВ ИНДЕКСНЫХ КООРДИНАТ ГРАНЕЙ
        const horPlaneCount = HeightTile.getHorPlaneCount( this.tileWidth );
        const verPlaneCount = HeightTile.getVerPlaneCount( this.tileHeight );

        const additionalINDEX = (horPlaneCount + 1) * (verPlaneCount + 1);
        const additionalCount = (horPlaneCount) * 2 + (verPlaneCount) * 2;

        let ind = 0;

        // Проход по параллелям
        for ( let ver = 0, verIndex0, verIndex1 = 0; ver < verPlaneCount; ver++ ) {
            // Сместиться на следующую строку точек
            verIndex0 = verIndex1;
            verIndex1 = verIndex0 + horPlaneCount + 1;

            // Проход по меридианам
            for ( let hor = 0, horIndex0, horIndex1 = 0; hor < horPlaneCount; hor++ ) {
                horIndex0 = horIndex1;
                horIndex1 = horIndex0 + 1;

                // Индексы кооординат текущей грани
                indexPlane[ ind ] = verIndex0 + horIndex0;
                ind++;
                indexPlane[ ind ] = verIndex1 + horIndex1;
                ind++;
                indexPlane[ ind ] = verIndex1 + horIndex0;
                ind++;

                indexPlane[ ind ] = verIndex0 + horIndex0;
                ind++;
                indexPlane[ ind ] = verIndex0 + horIndex1;
                ind++;
                indexPlane[ ind ] = verIndex1 + horIndex1;
                ind++;
            }
        }

        //Нижняя юбка
        for ( let hor = 0, horIndex0, horIndex1 = 0; hor < horPlaneCount; hor++ ) {
            const verIndex0 = 0;

            horIndex0 = horIndex1;
            horIndex1 = horIndex0 + 1;

            indexPlane[ ind ] = verIndex0 + horIndex0 + additionalINDEX;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;

            indexPlane[ ind ] = verIndex0 + horIndex0 + additionalINDEX;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1 + additionalINDEX;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1;
            ind++;
        }

        //Верхняя юбка
        //ver = verPlaneCount - 1;
        for ( let hor = 0, horIndex0, horIndex1 = 0; hor < horPlaneCount; hor++ ) {
            const verIndex0 = (horPlaneCount + 1) * verPlaneCount;
            horIndex0 = horIndex1;
            horIndex1 = horIndex0 + 1;

            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1 + additionalCount;
            ind++;

            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex1 + additionalCount;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex0 + additionalCount;
            ind++;
        }

        //Левая юбка
        //hor = 0;
        for ( let ver = 0, verIndex0, verIndex1 = 0, addVert = additionalINDEX + horPlaneCount - 1; ver < verPlaneCount; ver++ ) {
            const horIndex0 = 0;
            verIndex0 = verIndex1;
            verIndex1 = verIndex0 + horPlaneCount + 1;

            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;
            indexPlane[ ind ] = addVert + 2;
            ind++;
            if ( ver === 0 ) {
                indexPlane[ ind ] = addVert - horPlaneCount + 1;
            } else {
                indexPlane[ ind ] = addVert;
            }
            ind++;

            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;
            indexPlane[ ind ] = verIndex1 + horIndex0;
            ind++;
            indexPlane[ ind ] = addVert + 2;
            ind++;

            addVert += 2;
        }

        //Правая юбка
        //hor = horPlaneCount - 1;
        for ( let ver = 0, verIndex0, verIndex1 = 0, addVert = additionalINDEX + horPlaneCount; ver < verPlaneCount; ver++ ) {

            const horIndex0 = horPlaneCount;

            verIndex0 = verIndex1;
            verIndex1 = verIndex0 + horPlaneCount + 1;

            indexPlane[ ind ] = addVert;
            ind++;
            indexPlane[ ind ] = verIndex1 + horIndex0;
            ind++;
            indexPlane[ ind ] = verIndex0 + horIndex0;
            ind++;

            indexPlane[ ind ] = addVert;
            ind++;
            if ( ver === verPlaneCount - 1 ) {
                indexPlane[ ind ] = addVert + horPlaneCount + 1;
            } else {
                indexPlane[ ind ] = addVert + 2;
            }
            ind++;
            indexPlane[ ind ] = verIndex1 + horIndex0;
            ind++;

            addVert += 2;
        }

        return indexPlane;
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @param [noMesh] {boolean} Флаг сериализации без меша
     * @return {HeightTileSerialised} сериализуемый JSON объект
     */
    toJSON( noMesh?: true ) {
        let json = this.json;
        if ( !json ) {
            const obb = this.getOBB()?.toJSON();

            json = {
                timeStamp: this.timeStamp,
                obb,
                center: this.centerYX,
                tileWidthMtr: this.tileWidthMtr,
                tileHeightMtr: this.tileHeightMtr,
                description: {
                    tileWidth: this.tileWidth,
                    tileHeight: this.tileHeight,
                    level: this.level,
                    maxHeight: this.maxHeight,
                    minHeight: this.minHeight,
                    row: this.row,
                    col: this.col
                },
                deltaPlaneRad: this.deltaPlaneRad
            };
            if ( this.heights ) {
                json.heights = this.heights;
            }
            if ( this.normals ) {
                json.normals = this.normals;
            }
            this.json = json;
        }
        if ( !noMesh && this.mesh ) {
            json.mesh = this.mesh.toJSON();
        } else {
            delete json.mesh;
        }
        return json;
    }

    /**
     * Забрать данные из JSON объекта
     * @method fromJSON
     * @param json {HeightTileSerialised} JSON объект
     */
    fromJSON( json: HeightTileSerialised ) {
        this.json = json;

        this.timeStamp = json.timeStamp;
        this.heights = json.heights;
        this.normals = json.normals;
        if ( json.mesh ) {
            this.mesh = Mesh.fromJSON( json.mesh );
        }

        this.tileWidthMtr = json.tileWidthMtr;
        this.tileHeightMtr = json.tileHeightMtr;
        const description = json.description;
        this.tileWidth = description.tileWidth;
        this.tileHeight = description.tileHeight;
        this.level = description.level;
        this.maxHeight = description.maxHeight;
        this.minHeight = description.minHeight;
        this.row = description.row;
        this.col = description.col;
        this.deltaPlaneRad = json.deltaPlaneRad;

        this.identifier = new TileIdentifier( description.level, description.col, description.row );

        // this.averageHeight = (this.minHeight + this.maxHeight) * 0.5;
        this.averageHeight = this.minHeight;
        this.deltaHeightUnit = (this.maxHeight - this.minHeight) / 255;


        this.centerYX = json.center;

        const obb = this.obb || new OrientedBoundingBox3D();
        if ( json.obb ) {
            obb.fromJSON( json.obb );
        }
        this.setOBB( obb );
    }

    /**
     * Получить идентификатор тайла
     * @method getIdentifier
     * @return {TileIdentifier} Идентификатор тайла
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * добавть точки пересечения с mesh
     * @param startGeoPoint {Geodetic3D} Геодезические координаты точки- начало отрезка
     * @param endGeoPoint {Geodetic3D} Геодезические координаты точки- конец отрезка
     * @return {array|undefined} массив точек{Geodetic3D}
     */
    getPath( startGeoPoint: Geodetic3D, endGeoPoint: Geodetic3D ) {
        const curResult = HeightTile.mMeshSupport[ 0 ];
        const pointList = HeightTile.mVectorPositions;
        pointList.length = 0;

        let startPointXY = this.getIndicesByGeoPoint( startGeoPoint );
        let endPointXY = this.getIndicesByGeoPoint( endGeoPoint );
        let replace = false;

        // TODO: если координата по X совпадает у двух точек отрезка, возникает ошибка, точки рассчитываются вне отрезка
        if ( startGeoPoint.getLatitude() === endGeoPoint.getLatitude() || startGeoPoint.getLongitude() === endGeoPoint.getLongitude() ) {
            return undefined;
        }
        if ( startPointXY[ 0 ] > endPointXY[ 0 ] ) {
            // меняем местами начальную и конечную точки
            replace = true;
            const a = startPointXY;
            startPointXY = endPointXY;
            endPointXY = a;
        }


        // точки толкьо внутри отрезка
        const minX = Math.ceil( startPointXY[ 0 ] );
        const maxX = Math.floor( endPointXY[ 0 ] );

        let minY = Math.min( Math.ceil( startPointXY[ 1 ] ), Math.ceil( endPointXY[ 1 ] ) );
        let maxY = Math.max( Math.floor( startPointXY[ 1 ] ), Math.floor( endPointXY[ 1 ] ) );

        if ( maxY < minY ) {
            const a = minY;
            minY = maxY;
            maxY = a;
        }

        const lN = vec2.normalize( vec2.sub( endPointXY, startPointXY, vec2.create() ) );
        const x = lN[ 0 ];
        const y = lN[ 1 ];
        // ортогональный вектор
        lN[ 0 ] = -y;
        lN[ 1 ] = x;


        const line = Line2DCreator.createLineByNormalAndPoint( lN, startPointXY );

        // прямые параллельные оси Y
        const vA = 1, vB = 0;
        let vC = -minX;
        while ( -vC <= maxX ) {
            const vertLine = Line2DCreator.createLineByABC( vA, vB, vC );
            if ( IntersectionTests.tryLineLine2D( line, vertLine, curResult ) !== undefined ) {
                if ( curResult[ 0 ] >= startPointXY[ 0 ] && curResult[ 0 ] <= endPointXY[ 0 ] ) {
                    const res = vec3.fromVector2( curResult );
                    const h1 = this.getHeightByXY( -vC, Math.floor( res[ 1 ] ) ) || this.averageHeight;
                    const h2 = this.getHeightByXY( -vC, Math.ceil( res[ 1 ] ) ) || this.averageHeight;

                    res[ 2 ] = h1 + (h2 - h1) * (res[ 1 ] - Math.floor( res[ 1 ] ));
                    pointList.push( res );
                }
            }
            vC--;
        }

        // прямые параллельные оси X
        const hA = 0, hB = 1;
        let hC = -minY;
        while ( -hC <= maxY ) {
            const horLine = Line2DCreator.createLineByABC( hA, hB, hC );
            if ( IntersectionTests.tryLineLine2D( line, horLine, curResult ) !== undefined ) {
                if ( curResult[ 0 ] >= startPointXY[ 0 ] && curResult[ 0 ] <= endPointXY[ 0 ] ) {
                    const res = vec3.fromVector2( curResult );
                    const h1 = this.getHeightByXY( Math.floor( res[ 0 ] ), -hC ) || this.averageHeight;
                    const h2 = this.getHeightByXY( Math.ceil( res[ 0 ] ), -hC ) || this.averageHeight;

                    res[ 2 ] = h1 + (h2 - h1) * (res[ 0 ] - Math.floor( res[ 0 ] ));
                    pointList.push( res );
                }
            }
            hC--;
        }

        //сортировка по возрастанию X
        pointList.sort( function ( a, b ) {
            return a[ 0 ] - b[ 0 ];
        } );

        if ( replace ) {
            // обратный порядок
            pointList.reverse();
        }

        const result: Geodetic3D[] = [];
        // стартовая точка
        result.push( startGeoPoint );

        for ( let i = 0; i < pointList.length; i++ ) {
            result.push( this.getGeoPointByIndices( pointList[ i ] ) );
        }

        // конечная точка
        result.push( endGeoPoint );

        return result;
    }
}
