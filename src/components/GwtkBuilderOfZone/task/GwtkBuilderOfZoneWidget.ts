/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *                    "Построение буферных зон"                     *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkBuilderOfZoneTaskState,
    CREATE_BUFFER_ZONE,
    UPDATE_BUFFER_ZONE_NAME,
    UPDATE_CHECK_AROUND_ALL,
    UPDATE_RADIUS,
    UPDATE_UNITS,
    UPDATE_SEW_ZONE_CHECK,
    UPDATE_MSG_OBJECT_NAME,
    UPDATE_SEARCH_OBJECTS_CHECK,
    UPDATE_SEARCH_PROGRESS_BAR,
    ABORT_SEARCH,
    UPDATE_SELECT_ACTION_ACTIVE
} from '@/components/GwtkBuilderOfZone/task/GwtkBuilderOfZoneTask';
import MapObject from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';
import {ActionDescription} from '~/taskmanager/Task';

interface VuetifyForm extends Vue {
    validate(): boolean;
}

/**
 * Виджет компонента
 * @class GwtkBuilderOfZoneWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkBuilderOfZoneWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkBuilderOfZoneTaskState>( key: K, value: GwtkBuilderOfZoneTaskState[K] ) => void;

    @Prop( { default: false } )
    private readonly checkAroundAll!: boolean;

    @Prop( { default: false } )
    private readonly checkSewZone!: boolean;

    @Prop( { default: false } )
    private readonly checkSearchObjects!: boolean;

    @Prop( { default: false } )
    private readonly zoneRadiusValue!: string;

    @Prop( { default: false } )
    private readonly units!: string;

    @Prop( { default: false } )
    private readonly numZone!: string;

    @Prop( { default: false } )
    private readonly bufferZoneNameVal!: string;

    @Prop( { default: false } )
    private readonly txtObjectName!: string;

    @Prop( { default: true } ) searchProgressBar!: boolean;

    @Prop( { default: false } ) searchObjectDisabled!: boolean;

    @Prop( { default: undefined } ) actionDescription!: ActionDescription | undefined;
    /**
     * Проверка формы
     */
    public $refs!: {
        radiusForm: VuetifyForm;
    };

    /**
     * проверка формы
     * @property validateForm {boolean}
     */
    private validateForm: boolean = false;
    /**
     * активность checkbox сшивания зон
     * @property sewZoneDisabled {boolean}
     */
    private sewZoneDisabled: boolean = !this.checkAroundAll;

    /**
     * Создание виджета
     */
    created() {
        this.setState( UPDATE_MSG_OBJECT_NAME, undefined );

    }

    /**
     * Имя выбранного объекта
     */
    get textObject() {
        return this.txtObjectName;
    }

    /**
     * Заголовок радиус зоны
     * @property textZoneRadius {string}
     */
    get textZoneRadius() {
        return this.$t( 'phrases.Zone radius' );
    }

    /**
     * Проверка выбора объекта
     * @property checkSelObj {string}
     */
    get checkSelObj() {
        return [( v: string ) => v !== this.$t( 'phrases.Select map object' ) || this.$t( 'phrases.No object has been selected' )];
    }

    /**
     * Проверка ввода радиуса
     * @property radius {string}
     */
    get radius() {
        return [( v: number ) => v > 0 || this.$t( 'phrases.Enter the radius' )];
    }

    /**
     * Значение радиуса
     * @property radiusValue {string}
     */
    get radiusValue() {
        return this.zoneRadiusValue;
    }

    /**
     * Установить радиус
     * @property radiusValue
     * @param value {string}
     */
    set radiusValue( value: string ) {
        this.setState( UPDATE_RADIUS, value );
    }

    /**
     * Единицы измерения
     * @property arrayUnits {array}
     */
    get arrayUnits() {
        return [{ text: this.$t( 'phrases.m' ), value: 'm' },
            { text: this.$t( 'phrases.km' ), value: 'km' }];
    }

    /**
     * Единицы измерения
     * @property unitsStart {string}
     */
    get unitsStart() {
        return {
            text: this.$t( 'phrases.' + this.units ) as string,
            value: this.units
        };
    }


    /**
     * Установить единицы измерения
     * @param value {string}
     */
    set unitsStart( value: { text: string, value: string } ) {
        this.setState( UPDATE_UNITS, value.value );
    }

    /**
     * Заголовок вокруг всех объектов
     * @property checkboxAroundAll {string}
     */
    get checkboxAroundAll() {
        return this.$t( 'phrases.Around all selected' );
    }

    /**
     * Disabled сшивать зоны
     * @property {boolean}
     */
    get disableSewZone() {
        return this.sewZoneDisabled;
    }

    /**
     * Установить Disabled сшивать зоны
     * @param value {boolean}
     */
    set disableSewZone( value: boolean ) {
        this.sewZoneDisabled = value;
        if ( value ) {
            this.setState( UPDATE_SEW_ZONE_CHECK, value );
        }
    }

    /**
     * Заголовок Сшивать зоны
     * @property checkboxSewZone {string}
     */
    get checkboxSewZone() {
        return this.$t( 'phrases.Sew zone' );
    }

    /**
     * Заголовок Поиск объектов
     * @property checkboxSearchObjects {string}
     */
    get checkboxSearchObjects() {
        return this.$t( 'phrases.Object search' );
    }

    /**
     * Имя буферной зоны
     * @property {string}
     */
    get bufferZoneName() {
        return this.bufferZoneNameVal;
    }

    /**
     * Установить Имя буферной зоны
     * @param value {string}
     */
    set bufferZoneName( value: string ) {
        this.setState( UPDATE_BUFFER_ZONE_NAME, value );
    }

    /**
     * Подсказка для кнопки Построить
     * @property {string}
     */
    get buildName() {
        return this.$t( 'phrases.Build' );
    }

    /**    Заголовок кнопки Построить
     *
     */
    get titleButtonBuild() {
        return this.$t( 'phrases.Build' );
    }

    /**
     * Выполнить построение зоны
     * @method startBuilderZone
     */
    startBuilderZone() {
        // проверяется ввод данных
        this.validateForm = this.validateField();
        if ( this.validateForm ) {
            this.setState( CREATE_BUFFER_ZONE, '' );
        }
    }

    /**
     * Проверить введенные данные
     * @method validateField
     */
    validateField() {
        if ( this.radiusValue.includes( '.' ) || this.radiusValue.includes( ',' ) ) {
            this.mapVue.addSnackBarMessage( i18n.tc('phrases.You can only enter an integer number in the zone radius field') +'.');
            let newRadius = +this.radiusValue;
            if ( this.units === 'km' ) {
                this.setState(UPDATE_UNITS, 'm');
                newRadius = newRadius * 1000;
            }
            newRadius = Math.round( newRadius );
            if ( newRadius <= 0 ) {
                return false;
            } else {
                this.radiusValue = newRadius + '';
            }

        }
        return this.$refs.radiusForm.validate();
    }

    /**
     * Обработчик изменения флага Вокруг всех выбранных
     * @method changeCheckAroundAll
     */
    changeCheckAroundAll() {
        this.setState( UPDATE_CHECK_AROUND_ALL, this.checkAroundAll );
        this.disableSewZone = this.checkAroundAll;
    }

    /**
     * Обработчик изменения флага Сшивать зоны
     * @method changeCheckAroundAll
     */
    changeCheckSewZone() {
        this.setState( UPDATE_SEW_ZONE_CHECK, this.checkSewZone );
    }

    /**
     * Обработчик изменения флага Поиск объектов
     * @method changeCheckSearchObjects
     */
    changeCheckSearchObjects() {
        this.setState( UPDATE_SEARCH_OBJECTS_CHECK, !this.checkSearchObjects );
    }

    /**
     * Закрыли оверлей
     */
    closeOverlay() {
        this.setState( UPDATE_SEARCH_PROGRESS_BAR, false );
        this.setState( ABORT_SEARCH, undefined );
    }

    toggleSelectAction() {
        this.setState(UPDATE_SELECT_ACTION_ACTIVE, undefined);
    }

}
