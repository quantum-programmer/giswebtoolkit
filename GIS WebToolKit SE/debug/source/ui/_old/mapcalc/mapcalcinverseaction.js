/********************************* Гиман Н.Л      **** 23/10/17 *****
 ********************************* Соколова Т.О.  **** 10/01/19 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Обратная геодезическая задача                  *
 *                                                                  *
 *******************************************************************/
if (window.GWTK) {
    /**
     * Обратная геодезическая задача
     * @param task - ссылка на задачу
     * @param map - ссфлка на карту
     * @param name - наименование задачи
     * @class GWTK.MapInverseAction
     * @constructor GWTK.MapInverseAction
     */
    GWTK.MapInverseAction = function(task, map, name) {
        /**
         * Расширяем текущий объект параметрами GWTK.PickMapPointAction который является производным от MapAction
         */
        GWTK.PickMapPointAction.call(this, task, map, {
            maxPointsCount: 2,
            cycle: false,
            name: name || 'mapinverseaction',
            getEachPoint: true,
            draggable: true,
            updateLastPoint: true,
            fn_getPoints: this.getPoints,
            fn_dragPointsUpdate: this.dragPointsUpdate
        });
        
        /**
         * Точки которые обновляются при клике
         * @type {{a: {x: null, y: null}, b: {x: null, y: null}}}
         */
        this.pointsInv = {
            a: { x: null, y: null },
            b: { x: null, y: null }
        };
        /**
         * Экземпляр класса для получения вычислений
         * @type {GWTK.MapCalculations}
         */
        this.mapCulc = new GWTK.MapCalculations(this.map);
        this.GeoJson = {
            "type": 'FeatureCollection',
            "bbox": [-180, -90, 180, 90],
            "features": []
        };
        
        this.distanceFromServerInMeters = 0;
        
        /**
         * Экземпляр для получения расстояния от сервера
         */
            // this.wfs = new WfsQueries(this.map.options.url, this.map);
            // this.wfs.onDataLoad = GWTK.Util.bind(this.onDataLoad, this);
        const httpParams = GWTK.RequestServices.createHttpParams(this.map);
        this.wfs = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
        
        this.fixedNumb = 8;
        this.positionToolTipWasChanged = false;
    };
    GWTK.MapInverseAction.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        init: function() {
            this.$super.init(this);
            this.createTooltip();
            /**
             * Параметры для рисования ортодромии
             * @type {{id: string, alias: string, selectObject: string, eventSets: Array}}
             */
            var options = {
                "id": 'ortodrominnverse',
                "alias": '',
                "selectObject": "0",
                "eventSets": []
            };
            this.graphicLayer = new GWTK.graphicLayer(this.map, options);
            
            $(this.map.eventPane).on('measurement_change.inverse', GWTK.Util.bind(function() {
                this.$distanceName.html(w2utils.lang('Distance') + ' (' + this.map.options.measurement.selected.perimeter + ')');//обновляем ед измерения
                this.$distanceValue.val(this.linearMetersToUnits(this.distanceFromServerInMeters).perimeter);
            }, this));
        },
        
        /**
         * Унаследованный метод
         * @method set
         */
        set: function() {
            this.$super.set(this);
            
            
            this.map.statusbar.set(w2utils.lang("Set points"));
            $(this.map.eventPane).on('drawmark_mouseout.mapcalcinverse', GWTK.Util.bind(function() {
                this.map.statusbar.set(w2utils.lang("Set points"));
            }, this));
        },
        
        /**
         * Функция обработчик ответа сервера
         * @param response {Object} -  ответ сервера
         * @method onDataLoad
         */
        onDataLoad: function(response) {
            var xmlDoc = $.parseXML(response),
                xml = $(xmlDoc);
            var elem = xml.context.documentElement,
                length = $(elem).find('Perimeter'), Length;
            
            if (length && length.length > 0) {
                Length = parseInt(length.text());
            }
            this.distanceFromServerInMeters = Length;
            if (typeof this.distanceFromServerInMeters !== "undefined") {
                this.$distanceValue.val(this.linearMetersToUnits(this.distanceFromServerInMeters).perimeter);
            }
        },
        
        /**
         * Отправка запроса
         * @param geometry {Object} - метрика объекта линии
         * @method sendRequest
         */
        sendRequest: function(geometry) {
            var strgeometrys = this.editobject.geometry.pointsToXmlString(geometry, null, 2);
            // var feature = '<?xml version="1.0" encoding="utf-8"?>' +
            //     '<wfs:FeatureCollection version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0"  xmlns:gml="http://www.opengis.net/gml/3.2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd"' +
            //     ' numberMatched="1" numberReturned="1">' +
            //     '<wfs:member><gml:Value>' +
            //     strgeometrys[0] +
            //     '</gml:Value></wfs:member></wfs:FeatureCollection>';
            // this.wfs.areafeature([], feature, false);
            
            const doc = new GWTK.XMLElement('document', '<?xml version="1.0" encoding="utf-8"?>');
            const wfsFeatureCollection = new GWTK.XMLElement('wfs:FeatureCollection', undefined, {
                'version': '2.0.0',
                'xmlns:wfs': 'http://www.opengis.net/wfs/2.0',
                'xmlns:fes': 'http://www.opengis.net/fes/2.0',
                'xmlns:gml': 'http://www.opengis.net/gml/3.2.1',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation': 'http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0.0/wfs.xsd http://www.opengis.net/gml/3.2 http://www.opengis.net/gml/3.2.1/gml.xsd',
                'numberMatched': '1',
                'numberReturned': '1'
            });
            const wfsMember = new GWTK.XMLElement('wfs:member');
            const gmlValue = new GWTK.XMLElement('gml:Value', strgeometrys[0]);
            wfsMember.addChild(gmlValue);
            wfsFeatureCollection.addChild(wfsMember);
            doc.addChild(wfsFeatureCollection);
            this.wfs.getArea({},{ data: doc.toString() }).then((response) => {
                if (response.data) {
                    this.onDataLoad(response.data);
                }
            })
        },
        
        /**
         * Унаследованный метод
         * @method clear
         */
        clear: function() {
            this.map.statusbar.clear();
            $(this.map.eventPane).off('drawmark_mouseout.mapcalcinverse');
            $(this.map.eventPane).off('measurement_change.inverse');
            this.$super.clear(this);
            if (this.graphicLayer) {
                this.graphicLayer.onRemove();
                this.graphicLayer = null;
            }
            this.pointsInv = {
                a: { x: null, y: null },
                b: { x: null, y: null }
            };
        },
        
        /**
         * Создать окно для отображения информации
         * @method createTooltip
         */
        createTooltip: function() {
            this.tooltip = GWTK.DomUtil.create('div', 'gwtk-tooltip-mapcalc map-panel-def', this.drawpanel);
            this.$tooltip = $(this.tooltip);
            
            this.tooltipBody = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-mapcalc', this.tooltip);
            this.$tooltipBody = $(this.tooltipBody);
            
            this.rowHeader = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row-header', this.tooltipBody);
            this.$rowHeader = $(this.rowHeader);
            
            this.closeImg = document.createElement('img');
            this.closeImg.src = GWTK.imgClose;
            this.closeImg.className = 'gwtk-close-tooltip-mapcalc';
            this.$closeImg = $(this.closeImg);
            this.$closeImg.on('click', GWTK.Util.bind(function() {
                this.removeLine();
                this.points = [];
                this.$tooltip.hide();
                if (this.graphicLayer) {
                    this.graphicLayer.clearLayer();
                }
                this.pointsInv = {
                    a: { x: null, y: null },
                    b: { x: null, y: null }
                };
            }, this));
            
            this.$rowHeader.append(this.$closeImg);
            /**
             * Первая точка
             * @type {div}
             */
            this.rowFirstPoint = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row', this.tooltipBody);
            this.$rowFirstPoint = $(this.rowFirstPoint);
            this.firstPointName = GWTK.DomUtil.create('div', '', this.rowFirstPoint);
            this.$firstPointName = $(this.firstPointName);
            this.$firstPointName.html(w2utils.lang('First point'));
            this.firstPointValue = GWTK.DomUtil.create('input', 'mapcalc-input-double', this.rowFirstPoint);
            this.$firstPointValue = $(this.firstPointValue);
            this.$firstPointValue.prop('disabled', true);
            
            /**
             * Первая точка второй раздел
             * @type {div}
             */
            this.firstPointValue1 = GWTK.DomUtil.create('input', 'mapcalc-input-double mapcalc-input-margin', this.rowFirstPoint);
            this.$firstPointValue1 = $(this.firstPointValue1);
            this.$firstPointValue1.prop('disabled', true);
            
            /**
             * Вторая точка
             * @type {div}
             */
            this.rowSecondPoint = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row', this.tooltipBody);
            this.$rowSecondPoint = $(this.rowSecondPoint);
            this.secondPointName = GWTK.DomUtil.create('div', '', this.rowSecondPoint);
            this.$secondPointName = $(this.secondPointName);
            this.$secondPointName.html(w2utils.lang('Second point'));
            this.secondPointValue = GWTK.DomUtil.create('input', 'mapcalc-input-double', this.rowSecondPoint);
            this.$secondPointValue = $(this.secondPointValue);
            this.$secondPointValue.prop('disabled', true);
            
            /**
             * Вторая точка второй раздел
             * @type {div}
             */
            this.secondPointValue1 = GWTK.DomUtil.create('input', 'mapcalc-input-double mapcalc-input-margin', this.rowSecondPoint);
            this.$secondPointValue1 = $(this.secondPointValue1);
            this.$secondPointValue1.prop('disabled', true);
            
            /**
             * Расстояние
             * @type {div}
             */
            this.rowDistance = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row', this.tooltipBody);
            this.$rowDistance = $(this.rowDistance);
            this.distanceName = GWTK.DomUtil.create('div', '', this.rowDistance);
            this.$distanceName = $(this.distanceName);
            this.$distanceName.html(w2utils.lang('Distance') + ' (' + this.map.options.measurement.selected.perimeter + ')');
            this.distanceValue = GWTK.DomUtil.create('input', 'mapcalc-input', this.rowDistance);
            this.$distanceValue = $(this.distanceValue);
            this.$distanceValue.prop('disabled', true);
            
            /**
             * Азимут
             * @type {div}
             */
            this.rowAzimuth = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row', this.tooltipBody);
            this.$rowAzimuth = $(this.rowAzimuth);
            this.azimuthName = GWTK.DomUtil.create('div', '', this.rowAzimuth);
            this.$azimuthName = $(this.azimuthName);
            this.$azimuthName.html(w2utils.lang('Azimuth'));
            
            
            this.azDiv = GWTK.DomUtil.create('div', 'mapcalc-azimuth-div', this.rowAzimuth);
            
            this.azimuthValue = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDiv);
            this.azimuthValue.maxLength = 4;
            this.$azimuthValue = $(this.azimuthValue);
            this.$azimuthValue.prop('disabled', true);
            
            this.spanDeg = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDiv);
            this.spanDeg.innerHTML = "°";
            
            this.azimuthValueM = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDiv);
            this.azimuthValueM.maxLength = 2;
            this.$azimuthValueM = $(this.azimuthValueM);
            this.$azimuthValueM.prop('disabled', true);
            
            this.spanMin = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDiv);
            this.spanMin.innerHTML = "'";
            
            this.azimuthValueS = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDiv);
            this.azimuthValueS.maxLength = 2;
            this.$azimuthValueS = $(this.azimuthValueS);
            this.$azimuthValueS.prop('disabled', true);
            
            this.spanSec = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDiv);
            this.spanSec.innerHTML = "''";
            
            
            /**
             * Азимут обратный
             * @type {div}
             */
            this.rowAzimuthInv = GWTK.DomUtil.create('div', 'gwtk-tooltipbody-row', this.tooltipBody);
            this.$rowAzimuthInv = $(this.rowAzimuthInv);
            this.azimuthInvName = GWTK.DomUtil.create('div', '', this.rowAzimuthInv);
            this.$azimuthInvName = $(this.azimuthInvName);
            this.$azimuthInvName.css('white-space', 'normal');
            this.$azimuthInvName.html(w2utils.lang('Azimuth (reverse)'));
            
            /*this.azimuthInvValue = GWTK.DomUtil.create( 'input', '', this.rowAzimuthInv );
            this.$azimuthInvValue = $( this.azimuthInvValue );
            this.$azimuthInvValue.prop( 'disabled', true );*/
            
            this.azDivInv = GWTK.DomUtil.create('div', 'mapcalc-azimuth-div', this.rowAzimuthInv);
            
            this.azimuthInvValue = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDivInv);
            this.azimuthInvValue.maxLength = 4;
            this.$azimuthInvValue = $(this.azimuthInvValue);
            this.$azimuthInvValue.prop('disabled', true);
            
            this.spanDegInv = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDivInv);
            this.spanDegInv.innerHTML = "°";
            
            this.azimuthValueMInv = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDivInv);
            this.azimuthValueMInv.maxLength = 2;
            this.$azimuthValueMInv = $(this.azimuthValueMInv);
            this.$azimuthValueMInv.prop('disabled', true);
            
            this.spanMinInv = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDivInv);
            this.spanMinInv.innerHTML = "'";
            
            this.azimuthValueSInv = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDivInv);
            this.azimuthValueSInv.maxLength = 2;
            this.$azimuthValueSInv = $(this.azimuthValueSInv);
            this.$azimuthValueSInv.prop('disabled', true);
            
            this.spanSecInv = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDivInv);
            this.spanSecInv.innerHTML = "''";
            
            this.$tooltip.css({ zIndex: 706 });
            
            this.$tooltip.draggable({
                containment: this.map.mapPane,
                cancel: '.gwtk-close-tooltip-mapcalc, .mapcalc-input, .mapcalc-azimuth-input, .mapcalc-input-double',
                drag: GWTK.Util.bind(function() {
                    this.positionToolTipWasChanged = true;
                }, this)
            });
            
            this.$tooltip.hide();
        },
        
        /**
         * Обновить положение окна отображения информации
         * @method updateTooltipPosition
         * @return {boolean}
         */
        updateTooltipPosition: function() {
            if (this.positionToolTipWasChanged) return false;
            if (!this.pointsInv.b.x) return false;
            var plane = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(this.pointsInv.b.x, this.pointsInv.b.y));
            
            if ((plane.y + this.$tooltip.height()) > $(this.map.mapPaneold).height()) {
                plane.y = plane.y - this.$tooltip.height() - 30;
            }
            if ((plane.x + this.$tooltip.width()) > $(this.map.mapPaneOld).width()) {
                plane.x = plane.x - this.$tooltip.width() - 30;
            }
            
            this.$tooltip.css({ left: plane.x + 5, top: plane.y + 5 });
            this.$tooltip.show();
        },
        
        /**
         * Обработчик перемещения точек
         * @param number {Number} - номер точки
         * @param geo {Object} - гео координаты
         * @method dragPointsUpdate
         */
        dragPointsUpdate: function(number, geo) {
            if (number === 0) {
                this.mergeObjects(this.pointsInv.a, geo);
                this.updateTooltipContent();
            }else{
                this.mergeObjects(this.pointsInv.b, geo);
                this.updateTooltipContent();
                this.updateTooltipPosition();
            }
        },
        
        /**
         * Обработчик overlayRefresh
         * @method refreshPoints
         */
        refreshPoints: function() {
            this.updateTooltipPosition();
        },
        
        /**
         * Обновление содержимого тултипа
         * @method updateTooltipContent
         */
        updateTooltipContent: function() {
            var result = this.mapCulc.mapInversePositionComputation(this.pointsInv.a.x, this.pointsInv.a.y, this.pointsInv.b.x, this.pointsInv.b.y);
            this.sendRequest(result.path);
            this.graphicLayer.updateFromGeoJson({
                "type": 'FeatureCollection',
                "features": [{
                    "geometry": {
                        "type": "LineString",
                        "coordinates": result.path
                    },
                    "type": "Feature",
                    "properties": {
                        "id": 'testorto',
                        "name": ""
                    },
                    "style": {
                        "stroke": "red",
                        "stroke-width": "2",
                        "stroke-opacity": "0.45",
                        "stroke-dasharray": "5"
                    }
                }]
            });
            
            this.$firstPointValue.val(this.pointsInv.a.x.toFixed(6));
            this.$firstPointValue1.val(this.pointsInv.a.y.toFixed(6));
            this.$secondPointValue.val(this.pointsInv.b.x.toFixed(6));
            this.$secondPointValue1.val(this.pointsInv.b.y.toFixed(6));
            this.$distanceValue.val();
            var azim = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(result.azimuth);
            azim = azim.split(' ');
            this.$azimuthValue.val(parseInt(azim[0]));
            this.$azimuthValueM.val(parseInt(azim[1]));
            this.$azimuthValueS.val(parseInt(azim[2]));
            var azInv = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(result.azimuthreverse);
            azInv = azInv.split(' ');
            this.$azimuthInvValue.val(parseInt(azInv[0]));
            this.$azimuthValueMInv.val(parseInt(azInv[1]));
            this.$azimuthValueSInv.val(parseInt(azInv[2]))
            ;
        },
        
        /**
         * Обработчик getPoints
         * @param point {Object} - точка
         * @method getPoints
         * @return {boolean}
         */
        getPoints: function(point) {
            if (this.pointsInv.a.x === null) {
                this.mergeObjects(this.pointsInv.a, point);
                this.drawLine([this.pointsInv.a.x, this.pointsInv.a.y]);
                return true;
            }
            if (this.pointsInv.b.x === null) {
                this.mergeObjects(this.pointsInv.b, point);
                this.drawLine([this.pointsInv.b.x, this.pointsInv.b.y]);
                this.updateTooltipPosition();
                this.updateTooltipContent();
                return true;
            }else{
                this.mergeObjects(this.pointsInv.b, point);
                this.drawLine([this.pointsInv.b.x, this.pointsInv.b.y]);
                this.updateTooltipPosition();
                this.updateTooltipContent();
                return false;
            }
        },
        
        /**
         * Объединение объекта
         * @param original {Object} - кого объединяем
         * @param obj {Object} - с кем объединяем
         * @method mergeObjects
         */
        mergeObjects: function(original, obj) {
            if (GWTK.Util.isArray(obj)) {
                original.x = Number(obj[0].toFixed(this.fixedNumb));
                original.y = Number(obj[1].toFixed(this.fixedNumb));
            }else if (obj && obj.x && obj.y) {
                for (var k in original) {
                    if (original.hasOwnProperty(k) && obj.hasOwnProperty(k) && obj[k]) {
                        original[k] = Number(obj[k].toFixed(this.fixedNumb));
                    }
                }
            }
        },
        /**
         * Пересчет метров в текущие единицы измерения
         * @param length - значение в метрах
         * @return {*}
         */
        linearMetersToUnits: function(length) {
            if (!length)
                return null;
            var perimeter = parseFloat(length), d;
            if (this.map.getLinearUnits()) {                                               // установленные единицы измерения длины
                var units = this.map.getLinearUnits();
                switch (units) {
                    case 'm':
                        d = perimeter.toFixed(2) + ' m';
                        break;
                    case 'km':
                        perimeter = perimeter / 1000.;
                        d = perimeter.toFixed(3) + ' km';
                        break;
                    case 'ft':
                        perimeter = GWTK.Util.m2feet(perimeter);
                        d = perimeter.toFixed(3) + ' ft';
                        break;
                    case 'Nm':
                        perimeter = GWTK.Util.m2Nmile(perimeter);
                        d = perimeter.toFixed(3) + ' Nm';
                        break;
                    default:
                        d = perimeter.toFixed(2) + ' m';
                        break;
                }
            }else{
                if (perimeter >= 1000.0) {
                    perimeter = perimeter / 1000.;
                    units = 'km';
                    d = perimeter.toFixed(3)
                }else{
                    d = perimeter.toFixed(2);
                }
                d += ' ' + units;
            }
            
            return { 'perimeter': perimeter, 'unit': units, 'text': d };
        }
    };
    GWTK.Util.inherits(GWTK.MapInverseAction, GWTK.PickMapPointAction);
}