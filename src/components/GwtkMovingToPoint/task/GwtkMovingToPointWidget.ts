/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                      "Перемещение в точку"                       *
 *                                                                  *
 *******************************************************************/


import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { ContainsSomeOf } from '~/types/CommonTypes';
import { ActionDescription } from '~/taskmanager/Task';
import Trigonometry from '~/geo/Trigonometry';
import GeoPoint from '~/geo/GeoPoint';
import {
    COPY_COORDINATE,
    GwtkMovingToPointTaskState,
    MOVING_TO_POINT,
    MOVING_TO_POINT_PLANE,
    SELECT_POINT_ACTION,
    SET_LATITUDE_COORDINATE,
    SET_LONGITUDE_COORDINATE,
    SET_X_PLANE,
    SET_Y_PLANE,
    SET_MOVE_TO_POINT_ACTIVE,
    SET_SELECT_POINT_ACTIVE
} from '@/components/GwtkMovingToPoint/task/GwtkMovingToPointTask';
import { CursorCoordinateUnit, UnitText } from '~/utils/WorkspaceManager';
import { MapPoint } from '~/geometry/MapPoint';
import { DegreesMinutesSecondsFieldColor } from '@/components/GwtkMovingToPoint/task/Types';


type DegreesMinutesSecondsData = {
    id: string,
    type: string,
    value: string
};

/**
 * Виджет компонента
 * @class GwtkMovingToPointWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMovingToPointWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMovingToPointTaskState>( key: K, value: GwtkMovingToPointTaskState[K] ) => void;

    @Prop( { default: '' } )
    private readonly actionId!: string;

    @Prop( { default: false } )
    private readonly moveToPointActive!: boolean;

    @Prop( { default: false } )
    private readonly selectPointActive!: boolean;

    @Prop( { default: '' } )
    private readonly coordinateLatitude!: string;

    @Prop( { default: '' } )
    private readonly coordinateLongitude!: string;

    @Prop( { default: '' } )
    private readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop( { default: '' } )
    private readonly coordinateX!: string;

    @Prop( { default: '' } )
    private readonly coordinateY!: string;

    /**
     * Вручную созданная реактивная переменная (состояние обработчика)
     * @property pickPointAction {ContainsSomeOf<ActionDescription>}
     */
    private pickPointAction: ContainsSomeOf<ActionDescription> = { active: false, enabled: true };

    private checkCanCopy: boolean = !window.isSecureContext;

    get latitudeTitle(): string {
        if ( this.isMeters ) {
            return 'X';
        }
        return this.$t( 'phrases.Latitude' ) as string;
    }

    get longitudeTitle(): string {
        if ( this.isMeters ) {
            return 'Y';
        }
        return this.$t( 'phrases.Longitude' ) as string;
    }

    get unitTitle() {
        let result = '';
        if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees ) {
            result = ',°';
        }
        if ( this.coordinateDisplayFormat === CursorCoordinateUnit.Radians ) {
            result = ',' + this.$t( 'phrases.rad' );
        }

        return result + ':';
    }

    /**
     * Вставить из буфера обмена Широту и Долготу в соответствующие поля
     * @param e
     */
    clipboardPasteCoordinate( e: ClipboardEvent ): void {

        let coordX, coordY: string = '';
        let clipboardData = e.clipboardData;
        if ( clipboardData && this.moveToPointActive ) {
            let text = clipboardData.getData( 'Text' );
            if ( this.isDegrees ) {
                if ( text.indexOf( ' ' ) > 0 ) {
                    e.stopPropagation();
                    e.preventDefault();
                    coordX = text.slice( 0, text.indexOf( ' ' ) );
                    coordY = text.slice( text.indexOf( ' ' ) + 1 );
                    if ( coordX !== undefined && coordY !== undefined ) {
                        this.latitude = coordX;
                        this.longitude = coordY;
                    }
                }
                if ( text.indexOf( ', ' ) > 0 ) {
                    e.stopPropagation();
                    e.preventDefault();
                    coordX = text.slice( 0, text.indexOf( ', ' ) );
                    coordY = text.slice( text.indexOf( ', ' ) + 2 );
                    if ( coordX !== undefined && coordY !== undefined ) {
                        this.latitude = coordX;
                        this.longitude = coordY;
                    }
                }
            }
            if ( this.isDegreesMinutesSeconds ) {
                const input: HTMLInputElement = e.target as HTMLInputElement;
                const maxValue = parseFloat( input.max );
                const minValue = parseFloat( input.min );
                const stepValue = parseFloat( input.step );

                let newValue = 0;
                if ( stepValue < 1 ) {
                    newValue = this.parseToFloat( text );
                } else {
                    newValue = this.parseToInt( text );
                }

                if ( newValue > maxValue )
                    newValue = maxValue;

                if ( newValue < minValue )
                    newValue = minValue;

                // Изменить значения в поле
                document.addEventListener( 'copy', function ( e ) {
                    if ( e.clipboardData ) {
                        e.clipboardData.setData( 'text/plain', String( newValue ) );
                        e.stopPropagation();
                        e.preventDefault();
                    }
                } );
                input.value = '';
                document.execCommand( 'copy' );

            }
            if ( this.isMeters ) {
                let separator = undefined;
                if ( text.indexOf( ' ' ) > 0 ) {
                    separator = ' ';
                } else if ( text.indexOf( ', ' ) > 0 ) {
                    separator = ', ';
                }
                if ( separator ) {
                    e.stopPropagation();
                    e.preventDefault();
                    [coordX, coordY] = text.split( separator );
                    if ( !isNaN( parseFloat( coordX ) ) && !isNaN( parseFloat( coordY ) ) ) {
                        this.XPlane = coordX;
                        this.YPlane = coordY;
                    }
                }
            }
        }
    }

    get latitude(): string {
        return this.coordinateLatitude;
    }

    set latitude( value: string ) {
        this.setState( SET_LATITUDE_COORDINATE, value );
    }

    get longitude(): string {
        return this.coordinateLongitude;
    }

    set longitude( value: string ) {
        this.setState( SET_LONGITUDE_COORDINATE, value );
    }

    get XPlane() {
        return this.coordinateX;
    }

    set XPlane( value: string ) {
        this.setState( SET_X_PLANE, value );
    }

    get YPlane() {
        return this.coordinateY;
    }

    set YPlane( value: string ) {
        this.setState( SET_Y_PLANE, value );
    }

    get meterSuffix() {
        return this.$t('phrases.' + UnitText.MTR);
    }

    get toolTipCopy(): string {
        return this.$t( 'phrases.Copy to Clipboard' ) as string;
    }

    get toolTipMoveToPoint(): string {
        return this.$t( 'phrases.Get point coordinates' ) as string;
    }

    get toolTipCheck(): string {
        return this.$t( 'phrases.Go to' ) as string;
    }

    get toolTipClose(): string {
        return this.$t( 'phrases.Close' ) as string;
    }

    get isDegreesMinutesSeconds() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.DegreesMinutesSeconds;
    }

    get isDegrees() {
        return this.coordinateDisplayFormat === CursorCoordinateUnit.Degrees ||
            this.coordinateDisplayFormat === CursorCoordinateUnit.Radians;
    }

    get isMeters() {
        return (this.coordinateDisplayFormat === CursorCoordinateUnit.Meter) || (this.coordinateDisplayFormat === CursorCoordinateUnit.MeterSk42);
    }

    /**
     * Активировать режим ввода точки
     */
    activeMoveToPoint(): void {
        this.setState( SET_MOVE_TO_POINT_ACTIVE, true );
    }

    /**
     * Закрыть режим выбора точки
     */
    closeMoveToPoint(): void {
        this.setState( SET_MOVE_TO_POINT_ACTIVE, false );
        this.setState( SET_SELECT_POINT_ACTIVE, false );
        this.setState( SELECT_POINT_ACTION, false );
    }

    /**
     * Цвет поля ввода координат
     */
    get colorTextField(): DegreesMinutesSecondsFieldColor {
        return this.moveToPointActive ? 'white' : 'transparent';
    }

    /**
     * Копировать координаты в буфер обмена
     */
    toggleCopyToBuffer(): void {
        let copyString;
        if (this.coordinateDisplayFormat !== CursorCoordinateUnit.Meter && this.coordinateDisplayFormat !== CursorCoordinateUnit.MeterSk42 ) {
            copyString = this.coordinateLatitude + ' ' + this.coordinateLongitude;
        } else {
            copyString = this.coordinateX + ' ' + this.coordinateY;
        }
        this.setState( COPY_COORDINATE, copyString );
    }

    /**
     * Выбор точки на карте
     */
    activeSelectToPoint(): void {
        this.setState( SET_MOVE_TO_POINT_ACTIVE, false );
        this.setState( SET_SELECT_POINT_ACTIVE, true );
        this.setState( SELECT_POINT_ACTION, true );
    }

    /**
     * Переместиться в точку
     */
    movingToPointStart(): void {
        let latitude = 0, longitude = 0;
        switch ( this.coordinateDisplayFormat ) {
            case CursorCoordinateUnit.DegreesMinutesSeconds:
                let latitudeToArray: string[] = this.coordinateLatitude.split( ' ' );
                let grad = this.parseToInt( latitudeToArray[ 0 ] );
                let min = this.parseToInt( latitudeToArray[ 1 ] );
                let sec = this.parseToFloat( latitudeToArray[ 2 ] );
                latitude = GeoPoint.degreesMinutesSeconds2Degrees( grad, min, sec );
                let longitudeToArray: string[] = this.coordinateLongitude.split( ' ' );
                grad = this.parseToInt( longitudeToArray[ 0 ] );
                min = this.parseToInt( longitudeToArray[ 1 ] );
                sec = this.parseToFloat( longitudeToArray[ 2 ] );
                longitude = GeoPoint.degreesMinutesSeconds2Degrees( grad, min, sec );
                break;
            case CursorCoordinateUnit.Degrees:
                latitude = parseFloat( this.coordinateLatitude );
                longitude = parseFloat( this.coordinateLongitude );
                break;
            case CursorCoordinateUnit.Radians:
                latitude = Trigonometry.toDegrees( parseFloat( this.coordinateLatitude ) );
                longitude = Trigonometry.toDegrees( parseFloat( this.coordinateLongitude ) );
                break;
            case CursorCoordinateUnit.MeterSk42:
            case CursorCoordinateUnit.Meter:
                const mapPoint = new MapPoint(parseFloat(this.coordinateY), parseFloat(this.coordinateX), 0, this.coordinateDisplayFormat === CursorCoordinateUnit.MeterSk42 ? 'EPSG:28400' : this.mapVue.getMap().ProjectionId  );
                this.setState( MOVING_TO_POINT_PLANE, mapPoint );
                break;
        }

        if (this.coordinateDisplayFormat !== CursorCoordinateUnit.Meter && this.coordinateDisplayFormat !== CursorCoordinateUnit.MeterSk42 ) {
            this.setState( MOVING_TO_POINT, new GeoPoint( longitude, latitude ) );
        }

        this.closeMoveToPoint();
    }

    parseToInt( value: string ): number {
        return isNaN( parseInt( value, 10 ) ) ? 0 : parseInt( value, 10 );
    }

    parseToFloat( value: string ): number {
        return isNaN( parseFloat( value ) ) ? 0 : parseFloat( value );
    }


    /**
     * Ввод значений градусов
     * @property inputDegreesValue {DegreesMinutesSecondsData}
     */
    inputDegreesValue( inputDegreesValue: DegreesMinutesSecondsData ): void {
        if ( inputDegreesValue.type === 'lat' ) {
            this.setState( SET_LATITUDE_COORDINATE, inputDegreesValue.value );
        } else if ( inputDegreesValue.type === 'long' ) {
            this.setState( SET_LONGITUDE_COORDINATE, inputDegreesValue.value );
        }
    }
}
