import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkMenu extends Vue {

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: '' } )
    private readonly icon!: string;

    @Prop( { default: false } )
    private readonly widthAvailable!: boolean | '';

    @Prop( { default: false } )
    private readonly isDropdown!: boolean | '';

    @Prop( { default: false } )
    private readonly disabled!: boolean | '';

    @Prop( { default: 20 } )
    private readonly iconSize!: number;

    @Prop( { default: 'var(--color-white)' } )
    private readonly iconColor!: string;

    @Prop( {
        default: 'primary',
        validator( value: string ) {
            return ['primary', 'secondary', 'clean'].includes( value );
        }
    } )
    private readonly theme!: string;

    private get isInnerTrigger(): boolean {
        return !!(this.title || this.icon);
    }
}