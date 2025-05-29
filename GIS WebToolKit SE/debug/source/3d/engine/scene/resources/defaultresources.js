/****************************************** Тазин В.О. 10/11/20  ****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2020              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Компонент загрузчика ресурсов по умолчанию              *
 *                                                                  *
 *******************************************************************/

"use strict";
if (window.GWTK) {
    GWTK.gEngine = GWTK.gEngine || {};
    GWTK.gEngine.Scene = GWTK.gEngine.Scene || {};

    /**
     * Компонент загрузчика ресурсов по умолчанию
     * @class GWTK.gEngine.Scene.DefaultResources
     */
    GWTK.gEngine.Scene.DefaultResources = (function () {
        /**
         * Стандартный ресурс
         * @class DefaultResource
         * @constructor DefaultResource
         * @param name {string} Название ресурса
         * @param src {string} Относительная ссылка на источник
         * @param [params] {object} Параметры
         */
        var DefaultResource = function (name, src, params) {
            this.name = name;
            this.source = src;
            this.params = params;
        };
        var loadList = [];
        // пути к шейдерам
        loadList.push(new DefaultResource("polygonVS", "/gwtkse/3d/shaders/renderables/polygon/polygonVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("polygonFS", "/gwtkse/3d/shaders/renderables/polygon/polygonFS.txt")); // Path to the FragmentShader
        loadList.push(new DefaultResource("simplePolygonVS", "/gwtkse/3d/shaders/renderables/polygon/simplePolygonVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("simplePolygonFS", "/gwtkse/3d/shaders/renderables/polygon/simplePolygonFS.txt")); // Path to the FragmentShader
        loadList.push(new DefaultResource("shadowPolygonVS", "/gwtkse/3d/shaders/renderables/polygon/shadowPolygonVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("shadowPolygonFS", "/gwtkse/3d/shaders/renderables/polygon/shadowPolygonFS.txt")); // Path to the FragmentShader
        loadList.push(new DefaultResource("planeVS", "/gwtkse/3d/shaders/renderables/plane/planeVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("planeFS", "/gwtkse/3d/shaders/renderables/plane/planeFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("texturedSquareVS", "/gwtkse/3d/shaders/renderables/texturesquared/texturedSquareVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("texturedSquareFS", "/gwtkse/3d/shaders/renderables/texturesquared/texturedSquareFS.txt")); // Path to the FragmentShader


        loadList.push(new DefaultResource("chunkVS", "/gwtkse/3d/shaders/renderables/chunk/chunkVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("chunkFS", "/gwtkse/3d/shaders/renderables/chunk/chunkFS.txt")); // Path to the FragmentShader
        loadList.push(new DefaultResource("chunkLineVS", "/gwtkse/3d/shaders/renderables/chunk/chunkLineVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("chunkLineFS", "/gwtkse/3d/shaders/renderables/chunk/chunkLineFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("chunkPointVS", "/gwtkse/3d/shaders/renderables/tiles3d/chunkPointVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("chunkPointFS", "/gwtkse/3d/shaders/renderables/tiles3d/chunkPointFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("texturedTileVS", "/gwtkse/3d/shaders/renderables/tiles3d/texturedTileVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("texturedTileFS", "/gwtkse/3d/shaders/renderables/tiles3d/texturedTileFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("materialTileVS", "/gwtkse/3d/shaders/renderables/tiles3d/materialTileVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("materialTileFS", "/gwtkse/3d/shaders/renderables/tiles3d/materialTileFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("lineVS", "/gwtkse/3d/shaders/renderables/polyline/lineVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("lineFS", "/gwtkse/3d/shaders/renderables/polyline/lineFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("animatedVS", "/gwtkse/3d/shaders/renderables/animated/animatedVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("animatedFS", "/gwtkse/3d/shaders/renderables/animated/animatedFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("simpleVS", "/gwtkse/3d/shaders/renderables/instanced/simpleVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("simpleFS", "/gwtkse/3d/shaders/renderables/instanced/simpleFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("textVS", "/gwtkse/3d/shaders/renderables/text/textVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("textFS", "/gwtkse/3d/shaders/renderables/text/textFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("skyVS", "/gwtkse/3d/shaders/renderables/starrysky/skyVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("skyFS", "/gwtkse/3d/shaders/renderables/starrysky/skyFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("starVS", "/gwtkse/3d/shaders/renderables/starrysky/starVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("starFS", "/gwtkse/3d/shaders/renderables/starrysky/starFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("constellationVS", "/gwtkse/3d/shaders/renderables/starrysky/constellationVS.txt")); // Path to the VertexShader
        loadList.push(new DefaultResource("constellationFS", "/gwtkse/3d/shaders/renderables/starrysky/constellationFS.txt")); // Path to the FragmentShader

        loadList.push(new DefaultResource("starrysky", "/gwtkse/3d/starrysky.json")); // Path to the FragmentShader

        var textureLoadList = [];
        textureLoadList.push(new DefaultResource("_DEFAULT_TEXTURE", "/gwtkse/3d/images/default_texture.png", {
            locked: true,
            format: GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8,
            generateMipmaps: false,
            sampler: GWTK.gEngine.Renderer.TextureSamplers.linearClamp
        }));

        textureLoadList.push(new DefaultResource("_WAVE_TEXTURE", "/gwtkse/3d/images/wave.png", {
            locked: true,
            format: GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8,
            generateMipmaps: false,
            sampler: GWTK.gEngine.Renderer.TextureSamplers.linearRepeat
        }));
        textureLoadList.push(new DefaultResource("Open SansRegular", "/gwtkse/3d/fonts/OpenSans-Regular.png", {
            locked: true,
            format: GWTK.gEngine.Renderer.enumTextureFormat.rgba8_8_8_8,
            generateMipmaps: false,
            sampler: GWTK.gEngine.Renderer.TextureSamplers.linearClamp
        }));


        var DefaultResources = function () {
        };

        DefaultResources.prototype = {

            /**
             * Инициализация асинхронной загрузки файлов шейдера
             * @method initialize
             * @public
             */
            initialize: function () {
                var folder = window.location.href.slice(0, window.location.href.lastIndexOf("/"));

                // load default font
                for (var i = 0; i < loadList.length; i++) {
                    var item = loadList[i];
                    GWTK.gEngine.TextFileLoader.loadTextFile(folder + item.source, GWTK.gEngine.Resources.enumTextFileType.eTextFile, null, item.name);
                }
                loadList.length = 0;

                // load default textures
                for (i = 0; i < textureLoadList.length; i++) {
                    item = textureLoadList[i];
                    this._loadTexture(item.name, folder + item.source, item.params);
                }
                textureLoadList.length = 0;
            },
            /**
             * Загрузка текстуры
             * @method _loadTexture
             * @private
             * @param textureName {string} Название текстуры (путь)
             * @param src {string} Ссылка на загрузку
             * @param params {object} Параметры текстуры
             */
            _loadTexture: function (textureName, src, params) {
                if (!GWTK.gEngine.ResourceMap.isAssetLoaded(textureName)) {
                    // Обновление реестра ресурсов
                    GWTK.gEngine.ResourceMap.asyncLoadRequested(textureName);
                } else if (GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(textureName)) {
                    GWTK.gEngine.ResourceMap.incAssetRefCount(textureName);
                }

                if (!GWTK.gEngine.ResourceMap.isAssetActuallyLoaded(textureName)) {
                    // Создание нового объекта изображения
                    var img = new Image();

                    // После загрузки изображения преобразовать его в текстуру,
                    // после чего записать в реестр ресурсов
                    img.onload = function () {
                        // _processLoadedImage(textureName, img, params);
                        // var urlCreator = window.URL || window.webkitURL;

                        var description = new GWTK.gEngine.Renderer.Texture2DDescription(img.width, img.height, params.format, params.generateMipmaps);
                        GWTK.gEngine.ResourceMap.asyncLoadCompleted(textureName, {
                            description: description,
                            img: img,
                            locked: true,
                            sampler: params.sampler
                        });
                    };
                    img.src = src || textureName;
                }
            }
        };

        return new DefaultResources();
    }())
}
