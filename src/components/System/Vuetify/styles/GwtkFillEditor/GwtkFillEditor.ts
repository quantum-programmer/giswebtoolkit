import { Component, Vue, Prop } from 'vue-property-decorator';

type Item = {
    color?: string;
    opacity?: number;
}

@Component
export default class GwtkFillEditor extends Vue {

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

    private updateValue() {
        if ( !this.enabledFlag ) {
            this.updateItem( {} );
        } else {
            this.updateItem( {
                color: this.color,
                opacity: this.opacity / 100
            } );
        }
    }

}