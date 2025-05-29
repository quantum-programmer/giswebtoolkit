import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkDegreesMinutesSeconds extends Vue {

    @Prop( { default: 'angle' } )
    private readonly coordinateType!: string;

    @Prop( { default: '' } )
    private readonly coordinateValue!: string;

    @Prop( { default: false } )
    private readonly decimalDegrees!: boolean;

    @Prop( { default: '' } )
    private readonly id!: string;

    @Prop( { default: '' } )
    private readonly inputClass!: string;

    @Prop( { default: false } )
    private readonly readOnly!: boolean;

    private isError = false;

    private readonly minutesRule = [( v: string ) => {
        const d = Number( v );
        return !isNaN( d ) && d < 60;
    }];

    private get degreesMinutesSecondsList(): string[] {
        let result: string[] = [];
        if ( this.coordinateValue.length === 0 ) {
            return result;
        }
        const regex = /(-?\d+)°\s?(\d+)'\s?(\d+\.?\d+?)"/;
        let matches;
        if ( (matches = regex.exec( this.coordinateValue )) !== null ) {
            matches.forEach( ( match, index ) => {
                if ( index !== 0 ) {
                    result.push( parseFloat( match ).toString() );
                }
            } );
        } else {
            let deg = parseInt( this.coordinateValue, 10 );
            const minus = deg < 0 ? -1 : 1;
            deg = Math.abs( deg );
            let sec = (Math.abs( +this.coordinateValue ) - deg) * 3600;
            let min = parseInt( '' + sec / 60 );
            sec -= min * 60;
            if ( sec < 0 ) {
                sec = 0;
            } else if ( sec >= 60 ) {
                min++;
                sec -= 60;
            }
            result.push( (deg * minus).toString() );
            result.push( min.toString() );
            result.push( sec.toFixed( 2 ) );
        }

        return result;
    }

    private handleInput( value: { id: string; type: string; value: string; } ): void {
        this.$emit( 'input', value );
    }

    private maxValue(): number {
        const ratio = this.coordinateType === 'angle' ? 2 : 1;
        return (this.coordinateType === 'lat' ? 90 : (180 * ratio));
    }

    private minValue(): number {
        const ratio = this.coordinateType === 'angle' ? 2 : 1;
        return (this.coordinateType === 'lat' ? -90 : (-180 * ratio));
    }

    private getValidValue( value: number, maxValue: number, minValue: number ): number {
        return Math.min( Math.max( value, minValue ), maxValue );
    }

    private testDegrees( v: string, maxValue: number, minValue: number ): boolean {
        const d = Number( v );
        this.isError = !(!isNaN( d ) && d >= minValue && d <= maxValue);
        return !this.isError;
    }

    private setCoordinateNewValue(): void {
        let coordinateText: string;
        if ( !this.decimalDegrees ) {
            coordinateText = this.degreesMinutesSecondsList[ 0 ] + '° ' +
                this.degreesMinutesSecondsList[ 1 ] + '\' ' +
                this.degreesMinutesSecondsList[ 2 ] + '"';
        } else {
            const minus = +this.degreesMinutesSecondsList[ 0 ] < 0 ? -1 : 1;
            const coordinateValue = minus * (Math.abs( +this.degreesMinutesSecondsList[ 0 ] ) * 3600 +
                (+this.degreesMinutesSecondsList[ 1 ] * 60) +
                (+this.degreesMinutesSecondsList[ 2 ])) / 3600;
            coordinateText = '' + coordinateValue;
        }

        this.handleInput( { id: this.id, type: this.coordinateType, value: coordinateText } );
    }

    private setSecondsValue( value: string ): void {
        let textValue = value.trim();
        let maxValue = 59.99;
        this.degreesMinutesSecondsList.splice( 2, 1, textValue );
        if ( this.isError ) {
            return;
        }
        const degrees = Math.abs( parseFloat( this.degreesMinutesSecondsList[ 0 ] ) );
        if ( this.maxValue() === degrees ) {
            textValue = '0';
            maxValue = 0;
            this.isError = true;
        }
        let numberValue = this.getValidValue( +textValue, maxValue, 0 );
        if ( +textValue === numberValue ) {
            this.degreesMinutesSecondsList.splice( 2, 1, '' + numberValue );
            this.setCoordinateNewValue();
        }
    }

    private setMinutesValue( value: string ): void {
        let textValue = value;
        this.degreesMinutesSecondsList.splice( 1, 1, textValue );
        let maxMinutes = 59;
        const degrees = Math.abs( parseFloat( this.degreesMinutesSecondsList[ 0 ] ) );
        if ( this.maxValue() === degrees && +textValue !== 0 ) {
            this.isError = true;
            return;
        }

        let numberValue = this.getValidValue( +textValue, maxMinutes, 0 );
        if ( +textValue === numberValue ) {
            this.degreesMinutesSecondsList.splice( 1, 1, '' + numberValue );
            this.setCoordinateNewValue();
        }
    }

    private setDegreesValue( value: string ): void {
        const maxLength = value[ 0 ] === '-' ? 4 : 3;
        let textValue = value.substr( 0, maxLength );
        if (textValue === '') {
            textValue = '0';
        }
        const maxValue = this.maxValue();
        const minValue = this.minValue();
        if ( !this.testDegrees( textValue, maxValue, minValue ) ) {
            return;
        }
        let numberValue = this.getValidValue( +textValue, maxValue, minValue );
        if ( numberValue === maxValue || numberValue === minValue ) {
            this.degreesMinutesSecondsList[ 1 ] = '0';
            this.degreesMinutesSecondsList[ 2 ] = '0';
        }
        if ( +textValue === numberValue ) {
            this.degreesMinutesSecondsList.splice( 0, 1, textValue );
            this.setCoordinateNewValue();
        }
    }

}