/**************************************** Нефедьева О. 19/01/21 ****
/**************************************** Соколова Т.О.21/09/18 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                Выбор области поиска "объект карты"               *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Обработчик карты Выбор области "объект карты"
     * @class GWTK.SelectAreaMapObjectAction
     * @constructor GWTK.SelectAreaMapObjectAction
     */
    GWTK.SelectAreaMapObjectAction = function (task, map, div)
    {
        this.toolname = 'selectAreaMapObject';
        this.map = null;

        GWTK.MapAction.call(this, task, 'areasearchmapobject');

        if (this.task) {
            this.map = this.getMap();
        }
        else {
            this.map = map;
        }
        if (!this.map) {
            console.log("SelectAreaMapObjectAction. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.canSelectObject = true;

        this.container = div;
        if (!this.container) this.container = this.map.drawPane;
        this.label = null;

        this.onFeatureSelected = GWTK.Util.bind(this.onFeatureSelected, this);
        this.onMapClick = GWTK.Util.bind(this.onMapClick, this);

        this.init();
        return;
    }

    GWTK.SelectAreaMapObjectAction.prototype = {
        /**
         * Инициализация компонента
         * @method init
         */
        // ===============================================================
        init: function () {
            this.label = GWTK.DomUtil.create('div', 'selectcircle-label selectobject-label', this.map.overlayPane);
            this.label.id = 'selectareamapobject_find';
            var $label = $(this.label);
            $label.html(" " + w2utils.lang("Search for an object") + " ");
            $label.hide();
            var task = this.task, action = this,
                map = this.map;
            $label.click(function (event) {
                var target = event.srcElement || event.target;
                if (target && target.id != this.id) {
                    $label.hide();
                    return;
                }
                if (!task || !(task.action instanceof GWTK.SelectAreaMapObjectAction)) { $label.hide(); return; }
                if (!map || !map.selectedObjects || !map.selectedObjects.drawselobject)
                { $label.hide(); return; }
                if (event.stopPropagation) { event.stopPropagation(); }
                action._startFind();
                $label.hide();
                return;
            });

            $(this.map.eventPane).on('featurelistclick', this.onFeatureSelected);

            $(this.map.overlayPane).on('mapclick', this.onMapClick);

            $(this.map.eventPane).on('featurelistcanceled', this.hideLabel);

            // если есть выделенный объект, показать кнопку "Поиск по объекту"
            if (this.map.selectedObjects && this.map.selectedObjects.drawselobject) {
                var i, points, len, coord = [];
                if (!task) { return; }
                len = this.map.selectedObjects.drawselobject.geometry.count();
                points = this.map.selectedObjects.drawselobject.geometry.points;

                for (i = 0; i < len; i++) {
                    coord.push(points[i].x, points[i].y);
                }
                task.xArea = coord;
                task.area = 'mapobject';
                var wh = this.map.getWindowSize(),
                point = GWTK.point(wh[0] / 2, wh[1] / 2);
                this.showLabel(point);
            }

            return;
        },

        /**
         * Начать поиск
         * функция передает в триггер 'objectarea' координаты объекта
         */
        // ===============================================================
        _startFind: function () {
            var i, coord = [],
                gid = this.map.selectedObjects.drawselobject.gid,
                points = this.map.selectedObjects.drawselobject.geometry.points;
            if (points.length == 0 && gid){
                var mobj = this.map.selectedObjects.findobjectsByGid(gid);
                if (mobj) { points = mobj.geometry.points; }
            }
            var xgeom = this.map.selectedObjects.drawselobject.spatialposition.toLowerCase(),
            len = points.length;
            if (len === 1) {
                coord = this.point2Box(points[0].x, points[0].y);
                xgeom = 'polygon';
            }
            else {
                for (i = 0; i < len; i++) {
                    coord.push(points[i].x, points[i].y);
                }
            }

            this.task.xArea = coord;
            this._act = '1';
            $(this.map.eventPane).trigger({ type: 'objectarea', geometry: xgeom, area: { coords: coord } });

            return;
        },

        /**
         * Преобразовать точку в прямоугольную область
         * @method point2Box
         * @param x, y {Float, Float} геокоординаты точки, десятичные градусы
         * @return {Array} геокоординаты области, десятичные градусы
         */
        // ===============================================================
        point2Box: function (x, y) {
            if (typeof x == 'undefined' || typeof y == 'undefined') { return null; }
            var pixbox = this._getPointBox(x, y), coord = [], c1;
            c1 = this._pixel2Geo(pixbox[0], pixbox[1]); coord.push(c1[0], c1[1]);
            c1 = this._pixel2Geo(pixbox[2], pixbox[3]); coord.push(c1[0], c1[1]);
            c1 = this._pixel2Geo(pixbox[4], pixbox[5]); coord.push(c1[0], c1[1]);
            c1 = this._pixel2Geo(pixbox[6], pixbox[7]); coord.push(c1[0], c1[1]);
            coord.push(coord[0], coord[1]);

            return coord;
        },

        /**
         * Получить прямоугольную область для точки
         * @method _getPointBox
         * @param x, y {Float, Float} геокоординаты точки, десятичные градусы
         * @return {Array} координаты области, пикселы, delta = 4 pix
         */
        // ===============================================================
        _getPointBox: function (x, y) {
            var place = GWTK.tileView.geo2pixelOffset(this.map, GWTK.toLatLng(x, y)),
            pixbox = [], min = [], max = [];
            min.push(place.x - 2.0); min.push(place.y - 2.0);
            max.push(place.x + 2.0); max.push(place.y + 2.0);

            pixbox.push(min[0]); pixbox.push(min[1]);
            pixbox.push(min[0]); pixbox.push(max[1]);
            pixbox.push(max[0]); pixbox.push(max[1]);
            pixbox.push(max[0]); pixbox.push(min[1]);

            return pixbox;
        },

        /**
         * Преобразовать коррдинаты точки из писселей в гео
         * @method _pixel2Geo
         * @param x, y {Float, Float} координаты точки, пикселы
         * @return {Array} координаты точки, десятичные градусы текущей СК
         */
        // ===============================================================
        _pixel2Geo: function (x, y) {
            var coord = this.map.tiles.getLayersPointProjected(GWTK.point(x, y));
            var geo = GWTK.projection.xy2geo(this.map.options.crs, coord.y, coord.x);
            return geo;
        },

        /**
         * Обработчик события клика в карте
         * @method onMapClick
        */
        // ===============================================================
        onMapClick: function (event) {
            if (!event.point) return;
            if (!this.map.tiles._testPointByMaxBounds(event.point)) {
                return false;
            }
            var $find = $('#selectareamapobject_find');
            if ($find.length == 0) return;
            $find.hide();
            $find = $find[0];
            $find.style.top = event.point.y + 'px';
            $find.style.left = event.point.x + 'px';
            $find._pos = 1;

            return;
        },

        /**
         * Очистить компонент (удалить ярлык, отключить события)
         * @method clear
         */
        // ===============================================================
        clear: function () {
            $(this.map.eventPane).off('featurelistclick', this.onFeatureSelected);
            $(this.map.overlayPane).off('mapclick', this.onMapClick);
            $(this.map.eventPane).off('featurelistcanceled', this.hideLabel);

            $('#selectareamapobject_find').off().remove();

            if (this.task) {
                this.task.clearAction();
            }
            return;
        },

        /**
        * Отобразить ярлык "Найти"
        * @method showLabel
        */
        // ===============================================================
        showLabel: function (point) {
            if (point) {
                this.label.style.top = point.y + 'px';
                this.label.style.left = point.x + 'px';
            }
            $(this.label).show();
        },

        /**
        * Обновить ярлык "Найти"
        * @method refreshLabel
        */
        // ===============================================================
        refreshLabel: function () {
            this.label._act = 0;
            $(this.label).show();
        },

        hideLabel: function () {
            $('#selectareamapobject_find').hide();
            return;
        },

        /**
         * Обработчик события выбора объекта карты в списке отобранных
         * @method onFeatureSelected
        */
        // ===============================================================
        onFeatureSelected: function (event, data) {
            if (!this.map || !this.map.selectedObjects || !this.map.selectedObjects.drawselobject)
                return;

            var tool = this.map.mapTool("areasearch");
            if (!tool) return;

            var wh = this.map.getWindowSize(),
            point = GWTK.point(wh[0] / 2, wh[1] / 2);

            if (event && event.gid) {
                this.label._act = undefined;
            }
            if (tool.action instanceof GWTK.SelectAreaMapObjectAction) {

                if (this.label._act == undefined || this.label._act != '1') {
                    if (!this.label._pos) {
                        this.showLabel(point);
                    }
                    else {
                        this.showLabel();
                        this.label._pos = undefined;
                    }
                }
                else
                    this.label._act = '0';
            }
            return;
        }
    };

    GWTK.Util.inherits(GWTK.SelectAreaMapObjectAction, GWTK.MapAction);
}