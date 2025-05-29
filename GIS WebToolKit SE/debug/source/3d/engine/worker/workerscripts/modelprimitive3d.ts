/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Компонент примитивов рисования                   *
 *                                                                  *
 *******************************************************************/

import {
    FACESET,
    LINESET,
    POINTSET,
    Primitive,
    PrimitiveTypeByte
} from '~/3d/engine/worker/workerscripts/parse3dtiles';
import { Vector2D, Vector3D, Vector4D } from '~/3d/engine/core/Types';
import Mesh3dTiles, { Mesh3dTilesSerialized, WorkerArrayBufferObject } from '~/3d/engine/worker/workerscripts/mesh3dtiles';
import VertexAttribute, { VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesType } from '~/3d/engine/core/geometry/indices';
import { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { PAINT_FLAG } from '~/3d/engine/worker/workerscripts/parse3dobject';
import { vec3 } from '~/3d/engine/utils/glmatrix';

export type ModelPrimitive3dSerialized = {
    mesh?: Mesh3dTilesSerialized;
    id: Primitive['Id'];
    type: Primitive['Type'];
    tileCol: Primitive['Col'];
    tileRow: Primitive['Row'];
    tilematrix: Primitive['Zoom'];
    textureId?: string;
    materialId?: string;
};

/**
 * Класс описания трехмерного примитива модели
 * @class ModelPrimitive3d
 * @param params {Primitive} Описание примитива
 */
export default class ModelPrimitive3d {

    id: Primitive['Id'];
    type: Primitive['Type'];
    tileCol: Primitive['Col'];
    tileRow: Primitive['Row'];
    tilematrix: Primitive['Zoom'];

    textureId?: string;
    materialId?: string;

    meshPositions: [number, number, number][] = [];
    meshData: Mesh3dTiles | undefined;

    constructor( params: Primitive ) {

        this.id = params.Id; // Идентификатор примитива
        this.type = params.Type;                           // Тип примитива PrimitiveTypeByte
        this.tileCol = params.Col;               // Столбец тайла
        this.tileRow = params.Row;               // Строка тайла
        this.tilematrix = params.Zoom;        // Номер приближения


        if ( params.FUNCTIONLIST ) {
            this.add( params.FUNCTIONLIST );
        }

    }

    /**
     * Добавить примитив
     * @method add
     * @param set {FUNCTIONLIST} Параметры набора для рисования
     */
    add( set: Primitive['FUNCTIONLIST'] ) {
        if ( this.type === PrimitiveTypeByte.PRIMITIV_FACESET ) {
            this.addFaceSet( set as FACESET );
        } else if ( this.type === PrimitiveTypeByte.PRIMITIV_LINESET ) {
            this.addLineSet( set as LINESET );
        } else if ( this.type === PrimitiveTypeByte.PRIMITIV_POINTSET ) {
            this.addPointSet( set as POINTSET );
        }
    }

    /**
     * Создать атрибут координат
     * @private
     * @method createPositionsAttribute
     * @param pointsArray {Vector3D[]} Массив точек
     * @return {VertexAttribute} Вершинный атрибут
     */
    private createPositionsAttribute( pointsArray: Vector3D[] ) {
        const positionsAttribute = new VertexAttribute( 'aVertexPosition', VertexAttributeType.Float, 3 );
        positionsAttribute.setValues( pointsArray );
        this.meshPositions = pointsArray;
        return positionsAttribute;
    }

    /**
     * Создать атрибут нормалей
     * @private
     * @static
     * @method createNormalsAttribute
     * @param normalsArray {Vector3D[]} Массив нормалей
     * @return {VertexAttribute} Вершинный атрибут
     */
    private static createNormalsAttribute( normalsArray: Vector3D[] ) {
        const normalsAttribute = new VertexAttribute( 'aVertexNormal', VertexAttributeType.Float, 3 );
        normalsAttribute.setValues( normalsArray );
        return normalsAttribute;
    }

    /**
     * Создать атрибут текстурных координат
     * @private
     * @static
     * @method createTextureCoordinatesAttribute
     * @param texCoordinates {Vector2D[]} Массив текстурных координат
     * @return {VertexAttribute} Вершинный атрибут
     */
    private static createTextureCoordinatesAttribute( texCoordinates: Vector2D[] ) {
        const texCoordsAttribute = new VertexAttribute( 'aTextureCoord', VertexAttributeType.Float, 2 );
        texCoordsAttribute.setValues( texCoordinates );
        return texCoordsAttribute;
    }

    /**
     * Создать атрибут цветов вершин
     * @private
     * @static
     * @method createColorsAttribute
     * @param colorsArray {Vector4D[]} Массив цветов вершин
     * @return {VertexAttribute} Вершинный атрибут
     */
    private static createColorsAttribute( colorsArray: Vector4D[] ) {
        const colorsAttribute = new VertexAttribute( 'aVertexColor', VertexAttributeType.Float, 4 );
        colorsAttribute.setValues( colorsArray );
        return colorsAttribute;
    }

    /**
     * Создать набор индексов
     * @private
     * @static
     * @method createIndices
     * @param indicesArray {number[]} Массив индексов
     * @return {Indices} Набор индексов
     */
    private static createIndices( indicesArray: number[] ) {
        const indices = new Indices( IndicesType.uShort );
        indices.add( indicesArray );
        indices.validateType();
        return indices;
    }

    /**
     * Конвертировать направление обхода точек лицевой стороны
     * @private
     * @static
     * @method convertWindingOrder
     * @param flag {number} Флаг направления обхода
     * @return {WindingOrder} Направление обхода точек лицевой стороны
     */
    private static convertWindingOrder( flag: 1 | 0 ) {
        return flag === 1 ? WindingOrder.Counterclockwise : WindingOrder.Clockwise;
    }

    /**
     * Конвертировать стороны отрисовки примитивов
     * @private
     * @static
     * @method convertSolidType
     * @param flag {number} Флаг сторон отрисовки примитивов
     * @return {WindingOrder} Стороны отрисовки примитивов
     */
    private static convertSolidType( flag: 1 | 0 ) {
        return flag === 1 ? PAINT_FLAG.FRONTFACE : PAINT_FLAG.BOTH;
    }

    /**
     * Добавить FACESET
     * @private
     * @method addFaceSet
     * @param faceSet {FACESET} Параметры набора для рисования
     */
    private addFaceSet( faceSet: FACESET ) {
        const mesh = new Mesh3dTiles();

        const positions: Vector3D[] = [];
        for ( let i = 0, vertex; (vertex = faceSet.Vertex[ i ]); i++ ) {
            positions.push( [vertex.X, vertex.Y, vertex.Z] );
        }
        mesh.addAttribute( this.createPositionsAttribute( positions ) );

        const normals: Vector3D[] = [];
        for ( let i = 0, normal; (normal = faceSet.Normal[ i ]); i++ ) {
            normals.push( [normal.X, normal.Y, normal.Z] );
        }
        mesh.addAttribute( ModelPrimitive3d.createNormalsAttribute( normals ) );

        if ( faceSet.TexCoordinates.length > 0 ) {
            const texCoords: Vector2D[] = [];
            const texCoordinates = faceSet.TexCoordinates;
            for ( let i = 0, texCoordinate; (texCoordinate = texCoordinates[ i ]); i++ ) {
                texCoords.push( [texCoordinate.X, texCoordinate.Y] );
            }
            mesh.addAttribute( ModelPrimitive3d.createTextureCoordinatesAttribute( texCoords ) );
        }

        mesh.setIndices( ModelPrimitive3d.createIndices( faceSet.VertexIndex ) );

        mesh.setFrontFaceWindingOrder( ModelPrimitive3d.convertWindingOrder( faceSet.FlagFrontFace ) );
        mesh.setPrimitiveType( PrimitiveType.Triangles );
        mesh.setSolidType( ModelPrimitive3d.convertSolidType( faceSet.Solid ) );

        this.meshData = mesh;
    }

    /**
     * Добавить LINESET
     * @private
     * @method addLineSet
     * @param lineSet {LINESET} Параметры набора для рисования
     */
    private addLineSet( lineSet: LINESET ) {
        const mesh = new Mesh3dTiles();

        const positions: Vector3D[] = [];
        for ( let i = 0, vertex; (vertex = lineSet.Vertex[ i ]); i++ ) {
            positions.push( [vertex.X, vertex.Y, vertex.Z] );
        }
        mesh.addAttribute( this.createPositionsAttribute( positions ) );

        const normals: Vector3D[] = [];
        for ( let i = 0; i < lineSet.VertexCount; i++ ) {
            normals.push( vec3.create( vec3.UNITZ ) );
        }
        mesh.addAttribute( ModelPrimitive3d.createNormalsAttribute( normals ) );

        if ( Array.isArray( lineSet.Colors ) && lineSet.Colors.length === lineSet.VertexCount ) {
            const colors: Vector4D[] = [];
            for ( let i = 0; i < lineSet.VertexCount; i++ ) {
                const color = lineSet.Colors[ i ];
                colors.push( [color.R, color.G, color.B, color.A] );
            }
            mesh.addAttribute( ModelPrimitive3d.createColorsAttribute( colors ) );
        }

        mesh.setIndices( ModelPrimitive3d.createIndices( lineSet.VertexIndex ) );

        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
        mesh.setPrimitiveType( PrimitiveType.Lines );
        mesh.setSolidType( PAINT_FLAG.FRONTFACE );

        this.meshData = mesh;
    }

    /**
     * Добавить POINTSET
     * @private
     * @method addPointSet
     * @param pointSet {POINTSET} Параметры набора для рисования
     */
    private addPointSet( pointSet: POINTSET ) {
        const mesh = new Mesh3dTiles();

        const positions: Vector3D[] = [];
        for ( let i = 0, vertex; (vertex = pointSet.Vertex[ i ]); i++ ) {
            positions.push( [vertex.X, vertex.Y, vertex.Z] );
        }
        mesh.addAttribute( this.createPositionsAttribute( positions ) );

        const normals: Vector3D[] = [];
        for ( let i = 0, normal; (normal = pointSet.Normal[ i ]); i++ ) {
            normals.push( [normal.X, normal.Y, normal.Z] );
        }
        mesh.addAttribute( ModelPrimitive3d.createNormalsAttribute( normals ) );

        const colors: Vector4D[] = [];
        for ( let i = 0; i < pointSet.VertexCount; i++ ) {
            const color = pointSet.Colors[ i ];
            colors.push( [color.R, color.G, color.B, color.A] );
        }
        mesh.addAttribute( ModelPrimitive3d.createColorsAttribute( colors ) );

        const indexPlaneArray: number[] = [];
        for ( let i = 0; i < pointSet.VertexCount; i++ ) {
            indexPlaneArray.push( i );
        }
        mesh.setIndices( ModelPrimitive3d.createIndices( indexPlaneArray ) );

        mesh.setFrontFaceWindingOrder( WindingOrder.Counterclockwise );
        mesh.setPrimitiveType( PrimitiveType.Points );
        mesh.setSolidType( PAINT_FLAG.FRONTFACE );

        this.meshData = mesh;
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @param arrayBufferObject {WorkerArrayBufferObject} Общий буфер хранения
     * @return {ModelPrimitive3dSerialized} Сериализуемый JSON объект
     */
    toJSON( arrayBufferObject: WorkerArrayBufferObject ): ModelPrimitive3dSerialized {
        const mesh = this.meshData ? this.meshData.toMeshBuffersJSON( arrayBufferObject ) : undefined;

        return {
            mesh: mesh,
            id: this.id, // Идентификатор примитива
            type: this.type,                     // Тип примитива PrimitiveTypeByte
            tileCol: this.tileCol,               // Столбец тайла
            tileRow: this.tileRow,               // Строка тайла
            tilematrix: this.tilematrix,        // Номер приближения
            textureId: this.textureId,
            materialId: this.materialId
        };

    }

    /**
     * Установить идентификатор текстуры
     * @method setTextureId
     * @param textureId {string} Идентификатор текстуры
     */
    setTextureId( textureId: string ) {
        this.textureId = textureId;
    }

    /**
     * Установить идентификатор материала
     * @method setMaterialId
     * @param materialId {string} Идентификатор материала
     */
    setMaterialId( materialId: string ) {
        this.materialId = materialId;
    }
}
