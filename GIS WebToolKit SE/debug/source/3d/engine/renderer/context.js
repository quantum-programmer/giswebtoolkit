/****************************************** Тазин В.О. 17/09/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Компонент контекста рисования                     *
 *                                                                  *
 *******************************************************************/
"use strict";
import { DataTypeSize } from '~/3d/engine/renderer/enumfromcore';

if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Renderer = GWTK.gEngine.Renderer || {};

    /**
     * Компонент контекста рисования
     * @class GWTK.gEngine.Renderer.Context
     */
    GWTK.gEngine.Renderer.Context = (function () {

        var mContextState = {
            clearColor: [],
            clearDepth: 1,
            clearStencil: 0,
            viewPort: [],
            activeTexture: null,
            activeBufferList: {},
            vertexAttributeList: {},
            newFrameBuffer: null,
            pixelStorei: {}
        };
        var mRenderState = null;
        var mTextureUnits = null;
        var mActiveShaderProgram = null;
        /**
         * Графический контекст для рисования
         * @property mGL
         * @private
         */
        var mGL = null;

        var Context = function () {
        };

        Context.prototype = {

            /**
             * Получить графический контекст для рисования
             * @method getGL
             * @public
             * @return {WebGLRenderingContext} Контекст WebGL
             */
            getGL: function () {
                return mGL;
            },

            /**
             * Удалить ссылку на контекст
             * @method destroy
             * @public
             */
            destroy: function () {
                mContextState.clearColor.length = 0;
                mContextState.clearDepth = 1;
                mContextState.clearStencil = 0;
                mContextState.viewPort.length = 0;
                mContextState.activeTexture = null;
                mContextState.activeBufferList = {};
                mContextState.vertexAttributeList = {};
                mContextState.newFrameBuffer = null;
                mContextState.pixelStorei = {};
                mGL = null;
            },

            /**
             * Задать значение параметра состояния контекста
             * @method enable
             * @public
             * @param glKey {number} Идентификатор параметра контекста
             * @param enable {boolean} Значение доступен/недоступен
             */
            enable: function (glKey, enable) {
                if (enable) {
                    mGL.enable(glKey);
                } else {
                    mGL.disable(glKey);
                }
            },

            /**
             * Установить текстуру в заданную текстурную единицу
             * @method setTextureUnit
             * @public
             * @param index {number} Индекс текстурной единицы
             * @param texture {GWTK.gEngine.Renderer.WebGL.Texture2DWebgl} Текстура
             */
            setTextureUnit: function (index, texture) {
                if (!GWTK.gEngine.isNumeric(index) || !(texture instanceof GWTK.gEngine.Renderer.WebGL.Texture2DWebgl)) {
                    return;
                }
                mTextureUnits.setTextureUnit(index, texture);
            },
            /**
             * Убрать текстуру из заданной текстурной единицы
             * @method unsetTextureUnit
             * @public
             * @param index {number} Индекс текстурной единицы
             */
            unsetTextureUnit: function (index) {
                if (!GWTK.gEngine.isNumeric(index)) {
                    return;
                }
                mTextureUnits.unsetTextureUnit(index);
            },
            /**
             * Очистить все текстурные единицы
             * @method unsetAll
             * @public
             */
            unsetAll: function () {
                mTextureUnits.unsetAll();
            },

            /**
             * Инициализация WebGL контекста, его состояния и текстурных единиц
             * @method initializeWebGL
             * @public
             * @param htmlCanvasID {string} Идентификатор холста для рисования
             */
            initializeWebGL: function (htmlCanvasID) {

                var canvas = document.getElementById(htmlCanvasID);
                // получаем контекст и записываем его в приватное свойство
                mGL = canvas.getContext("webgl", {alpha: false, stencil: true}) ||
                    canvas.getContext("experimental-webgl", {alpha: false, stencil: true});


                if (mGL === null) {
                    document.write(w2utils.lang("Failed to get WebGL context"));
                    return;
                }
                this.clearState = new GWTK.gEngine.Renderer.ClearState();
                //Allows using UINT32 values
                if (!mGL.getExtension('OES_element_index_uint')) {
                    // document.write(w2utils.lang("Unsigned Integer values are not supported"));
                }
                this.ANGLEex = mGL.getExtension('ANGLE_instanced_arrays');
                //Allows using ANGLE_instanced_arrays
                if (!this.ANGLEex) {
                    GWTK.gEngine.Mediator.publish('writeProtocol', {
                        text: w2utils.lang("ANGLE_instanced_arrays are not supported"),
                        displayFlag: true
                    });
                }

                // Set images to flip the y axis to match the texture coordinate space.
                this.setPixelStore('UNPACK_FLIP_Y_WEBGL', true);
                mRenderState = new GWTK.gEngine.Renderer.RenderState();
                mRenderState.facetCulling.enabled = false;
                mRenderState.depthTest.enabled = false;

                mTextureUnits = new GWTK.gEngine.Renderer.WebGL.TextureUnitsWebgl(mGL.getParameter(mGL.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
            },
            /**
             * Установить параметры хранения пикселей
             * @method setPixelStore
             * @public
             * @param pname {string} Название параметра
             * @param value {object} Значение параметра
             */
            setPixelStore: function (pname, value) {
                if (mContextState.pixelStorei[pname] !== value) {
                    mGL.pixelStorei(mGL[pname], value);
                    mContextState.pixelStorei[pname] = value;
                }
            },

            /**
             * Инициализация WebGL контекста и загрузка ресурсов
             * @method initializeEngine
             * @public
             * @param htmlCanvasID {string} Идентификатор холста для рисования
             */
            initializeEngine: function (htmlCanvasID) {
                this.initializeWebGL(htmlCanvasID);
                // инициализация загрузки стандартных ресурсов
                GWTK.gEngine.Scene.DefaultResources.initialize();
            },

            /**
             * Получить состояние контекста рисования
             * @method getRenderState
             * @public
             * @return {GWTK.gEngine.Renderer.RenderState} Состояние контекста рисования
             */
            getRenderState: function () {
                return Object.create(mRenderState);
            },

            /**
             * Получить границы области рисования
             * @method getViewPort
             * @public
             * @return {array} Границы области рисования
             */
            getViewPort: function () {
                return mContextState.viewPort;
            },
            /**
             * Установить границы рисования
             * @method setViewPort
             * @public
             */
            setViewPort: function (frame) {
                if (Array.isArray(frame) && frame.length === 4) {
                    if (mContextState.viewPort[0] !== frame[0] ||
                        mContextState.viewPort[1] !== frame[1] ||
                        mContextState.viewPort[2] !== frame[2] ||
                        mContextState.viewPort[3] !== frame[3]
                    ) {
                        mGL.viewport(frame[0], frame[1], frame[2], frame[3]);
                        mContextState.viewPort[0] = frame[0];// x position of bottom-left corner
                        mContextState.viewPort[1] = frame[1];// y position of bottom-left corner
                        mContextState.viewPort[2] = frame[2];// width of the area to be drawn
                        mContextState.viewPort[3] = frame[3];// height of the area to be drawn
                    }
                }
            },

            /**
             * Очистка области рисования
             * @method clear
             * @public
             * @param clearState {GWTK.gEngine.Renderer.ClearState|undefined} Параметры очищения области рисования
             */
            clear: function (clearState) {
                clearState = clearState || this.clearState;

                if (!(clearState instanceof GWTK.gEngine.Renderer.ClearState)) {
                    console.warn('Wrong clearState input parameter');
                    return;
                }

                this._updateFramebuffer();

                this._updateScissorTest(clearState.scissorTest);
                this._updateColorMask(clearState.colorMask);
                this._updateDepthMask(clearState.depthMask);

                this._setClearColor(clearState.color);
                this._setClearDepth(clearState.depth);
                this._setClearStencil(clearState.stencil);

                var buffer = 0;
                for (var i = 0; i < clearState.buffers.length; i++) {
                    buffer |= mGL[clearState.buffers[i]];
                }
                if (buffer !== 0) {
                    mGL.clear(buffer);
                }
            },
            /**
             * Установить активную текстурную единицу
             * @method setActiveTexture
             * @public
             * @return channel {number} Номер текстурной единицы
             */
            setActiveTexture: function (channel) {
                if (mContextState.activeTexture !== channel) {
                    mGL.activeTexture(mGL.TEXTURE0 + channel);
                    mContextState.activeTexture = channel;
                }
            },
            /**
             * Обработчик перед рисованием
             * @method beforeDraw
             * @public
             * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
             * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
             */
            beforeDraw: function (drawState, sceneState) {
                this._updateRenderState(drawState.renderState);
                this._updateVertexArray(drawState.vertexArray);
                this._updateShaderProgram(drawState, sceneState);
                mTextureUnits.clean();
                this._updateFramebuffer();
            },
            /**
             * Рисование
             * @method draw
             * @public
             * @param primitiveTypeWebgl {PrimitiveType} Способ рисования
             * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
             * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
             * @param [numElements] {number} Количество элементов по индексному массиву
             * @param [offset] {number} Смещение по индексному массиву
             */
            draw: function (primitiveTypeWebgl, drawState, sceneState, numElements, offset) {
                this.beforeDraw(drawState, sceneState);
                var vertexArray = drawState.vertexArray;
                var indexBuffer = vertexArray.getIndexBuffer();
                if (indexBuffer != null) {
                    numElements = numElements || indexBuffer.getSize() / DataTypeSize[indexBuffer.getType()];
                    mGL.drawElements(mGL[primitiveTypeWebgl], numElements, mGL[indexBuffer.getType()], offset || 0);
                } else {
                    numElements = numElements || vertexArray.getVertexCount();
                    mGL.drawArrays(mGL[primitiveTypeWebgl], offset || 0, numElements);
                }
            },


            /**
             * Рисование однотипных объектов
             * @method drawInstanced
             * @public
             * @param primitiveTypeWebgl {PrimitiveType} Способ рисования
             * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
             * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
             * @param numElements {number} Количество элементов по индексному массиву
             * @param offset {number} Смещение по индексному массиву
             */
            drawInstanced: function (primitiveTypeWebgl, drawState, sceneState, numElements, offset) {
                if (this.ANGLEex) {
                    this.beforeDraw(drawState, sceneState);

                    var primCount = drawState.instancedArray.getVertexCount();
                    this._updateInstancedArray(drawState.instancedArray);

                    var vertexArray = drawState.vertexArray;
                    var indexBuffer = vertexArray.getIndexBuffer();

                    if (indexBuffer != null) {
                        numElements = numElements || indexBuffer.getSize() / DataTypeSize[indexBuffer.getType()];
                        this.ANGLEex.drawElementsInstancedANGLE(mGL[primitiveTypeWebgl], numElements, mGL[indexBuffer.getType()], offset || 0, primCount);
                    } else {
                        numElements = numElements || vertexArray.getVertexCount();
                        this.ANGLEex.drawArraysInstancedANGLE(mGL[primitiveTypeWebgl], offset || 0, numElements, primCount);
                    }
                    drawState.instancedArray.unbindInstanced(this.ANGLEex);
                }
            },

            /**
             * Задать значение параметра состояния вершинного атрибута
             * @method enableVertexAttribute
             * @public
             * @param index {number} Индекс атрибута в контексте
             * @param flag {boolean} Флаг доступен/недоступен
             */
            enableVertexAttribute: function (index, flag) {
                flag = !!flag;
                if (mContextState.vertexAttributeList[index] !== flag) {
                    if (flag === true) {
                        mGL.enableVertexAttribArray(index);
                    } else {
                        mGL.disableVertexAttribArray(index);
                    }
                    mContextState.vertexAttributeList[index] = flag;
                }
            },

            /**
             * Активировать буфер
             * @method enableVertexAttribute
             * @public
             * @param target {GWTK.gEngine.Renderer.enumWebglTarget} Целевое назначение буфера
             * @param webGLBuffer {WebGLBuffer} Ссылка на буфер в контексте
             */
            bindBuffer: function (target, webGLBuffer) {
                if (mContextState.activeBufferList[target] !== webGLBuffer) {
                    mGL.bindBuffer(mGL[target], webGLBuffer);
                    mContextState.activeBufferList[target] = webGLBuffer;
                }
            },

            /**
             * Задать указатель в буфере для вершинного атрибута
             * @method setVertexAttribPointer
             * @public
             * @param locPosition {number} Индекс атрибута в контексте
             * @param size {number} Количество компонентов атрибута вершин
             * @param componentDatatypeWebgl {VertexAttributeType} Тип значения
             * @param normalize {number} Флаг нормализации в контексте
             * @param strideInBytes {number} Шаг повторения в байтах
             * @param offsetInBytes {number} Смещение в байтах для первого компонента в массиве
             */
            setVertexAttribPointer: function (locPosition, size, componentDatatypeWebgl, normalize, strideInBytes, offsetInBytes) {
                mGL.vertexAttribPointer(locPosition, size, mGL[componentDatatypeWebgl], normalize, strideInBytes, offsetInBytes);
            },

            /**
             * Создать коллекцию параметров вершин
             * @method createVertexArray
             * @public
             * @param mesh {Mesh} Геометрия мэша
             * @param shaderAttributes {Object} Коллеция шейдерных атрибутов (GWTK.gEngine.Renderer.ShaderVertexAttribute)
             * @param usagePattern {GWTK.gEngine.Renderer.enumUsagePattern} Шаблон буфера для контекста
             * @return {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Коллекция параметров вершин
             */
            createVertexArray: function (mesh, shaderAttributes, usagePattern) {
                return this.createVertexArrayFromMeshBuffers(GWTK.gEngine.Renderer.GraphicDevice.createMeshBuffers(mesh, shaderAttributes, usagePattern));
            },
            /**
             * Создать пустую коллекцию параметров вершин
             * @method createEmptyVertexArray
             * @public
             * @return {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Коллекция параметров вершин
             */
            createEmptyVertexArray: function () {
                return new GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl();
            },
            /**
             * Создать коллекцию параметров вершин из буферизованного мэша
             * @method createVertexArrayFromMeshBuffers
             * @public
             * @param meshBuffers {GWTK.gEngine.Renderer.MeshBuffers} Буферизованный мэш
             * @param [out] {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Результат
             * @return {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Коллекция параметров вершин
             */
            createVertexArrayFromMeshBuffers: function (meshBuffers, out) {
                var va = out || new GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl();
                va.setIndexBuffer(meshBuffers.getIndexBuffer());
                var attributes = meshBuffers.getAttributes();
                for (var i in attributes) {
                    va.setAttribute(parseInt(i), attributes[i]);
                }
                return va;
            },
            /**
             * Создать буфер рисования
             * @method createFramebuffer
             * @public
             * @return {GWTK.gEngine.Renderer.WebGL.FramebufferWebgl} Буфер рисования
             */
            createFramebuffer: function () {
                return new GWTK.gEngine.Renderer.WebGL.FramebufferWebgl();
            },
            /**
             * Установить активный буфер рисования
             * @method setFramebuffer
             * @public
             * @param frameBuffer {GWTK.gEngine.Renderer.WebGL.FramebufferWebgl|null} Буфер рисования
             */
            setFramebuffer: function (frameBuffer) {
                mContextState.newFrameBuffer = frameBuffer;
            },
            /**
             * Получить активный буфер рисования
             * @method getFramebuffer
             * @public
             * @return {GWTK.gEngine.Renderer.WebGL.FramebufferWebgl} Буфер рисования
             */
            getFramebuffer: function () {
                return mContextState.newFrameBuffer;
            },
            /**
             * Установить цвет очистки экрана
             * @method _setClearColor
             * @private
             * @param color {GWTK.gEngine.Renderer.WebGL.FramebufferWebgl} Цвет после очистки экрана [R,G,B,A]
             */
            _setClearColor: function (color) {
                if (mContextState.clearColor[0] !== color[0] || mContextState.clearColor[1] !== color[1] ||
                    mContextState.clearColor[2] !== color[2] || mContextState.clearColor[3] !== color[3]) {

                    mGL.clearColor(color[0], color[1], color[2], color[3]);
                    mContextState.clearColor[0] = color[0];
                    mContextState.clearColor[1] = color[1];
                    mContextState.clearColor[2] = color[2];
                    mContextState.clearColor[3] = color[3];
                }
            },
            /**
             * Установить глубину очистки экрана
             * @method _setClearDepth
             * @private
             * @param depth {number} Глубина после очистки экрана {0..1}
             */
            _setClearDepth: function (depth) {
                if (mContextState.clearDepth !== depth) {
                    mGL.clearDepth(depth);
                    mContextState.clearDepth = depth;
                }

            },
            /**
             * Установить значение попиксельной области рисования очистки экрана
             * @method _setClearStencil
             * @private
             * @param stencil {number} Значение попиксельной области рисования
             */
            _setClearStencil: function (stencil) {
                if (mContextState.clearStencil !== stencil) {
                    mGL.clearStencil(stencil);
                    mContextState.clearStencil = stencil;
                }

            },
            /**
             * Обновить состояние контекста
             * @method _updateRenderState
             * @private
             * @param renderState {GWTK.gEngine.Renderer.RenderState} Состояние контекста рисования
             */
            _updateRenderState: function (renderState) {
                // ApplyPrimitiveRestart(renderState.PrimitiveRestart);
                this._updateFacetCulling(renderState.facetCulling);
                // ApplyProgramPointSize(renderState.ProgramPointSize);
                this._updateDrawingType(renderState.drawingType);
                this._updateScissorTest(renderState.scissorTest);
                this._updateStencilTest(renderState.stencilTest);
                this._updateDepthTest(renderState.depthTest);
                this._updateDepthRange(renderState.depthRange);
                this._updateBlending(renderState.blending);
                this._updateColorMask(renderState.colorMask);
                this._updateDepthMask(renderState.depthMask);
            },
            /**
             * Обновить состояние фильтрации по нормали поверхности
             * @method _updateFacetCulling
             * @private
             * @param facetCulling {GWTK.gEngine.Renderer.FacetCulling} Состояние фильтрации по нормали поверхности
             */
            _updateFacetCulling: function (facetCulling) {
                if (mRenderState.facetCulling.enabled !== facetCulling.enabled) {
                    this.enable(mGL['CULL_FACE'], facetCulling.enabled);
                    mRenderState.facetCulling.enabled = facetCulling.enabled;
                }

                if (facetCulling.enabled) {
                    if (mRenderState.facetCulling.face !== facetCulling.face) {
                        mGL.cullFace(mGL[facetCulling.face]);
                        mRenderState.facetCulling.face = facetCulling.face;
                    }
                    if (mRenderState.facetCulling.frontFaceWindingOrder !== facetCulling.frontFaceWindingOrder) {
                        mGL.frontFace(mGL[facetCulling.frontFaceWindingOrder]);
                        mRenderState.facetCulling.frontFaceWindingOrder = facetCulling.frontFaceWindingOrder;
                    }
                }
            },
            /**
             * Обновить способ рисования
             * @method _updateDrawingType
             * @private
             * @param drawingType {GWTK.gEngine.Renderer.enumDrawingType} Способ рисования
             */
            _updateDrawingType: function (drawingType) {
                if (mRenderState.drawingType !== drawingType) {
                    mRenderState.drawingType = drawingType;
                }
            },
            /**
             * Обновить состояние определенной области рисования
             * @method _updateScissorTest
             * @private
             * @param scissorTest {GWTK.gEngine.Renderer.ScissorTest} Состояние определенной области рисования
             */
            _updateScissorTest: function (scissorTest) {
                if (mRenderState.scissorTest.enabled !== scissorTest.enabled) {
                    this.enable(mGL['SCISSOR_TEST'], scissorTest.enabled);
                    mRenderState.scissorTest.enabled = scissorTest.enabled;
                }

                if (scissorTest.enabled) {
                    if (mRenderState.scissorTest.box[0] !== scissorTest.box[0] ||
                        mRenderState.scissorTest.box[1] !== scissorTest.box[1] ||
                        mRenderState.scissorTest.box[2] !== scissorTest.box[2] ||
                        mRenderState.scissorTest.box[3] !== scissorTest.box[3]
                    ) {
                        mGL.scissor(scissorTest.box[0], scissorTest.box[1], scissorTest.box[2], scissorTest.box[3]);
                        for (var i = 0; i < 4; i++) {
                            mRenderState.scissorTest.box[i] = scissorTest.box[i];
                        }
                    }

                }
            },
            /**
             * Обновить состояние попиксельной области рисования
             * @method _updateStencilTest
             * @private
             * @param stencilTest {GWTK.gEngine.Renderer.StencilTest} Состояние попиксельной области рисования
             */
            _updateStencilTest: function (stencilTest) {
                if (mRenderState.stencilTest.enabled !== stencilTest.enabled) {
                    this.enable(mGL['STENCIL_TEST'], stencilTest.enabled);
                    mRenderState.stencilTest.enabled = stencilTest.enabled;
                }

                if (stencilTest.enabled) {
                    this._updateStencil(GWTK.gEngine.Renderer.enumCullFaceMode.Front, mRenderState.stencilTest.front, stencilTest.front);
                    this._updateStencil(GWTK.gEngine.Renderer.enumCullFaceMode.Back, mRenderState.stencilTest.back, stencilTest.back);
                }
            },
            /**
             * Обновить функции попиксельной области рисования
             * @method _updateStencil
             * @private
             * @param face {GWTK.gEngine.Renderer.enumCullFaceMode} Сторона фильтрации по нормали поверхности
             * @param currentStencilTest {GWTK.gEngine.Renderer.StencilTestFace} Прямая функция определения попиксельной области рисования
             * @param newStencilTest {GWTK.gEngine.Renderer.StencilTestFace} Обратная функция определения попиксельной области рисования
             */
            _updateStencil: function (face, currentStencilTest, newStencilTest) {
                if ((currentStencilTest.stencilFail !== newStencilTest.stencilFail) ||
                    (currentStencilTest.depthFailStencilPass !== newStencilTest.depthFailStencilPass) ||
                    (currentStencilTest.depthPassStencilPass !== newStencilTest.depthPassStencilPass)) {
                    mGL.stencilOpSeparate(mGL[face], mGL[newStencilTest.stencilFail], mGL[newStencilTest.depthFailStencilPass], mGL[newStencilTest.depthPassStencilPass]);
                    currentStencilTest.stencilFail = newStencilTest.stencilFail;
                    currentStencilTest.depthFailStencilPass = newStencilTest.depthFailStencilPass;
                    currentStencilTest.depthPassStencilPass = newStencilTest.depthPassStencilPass;
                }

                if ((currentStencilTest.func !== newStencilTest.func) ||
                    (currentStencilTest.ref !== newStencilTest.ref) ||
                    (currentStencilTest.mask !== newStencilTest.mask)) {
                    // mGL.stencilMaskSeparate(mGL[face], newStencilTest.mask);
                    mGL.stencilFuncSeparate(mGL[face], mGL[newStencilTest.func], newStencilTest.ref, newStencilTest.mask);
                    currentStencilTest.func = newStencilTest.func;
                    currentStencilTest.ref = newStencilTest.ref;
                    currentStencilTest.mask = newStencilTest.mask;

                }

            },
            /**
             * Обновить состояние теста глубины
             * @method _updateDepthTest
             * @private
             * @param depthTest {GWTK.gEngine.Renderer.DepthTest} Состояние теста глубины
             */
            _updateDepthTest: function (depthTest) {
                if (mRenderState.depthTest.enabled !== depthTest.enabled) {
                    this.enable(mGL['DEPTH_TEST'], depthTest.enabled);
                    mRenderState.depthTest.enabled = depthTest.enabled;
                }
                if (depthTest.enabled) {
                    if (mRenderState.depthTest.func !== depthTest.func) {
                        mGL.depthFunc(mGL[depthTest.func]);
                        mRenderState.depthTest.func = depthTest.func;
                    }
                }
            },
            /**
             * Обновить параметры теста глубины
             * @method _updateDepthRange
             * @private
             * @param depthRange {GWTK.gEngine.Renderer.DepthRange} Параметры теста глубины
             */
            _updateDepthRange: function (depthRange) {
                if (mRenderState.depthRange.zNear !== depthRange.zNear ||
                    mRenderState.depthRange.zFar !== depthRange.zFar) {
                    mGL.depthRange(depthRange.zNear, depthRange.zFar);
                    mRenderState.depthRange.zNear = depthRange.zNear;
                    mRenderState.depthRange.zFar = depthRange.zFar;
                }
            },
            /**
             * Обновить состояние смешивания
             * @method _updateBlending
             * @private
             * @param blending {GWTK.gEngine.Renderer.Blending} Состояние смешивания
             */
            _updateBlending: function (blending) {
                if (mRenderState.blending.enabled !== blending.enabled) {
                    this.enable(mGL['BLEND'], blending.enabled);
                    mRenderState.blending.enabled = blending.enabled;
                }

                if (blending.enabled) {

                    if (mRenderState.blending.srcRGBFactor !== blending.srcRGBFactor ||
                        mRenderState.blending.dstRGBFactor !== blending.dstRGBFactor ||
                        mRenderState.blending.srcAlphaFactor !== blending.srcAlphaFactor ||
                        mRenderState.blending.dstAlphaFactor !== blending.dstAlphaFactor) {
                        mGL.blendFuncSeparate(mGL[blending.srcRGBFactor], mGL[blending.dstRGBFactor],
                            mGL[blending.srcAlphaFactor], mGL[blending.dstAlphaFactor]);

                        mRenderState.blending.srcRGBFactor = blending.srcRGBFactor;
                        mRenderState.blending.dstRGBFactor = blending.dstRGBFactor;
                        mRenderState.blending.srcAlphaFactor = blending.srcAlphaFactor;
                        mRenderState.blending.dstAlphaFactor = blending.dstAlphaFactor;
                    }


                    if (mRenderState.blending.blendEquationRGB !== blending.blendEquationRGB ||
                        mRenderState.blending.blendEquationAlpha !== blending.blendEquationAlpha) {
                        mGL.blendEquationSeparate(mGL[blending.blendEquationRGB],
                            mGL[blending.blendEquationAlpha]);

                        mRenderState.blending.blendEquationRGB = blending.blendEquationRGB;
                        mRenderState.blending.blendEquationAlpha = blending.blendEquationAlpha;
                    }

                    if (mRenderState.blending.blendColor[0] !== blending.blendColor[0] ||
                        mRenderState.blending.blendColor[1] !== blending.blendColor[1] ||
                        mRenderState.blending.blendColor[2] !== blending.blendColor[2] ||
                        mRenderState.blending.blendColor[3] !== blending.blendColor[3]) {
                        mGL.blendColor(blending.blendColor[0], blending.blendColor[1],
                            blending.blendColor[2], blending.blendColor[3]);
                        for (var i = 0; i < 4; i++) {
                            mRenderState.blending.blendColor[i] = blending.blendColor[i];
                        }
                    }
                }
            },
            /**
             * Обновить состояние маски цвета
             * @method _updateColorMask
             * @private
             * @param colorMask {GWTK.gEngine.Renderer.ColorMask} Состояние маски цвета
             */
            _updateColorMask: function (colorMask) {
                if (mRenderState.colorMask.red !== colorMask.red ||
                    mRenderState.colorMask.green !== colorMask.green ||
                    mRenderState.colorMask.blue !== colorMask.blue ||
                    mRenderState.colorMask.alpha !== colorMask.alpha) {
                    mGL.colorMask(colorMask.red, colorMask.green, colorMask.blue, colorMask.alpha);

                    mRenderState.colorMask.red = colorMask.red;
                    mRenderState.colorMask.green = colorMask.green;
                    mRenderState.colorMask.blue = colorMask.blue;
                    mRenderState.colorMask.alpha = colorMask.alpha;
                }
            },
            /**
             * Обновить состояние записи в буфер глубины
             * @method _updateDepthMask
             * @private
             * @param depthMask {boolean} Флаг записи в буфер глубины
             */
            _updateDepthMask: function (depthMask) {
                if (mRenderState.depthMask !== depthMask) {
                    mGL.depthMask(depthMask);

                    mRenderState.depthMask = depthMask;
                }
            },
            /**
             * Активация вершинных атрибутов и буфера индексов в контексте
             * @method _updateVertexArray
             * @private
             * @param vertexArray {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Вершинный массив контекста
             */
            _updateVertexArray: function (vertexArray) {
                vertexArray.bind();
            },
            /**
             * Активация вершинных атрибутов и буфера индексов в контексте для множественной отрисовки
             * @method _updateInstancedArray
             * @private
             * @param instancedArray {GWTK.gEngine.Renderer.WebGL.VertexCollectionWebgl} Вершинный массив контекста
             */
            _updateInstancedArray: function (instancedArray) {
                instancedArray.bindInstanced(this.ANGLEex);
            },
            /**
             * Активация шейдерной программы
             * @method _updateShaderProgram
             * @private
             * @param drawState {GWTK.gEngine.Renderer.DrawState} Объект параметров рисования
             * @param sceneState {GWTK.gEngine.Renderer.SceneState} Объект параметров сцены
             */
            _updateShaderProgram: function (drawState, sceneState) {
                var shaderProgram = drawState.shaderProgram;

                if (mActiveShaderProgram !== shaderProgram) {
                    shaderProgram.bind();
                    mActiveShaderProgram = shaderProgram;
                }
                mActiveShaderProgram.clean(this, drawState, sceneState);
            },
            /**
             * Активация буфера рисования в контексте
             * @method _updateFramebuffer
             * @private
             */
            _updateFramebuffer: function () {
                if (mContextState.newFrameBuffer !== mContextState.boundFramebuffer) {
                    if (mContextState.newFrameBuffer !== null) {
                        mContextState.newFrameBuffer.bind();
                    } else {
                        GWTK.gEngine.Renderer.WebGL.FramebufferWebgl.prototype.unbind();
                    }

                    mContextState.boundFramebuffer = mContextState.newFrameBuffer;
                }
                if (mContextState.newFrameBuffer !== null) {
                    mContextState.newFrameBuffer.clean();
                }
            }
            // /**
            //  * Заполнить параметры очищения области рисования
            //  * @method enable
            //  * @private
            //  */
            // _fillColorBuffersEnum: function () {
            //     var enumClearBuffers = GWTK.gEngine.Renderer.enumClearBuffers;
            //     enumClearBuffers.ColorBuffer = mGL.COLOR_BUFFER_BIT;
            //     enumClearBuffers.DepthBuffer = mGL.DEPTH_BUFFER_BIT;
            //     enumClearBuffers.StencilBuffer = mGL.STENCIL_BUFFER_BIT;
            //     enumClearBuffers.ColorAndDepthBuffer = mGL.COLOR_BUFFER_BIT | mGL.DEPTH_BUFFER_BIT;
            //     enumClearBuffers.All = mGL.COLOR_BUFFER_BIT | mGL.DEPTH_BUFFER_BIT | mGL.STENCIL_BUFFER_BIT;
            // },
        };

        return new Context();
    }());

}
