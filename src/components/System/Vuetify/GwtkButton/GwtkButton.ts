import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkButton extends Vue {

    @Prop( {
        default: 'center',
        validator( value: string ) {
            return ['left', 'center', 'right'].includes( value );
        }
    } )
    private readonly alignContent!: string;

    @Prop( { default: false } )
    private readonly clean!: boolean | '';

    @Prop( { default: '' } )
    private readonly icon!: string;

    @Prop( { default: '' } )
    private readonly iconColor!: string;

    @Prop( { default: 24 } )
    private readonly iconSize!: number;

    @Prop( { default: false } )
    private readonly primary!: boolean | '';

    @Prop( { default: false } )
    private readonly secondary!: boolean | '';

    @Prop( { default: false } )
    private readonly selected!: boolean | '';

    @Prop( { default: false } )
    private readonly disabled!: boolean | '';

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: false } )
    private readonly widthAvailable!: boolean;

    private get currentClass() {
        if ( this.primary !== false ) {
            return 'gwtk-primary';
        }
        if ( this.secondary !== false ) {
            return 'gwtk-secondary';
        }
        if ( this.clean !== false ) {
            return 'gwtk-clean';
        }

        return 'gwtk-empty';
    }
}