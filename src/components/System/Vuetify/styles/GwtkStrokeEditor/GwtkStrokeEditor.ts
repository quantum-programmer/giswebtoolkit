import { Component, Vue, Prop } from 'vue-property-decorator';

type Item = {
    color?: string;
    width?: string;
    opacity?: number;
    dasharray?: string;
}


@Component
export default class GwtkStrokeEditor extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly item!: Item;

    @Prop( { default: false } )
    private readonly disabled!: boolean | '';

    @Prop( { default: false } )
    private readonly removable!: boolean | '';

    @Prop( {
        default: () => {
        }
    } )
    private readonly updateItem!: ( value: Item ) => void;

    private color = this.item.color;
    private width = parseFloat( this.item.width || '' ) || 1;
    private dasharray = this.item.dasharray || '';
    private opacity = this.item.opacity !== undefined ? this.item.opacity * 100 : 100;
    private enabledFlag = this.disabled === false;


    mounted() {
        this.$nextTick( function () {
            this.updateValue();
        } );
    }

    private updateColor( value: string ) {
        this.color = value;
        this.updateValue();
    }

    private updateOpacity( value: string ) {
        const parseValue = Math.abs( parseInt( value ) || 0 );
        this.opacity = Math.min( parseValue, 100 );
        this.updateValue();
    }

    private updateWidth( value: string ) {
        this.width = +value;
        this.updateValue();
    }

    private updateDasharray( value: string ) {
        const dasharrayNew = value.split( ' ' );
        const dasharrayNewFiltered = dasharrayNew.filter( currentValue => /^\s*\d+\s*$/.test( currentValue ) );
        this.dasharray = dasharrayNewFiltered.join( ' ' );
        this.updateValue();
    }

    private updateValue() {
        if ( !this.enabledFlag ) {
            this.updateItem( {} );
        } else {
            this.updateItem( {
                color: this.color,
                width: this.width + 'px',
                opacity: this.opacity / 100,
                dasharray: this.dasharray
            } );
        }
    }
}