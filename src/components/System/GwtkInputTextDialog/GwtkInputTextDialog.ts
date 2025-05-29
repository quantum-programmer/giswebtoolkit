import { Component } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { InputTextDialogProps } from '~/MapWindow';

@Component
export default class GwtkInputTextDialog extends BaseGwtkVueComponent {

    private get showDialog() {
        return this.resolve !== null && this.reject !== null;
    }

    private set showDialog( value: boolean ) {
        if ( !value ) {
            this.onCancel();
        }
    }

    /**
     * Стандартный текст сообщения
     * @private
     * @readonly
     * @property DEFAULT_MESSAGE {string}
     */
    get defaultInputText(): string {
        return '';
    }

    /**
     * Название окна
     * @property title {string}
     */
    private title = '';

    /**
     * Текст ввода
     * @property inputText {string}
     */
    private inputText = '';

    private get applyText() {
        return this.$t( 'phrases.Execute' );
    }

    private get cancelText() {
        return this.$t( 'phrases.Cancel' );
    }

    titleText = '';

    created() {
        this.titleText = this.$t('phrases.Confirm action').toString();
    }

    
    /**
     * Описание
     * @property description {string}
     */
    private description = '';

    private resolve: null | (( value: string ) => void) = null;
    private reject: null | (() => void) = null;

    setInputTextDialogParams( inputTextParams: InputTextDialogProps ): Promise<string> {
        if ( this.reject ) {
            this.reject();
        }
        return new Promise<string>( ( resolve, reject ) => {
            this.resolve = resolve;
            this.reject = reject;

            if ( inputTextParams.title !== undefined || inputTextParams.inputText !== undefined ) {
                this.title = inputTextParams.title || this.$t( 'phrases.Name' ) as string;
                this.inputText = inputTextParams.inputText || this.defaultInputText;
            } else {
                this.title = '';
                this.inputText = '';
            }

            this.description = inputTextParams.description ? inputTextParams.description : '';

            this.titleText = inputTextParams.titleText ? inputTextParams.titleText : this.$t('phrases.Confirm action').toString();

        } );
    }

    private onApply() {
        if ( this.resolve ) {
            this.resolve( this.inputText );
        }
        this.clear();
    }

    private onCancel() {
        if ( this.reject ) {
            this.reject();
        }
        this.clear();
    }

    private clear() {
        this.resolve = null;
        this.reject = null;
    }
}