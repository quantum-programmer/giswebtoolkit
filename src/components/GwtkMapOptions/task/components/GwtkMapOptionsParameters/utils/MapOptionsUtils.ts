export default class MapOptionsUtils {
    private constructor() {
    }

    /**
     * Сгенерировать стили для поля выбора цвета
     * @static
     * @method createStyleForColorBox
     * @property color {String}
     */
    static createStyleForColorBox( color = '#FFFFFF' ) {
        return {
            backgroundColor: color,
            cursor: 'pointer',
            height: '22px',
            width: '22px',
            borderRadius: '4px',
            transition: 'border-radius 200ms ease-in-out'
        };
    }

    /**
     * Перевести значения непрозрачности к целому числу
     * @static
     * @method convertValueToInteger
     * @property value {Number}
     */
    static convertValueToInteger( value = 0 ) {
        return value * 100;
    }

    /**
     * Перевести значения непрозрачности в число с плавающей запятой
     * @static
     * @method convertValueToFloat
     * @property value {Number}
     */
    static convertValueToFloat( value = 0 ) {
        if ( value !== 0 )
            return value / 100;
        return value;
    }

}
