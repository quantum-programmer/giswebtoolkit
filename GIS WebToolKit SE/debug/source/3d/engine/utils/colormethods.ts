/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Функции форматирования цвета                  *
 *                                                                  *
 *******************************************************************/
import { Vector3D, Vector4D } from '~/3d/engine/core/Types';
import { vec4 } from '~/3d/engine/utils/glmatrix';

/**
 * Класс цвета
 * @static
 * @class Color
 */
export default class ColorMethods {
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property {array} mSupport
     */
    private static mSupport = vec4.create();

    /**
     * Конвертировать цвет и прозрачность в единый массив RGBA
     * @static
     * @method RGBA
     * @param colorValue {string} Цвет
     * @param opacity {number} Прозрачность
     * @param [params] {object} Параметры
     * @param [dest] {Vector4D} Результат
     * @return {Vector4D} Результат/Цвет RGBA
     */
    static RGBA( colorValue: string, opacity: number, params?: { type?: 'html' }, dest = vec4.create() ) {

        const color = dest;
        let cMultiplier = 1.0 / 255;
        if ( params ) {
            if ( params[ 'type' ] && params[ 'type' ].toLowerCase() === 'html' )
                cMultiplier = 1;
        }

        const alphaMultiplier = 255 * cMultiplier;
        if ( !colorValue ) {
            vec4.setValues( color, 0, 0, 0, alphaMultiplier );
            return color;
        }

        const parts = this.mSupport;
        if ( colorValue.indexOf( '#' ) === 0 ) {
            vec4.setValues( parts,
                255,
                parseInt( colorValue.substr( 1, 2 ), 16 ),
                parseInt( colorValue.substr( 3, 2 ), 16 ),
                parseInt( colorValue.substr( 5, 2 ), 16 )
            );
        }
        // delete(parts[0]);
        for ( let i = 1; i <= 3; i++ ) {
            color[ i - 1 ] = parts[ i ] * cMultiplier;
        }
        if ( opacity < 0 ) {
            color[ 3 ] = alphaMultiplier;
        } else {
            const alpha = opacity;
            if ( 0.0 <= alpha && alpha <= 1.0 ) {
                color[ 3 ] = alpha * alphaMultiplier;
            } else {
                color[ 3 ] = Math.round( alpha * cMultiplier );
                if ( color[ 3 ] > 255 )
                    color[ 3 ] = 255;
            }
        }

        return color;
    }

    /**
     * Сжатие каналов цвета
     * @static
     * @method packToFloat32
     * @param value {Vector3D} Цвет [R,G,B], значения {0..1}
     * @return {number} Сжатое значение цвета
     */
    static packToFloat32( value: Vector3D ) {
        return Math.round( value[ 0 ] * 255 ) + Math.round( value[ 1 ] * 255 ) * 256.0 + Math.round( value[ 2 ] * 255 ) * 256.0 * 256.0;
    }
}

