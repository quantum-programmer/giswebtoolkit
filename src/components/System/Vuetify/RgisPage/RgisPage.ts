import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class RgisPage extends Vue {

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: 'var(--color-white)' } )
    private readonly color!: string;

}