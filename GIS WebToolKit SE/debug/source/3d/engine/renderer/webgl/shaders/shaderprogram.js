/******************************************** Тазин В. 23/10/19  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Класс шейдерной программы                     *
 *                                                                  *
 *******************************************************************/
"use strict";
if (window.GWTK) {

    /**
     * Класс шейдерной программы
     * @class GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl
     * @constructor GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl
     * @param vertexShader {string} Текст вершинного шейдера
     * @param fragmentShader {string} Текст фрагментного шейдера
     *
     */
    GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl = function (vertexShader, fragmentShader) {
        var gl = GWTK.gEngine.Renderer.Context.getGL();
        if (gl == null || typeof vertexShader != "string" || typeof fragmentShader != "string") {
            console.warn('Invalid input data');
            return {};
        }
        this.mShaderId = "shader_" + Date.now() + "" + Math.random();
        this.mCompiledProgram = null;
        this.mDirtyUniforms = [];

        this.mVertexShader = this._compileShader(vertexShader, GWTK.gEngine.Renderer.enumShaderType.VertexShader, gl);
        this.mFragmentShader = this._compileShader(fragmentShader, GWTK.gEngine.Renderer.enumShaderType.FragmentShader, gl);
        this.mCompiledProgram = gl.createProgram();
        gl.attachShader(this.mCompiledProgram, this.mVertexShader);
        gl.attachShader(this.mCompiledProgram, this.mFragmentShader);
        this._bindAttributeLocations(gl);
        gl.linkProgram(this.mCompiledProgram);
        if (!gl.getProgramParameter(this.mCompiledProgram, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(this.mCompiledProgram);
            alert("Could not initialise shaders: " + info);
            return {};
        }
        this._vertexAttributes = this._fillVertexAttributes(gl);
        this._uniforms = this._fillUniforms(gl);
        this._initMaterialsList();


    };

    GWTK.gEngine.Renderer.WebGL.ShaderProgramWebgl.prototype = {
        /**
         * Максимальное количество материалов
         * @property MAXIMUM_MATERIALS_COUNT
         * @static
         * @const
         */
        MAXIMUM_MATERIALS_COUNT: 60,
        /**
         * Получить коллекцию атрибутов шейдера
         * @method getVertexAttributes
         * @public
         * @return {Object} Коллекция атрибутов шейдера
         */
        getVertexAttributes: function () {
            return this._vertexAttributes;
        },
        /**
         * Заполнить массив вершинных атрибутов программы шейдера
         * @method _fillVertexAttributes
         * @private
         * @param gl {WebGLRenderingContext} Контекст рисования
         */
        _fillVertexAttributes: function (gl) {
            var vertexAttributes = {};
            var attributesCount = gl.getProgramParameter(this.mCompiledProgram, gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < attributesCount; i++) {
                var info = gl.getActiveAttrib(this.mCompiledProgram, i);
                var name = info.name;
                if (name.indexOf('gl_') !== 0) {
                    var location = gl.getAttribLocation(this.mCompiledProgram, name);
                    vertexAttributes[name] = new GWTK.gEngine.Renderer.ShaderVertexAttribute(name, location, info.type);
                }
            }
            return vertexAttributes;
        },
        /**
         * Получить коллекцию униформ шейдера
         * @method getUniforms
         * @public
         * @return {Object} Коллекция униформ шейдера
         */
        getUniforms: function () {
            return this._uniforms;
        },
        /**
         * Заполнить массив униформов программы шейдера
         * @method _fillUniforms
         * @private
         * @param gl {WebGLRenderingContext} Контекст рисования
         */
        _fillUniforms: function (gl) {
            var uniforms = {};
            var uniformsCount = gl.getProgramParameter(this.mCompiledProgram, gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < uniformsCount; i++) {
                var info = gl.getActiveUniform(this.mCompiledProgram, i);
                var name = info.name;
                if (name.indexOf('gl_') !== 0) {
                    var location = gl.getUniformLocation(this.mCompiledProgram, name);
                    uniforms[name] = this._createUniform(gl, name, location, info.type);
                    if (name.indexOf('og_texture') === 0) {
                        var ind = parseInt(name.substring(10));
                        uniforms[name].setValue(ind);
                    }
                }
            }
            return uniforms;
        },
        /**
         * Создать униформ программы шейдера
         * @method _createUniform
         * @private
         * @param gl {WebGLRenderingContext} Контекст рисования
         * @param name {string} Имя униформа
         * @param location {WebGLUniformLocation} Локация униформа в контексте
         * @param type {number} Тип униформа
         * @return {GWTK.gEngine.Renderer.WebGL.UniformWebgl|object} Униформ
         */
        _createUniform: function (gl, name, location, type) {
            var typeEnum = GWTK.gEngine.Renderer.enumUniformType;
            var uniformType = null;
            switch (type) {
                case gl.FLOAT:
                    uniformType = typeEnum.FloatVal;
                    break;
                case gl.INT:
                case gl.BOOL:
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    uniformType = typeEnum.IntVal;
                    break;
                case gl.FLOAT_VEC2:
                    uniformType = typeEnum.FloatVec2;
                    break;
                case gl.FLOAT_VEC3:
                    uniformType = typeEnum.FloatVec3;
                    break;
                case gl.FLOAT_VEC4:
                    uniformType = typeEnum.FloatVec4;
                    break;
                case gl.INT_VEC2:
                case gl.BOOL_VEC2:
                    uniformType = typeEnum.IntVec2;
                    break;
                case gl.INT_VEC3:
                case gl.BOOL_VEC3:
                    uniformType = typeEnum.IntVec3;
                    break;
                case gl.INT_VEC4:
                case gl.BOOL_VEC4:
                    uniformType = typeEnum.IntVec4;
                    break;
                case gl.FLOAT_MAT2:
                    uniformType = typeEnum.FloatMat2;
                    break;
                case gl.FLOAT_MAT3:
                    uniformType = typeEnum.FloatMat3;
                    break;
                case gl.FLOAT_MAT4:
                    uniformType = typeEnum.FloatMat4;
                    break;
            }

            if (uniformType !== null) {
                switch (type) {
                    case gl.FLOAT:
                    case gl.INT:
                    case gl.BOOL:
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        return new GWTK.gEngine.Renderer.WebGL.UniformWebgl(name, uniformType, location, this);
                    case gl.FLOAT_VEC2:
                    case gl.FLOAT_VEC3:
                    case gl.FLOAT_VEC4:
                    case gl.INT_VEC2:
                    case gl.BOOL_VEC2:
                    case gl.INT_VEC3:
                    case gl.BOOL_VEC3:
                    case gl.INT_VEC4:
                    case gl.BOOL_VEC4:
                        return new GWTK.gEngine.Renderer.WebGL.UniformVectorWebgl(name, uniformType, location, this);
                    case gl.FLOAT_MAT2:
                    case gl.FLOAT_MAT3:
                    case gl.FLOAT_MAT4:
                        return new GWTK.gEngine.Renderer.WebGL.UniformMatrixWebgl(name, uniformType, location, this);
                }
            }
        },
        /**
         * Загрузить и скомпилировать шейдер
         * @method _compileShader
         * @private
         * @param shaderText {string} Текст шейдера
         * @param shaderType {GWTK.gEngine.Renderer.enumShaderType} Тип шейдера
         * @param gl {WebGLRenderingContext} Контекст рисования
         * @return {Object} Скомпиллированный шейдер
         */
        _compileShader: function (shaderText, shaderType, gl) {
            var shaderSource, compiledShader;

            // Step A: Get the shader source from index.html
            shaderSource = shaderText;
            // Step B: Create the shader based on the shader type: vertex or fragment
            compiledShader = gl.createShader(gl[shaderType]);

            shaderSource = this._addBuiltin(shaderType) + shaderSource;

            // Step C: Compile the created shader
            gl.shaderSource(compiledShader, shaderSource);
            gl.compileShader(compiledShader);
            // Step D: check for errors and return results (null if error)
            // The log info is how shader compilation errors are typically displayed.
            // This is useful for debugging the shaders.
            if (!gl.getShaderParameter(compiledShader, gl.COMPILE_STATUS)) {
                alert("A shader compiling error occurred: " +
                    gl.getShaderInfoLog(compiledShader));
            }
            return compiledShader;
        },
        /**
         * Привязать атрибуты к локациям по умолчанию
         * @method _bindAttributeLocations
         * @private
         * @param gl {WebGLRenderingContext} Контекст рисования
         */
        _bindAttributeLocations: function (gl) {
            var locations = GWTK.gEngine.Renderer.enumVertexAttributeLocations;
            for (var k in locations) {
                gl.bindAttribLocation(this.mCompiledProgram, locations[k], k);
            }
        },
        /**
         * Добавить стандартную часть для всех шейдеров
         * @method _addBuiltin
         * @private
         * @param shaderType{GWTK.gEngine.Renderer.enumShaderType} Тип шейдера
         * @return {string} Текст общей части шейдеров
         */
        _addBuiltin: function (shaderType) {
            var text = "";
            if (shaderType === GWTK.gEngine.Renderer.enumShaderType.VertexShader) {
                text +=
                    "const vec3 UNITX=vec3(1.,0.,0.);\n" +
                    "const vec3 UNITY=vec3(0.,1.,0.);\n" +
                    "const vec3 UNITZ=vec3(0.,0.,1.);\n" +
                    "uniform bool u_logarithmicDepth;\n" +
                    "uniform float uFcoef;\n" +
                    "vec4 applyLogarithmicDepth(vec4 clipPosition,bool logarithmicDepth,float Fcoef)\n" +
                    "{\n" +
                    "    if (logarithmicDepth)\n" +
                    "    {\n" +
                    "        clipPosition.z = (log2(max(1e-9, 1.0 + clipPosition.w))* Fcoef - 1.0 )* clipPosition.w;\n" +
                    "    }\n" +
                    "    return clipPosition;\n" +
                    "}";
            }
            return text;
        },
        /**
         * Активировать шейдер
         * @method bind
         * @public
         */
        bind: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.useProgram(this.mCompiledProgram);
        },
        /**
         * Удаление внутренних элементов
         * @method destroy
         * @public
         */
        destroy: function () {
            this.cleanUp()
        },
        /**
         * Удалить шейдеры
         * @method cleanUp
         * @public
         */
        cleanUp: function () {
            var gl = GWTK.gEngine.Renderer.Context.getGL();
            gl.detachShader(this.mCompiledProgram, this.mVertexShader);
            gl.detachShader(this.mCompiledProgram, this.mFragmentShader);
            gl.deleteShader(this.mVertexShader);
            gl.deleteShader(this.mFragmentShader);
            gl.deleteProgram(this.mCompiledProgram);
        },
        /**
         * Добавить униформ в очередь на обновление
         * @method notifyDirty
         * @public
         * @param uniform {GWTK.gEngine.Renderer.WebGL.UniformWebgl} Униформ
         */
        notifyDirty: function (uniform) {
            this.mDirtyUniforms.push(uniform);
        },
        /**
         * Обновить состояние шейдера
         * @method clean
         * @public
         */
        clean: function () {
            var dirtyCount = this.mDirtyUniforms.length;
            if (dirtyCount > 0) {
                for (var i = 0; i < dirtyCount; i++) {
                    this.mDirtyUniforms[i].clean();
                }
                this.mDirtyUniforms.length = 0;
            }
        },

        /**
         * Получить список униформов материалов
         * @method getMaterialUniformList
         * @public
         * @return {object} Cписок униформов материалов
         */
        getMaterialUniformList: function () {
            return this._materialUniformList;
        },
        /**
         * Инициализация списка униформов материалов
         * @method _initMaterialsList
         * @private
         */
        _initMaterialsList: function () {
            var uniforms = this.getUniforms();
            this._materialUniformList = [];
            for (var i = 0; i < this.MAXIMUM_MATERIALS_COUNT; i++) {
                this._materialUniformList.push({
                    ADSE: uniforms["u_Material[" + i + "].ADSE"],
                    ST: uniforms["u_Material[" + i + "].ST"]
                })
            }
        },
        /**
         * Получить униформ освещения
         * @method getLightInfoUniform
         * @public
         * @return {object} Униформ освещения
         */
        getLightInfoUniform: function () {
            var uniforms = this.getUniforms();
            return {
                position: uniforms["u_Light.position"],
                ambient: uniforms["u_Light.ambient"],
                diffuse: uniforms["u_Light.diffuse"],
                specular: uniforms["u_Light.specular"]
            };
        }
    };
}