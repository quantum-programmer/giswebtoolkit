import { Component } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { InfoDialogProps } from '~/MapWindow';

@Component
export default class GwtkInfoDialog extends BaseGwtkVueComponent {

    private dialog = false;

    /**
     * Стандартный текст сообщения
     * @private
     * @readonly
     * @property DEFAULT_MESSAGE {string}
     */
    private readonly DEFAULT_MESSAGE = '';

    /**
     * Название окна
     * @property title {string}
     */
    private title = '';

    private readonly DEFAULT_HANDLER = () => {
    };

    /**
     * Текст сообщения
     * @property message {string}
     */
    private message = this.DEFAULT_MESSAGE;

    private handleClose = this.DEFAULT_HANDLER;


    //FIXME зачем мы тут с помощью вызова метода устанавливаем параметры?
    // такие моменты мы должны передавать через PROPS а события посылать к родителю
    // data in events out
    setInfoParams( infoParams: InfoDialogProps ) {
        this.title = infoParams.title || this.$t( 'phrases.Notification' ) as string;
        this.message = infoParams.message || this.DEFAULT_MESSAGE;
        this.handleClose = infoParams.handleClose || this.DEFAULT_HANDLER;
        this.dialog = true;
    }

    onClose() {
        this.handleClose();
        this.dialog = false;
    }
}