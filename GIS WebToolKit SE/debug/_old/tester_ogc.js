/*!
 * ������� ��� ������������ ������� WmsQueries, WmtsQueries, WfsQueries, WcsQueries
 * �������������� ������ � GIS WebServer SE
 */

function onDataLoaded(response) {

    var elem = document.getElementById("dvMap");
    if (elem != null)
        elem.innerText = response;
}

function initMap()
{
	var server = "http://gisserver.info/GISWebServiceSE/service.php";

    wms = new WmsQueries(server);
    wms.onDataLoad = onDataLoaded;

    wmts = new WmtsQueries(server);
    wmts.onDataLoad = onDataLoaded;

	wfs = new WfsQueries(server);
    wfs.onDataLoad = onDataLoaded;

	wcs = new WcsQueries(server);
    wcs.onDataLoad = onDataLoaded;

	mapmath = new MapMath(server);
    mapmath.onDataLoad = onDataLoaded;
}

// ������� ��� ������������ WMS
function wmsgetcapabilities() {
    var request = wms.getcapabilities();
}
function wmsfeatureinfo() {
    var queryfeature = '{ "layers": "Noginsk", "crs": "EPSG:3395", "style": "default", "format": "image/jpg", "bbox": "4209698.567,7437247.162,4330266.341,7563757.536", ' +
       '"width": "256", "height": "256", "query_layers": "Noginsk", "i": "100", "j": "150", "info_format": "text/xml" }';
    var featureinfo = wms.featureinfo(queryfeature);
}
function wmsmapurl() {
    var param = '{ "layers": "Noginsk", "crs": "EPSG:3395", "style": "default", "format": "image/jpg", "bbox": "4209698.567,7437247.162,4330266.341,7563757.536", "width": "256", "height": "256" }';
    var mapurl = wms.mapurl(param);
    alert(mapurl);
	var elem = document.getElementById("dvMap");
    if (elem != null) {
        dvMap.innerText = "";
        var image = document.createElement('img');
        image.src = mapurl;
        elem.appendChild(image);
    }
}

// ������� ��� ������������ WMTS
function wmtsgetcapabilities() {
    var request = wmts.getcapabilities();
}
function wmtstileurl() {
    if (wmts == null) return;

    var querytiles = '{ "layer": "Noginsk", "matrix": "GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [1240, 638], "max": [1243, 640] }'
    var querytiles1 = '{ "layer": "Noginsk", "matrix": "GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [3390, 529] }'

    urls = wmts.tileurl(querytiles1);
    if (urls != null && urls.length > 0) {
        alert(urls.join('  \n'));
    }

	var elem = document.getElementById("dvMap");
    if (elem != null) {
        dvMap.innerText = "";
        var image = document.createElement('img');
        image.src = urls;
        elem.appendChild(image);
    }
}
function wmtstileimage() {
    var querytiles = '{"layer": "Noginsk", "matrix": "urn:ogc:def:wkss:OGC:1.0:GlobalCRS84Scale", "style": "default", "format": "image/jpg", "zoom": "11", "min": [3390, 529], "max": [3390, 529]}';
    wmts.tileimage(querytiles);
}
function wmtsfeatureinfo() {
    if (wmts == null) return;
    var queryfeature = '{"layer": "Noginsk", "tilematrixset": "GoogleMapsCompatible", "style": "default", "format": "image/jpg", "tilematrix": "10", "tilerow":319, "tilecol": 621,' +
                       ' "info_format":"text/html", "feature_count":5, "i":100,"j":50}';

    var info = wmts.featureinfo(queryfeature);
    if (typeof (info) !== "undefined")
        alert(info);
}

// ������� ��� ������������ WFS
function wfsgetfeaturetypenamelist() {
    if (typeof (wfs) == "undefined")
		return;
    wfs.getfeaturetypenamelist();
}
function wfsfeaturetype() {
    if (typeof (wfs) == "undefined")
		return;
    wfs.featuretype();
}
function wfsliststoredqueries() {
    if (typeof (wfs) == "undefined")
		return;
    wfs.liststoredqueries();
}
function wfsfeature() {
    if (wfs == null)
		return;
    var queryfeature = '{ "TypeNames": "bsd:Settlements", "count": 500, "startindex": "0" }';
    wfs.feature(queryfeature);
}
function wfsfeaturebyid() {
    if (wfs == null)
		return;
    wfs.featurebyid("��������� �����:209263");
}
function wfsinsert() {
    if (wfs == null)
		return;

    var xInsert = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 1" >' +
        '<wfs:Insert handle="Ins4"><bsd:Vegetation gml:id="��������� �����">' +
                    '<bsd:VegetationCode>71132100</bsd:VegetationCode>' +
                    '<gml:name>������� (�� ������� �������� ����������)</gml:name>' +
                    '<gml:Point srsName="urn:ogc:def:crs:EPSG:4326">' +
                    '<gml:pos srsDimension="3">55.7531215306  38.3349540667 -111111.0</gml:pos>' +
                    '</gml:Point>' +
                    '</bsd:Vegetation>' +
         '</wfs:Insert></wfs:Transaction>';

    wfs.transaction(xInsert);
}
function wfsreplace() {
    if (wfs == null)
		return;

    var xReplace = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 2" >' +
   '<wfs:Replace handle="replace 01"><fes:Filter><fes:ResourceId rid="��������� �����:209263" /></fes:Filter>' +
   '<bsd:Vegetation gml:id="id209263">' +
   '<bsd:VegetationCode>71100000</bsd:VegetationCode>' +
   '<gml:name>���������  ��������������</gml:name>' +
   '<gml:Polygon srsName="urn:ogc:def:crs:EPSG:4326">' +
   '<gml:exterior><gml:LineString>' +
   '<gml:posList srsDimension="2" count="9">55.7509419844 38.1351148613 55.7494491867 38.1402435206 55.7491871219 38.1413639697 55.7509036941 38.1429183731 55.7512649677 38.1432288919 55.7522287416 38.1395449989 55.7524041563 38.1389041549 55.7524728304 38.1357177285 55.7509419844 38.1351148613</gml:posList>' +
   '</gml:LineString></gml:exterior></gml:Polygon></bsd:Vegetation>' +
   '</wfs:Replace></wfs:Transaction>';

    wfs.transaction(xReplace);
}
function wfsdelete() {
    if (wfs == null)
		return;

    var xDelete = '<?xml version="1.0" encoding="utf-8" ?><wfs:Transaction version="2.0.0" service="WFS" handle="Transaction 3" >' +
    '<wfs:delete handle="delete4" typeName="bsd:Settlements">' +
    '<fes:Filter><fes:ResourceId rid="��������� �����:8742"/></fes:Filter>' +
    '</wfs:delete>' +
    '</wfs:Transaction>';

    wfs.transaction(xDelete);
}

// ������� ��� ������������ WCS
function wcsgetcapabilities() {
    var request = wcs.getcapabilities();
}
function wcs�overagelist() {
    var request = wcs.�overagelist('NogMtr');
}
function wcs�overage() {
    var request = wcs.�overage({ 'covarageid': 'NogMtr', 'dimsubsetx':'y(38.24,38.5)', 'dimsubsety':'x(55.9,56)' });
}

// ������� ��� ������������ MapMath
function mapMath_dimentions() {
    var request = mapmath.mapMath.dimentions();
}
