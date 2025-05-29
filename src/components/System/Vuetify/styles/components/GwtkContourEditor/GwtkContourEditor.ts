import { Component, Vue, Prop } from 'vue-property-decorator';


type Item = {
    color?: string;
    width?: string;
}

@Component
export default class GwtkContourEditor extends Vue {

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


    private color = this.item.color || 'grey';
    private width = parseFloat( this.item.width || '' ) || 1;
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

    private updateWidth( value: string ) {
        this.width = +value;
        this.updateValue();
    }

    private updateValue() {
        if ( !this.enabledFlag ) {
            this.updateItem( {} );
        } else {
            this.updateItem( {
                color: this.color,
                width: this.width + 'px'
            } );
        }
    }

}