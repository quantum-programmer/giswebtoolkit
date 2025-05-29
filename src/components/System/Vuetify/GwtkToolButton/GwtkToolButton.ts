import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkToolButton extends Vue {

    @Prop( { default: false } )
    private readonly secondary!: boolean | '';

    @Prop( { required: true } )
    private readonly icon!: string;

    @Prop( { default: false } )
    iconButton!: boolean;

    @Prop( { default: 24 } )
    private readonly iconSize!: number;

    @Prop( { default: '' } )
    private readonly tooltipText!: string;

    @Prop( { default: false } )
    private readonly selected!: boolean;

    @Prop( { default: false } )
    private readonly disabled!: boolean;

    @Prop( { default: false } )
    private readonly listItem!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly linkObject!: { href: string; target?: string; };

    @Prop( { default: false } )
    private readonly withoutTooltip!: boolean;

    @Prop( {
        default: 'bottom',
        validator( value: string ) {
            return ['top', 'bottom', 'left', 'right'].includes( value );
        }
    } )
    private readonly position!: string;

}
