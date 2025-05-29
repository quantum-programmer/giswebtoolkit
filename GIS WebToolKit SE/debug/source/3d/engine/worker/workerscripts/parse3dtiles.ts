/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Разбор 3d тайлов карты                        *
 *                                                                  *
 *******************************************************************/


//TODO: привести в порядок

export enum PrimitiveTypeByte {
    PRIMITIV_FACESET = 1,
    PRIMITIV_LINESET = 2,
    PRIMITIV_POINTSET = 3
}

type XYHDOUBLE = {
    X: number;
    Y: number;
    H: number;
}

export type Metadata = {
    DFRAME: number[];
    MinHeight: number;
    MaxHeight: number;
    MinZoom: number;
    MaxZoom: number;
    Epsg: number;
    TileSize: number;
    MinTextureZoom: number;
    MaxTextureZoom: number;
    MaxObjectSizeInZoom: number[];
    Version: string;
    Matrix: string;
}

export type Tile3D = TileHeader & { ModelList: Model[], TileList: Tile[] }

type TileHeader = {
    Length: number;
    Epsg: number;
    TileSize: number;
    ModelCount: number;
    Zoom: number;
    MinCol: number;
    MaxCol: number;
    MinRow: number;
    MaxRow: number;
}
type Tile = {
    Col: number;
    Row: number;
    Zoom: number;
    Epsg: number;
}
type ModelHeader = {
    LevelVis: number;
    LowLevel: number;
    HightLevel: number;
    PrimitivCount: number;
    Id: number;
    ModelPoint?: XYHDOUBLE;
    NameModel: string;
    IdentStr: string;
}

export type Model = ModelHeader & { PrimitiveList: Primitive[] }


type S3dPrimitivDescription = {
    Id: number;
    Type: PrimitiveTypeByte;
    Col: number;
    Row: number;
    Zoom: number;
}
export type Primitive = S3dPrimitivDescription & { FUNCTIONLIST?: FUNCTIONLIST }

type PrimitiveS3dStructure = S3dFaceset | S3dLineset | S3dPointset;


type PRIMITIVESETVALUES = {
    Vertex: IMG3DPOINT[];
    Colors: IMG3DRGBA[];
    Normal: IMG3DPOINT[];
    VertexIndex: number[];
    TexCoordinates: FLOATPOINT[];
}

export type FACESET = S3dFaceset & PRIMITIVESETVALUES;
export type LINESET = S3dLineset & PRIMITIVESETVALUES;
export type POINTSET = S3dPointset & PRIMITIVESETVALUES;

type FUNCTIONLIST = FACESET | LINESET | POINTSET;

type S3dSet = {
    ColorPlace: number;
    VertexCount: number;
    MaterialId: number;
    TextureId?: number;
    NormalPlace?: number;
    VertexIndexCount?: number;
    VertexIndexPlace?: number;
    TexCoordPlace?: number;
    IndexCountsPlace?: number;
    ColorUnit?: 0 | 1;
}

type S3dFaceset = S3dSet & {
    TextureId: number;
    FlagFrontFace: 0 | 1;
    Solid: 0 | 1;
    VertexIndexCount: number;
}
type S3dLineset = S3dSet & {
    LineCount: number;
    PointCountArray: number[];
    VertexIndexCountArray: number[];
    IndexCountsPlace: number;
    VertexIndexPlace: number;
}

type S3dPointset = S3dSet;

export type IMG3DPOINT = {
    X: number;
    Y: number;
    Z: number;
}
export type FLOATPOINT = {
    X: number;
    Y: number;
}

export type IMG3DRGBA = {
    R: number;
    G: number;
    B: number;
    A: number;
}

type TextureHeader = {
    ItemCount: number;
    Zoom: number;
    Zero: number;
}

export type Desc3dTexture = {
    Id: number;
    Width: number;
    Height: number;
    ImageFormat: 'image/png' | 'image/jpeg' | 'image/bmp';
    imageUrl?: string;
}
export type Desc3dMaterial = {
    Id: number;
    Color: IMG3DRGBA;
    Material: ACT3DMATERIALMODE;
    ColorFlag: number;
    MaterialFlag: number;
}

type ACT3DMATERIALMODE = {
    AmbientColor: IMG3DRGBA;
    DiffuseColor: IMG3DRGBA;
    SpecularColor: IMG3DRGBA;
    EmissiveColor: IMG3DRGBA;
    Shininess: number;
}

/**
 * Класс парсера 3d тайлов
 * @class ParserTiles3d
 */
export class ParserTiles3d {

    private static imageFormatList: { [ key: number ]: 'image/png' | 'image/jpeg' | 'image/bmp' } = {
        1: 'image/png',
        2: 'image/jpeg',
        3: 'image/bmp'
    };
    // private static ERRORLIST = {
    //     0: "Data length error",
    //     1836597052: "Service Exception Report",
    //     1329865020: "Error page"
    // };

    private static TABLEMAXZOOM = 24;

    private static littleEndian = true;

    /**
     * Разобрать трёхмерные тайлы
     * @method readObject3D
     * @public
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param seviceVersion {Number} Версия сервиса
     * @return {Object} Описание объекта
     */
    static readTiles3D( Head3DArray: ArrayBuffer, seviceVersion: number ) {
        const tilesArray: Tile3D[] = [],
            TileList: Tile[] = [];
        let curoffset = 0;

        if ( this.checkException( Head3DArray, curoffset ) ) {
            return tilesArray;
        }

        const tileHeaderStructure = this.readTileHeader( Head3DArray, curoffset );
        const TileHeader = tileHeaderStructure.TileHeader;
        const ModelList: Model[] = [];

        curoffset = tileHeaderStructure.HeadOffset;

        // обработка моделей
        for ( let i = 0, ileng = TileHeader.ModelCount; i < ileng; i++ ) {
            const modelHeaderStructure = this.readModelHeader( Head3DArray, curoffset, seviceVersion );
            const currentModel: Model = {
                ...modelHeaderStructure.ModelHeader,
                PrimitiveList: []
            };
            curoffset = modelHeaderStructure.HeadOffset;
            let startPrimitiveOffset = modelHeaderStructure.HeadOffset;
            for ( let ii = 0, iileng = currentModel.PrimitivCount; ii < iileng; ii++ ) {
                const primitivDescriptionStructure = this.readS3dPrimitivDescription( Head3DArray, startPrimitiveOffset );
                const currentPrimitive: Primitive = primitivDescriptionStructure.S3dPrimitivDescription;
                let newTile = true;
                for ( let jj = 0, tile; (tile = TileList[ jj ]); jj++ ) {
                    if ( tile.Col === currentPrimitive.Col &&
                        tile.Row === currentPrimitive.Row &&
                        tile.Zoom === currentPrimitive.Zoom ) {
                        newTile = false;
                        break;
                    }
                }
                if ( newTile ) {
                    TileList.push( {
                        Col: currentPrimitive.Col,
                        Row: currentPrimitive.Row,
                        Zoom: currentPrimitive.Zoom,
                        Epsg: TileHeader.Epsg
                    } );
                }

                curoffset = primitivDescriptionStructure.HeadOffset;
                let PrimitiveS3dStructure: PrimitiveS3dStructure | undefined = undefined;
                switch ( currentPrimitive.Type ) {
                    case PrimitiveTypeByte.PRIMITIV_FACESET:
                        const S3dFacesetStructure = this.readS3dFaceset( Head3DArray, curoffset );
                        PrimitiveS3dStructure = S3dFacesetStructure.S3dFaceset;
                        curoffset = S3dFacesetStructure.HeadOffset;
                        break;
                    case PrimitiveTypeByte.PRIMITIV_LINESET:
                        const S3dLinesetStructure = this.readS3dLineset( Head3DArray, curoffset );
                        PrimitiveS3dStructure = S3dLinesetStructure.S3dLineset;
                        curoffset = S3dLinesetStructure.HeadOffset;
                        break;
                    case PrimitiveTypeByte.PRIMITIV_POINTSET:
                        const S3dPointsetStructure = this.readS3dPointset( Head3DArray, curoffset );
                        PrimitiveS3dStructure = S3dPointsetStructure.S3dPointset;
                        curoffset = S3dPointsetStructure.HeadOffset;
                        break;
                }

                if ( PrimitiveS3dStructure ) {
                    let Vertex: IMG3DPOINT[] = [],
                        Colors: IMG3DRGBA[] = [],
                        Normal: IMG3DPOINT[] = [],
                        VertexIndex: number[] = [],
                        TexCoordinates: FLOATPOINT[] = [],
                        vertexOffset = curoffset, colorOffset, normalOffset;

                    if ( PrimitiveS3dStructure.ColorPlace > 0 ) {
                        Colors = [];
                        colorOffset = curoffset + PrimitiveS3dStructure.ColorPlace;
                    }

                    if ( PrimitiveS3dStructure.NormalPlace !== undefined ) {
                        Normal = [];
                        normalOffset = curoffset + PrimitiveS3dStructure.NormalPlace;
                    }
                    for ( let j = 0; j < PrimitiveS3dStructure.VertexCount; j++ ) {
                        const pointStructure = this.getIMG3DPOINT( Head3DArray, vertexOffset ); // Координаты углов относительно нуля знака
                        Vertex[ j ] = pointStructure.Point;
                        vertexOffset = pointStructure.HeadOffset;
                        if ( colorOffset !== undefined ) {
                            let colorStructure;
                            if (PrimitiveS3dStructure.ColorUnit === 1) {
                                colorStructure = this.getIMG3DRGBABYTE(Head3DArray, colorOffset);
                            } else {
                                colorStructure = this.getIMG3DRGBA(Head3DArray, colorOffset);
                            }
                            Colors[ j ] = colorStructure.Color;
                            colorOffset = colorStructure.HeadOffset;
                        }
                        if ( normalOffset !== undefined ) {
                            if ( PrimitiveS3dStructure.NormalPlace !== 0 ) {
                                const normalStructure = this.getIMG3DPOINT( Head3DArray, normalOffset );
                                Normal[ j ] = normalStructure.Point;
                                normalOffset = normalStructure.HeadOffset;
                            } else {
                                Normal[ j ] = { X: 0, Y: 0, Z: 0 };
                            }
                        }
                    }
                    if ( PrimitiveS3dStructure.VertexIndexCount !== undefined && PrimitiveS3dStructure.VertexIndexCount > 0 && PrimitiveS3dStructure.VertexIndexPlace !== undefined ) {
                        const arrayStructure = this.getLongArray( Head3DArray, curoffset + PrimitiveS3dStructure.VertexIndexPlace, PrimitiveS3dStructure.VertexIndexCount );
                        VertexIndex = arrayStructure.LArray;
                    }
                    if ( PrimitiveS3dStructure.VertexCount > 0 && PrimitiveS3dStructure.TexCoordPlace ) {
                        const texCoordOffset = curoffset + PrimitiveS3dStructure.TexCoordPlace;
                        const darrayStructure = this.getFLOATPOINTArray( Head3DArray, texCoordOffset, PrimitiveS3dStructure.VertexCount );
                        if ( darrayStructure.DArray.length > 0 ) {
                            TexCoordinates = darrayStructure.DArray;
                        }
                    }
                    if ( PrimitiveS3dStructure.IndexCountsPlace !== undefined && PrimitiveS3dStructure.VertexIndexPlace !== undefined ) {
                        VertexIndex = this.getLineVertexIndexArray( Head3DArray, curoffset, PrimitiveS3dStructure as S3dLineset ).LArray;
                    }

                    currentPrimitive.FUNCTIONLIST = {
                        ...PrimitiveS3dStructure,
                        Vertex,
                        Colors,
                        Normal,
                        VertexIndex,
                        TexCoordinates
                    };
                }
                currentModel.PrimitiveList.push( currentPrimitive );
                startPrimitiveOffset = startPrimitiveOffset + primitivDescriptionStructure.Length;
            }
            ModelList.push( currentModel );
            curoffset = modelHeaderStructure.ModelEndOffset;
        }

        for ( let i = TileHeader.MinCol; i <= TileHeader.MaxCol; i++ ) {
            for ( let j = TileHeader.MinRow; j <= TileHeader.MaxRow; j++ ) {
                let newTile = true;
                for ( let jj = 0, tile; (tile = TileList[ jj ]); jj++ ) {
                    if ( tile.Col === i &&
                        tile.Row === j &&
                        tile.Zoom === TileHeader.Zoom ) {
                        newTile = false;
                        break;
                    }
                }
                if ( newTile ) {
                    TileList.push( {
                        Col: i,
                        Row: j,
                        Zoom: TileHeader.Zoom,
                        Epsg: TileHeader.Epsg
                    } );
                }
            }
        }

        tilesArray.push( {
            ...TileHeader,
            ModelList,
            TileList
        } );

        return tilesArray;
    }

    /**
     * Разобрать текстуры трёхмерных тайлов
     * @method read3dTextures
     * @public
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @return {Object} Описание объекта
     */
    public static read3dTextures( Head3DArray: ArrayBuffer ) {
        let curoffset = 0;
        if ( this.checkException( Head3DArray, curoffset ) ) {
            return;
        }

        const textureHeaderStructure = this.readTextureHeader( Head3DArray, curoffset );
        const Zoom = textureHeaderStructure.TextureHeader.Zoom;
        const TextureList: Desc3dTexture[] = [];
        curoffset = textureHeaderStructure.HeadOffset;
        for ( let i = 0, ileng = textureHeaderStructure.TextureHeader.ItemCount; i < ileng; i++ ) {
            // обработка материалов
            // for (i = 0, ileng = currentTile.MaterialCount; i < ileng; i++) {
            //     const currentDesc = this.readDesc3dMaterial(Head3DArray, curoffset);
            //     currentTile.MaterialList.push(currentDesc);
            //     curoffset = currentDesc.HeadOffset;
            // }

            // обработка текстур
            const desc3dTextureStructure = this.readDesc3dTexture( Head3DArray, curoffset );
            if ( desc3dTextureStructure !== undefined ) {
                //распарсить текстуру
                TextureList.push( desc3dTextureStructure.Desc3dTexture );
                curoffset = desc3dTextureStructure.HeadOffset;
            } else {
                console.error( 'Unexpected end of file: ' + i + ' of ' + ileng + ' textures were added!' );
                i = ileng;
            }

        }
        return {
            Zoom,
            TextureList
        };
    }

    /**
     * Разобрать материалы трёхмерных тайлов
     * @method read3dMaterials
     * @public
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @return {Object} Описание объекта
     */
    public static read3dMaterials( Head3DArray: ArrayBuffer ) {
        if ( this.checkException( Head3DArray, 0 ) ) {
            return;
        }
        let curoffset = 0;

        const textureHeaderStructure = this.readTextureHeader( Head3DArray, curoffset );
        const Zoom = textureHeaderStructure.TextureHeader.Zoom;
        curoffset = textureHeaderStructure.HeadOffset;

        const MaterialList: Desc3dMaterial[] = [];
        for ( let i = 0, ileng = textureHeaderStructure.TextureHeader.ItemCount; i < ileng; i++ ) {
            // обработка материалов
            const desc3dMaterialStructure = this.readDesc3dMaterial( Head3DArray, curoffset );
            if ( desc3dMaterialStructure !== undefined ) {
                MaterialList.push( desc3dMaterialStructure.Desc3dMaterial );
                curoffset = desc3dMaterialStructure.HeadOffset;
            } else {
                console.error( 'Unexpected end of file: ' + i + ' of ' + ileng + ' materials were added!' );
                i = ileng;
            }
        }

        return {
            Zoom,
            MaterialList
        };
    }

    /**
     * Разобрать метаданные трёхмерных тайлов
     * @method read3dMetadata
     * @public
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @return {Object} Описание объекта
     */
    public static read3dMetadata( Head3DArray: ArrayBuffer ) {
        if ( this.checkException( Head3DArray, 0 ) ) {
            return;
        }
        let curoffset = 0;
        const dframeStructure = this.readDFRAME( Head3DArray, curoffset );
        const DFRAME = dframeStructure.DFRAME;
        curoffset = dframeStructure.HeadOffset;

        let dataView = new DataView( Head3DArray, curoffset, 40 );
        curoffset += 40;

        const MinHeight = dataView.getFloat64( 0, this.littleEndian );
        const MaxHeight = dataView.getFloat64( 8, this.littleEndian );
        const MinZoom = dataView.getUint32( 16, this.littleEndian );
        const MaxZoom = dataView.getUint32( 20, this.littleEndian );
        const Epsg = dataView.getUint32( 24, this.littleEndian );
        const TileSize = dataView.getUint32( 28, this.littleEndian );
        const MinTextureZoom = dataView.getUint32( 32, this.littleEndian );
        const MaxTextureZoom = dataView.getUint32( 36, this.littleEndian );

        const MaxObjectSizeInZoom: number[] = [];
        const length = this.TABLEMAXZOOM * 4;
        dataView = new DataView( Head3DArray, curoffset, length );
        curoffset += length;
        for ( let i = 0; i < length / 4; i++ ) {
            MaxObjectSizeInZoom[ i ] = dataView.getUint32( 4 * i, this.littleEndian );
        }

        dataView = new DataView( Head3DArray, curoffset, 72 );

        let str = '';
        let pos = 0;
        while ( pos < 8 ) {
            const code = dataView.getInt8( pos++ );
            if ( code > 0 ) {
                str += String.fromCharCode( code );
            }
        }
        const Version = str;

        str = '';
        while ( pos < 72 ) {
            const code = dataView.getInt8( pos++ );
            if ( code > 0 ) {
                str += String.fromCharCode( code );
            }
        }
        const Matrix = str;

        return {
            DFRAME,
            MinHeight,
            MaxHeight,
            MinZoom,
            MaxZoom,
            Epsg,
            TileSize,
            MinTextureZoom,
            MaxTextureZoom,
            MaxObjectSizeInZoom,
            Version,
            Matrix
        } as Metadata;

    }

    /**
     * Прочитать заголовок тайла
     * @method readTileHeader
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readTileHeader( arrayBuffer: ArrayBuffer, offset: number ) {
        const dataView = new DataView( arrayBuffer, offset, 40 );

        const Length = dataView.getUint32( 0, this.littleEndian );   // Длина
        const Epsg = dataView.getUint32( 4, this.littleEndian );     // Код системы координат
        const TileSize = dataView.getUint32( 8, this.littleEndian );   // Размер тайла в пикселях
        const ModelCount = dataView.getUint32( 12, this.littleEndian );    // Кол-во моделей

        const Zoom = dataView.getUint32( 16, this.littleEndian );    // Кол-во моделей
        const MinCol = dataView.getUint32( 20, this.littleEndian );    // Кол-во моделей
        const MaxCol = dataView.getUint32( 24, this.littleEndian );    // Кол-во моделей
        const MinRow = dataView.getUint32( 28, this.littleEndian );    // Кол-во моделей
        const MaxRow = dataView.getUint32( 32, this.littleEndian );    // Кол-во моделей
        const Reserve = dataView.getUint32( 36, this.littleEndian ); // Резерв
        const HeadOffset = 40;

        const TileHeader: TileHeader = {
            Length,
            Epsg,
            TileSize,
            ModelCount,
            Zoom,
            MinCol,
            MaxCol,
            MinRow,
            MaxRow
        };

        return {
            TileHeader,
            Reserve,
            HeadOffset
        };
    }

    /**
     * Проверка исключения
     * @method checkException
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {boolean} Если исключение, то вернет `true`
     */
    private static checkException( arrayBuffer: ArrayBuffer, offset: number ) {
        let check, code;
        if ( arrayBuffer.byteLength === 0 ) {
            check = true;
            // code = 0;
        } else {
            const dataView = new DataView( arrayBuffer, offset, 4 );
            code = dataView.getUint32( 0, this.littleEndian );
            check = (code === 1836597052 || code === 1329865020);
        }

        // if (check) {
        // console.error(this.ERRORLIST[code]);
        // }
        return check;
    }

    /**
     * Прочитать заголовок модели
     * @method readModelHeader
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param seviceVersion {Number} Версия сервиса
     * @return {Object} Описание объекта
     */
    private static readModelHeader( arrayBuffer: ArrayBuffer, offset: number, seviceVersion: number ) {

        const dataView = new DataView( arrayBuffer, offset, 24 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Общая длина записи
        // Уровень генерализации модели объекта:
        const LevelVis = dataView.getUint32( 4, this.littleEndian );       // - Уровень видимости модели
        const LowLevel = dataView.getUint32( 8, this.littleEndian );       // - Нижняя граница видимости
        const HightLevel = dataView.getUint32( 12, this.littleEndian );    // - Верхняя граница видимости
        const PrimitivCount = dataView.getUint32( 16, this.littleEndian ); // Кол-во примитивов
        const Id = dataView.getUint32( 20, this.littleEndian );    // Иденификатор модели в БД
        let nameModelStructure: {
            NameModel: string;
            HeadOffset: number;
        }, ModelPoint: XYHDOUBLE | undefined = undefined;
        if ( seviceVersion >= 130002 ) {
            ModelPoint = this.getXYHDOUBLE( arrayBuffer, offset + 24 ).XYHDOUBLE;
            nameModelStructure = this.getNameModel( arrayBuffer, offset + 48 );
        } else {
            nameModelStructure = this.getNameModel( arrayBuffer, offset + 24 );
        }
        const NameModel = nameModelStructure.NameModel;  // Название модели
        const guid = this.getGUID( arrayBuffer, nameModelStructure.HeadOffset );
        const IdentStr = guid.GUID; // GUID объекта (Globally Unique Identifier — статистический уникальный идентификатор из 32 символов от 0 до F)

        const HeadOffset = guid.HeadOffset;
        const ModelEndOffset = offset + Length;

        const ModelHeader: ModelHeader = {
            LevelVis,
            LowLevel,
            HightLevel,
            PrimitivCount,
            Id,
            NameModel,
            IdentStr,
            ModelPoint
        };

        return { Length, ModelHeader, HeadOffset, ModelEndOffset };
    }

    /**
     * Прочитать заголовок текстуры/материала
     * @method readTextureHeader
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readTextureHeader( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 16 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // длина записи
        const ItemCount = dataView.getUint32( 4, this.littleEndian );       // Кол-во материалов/текстур
        const Zoom = dataView.getUint32( 8, this.littleEndian );        // Номер приближения
        const Zero = dataView.getUint32( 12, this.littleEndian );

        const TextureHeader: TextureHeader = {
            ItemCount, Zoom, Zero
        };

        const HeadOffset = offset + 16;

        return { Length, TextureHeader, HeadOffset };
    }

    /**
     * Прочитать описание свойств материала
     * @method readDesc3dMaterial
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readDesc3dMaterial( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 104 );

        const Length = dataView.getUint32( 0, this.littleEndian );
        if ( offset + Length > arrayBuffer.byteLength ) {
            return;
        }
        const Id = dataView.getUint32( 4, this.littleEndian );
        const colorStructure = this.getIMG3DRGBA( arrayBuffer, offset + 8 );
        const Color = colorStructure.Color;
        const materialStructure = this.getACT3DMATERIALMODE( arrayBuffer, colorStructure.HeadOffset );
        const Material = materialStructure.ACT3DMATERIALMODE;
        let curDataOffset = materialStructure.HeadOffset - offset;
        const ColorFlag = dataView.getInt8( curDataOffset++ );
        const MaterialFlag = dataView.getInt8( curDataOffset++ );
        const Reserve: number[] = [];
        for ( let i = 0; i < 6; i++ ) {
            Reserve.push( dataView.getInt8( curDataOffset ) );
            curDataOffset += 1;
        }
        const HeadOffset = offset + 104;

        const Desc3dMaterial: Desc3dMaterial = {
            Id,                                             // Иденификатор материала
            ColorFlag,                                      // 1 - наличие цвета, 0 - отсутствие
            Color,                                          // Цвет
            MaterialFlag,                                   // 1 - наличие материала, 0 - отсутствие
            Material                                        // Материал
        };

        return {
            Length,                                        // Длина записи
            Desc3dMaterial,
            Reserve,                                       // Резерв
            HeadOffset
        };
    }

    /**
     * Прочитать описание свойств текстуры
     * @method readDesc3dTexture
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readDesc3dTexture( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 24 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Длина записи
        const Id = dataView.getUint32( 4, this.littleEndian );
        const Format = dataView.getUint32( 8, this.littleEndian );
        const ImageFormat = this.imageFormatList[ Format as 1 | 2 | 3 ];
        const TextureLength = dataView.getUint32( 12, this.littleEndian ); // Длина текстуры
        const Width = dataView.getUint32( 16, this.littleEndian );
        const Height = dataView.getUint32( 20, this.littleEndian );
        const HeadOffset = offset + Length + TextureLength;

        if ( HeadOffset > arrayBuffer.byteLength ) {
            return;
        }
        // function ab2str(array) {
        //     const stringKey = "";
        //     for (const i = 0; i < array.length; i++) {
        //         stringKey += String.fromCharCode(array[i]);
        //     }
        //     return btoa(stringKey);
        // }
        // structure.imageUrl = 'data:' + structure.ImageFormat + ';base64,' + ab2str(new Uint8Array(arrayBuffer, offset + Length, TextureLength));

        const imageArray = new Uint8Array( arrayBuffer, offset + Length, TextureLength );
        const ImageBlob = new Blob( [imageArray], { type: ImageFormat } );
        const imageUrl = URL.createObjectURL( ImageBlob );

        const Desc3dTexture: Desc3dTexture = {
            Id,                                 // Иденификатор текстуры
            Width,                              // Ширина изображения
            Height,                             // Высота изображения
            ImageFormat,                        // Формат FORMAT_PNG/FORMAT_JPG/FORMAT_BMP
            imageUrl
        };

        return {
            Desc3dTexture,
            HeadOffset
        };
    }

    /**
     * Прочитать описание примитива
     * @method readS3dPrimitivDescription
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readS3dPrimitivDescription( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 24 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Длина записи
        const Id = dataView.getUint32( 4, this.littleEndian ); // Идентификатор примитива
        const Type: PrimitiveTypeByte = dataView.getUint32( 8, this.littleEndian );   // Тип примитива PRIMITIV_FACESET PRIMITIV_LINESET PRIMITIV_POINTSET
        const Col = dataView.getUint32( 12, this.littleEndian );   // Столбец тайла
        const Row = dataView.getUint32( 16, this.littleEndian );   // Строка тайла
        const Zoom = dataView.getUint32( 20, this.littleEndian );  // Номер приближения

        const HeadOffset = offset + 24;

        const S3dPrimitivDescription: S3dPrimitivDescription = {
            Id,
            Type,
            Col,
            Row,
            Zoom
        };

        return {
            Length,
            S3dPrimitivDescription,
            HeadOffset
        };
    }

    /**
     * Прочитать элемент типа "поверхность"
     * @method readS3dFaceset
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readS3dFaceset( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 40 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Длина записи
        const VertexCount = dataView.getUint32( 4, this.littleEndian );    // Число координат вершин
        const VertexIndexCount = dataView.getUint32( 8, this.littleEndian );   // Число индексов вершин
        const VertexIndexPlace = dataView.getUint32( 12, this.littleEndian );  // Смещение на массив индексов вершин для построения поверхности от конца
        const NormalPlace = dataView.getUint32( 16, this.littleEndian );   // Смещение на массив нормалей к поверхности от конца IMG3DFACESET, размерность членов массива - IMG3DPOINT
        const TexCoordPlace = dataView.getUint32( 20, this.littleEndian ); // Смещение на массив координат текстуры от конца IMG3DFACESET, размерность членов массива - DOUBLEPOINT
        const ColorPlace = dataView.getUint32( 24, this.littleEndian );    // Смещение на массив цветов от конца IMG3DFACESET, размерность членов массива - IMG3DRGBA
        const TextureId = dataView.getUint32( 28, this.littleEndian ); // Идентификатор текстуры в БД (если есть)
        const MaterialId = dataView.getUint32( 32, this.littleEndian );    // Идентификатор материалов в БД (если есть)
        const FlagFrontFace = dataView.getInt8( 36 ) as 0 | 1; // Направление обхода при построении многоугольника (0 - по часовой стрелке, 1 - против часовой стрелки)
        const Solid = dataView.getInt8( 37 ) as 0 | 1; // Цельность фигуры (0 - неизвестно (освещение двустороннее), 1 - цельная (освещение снаружи))
        const ColorUnit = dataView.getInt8( 38 ) as 0 | 1; // Размерность хранения цвета в массиве цветов по смещению ColorPlace: 0 - тип IMG3DRGBA, 1 - тип IMG3DRGBABYTE

        const Reserve: number[] = []; // Резерв
        for ( let i = 0; i < 1; i++ ) {
            Reserve.push( dataView.getInt8( 39 + i ) );
        }

        const HeadOffset = offset + 40;

        const S3dFaceset: S3dFaceset = {
            VertexCount,
            VertexIndexCount,
            VertexIndexPlace,
            NormalPlace,
            TexCoordPlace,
            ColorPlace,
            TextureId,
            MaterialId,
            FlagFrontFace,
            Solid,
            ColorUnit
        };

        return { Length, S3dFaceset, Reserve, HeadOffset };
    }

    /**
     * Прочитать описание массива точек
     * @method readS3dPointset
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readS3dPointset( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 24 );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Длина записи
        const VertexCount = dataView.getUint32( 4, this.littleEndian );  // Число точек, нормалей, цветов
        const NormalPlace = dataView.getUint32( 8, this.littleEndian ); // Смещение на массив нормалей к поверхности от конца S3DPOINTSET, размерность членов массива IMG3DFLOATPOINT
        const ColorPlace = dataView.getUint32( 12, this.littleEndian ); // Смещение на массив цветов от конца S3DPOINTSET, размерность членов массива - IMG3DRGBA
        const MaterialId = dataView.getUint32( 16, this.littleEndian );    // Идентификатор материалов в БД (если есть)
        const ColorUnit = dataView.getInt8( 20 ) as 0 | 1; // Размерность хранения цвета в массиве цветов по смещению ColorPlace: 0 - тип IMG3DRGBA, 1 - тип IMG3DRGBABYTE

        const Reserve: number[] = [];
        for ( let i = 0; i < 3; i++ ) {
            Reserve.push( dataView.getInt8( 21 + i ) );
        }
        const HeadOffset = offset + 24;

        const S3dPointset: S3dPointset = {
            VertexCount,
            NormalPlace,
            ColorPlace,
            MaterialId,
        };

        return {
            Length,
            S3dPointset,
            Reserve,
            HeadOffset,
            ColorUnit
        };
    }

    /**
     * Прочитать описание массива линий
     * @method readS3dLineset
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readS3dLineset( arrayBuffer: ArrayBuffer, offset: number ) {

        const structsize = 24;
        const dataView = new DataView( arrayBuffer, offset, structsize );

        const Length = dataView.getUint32( 0, this.littleEndian ); // Длина записи
        const LineCount = dataView.getUint32( 4, this.littleEndian );  // Число линий
        const IndexCountsPlace = dataView.getUint32( 8, this.littleEndian );   // Смещение на массив количества точек полилиний от конца S3DLINESET, размерность от конца LONG
        const VertexIndexPlace = dataView.getUint32( 12, this.littleEndian );  // Смещение на массив индексов точек полилинии от конца S3DLINESET, размерность членов массива - LONG
        const ColorPlace = dataView.getUint32( 16, this.littleEndian );    // Смещение на массив цветов от конца S3DLINESET, размерность членов массива - IMG3DRGBA (Цвета распределены по вершинам)
        const MaterialId = dataView.getUint32( 20, this.littleEndian );    // Идентификатор материалов в БД (если есть)

        let curoffset = offset + structsize + IndexCountsPlace;

        // массив кол-ва вершин
        const pointCountObject = this.getLongArray( arrayBuffer, curoffset, LineCount );
        const PointCountArray = pointCountObject.LArray;
        // кол-во вершин
        let VertexCount = 0;
        for ( let ii = 0; ii < LineCount; ii++ ) {
            VertexCount = VertexCount + PointCountArray[ ii ];
        }

        curoffset = offset + structsize + VertexIndexPlace;
        // массив индексов вершин
        const vertexIndexCountObject = this.getLongArray( arrayBuffer, curoffset, VertexCount );
        const VertexIndexCountArray = vertexIndexCountObject.LArray;

        const HeadOffset = structsize + offset;

        const S3dLineset: S3dLineset = {
            LineCount,
            IndexCountsPlace,
            VertexIndexPlace,
            ColorPlace,
            MaterialId,
            PointCountArray,
            VertexIndexCountArray,
            VertexCount
        };

        return {
            Length,
            S3dLineset,
            HeadOffset
        };
    }

    /**
     * Прочитать название модели
     * @method getNameModel
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getNameModel( arrayBuffer: ArrayBuffer, offset: number ) {
        let NameModel = '';
        const dataView = new DataView( arrayBuffer, offset, 512 );
        let pos = 0;
        while ( pos < 512 ) {
            const code = dataView.getInt16( pos, this.littleEndian );
            pos += 2;
            if ( code > 0 ) {
                NameModel += String.fromCharCode( code );
            }
        }

        const HeadOffset = offset + 512;

        return {
            NameModel,
            HeadOffset
        };
    }

    /**
     * Прочитать GUID
     * @method getGUID
     * @private
     * @param arrayBuffer {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getGUID( arrayBuffer: ArrayBuffer, offset: number ) {

        const dataView = new DataView( arrayBuffer, offset, 32 );
        let GUID = '';
        let pos = 0;
        while ( pos < 32 ) {
            const code = dataView.getInt8( pos++ );
            if ( code > 0 ) {
                GUID += String.fromCharCode( code );
            }
        }
        const HeadOffset = offset + 32;

        return { GUID, HeadOffset };
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
        const structure: { Color: IMG3DRGBA; HeadOffset: number; } = {
            Color: {
                R: 0,
                G: 0,
                B: 0,
                A: 0
            },
            HeadOffset: 0
        };
        const dataView = new DataView( Head3DArray, offset, 16 );

        structure.Color.R = dataView.getFloat32( 0, this.littleEndian );		// Красный
        structure.Color.G = dataView.getFloat32( 4, this.littleEndian );       // Зеленый
        structure.Color.B = dataView.getFloat32( 8, this.littleEndian );       // Синий
        structure.Color.A = dataView.getFloat32( 12, this.littleEndian );  // Альфа, степень непрозрачности
        structure.HeadOffset = offset + 16;

        return structure;
    }

    /**
     * Заполнить структуру IMG3DRGBABYTE
     * @method getIMG3DRGBABYTE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DRGBABYTE( Head3DArray: ArrayBuffer, offset: number ) {          // ЦВЕТ RGBA
        const structure: { Color: IMG3DRGBA; HeadOffset: number; } = {
            Color: {
                R: 0,
                G: 0,
                B: 0,
                A: 0
            },
            HeadOffset: 0
        };
        const dataView = new DataView( Head3DArray, offset, 4 );

        structure.Color.R = dataView.getInt8( 0 ) / 255;		// Красный
        structure.Color.G = dataView.getInt8( 1 ) / 255;       // Зеленый
        structure.Color.B = dataView.getInt8( 2 ) / 255;       // Синий
        structure.Color.A = dataView.getInt8( 3 ) / 255;  // Альфа, степень непрозрачности
        structure.HeadOffset = offset + 4;

        return structure;
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

        const ambientcolorStructure = this.getIMG3DRGBA( Head3DArray, offset );
        const diffuseColorcolorStructure = this.getIMG3DRGBA( Head3DArray, ambientcolorStructure.HeadOffset );
        const specularColorcolorStructure = this.getIMG3DRGBA( Head3DArray, diffuseColorcolorStructure.HeadOffset );
        const emissiveColorcolorStructure = this.getIMG3DRGBA( Head3DArray, specularColorcolorStructure.HeadOffset );
        const dataView = new DataView( Head3DArray, emissiveColorcolorStructure.HeadOffset, 8 );
        const shininess = dataView.getFloat64( 0, this.littleEndian );    // Зеркальная экспонента

        return {
            ACT3DMATERIALMODE: {
                AmbientColor: ambientcolorStructure.Color,          // Рассеянный цвет
                DiffuseColor: diffuseColorcolorStructure.Color,     // Диффузный цвет
                SpecularColor: specularColorcolorStructure.Color,   // Зеркальный
                EmissiveColor: emissiveColorcolorStructure.Color,	// Излучаемый
                Shininess: shininess                                // Зеркальная экспонента
            },
            HeadOffset: emissiveColorcolorStructure.HeadOffset + 8
        };
    }

    /**
     * Заполнить структуру XYHDOUBLE
     * @method getXYHDOUBLE
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getXYHDOUBLE( Head3DArray: ArrayBuffer, offset: number ) {          // КООРДИНАТЫ ТОЧКИ

        const dataView = new DataView( Head3DArray, offset, 24 );

        const X = dataView.getFloat64( 0, this.littleEndian );
        const Y = dataView.getFloat64( 8, this.littleEndian );
        const H = dataView.getFloat64( 8, this.littleEndian );
        const HeadOffset = offset + 24;
        const XYHDOUBLE: XYHDOUBLE = {
            X,
            Y,
            H,
        };
        return {
            XYHDOUBLE,
            HeadOffset
        };
    }

    /**
     * Заполнить массив структур FLOATPOINT
     * @method getFLOATPOINTArray
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @param count {Number} Количество точек
     * @return {Object} Описание объекта
     */
    private static getFLOATPOINTArray( Head3DArray: ArrayBuffer, offset: number, count: number ) {          // КООРДИНАТЫ ТОЧЕК
        const structure: { DArray: FLOATPOINT[]; HeadOffset: number; } = {
            DArray: [],
            HeadOffset: 0
        };
        if ( offset + count * 8 > Head3DArray.byteLength ) {
            console.error( 'getFLOATPOINTArray overflow' );
            count = 0;
        }
        if ( count === 0 )
            return structure;

        let newoffset = offset;
        for ( let ii = 0; ii < count; ii++ ) {
            const fpointStructure = this.getFLOATPOINT( Head3DArray, newoffset );
            structure.DArray[ ii ] = fpointStructure.FPoint;
            newoffset = fpointStructure.HeadOffset;
        }

        structure.HeadOffset = newoffset;
        return structure;
    }

    /**
     * Заполнить структуру FLOATPOINT
     * @method getFLOATPOINT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getFLOATPOINT( Head3DArray: ArrayBuffer, offset: number ) {        // КООРДИНАТЫ ТОЧКИ
        const structure: { FPoint: FLOATPOINT; HeadOffset: number; } = {
            FPoint: {
                X: 0,
                Y: 0
            },
            HeadOffset: 0
        };
        const dataView = new DataView( Head3DArray, offset, 8 );

        structure.FPoint.X = dataView.getFloat32( 0, this.littleEndian );
        structure.FPoint.Y = dataView.getFloat32( 4, this.littleEndian );
        structure.HeadOffset = offset + 8;

        return structure;
    }

    /**
     * Заполнить структуру IMG3DPOINT
     * @method getIMG3DPOINT
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static getIMG3DPOINT( Head3DArray: ArrayBuffer, offset: number ) {          // ТОЧКА
        const structure: { Point: IMG3DPOINT; HeadOffset: number } = {
            Point: {
                X: 0,
                Y: 0,
                Z: 0
            },
            HeadOffset: 0
        };
        const dataView = new DataView( Head3DArray, offset, 12 );
        // Получение координат с учетом перевода из системы координат шаблона (локальной версии)
        // в систему WEB-приложения (Xw = Xл Yw = -Zл Zw = Yл)
        structure.Point.X = dataView.getFloat32( 0, this.littleEndian );                    // 17/03/17
        structure.Point.Y = dataView.getFloat32( 4, this.littleEndian );
        structure.Point.Z = dataView.getFloat32( 8, this.littleEndian );
        structure.HeadOffset = offset + 12;

        return structure;
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
        const structure: { LArray: number[]; HeadOffset: number; } = {
            LArray: [],
            HeadOffset: 0
        };
        const dataView = new DataView( Head3DArray, offset, count * 4 );
        for ( let ii = 0; ii < count; ii++ ) {
            structure.LArray[ ii ] = dataView.getInt32( ii * 4, this.littleEndian );
        }
        structure.HeadOffset = offset + count * 4;
        return structure;
    }

    /**
     * Заполнить DFRAME
     * @method readDFRAME
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param offset {Number} Cмещение в потоке
     * @return {Object} Описание объекта
     */
    private static readDFRAME( Head3DArray: ArrayBuffer, offset: number ) {

        const DFRAME: number[] = [];
        const dataView = new DataView( Head3DArray, offset, 32 );
        for ( let ii = 0; ii < 4; ii++ ) {
            DFRAME[ ii ] = dataView.getFloat64( ii * 8, this.littleEndian );
        }
        const HeadOffset = offset + 32;

        return { DFRAME, HeadOffset };
    }

    /**
     * Получить индексы LINESET
     * @method getLineVertexIndexArray
     * @private
     * @param Head3DArray {ArrayBuffer} Поток данных
     * @param curoffset {Number} Cмещение в потоке
     * @param FUNCTIONLIST {Object} Описание функции
     * @return {Object} Описание объекта
     */
    private static getLineVertexIndexArray( Head3DArray: ArrayBuffer, curoffset: number, FUNCTIONLIST: S3dLineset ) {
        const structure: { LArray: number[]; } = { LArray: [] };
        let indexCountOffset = curoffset + FUNCTIONLIST.IndexCountsPlace;
        let vertexIndexOffset = curoffset + FUNCTIONLIST.VertexIndexPlace;
        for ( let k = 0; k < FUNCTIONLIST.LineCount; k++ ) {
            let dataView = new DataView( Head3DArray, indexCountOffset, 4 );
            indexCountOffset += 4;
            const indexCount = dataView.getUint32( 0, this.littleEndian );
            dataView = new DataView( Head3DArray, vertexIndexOffset, indexCount * 4 );
            vertexIndexOffset += indexCount * 4;
            for ( let kk = 0; kk < indexCount; kk++ ) {
                structure.LArray.push( dataView.getUint32( kk * 4, this.littleEndian ) );
            }
        }
        return structure;
    }


}
