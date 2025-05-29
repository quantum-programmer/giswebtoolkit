/******************************************** Тазин В. 21/02/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Перечисляемые объекты                        *
 *                                                                  *
 *******************************************************************/
"use strict";

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};

    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    GWTK.gEngine.Renderer.enumBlendEquationMode = Object.freeze({
        Func_Add: 'FUNC_ADD',
        Func_Subtract: 'FUNC_SUBTRACT',
        Func_ReverseSubtract: 'FUNC_REVERSE_SUBTRACT'
    });

    GWTK.gEngine.Renderer.enumClearBuffers = Object.freeze({
        ColorBuffer: ['COLOR_BUFFER_BIT'],
        DepthBuffer: ['DEPTH_BUFFER_BIT'],
        StencilBuffer: ['STENCIL_BUFFER_BIT'],
        ColorAndDepthBuffer: ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT'],
        All: ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT']
    });

    GWTK.gEngine.Renderer.enumComponentDataType = Object.freeze({
        Byte: 'BYTE',
        Short: 'SHORT',
        uByte: 'UNSIGNED_BYTE',
        uShort: 'UNSIGNED_SHORT',
        uInt: 'UNSIGNED_INT',
        Float: 'FLOAT'
    });

    GWTK.gEngine.Renderer.enumDepthComparisonFunction = Object.freeze({
        Never: 'NEVER',
        Less: 'LESS',
        Equal: 'EQUAL',
        LEqual: 'LEQUAL',
        Greater: 'GREATER',
        NotEqual: 'NOTEQUAL',
        GEqual: 'GEQUAL',
        Always: 'ALWAYS'
    });

    GWTK.gEngine.Renderer.enumCullFaceMode = Object.freeze({
        Front: 'FRONT',
        Back: 'BACK',
        FrontAndBack: 'FRONT_AND_BACK'
    });


    GWTK.gEngine.Renderer.enumDrawingType = Object.freeze({
        Points: 0,
        Lines: 1,
        Triangles: 2
    });

    GWTK.gEngine.Renderer.enumDirtyFlags = Object.freeze({
        None: 0,
        DepthAttachment: 1,
        DepthStencilAttachment: 3
    });

    GWTK.gEngine.Renderer.enumDirtyRenderBufferFlags = Object.freeze({
        None: 0,
        DepthAttachment: 1,
        DepthStencilAttachment: 3
    });

    GWTK.gEngine.Renderer.enumFramebufferAttachment = Object.freeze({
        ColorAttachment0: 'COLOR_ATTACHMENT0',
        DepthAttachment: 'DEPTH_ATTACHMENT',
        StensilAttachment: 'STENCIL_ATTACHMENT'
    });

    GWTK.gEngine.Renderer.enumPixelFormat = Object.freeze({
        alpha: 'ALPHA',
        rgb: 'RGB',
        rgba: 'RGBA',
        lum: 'LUMINANCE',
        luma: 'LUMINANCE_ALPHA'
    });

    GWTK.gEngine.Renderer.enumRenderBufferInternalFormat = Object.freeze({
        rgba4: 'RGBA4',
        rgb565: 'RGB565',
        rgb5a1: 'RGB5_A1',
        depthComponent16: 'DEPTH_COMPONENT16',
        stencilIndex8: 'STENCIL_INDEX8',
        depthStencil: 'DEPTH_STENCIL'
    });

    GWTK.gEngine.Renderer.enumShaderType = Object.freeze({
        FragmentShader: 'FRAGMENT_SHADER',
        VertexShader: 'VERTEX_SHADER'
    });

    GWTK.gEngine.Renderer.enumSourceBlendingFactor = Object.freeze({
        Zero: 'ZERO',
        One: 'ONE',
        SrcColor: 'SRC_COLOR',
        OneMinusSrcColor: 'ONE_MINUS_SRC_COLOR',
        DstColor: 'DST_COLOR',
        OneMinusDstColor: 'ONE_MINUS_DST_COLOR',
        SrcAlpha: 'SRC_ALPHA',
        OneMinusSrcAlpha: 'ONE_MINUS_SRC_ALPHA',
        DstAlpha: 'DST_ALPHA',
        OneMinusDstAlpha: 'ONE_MINUS_DST_ALPHA',
        ConstantColor: 'CONSTANT_COLOR',
        OneMinusConstantColor: 'ONE_MINUS_CONSTANT_COLOR',
        ConstantAlpha: 'CONSTANT_ALPHA',
        OneMinusConstantAlpha: 'ONE_MINUS_CONSTANT_ALPHA',
        SrcAlphaSaturate: 'SRC_ALPHA_SATURATE'
    });

    GWTK.gEngine.Renderer.enumStencilOperation = Object.freeze({
        Keep: 'KEEP',
        Zero: 'ZERO',
        Replace: 'REPLACE',
        Increment: 'INCR',
        IncrementWrap: 'INCR_WRAP',
        Decrement: 'DECR',
        DecrementWrap: 'DECR_WRAP',
        Invert: 'INVERT'
    });

    GWTK.gEngine.Renderer.enumStencilTestFunction = Object.freeze({
        Never: 'NEVER',
        Less: 'LESS',
        Equal: 'EQUAL',
        LEqual: 'LEQUAL',
        Greater: 'GREATER',
        NotEqual: 'NOTEQUAL',
        GEqual: 'GEQUAL',
        Always: 'ALWAYS'
    });

    GWTK.gEngine.Renderer.enumTextureFormat = Object.freeze({
        alpha: 0,
        rgb8_8_8: 1,
        rgb5_6_5: 2,
        rgba8_8_8_8: 3,
        rgba4_4_4_4: 4,
        rgba5_5_5_1: 5,
        lum8_8_8: 6,
        lum5_6_5: 7,
        luma8_8_8_8: 8,
        luma4_4_4_4: 9,
        luma5_5_5_1: 10
    });

    GWTK.gEngine.Renderer.enumRenderBufferFormat = Object.freeze({
        rgba4: 0,
        rgb5_6_5: 1,
        rgb5_a1: 2,
        depth_component_16: 3,
        stencil_index_8: 4,
        depth_stencil: 5
    });

    GWTK.gEngine.Renderer.enumTextureMagnificationFilter = Object.freeze({
        Nearest: 'NEAREST',
        Linear: 'LINEAR'
    });

    GWTK.gEngine.Renderer.enumTextureMinificationFilter = Object.freeze({
        Nearest: 'NEAREST',
        Linear: 'LINEAR',
        NearestMipmapNearest: 'NEAREST_MIPMAP_NEAREST',
        LinearMipmapNearest: 'LINEAR_MIPMAP_NEAREST',
        NearestMipmapLinear: 'NEAREST_MIPMAP_LINEAR',
        LinearMipmapLinear: 'LINEAR_MIPMAP_LINEAR'
    });

    GWTK.gEngine.Renderer.enumTextureTarget = Object.freeze({
        texture2d: 'TEXTURE_2D',
        textureCubeMapPosX: 'TEXTURE_CUBE_MAP_POSITIVE_X',
        textureCubeMapNegX: 'TEXTURE_CUBE_MAP_NEGATIVE_X',
        textureCubeMapPosY: 'TEXTURE_CUBE_MAP_POSITIVE_Y',
        textureCubeMapNegY: 'TEXTURE_CUBE_MAP_NEGATIVE_Y',
        textureCubeMapPosZ: 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        textureCubeMapNegZ: 'TEXTURE_CUBE_MAP_NEGATIVE_Z'
    });

    GWTK.gEngine.Renderer.enumRenderBufferTarget = Object.freeze({
        renderBuffer: 'RENDERBUFFER'
    });

    GWTK.gEngine.Renderer.enumTextureType = Object.freeze({
        uByte: 'UNSIGNED_BYTE',
        uShort_565: 'UNSIGNED_SHORT_5_6_5',
        uShort_4444: 'UNSIGNED_SHORT_4_4_4_4',
        uShort_5551: 'UNSIGNED_SHORT_5_5_5_1'
    });

    GWTK.gEngine.Renderer.enumTextureWrap = Object.freeze({
        Clamp: 'CLAMP_TO_EDGE',
        Repeat: 'REPEAT',
        MirroredRepeat: 'MIRRORED_REPEAT'
    });

    GWTK.gEngine.Renderer.enumUniformType = Object.freeze({
        FloatVal: 'uniform1f',
        IntVal: 'uniform1i',

        FloatVec2: 'uniform2fv',
        IntVec2: 'uniform2iv',

        FloatVec3: 'uniform3fv',
        IntVec3: 'uniform3iv',

        FloatVec4: 'uniform4fv',
        IntVec4: 'uniform4iv',

        FloatMat2: 'uniformMatrix2fv',
        FloatMat3: 'uniformMatrix3fv',
        FloatMat4: 'uniformMatrix4fv'
    });

    GWTK.gEngine.Renderer.enumUsagePattern = Object.freeze({
        StaticDraw: 'STATIC_DRAW',
        DynamicDraw: 'DYNAMIC_DRAW',
        StreamDraw: 'STREAM_DRAW'
    });

    GWTK.gEngine.Renderer.enumVertexAttributeLocations = Object.freeze({
        aVertexPosition: 0,
        aVertexNormal: 1,
        aTextureCoord: 2,
        aVertexColor: 3,
        aVertexOffset: 4
    });

    GWTK.gEngine.Renderer.enumWebglTarget = Object.freeze({
        ArrayBuffer: 'ARRAY_BUFFER',
        ElementArrayBuffer: 'ELEMENT_ARRAY_BUFFER'
    });

}