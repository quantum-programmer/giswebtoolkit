/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Расчеты по карте                         *
 *                                                                  *
 *******************************************************************/
import Trigonometry from '~/geo/Trigonometry';
import { Point } from '~/geometry/Point';
import { Vector2D } from '~/3d/engine/core/Types';


type Ellipsoid = {
    name: string;
    bigAxis: number;
    inverseFlattening: number;
    AlfaTo1: number;
    E2: number;
    E2_2: number;
}

export default class MapCalculations {

    private static readonly spheroidList: { [ key: number ]: Ellipsoid } = {
        3857: {
            name: 'WGS84',
            bigAxis: 6378137.0,
            inverseFlattening: 0.0033528106647474805,  //  1/298.257223563
            AlfaTo1: 0.9966471893352525, // 1 - 1/inverseFlattening
            E2: 0.0066943799901413165, // 2 * inverseFlattening - inverseFlattening * inverseFlattening
            E2_2: 0.006739496742276434, // E2/(1 - E2)
        }
    };

    private static getEllipsoid( crs: keyof typeof MapCalculations.spheroidList ) {
        return this.spheroidList[ crs ];
    }

    private static readonly DOUBLENULL = 1e-6;
    private static readonly M_PI_4 = Math.PI / 4;
    private static readonly M_PI_2 = Math.PI / 2;

    private static odOrtoDrom( fa: number, la: number, fb: number, lb: number, kt: number ): Vector2D[] {
        if ( kt < 2 ) {
            kt = 2;
        }

        const fl: Vector2D[] = [];
        const DOUBLENULL = this.DOUBLENULL;
        if ( Math.abs( lb - la ) < DOUBLENULL ) {
            const sf = (fb - fa) / (kt - 1);
            const sl = (lb - la) / (kt - 1);
            for ( let i = 0; i < kt; i++ ) {
                fl.push( [fa, la] );
                fa += sf;
                la += sl;
            }
            fl.push( [fb, lb] );

            return fl;
        }

        let fb1 = fb;

        if ( Math.abs( fa + fb ) < DOUBLENULL ) {
            fb1 = fb + Math.PI / (18.0 * 36000.0);
        }

        const A = 1.0 / Math.tan( 0.5 * (lb - la) ) * Math.cos( 0.5 * (fb1 - fa) ) / Math.sin( 0.5 * (fb1 + fa) );
        const B = 1.0 / Math.tan( 0.5 * (lb - la) ) * Math.sin( 0.5 * (fb1 - fa) ) / Math.cos( 0.5 * (fb1 + fa) );
        const alf = Math.atan( A );
        const bet = Math.atan( B );
        const ua = alf - bet;
        let azimuth = Math.abs( fa - fb ) / Math.abs( la - lb );
        azimuth = Math.atan( azimuth );

        if ( azimuth <= Math.PI / 3.0 ) {
            this.odOrthodromeLatitude( fa, la, lb, kt, ua, fl );
        } else {
            this.odOrthodromeLongitude( fa, la, fb, kt, ua, fl );
        }
        fl.push( [fb, lb] );
        if ( la < 0 || lb < 0 ) {
            for ( let j = 0; j < kt; j++ ) {
                if ( fl[ j ][ 1 ] > Math.PI ) {
                    fl[ j ][ 1 ] = fl[ j ][ 1 ] - 2.0 * Math.PI;
                }
            }
        }

        fl.pop();

        return fl;
    }

    private static odOrthodromeLatitude( fa: number, la: number, lb: number, kt: number, ua: number, fl: number[][] ) {
        let la1 = la;
        let lb1 = lb;
        if ( Math.abs( lb - la ) > Math.PI ) {
            if ( la > lb ) {
                lb1 = lb + 2.0 * Math.PI;
            } else {
                la1 = la + 2.0 * Math.PI;
            }
        }

        const s = (lb1 - la1) / (kt - 1);

        fl.push( [fa, la] );

        let l = la + s;

        for ( let i = 1; i < kt; i++ ) {
            const A = Math.tan( 0.5 * (Math.PI / 2.0 - fa) ) * (Math.cos( 0.5 * (ua - (l - la)) ) / Math.cos( 0.5 * (ua + (l - la)) ));
            const B = Math.tan( 0.5 * (Math.PI / 2.0 - fa) ) * (Math.sin( 0.5 * (ua - (l - la)) ) / Math.sin( 0.5 * (ua + (l - la)) ));
            let f = Math.PI / 2.0 - (Math.atan( A ) + Math.atan( B ));
            if ( i > 0 && (Math.abs( fl[ i - 1 ][ 0 ] - f ) > Math.PI / 2.0) ) {
                f = Math.PI / 2.0 - (Math.atan( A ) + Math.atan( B )) - Math.PI;
            }
            if ( l > 2.0 * Math.PI ) {
                l -= 2.0 * Math.PI;
            } else if ( l < -2.0 * Math.PI ) {
                l += 2.0 * Math.PI;
            }
            fl.push( [f, l] );
            l += s;
        }
    }

    private static odOrthodromeLongitude( fa: number, la: number, fb: number, kt: number, ua: number, fl: number[][] ) {

        let s = (fb - fa) / (kt - 1);

        fl.push( [fa, la] );

        let f = fa + s;

        let j;
        if ( fa >= 0 ) {
            if ( s >= 0 ) {
                j = 1;
            } else {
                j = 0;
            }
        } else {
            if ( s >= 0 ) {
                j = 0;
            } else {
                j = 1;
            }
        }

        // Для защиты от выбросов в правую сторону
        if ( (fa > 0.0 && fb < 0.0 && Math.abs( fb ) > Math.abs( fa )) || (fa < 0.0 && fb > 0.0 && Math.abs( fb ) > Math.abs( fa )) ) {
            ua += Math.PI;
        }

        for ( let i = 1; i < kt; i++ ) {
            let l = Math.sin( Math.PI / 2.0 - fa ) / Math.sin( Math.PI / 2.0 - f ) * Math.sin( ua );
            if ( l < -1.0 || l > 1.0 ) {
                throw Error( 'Invalid data' );
            }
            let u = Math.asin( l );
            if ( j === 1 ) {
                u = Math.PI - u;
            }

            let A = Math.tan( 0.5 * (u + ua) ) * Math.cos( 0.5 * (Math.PI - f - fa) ) / Math.cos( 0.5 * (fa - f) );
            A = 1.0 / A;
            l = la + 2 * Math.atan( A );
            if ( l > 2.0 * Math.PI ) {
                l = l - 2.0 * Math.PI;
            } else if ( l < 0 ) {
                l = l + 2.0 * Math.PI;
            }
            fl.push( [f, l] );
            f = f + s;
        }
    }

    private static ldVshir( fa: number, la: number, fb: number, lb: number, kt: number, alf: number, Da: number, fl: number[][], ellipsoid: Ellipsoid ) {

        let s, s1, f, f1, l, la1, lb1, per, D, U;
        const A = ellipsoid.bigAxis;
        const M = 0.434294482;
        let i;

        lb1 = lb;
        la1 = la;
        if ( Math.abs( lb - la ) > Math.PI ) {
            if ( la > lb ) {
                lb1 = lb + 2.0 * Math.PI;
            } else {
                la1 = la + 2.0 * Math.PI;
            }
        }
        s = (lb1 - la1) / (kt + 1);
        s1 = (fb - fa) / (kt + 1);
        l = la + s;
        f1 = fa + s1;
        per = 10.0;

        for ( i = 0; i < kt; i++ ) {//изменил счетчик
            D = Da + (l - la) * (1 / Math.tan( alf ));
            U = M / A * D;
            U = Math.pow( per, U );
            f = this.ldResh( U, f1 );
            f1 = f1 + s1;
            if ( l > 2.0 * Math.PI ) {
                l = l - 2.0 * Math.PI;
                fl.push( [f, l] );
            } else if ( l < 0 ) {
                l = l + 2.0 * Math.PI;
                fl.push( [f, l] );
            } else {
                fl.push( [f, l] );
            }
            l = l + s;
        }
    }

    private static ldResh( U: number, f: number ) {
        let c, x, FF, F1, xold;
        const i = -7;
        c = Math.pow( 10, i );
        x = f;
        xold = x + 10;
        while ( Math.abs( xold - x ) > Math.pow( 10, -6 ) ) {
            FF = this.ldFunk( U, x );
            F1 = 0.5 * ((this.ldFunk( U, x + c ) + this.ldFunk( U, x - c )) / c);
            xold = x;
            x = x - FF / F1;
        }
        return x;
    }

    private static ldFunk( U: number, f: number ) {
        let Y, zf, M_PI_2 = this.M_PI_2, M_PI_4 = this.M_PI_4;
        const E = Math.sqrt( 0.006693422 );
        if ( f === M_PI_2 ) {
            f = f + Math.PI / (18.0 * 36000.0);
        }  // 1 sek
        Y = Math.asin( E * Math.sin( f ) );
        zf = Math.tan( M_PI_4 + f / 2.0 ) / Math.tan( M_PI_4 + Y / 2.0 ) - U;
        return zf;
    }

    private static ldVdolg( fa: number, la: number, fb: number, kt: number, alf: number, Da: number, fl: number[][], ellipsoid: Ellipsoid ) {
        let l, f, s, st, U, Y, D;
        const A = ellipsoid.bigAxis;
        const M = 0.434294482;
        const E = Math.sqrt( 0.006693422 );
        let i;
        const M_PI_4 = this.M_PI_4;
        s = (fb - fa) / (kt + 1);
        f = fa + s;
        for ( i = 0; i < kt; i++ ) {//изменил счетчик
            Y = E * Math.sin( f );
            st = Math.tan( M_PI_4 + Y / 2.0 );
            U = Math.tan( M_PI_4 + f / 2.0 ) / Math.pow( st, E );
            D = A / M * Math.log( U );
            l = la + (D - Da) * Math.tan( alf );
            if ( l > 2.0 * Math.PI ) {
                l = l - 2.0 * Math.PI;
            } else if ( l < 0 ) {
                l = l + 2.0 * Math.PI;
            }
            fl.push( [f, l] );
            f = f + s;
        }
    }

    /**
     * Создание кривой на поверхности эллипсоида
     * @method buildOrthodrome
     * @param b1Deg {number} Широта начальной точки, градусы
     * @param l1Deg {number} Долгота начальной точки, градусы
     * @param b2Deg {number} Широта конечной точки, градусы
     * @param l2Deg {number} Долгота конечной точки, градусы
     * @return {Vector2D[]} Массив точек в градусах
     */
    static buildOrthodrome( b1Deg: number, l1Deg: number, b2Deg: number, l2Deg: number ): Vector2D[] {

        const b1 = Trigonometry.toRadians( b1Deg );
        const l1 = Trigonometry.toRadians( l1Deg );
        const b2 = Trigonometry.toRadians( b2Deg );
        const l2 = Trigonometry.toRadians( l2Deg );

        return this.buildOrthodromeRadians( b1, l1, b2, l2 ).map( value => Trigonometry.toDegrees( value ) );
    }

    /**
     * Создание кривой на поверхности эллипсоида
     * @method buildOrthodromeRadians
     * @param b1 {number} Широта начальной точки, радианы
     * @param l1 {number} Долгота начальной точки, радианы
     * @param b2 {number} Широта конечной точки, радианы
     * @param l2 {number} Долгота конечной точки, радианы
     * @return {Vector2D[]} Массив точек в радианах
     */
    static buildOrthodromeRadians( b1: number, l1: number, b2: number, l2: number ): Vector2D[] {

        const startPoint = new Point( b1, l1 );
        const endPoint = new Point( b2, l2 );

        let delta = endPoint.y - startPoint.y;

        if ( delta < 0. ) {
            delta = -delta;
        }

        if ( delta > Trigonometry.toRadians( 400 ) ) {
            throw Error( 'Invalid data' );
        }

        if ( delta > Math.PI ) {
            if ( startPoint.y < -Math.PI ) {
                startPoint.y += 2 * Math.PI;
            } else if ( startPoint.y > 2 * Math.PI ) {
                startPoint.y -= 2 * Math.PI;
            }

            if ( endPoint.y < -Math.PI ) {
                endPoint.y += 2 * Math.PI;
            } else if ( endPoint.y > 2 * Math.PI ) {
                endPoint.y -= 2 * Math.PI;
            }

            delta = endPoint.y - startPoint.y;
            if ( delta < 0. ) {
                delta = -delta;
            }

            if ( delta > Math.PI ) {
                if ( endPoint.y > 0. ) {
                    endPoint.y -= 2 * Math.PI;
                } else {
                    endPoint.y += 2 * Math.PI;
                }

                delta = endPoint.y - startPoint.y;
                if ( delta < 0. ) {
                    delta = -delta;
                }
            }
        }

        let count = Math.floor( delta / Trigonometry.toRadians( 0.15 ) + 1 );

        if ( count > 450 ) {
            count = 450;
        }
        if ( count > 2 ) {
            return this.odOrtoDrom( startPoint.x, startPoint.y, endPoint.x, endPoint.y, count );
        } else {
            return [[b1, l1], [b2, l2]] as Vector2D[];
        }
    }

    static buildLoxodrome( fa: number, la: number, fb: number, lb: number, crs: keyof typeof MapCalculations.spheroidList = 3857 ): number[][] | undefined {
        const ellipsoid = this.getEllipsoid( crs );
        if ( !fa || !la || !fb || !lb || !ellipsoid ) {
            return;
        }

        //переводим BL в радианы
        fa = Trigonometry.toRadians( fa );
        la = Trigonometry.toRadians( la );
        fb = Trigonometry.toRadians( fb );
        lb = Trigonometry.toRadians( lb );
        const kt = 400;
        let fl: Vector2D[] = [];

        let fb1, Ya, Yb, Ua, Ub, st1, st2, Da, Db;
        const A = ellipsoid.bigAxis;
        const M = 0.434294482;
        const E = Math.sqrt( 0.006693422 );
        let alf, Azimuth;
        let SAVE_fl;
        const M_PI_4 = this.M_PI_4;// перенес из C++
        const M_PI_2 = this.M_PI_2;// перенес из C++
        SAVE_fl = fl;

        fb1 = fb;
        if ( fa === fb ) {
            fb1 = fb + Math.PI / (18.0 * 36000.0); // 1 sek
        }
        Ya = Math.asin( E * Math.sin( fa ) );
        Yb = Math.asin( E * Math.sin( fb1 ) );
        st1 = Math.tan( M_PI_4 + Ya / 2.0 );
        st2 = Math.tan( M_PI_4 + Yb / 2.0 );


        Ua = Math.tan( M_PI_4 + fa / 2.0 ) / Math.pow( st1, E );
        Ub = Math.tan( M_PI_4 + fb1 / 2.0 ) / Math.pow( st2, E );
        Da = A / M * Math.log( Ua );
        Db = A / M * Math.log( Ub );
        alf = Math.atan( (lb - la) / (Db - Da) );
        if ( la === lb ) {
            Azimuth = M_PI_2;
        } else {
            Azimuth = Math.abs( fa - fb ) / Math.abs( la - lb );
            Azimuth = Math.atan( Azimuth );
        }
        if ( Math.abs( Azimuth ) <= Math.PI / 3.0 ) {
            this.ldVshir( fa, la, fb, lb, kt, alf, Da, fl, ellipsoid );
        } else {
            this.ldVdolg( fa, la, fb, kt, alf, Da, fl, ellipsoid );
        }
        fl = SAVE_fl;

        if ( (la < 0) || (lb < 0) ) {
            for ( let j = 0; j < kt; j++ ) {
                if ( fl[ j ][ 1 ] > Math.PI ) {
                    fl[ j ][ 1 ] = fl[ j ][ 1 ] - 2.0 * Math.PI;
                }
            }
        }

        //переводим все в bl
        const tmp = [];
        for ( let k = 0; k < fl.length; k++ ) {
            tmp.push( [Trigonometry.toDegrees( fl[ k ][ 1 ] ), Trigonometry.toDegrees( fl[ k ][ 0 ] )] );
        }
        return tmp;
    }
}

// test() {
//     //TMP FUNCTIONS
//     this.point1 = { x: null, y: null };
//     this.point2 = { x: null, y: null };
//
//     const options = {
//         "id": 'svgobjectslayer',
//         "alias": 'Оперативные события',
//         "selectObject": "1",
//         "eventSets": []
//     };
//     const layer = new GWTK.graphicLayer(this.map, options);
//
//
//     $(this.map.overlayPane).on('mapclick', GWTK.Util.bind(function(e) {
//         if (!this.point1.x) {
//             this.point1.x = e.geo[0];
//             this.point1.y = e.geo[1];
//         }else if (this.point1.x !== null && this.point2.x !== null) {
//             this.point1.x = e.geo[0];
//             this.point1.y = e.geo[1];
//             this.point2.x = null;
//             this.point2.y = null;
//         }else{
//             this.point2.x = e.geo[0];
//             this.point2.y = e.geo[1];
//             const f = this.mapInversePositionComputation(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
//             const s = this.mapInversePositionComputation(this.point2.x, this.point2.y, this.point1.x, this.point1.y);
//
//             const res1 = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(f.azimuth);
//             const res2 = GWTK.LatLng.prototype.Degrees2DegreesMinutesSeconds(s.azimuth);
//             console.log(res1);
//             console.log(res2);
//             layer.updateFromGeoJson({
//                 "type": 'FeatureCollection',
//                 "features": [{
//                     "geometry": {
//                         "type": "LineString",
//                         "coordinates": JSON.parse(JSON.stringify(f.path))
//                     },
//                     "type": "Feature",
//                     "properties": {
//                         "id": 'testorto',
//                         "name": "Seattle to DC"
//                     }
//                 }]
//             });
//         }
//     }, this));
// },
