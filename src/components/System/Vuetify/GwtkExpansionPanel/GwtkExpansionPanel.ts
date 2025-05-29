import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkExpansionPanel extends Vue {

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: '' } )
    private readonly extraHeadData!: string;

    @Prop( { default: '' } )
    private readonly icon!: string;

    @Prop( { default: '$expand' } )
    private readonly expandIcon!: string;

    @Prop( { default: '' } )
    private readonly activeClass!: string;

    @Prop( { default: 'auto' } )
    private readonly maxContentHeight!: string;

    @Prop( { default: false } )
    private readonly hideActions!: boolean | '';

    @Prop( { default: false } )
    private readonly hideContent!: boolean | '';

    @Prop( {
        default: 'primary',
        validator( value: string ) {
            return ['primary', 'clean'].includes( value );
        }
    } )
    private readonly theme!: string;

    get themeClass() {
        return `gwtk-expansion-panel-theme-${this.theme}`;
    }

    get headSlot() {
        return this.$slots[ 'expansion-panel-header' ];
    }
}