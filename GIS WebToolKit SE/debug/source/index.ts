import './gwtk';
import RequestServices from '~/services/RequestServices';
import MapWindow from '~/MapWindow';
import TranslateList from '~/translate/TTranslateList';
import { Point, Point3D } from '~/geometry/Point';
import * as MapAPI from '~/api/MapApi';
import Trigger from '~/taskmanager/Trigger';
import PluginTask from '~/taskmanager/PluginTask';
import BrowserService from '~/services/BrowserService/BrowserService';
import GeoJSON from '~/utils/GeoJSON';
import FileUploader from '~/utils/FileUploader';
import MarkerStyle from '~/style/MarkerStyle';
import GeoPoint from '~/geo/GeoPoint';
import GeoPointRad from '~/geo/GeoPointRad';
import { MapPoint } from '~/geometry/MapPoint';
import MapObject from '~/mapobject/MapObject';


for ( let mapVueAPIKey in MapAPI ) {
    GWTK[ mapVueAPIKey ] = (MapAPI as any)[ mapVueAPIKey ];
}

require( './dom/old/domevent.js' );
require( './dom/domutil.js' );
require( './geo/clusterization.js' );
require( './geo/latlng.js' );
require( './geo/latlngbounds.js' );
require( './geo/placemark.js' );
require( './core/mapcalc.js' );
require( './core/mapsheetslist.js' );
require( './core/scalingmanager.js' );
require( './core/selectedfeatures.js' );
require( './core/textsearch.js' );
require( './core/token.js' );
require( './core/util.js' );
require( './core/wmath.js' );
require( './bpla/routebpla.js' );
require( './bpla/maproutes.js' );
require( './ogc/wcsqueries.js' );
require( './ogc/wfsqueries.js' );
require( './ogc/wmsqueries.js' );
require( './ogc/wmtsqueries.js' );
require( './ogc/wqueries.js' );
require( './ogc/mapmath.js' );
require( './ui/clustercontrol.js' );
require( './ui/maptaskbarcontrol.js' );
require( './ui/resizable.js' );
require( './ui/scalerulercontrol.js' );
require( './ui/slidertoolscontrol.js' );
require( './ui/svgdrawing.js' );
require( './ui/w2uisidebargwtk.js' );
require( './md5.js' );
require( './objectDrawing.js' );
require( './mapobject/old/mapobject.js' );
require( './mapobject/old/mapgeometry.js' );
require( './mapobject/old/mapsemantic.js' );
require( './layers.js' );
require( './handlers.js' );
require( './maplayers/wmsmanager.js' );
require( './maplayers/layergraphic.js' );
require( './maplayers/geomarklayer.js' );
require( './featureinforequest.js' );
require( './featurerestrequests.js' );
require( './objectmanager.js' );
require( './featureinfodata.js' );
require( './maptask/usercontrol.js' );
require( './map.js' );
require( './api/mapapi-js.js' );
require( './api/mapapitypes.js' );

require( './3d/index' );


GWTK.GRAPHIC = {};

// Цвет по умолчанию
GWTK.GRAPHIC.colorDefault = '#FF55FF';//'#000000';

// Минимальный простой набор
GWTK.GRAPHIC.optionsSimple = {
    'stroke': GWTK.GRAPHIC.colorDefault,  // цвет
    'stroke-width': 1.00,  // толщина
    'stroke-opacity': 1.00 // прозрачность
};

// Параметры простой линии
GWTK.GRAPHIC.optionsSimpleLine = {
    // Общие
    'stroke': GWTK.GRAPHIC.colorDefault, //'#000000',      // цвет
    'stroke-width': 1.00,          // толщина
    'stroke-dasharray': '',     // пунктир
    // Только графика
    'stroke-opacity': 1.00,       // прозрачность
    'stroke-dashoffset': 0,    // смещение
    'stroke-linecap': ''       // скругление углов
};

// Параметры простой линии
GWTK.GRAPHIC.optionsSimpleLineHatch = {
    'stroke': '#000000', //GWTK.GRAPHIC.colorDefault,
    'stroke-width': 1.00,
    'stroke-angle': 45,
    'stroke-step': 4 //3.794 = 1 мл
};

// Параметры заливки
GWTK.GRAPHIC.optionsFillDefault = {
    'fill': GWTK.GRAPHIC.colorDefault, //'#FFFFFF',
    'fill-opacity': 1.00
};

// Параметры шрифта по умолчанию
GWTK.GRAPHIC.fontFamilyDefault = 'Verdana';
GWTK.GRAPHIC.fontStyleDefault = 'normal';
GWTK.GRAPHIC.fontWeightDefault = 'normal';
GWTK.GRAPHIC.fontSizeDefault = '12';
GWTK.GRAPHIC.fontStretchDefault = 'normal';

GWTK.GRAPHIC.optionsFontDefault = {
    'font-family': GWTK.GRAPHIC.fontFamilyDefault,   // имя шрифта
    'font-style': GWTK.GRAPHIC.fontStyleDefault,     // стиль шрифта: normal | italic | oblique
    'font-weight': GWTK.GRAPHIC.fontWeightDefault,   // насыщенность(толщина?) шрифта bold(полужирное)|bolder|lighter|normal(нормальное)|100|200|300|400|500|600|700|800|900
    'font-size': GWTK.GRAPHIC.fontSizeDefault,       // высота шрифта
    'font-stretch': GWTK.GRAPHIC.fontStretchDefault, // начертание (condensed(узкое)|normal(нормальное)|expanded(широкое)
    'text-decoration': 'none',                       // line-through (перечеркнутый) || overline (над текстом)|| underline(подчеркнутый )
    'letter-spacing': 0,                             // расстояние между буквами
    'text-shadow': '',                               // тень text-shadow: 1px 1px 1px #000000;
    'writing-mode': ''                               // направление текста на странице lr | rl | tb
    // направление текста на странице lr-tb | rl-tb | tb-rl | bt-rl | tb-lr | bt-lr

    //     lr  Устанавливает направление текста слева направо.
    //     rl  Задает направление текста справа налево.
    //     tb  Текст располагается вертикально сверху вниз.


    // lr-tb  Устанавливает направление текста слева направо.
    // rl-tb Задает направление текста справа налево.
    // tb-rl Текст располагается вертикально и выравнивается по верхнему и правому краю.
    // bt-rl Текст располагается вертикально и выравнивается по нижнему и правому краю.
    // tb-lr Текст располагается вертикально и выравнивается по верхнему и левому краю.
    // bt-lr Текст располагается вертикально и выравнивается по нижнему и левому краю.
};

GWTK.GRAPHIC.optionsMarkerDefault = {
    'path': 'M 2 16 a 7 7 0 0 0 28 0M 2 16 a 7 7 0 0 1 28 0',  // круг
    // Пока заглушка
    'width': 32,
    'height': 32,
    'refX': 16,
    'refY': 16,
    'markerUnits': 'userSpaceOnUse',
    'markerWidth': 32,
    'markerHeight': 32,
    'markerInitWidth': 32,
    'markerInitHeight': 32,
    'image': ''
};


GWTK.RequestServices = RequestServices;
GWTK.Point = Point;
GWTK.point = Point.toPoint;
GWTK.Point3D = Point3D;

GWTK.MapWindow = MapWindow;
GWTK.TranslateList = TranslateList;
GWTK.Trigger = Trigger;
GWTK.PluginTask = PluginTask;
GWTK.BrowserService = BrowserService;
GWTK.GeoJSON = GeoJSON;
GWTK.FileUploader = FileUploader;
GWTK.MarkerStyle = MarkerStyle;
GWTK.GeoPoint = GeoPoint;
GWTK.GeoPointRad = GeoPointRad;
GWTK.MapPoint = MapPoint;
GWTK.MapObject = MapObject;
