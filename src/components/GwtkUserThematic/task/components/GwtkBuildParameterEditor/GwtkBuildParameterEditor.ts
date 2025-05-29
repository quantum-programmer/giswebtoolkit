/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Виджет компонента "Редактор параметра картограммы"         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkUserThematicTaskState,
    CONFIRM_BUILD_PARAMETER,
    CANCEL_ADD_BUILD_PARAMETER,
    EXPORT_BUILD_PARAMETERS_UNIT,
    IMPORT_BUILD_PARAMETERS_UNIT,
    SET_PARAMETER_NAME,
    SET_RANGES_COUNT,
    UPDATE_USER_THEMATIC_RANGES,
    EDIT_RANGE_LOCALE_STYLE
} from '../../GwtkUserThematicTask';
import { BuildParameterOptions } from '~/types/Types';
import { Semantic } from '../../../Types';
import { LOCALE } from '~/types/CommonTypes';

/**
 * Компонент "Редактор параметра картограммы"
 * @class GwtkBuildParameterEditor
 * @extends Vue
 */
@Component
export default class GwtkBuildParameterEditor extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkUserThematicTaskState>( key: K, value?: GwtkUserThematicTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly buildParametersOptionsTemp!: BuildParameterOptions & { rangesCount: number };

    @Prop( { default: () => [] } )
    private readonly semanticValueCol!: Semantic[];

    @Prop( { default: 0 } )
    private readonly rangeIndex!: number;

    @Prop( { default: 0 } )
    private readonly minValue!: number;

    @Prop( { default: 0 } )
    private readonly maxValue!: number;

    @Prop( { default: false } )
    private readonly isReducedSizeInterface!: boolean;

    private readonly fractionDigits = 4;

    mounted() {
        const rangeList = this.$refs[ 'rangeList' ] as HTMLElement;
        if ( rangeList ) {
            rangeList.scrollTo( 0, this.rangeIndex * 75 );
        }
    }

    get parameterName() {
        return this.buildParametersOptionsTemp.text;
    }

    get parameterId() {
        return this.buildParametersOptionsTemp.id;
    }

    get rangesCount() {
        return this.buildParametersOptionsTemp.rangesCount;
    }

    private addBuildParameter() {
        this.setState( CONFIRM_BUILD_PARAMETER );
    }

    private cancelAddBuildParameter() {
        this.setState( CANCEL_ADD_BUILD_PARAMETER );
    }

    private showParameterOptions() {
        return this.buildParametersOptionsTemp.userThematicRangeList.length;
    }

    private changeParameterName( value: string ) {
        this.setState( SET_PARAMETER_NAME, value );
    }

    private updateUserThematicRanges() {
        this.setState( UPDATE_USER_THEMATIC_RANGES, {
            id: this.parameterId, text: this.parameterName,
            count: this.buildParametersOptionsTemp.rangesCount
        } );
    }

    private toggleRangeLocaleType( rangeIndex: number, type: LOCALE ) {
        this.setState( EDIT_RANGE_LOCALE_STYLE, { rangeIndex, type } );
    }

    private toggleExportUnit() {
        this.setState( EXPORT_BUILD_PARAMETERS_UNIT );
    }

    private updateRangesCount( value: number ) {
        this.setState( SET_RANGES_COUNT, value );
    }

    private toggleImportUnit() {
        this.setState( IMPORT_BUILD_PARAMETERS_UNIT );
    }

    private getStyleButtonPolygon( index: number ) {
        const range = this.buildParametersOptionsTemp.userThematicRangeList[ index ];
        let color = '';
        if ( range && range.styles && range.styles.polygon[ 0 ] && range.styles.polygon[ 0 ].type === 'PolygonSymbolizer' && range.styles.polygon[ 0 ].fill ) {
            color = range.styles.polygon[ 0 ].fill;
        }

        const icon = this.buildParametersOptionsTemp.userThematicRangeList[ index ].icons.polygon;

        return 'background-color: ' + (icon ? '' : color);
    }
}
