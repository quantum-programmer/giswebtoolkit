import { Component, Vue, Prop } from 'vue-property-decorator';

type Item = {
    color?: string;
    opacity?: number;
    width?: string;
    step?: string;
    angle?: number;
}


@Component
export default class GwtkHatchEditor extends Vue {

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
    private opacity = this.item.opacity !== undefined ? this.item.opacity * 100 : 100;
    private enabledFlag = this.disabled === false;

    private width = parseFloat( this.item.width || '' ) || 1;
    private step = parseFloat( this.item.step || '' ) || 7;
    private angle = this.item.angle || 45;


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

    private updateStep( value: string ) {
        this.step = +value;
        this.updateValue();
    }

    private updateAngle( value: string ) {
        this.angle = Math.abs( parseFloat( value ) || 0 );
        this.updateValue();
    }

    private updateValue() {
        if ( !this.enabledFlag ) {
            this.updateItem( {} );
        } else {
            this.updateItem( {
                color: this.color,
                width: this.width + 'px',
                step: this.step + 'px',
                angle: this.angle,
                opacity: this.opacity / 100
            } );
        }
    }


}