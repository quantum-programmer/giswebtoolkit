/******************************** Гиман Н.Л ************ 05/10/17 ***
 ******************************** Соколова Т.В. ******** 08/06/17 ***
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2017              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Расчеты по карте                         *
 *                                                                  *
 *******************************************************************/
import Trigonometry from '~/geo/Trigonometry';
import GeoPointRad from '~/geo/GeoPointRad';

if (window.GWTK) {
    GWTK.MapCalculations = function(map) {
        this.map = map;
        this.spheroidList = {
            "3857": {
                name: "WGS84",
                bigAxis: 6378137.0,
                inverseFlattening: 1. / 298.257223563
            }
        };
        /**
         * Количество градусов в одном радиане
         */
        this.RAD = 57.29577951308232;
        this.DEGREEINRAD = 57.29577951308232;
        this.DOUBLENULL = 1e-6;
        this.M_PI_2 = 1.57079632679489661923;
        this.M_PI_4 = 0.785398163397448309616;
        
        this.setSpheroid(this.map.Translate.EpsgCode);
        // this.test();
    };
    GWTK.MapCalculations.prototype = {
        setSpheroid: function(crs) {
            if (!crs) {
                return false;
            }
            crs = crs.toString();
            if (this.spheroidList[crs]) {
                this.spheroidList[crs]['AlfaTo1'] = 1.0 - this.spheroidList[crs]['inverseFlattening'];
                this.spheroidList[crs]['E2'] = 2.0 * this.spheroidList[crs]['inverseFlattening'] -
                    this.spheroidList[crs]['inverseFlattening'] * this.spheroidList[crs]['inverseFlattening'];
                this.spheroidList[crs]['E2_2'] = this.spheroidList[crs]['E2'] / (1.0 - this.spheroidList[crs]['E2']);
            }
            this.spheroid = this.spheroidList[crs] || false;
        },
        
        buildOrthodromy: function(fa, la, fb, lb) {
            //переводим BL  в радианы
            // fa *= this.DEG_TO_RAD;
            // la *= this.DEG_TO_RAD;
            // fb *= this.DEG_TO_RAD;
            // lb *= this.DEG_TO_RAD;
            
            fa = Trigonometry.toRadians(fa);
            la = Trigonometry.toRadians(la);
            fb = Trigonometry.toRadians(fb);
            lb = Trigonometry.toRadians(lb);
            
            var tmp = [];
            var kt = 200;
            var fl = [];
            var DOUBLENULL = this.DOUBLENULL;
            var k;
            if (Math.abs(lb - la) < DOUBLENULL) {
                var sf = (fb - fa) / (kt - 1);
                var sl = (lb - la) / (kt - 1);
                for (var i = 0; i < kt; i++) {
                    fl.push([fa, la]);
                    fa += sf;
                    la += sl;
                }
                fl.push([fb, lb]);
                
                for (k = 0; k < fl.length - 1; k++) {
                    tmp.push([Trigonometry.toDegrees(fl[k][1]) /** this.RAD_TO_DEG*/, Trigonometry.toDegrees(fl[k][0]) /** this.RAD_TO_DEG*/]);
                }
                return tmp;
            }
            
            var fb1 = fb;
            
            if (Math.abs(fa + fb) < DOUBLENULL) {
                fb1 = fb + Math.PI / (18.0 * 36000.0);
            }
            var A = 1.0 / Math.tan(0.5 * (lb - la)) * Math.cos(0.5 * (fb1 - fa)) / Math.sin(0.5 * (fb1 + fa));
            var B = 1.0 / Math.tan(0.5 * (lb - la)) * Math.sin(0.5 * (fb1 - fa)) / Math.cos(0.5 * (fb1 + fa));
            var alf = Math.atan(A);
            var bet = Math.atan(B);
            var ua = alf - bet;
            var Asimut = Math.abs(fa - fb) / Math.abs(la - lb);
            Asimut = Math.atan(Asimut);
            fl.push([fa, la]);
            if (Asimut <= Math.PI / 3.0) {
                this.odShir(fa, la, lb, kt, ua, fl);
            }else if (this.odDolg(fa, la, fb, kt, ua, fl) === 0) {
                return 0;
            }
            fl.push([fb, lb]);
            if ((la < 0) || (lb < 0)) {
                for (var j = 0; j < kt; j++) {
                    if (fl[j][1] > Math.PI) {
                        fl[j][1] = fl[j][1] - 2.0 * Math.PI;
                    }
                }
            }
            //переводим все в bl
            for (k = 0; k < fl.length - 1; k++) {
                tmp.push([Trigonometry.toDegrees(fl[k][1]), Trigonometry.toDegrees(fl[k][0])]);
            }
            return tmp;
        },
        odShir: function(fa, la, lb, kt, ua, fl) {
            var s, f, l, A, B, lb1, la1, i;
            la1 = la;
            lb1 = lb;
            if (Math.abs(lb - la) > Math.PI) {
                if (la > lb) {
                    lb1 = lb + 2.0 * Math.PI;
                }else{
                    la1 = la + 2.0 * Math.PI;
                }
            }
            s = (lb1 - la1) / (kt - 1);
            l = la + s;
            for (i = 1; i < kt; i++) {
                A = Math.tan(0.5 * (Math.PI / 2.0 - fa)) * (Math.cos(0.5 * (ua - (l - la))) / Math.cos(0.5 * (ua + (l - la))));
                B = Math.tan(0.5 * (Math.PI / 2.0 - fa)) * (Math.sin(0.5 * (ua - (l - la))) / Math.sin(0.5 * (ua + (l - la))));
                f = Math.PI / 2.0 - (Math.atan(A) + Math.atan(B));
                if ((i > 0) && (Math.abs( /***/ (fl[i - 1][0]/*fl - 2*/) - f) > Math.PI / 2.0)) {//TODO проверить у тех кто знает
                    f = Math.PI / 2.0 - (Math.atan(A) + Math.atan(B)) - Math.PI;
                }
                if (l > 2.0 * Math.PI) {
                    l = l - 2.0 * Math.PI;
                }else if (l < -2.0 * Math.PI) {
                    l = l + 2.0 * Math.PI;
                }
                fl.push([f, l]);
                l = l + s;
            }
        },
        odDolg: function(fa, la, fb, kt, ua, fl) {
            var s, l, f, A, u, i, j;
            s = (fb - fa) / (kt - 1);
            f = fa + s;
            if (fa >= 0) {
                if (s >= 0) {
                    j = 1;
                }else{
                    j = 0;
                }
            }else{
                if (s >= 0) {
                    j = 0;
                }else{
                    j = 1;
                }
            }
            if ((fa > 0.0 && fb < 0.0 && Math.abs(fb) > Math.abs(fa)) || (fa < 0.0 && fb > 0.0 && Math.abs(fb) > Math.abs(fa))) {
                ua = ua + Math.PI;
            }
            
            for (i = 1; i < kt; i++) {
                l = Math.sin(Math.PI / 2.0 - fa) / Math.sin(Math.PI / 2.0 - f) * Math.sin(ua);
                if (l < -1.0 || l > 1.0) {
                    return 0;
                }
                u = Math.asin(l);
                if (j === 1) {
                    u = Math.PI - u;
                }
                
                A = Math.tan(0.5 * (u + ua)) * Math.cos(0.5 * (Math.PI - f - fa)) / Math.cos(0.5 * (fa - f));
                A = 1.0 / A;
                l = la + 2 * Math.atan(A);
                if (l > 2.0 * Math.PI) {
                    l = l - 2.0 * Math.PI;
                }else if (l < 0) {
                    l = l + 2.0 * Math.PI;
                }
                fl.push([f, l]);
                f = f + s;
            }
        },
        
        buildLoxodrome: function(fa, la, fb, lb) {
            if (!fa || !la || !fb || !lb) return false;
            
            //переводим BL  в радианы
            // fa *= this.DEG_TO_RAD;
            // la *= this.DEG_TO_RAD;
            // fb *= this.DEG_TO_RAD;
            // lb *= this.DEG_TO_RAD;
            fa = Trigonometry.toRadians(fa);
            la = Trigonometry.toRadians(la);
            fb = Trigonometry.toRadians(fb);
            lb = Trigonometry.toRadians(lb);
            var kt = 400;
            var fl = [];
            
            var fb1, Ya, Yb, Ua, Ub, st1, st2, Da, Db;
            var A = this.spheroid.bigAxis;
            var M = 0.434294482;
            var E = Math.sqrt(0.006693422);
            var alf, Asimut;
            var SAVE_fl;
            var M_PI_4 = this.M_PI_4;// перенес из C++
            var M_PI_2 = this.M_PI_2;// перенес из C++
            var i;
            SAVE_fl = fl;
            
            fb1 = fb;
            if (fa === fb) {
                fb1 = fb + Math.PI / (18.0 * 36000.0); // 1 sek
            }
            Ya = Math.asin(E * Math.sin(fa));
            Yb = Math.asin(E * Math.sin(fb1));
            st1 = Math.tan(M_PI_4 + Ya / 2.0);
            st2 = Math.tan(M_PI_4 + Yb / 2.0);
            
            
            Ua = Math.tan(M_PI_4 + fa / 2.0) / Math.pow(st1, E);
            Ub = Math.tan(M_PI_4 + fb1 / 2.0) / Math.pow(st2, E);
            Da = A / M * Math.log(Ua);
            Db = A / M * Math.log(Ub);
            alf = Math.atan((lb - la) / (Db - Da));
            if (la === lb) {
                Asimut = M_PI_2;
            }else{
                Asimut = Math.abs(fa - fb) / Math.abs(la - lb);
                Asimut = Math.atan(Asimut);
            }
            if (Math.abs(Asimut) <= Math.PI / 3.0) {
                this.ldVshir(fa, la, fb, lb, kt, alf, Da, fl);
            }else{
                this.ldVdolg(fa, la, fb, kt, alf, Da, fl);
            }
            fl = SAVE_fl;
            
            if ((la < 0) || (lb < 0)) {
                for (var j = 0; j < kt; j++) {
                    if (fl[j][1] > Math.PI) {
                        fl[j][1] = fl[j][1] - 2.0 * Math.PI;
                    }
                }
            }
            
            
            //переводим все в bl
            var tmp = [];
            for (var k = 0; k < fl.length; k++) {
                tmp.push([Trigonometry.toDegrees(fl[k][1]) /** this.RAD_TO_DEG*/, Trigonometry.toDegrees(fl[k][0]) /** this.RAD_TO_DEG*/]);
            }
            return tmp;
        },
        ldVshir: function(fa, la, fb, lb, kt, alf, Da, fl) {
            var s, s1, f, f1, l, la1, lb1, per, D, U;
            var A = this.spheroid.bigAxis;
            var M = 0.434294482;
            var i;
            
            lb1 = lb;
            la1 = la;
            if (Math.abs(lb - la) > Math.PI) {
                if (la > lb) {
                    lb1 = lb + 2.0 * Math.PI;
                }else{
                    la1 = la + 2.0 * Math.PI;
                }
            }
            s = (lb1 - la1) / (kt + 1);
            s1 = (fb - fa) / (kt + 1);
            l = la + s;
            f1 = fa + s1;
            per = 10.0;
            
            for (i = 0; i < kt; i++) {//изменил счетчик
                D = Da + (l - la) * (1 / Math.tan(alf));
                U = M / A * D;
                U = Math.pow(per, U);
                f = this.ldResh(U, f1);
                f1 = f1 + s1;
                if (l > 2.0 * Math.PI) {
                    l = l - 2.0 * Math.PI;
                    fl.push([f, l]);
                }else if (l < 0) {
                    l = l + 2.0 * Math.PI;
                    fl.push([f, l]);
                }else{
                    fl.push([f, l]);
                }
                l = l + s;
            }
        },
        ldResh: function(U, f) {
            var c, x, FF, F1, xold;
            var i = -7;
            c = Math.pow(10, i);
            x = f;
            xold = x + 10;
            while (Math.abs(xold - x) > Math.pow(10, -6)) {
                FF = this.ldFunk(U, x);
                F1 = 0.5 * ((this.ldFunk(U, x + c) + this.ldFunk(U, x - c)) / c);
                xold = x;
                x = x - FF / F1;
            }
            return x;
        },
        ldFunk: function(U, f) {
            var Y, zf, M_PI_2 = this.M_PI_2, M_PI_4 = this.M_PI_4;
            var E = Math.sqrt(0.006693422);
            if (f === M_PI_2) {
                f = f + Math.PI / (18.0 * 36000.0);
            }  // 1 sek
            Y = Math.asin(E * Math.sin(f));
            zf = Math.tan(M_PI_4 + f / 2.0) / Math.tan(M_PI_4 + Y / 2.0) - U;
            return zf;
        },
        ldVdolg: function(fa, la, fb, kt, alf, Da, fl) {
            var l, f, s, st, U, Y, D;
            var A = this.spheroid.bigAxis;
            var M = 0.434294482;
            var E = Math.sqrt(0.006693422);
            var i;
            var M_PI_4 = this.M_PI_4;
            s = (fb - fa) / (kt + 1);
            f = fa + s;
            for (i = 0; i < kt; i++) {//изменил счетчик
                Y = E * Math.sin(f);
                st = Math.tan(M_PI_4 + Y / 2.0);
                U = Math.tan(M_PI_4 + f / 2.0) / Math.pow(st, E);
                D = A / M * Math.log(U);
                l = la + (D - Da) * Math.tan(alf);
                if (l > 2.0 * Math.PI) {
                    l = l - 2.0 * Math.PI;
                }else if (l < 0) {
                    l = l + 2.0 * Math.PI;
                }
                fl.push([f, l]);
                f = f + s;
            }
        },
        
        test: function() {
            //TMP FUNCTIONS
            this.point1 = { x: null, y: null };
            this.point2 = { x: null, y: null };
            
            var options = {
                "id": 'svgobjectslayer',
                "alias": 'Оперативные события',
                "selectObject": "1",
                "eventSets": []
            };
            var layer = new GWTK.graphicLayer(this.map, options);
            
            
            $(this.map.overlayPane).on('mapclick', GWTK.Util.bind(function(e) {
                if (!this.point1.x) {
                    this.point1.x = e.geo[0];
                    this.point1.y = e.geo[1];
                }else if (this.point1.x !== null && this.point2.x !== null) {
                    this.point1.x = e.geo[0];
                    this.point1.y = e.geo[1];
                    this.point2.x = null;
                    this.point2.y = null;
                }else{
                    this.point2.x = e.geo[0];
                    this.point2.y = e.geo[1];
                    var f = this.mapInversePositionComputation(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
                    var s = this.mapInversePositionComputation(this.point2.x, this.point2.y, this.point1.x, this.point1.y);
                    
                    var res1 = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(f.azimuth);
                    var res2 = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(s.azimuth);
                    console.log(res1);
                    console.log(res2);
                    layer.updateFromGeoJson({
                        "type": 'FeatureCollection',
                        "features": [{
                            "geometry": {
                                "type": "LineString",
                                "coordinates": JSON.parse(JSON.stringify(f.path))
                            },
                            "type": "Feature",
                            "properties": {
                                "id": 'testorto',
                                "name": "Seattle to DC"
                            }
                        }]
                    });
                }
            }, this));
        },
        mapDirectPositionComputation: function(b1, l1, angle1, distance) {
            if (!b1 || !l1 /*|| !angle1 || !distance*/) {
                return false;
            }
            angle1 = angle1 ? angle1 : 0;
            distance = distance ? distance : 0;
            var b2 = 0, l2 = 0, angle2 = 0;
            b1 = Trigonometry.toRadians(b1);
            l1 = Trigonometry.toRadians(l1);
            angle1 = Trigonometry.toRadians(angle1);
            distance = +distance;
            if (distance <= 0) {
                b2 = b1;
                l2 = l1;
                if (angle2 !== 0) {
                    var da = 180 / this.RAD;
                    if (angle1 >= da) {
                        da -= da;
                    }
                    angle2 = angle1 + da;
                }
                return {
                    b: Trigonometry.toDegrees(b2),
                    l: Trigonometry.toDegrees(l2),
                    angle: Trigonometry.toDegrees(angle2)
                }
            }
            if (distance < 30000) {
                return this.directGeodetic50(b1, l1, angle1, distance);
            }else{
                return this.directGeodetic250(b1, l1, angle1, distance);
            }
        },
        directGeodetic50: function(b1, l1, angle1, distance) {
            var b2 = 0, l2 = 0, angle2 = 0;
            var sina = Math.sin(angle1);
            var cosa = Math.cos(angle1);
            var sinb = Math.sin(b1);
            
            var N1 = this.spheroid.bigAxis / Math.sqrt(1. - this.spheroid.E2 * sinb * sinb);   // 02/04/12
            
            var rd = distance / N1;
            var u = rd * cosa;
            var v = rd * sina;
            
            var b = u * (1 + v * v / 3.);
            var c = v * (1 - u * u / 6.);
            
            var f0 = b1 + b; // * RADSEC;
            var ta = c * Math.tan(f0);
            
            var la = Math.cos(f0);
            if (la !== 0)
                la = c / la;
            else
                la = c * 1000000000.;
            
            var ta2 = ta * ta;
            var la2 = la * la;
            
            var d = c * ta / 2. * (1 - la2 / 12. - ta2 / 6.);
            
            var df = b - d;
            
            var cosb = Math.cos(b1);
            var V1_2 = 1. + this.spheroid.E2_2 * cosb * cosb;
            
            var db = V1_2 * df * (1. - 3. / 4. * this.spheroid.E2_2 * Math.sin(2. * b1) * df -    // sqrt(E2_2) ???
                this.spheroid.E2_2 / 2. * Math.cos(2. * b1) * df * df);  // * RADSEC;
            b2 = b1 + db;
            
            var dl = la * (1 - ta2 / 3.); // * RADSEC;
            l2 = l1 + dl;
            
            if (angle2 !== 0) {
                var da = 180. / this.RAD;                          // 01/04/12
                if (angle1 >= da)
                    da -= da;
                
                var t = ta * (1. - la2 / 6. - ta2 / 6.);  // * RADSEC;
                var eps = b * c / 2. / V1_2;                // * RADSEC;
                angle2 = angle1 + da + t - eps;
            }
            return {
                b: Trigonometry.toDegrees(b2),
                l: Trigonometry.toDegrees(l2),
                angle: Trigonometry.toDegrees(angle2)
            }
        },
        directGeodetic250: function(b1, l1, angle1, distance) {
            var b2 = 0, l2 = 0, angle2 = 0;
            var sina = Math.sin(angle1);
            var sina2 = sina * sina;
            var cosa = Math.cos(angle1);
            var cosb = Math.cos(b1);
            
            var c = this.spheroid.bigAxis / this.spheroid.AlfaTo1;
            var spc = distance / c;
            var spc2 = spc * spc;
            
            var Vm = Math.sqrt(1. + this.spheroid.E2_2 * cosb * cosb);
            
            var db = Vm * Vm * Vm * spc * cosa;
            
            var dl = Vm * spc * sina / cosb;
            
            var dt = Vm * spc * sina * Math.tan(b1);
            
            var bm = b1;
            var lm = l1;
            var am = angle1;
            
            
            var nu2;
            var Vm2;
            var temp;
            var t, t2;
            var cosa2;
            
            for (var i = 0; i < 30; i++) {
                b2 = b1 + db / 2.;
                l2 = l1 + dl / 2.;
                am = angle1 + (dt / 2.);
                
                var ddb = b2 - bm;
                var ddl = l2 - lm;
                
                
                if (ddb < 0) ddb = -ddb;
                if (ddl < 0) ddl = -ddl;
                if ((ddb < 0.000000001) && (ddl < 0.000000001)) {
                    break;
                }
                
                bm = b2;
                lm = l2;
                
                sina = Math.sin(am);
                sina2 = sina * sina;
                cosa = Math.cos(am);
                cosa2 = cosa * cosa;
                cosb = Math.cos(bm);
                t = Math.tan(bm);
                t2 = t * t;
                
                Vm2 = 1. + this.spheroid.E2_2 * cosb * cosb;
                nu2 = Vm2 - 1;
                Vm = Math.sqrt(Vm2);
                
                temp = sina2 * (2. + 3. * t2 + 2. * nu2) +
                    3. * nu2 * cosa2 * (t2 - 1. - nu2 - 4. * nu2 * t2);
                
                temp = 1. + Vm2 * spc2 / 24. * temp;
                db = Vm2 * Vm * spc * cosa * temp;
                
                temp = sina2 * t2 - cosa2 * (1. + nu2 - 9. * nu2 * t2);
                temp = 1. + Vm2 * spc2 / 24. * temp;
                dl = Vm * spc * sina / cosb * temp;
                
                temp = cosa2 * (2. + 7. * nu2 + 9. * nu2 * t2 + 5. * nu2 * nu2) +
                    sina2 * (2. + t2 + 2. * nu2);
                temp = 1. + Vm2 * spc2 / 24. * temp;
                dt = Vm * spc * sina * t * temp;
            }
            b2 = b1 + db;
            l2 = l1 + dl;
            
            if (angle2 !== 0) {
                var da = 180. / this.RAD;
                if (angle1 >= da)
                    da -= da;
                
                angle2 = angle1 + da + dt;
            }
            return {
                b: Trigonometry.toDegrees(b2),
                l: Trigonometry.toDegrees(l2),
                angle: Trigonometry.toDegrees(angle2)
            }
            
        },
        mapInversePositionComputation: function(b1, l1, b2, l2) {
            b1 = +b1;
            l1 = +l1;
            b2 = +b2;
            l2 = +l2;
            
            b1 = Trigonometry.toRadians(b1);
            l1 = Trigonometry.toRadians(l1);
            b2 = Trigonometry.toRadians(b2);
            l2 = Trigonometry.toRadians(l2);
            
            var first = { X: b1, Y: l1 };
            var second = { X: b2, Y: l2 };
            var ret = this.BuildOrthodrome(first, second);
            if (ret === 0) {
                return false;
            }
            var first2 = { X: Trigonometry.toRadians(ret[0][1]), Y: Trigonometry.toRadians(ret[0][0]) };
            var second2 = { X: Trigonometry.toRadians(ret[1][1]), Y: Trigonometry.toRadians(ret[1][0]) };
            
            var first3 = { X: Trigonometry.toRadians(ret[1][1]), Y: Trigonometry.toRadians(ret[1][0]) };
            var second3 = { X: Trigonometry.toRadians(ret[0][1]), Y: Trigonometry.toRadians(ret[0][0]) };
            
            var result = this.SideAzimuth(first2, second2);
            var azimuthreverse = this.SideAzimuth(first3, second3);
            return {
                azimuth: result,
                azimuthreverse: azimuthreverse,
                path: ret
            };
        },
        BuildOrthodrome: function(first, second) {
            var delta = second.Y - first.Y;
            if (delta < 0.) {
                delta = -delta;
            }
            if (delta > 180 / this.DEGREEINRAD) {
                if (first.Y < -180. / this.DEGREEINRAD) {
                    first.Y += 360. / this.DEGREEINRAD;
                }else if (first.Y > 360. / this.DEGREEINRAD) {
                    first.Y -= 360. / this.DEGREEINRAD;
                }
                
                if (second.Y < -180. / this.DEGREEINRAD) {
                    second.Y += 360. / this.DEGREEINRAD;
                }else if (second.Y > 360. / this.DEGREEINRAD) {
                    second.Y -= 360. / this.DEGREEINRAD;
                }
                
                delta = second.Y - first.Y;
                if (delta < 0.) {
                    delta = -delta;
                }
                
                if (delta > 180. / this.DEGREEINRAD) {
                    if (second.Y > 0.) {
                        second.Y -= 360. / this.DEGREEINRAD;
                    }else{
                        second.Y += 360. / this.DEGREEINRAD;
                    }
                    
                    delta = second.Y - first.Y;
                    if (delta < 0.) {
                        delta = -delta;
                    }
                }
            }
            var count = delta / (0.15 / this.DEGREEINRAD) + 1;
            if (count > 450) {
                count = 450;
            }
            if (count > 2) {
                return this.buildOrthodromy(Trigonometry.toDegrees(first.X), Trigonometry.toDegrees(first.Y), Trigonometry.toDegrees(second.X), Trigonometry.toDegrees(second.Y));
            }else{
                return this.buildOrthodromy(Trigonometry.toDegrees(first.X), Trigonometry.toDegrees(first.Y), Trigonometry.toDegrees(second.X), Trigonometry.toDegrees(second.Y));
            }
        },
        SideAzimuth: function(point1, point2) {
            var b1 = point1.X;
            var l1 = point1.Y;
            var b2 = point2.X;
            var l2 = point2.Y;
            if (l1 < 0) {
                if ((l2 < 0) || ((l2 - l1) < Math.PI)) {
                    l1 = l1 + 2.0 * Math.PI;
                    l2 = l2 + 2.0 * Math.PI;
                }else{
                    l1 = l1 + 2.0 * Math.PI;
                }
            }else if (l2 < 0) {
                if ((l1 - l2) < Math.PI) {
                    l1 = l1 + 2.0 * Math.PI;
                    l2 = l2 + 2.0 * Math.PI;
                }else{
                    l2 = l2 + 2.0 * Math.PI;
                }
            }
            var meters1 = new GeoPointRad(l1, b1).toMapPoint().toOrigin();
            var meters2 = new GeoPointRad(l2, b2).toMapPoint().toOrigin();
            
            point1.X = meters1[0];
            point1.Y = meters1[1];
            point2.X = meters2[0];
            point2.Y = meters2[1];
            
            
            var result = this.tmsDirectionAngle(point1, point2);
            result = Trigonometry.toDegrees(result);
            return result;
        },
        tmsDirectionAngle: function(xy1, xy2) {
            var alfa;
            if (xy1 === 0 || xy2 === 0) {
                return 0;
            }
            
            if (xy1.Y === xy2.Y) {
                if (xy1.X <= xy2.X) {
                    return 0;
                }else{
                    return Math.PI;
                }
            }
            
            if (xy1.X === xy2.X) {
                if (xy1.Y <= xy2.Y) {
                    return (Math.PI * 0.5);
                }else{
                    return (Math.PI * 1.5);
                }
            }
            
            alfa = Math.atan2(xy2.Y - xy1.Y, xy2.X - xy1.X);
            
            if (alfa < 0) {
                return (2 * Math.PI + alfa);
            }
            return alfa;
        }
    };
}
