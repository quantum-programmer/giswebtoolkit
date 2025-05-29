import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkIconButton extends Vue {

    @Prop( { default: '' } )
    private readonly backgroundColor!: string;

    @Prop( { default: 'close-icon' } )
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
    private readonly clean!: boolean | '';

    @Prop( { default: false } )
    private readonly selected!: boolean | '';

    @Prop( { default: false } )
    private readonly disabled!: boolean | '';


    private get currentClass(): string {
        let result;
        if ( this.primary !== false ) {
            result = 'gwtk-primary';
        } else if ( this.secondary !== false ) {
            result = 'gwtk-secondary';
        } else if ( this.clean !== false ) {
            result = 'gwtk-clean';
        } else {
            result = 'gwtk-empty';
        }

        return result;
    }

}
