import { Component, Vue, Prop } from 'vue-property-decorator';


const FONT_NAMES = [
    'Verdana',
    'Times New Roman',
    'Georgia',
    'Arial',
    'Courier New',
    'Lucida Console',
    'Tahoma'
];

type Item = {
    family: string;
    size?: string;
    style?: string;
    weight?: string;
}

@Component
export default class GwtkFontEditor extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly item!: Item;

    @Prop( {
        default: () => {
        }
    } )
    private readonly updateItem!: ( value: Item ) => void;

    @Prop( { default: () => FONT_NAMES } )
    private readonly fontList!: string[];

    private family = this.item.family;
    private size = parseFloat( this.item.size || '' ) || 1;
    private italic = this.item.style === 'italic';
    private bold = this.item.weight === 'bold';


    created() {
        if ( !FONT_NAMES.includes( this.item.family ) ) {
            FONT_NAMES.push( this.item.family );
        }
    }

    private updateFontFamily( value: string ) {
        this.family = value;
        this.updateValue();
    }

    private updateSize( value: string ) {
        this.size = +value;
        this.updateValue();
    }

    private toggleItalic() {
        this.italic = !this.italic;
        this.updateValue();
    }

    private toggleBold() {
        this.bold = !this.bold;
        this.updateValue();
    }

    private updateValue() {
        this.updateItem( {
            family: this.family,
            style: this.italic ? 'italic' : 'normal',
            weight: this.bold ? 'bold' : 'normal',
            size: this.size + 'px'
        } );
    }

}