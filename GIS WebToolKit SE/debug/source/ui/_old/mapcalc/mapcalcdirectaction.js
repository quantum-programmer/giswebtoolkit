/********************************* Гиман Н.Л      **** 23/10/17 ****
/********************************* Нефедьева О.А. **** 28/09/17 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2017              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                   Прямая геодезическая задача                    *
*                                                                  *
*******************************************************************/
if(window.GWTK){
	/**
	 * Прямая геодезическая задача
	 * @param task - ссылка на задачу
	 * @param map - ссфлка на карту
	 * @param name - наименование задачи
	 * @class GWTK.MapDirectAction
	 * @constructor GWTK.MapDirectAction
	 */
	GWTK.MapDirectAction = function(task, map, name){
		/**
		 * Расширяем текущий объект параметрами GWTK.PickMapPointAction
		 */
		GWTK.PickMapPointAction.call(this, task, map, {
			maxPointsCount: 1,
			cycle: true,
			name: name || 'mapinverseaction',
			getEachPoint: true,
			draggable: false,
			fn_getPoints: this.getPoints
		});
		
		this.pointsDir = {
			a: {x: null, y: null},
			b: {x: null, y: null}
		};
		this.mapCulc = new GWTK.MapCalculations(this.map);                   // класс выполнения расчетов
		this.mapCulcData = {
			firstPoint: {
				a: 0,
				b: 0
			},
			secondPoint: {
				a: 0,
				b: 0
			},
			distance: '',
			azimuth: {
				deg: 0,
				min: 0,
				sec: 0
			}
		};
		this.fixedNumb = 6;
		this.positionToolTipWasChanged = false;
		
		if(this.$super){
			this.$super.set.call(this, null, true);
			this.$super.clear.call(this, null, true);
		}
	};
	GWTK.MapDirectAction.prototype = {
		/**
		 * Инициализация
		 * @method init
		 */
		init: function(){
			this.$super.init(this);
			this.createTooltip();
			/**
			 * Параметры для рисования ортодромии
			 * @type {{id: string, alias: string, selectObject: string, eventSets: Array}}
			 */
			var options = {
				"id": 'ortodromlayerdirect',
				"alias": '',
				"selectObject": "0",
				"eventSets": []
			};
			this.graphicLayer = new GWTK.graphicLayer(this.map, options);
			$(this.map.eventPane).on('measurement_change.direct', GWTK.Util.bind(function(){
				var valPerimeter = this.linearMetersToUnits(this.mapCulcData.distance);
				this.$distanceName.html(w2utils.lang('Distance') + " (" + this.map.options.measurement.selected.perimeter + ")");
				this.$distanceValue.val(valPerimeter.perimeter);
			}, this));
		},
		
		/**
		 * Обработчик выбора точек
		 * @method getPoints
		 * @param point - координаты точки
		 * @return {boolean}
		 */
		getPoints: function(point){
			this.pointsDir.a.x = point[0].toFixed(this.fixedNumb);
			this.pointsDir.a.y = point[1].toFixed(this.fixedNumb);
			this.setToolTipPosition();
			this.mapCulcData.firstPoint.a = point[0].toFixed(this.fixedNumb);
			this.mapCulcData.firstPoint.b = point[1].toFixed(this.fixedNumb);
			this.updateToolTip();
			this.map.statusbar.set(w2utils.lang("Set distance and azimuth"));
		},
		
		/**
		 * Создать тултип
		 * @method createTooltip
		 */
		createTooltip: function(){
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
			this.$closeImg.on('click', GWTK.Util.bind(function(){
				this.removeLine();
				this.$tooltip.hide();
				if(this.graphicLayer){
					this.graphicLayer.clearLayer();
				}
				this.mapCulcData = {
					firstPoint: {
						a: 0,
						b: 0
					},
					secondPoint: {
						a: 0,
						b: 0
					},
					distance: '',
					azimuth: {
						deg: 0,
						min: 0,
						sec: 0
					}
				};
				this.positionToolTipWasChanged = false;
				this.map.statusbar.set(w2utils.lang("Select point"));
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
			this.firstPointValue.maxLength = 12;
			this.$firstPointValue = $(this.firstPointValue);
			this.$firstPointValue.on('input', GWTK.Util.bind(function(e){
				var val = e.target.value;
				if(val !== '-' && !parseFloat(val).between(-90, 90)){
					val = 0;
					e.target.value = '';
					this.$secondPointValue.val('');
					this.$secondPointValue1.val('');
				}else{
					if(val.indexOf(',') !== -1){
						val = val.replace(',', '.');
					}
				}
				this.mapCulcData.firstPoint.a = val;
				this.updateToolTip();
			}, this));
			
			/**
			 * Первая точка второй раздел
			 * @type {div}
			 */
			this.firstPointValue1 = GWTK.DomUtil.create('input', 'mapcalc-input-double mapcalc-input-margin', this.rowFirstPoint);
			this.firstPointValue1.maxLength = 12;
			this.$firstPointValue1 = $(this.firstPointValue1);
			this.$firstPointValue1.on('input', GWTK.Util.bind(function(e){
				var val = e.target.value;
				if(val !== '-' && !parseFloat(val).between(-180, 180)){
					val = 0;
					e.target.value = '';
					this.$secondPointValue.val('');
					this.$secondPointValue1.val('');
				}else{
					if(val.indexOf(',') !== -1){
						val = val.replace(',', '.');
					}
				}
				this.mapCulcData.firstPoint.b = val;
				this.updateToolTip();
			}, this));
			
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
			this.secondPointValue.maxLength = 12;
			this.$secondPointValue = $(this.secondPointValue);
			this.$secondPointValue.prop('disabled', true);
			
			/**
			 * Вторая точка второй раздел
			 * @type {div}
			 */
			
			this.secondPointValue1 = GWTK.DomUtil.create('input', 'mapcalc-input-double mapcalc-input-margin', this.rowSecondPoint);
			this.secondPointValue1.maxLength = 12;
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
			this.$distanceName.html(w2utils.lang('Distance') + " (" + this.map.options.measurement.selected.perimeter + ")");
			this.distanceValue = GWTK.DomUtil.create('input', 'mapcalc-input', this.rowDistance);
			this.$distanceValue = $(this.distanceValue);
			this.$distanceValue.on('input', GWTK.Util.bind(function(e){
				var val = e.target.value;
				if(val.indexOf(',') !== -1){
					val = val.replace(',', '.');
				}
				if(val.indexOf('.') === 0){
					val = '0.';
				}
				e.target.value = val;
				var valPerimeter = this.map.currentUnitsToMeters(val);
				this.mapCulcData.distance = valPerimeter && valPerimeter.perimeter !==0 ? valPerimeter.perimeter : val;
				this.updateToolTip();
			}, this));
			
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
			
			this.spanDeg = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDiv);
			this.spanDeg.innerHTML = "°";
			
			this.azimuthValueM = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDiv);
			this.azimuthValueM.maxLength = 2;
			this.$azimuthValueM = $(this.azimuthValueM);
			
			this.spanMin = GWTK.DomUtil.create('span', 'mapcalc-azimuth-span', this.azDiv);
			this.spanMin.innerHTML = "'";
			
			this.azimuthValueS = GWTK.DomUtil.create('input', 'mapcalc-azimuth-input', this.azDiv);
			this.azimuthValueS.maxLength = 2;
			this.$azimuthValueS = $(this.azimuthValueS);
			
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
			this.$azimuthInvName.html(w2utils.lang('Azimuth (reverse)'));
			this.$azimuthInvName.css('white-space', 'normal');
			
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
			
			this.$azimuthValue.on('input', GWTK.Util.bind(function(e){
				if(e.target.value){
					if(parseInt(e.target.value) > 360 || parseInt(e.target.value) < -360){
						this.mapCulcData.azimuth.deg = 0;
					}else{
						this.mapCulcData.azimuth.deg = e.target.value;
					}
				}else{
					this.mapCulcData.azimuth.deg = '';
				}
				this.updateToolTip();
			}, this));
			this.$azimuthValueM.on('input', GWTK.Util.bind(function(e){
				this.mapCulcData.azimuth.min = e.target.value && parseInt(e.target.value) > 60 ? '' : e.target.value;
				this.updateToolTip();
			}, this));
			this.$azimuthValueS.on('input', GWTK.Util.bind(function(e){
				this.mapCulcData.azimuth.sec = e.target.value && parseInt(e.target.value) > 60 ? '' : e.target.value;
				this.updateToolTip();
			}, this));
			
			
			this.$tooltip.css({zIndex: 706});
			
			this.$tooltip.draggable({
				containment: this.map.mapPane,
				cancel: '.gwtk-close-tooltip-mapcalc, .mapcalc-input, .mapcalc-azimuth-input, .mapcalc-input-double',
				drag: GWTK.Util.bind(function(){
					this.positionToolTipWasChanged = true;
				}, this)
			});
			this.$tooltip.hide();
		},
		
		/**
		 * Установить положение окна отображения информации
		 * @method setToolTipPosition
		 * @return {boolean}
		 */
		setToolTipPosition: function(){
			if(!this.pointsDir.a.x || this.positionToolTipWasChanged) return false;
			var plane = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(this.pointsDir.a.x, this.pointsDir.a.y));
			if((plane.y + this.$tooltip.height()) > $(this.map.mapPaneOld).height()){
				plane.y = plane.y - this.$tooltip.height() - 30;
			}
			if((plane.x + this.$tooltip.width()) > $(this.map.mapPaneOld).width()){
				plane.x = plane.x - this.$tooltip.width() - 30;
			}
			
			this.$tooltip.css({left: plane.x + 5, top: plane.y + 5});
			this.$tooltip.show();
		},
		
		/**
		 * Обновить содержимое окна отображения информации
		 * @method updateToolTip
		 */
		updateToolTip: function(){
			var coords = this.mapCulcData.firstPoint;
			if(coords.a === 0 || coords.b === 0 || coords.a === '-' || coords.b === '-'){
				return false;
			}
			var azimuth = this.getAzimuth();
			var result = this.mapCulc.mapDirectPositionComputation(parseFloat(coords.a), parseFloat(coords.b), azimuth, this.mapCulcData.distance);
			this.mapCulcData.secondPoint.a = result.b.toFixed(this.fixedNumb);
			this.mapCulcData.secondPoint.b = result.l.toFixed(this.fixedNumb);
			this.$firstPointValue.val(this.mapCulcData.firstPoint.a);
			this.$firstPointValue1.val(this.mapCulcData.firstPoint.b);
			
			this.$secondPointValue.val(this.mapCulcData.secondPoint.a);
			this.$secondPointValue1.val(this.mapCulcData.secondPoint.b);
			var distance = '';
			if(this.mapCulcData.distance){
				distance = this.linearMetersToUnits(this.mapCulcData.distance).perimeter;
			}else{
				distance = this.mapCulcData.distance;
			}
			this.$distanceValue.val(distance !== 0 ? distance : this.mapCulcData.distance);
			// this.$azimuthValue.val(this.mapCulcData.distance && this.mapCulcData.distance !== 0 ? this.mapCulcData.azimuth.deg : '');
			// this.$azimuthValueM.val(this.mapCulcData.distance && this.mapCulcData.distance !== 0 ?this.mapCulcData.azimuth.min : '');
			// this.$azimuthValueS.val(this.mapCulcData.distance && this.mapCulcData.distance !== 0 ?this.mapCulcData.azimuth.sec : '');
			
			this.$azimuthValue.val(this.getAzimuthValueForInput(this.mapCulcData.azimuth.deg));
			this.$azimuthValueM.val(this.getAzimuthValueForInput(this.mapCulcData.azimuth.min));
			this.$azimuthValueS.val(this.getAzimuthValueForInput(this.mapCulcData.azimuth.sec));
			
			if(this.mapCulcData.distance && this.mapCulcData.distance !== 0){
				var resultInv = this.mapCulc.mapInversePositionComputation(parseFloat(coords.a), parseFloat(coords.b), result.b, result.l);
				if(resultInv){
					var azInv = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(resultInv.azimuthreverse);
					azInv = azInv.split(' ');
					
					this.$azimuthInvValue.val(parseInt(azInv[0]));
					this.$azimuthValueMInv.val(parseInt(azInv[1]));
					this.$azimuthValueSInv.val(parseInt(azInv[2]));
					
					this.graphicLayer.updateFromGeoJson({
						"type": 'FeatureCollection',
						"features": [{
							"geometry": {
								"type": "LineString",
								"coordinates": resultInv.path
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
				}
			}else{
				this.graphicLayer.clearLayer();
				this.$azimuthInvValue.val('');
				this.$azimuthValueMInv.val('');
				this.$azimuthValueSInv.val('');
			}
			
			this.drawLine([parseFloat(coords.a), parseFloat(coords.b)], true);
			this.drawLine([result.b, result.l]);
		},
		/**
		 * Получить значение азимута для отображения в панели
		 * @param azimuth - значение азимута
		 * @method getAzimuthValueForInput
		 * @return {string}
		 */
		getAzimuthValueForInput: function(azimuth){
			var azV = '';
			if(azimuth && !this.mapCulcData.distance){
				azV = azimuth;
			}
			if(this.mapCulcData.distance && azimuth === 0){
				azV = 0;
			}
			if(this.mapCulcData.distance && azimuth){
				azV = azimuth;
			}
			return azV;
		},
		
		/**
		 * Получить азимут
		 * @method getAzimuth
		 * @return {*}
		 */
		getAzimuth: function(){
			return GWTK.LatLng.prototype.DegreesMinutesSeconds2Degrees(this.mapCulcData.azimuth.deg, this.mapCulcData.azimuth.min, this.mapCulcData.azimuth.sec);
		},
		
		/**
		 * Обновить положение окна отображения информации
		 * @method updateTooltipPosition
		 * @return {boolean}
		 */
		updateTooltipPosition: function(){
			if(this.positionToolTipWasChanged) return false;
			if(this.pointsDir.a.x){
				var plane = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(this.pointsDir.a.x, this.pointsDir.a.y));
				this.$tooltip.css({left: plane.x + 5, top: plane.y + 5});
				this.$tooltip.show();
			}
		},
		
		/**
		 * Обработчик события overlayRefresh
		 * @method refreshPoints
		 */
		refreshPoints: function(){
			this.updateTooltipPosition();
		},
		
		/**
		 * Унаследованный метод
		 * @method set
		 */
		set: function(){
			
			this.$super.set(this);
			
			// this.init();
			this.map.statusbar.set(w2utils.lang("Select point"));
		},
		/**
		 * Унаследованный метод
		 * @method clear
		 */
		clear: function(){
			this.map.statusbar.clear();
			this.$super.clear(this);
			this.mapCulcData = {
				firstPoint: {
					a: 0,
					b: 0
				},
				secondPoint: {
					a: 0,
					b: 0
				},
				distance: '',
				azimuth: {
					deg: 0,
					min: 0,
					sec: 0
				}
			};
			this.$tooltip.remove();
			if(this.graphicLayer){
				this.graphicLayer.onRemove();
				this.graphicLayer = null;
			}
			$(this.map.eventPane).off('measurement_change.direct');
		},
		/**
		 * Пересчет метров в текущие единицы измерения
		 * @param length - значение в метрах
		 * @return {*}
		 */
		linearMetersToUnits: function (length) {
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
			}else {
				if (perimeter >= 1000.0) {
					perimeter = perimeter / 1000.;
					units = 'km';
					d = perimeter.toFixed(3)
				}else {
					d = perimeter.toFixed(2);
				}
				d += ' ' + units;
			}
			
			return { 'perimeter': perimeter, 'unit': units, 'text': d };
		}
	};
	
	GWTK.Util.inherits(GWTK.MapDirectAction, GWTK.PickMapPointAction);
}