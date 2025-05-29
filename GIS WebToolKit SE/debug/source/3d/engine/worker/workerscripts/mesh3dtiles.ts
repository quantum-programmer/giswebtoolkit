/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Геометрия меша 3d тайла                       *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';
import VertexAttribute, { VertexAttributeSerialized, VertexAttributeType } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesSerialized, IndicesType } from '~/3d/engine/core/geometry/indices';
import { PrimitiveType, WindingOrder } from '~/3d/engine/core/geometry/mesh';
import { AttributesArrayBufferDescription, IndicesArrayBufferDescription } from '~/3d/engine/core/Types';


export type WorkerArrayBufferObject = { currentByteOffset: number, arrayBuffer: ArrayBuffer };

export type Mesh3dTilesSerialized = {
    primitiveType: PrimitiveType;
    solid: PAINT_FLAG;
    frontFaceWindingOrder: WindingOrder;
    vertexCount: number;
    attributes: { [ key: string ]: VertexAttributeSerialized };
    byteLength: number;
    arrayBuffer: ArrayBuffer;
    vertexArrayBufferDescription: AttributesArrayBufferDescription;
    indexArrayBufferDescription?: IndicesArrayBufferDescription;
    indices?: IndicesSerialized;
};

enum PAINT_FLAG {
    BOTH = 0,
    FRONTFACE = 1
}

enum DataTypeSize {
    BYTE = 1,
    SHORT = 2,
    UNSIGNED_BYTE = 1,
    UNSIGNED_SHORT = 2,
    UNSIGNED_INT = 4,
    FLOAT = 4
}


/**
 * Класс меша 3D тайлов
 * @class Mesh3dTiles
 */
export default class Mesh3dTiles {
    private attributes: SimpleJson<VertexAttribute> = {};
    private indices: Indices | undefined;
    private primitiveType: PrimitiveType = PrimitiveType.Triangles;
    private frontFaceWindingOrder = WindingOrder.Counterclockwise;
    private solid = PAINT_FLAG.FRONTFACE;

    /**
     * Получить коллекцию атрибутов
     * @method getAttributes
     * @return {SimpleJson<VertexAttribute>} Коллекция атрибутов
     */
    getAttributes() {
        return this.attributes;
    }

    /**
     * Добавить атрибут
     * @method addAttribute
     * @param attribute {VertexAttribute} Вершинный атрибут
     */
    addAttribute( attribute: VertexAttribute ) {
        this.attributes[ attribute.getName() ] = attribute;
    }

    /**
     * Получить набор индексов
     * @method getIndices
     * @return {Indices | undefined} Набор индексов
     */
    getIndices() {
        return this.indices;
    }

    /**
     * Задать набор индексов
     * @method setIndices
     * @param indices {Indices} Набор индексов
     */
    setIndices( indices: Indices ) {
        this.indices = indices;
    }

    /**
     * Получить тип отрисовки примитивов
     * @method getPrimitiveType
     * @return {PrimitiveType} Тип отрисовки примитивов
     */
    getPrimitiveType() {
        return this.primitiveType;
    }

    /**
     * Задать тип отрисовки примитивов
     * @method setPrimitiveType
     * @param primitiveType {PrimitiveType} Тип отрисовки примитивов
     */
    setPrimitiveType( primitiveType: PrimitiveType ) {
        this.primitiveType = primitiveType;
    }

    /**
     * Получить стороны отрисовки примитивов
     * @method getSolidType
     * @return {PAINT_FLAG} Стороны отрисовки примитивов
     */
    getSolidType() {
        return this.solid;
    }

    /**
     * Задать стороны отрисовки примитивов
     * @method setSolidType
     * @param paintFlag {PAINT_FLAG} Стороны отрисовки примитивов
     */
    setSolidType( paintFlag: PAINT_FLAG ) {
        this.solid = paintFlag;
    }

    /**
     * Получить направление обхода точек лицевой стороны
     * @method getFrontFaceWindingOrder
     * @return {WindingOrder} Направление обхода точек лицевой стороны
     */
    getFrontFaceWindingOrder() {
        return this.frontFaceWindingOrder;
    }

    /**
     * Задать направление обхода точек лицевой стороны
     * @method setFrontFaceWindingOrder
     * @param frontFaceWindingOrder {WindingOrder} Направление обхода точек лицевой стороны
     */
    setFrontFaceWindingOrder( frontFaceWindingOrder: WindingOrder ) {
        this.frontFaceWindingOrder = frontFaceWindingOrder;
    }

    /**
     * Очистить память меша
     * @method freeMesh
     */
    freeMesh() {
        this.attributes = {};
        this.indices = undefined;
    }

    /**
     * Получить сериализуемый JSON объект MeshBuffers
     * @method toMeshBuffersJSON
     * @param arrayBufferObject {WorkerArrayBufferObject} Объект буфера
     * @return {Mesh3dTilesSerialized} Сериализуемый JSON объект MeshBuffers
     */
    toMeshBuffersJSON( arrayBufferObject: WorkerArrayBufferObject ): Mesh3dTilesSerialized {

        const vertexByteOffset = arrayBufferObject.currentByteOffset;

        const bufferParams = this.getBufferParams();

        const view = new DataView( arrayBufferObject.arrayBuffer, vertexByteOffset, bufferParams.vertexBufferByteLength );

        const vertexCount = bufferParams.vertexCount;
        let currentVertexByteOffset = 0;
        const attributes: SimpleJson<VertexAttributeSerialized> = {};
        for ( let i = 0; i < vertexCount; i++ ) {
            for ( const name in this.attributes ) {
                const attribute = this.attributes[ name ];
                attributes[ attribute.getName() ] = attribute.toJSON();
                if ( attribute.getValues().length === vertexCount ) {
                    const value = attribute.getValues()[ i ];
                    const type = attribute.getType();
                    const stepOffset = DataTypeSize[ type ];
                    if ( Array.isArray( value ) ) {
                        for ( let j = 0; j < value.length; j++ ) {
                            switch ( type ) {
                                case VertexAttributeType.Float:
                                    view.setFloat32( currentVertexByteOffset, value[ j ], true );
                                    break;
                                case VertexAttributeType.uShort:
                                    view.setUint16( currentVertexByteOffset, value[ j ], true );
                                    break;
                                case VertexAttributeType.uByte:
                                    view.setUint8( currentVertexByteOffset, value[ j ] );
                                    break;
                                case VertexAttributeType.Byte:
                                    view.setInt8( currentVertexByteOffset, value[ j ] );
                                    break;
                                case VertexAttributeType.Short:
                                    view.setInt16( currentVertexByteOffset, value[ j ], true );
                                    break;
                            }
                            currentVertexByteOffset += stepOffset;
                        }
                    } else {
                        switch ( type ) {
                            case VertexAttributeType.Float:
                                view.setFloat32( currentVertexByteOffset, value, true );
                                break;
                            case VertexAttributeType.uShort:
                                view.setUint16( currentVertexByteOffset, value, true );
                                break;
                            case VertexAttributeType.uByte:
                                view.setUint8( currentVertexByteOffset, value );
                                break;
                            case VertexAttributeType.Byte:
                                view.setInt8( currentVertexByteOffset, value );
                                break;
                            case VertexAttributeType.Short:
                                view.setInt16( currentVertexByteOffset, value, true );
                                break;
                        }
                        currentVertexByteOffset += stepOffset;
                    }
                } else {
                    console.error( vertexCount + ' v:' + attribute.getValues().length );
                }
            }
        }

        const vertexArrayBufferDescription = {
            startByte: vertexByteOffset,
            byteLength: bufferParams.vertexBufferByteLength,
            stride: bufferParams.stride,
            offsets: bufferParams.offsets
        };

        arrayBufferObject.currentByteOffset = vertexByteOffset + currentVertexByteOffset;

        let indices: IndicesSerialized | undefined, indexArrayBufferDescription: IndicesArrayBufferDescription | undefined;
        if ( this.indices !== undefined ) {
            indices = this.indices.toJSON();
            const indexByteOffset = arrayBufferObject.currentByteOffset;
            const view = new DataView( arrayBufferObject.arrayBuffer, indexByteOffset, bufferParams.indexBufferByteLength );
            indexArrayBufferDescription = {
                startByte: indexByteOffset,
                byteLength: bufferParams.indexBufferByteLength
            };

            const type = this.indices.getType();
            const stepOffset = DataTypeSize[ type ];
            const values = this.indices.getValues();
            let currentIndexByteOffset = 0;
            for ( let i = 0; i < values.length; i++ ) {
                const value = values[ i ];
                switch ( type ) {
                    case IndicesType.uShort:
                        view.setUint16( currentIndexByteOffset, value, true );
                        break;
                    case IndicesType.uByte:
                        view.setUint8( currentIndexByteOffset, value );
                        break;
                    case IndicesType.uInt:
                        view.setUint32( currentIndexByteOffset, value, true );
                        break;
                }
                currentIndexByteOffset += stepOffset;
            }
            arrayBufferObject.currentByteOffset = indexByteOffset + currentIndexByteOffset;
        }


        return {
            primitiveType: this.primitiveType,
            solid: this.getSolidType(),
            frontFaceWindingOrder: this.frontFaceWindingOrder,
            vertexCount: bufferParams.vertexCount,
            attributes: attributes,
            byteLength: bufferParams.byteLength,
            arrayBuffer: arrayBufferObject.arrayBuffer,
            vertexArrayBufferDescription: vertexArrayBufferDescription,
            indexArrayBufferDescription: indexArrayBufferDescription,
            indices: indices
        };
    }

    /**
     * Посчитать параметры буфера для сериализации
     * @method getBufferParams
     * @return {object} Параметры буфера для сериализации
     */
    getBufferParams() {
        let vertexCount = 0,
            vertexBufferByteLength = 0,
            stride = 0;
        const offsets: SimpleJson<number> = {};

        for ( const name in this.attributes ) {
            const attribute = this.attributes[ name ];
            const itemSize = DataTypeSize[ attribute.getType() ];
            vertexBufferByteLength += itemSize * attribute.getNumberOfComponents() * attribute.getValues().length;
            vertexCount = Math.max( vertexCount, attribute.getValues().length );
            offsets[ name ] = stride;
            stride += attribute.getNumberOfComponents() * itemSize;
        }

        let indexBufferByteLength = 0;
        if ( this.indices !== undefined ) {
            const itemSize = DataTypeSize[ this.indices.getType() ];
            indexBufferByteLength = itemSize * this.indices.getValues().length;
        }

        const byteLength = vertexBufferByteLength + indexBufferByteLength;

        return { byteLength, offsets, stride, vertexBufferByteLength, vertexCount, indexBufferByteLength };
    }
}
