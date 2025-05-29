import {Component, Vue} from 'vue-property-decorator';
import {Message} from '@/components/System/Vuetify/GwtkSnackBar/GwtkSnackBar';
import Utils from '~/services/Utils';
import {LogEventType} from '~/types/CommonTypes';

@Component
export default class GwtkMapSnackBar extends Vue {

    private readonly timeoutDefault = 2000;

    private timeout: number = this.timeoutDefault;

    private timeoutForQueue: number = this.timeoutDefault;

    private readonly messages: Message[] = [];

    private readonly errorMessagesQueue: string[] = [];

    private commitErrorMessage = Utils.debounce(() => {
        const errorCount = this.errorMessagesQueue.length;
        if (errorCount === 0) {
            return;
        }

        const text = this.errorMessagesQueue[0];// вывод текста от первого сообщения

        this.addTimeOut(this.timeoutForQueue);

        this.messages.push({text, snackbar: true, data: {errorCount}});

        this.errorMessagesQueue.splice(0);
        this.timeoutForQueue = this.timeoutDefault;

    }, 200);

    /**
     * Добавить всплывающее сообщение
     * @method addMessage
     * @param text {string} Текст сообщения
     * @param [params] {object} Параметры сообщения
     */
    addMessage(text: string, params?: { timeout?: number; type?: LogEventType; }): void {

        if (params?.timeout) {
            this.addTimeOut(params.timeout);
        }

        if (params && params.type === LogEventType.Error) {
            this.errorMessagesQueue.push(text);

            if (this.timeout > this.timeoutForQueue) {
                this.timeoutForQueue = this.timeout;
            }

            this.commitErrorMessage();
        } else {
            this.messages.push({text, snackbar: true});
        }
    }

    /**
     * Добавить задержку времени к всплывающему сообщению
     * @method addTimeOut
     * @param delay {number} Задержка в мс
     */
    addTimeOut(delay: number): void {
        this.timeout = delay;
    }

    private onClose(index: number): void {
        this.messages[index].snackbar = false;
        this.$nextTick(() => this.clean());
    }

    private clean(): void {
        let flag = true;
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].snackbar) {
                flag = false;
            }
        }

        if (flag) {
            this.messages.splice(0);
            this.errorMessagesQueue.splice(0);

            this.timeout = this.timeoutDefault;
            this.timeoutForQueue = this.timeoutDefault;
        }
    }
}
