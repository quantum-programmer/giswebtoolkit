import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkColorEditor extends Vue {

    @Prop( { default: 'black' } )
    private readonly value!: string;

    @Prop( { default: false } )
    private readonly hasLabel!: boolean;

    private handleInput( { hex }: { hex: string; } ) {
        this.$emit( 'input', hex );
    }

}