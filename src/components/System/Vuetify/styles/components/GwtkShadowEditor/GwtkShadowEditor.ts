import { Component, Vue, Prop } from 'vue-property-decorator';

type Item = {
    color?: string;
    offset?: {
        x?: number;
        y: number;
    };
}

@Component
export default class GwtkShadowEditor extends Vue {

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
    private offset = { x: 1, y: 1, ...this.item.offset };
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

    private updateOffsetX( value: string ) {
        this.offset.x = Math.max( -100, Math.min( parseInt( value ), 100 ) );
        this.updateValue();
    }

    private updateOffsetY( value: string ) {
        this.offset.y = Math.max( -100, Math.min( parseInt( value ), 100 ) );
        this.updateValue();
    }

    private updateValue() {
        if ( !this.enabledFlag ) {
            this.updateItem( {} );
        } else {
            this.updateItem( {
                color: this.color,
                offset: this.offset
            } );
        }
    }

}