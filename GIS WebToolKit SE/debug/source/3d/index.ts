import Mediator from '~/3d/engine/utils/Mediator';

require( './engine/utils/utils.js' );

GWTK.gEngine = GWTK.gEngine || {};

GWTK.gEngine.AUTH_TOKEN = 'AUTHORIZATION-TOKEN';

GWTK.gEngine.DEFAULT_MATERIAL = 'material_0_0';

GWTK.gEngine.Core = GWTK.gEngine.Core || {};

// GWTK.gEngine.Core.enumGeographicGridEllipsoidVertexAttributes = Object.freeze({
//     Position: 1,
//     Normal: 2,
//     TextureCoordinate: 4,
//     All: 1 | 2 | 4
// });

GWTK.gEngine.Mediator = Mediator;

GWTK.gEngine.Resources = GWTK.gEngine.Resources || {};
GWTK.gEngine.Resources.enumTextFileType = Object.freeze({
    eXMLFile: 0,
    eTextFile: 1,
    eJSONFile: 2
});


require( './main.js' );//???

require( './engine/renderer/enumrenderer.js' );//???

require( './engine/renderer/depthframebuffer/depthframebuffer.js' );

require( './engine/renderer/input/keyboard.js' );
require( './engine/renderer/input/mousedevice.js' );
require( './engine/renderer/input/touchscreen.js' );

require( './engine/renderer/materials/materialdescription.js' );

require( './engine/renderer/mesh/meshbuffers.js' );

require( './engine/renderer/renderbuffer/renderBufferdescription.js' );

require( './engine/renderer/renderstate/blending.js' );
require( './engine/renderer/renderstate/colormask.js' );
require( './engine/renderer/renderstate/depthtest.js' );
require( './engine/renderer/renderstate/facetculling.js' );
require( './engine/renderer/renderstate/renderstate.js' );
require( './engine/renderer/renderstate/scissortest.js' );
require( './engine/renderer/renderstate/stenciltest.js' );

require( './engine/renderer/scene/camera.js' );
require( './engine/renderer/scene/scenestate.js' );

require( './engine/renderer/textures/texture2ddescription.js' );
require( './engine/renderer/textures/textureSamplers.js' );

require( './engine/renderer/webgl/buffers/bufferWebgl.js' );
require( './engine/renderer/webgl/framebuffer/colorattachments.js' );
require( './engine/renderer/webgl/framebuffer/framebuffer.js' );
require( './engine/renderer/webgl/renderbuffer/renderBufferWebgl.js' );
require( './engine/renderer/webgl/shaders/shaderprogram.js' );
require( './engine/renderer/webgl/shaders/shadervertexattribute.js' );
require( './engine/renderer/webgl/shaders/uniformWebgl.js' );
require( './engine/renderer/webgl/textures/texture2dWebgl.js' );
require( './engine/renderer/webgl/textures/textureUnitsWebgl.js' );
require( './engine/renderer/webgl/textures/textureUnitWebgl.js' );
require( './engine/renderer/webgl/vertexarray/vertexbufferattributeWebgl.js' );
require( './engine/renderer/webgl/vertexarray/vertexcollectionWebgl.js' );
require( './engine/renderer/webgl/typeconverter.js' );

require( './engine/renderer/clearstate.js' );
require( './engine/renderer/context.js' );
require( './engine/renderer/drawstate.js' );
require( './engine/renderer/graphicdevice.js' );

require( './engine/resources/materialmap.js' );
require( './engine/resources/resoursemap.js' );
require( './engine/resources/shadermap.js' );
require( './engine/resources/textfileloader.js' );
require( './engine/resources/texturemap.js' );

require( './engine/scene/map3ddata.js' );

require( './engine/scene/background/background.js' );
require( './engine/scene/background/sun.js' );
require( './engine/scene/background/starrysky.js' );

require( './engine/scene/cameras/cameralookatpoint.js' );

require( './engine/scene/plugins/drawing3d.js' );
require( './engine/scene/plugins/freemove.js' );
require( './engine/scene/plugins/lightsourcecontrol.js' );
require( './engine/scene/plugins/viewmodecontrol.js' );

require( './engine/scene/plugins/measurements/areameasurements.js' );
require( './engine/scene/plugins/measurements/linearmeasurement.js' );
require( './engine/scene/plugins/measurements/measurementsbyrelief.js' );
require( './engine/scene/plugins/measurements/surfaceareameasurements.js' );
require( './engine/scene/plugins/measurements/common/controlcomponents.js' );
require( './engine/scene/plugins/measurements/common/modelcomponents.js' );
require( './engine/scene/plugins/measurements/common/pointui.js' );
require( './engine/scene/plugins/measurements/common/renderableanimators.js' );
require( './engine/scene/plugins/measurements/common/viewcomponents.js' );

require( './engine/scene/renderables/chunk.js' );
require( './engine/scene/renderables/plane.js' );
require( './engine/scene/renderables/renderablecollection.js' );
require( './engine/scene/renderables/texturedsquare.js' );

require( './engine/scene/renderables/objectrenderables/abstractrenderable.js' );
require( './engine/scene/renderables/objectrenderables/animatedobject.js' );
require( './engine/scene/renderables/objectrenderables/instancedobject.js' );
require( './engine/scene/renderables/objectrenderables/polygon.js' );
require( './engine/scene/renderables/objectrenderables/polyline.js' );
require( './engine/scene/renderables/objectrenderables/shadowvolumepolygon.js' );
require( './engine/scene/renderables/objectrenderables/simplepolygon.js' );
require( './engine/scene/renderables/objectrenderables/textobject.js' );

require( './engine/scene/renderables/tiles3drenderables/materialchunk.js' );
require( './engine/scene/renderables/tiles3drenderables/pointcloud.js' );
require( './engine/scene/renderables/tiles3drenderables/texturedchunk.js' );

require( './engine/scene/resources/defaultresources.js' );

require( './engine/scene/terrain/sourceurl.js' );

require( './engine/scene/terrain/db3dsource/tile3dlayer.js' );
require( './engine/scene/terrain/db3dsource/tile3dmodel.js' );
require( './engine/scene/terrain/db3dsource/tile3dnode.js' );
require( './engine/scene/terrain/db3dsource/tile3dsource.js' );

require( './engine/scene/terrain/heightsource/heightcache.js' );
require( './engine/scene/terrain/heightsource/heightsource.js' );
require( './engine/scene/terrain/heightsource/heightsourcemanager.js' );

require( './engine/scene/terrain/pointsource/pointsource.js' );

require( './engine/scene/terrain/tilelayer/chunklayer.js' );
require( './engine/scene/terrain/tilelayer/chunknode.js' );
require( './engine/scene/terrain/tilelayer/chunktexturesource.js' );
require( './engine/scene/terrain/tilelayer/chunktextureUnit.js' );
require( './engine/scene/terrain/tilelayer/rastersource.js' );
require( './engine/scene/terrain/tilelayer/rastersourcegiswebservicewms.js' );


require( './engine/scene/terrain/vectordata/classifiermodel.js' );
require( './engine/scene/terrain/vectordata/servicenode.js' );
require( './engine/scene/terrain/vectordata/serviceobjectsource.js' );
require( './engine/scene/terrain/vectordata/vectordatalayer.js' );
require( './engine/scene/terrain/vectordata/vectordatanode.js' );
require( './engine/scene/terrain/vectordata/vectordatasource.js' );

require( './engine/scene/terrain/vectordata/scenariodatalayer.js' );
require( './engine/scene/terrain/vectordata/scenarioobject.js' );
require( './engine/scene/terrain/vectordata/untiledobjectsource.js' );

require( './engine/scene/UI/animation.js' );
require( './engine/scene/UI/buttons.js' );
require( './engine/scene/UI/layers.js' );
require( './engine/scene/UI/map3dtoolbar.js' );
