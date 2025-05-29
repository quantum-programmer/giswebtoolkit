/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                            Геометрия меша                        *
 *                                                                  *
 *******************************************************************/

import VertexAttribute, { AnyAttributeValue, VertexAttributeSerialized } from '~/3d/engine/core/geometry/vertexattribute';
import Indices, { IndicesSerialized } from '~/3d/engine/core/geometry/indices';
import { SimpleJson } from '~/types/CommonTypes';
import { BufferDescription } from '~/3d/engine/core/Types';

export enum WindingOrder {
    Clockwise = 'CW',
    Counterclockwise = 'CCW',
    Collinear = 'COLLINEAR'
}

export enum PrimitiveType {
    Points = 'POINTS',
    Lines = 'LINES',
    // LineLoop = 'LINE_LOOP',
    // LineStrip = 'LINE_STRIP',
    Triangles = 'TRIANGLES',
    // TriangleStrip = 'TRIANGLE_STRIP',
    TriangleFan = 'TRIANGLE_FAN'
}


export type MeshSerialized = {
    bufferArray: ArrayBufferLike;
    attributes: { [ key: string ]: VertexAttributeSerialized };
    attributesValuesDescription: {
        [ key: string ]: BufferDescription
    };
    indices?: IndicesSerialized;
    indicesValuesDescription?: BufferDescription;
    primitiveType?: PrimitiveType;
    frontFaceWindingOrder: WindingOrder;
    shadowVolume?: true;
}

/**
 * Класс меша
 * @class Mesh
 */
export default class Mesh {

    attributes: SimpleJson<VertexAttribute> = {};
    indices?: Indices;
    primitiveType?: PrimitiveType;
    frontFaceWindingOrder: WindingOrder = WindingOrder.Counterclockwise;
    shadowVolume?: true;

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
     * @param attribute{VertexAttribute} Атрибут
     */
    addAttribute( attribute: VertexAttribute ) {
        this.attributes[ attribute.getName() ] = attribute;
    }

    /**
     * Получить набор индексов
     * @method getIndices
     * @return {Indices} Набор индексов
     */
    getIndices() {
        return this.indices;
    }

    /**
     * Задать набор индексов
     * @method setIndices
     * @param indices{Indices} Набор индексов
     */
    setIndices( indices?: Indices ) {
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
     * @param primitiveType{PrimitiveType} Тип отрисовки примитивов
     */
    setPrimitiveType( primitiveType: PrimitiveType ) {
        this.primitiveType = primitiveType;
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
     * @param frontFaceWindingOrder{WindingOrder} Направление обхода точек лицевой стороны
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
     * Усановить данные из объекта
     * @method setFromMesh
     * @return {Mesh} Меш объект
     */
    fromMesh( mesh: Mesh ) {
        const attributes = mesh.attributes;
        for ( const k in attributes ) {
            const attr = attributes[ k ];
            this.attributes[ attr.getName() ] = attr.copy();
        }
        if ( mesh.indices ) {
            this.indices = mesh.indices.copy();
        }

        this.primitiveType = mesh.primitiveType;
        this.frontFaceWindingOrder = mesh.frontFaceWindingOrder;

        this.shadowVolume = mesh.shadowVolume;
    }

    /**
     * Получить сериализуемый JSON объект
     * @method toJSON
     * @return {MeshSerialized} сериализуемый JSON объект
     */
    toJSON(): MeshSerialized {

        // Заполнение атрибутов
        const attributes: SimpleJson<VertexAttributeSerialized> = {};
        const attributesValuesDescription: SimpleJson<BufferDescription> = {};
        const arrayForBuffer: number[] = [];
        for ( const k in this.attributes ) {
            const attr = this.attributes[ k ];
            attributes[ attr.getName() ] = attr.toJSON();
            const vertexStartPos = arrayForBuffer.length;
            const attrValues = attr.getValues();
            const vertexCount = attrValues.length;
            let vertexItemLength = 0;
            for ( let i = 0; i < vertexCount; i++ ) {
                const vertex = attrValues[ i ];
                if ( Array.isArray( vertex ) ) {
                    vertexItemLength = vertex.length;
                    for ( let j = 0; j < vertexItemLength; j++ ) {
                        arrayForBuffer.push( vertex[ j ] );
                    }
                } else {
                    vertexItemLength = 1;
                    arrayForBuffer.push( vertex );
                }
            }

            attributesValuesDescription[ attr.getName() ] = {
                startIndex: vertexStartPos,
                count: vertexCount
            };
        }

        // Заполнение индексов
        let indices: IndicesSerialized | undefined = undefined,
            indicesValuesDescription: BufferDescription | undefined = undefined;
        if ( this.indices ) {
            const indexStartPos = arrayForBuffer.length;
            indices = this.indices.toJSON();

            const indicesArray = this.indices.getValues();
            for ( let i = 0; i < indicesArray.length; i++ ) {
                arrayForBuffer.push( indicesArray[ i ] );
            }

            indicesValuesDescription = {
                startIndex: indexStartPos,
                count: indicesArray.length
            };
        }

        const primitiveType = this.primitiveType;
        const frontFaceWindingOrder = this.frontFaceWindingOrder;

        const bufferArray = new Float32Array( arrayForBuffer ).buffer;

        const shadowVolume = this.shadowVolume;

        return {
            attributes,
            attributesValuesDescription,
            indices,
            indicesValuesDescription,
            primitiveType,
            frontFaceWindingOrder,
            bufferArray,
            shadowVolume
        };
    }

    /**
     * Создать новый объект из JSON объекта
     * @method fromJSON
     * @param json {MeshSerialized} JSON объект
     */
    static fromJSON( json: MeshSerialized ) {
        const result = new Mesh();

        const arrayForBuffer = new Float32Array( json.bufferArray );
        // Разбор атрибутов
        const attributes = json.attributes;
        for ( const k in attributes ) {
            const attr = attributes[ k ];
            if ( attr && attr.name && attr.type ) {
                const vertexAttribute = VertexAttribute.fromJSON( attr );
                const values = vertexAttribute.getValues();
                const vertexItemLength = vertexAttribute.getNumberOfComponents();

                const description = json.attributesValuesDescription[ attr.name ];
                const vertexStartPos = description.startIndex;
                const vertexCount = description.count;

                for ( let i = 0; i < vertexCount; i++ ) {
                    const arrayPos = vertexStartPos + i * vertexItemLength;
                    let vertex: AnyAttributeValue;
                    if ( vertexItemLength > 1 ) {
                        switch ( vertexItemLength ) {
                            case 2:
                                vertex = [0, 0];
                                break;
                            case 3:
                            default:
                                vertex = [0, 0, 0];
                                break;
                            case 4:
                                vertex = [0, 0, 0, 0];
                                break;
                        }
                        for ( let j = 0; j < vertexItemLength; j++ ) {
                            vertex[ j ] = arrayForBuffer[ arrayPos + j ];
                        }
                    } else {
                        vertex = arrayForBuffer[ arrayPos ];
                    }
                    values.push( vertex );
                }

                vertexAttribute.setValues( values );
                result.addAttribute( vertexAttribute );
            }
        }
        // Разбор индексов
        if ( json.indices && json.indicesValuesDescription ) {
            const indices = Indices.fromJSON( json.indices );
            const values = indices.getValues();

            const description = json.indicesValuesDescription;
            const indexStartPos = description.startIndex;
            const indexCount = description.count;

            for ( let i = indexStartPos; i < indexStartPos + indexCount; i++ ) {
                values.push( arrayForBuffer[ i ] );
            }
            // indices.setValues( values );
            result.setIndices( indices );
        }
        if ( json.primitiveType ) {
            result.setPrimitiveType( json.primitiveType );
        }
        if ( json.frontFaceWindingOrder ) {
            result.setFrontFaceWindingOrder( json.frontFaceWindingOrder );
        }

        result.shadowVolume = json.shadowVolume;

        return result;
    }
}
