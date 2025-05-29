import { Component, Vue, Prop } from 'vue-property-decorator';


type Item = {
    color?: string;
    font?: string;
    contour?: string;
    shadow?: string;
}

@Component
export default class GwtkTextStyleEditor extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly item!: Item;

    @Prop( {
        default: () => {
        }
    } )
    private readonly updateItem!: ( value: Item ) => void;


    private color = this.item.color;
    private font = this.item.font;
    private contour = this.item.contour;
    private shadow = this.item.shadow;

    private updateColor( value: string ) {
        this.color = value;
        this.updateValue();
    }

    private updateFont( value: string ) {
        this.font = value;
        this.updateValue();
    }

    private updateContour( value: string ) {
        this.contour = value;
        this.updateValue();
    }

    private updateShadow( value: string ) {
        this.shadow = value;
        this.updateValue();
    }

    private updateValue() {
        this.updateItem( {
            color: this.color,
            font: this.font,
            contour: this.contour,
            shadow: this.shadow
        } );
    }
}