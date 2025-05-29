import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkTaskCard extends Vue {

    @Prop( { default: 'Default task' } )
    private readonly title!: string;

    @Prop( { default: false } )
    private readonly helpPageExists!: boolean | '';

    @Prop( { default: false } )
    private readonly windowMode!: boolean | '';

    @Prop( { default: null } )
    private readonly titleBackgroundColor!: string | null;

    @Prop( { default: null } )
    private readonly titleTextColor!: string | null;

    @Prop({ default: false })
    private readonly storedData!: boolean;

    @Prop({ default: false })
    private readonly isReducedSizeInterface!: boolean;
}