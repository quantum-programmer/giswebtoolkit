/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                      All Rights Reserved                         *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Операции с матрицами и векторами для 3D-моделирования        *
 *                                                                  *
 *******************************************************************/

import { Matrix2x2, Matrix3x3, Matrix4x4, Vector2or3, Vector2D, Vector3D, Vector4D } from '~/3d/engine/core/Types';
import { Camera } from '~/3d/refactoringQueue';

/**
 * Функции работы с векторами 2
 * @static
 * @class vec2
 */
export class vec2 {
    static readonly ZERO: Vector2D = [0, 0];
    static readonly UNITX: Vector2D = [1, 0];
    static readonly UNITY: Vector2D = [0, 1];

    private static mSupport: [Vector2D, Vector2D] = [[0, 0], [0, 0]];

    /**
     * Создание вектора
     * @static
     * @method create
     * @param [vec] {Vector2D} Вектор
     * @return {Vector2D} Новый вектор
     */
    static create( vec?: Vector2D ) {
        const dest = this.ZERO.slice() as typeof vec2.ZERO;
        if ( vec ) {
            dest[ 0 ] = vec[ 0 ];
            dest[ 1 ] = vec[ 1 ];
        }

        return dest;
    }

    /**
     * Копирования значений вектора
     * @static
     * @method set
     * @param vec {Vector2D}  Вектор
     * @param dest {Vector2D} Результат
     * @return {Vector2D} Результат
     */
    static set( vec: Vector2D, dest: Vector2D ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];

        return dest;
    }

    /**
     * Установка значений вектора
     * @static
     * @method setValues
     * @param dest {Vector2D} Результат
     * @param x {number} X-координата
     * @param y {number} Y-координата
     * @return {Vector2D} Результат
     */
    static setValues( dest: Vector2D, x: number, y: number ) {
        dest[ 0 ] = x;
        dest[ 1 ] = y;
        return dest;
    }

    /**
     * Перемножение векторов
     * @static
     * @method multiply
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат/измененный вектор 1
     */
    static multiply( vec: Vector2D, vec2: Vector2D, dest?: Vector2D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] *= vec2[ 0 ];
            vec[ 1 ] *= vec2[ 1 ];
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] * vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] * vec2[ 1 ];
        return dest;
    }

    /**
     * Сложение векторов
     * @static
     * @method add
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат (vec + vec2)/измененный вектор 1
     */
    static add( vec: Vector2D, vec2: Vector2D, dest?: Vector2D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] += vec2[ 0 ];
            vec[ 1 ] += vec2[ 1 ];
            return vec;
        }

        dest[ 0 ] = vec[ 0 ] + vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] + vec2[ 1 ];
        return dest;
    }

    /**
     * Вычитание векторов
     * @static
     * @method sub
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат (vec - vec2)/измененный вектор 1
     */
    static sub( vec: Vector2D, vec2: Vector2D, dest?: Vector2D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] -= vec2[ 0 ];
            vec[ 1 ] -= vec2[ 1 ];
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] - vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] - vec2[ 1 ];
        return dest;
    }

    /**
     * Получение противоположно направленного вектора
     * @static
     * @method negate
     * @param vec {Vector2D}  Вектор
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат (-vec)/измененный вектор
     */
    static negate( vec: Vector2D, dest?: Vector2D ) {
        if ( !dest ) {
            dest = vec;
        }
        dest[ 0 ] = -vec[ 0 ];
        dest[ 1 ] = -vec[ 1 ];
        return dest;
    }

    /**
     * Масштабирование вектора
     * @static
     * @method scale
     * @param vec {Vector2D}  Вектор
     * @param val {number}  Масштаб
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат (vec*val)/измененный вектор
     */
    static scale( vec: Vector2D, val: number, dest?: Vector2D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] *= val;
            vec[ 1 ] *= val;
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] * val;
        dest[ 1 ] = vec[ 1 ] * val;
        return dest;
    }

    /**
     * Сложение с масштабируемым вектором
     * @static
     * @method scaleAndAdd
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @param scale {number}  Масштаб
     * @param dest {Vector2D} Результат
     * @return {Vector2D} Результат (vec+vec2*scale)
     */
    static scaleAndAdd( vec: Vector2D, vec2: Vector2D, scale: number, dest: Vector2D ) {
        dest[ 0 ] = vec[ 0 ] + (vec2[ 0 ] * scale);
        dest[ 1 ] = vec[ 1 ] + (vec2[ 1 ] * scale);
        return dest;
    }

    /**
     * Получение длины вектора
     * @static
     * @method len
     * @param vec {Vector2D}  Вектор
     * @return {number} Длина вектора
     */
    static len( vec: Vector2D ) {
        const x = vec[ 0 ], y = vec[ 1 ];
        return Math.sqrt( x * x + y * y );
    }

    /**
     * Получение нормализованного вектора
     * @static
     * @method normalize
     * @param vec {Vector2D}  Вектор
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат /измененный вектор
     */
    static normalize( vec: Vector2D, dest?: Vector2D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ];
        let len = Math.sqrt( x * x + y * y );

        if ( len === 0 ) {
            dest[ 0 ] = 0;
            dest[ 1 ] = 0;
            return dest;
        } else if ( len === 1 ) {
            dest[ 0 ] = x;
            dest[ 1 ] = y;
            return dest;
        } else if ( !len ) {
            console.error( '!!!!!!!' );
        }

        len = 1 / len;
        dest[ 0 ] = x * len;
        dest[ 1 ] = y * len;
        return dest;
    }

    /**
     * Получение скалярного произведения векторов
     * @static
     * @method dot
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @return {number} Скалярное произведение векторов
     */
    static dot( vec: Vector2D, vec2: Vector2D ) {
        return vec[ 0 ] * vec2[ 0 ] + vec[ 1 ] * vec2[ 1 ];
    }


    /**
     * Получение векторного произведения векторов
     * @static
     * @method cross
     * @param vec1 {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат [vec1*vec2]
     */
    static cross( vec1: Vector2D, vec2: Vector2D, dest = vec3.create() ): Vector3D {
        const x1 = vec1[ 0 ], y1 = vec1[ 1 ],
            x2 = vec2[ 0 ], y2 = vec2[ 1 ];

        dest[ 0 ] = 0;
        dest[ 1 ] = 0;
        dest[ 2 ] = x1 * y2 - y1 * x2;

        return dest;
    }


    /**
     * Получение угла между векторами
     * @static
     * @method angleBetween
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @return {number} Острый угол в радианах
     */
    static angleBetween( vec: Vector2D, vec2: Vector2D ) {
        const support = this.mSupport;
        const aN = this.normalize( vec, support[ 0 ] );
        const bN = this.normalize( vec2, support[ 1 ] );
        let cosAlpha = this.dot( aN, bN );
        if ( cosAlpha > 1 ) {
            cosAlpha = 1;
        }
        if ( cosAlpha < -1 ) {
            cosAlpha = -1;
        }
        return Math.acos( cosAlpha );
    }

    /**
     * Определить напрваление вращения вектора 2 к вектору 1
     * @static
     * @method rotationDirection
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @return {boolean} Результат `true` = второй вектор повернут по часовой стрелке относительно первого
     */
    static rotationDirection( vec: Vector2D, vec2: Vector2D ) {
        const x1 = vec[ 0 ], y1 = vec[ 1 ],
            x2 = vec2[ 0 ], y2 = vec2[ 1 ];
        return (x1 * y2 - y1 * x2) > 0;
    }

    /**
     * Поворот вектора
     * @static
     * @method rotate
     * @param vec {Vector2D}  Вектор
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат/измененный вектор
     */
    static rotate( vec: Vector2D, angle: number, dest?: Vector2D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ];
        dest[ 0 ] = x * Math.cos( angle ) - y * Math.sin( angle );
        dest[ 1 ] = x * Math.sin( angle ) + y * Math.cos( angle );
        return dest;
    }

    /**
     * Получить из трехмерного вектора
     * @static
     * @method fromVector3
     * @param vec {Vector3D}  Вектор
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат новый вектор
     */
    static fromVector3( vec: Vector3D, dest = vec2.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        return dest;
    }

    /**
     * Получить из четырехмерного вектора
     * @static
     * @method fromVector4
     * @param vec {Vector4D}  Вектор
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат новый вектор
     */
    static fromVector4( vec: Vector4D, dest = vec2.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        return dest;
    }

    /**
     * Получить из координат точки
     * @static
     * @method fromPoint
     * @param point {Vector2or3} Точка
     * @param [dest] {Vector2D} Результат
     * @return {Vector2D} Результат новый вектор
     */
    static fromPoint( point: Vector2or3, dest = vec2.create() ) {
        if ( point.length === 3 ) {
            this.fromVector3( point, dest );
        } else {
            this.set( point, dest );
        }
        return dest;
    }

    /**
     * Проверка векторов на равенство
     * @static
     * @method equals
     * @param vec {Vector2D}  Вектор 1
     * @param vec2 {Vector2D}  Вектор 2
     * @return {boolean} Векторы равны
     */
    static equals( vec: Vector2D, vec2: Vector2D ) {
        return (vec[ 0 ] === vec2[ 0 ]) && (vec[ 1 ] === vec2[ 1 ]);
    }
}


/**
 * Функции работы с векторами 3
 * @static
 * @class vec3
 */
export class vec3 {
    static readonly ZERO: Vector3D = [0, 0, 0];
    static readonly UNITX: Vector3D = [1, 0, 0];
    static readonly UNITY: Vector3D = [0, 1, 0];
    static readonly UNITZ: Vector3D = [0, 0, 1];
    private static mSupport: [Vector3D, Vector3D] = [[0, 0, 0], [0, 0, 0]];

    /**
     * Создание вектора
     * @static
     * @method create
     * @param [vec] {Vector3D} Вектор
     * @return {Vector3D} Новый вектор
     */
    static create( vec?: Vector3D ) {
        const dest: Vector3D = [0, 0, 0];
        if ( vec ) {
            dest[ 0 ] = vec[ 0 ];
            dest[ 1 ] = vec[ 1 ];
            dest[ 2 ] = vec[ 2 ];
        }

        return dest;
    }

    /**
     * Копирования значений вектора
     * @static
     * @method set
     * @param vec {Vector3D}  Вектор
     * @param dest {Vector3D} Результат
     * @return {Vector3D} Результат
     */
    static set( vec: Vector3D, dest: Vector3D ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = vec[ 2 ];

        return dest;
    }

    /**
     * Установка значений вектора
     * @static
     * @method setValues
     * @param dest {Vector3D} Результат
     * @param x {number} X-координата
     * @param y {number} Y-координата
     * @param z {number} Z-координата
     * @return {Vector3D} Результат
     */
    static setValues( dest: Vector3D, x: number, y: number, z: number ) {
        dest[ 0 ] = x;
        dest[ 1 ] = y;
        dest[ 2 ] = z;
        return dest;
    }

    /**
     * Перемножение векторов
     * @static
     * @method multiply
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/измененный вектор 1
     */
    static multiply( vec: Vector3D, vec2: Vector3D, dest?: Vector3D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] *= vec2[ 0 ];
            vec[ 1 ] *= vec2[ 1 ];
            vec[ 2 ] *= vec2[ 2 ];
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] * vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] * vec2[ 1 ];
        dest[ 2 ] = vec[ 2 ] * vec2[ 2 ];
        return dest;
    }

    /**
     * Сложение векторов
     * @static
     * @method add
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат (vec + vec2)/измененный вектор 1
     */
    static add( vec: Vector3D, vec2: Vector3D, dest?: Vector3D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] += vec2[ 0 ];
            vec[ 1 ] += vec2[ 1 ];
            vec[ 2 ] += vec2[ 2 ];
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] + vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] + vec2[ 1 ];
        dest[ 2 ] = vec[ 2 ] + vec2[ 2 ];

        return dest;
    }

    /**
     * Вычитание векторов
     * @static
     * @method sub
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат (vec - vec2)/измененный вектор 1
     */
    static sub( vec: Vector3D, vec2: Vector3D, dest?: Vector3D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] -= vec2[ 0 ];
            vec[ 1 ] -= vec2[ 1 ];
            vec[ 2 ] -= vec2[ 2 ];
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] - vec2[ 0 ];
        dest[ 1 ] = vec[ 1 ] - vec2[ 1 ];
        dest[ 2 ] = vec[ 2 ] - vec2[ 2 ];
        return dest;
    }

    /**
     * Получение противоположно направленного вектора
     * @static
     * @method negate
     * @param vec {Vector3D}  Вектор
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат (-vec)/измененный вектор
     */
    static negate( vec: Vector3D, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        dest[ 0 ] = -vec[ 0 ];
        dest[ 1 ] = -vec[ 1 ];
        dest[ 2 ] = -vec[ 2 ];
        return dest;
    }

    /**
     * Масштабирование вектора
     * @static
     * @method scale
     * @param vec {Vector3D}  Вектор
     * @param val {number}  Масштаб
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат (vec*val)/измененный вектор
     */
    static scale( vec: Vector3D, val: number, dest?: Vector3D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] *= val;
            vec[ 1 ] *= val;
            vec[ 2 ] *= val;
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] * val;
        dest[ 1 ] = vec[ 1 ] * val;
        dest[ 2 ] = vec[ 2 ] * val;
        return dest;
    }

    /**
     * Сложение с масштабируемым вектором
     * @static
     * @method scaleAndAdd
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param scale {number}  Масштаб
     * @param dest {Vector3D} Результат
     * @return {Vector3D} Результат (vec+vec2*scale)
     */
    static scaleAndAdd( vec: Vector3D, vec2: Vector3D, scale: number, dest: Vector3D ) {
        dest[ 0 ] = vec[ 0 ] + (vec2[ 0 ] * scale);
        dest[ 1 ] = vec[ 1 ] + (vec2[ 1 ] * scale);
        dest[ 2 ] = vec[ 2 ] + (vec2[ 2 ] * scale);
        return dest;
    }

    /**
     * Получение длины вектора
     * @static
     * @method length
     * @param vec {Vector3D}  Вектор
     * @return {number} Длина вектора
     */
    static len( vec: Vector3D ) {
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];
        return Math.sqrt( x * x + y * y + z * z );
    }

    /**
     * Получение нормализованного вектора
     * @static
     * @method normalize
     * @param vec {Vector3D}  Вектор
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат /измененный вектор
     */
    static normalize( vec: Vector3D, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];
        let len = Math.sqrt( x * x + y * y + z * z );

        if ( len === 0 ) {
            dest[ 0 ] = 0;
            dest[ 1 ] = 0;
            dest[ 2 ] = 0;
            return dest;
        } else if ( len === 1 ) {
            dest[ 0 ] = x;
            dest[ 1 ] = y;
            dest[ 2 ] = z;
            return dest;
        } else if ( !len ) {
            console.error( '!!!!!!!!' );
        }

        len = 1 / len;
        dest[ 0 ] = x * len;
        dest[ 1 ] = y * len;
        dest[ 2 ] = z * len;
        return dest;
    }

    /**
     * Получение скалярного произведения векторов
     * @static
     * @method dot
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @return {number} Скалярное произведение векторов
     */
    static dot( vec: Vector3D, vec2: Vector3D ) {
        return vec[ 0 ] * vec2[ 0 ] + vec[ 1 ] * vec2[ 1 ] + vec[ 2 ] * vec2[ 2 ];
    }

    /**
     * Получение векторного произведения векторов
     * @static
     * @method cross
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат [vec*vec2] /измененный вектор 1
     */
    static cross( vec: Vector3D, vec2: Vector3D, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ],
            x2 = vec2[ 0 ], y2 = vec2[ 1 ], z2 = vec2[ 2 ];

        dest[ 0 ] = y * z2 - z * y2;
        dest[ 1 ] = z * x2 - x * z2;
        dest[ 2 ] = x * y2 - y * x2;
        return dest;
    }

    /**
     * Линейная интерпрляция
     * @static
     * @method lerp
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @param lerp {number} Коэффициент интерполяции
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат vec+lerp*(vec2-vec)/измененный вектор 1
     */
    static lerp( vec: Vector3D, vec2: Vector3D, lerp: number, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ],
            y = vec[ 1 ],
            z = vec[ 2 ];

        dest[ 0 ] = x + lerp * (vec2[ 0 ] - x);
        dest[ 1 ] = y + lerp * (vec2[ 1 ] - y);
        dest[ 2 ] = z + lerp * (vec2[ 2 ] - z);

        return dest;
    }

    /**
     * Преобразование вектора через матрицу
     * @static
     * @method transformMat4
     * @param vec {Vector3D} Вектор
     * @param mat {Matrix4x4} Матрица преобразований
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат vec*mat/измененный вектор
     */
    static transformMat4( vec: Vector3D, mat: Matrix4x4, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];
        dest[ 0 ] = mat[ 0 ] * x + mat[ 4 ] * y + mat[ 8 ] * z + mat[ 12 ];
        dest[ 1 ] = mat[ 1 ] * x + mat[ 5 ] * y + mat[ 9 ] * z + mat[ 13 ];
        dest[ 2 ] = mat[ 2 ] * x + mat[ 6 ] * y + mat[ 10 ] * z + mat[ 14 ];
        return dest;
    }

    /**
     * Получение угла между векторами
     * @static
     * @method angleBetween
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @return {number} Острый угол в радианах
     */
    static angleBetween( vec: Vector3D, vec2: Vector3D ) {
        const support = this.mSupport;
        const aN = this.normalize( vec, support[ 0 ] );
        const bN = this.normalize( vec2, support[ 1 ] );
        let cosAlpha = this.dot( aN, bN );
        if ( cosAlpha > 1 ) {
            cosAlpha = 1;
        }
        if ( cosAlpha < -1 ) {
            cosAlpha = -1;
        }
        return Math.acos( cosAlpha );
    }

    /**
     * Поворот вектора вокруг оси X
     * @static
     * @method rotateX
     * @param vec {Vector3D}  Вектор
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/измененный вектор
     */
    static rotateX( vec: Vector3D, angle: number, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        } else {
            dest[ 0 ] = vec[ 0 ];
        }
        const y = vec[ 1 ], z = vec[ 2 ];
        dest[ 1 ] = y * Math.cos( angle ) - z * Math.sin( angle );
        dest[ 2 ] = y * Math.sin( angle ) + z * Math.cos( angle );
        return dest;
    }

    /**
     * Поворот вектора вокруг оси Y
     * @static
     * @method rotateY
     * @param vec {Vector3D}  Вектор
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/измененный вектор
     */
    static rotateY( vec: Vector3D, angle: number, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        } else {
            dest[ 1 ] = vec[ 1 ];
        }
        const x = vec[ 0 ], z = vec[ 2 ];
        dest[ 0 ] = z * Math.cos( angle ) - x * Math.sin( angle );
        dest[ 2 ] = z * Math.sin( angle ) + x * Math.cos( angle );
        return dest;
    }

    /**
     * Поворот вектора вокруг оси Z
     * @static
     * @method rotateZ
     * @param vec {Vector3D}  Вектор
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/измененный вектор
     */
    static rotateZ( vec: Vector3D, angle: number, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        } else {
            dest[ 2 ] = vec[ 2 ];
        }
        const x = vec[ 0 ], y = vec[ 1 ];
        dest[ 0 ] = x * Math.cos( angle ) - y * Math.sin( angle );
        dest[ 1 ] = x * Math.sin( angle ) + y * Math.cos( angle );
        return dest;
    }

    /**
     * Поворот вектора вокруг оси
     * @static
     * @method rotateAroundAxis
     * @param vec {Vector3D}  Вектор
     * @param axis {Vector3D}  Вектор оси вращения
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/измененный вектор
     */
    static rotateAroundAxis( vec: Vector3D, axis: Vector3D, angle: number, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ];
        const y = vec[ 1 ];
        const z = vec[ 2 ];

        const aX = axis[ 0 ];
        const aY = axis[ 1 ];
        const aZ = axis[ 2 ];

        const cosTheta = Math.cos( angle );
        const sinTheta = Math.sin( angle );

        const aLen = this.len( axis );
        const aLenSquared = aLen * aLen;

        dest[ 0 ] = ((aX * (aX * x + aY * y + aZ * z)) + (((x * (aY * aY + aZ * aZ)) - (aX * (aY * y + aZ * z))) * cosTheta) +
            (aLen * ((-aZ * y) + (aY * z)) * sinTheta)) / aLenSquared;

        dest[ 1 ] = ((aY * (aX * x + aY * y + aZ * z)) + (((y * (aX * aX + aZ * aZ)) - (aY * (aX * x + aZ * z))) * cosTheta) +
            (aLen * ((aZ * x) - (aX * z)) * sinTheta)) / aLenSquared;

        dest[ 2 ] = ((aZ * (aX * x + aY * y + aZ * z)) + (((z * (aX * aX + aY * aY)) - (aZ * (aX * x + aY * y))) * cosTheta) +
            (aLen * (-(aY * x) + (aX * y)) * sinTheta)) / aLenSquared;
        return dest;
    }

    /**
     * Преобразование вектора через матрицу
     * @method transformMat3
     * @param vec {Vector3D} Вектор
     * @param mat {Matrix3x3} Матрица преобразований
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат vec*mat/измененный вектор
     */
    static transformMat3( vec: Vector3D, mat: Matrix3x3, dest?: Vector3D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];
        dest[ 0 ] = mat[ 0 ] * x + mat[ 3 ] * y + mat[ 6 ] * z;
        dest[ 1 ] = mat[ 1 ] * x + mat[ 4 ] * y + mat[ 7 ] * z;
        dest[ 2 ] = mat[ 2 ] * x + mat[ 5 ] * y + mat[ 8 ] * z;
        return dest;
    }

    /**
     * Получение наиболее ортогональной оси
     * @static
     * @method  mostOrthogonalAxis
     * @param vec {Vector3D} Вектор
     * @return {Vector3D} Наиболее ортогональная к вектору ось (UNITX, UNITY или UNITZ)
     */
    static mostOrthogonalAxis( vec: Vector3D ) {
        const x = Math.abs( vec[ 0 ] ), y = Math.abs( vec[ 1 ] ), z = Math.abs( vec[ 2 ] );
        let result;
        if ( (x < y) && (x < z) ) {
            result = this.UNITX;
        } else if ( (y < x) && (y < z) ) {
            result = this.UNITY;
        } else {
            result = this.UNITZ;
        }
        return result;
    }

    /**
     * Получить из двухмерного вектора
     * @static
     * @method  fromVector2
     * @param vec {Vector3D}  Вектор
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/новый вектор
     */
    static fromVector2( vec: Vector2D, dest = vec3.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = 0;
        return dest;
    }

    /**
     * Получить из четырехмерного вектора
     * @static
     * @method  fromVector4
     * @param vec {Vector4D}  Вектор
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/новый вектор
     */
    static fromVector4( vec: Vector4D, dest = vec3.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = vec[ 2 ];
        return dest;
    }

    /**
     * Получить из координат точки
     * @static
     * @method  fromPoint
     * @param point {Vector2or3} Точка
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Результат/новый вектор
     */
    static fromPoint( point: Vector2or3, dest = vec3.create() ) {
        if ( point.length === 2 ) {
            this.fromVector2( point, dest );
        } else {
            this.set( point, dest );
        }
        return dest;
    }

    /**
     * Проверка векторов на равенство
     * @static
     * @method  equals
     * @param vec {Vector3D}  Вектор 1
     * @param vec2 {Vector3D}  Вектор 2
     * @return {boolean} Векторы равны
     */
    static equals( vec: Vector3D, vec2: Vector3D ) {
        return (vec[ 0 ] === vec2[ 0 ]) && (vec[ 1 ] === vec2[ 1 ]) && (vec[ 2 ] === vec2[ 2 ]);
    }
}

/**
 * Функции работы с векторами 4
 * @class vec4
 */
export class vec4 {
    /**
     * Создание вектора
     * @static
     * @method  create
     * @param [vec] {Vector4D} Вектор
     * @return {Vector4D} Новый вектор
     */
    static create( vec?: Vector4D ) {
        const dest: Vector4D = [0, 0, 0, 0];
        if ( vec ) {
            dest[ 0 ] = vec[ 0 ];
            dest[ 1 ] = vec[ 1 ];
            dest[ 2 ] = vec[ 2 ];
            dest[ 3 ] = vec[ 3 ];
        }

        return dest;
    }

    /**
     * Копирования значений вектора
     * @static
     * @method  set
     * @param vec {Vector4D}  Вектор
     * @param dest {Vector4D} Результат
     * @return {Vector4D} Результат
     */
    static set( vec: Vector4D, dest: Vector4D ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = vec[ 2 ];
        dest[ 3 ] = vec[ 3 ];

        return dest;
    }

    /**
     * Установка значений вектора
     * @static
     * @method  setValues
     * @param x {number} X-координата
     * @param y {number} Y-координата
     * @param z {number} Z-координата
     * @param w {number} W-координата
     * @param dest {Vector4D} Результат
     * @return {Vector4D} Результат
     */
    static setValues( dest: Vector4D, x: number, y: number, z: number, w: number ) {
        dest[ 0 ] = x;
        dest[ 1 ] = y;
        dest[ 2 ] = z;
        dest[ 3 ] = w;
        return dest;
    }

    /**
     * Масштабирование вектора
     * @static
     * @method  scale
     * @param vec {Vector4D}  Вектор
     * @param val {number}  Масштаб
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат (vec*val)/измененный вектор
     */
    static scale( vec: Vector4D, val: number, dest?: Vector4D ) {
        if ( !dest || vec === dest ) {
            vec[ 0 ] *= val;
            vec[ 1 ] *= val;
            vec[ 2 ] *= val;
            vec[ 3 ] *= val;
            return vec;
        }
        dest[ 0 ] = vec[ 0 ] * val;
        dest[ 1 ] = vec[ 1 ] * val;
        dest[ 2 ] = vec[ 2 ] * val;
        dest[ 3 ] = vec[ 3 ] * val;
        return dest;
    }

    /**
     * Получение скалярного произведения векторов
     * @static
     * @method  dot
     * @param vec {Vector4D}  Вектор 1
     * @param vec2 {Vector4D}  Вектор 2
     * @return {number} Скалярное произведение векторов
     */
    static dot( vec: Vector4D, vec2: Vector4D ) {
        return vec[ 0 ] * vec2[ 0 ] + vec[ 1 ] * vec2[ 1 ] + vec[ 2 ] * vec2[ 2 ] + vec[ 3 ] * vec2[ 3 ];
    }


    /**
     * Преобразование вектора через матрицу
     * @static
     * @method  transformMat4
     * @param vec {Vector4D} Вектор
     * @param mat {Matrix4x4} Матрица преобразований
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат vec*mat/измененный вектор
     */
    static transformMat4( vec: Vector4D, mat: Matrix4x4, dest?: Vector4D ) {
        if ( !dest ) {
            dest = vec;
        }
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ], w = vec[ 3 ];
        dest[ 0 ] = mat[ 0 ] * x + mat[ 4 ] * y + mat[ 8 ] * z + w * mat[ 12 ];
        dest[ 1 ] = mat[ 1 ] * x + mat[ 5 ] * y + mat[ 9 ] * z + w * mat[ 13 ];
        dest[ 2 ] = mat[ 2 ] * x + mat[ 6 ] * y + mat[ 10 ] * z + w * mat[ 14 ];
        dest[ 3 ] = mat[ 3 ] * x + mat[ 7 ] * y + mat[ 11 ] * z + w * mat[ 15 ];
        return dest;
    }


    /**
     * Получить из двухмерного вектора
     * @static
     * @method  fromVector2
     * @param vec {Vector2D}  Вектор
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат новый вектор
     */
    static fromVector2( vec: Vector2D, dest = vec4.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = 0;
        dest[ 3 ] = 0;
        return dest;
    }


    /**
     * Получить из трехмерного вектора
     * @static
     * @method  fromVector3
     * @param vec {Vector3D}  Вектор
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат новый вектор
     */
    static fromVector3( vec: Vector3D, dest = vec4.create() ) {
        dest[ 0 ] = vec[ 0 ];
        dest[ 1 ] = vec[ 1 ];
        dest[ 2 ] = vec[ 2 ];
        dest[ 3 ] = 0;
        return dest;
    }

    /**
     * Проверка векторов на равенство
     * @static
     * @method  equals
     * @param vec {Vector4D}  Вектор 1
     * @param vec2 {Vector4D}  Вектор 2
     * @return {boolean} Векторы равны
     */
    static equals( vec: Vector4D, vec2: Vector4D ) {
        return (vec[ 0 ] === vec2[ 0 ]) && (vec[ 1 ] === vec2[ 1 ]) && (vec[ 2 ] === vec2[ 2 ]) && (vec[ 3 ] === vec2[ 3 ]);
    }
}

/**
 * Функции работы с матрицами 2x2
 * @class mat2
 */
export class mat2 {
    /**
     * Создание матрицы
     * @static
     * @method  create
     * @param [mat] {Matrix2x2} Матрица
     * @return {Matrix2x2} Новая матрица
     */
    static create( mat?: Matrix2x2 ) {
        const dest: Matrix2x2 = [0, 0, 0, 0];
        if ( mat ) {
            dest[ 0 ] = mat[ 0 ];
            dest[ 1 ] = mat[ 1 ];
            dest[ 2 ] = mat[ 2 ];
            dest[ 3 ] = mat[ 3 ];
        }
        return dest;
    }

    /**
     * Копирования значений матрицы
     * @static
     * @method  set
     * @param mat {Matrix2x2}  Матрица
     * @param dest {Matrix2x2} Результат
     * @return {Matrix2x2} Результат
     */
    static set( mat: Matrix2x2, dest: Matrix2x2 ) {
        dest[ 0 ] = mat[ 0 ];
        dest[ 1 ] = mat[ 1 ];
        dest[ 2 ] = mat[ 2 ];
        dest[ 3 ] = mat[ 3 ];
        return dest;
    }

    /**
     * Установка значений матрицы
     * @static
     * @method  setValues
     * @param a {number} Элемент (столбец 0, строка 0)
     * @param b {number} Элемент (столбец 0, строка 1)
     * @param c {number} Элемент (столбец 1, строка 0)
     * @param d {number} Элемент (столбец 1, строка 1)
     * @param dest {Matrix2x2} Результат
     * @return {Matrix2x2} Результат
     */
    static setValues( dest: Matrix2x2, a: number, b: number, c: number, d: number ) {
        dest[ 0 ] = a;
        dest[ 1 ] = b;
        dest[ 2 ] = c;
        dest[ 3 ] = d;
        return dest;
    }

    /**
     * Идентификация единичной матрицы
     * @static
     * @method  identity
     * @param dest {Matrix2x2}  Матрица
     * @return {Matrix2x2} Измененная матрица
     */
    static identity( dest: Matrix2x2 ) {
        dest[ 0 ] = 1;
        dest[ 1 ] = 0;
        dest[ 2 ] = 0;
        dest[ 3 ] = 1;
        return dest;
    }

    /**
     * Вычисление определителя
     * @static
     * @method  det
     * @param mat {Matrix2x2} Матрица
     * @return {number} Определитель матрицы
     */
    static det( mat: Matrix2x2 ) {
        const a00 = mat[ 0 ], a01 = mat[ 1 ],
            a10 = mat[ 2 ], a11 = mat[ 3 ];

        return a00 * a11 - a01 * a10;
    }
}

/**
 * Функции работы с матрицами 3х3
 * @class mat3
 */
export class mat3 {
    /**
     * Создание матрицы
     * @static
     * @method  create
     * @param [mat] {Matrix3x3} Матрица
     * @return {Matrix3x3} Новая матрица
     */
    static create( mat?: Matrix3x3 ) {
        const dest: Matrix3x3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        if ( mat ) {
            dest[ 0 ] = mat[ 0 ];
            dest[ 1 ] = mat[ 1 ];
            dest[ 2 ] = mat[ 2 ];
            dest[ 3 ] = mat[ 3 ];
            dest[ 4 ] = mat[ 4 ];
            dest[ 5 ] = mat[ 5 ];
            dest[ 6 ] = mat[ 6 ];
            dest[ 7 ] = mat[ 7 ];
            dest[ 8 ] = mat[ 8 ];
        }
        return dest;
    }

    /**
     * Копирования значений матрицы
     * @static
     * @method  set
     * @param mat {Matrix3x3}  Матрица
     * @param dest {Matrix3x3} Результат
     * @return {Matrix3x3} Результат
     */
    static set( mat: Matrix3x3, dest: Matrix3x3 ) {
        dest[ 0 ] = mat[ 0 ];
        dest[ 1 ] = mat[ 1 ];
        dest[ 2 ] = mat[ 2 ];
        dest[ 3 ] = mat[ 3 ];
        dest[ 4 ] = mat[ 4 ];
        dest[ 5 ] = mat[ 5 ];
        dest[ 6 ] = mat[ 6 ];
        dest[ 7 ] = mat[ 7 ];
        dest[ 8 ] = mat[ 8 ];
        return dest;
    }

    /**
     * Идентификация единичной матрицы
     * @static
     * @method  identity
     * @param dest {Matrix3x3}  Матрица
     * @return {Matrix3x3} Измененная матрица
     */
    static identity( dest: Matrix3x3 ) {
        dest[ 0 ] = 1;
        dest[ 1 ] = 0;
        dest[ 2 ] = 0;
        dest[ 3 ] = 0;
        dest[ 4 ] = 1;
        dest[ 5 ] = 0;
        dest[ 6 ] = 0;
        dest[ 7 ] = 0;
        dest[ 8 ] = 1;
        return dest;
    }

    /**
     * Транспозиция матрицы
     * @static
     * @method  transpose
     * @param mat {Matrix3x3}  Матрица
     * @param [dest] {Matrix3x3} Результат
     * @return {Matrix3x3} Результат/измененная матрица
     */
    static transpose( mat: Matrix3x3, dest?: Matrix3x3 ) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if ( !dest || mat === dest ) {
            const a01 = mat[ 1 ], a02 = mat[ 2 ],
                a12 = mat[ 5 ];

            mat[ 1 ] = mat[ 3 ];
            mat[ 2 ] = mat[ 6 ];
            mat[ 3 ] = a01;
            mat[ 5 ] = mat[ 7 ];
            mat[ 6 ] = a02;
            mat[ 7 ] = a12;
            return mat;
        }

        dest[ 0 ] = mat[ 0 ];
        dest[ 1 ] = mat[ 3 ];
        dest[ 2 ] = mat[ 6 ];
        dest[ 3 ] = mat[ 1 ];
        dest[ 4 ] = mat[ 4 ];
        dest[ 5 ] = mat[ 7 ];
        dest[ 6 ] = mat[ 2 ];
        dest[ 7 ] = mat[ 5 ];
        dest[ 8 ] = mat[ 8 ];
        return dest;
    }

    /**
     * Получение обратной матрицы
     * @static
     * @method  inverse
     * @param mat {Matrix3x3}  Матрица
     * @param [dest] {Matrix3x3} Результат
     * @return {Matrix3x3} Результат/измененная матрица
     */
    static inverse( mat: Matrix3x3, dest?: Matrix3x3 ) {
        const a00 = mat[ 0 ], a01 = mat[ 1 ], a02 = mat[ 2 ];
        const a10 = mat[ 3 ], a11 = mat[ 4 ], a12 = mat[ 5 ];
        const a20 = mat[ 6 ], a21 = mat[ 7 ], a22 = mat[ 8 ];

        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;

        // Calculate the determinant
        let det = a00 * b01 + a01 * b11 + a02 * b21;

        if ( det === 0 ) {
            return undefined;
        }
        det = 1.0 / det;

        if ( !dest ) {
            dest = mat;
        }

        dest[ 0 ] = b01 * det;
        dest[ 1 ] = (-a22 * a01 + a02 * a21) * det;
        dest[ 2 ] = (a12 * a01 - a02 * a11) * det;
        dest[ 3 ] = b11 * det;
        dest[ 4 ] = (a22 * a00 - a02 * a20) * det;
        dest[ 5 ] = (-a12 * a00 + a02 * a10) * det;
        dest[ 6 ] = b21 * det;
        dest[ 7 ] = (-a21 * a00 + a01 * a20) * det;
        dest[ 8 ] = (a11 * a00 - a01 * a10) * det;
        return dest;
    }

    /**
     * Перемножение матриц
     * @static
     * @method  multiply
     * @param mat {Matrix3x3}  Матрица (будет применена для вектора второй)
     * @param mat2 {Matrix3x3}  Матрица (будет применена для вектора первой)
     * @param dest {Matrix3x3} Результат
     * @return {Matrix3x3} Результат
     */
    static multiply( mat: Matrix3x3, mat2: Matrix3x3, dest: Matrix3x3 ) {

        const a00 = mat[ 0 ], a01 = mat[ 1 ], a02 = mat[ 2 ],
            a10 = mat[ 3 ], a11 = mat[ 4 ], a12 = mat[ 5 ],
            a20 = mat[ 6 ], a21 = mat[ 7 ], a22 = mat[ 8 ],

            b00 = mat2[ 0 ], b01 = mat2[ 1 ], b02 = mat2[ 2 ],
            b10 = mat2[ 3 ], b11 = mat2[ 4 ], b12 = mat2[ 5 ],
            b20 = mat2[ 6 ], b21 = mat2[ 7 ], b22 = mat2[ 8 ];

        dest[ 0 ] = b00 * a00 + b01 * a10 + b02 * a20;
        dest[ 1 ] = b00 * a01 + b01 * a11 + b02 * a21;
        dest[ 2 ] = b00 * a02 + b01 * a12 + b02 * a22;
        dest[ 3 ] = b10 * a00 + b11 * a10 + b12 * a20;
        dest[ 4 ] = b10 * a01 + b11 * a11 + b12 * a21;
        dest[ 5 ] = b10 * a02 + b11 * a12 + b12 * a22;
        dest[ 6 ] = b20 * a00 + b21 * a10 + b22 * a20;
        dest[ 7 ] = b20 * a01 + b21 * a11 + b22 * a21;
        dest[ 8 ] = b20 * a02 + b21 * a12 + b22 * a22;

        return dest;
    }

    /**
     * Функция умножения вектора на матрицу
     * @static
     * @method  multiplyVec3
     * @param mat {Matrix3x3}  Матрица
     * @param vec {Vector3D} Вектор, заданный тремя координатами
     * @param [dest] {Matrix3x3} Результат
     * @return {Matrix3x3} Результат/измененный вектор
     */
    static multiplyVec3( mat: Matrix3x3, vec: Vector3D, dest?: Vector3D ) {
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];
        if ( !dest ) {
            dest = vec;
        }
        dest[ 0 ] = mat[ 0 ] * x + mat[ 3 ] * y + mat[ 6 ] * z;
        dest[ 1 ] = mat[ 1 ] * x + mat[ 4 ] * y + mat[ 7 ] * z;
        dest[ 2 ] = mat[ 2 ] * x + mat[ 5 ] * y + mat[ 8 ] * z;

        return dest;
    }
}

/**
 * Функции работы с матрицами 4х4
 * @class mat4
 */
export class mat4 {
    /**
     * Единичная матрица 4х4
     * @property IDENTITY
     * @static
     */
    static readonly IDENTITY: Matrix4x4 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    /**
     * Создание матрицы
     * @static
     * @method  create
     * @param [mat] {Matrix4x4} Матрица
     * @return {Matrix4x4} Новая матрица
     */
    static create( mat?: Matrix4x4 ) {
        const dest: Matrix4x4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        if ( mat ) {
            dest[ 0 ] = mat[ 0 ];
            dest[ 1 ] = mat[ 1 ];
            dest[ 2 ] = mat[ 2 ];
            dest[ 3 ] = mat[ 3 ];
            dest[ 4 ] = mat[ 4 ];
            dest[ 5 ] = mat[ 5 ];
            dest[ 6 ] = mat[ 6 ];
            dest[ 7 ] = mat[ 7 ];
            dest[ 8 ] = mat[ 8 ];
            dest[ 9 ] = mat[ 9 ];
            dest[ 10 ] = mat[ 10 ];
            dest[ 11 ] = mat[ 11 ];
            dest[ 12 ] = mat[ 12 ];
            dest[ 13 ] = mat[ 13 ];
            dest[ 14 ] = mat[ 14 ];
            dest[ 15 ] = mat[ 15 ];
        }

        return dest;
    }

    /**
     * Копирования значений матрицы
     * @static
     * @method  set
     * @param mat {Matrix4x4}  Матрица
     * @param dest {Matrix4x4} Результат
     * @return {Matrix4x4} Результат
     */
    static set( mat: Matrix4x4, dest: Matrix4x4 ) {
        dest[ 0 ] = mat[ 0 ];
        dest[ 1 ] = mat[ 1 ];
        dest[ 2 ] = mat[ 2 ];
        dest[ 3 ] = mat[ 3 ];
        dest[ 4 ] = mat[ 4 ];
        dest[ 5 ] = mat[ 5 ];
        dest[ 6 ] = mat[ 6 ];
        dest[ 7 ] = mat[ 7 ];
        dest[ 8 ] = mat[ 8 ];
        dest[ 9 ] = mat[ 9 ];
        dest[ 10 ] = mat[ 10 ];
        dest[ 11 ] = mat[ 11 ];
        dest[ 12 ] = mat[ 12 ];
        dest[ 13 ] = mat[ 13 ];
        dest[ 14 ] = mat[ 14 ];
        dest[ 15 ] = mat[ 15 ];
        return dest;
    }

    /**
     * Идентификация единичной матрицы
     * @static
     * @method  identity
     * @param dest {Matrix4x4}  Матрица
     * @return {Matrix4x4} Измененная матрица
     */
    static identity( dest: Matrix4x4 ) {
        dest[ 0 ] = 1;
        dest[ 1 ] = 0;
        dest[ 2 ] = 0;
        dest[ 3 ] = 0;
        dest[ 4 ] = 0;
        dest[ 5 ] = 1;
        dest[ 6 ] = 0;
        dest[ 7 ] = 0;
        dest[ 8 ] = 0;
        dest[ 9 ] = 0;
        dest[ 10 ] = 1;
        dest[ 11 ] = 0;
        dest[ 12 ] = 0;
        dest[ 13 ] = 0;
        dest[ 14 ] = 0;
        dest[ 15 ] = 1;
        return dest;
    }

    /**
     * Транспозиция матрицы
     * @static
     * @method  transpose
     * @param mat {Matrix4x4}  Матрица
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static transpose( mat: Matrix4x4, dest?: Matrix4x4 ) {

        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if ( !dest || mat === dest ) {
            const a01 = mat[ 1 ], a02 = mat[ 2 ], a03 = mat[ 3 ],
                a12 = mat[ 6 ], a13 = mat[ 7 ], a23 = mat[ 11 ];

            mat[ 1 ] = mat[ 4 ];
            mat[ 2 ] = mat[ 8 ];
            mat[ 3 ] = mat[ 12 ];
            mat[ 4 ] = a01;
            mat[ 6 ] = mat[ 9 ];
            mat[ 7 ] = mat[ 13 ];
            mat[ 8 ] = a02;
            mat[ 9 ] = a12;
            mat[ 11 ] = mat[ 14 ];
            mat[ 12 ] = a03;
            mat[ 13 ] = a13;
            mat[ 14 ] = a23;
            return mat;
        }

        dest[ 0 ] = mat[ 0 ];
        dest[ 1 ] = mat[ 4 ];
        dest[ 2 ] = mat[ 8 ];
        dest[ 3 ] = mat[ 12 ];
        dest[ 4 ] = mat[ 1 ];
        dest[ 5 ] = mat[ 5 ];
        dest[ 6 ] = mat[ 9 ];
        dest[ 7 ] = mat[ 13 ];
        dest[ 8 ] = mat[ 2 ];
        dest[ 9 ] = mat[ 6 ];
        dest[ 10 ] = mat[ 10 ];
        dest[ 11 ] = mat[ 14 ];
        dest[ 12 ] = mat[ 3 ];
        dest[ 13 ] = mat[ 7 ];
        dest[ 14 ] = mat[ 11 ];
        dest[ 15 ] = mat[ 15 ];
        return dest;
    }

    /**
     * Преобразование в инвертированную матрицу 3х3
     * @static
     * @method  toInverseMat3
     * @param mat {Matrix4x4}  Матрица
     * @param [dest] {Matrix3x3} Результат
     * @return {Matrix3x3} Результат
     */
    static toInverseMat3( mat: Matrix4x4, dest: Matrix3x3 ) {
        // Cache the matrix values (makes for huge speed increases!)
        const a00 = mat[ 0 ], a01 = mat[ 1 ], a02 = mat[ 2 ],
            a10 = mat[ 4 ], a11 = mat[ 5 ], a12 = mat[ 6 ],
            a20 = mat[ 8 ], a21 = mat[ 9 ], a22 = mat[ 10 ],

            b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,

            d = a00 * b01 + a01 * b11 + a02 * b21;

        if ( d === 0 ) {
            return undefined;
        } else if ( !d ) {
            console.error( '!!!!!' );
        }
        const id = 1 / d;

        dest[ 0 ] = b01 * id;
        dest[ 1 ] = (-a22 * a01 + a02 * a21) * id;
        dest[ 2 ] = (a12 * a01 - a02 * a11) * id;
        dest[ 3 ] = b11 * id;
        dest[ 4 ] = (a22 * a00 - a02 * a20) * id;
        dest[ 5 ] = (-a12 * a00 + a02 * a10) * id;
        dest[ 6 ] = b21 * id;
        dest[ 7 ] = (-a21 * a00 + a01 * a20) * id;
        dest[ 8 ] = (a11 * a00 - a01 * a10) * id;

        return dest;
    }

    /**
     * Перемножение матриц
     * @static
     * @method  multiply
     * @param mat {Matrix4x4}  Матрица (будет применена для вектора второй)
     * @param mat2 {Matrix4x4}  Матрица (будет применена для вектора первой)
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/новая матрица
     */
    static multiply( mat: Matrix4x4, mat2: Matrix4x4, dest: Matrix4x4 ) {

        // Cache the matrix values (makes for huge speed increases!)
        const a00 = mat[ 0 ], a01 = mat[ 1 ], a02 = mat[ 2 ], a03 = mat[ 3 ],
            a10 = mat[ 4 ], a11 = mat[ 5 ], a12 = mat[ 6 ], a13 = mat[ 7 ],
            a20 = mat[ 8 ], a21 = mat[ 9 ], a22 = mat[ 10 ], a23 = mat[ 11 ],
            a30 = mat[ 12 ], a31 = mat[ 13 ], a32 = mat[ 14 ], a33 = mat[ 15 ],

            b00 = mat2[ 0 ], b01 = mat2[ 1 ], b02 = mat2[ 2 ], b03 = mat2[ 3 ],
            b10 = mat2[ 4 ], b11 = mat2[ 5 ], b12 = mat2[ 6 ], b13 = mat2[ 7 ],
            b20 = mat2[ 8 ], b21 = mat2[ 9 ], b22 = mat2[ 10 ], b23 = mat2[ 11 ],
            b30 = mat2[ 12 ], b31 = mat2[ 13 ], b32 = mat2[ 14 ], b33 = mat2[ 15 ];

        dest[ 0 ] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        dest[ 1 ] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        dest[ 2 ] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        dest[ 3 ] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        dest[ 4 ] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        dest[ 5 ] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        dest[ 6 ] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        dest[ 7 ] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        dest[ 8 ] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        dest[ 9 ] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        dest[ 10 ] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        dest[ 11 ] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        dest[ 12 ] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        dest[ 13 ] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        dest[ 14 ] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        dest[ 15 ] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

        return dest;
    }

    /**
     * Функция умножения вектора на матрицу (с учетом смещения)
     * @static
     * @method  multiplyPoint3
     * @param mat {Matrix4x4}  Матрица
     * @param vec {Vector3D} Вектор, заданный тремя координатами
     * @param dest {Vector3D} Результат
     * @return {Vector3D} Результат
     */
    static multiplyPoint3( mat: Matrix4x4, vec: Vector3D, dest: Vector3D ) {
        dest = this.multiplyVec3( mat, vec, dest );

        dest[ 0 ] += mat[ 12 ];
        dest[ 1 ] += mat[ 13 ];
        dest[ 2 ] += mat[ 14 ];

        return dest;
    }

    /**
     * Функция умножения вектора на матрицу (без учета смещения)
     * @static
     * @method  multiplyVec3
     * @param mat {Matrix4x4}  Матрица
     * @param vec {Vector3D} Вектор, заданный тремя координатами
     * @param dest {Vector3D} Результат
     * @return {Vector3D} Результат
     */
    static multiplyVec3( mat: Matrix4x4, vec: Vector3D, dest: Vector3D ) {
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];

        dest[ 0 ] = mat[ 0 ] * x + mat[ 4 ] * y + mat[ 8 ] * z;
        dest[ 1 ] = mat[ 1 ] * x + mat[ 5 ] * y + mat[ 9 ] * z;
        dest[ 2 ] = mat[ 2 ] * x + mat[ 6 ] * y + mat[ 10 ] * z;

        return dest;
    }

    /**
     * Функция умножения вектора на матрицу
     * @static
     * @method  multiplyVec4
     * @param mat {Matrix4x4}  Матрица
     * @param vec {Vector4D} Вектор, заданный четырьмя координатами
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат/измененный вектор
     */
    static multiplyVec4( mat: Matrix4x4, vec: Vector4D, dest: Vector4D ) {
        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ], w = vec[ 3 ];
        if ( !dest ) {
            dest = vec;
        }

        dest[ 0 ] = mat[ 0 ] * x + mat[ 4 ] * y + mat[ 8 ] * z + mat[ 12 ] * w;
        dest[ 1 ] = mat[ 1 ] * x + mat[ 5 ] * y + mat[ 9 ] * z + mat[ 13 ] * w;
        dest[ 2 ] = mat[ 2 ] * x + mat[ 6 ] * y + mat[ 10 ] * z + mat[ 14 ] * w;
        dest[ 3 ] = mat[ 3 ] * x + mat[ 7 ] * y + mat[ 11 ] * z + mat[ 15 ] * w;

        return dest;
    }

    /**
     * Перемещение по вектору
     * @static
     * @method  translate
     * @param mat {Matrix4x4}  Матрица
     * @param vec {Vector3D} Вектор, заданный тремя координатами
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static translate( mat: Matrix4x4, vec: Vector3D, dest?: Matrix4x4 ) {

        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];

        if ( !dest || mat === dest ) {
            mat[ 12 ] = mat[ 0 ] * x + mat[ 4 ] * y + mat[ 8 ] * z + mat[ 12 ];
            mat[ 13 ] = mat[ 1 ] * x + mat[ 5 ] * y + mat[ 9 ] * z + mat[ 13 ];
            mat[ 14 ] = mat[ 2 ] * x + mat[ 6 ] * y + mat[ 10 ] * z + mat[ 14 ];
            mat[ 15 ] = mat[ 3 ] * x + mat[ 7 ] * y + mat[ 11 ] * z + mat[ 15 ];
            return mat;
        }

        const a00 = mat[ 0 ],
            a01 = mat[ 1 ],
            a02 = mat[ 2 ],
            a03 = mat[ 3 ],
            a10 = mat[ 4 ],
            a11 = mat[ 5 ],
            a12 = mat[ 6 ],
            a13 = mat[ 7 ],
            a20 = mat[ 8 ],
            a21 = mat[ 9 ],
            a22 = mat[ 10 ],
            a23 = mat[ 11 ];

        dest[ 0 ] = a00;
        dest[ 1 ] = a01;
        dest[ 2 ] = a02;
        dest[ 3 ] = a03;
        dest[ 4 ] = a10;
        dest[ 5 ] = a11;
        dest[ 6 ] = a12;
        dest[ 7 ] = a13;
        dest[ 8 ] = a20;
        dest[ 9 ] = a21;
        dest[ 10 ] = a22;
        dest[ 11 ] = a23;

        dest[ 12 ] = a00 * x + a10 * y + a20 * z + mat[ 12 ];
        dest[ 13 ] = a01 * x + a11 * y + a21 * z + mat[ 13 ];
        dest[ 14 ] = a02 * x + a12 * y + a22 * z + mat[ 14 ];
        dest[ 15 ] = a03 * x + a13 * y + a23 * z + mat[ 15 ];

        return dest;
    }

    /**
     * Масштабирование по вектору
     * @static
     * @method  scale
     * @param mat {Matrix4x4}  Матрица
     * @param vec {Vector3D} Вектор, заданный тремя координатами
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static scale( mat: Matrix4x4, vec: Vector3D, dest?: Matrix4x4 ) {

        const x = vec[ 0 ], y = vec[ 1 ], z = vec[ 2 ];

        if ( !dest || mat === dest ) {
            mat[ 0 ] *= x;
            mat[ 1 ] *= x;
            mat[ 2 ] *= x;
            mat[ 3 ] *= x;
            mat[ 4 ] *= y;
            mat[ 5 ] *= y;
            mat[ 6 ] *= y;
            mat[ 7 ] *= y;
            mat[ 8 ] *= z;
            mat[ 9 ] *= z;
            mat[ 10 ] *= z;
            mat[ 11 ] *= z;
            return mat;
        }

        dest[ 0 ] = mat[ 0 ] * x;
        dest[ 1 ] = mat[ 1 ] * x;
        dest[ 2 ] = mat[ 2 ] * x;
        dest[ 3 ] = mat[ 3 ] * x;
        dest[ 4 ] = mat[ 4 ] * y;
        dest[ 5 ] = mat[ 5 ] * y;
        dest[ 6 ] = mat[ 6 ] * y;
        dest[ 7 ] = mat[ 7 ] * y;
        dest[ 8 ] = mat[ 8 ] * z;
        dest[ 9 ] = mat[ 9 ] * z;
        dest[ 10 ] = mat[ 10 ] * z;
        dest[ 11 ] = mat[ 11 ] * z;
        dest[ 12 ] = mat[ 12 ];
        dest[ 13 ] = mat[ 13 ];
        dest[ 14 ] = mat[ 14 ];
        dest[ 15 ] = mat[ 15 ];
        return dest;
    }

    /**
     * Поворот вокруг вектора
     * @static
     * @method  rotate
     * @param mat {Matrix4x4}  Матрица
     * @param axis {Vector3D} Вектор, относительно которого будет поворот
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static rotate( mat: Matrix4x4, axis: Vector3D, angle: number, dest?: Matrix4x4 ) {

        let x = axis[ 0 ], y = axis[ 1 ], z = axis[ 2 ], len = vec3.len( axis );

        if ( len === 0 ) {
            return undefined;
        } else if ( !len ) {
            console.error( '!!!!!' );
        }

        if ( len !== 1 ) {
            len = 1 / len;
            x *= len;
            y *= len;
            z *= len;
        }

        const s = Math.sin( angle ),
            c = Math.cos( angle ),
            t = 1 - c;

        const a00 = mat[ 0 ],
            a01 = mat[ 1 ],
            a02 = mat[ 2 ],
            a03 = mat[ 3 ],
            a10 = mat[ 4 ],
            a11 = mat[ 5 ],
            a12 = mat[ 6 ],
            a13 = mat[ 7 ],
            a20 = mat[ 8 ],
            a21 = mat[ 9 ],
            a22 = mat[ 10 ],
            a23 = mat[ 11 ];

        // Construct the elements of the rotation matrix
        const b00 = x * x * t + c,
            b01 = y * x * t + z * s,
            b02 = z * x * t - y * s,
            b10 = x * y * t - z * s,
            b11 = y * y * t + c,
            b12 = z * y * t + x * s,
            b20 = x * z * t + y * s,
            b21 = y * z * t - x * s,
            b22 = z * z * t + c;

        if ( !dest ) {
            dest = mat;
        } else if ( mat !== dest ) { // If the source and destination differ, copy the unchanged last row
            dest[ 12 ] = mat[ 12 ];
            dest[ 13 ] = mat[ 13 ];
            dest[ 14 ] = mat[ 14 ];
            dest[ 15 ] = mat[ 15 ];
        }

        // Perform rotation-specific matrix multiplication
        dest[ 0 ] = a00 * b00 + a10 * b01 + a20 * b02;
        dest[ 1 ] = a01 * b00 + a11 * b01 + a21 * b02;
        dest[ 2 ] = a02 * b00 + a12 * b01 + a22 * b02;
        dest[ 3 ] = a03 * b00 + a13 * b01 + a23 * b02;

        dest[ 4 ] = a00 * b10 + a10 * b11 + a20 * b12;
        dest[ 5 ] = a01 * b10 + a11 * b11 + a21 * b12;
        dest[ 6 ] = a02 * b10 + a12 * b11 + a22 * b12;
        dest[ 7 ] = a03 * b10 + a13 * b11 + a23 * b12;

        dest[ 8 ] = a00 * b20 + a10 * b21 + a20 * b22;
        dest[ 9 ] = a01 * b20 + a11 * b21 + a21 * b22;
        dest[ 10 ] = a02 * b20 + a12 * b21 + a22 * b22;
        dest[ 11 ] = a03 * b20 + a13 * b21 + a23 * b22;
        return dest;
    }

    /**
     * Поворот вокруг оси X
     * @static
     * @method  rotateX
     * @param mat {Matrix4x4}  Матрица
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static rotateX( mat: Matrix4x4, angle: number, dest?: Matrix4x4 ) {
        const s = Math.sin( angle ),
            c = Math.cos( angle ),
            a10 = mat[ 4 ],
            a11 = mat[ 5 ],
            a12 = mat[ 6 ],
            a13 = mat[ 7 ],
            a20 = mat[ 8 ],
            a21 = mat[ 9 ],
            a22 = mat[ 10 ],
            a23 = mat[ 11 ];

        if ( !dest ) {
            dest = mat;
        } else if ( mat !== dest ) { // If the source and destination differ, copy the unchanged rows
            dest[ 0 ] = mat[ 0 ];
            dest[ 1 ] = mat[ 1 ];
            dest[ 2 ] = mat[ 2 ];
            dest[ 3 ] = mat[ 3 ];

            dest[ 12 ] = mat[ 12 ];
            dest[ 13 ] = mat[ 13 ];
            dest[ 14 ] = mat[ 14 ];
            dest[ 15 ] = mat[ 15 ];
        }

        // Perform axis-specific matrix multiplication
        dest[ 4 ] = a10 * c + a20 * s;
        dest[ 5 ] = a11 * c + a21 * s;
        dest[ 6 ] = a12 * c + a22 * s;
        dest[ 7 ] = a13 * c + a23 * s;

        dest[ 8 ] = a10 * -s + a20 * c;
        dest[ 9 ] = a11 * -s + a21 * c;
        dest[ 10 ] = a12 * -s + a22 * c;
        dest[ 11 ] = a13 * -s + a23 * c;
        return dest;
    }

    /**
     * Поворот вокруг оси Y
     * @static
     * @method  rotateY
     * @param mat {Matrix4x4}  Матрица
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static rotateY( mat: Matrix4x4, angle: number, dest?: Matrix4x4 ) {
        const s = Math.sin( angle ),
            c = Math.cos( angle ),
            a00 = mat[ 0 ],
            a01 = mat[ 1 ],
            a02 = mat[ 2 ],
            a03 = mat[ 3 ],
            a20 = mat[ 8 ],
            a21 = mat[ 9 ],
            a22 = mat[ 10 ],
            a23 = mat[ 11 ];

        if ( !dest ) {
            dest = mat;
        } else if ( mat !== dest ) { // If the source and destination differ, copy the unchanged rows
            dest[ 4 ] = mat[ 4 ];
            dest[ 5 ] = mat[ 5 ];
            dest[ 6 ] = mat[ 6 ];
            dest[ 7 ] = mat[ 7 ];

            dest[ 12 ] = mat[ 12 ];
            dest[ 13 ] = mat[ 13 ];
            dest[ 14 ] = mat[ 14 ];
            dest[ 15 ] = mat[ 15 ];
        }

        // Perform axis-specific matrix multiplication
        dest[ 0 ] = a00 * c + a20 * -s;
        dest[ 1 ] = a01 * c + a21 * -s;
        dest[ 2 ] = a02 * c + a22 * -s;
        dest[ 3 ] = a03 * c + a23 * -s;

        dest[ 8 ] = a00 * s + a20 * c;
        dest[ 9 ] = a01 * s + a21 * c;
        dest[ 10 ] = a02 * s + a22 * c;
        dest[ 11 ] = a03 * s + a23 * c;
        return dest;
    }

    /**
     * Поворот вокруг оси Z
     * @static
     * @method  rotateZ
     * @param mat {Matrix4x4}  Матрица
     * @param angle {number} Угол поворота в радианах
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static rotateZ( mat: Matrix4x4, angle: number, dest?: Matrix4x4 ) {
        const s = Math.sin( angle ),
            c = Math.cos( angle ),
            a00 = mat[ 0 ],
            a01 = mat[ 1 ],
            a02 = mat[ 2 ],
            a03 = mat[ 3 ],
            a10 = mat[ 4 ],
            a11 = mat[ 5 ],
            a12 = mat[ 6 ],
            a13 = mat[ 7 ];

        if ( !dest ) {
            dest = mat;
        } else if ( mat !== dest ) { // If the source and destination differ, copy the unchanged last row
            dest[ 8 ] = mat[ 8 ];
            dest[ 9 ] = mat[ 9 ];
            dest[ 10 ] = mat[ 10 ];
            dest[ 11 ] = mat[ 11 ];

            dest[ 12 ] = mat[ 12 ];
            dest[ 13 ] = mat[ 13 ];
            dest[ 14 ] = mat[ 14 ];
            dest[ 15 ] = mat[ 15 ];
        }

        // Perform axis-specific matrix multiplication
        dest[ 0 ] = a00 * c + a10 * s;
        dest[ 1 ] = a01 * c + a11 * s;
        dest[ 2 ] = a02 * c + a12 * s;
        dest[ 3 ] = a03 * c + a13 * s;

        dest[ 4 ] = a00 * -s + a10 * c;
        dest[ 5 ] = a01 * -s + a11 * c;
        dest[ 6 ] = a02 * -s + a12 * c;
        dest[ 7 ] = a03 * -s + a13 * c;

        return dest;
    }

    /**
     * Получение матрицы отсекающего объема
     * @static
     * @method  frustum
     * @param left {number} Ограничение слева
     * @param right {number} Ограничение справа
     * @param bottom {number} Ограничение снизу
     * @param top {number} Ограничение сверху
     * @param near {number} Ограничение вблизи
     * @param far {number} Ограничение вдали
     * @param dest {Matrix4x4} Результат
     * @return {Matrix4x4} Результат
     */
    static frustum( left: number, right: number, bottom: number, top: number, near: number, far: number, dest: Matrix4x4 ) {

        const rl = (right - left),
            tb = (top - bottom),
            fn = (far - near);
        dest[ 0 ] = (near * 2) / rl;
        dest[ 1 ] = 0;
        dest[ 2 ] = 0;
        dest[ 3 ] = 0;
        dest[ 4 ] = 0;
        dest[ 5 ] = (near * 2) / tb;
        dest[ 6 ] = 0;
        dest[ 7 ] = 0;
        dest[ 8 ] = (right + left) / rl;
        dest[ 9 ] = (top + bottom) / tb;
        dest[ 10 ] = -(far + near) / fn;
        dest[ 11 ] = -1;
        dest[ 12 ] = 0;
        dest[ 13 ] = 0;
        dest[ 14 ] = -(far * near * 2) / fn;
        dest[ 15 ] = 0;
        return dest;
    }

    /**
     * Получение матрицы перспективы
     * @static
     * @method  perspective
     * @param angleVis {number} Угол (половина угла обзора)
     * @param aspect {number} Соотношение сторон облати рисования
     * @param near {number} Ограничение вблизи
     * @param far {number} Ограничение вдали
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/новая матрица
     */
    static perspective( angleVis: number, aspect: number, near: number, far: number, dest = mat4.create() ) {
        const top = near * Math.tan( angleVis ),
            right = top * aspect;
        return this.frustum( -right, right, -top, top, near, far, dest );
    }

    /**
     * Получение ортогональной матрицы
     * @static
     * @method  ortho
     * @param left {number} Ограничение слева
     * @param right {number} Ограничение справа
     * @param bottom {number} Ограничение снизу
     * @param top {number} Ограничение сверху
     * @param near {number} Ограничение вблизи
     * @param far {number} Ограничение вдали
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/новая матрица
     */
    static ortho( left: number, right: number, bottom: number, top: number, near: number, far: number, dest = mat4.create() ) {
        const rl = (right - left),
            tb = (top - bottom),
            fn = (far - near);
        dest[ 0 ] = 2 / rl;
        dest[ 1 ] = 0;
        dest[ 2 ] = 0;
        dest[ 3 ] = 0;
        dest[ 4 ] = 0;
        dest[ 5 ] = 2 / tb;
        dest[ 6 ] = 0;
        dest[ 7 ] = 0;
        dest[ 8 ] = 0;
        dest[ 9 ] = 0;
        dest[ 10 ] = -2 / fn;
        dest[ 11 ] = 0;
        dest[ 12 ] = -(left + right) / rl;
        dest[ 13 ] = -(top + bottom) / tb;
        dest[ 14 ] = -(far + near) / fn;
        dest[ 15 ] = 1;
        return dest;
    }

    /**
     * Получение обратной матрицы
     * @static
     * @method  inverse
     * @param mat {Matrix4x4}  Матрица
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/измененная матрица
     */
    static inverse( mat: Matrix4x4, dest?: Matrix4x4 ) {

        if ( !dest ) {
            dest = mat;
        }

        // Cache the matrix values (makes for huge speed increases!)
        const a00 = mat[ 0 ], a01 = mat[ 1 ], a02 = mat[ 2 ], a03 = mat[ 3 ],
            a10 = mat[ 4 ], a11 = mat[ 5 ], a12 = mat[ 6 ], a13 = mat[ 7 ],
            a20 = mat[ 8 ], a21 = mat[ 9 ], a22 = mat[ 10 ], a23 = mat[ 11 ],
            a30 = mat[ 12 ], a31 = mat[ 13 ], a32 = mat[ 14 ], a33 = mat[ 15 ],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

        // Calculate the determinant
        if ( d === 0 ) {
            return undefined;
        } else if ( !d ) {
            console.error( '!!!!' );
        }
        const invDet = 1 / d;

        dest[ 0 ] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
        dest[ 1 ] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
        dest[ 2 ] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
        dest[ 3 ] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
        dest[ 4 ] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
        dest[ 5 ] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
        dest[ 6 ] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
        dest[ 7 ] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
        dest[ 8 ] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
        dest[ 9 ] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
        dest[ 10 ] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
        dest[ 11 ] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
        dest[ 12 ] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
        dest[ 13 ] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
        dest[ 14 ] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
        dest[ 15 ] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

        return dest;
    }

    /**
     * Получение направления взгляда
     * @static
     * @method  lookAt
     * @param eye {Vector3D} Положение камеры
     * @param center {Vector3D} Положение центральной точки направления взгляда
     * @param up {Vector3D} Ориентация (куда напрвлен верх камеры)
     * @param [dest] {Matrix4x4} Результат
     * @return {Matrix4x4} Результат/новая матрица
     */
    static lookAt( eye: Vector3D, center: Vector3D, up: Vector3D, dest = mat4.create() ) {
        const eyex = eye[ 0 ],
            eyey = eye[ 1 ],
            eyez = eye[ 2 ],
            upx = up[ 0 ],
            upy = up[ 1 ],
            upz = up[ 2 ],
            centerx = center[ 0 ],
            centery = center[ 1 ],
            centerz = center[ 2 ];

        if ( eyex === centerx && eyey === centery && eyez === centerz ) {
            return this.identity( dest );
        }

        //direction(eye, center, z);
        let z0 = eyex - centerx,
            z1 = eyey - centery,
            z2 = eyez - centerz;

        // normalize (no check needed for 0 because of early return)
        let len = 1 / Math.sqrt( z0 * z0 + z1 * z1 + z2 * z2 );
        z0 *= len;
        z1 *= len;
        z2 *= len;

        //normalize(cross(up, z, x));
        let x0 = upy * z2 - upz * z1,
            x1 = upz * z0 - upx * z2,
            x2 = upx * z1 - upy * z0;
        len = Math.sqrt( x0 * x0 + x1 * x1 + x2 * x2 );
        if ( len === 0 ) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else if ( !len ) {
            console.error( '!!!!!!!!' );
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }

        //normalize(cross(z, x, y));
        let y0 = z1 * x2 - z2 * x1,
            y1 = z2 * x0 - z0 * x2,
            y2 = z0 * x1 - z1 * x0;

        len = Math.sqrt( y0 * y0 + y1 * y1 + y2 * y2 );
        if ( len === 0 ) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else if ( !len ) {
            console.error( '!!!!!!!!' );
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }

        dest[ 0 ] = x0;
        dest[ 1 ] = y0;
        dest[ 2 ] = z0;
        dest[ 3 ] = 0;
        dest[ 4 ] = x1;
        dest[ 5 ] = y1;
        dest[ 6 ] = z1;
        dest[ 7 ] = 0;
        dest[ 8 ] = x2;
        dest[ 9 ] = y2;
        dest[ 10 ] = z2;
        dest[ 11 ] = 0;
        dest[ 12 ] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        dest[ 13 ] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        dest[ 14 ] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        dest[ 15 ] = 1;

        return dest;
    }
}

/**
 * Функции вычислений
 * @class Calculate
 */
export class Calculate {
    private static mDxVec = vec3.create();
    private static mDyVec = vec3.create();

    /**
     * Функция вычисления нормали
     * @static
     * @method  calcNormal
     * @param vertex1 {Vector3D} Координаты вершины 1 (в метрах)
     * @param vertex2 {Vector3D} Координаты вершины 2 (в метрах)
     * @param vertex3 {Vector3D} Координаты вершины 3 (в метрах)
     * @param [out] {Vector3D} Выходное значение
     * @return {Vector3D} Нормаль к плоскости
     */
    static calcNormal( vertex1: Vector3D, vertex2: Vector3D, vertex3: Vector3D, out = vec3.create() ) {

        // A = y1 (z2 - z3) + y2 (z3 - z1) + y3 (z1 - z2)
        // B = z1 (x2 - x3) + z2 (x3 - x1) + z3 (x1 - x2)
        // C = x1 (y2 - y3) + x2 (y3 - y1) + x3 (y1 - y2)
        // - D = x1 (y2 z3 - y3 z2) + x2 (y3 z1 - y1 z3) + x3 (y1 z2 - y2 z1)
        const a = vertex1[ 1 ] * (vertex2[ 2 ] - vertex3[ 2 ]) + vertex2[ 1 ] * (vertex3[ 2 ] - vertex1[ 2 ]) + vertex3[ 1 ] * (vertex1[ 2 ] - vertex2[ 2 ]);
        const b = vertex1[ 2 ] * (vertex2[ 0 ] - vertex3[ 0 ]) + vertex2[ 2 ] * (vertex3[ 0 ] - vertex1[ 0 ]) + vertex3[ 2 ] * (vertex1[ 0 ] - vertex2[ 0 ]);
        const c = vertex1[ 0 ] * (vertex2[ 1 ] - vertex3[ 1 ]) + vertex2[ 0 ] * (vertex3[ 1 ] - vertex1[ 1 ]) + vertex3[ 0 ] * (vertex1[ 1 ] - vertex2[ 1 ]);
        // const d = vertex1[0] * (vertex2[1] * vertex3[2] - vertex3[1] * vertex2[2]) + vertex2[0] * (vertex3[1] * vertex1[2] - vertex1[1] * vertex3[2]) + vertex3[0] * (vertex1[1] * vertex2[2] - vertex2[1] * vertex1[2]);

        if ( a === 0 && b === 0 && c === 0 ) {
            out[ 0 ] = 0;
            out[ 1 ] = 0;
            out[ 2 ] = 1;
        } else {
            out[ 0 ] = a;
            out[ 1 ] = b;
            out[ 2 ] = c;
        }

        return out;
    }

    /**
     * Функция вычисления площади треугольника
     * @static
     * @method  calcArea
     * @param vertex1 {Vector3D} Координаты вершины 1 (в метрах)
     * @param vertex2 {Vector3D} Координаты вершины 2 (в метрах)
     * @param vertex3 {Vector3D} Координаты вершины 3 (в метрах)
     * @return {number} Площадь треугольника
     */
    static calcArea( vertex1: Vector3D, vertex2: Vector3D, vertex3: Vector3D ) {

        const ab = vec3.sub( vertex2, vertex1, this.mDxVec );
        const ac = vec3.sub( vertex3, vertex1, this.mDyVec );
        return 0.5 * vec3.len( vec3.cross( ab, ac ) );
    }

    /**
     * Преобразовать матрицу в кватернион
     * @param mat - матрица
     * @return {Matrix4x4|[Vector3D, Vector3D, Vector3D]}
     */
    static rotationToQuaternion( mat: Matrix4x4 | [Vector3D, Vector3D, Vector3D] ) {
        let u, v, w;
        const q = vec4.create();
        if ( mat.length > 4 ) {
            const m = mat as Matrix4x4;
            if ( m[ 0 ] > m[ 5 ] && m[ 0 ] > m[ 10 ] ) {
                u = 0;
                v = 1;
                w = 2;
            } else if ( m[ 5 ] > m[ 0 ] && m[ 5 ] > m[ 10 ] ) {
                u = 1;
                v = 2;
                w = 0;
            } else {
                u = 2;
                v = 0;
                w = 1;
            }

            let r = Math.sqrt( 1 + m[ u * 5 ] - m[ v * 5 ] - m[ w * 5 ] );

            if ( r === 0 ) {
                r = 1;
            } else if ( !r ) {
                console.error( '!!!!!!!!' );
            }

            q[ u ] = 0.5 * r;
            q[ v ] = 0.5 * (m[ v * 4 + u ] + m[ u * 4 + v ]) / r;
            q[ w ] = 0.5 * (m[ u * 4 + w ] + m[ w * 4 + u ]) / r;
            q[ 3 ] = 0.5 * (m[ v * 4 + w ] - m[ w * 4 + v ]) / r;

        } else { // если многомерный массив
            const m = mat as [Vector3D, Vector3D, Vector3D];
            if ( m[ 0 ][ 0 ] > m[ 1 ][ 1 ] && m[ 0 ][ 0 ] > m[ 2 ][ 2 ] ) {
                u = 0;
                v = 1;
                w = 2;
            } else if ( m[ 1 ][ 1 ] > m[ 0 ][ 0 ] && m[ 1 ][ 1 ] > m[ 2 ][ 2 ] ) {
                u = 1;
                v = 2;
                w = 0;
            } else {
                u = 2;
                v = 0;
                w = 1;
            }
            let r = Math.sqrt( 1 + m[ u ][ u ] - m[ v ][ v ] - m[ w ][ w ] );
            if ( r === 0 ) {
                r = 1;
            } else if ( !r ) {
                console.error( '!!!!!!' );
            }
            q[ u ] = 0.5 * r;
            q[ v ] = 0.5 * (m[ v ][ u ] + m[ u ][ v ]) / r;
            q[ w ] = 0.5 * (m[ u ][ w ] + m[ w ][ u ]) / r;
            q[ 3 ] = 0.5 * (m[ v ][ w ] - m[ w ][ v ]) / r;
        }
        return q;
    }

    /**
     * Получить направление луча по экранным координатам
     * @static
     * @method  getPointerDirection
     * @param camera {Camera} Камера
     * @param x {number} X-координата на экране
     * @param y {number} Y-координата на экране
     * @param width {number} Ширина области рисования в пикселах
     * @param height {number} Высота области рисования в пикселах
     * @param [dest] {Vector3D} Результат
     * @return {Vector3D} Направление луча
     */
    static getPointerDirection( camera: Camera, x: number, y: number, width: number, height: number, dest = vec3.create() ) {
        const nearHeight = 2. * Math.tan( camera.getViewAngleY() / 2 ) * camera.perspectiveNearPlane;
        const nearWidth = nearHeight * camera.aspectRatio;

        const dX = vec3.scale( camera.getCameraRightVector(), nearWidth * (x - 0.5 * width) / width, this.mDxVec );
        const dY = vec3.scale( camera.getOrientation(), nearHeight * (0.5 * height - y) / height, this.mDyVec );


        const dR = vec3.add( dX, dY );
        const ray_dir = vec3.add( dR, vec3.scale( camera.getCameraVector(), camera.perspectiveNearPlane, dY ) );
        vec3.normalize( ray_dir, dest );
        return dest;
    }
}
