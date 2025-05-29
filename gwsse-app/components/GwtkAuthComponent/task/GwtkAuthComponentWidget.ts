/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Пример виджета компонента                     *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    DO_AUTH_LOGIN,
    DO_AUTH_LOGOUT,
    DO_AUTH_STATUS,
    DO_AUTH_REGISTER,
    DO_AUTH_RECOVER,
    DO_AUTH_RECOVERCODE,
    DO_AUTH_NEWPASSWORD,
    GwtkAuthComponentState
} from './GwtkAuthComponentTask';
import i18n from '@/plugins/i18n';

/**
 * Виджет компонента
 * @class GwtkAuthComponentWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkAuthComponentWidget extends BaseGwtkVueComponent {

    @Prop( {
        default: ''
    } )
    private readonly taskId!: string;

    @Prop( {
        default: ''
    } )
    private readonly actionId!: string;

    //@Prop( {
    //    default: () => ({ active: true, enabled: true, options: { title: 'Default title' } })
    //} )
    //private description!: ButtonDescription;

    // @Prop( {
    //     default: () => ({})
    // } )
    // private readonly dataSource!: GwtkAuthComponentTaskDataSource;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkAuthComponentState>( key: K, value: GwtkAuthComponentState[K] ) => void;

    created() {
        this.isAuthorized();
    }

    /**
     * Пользователь авторизован
     * @property isLogged {boolean}
     */
    private isLogged = false;

    /**
     * Имя пользователя
     * @property username {string}
     */
    private username = '';

    /**
     * Пароль пользователя
     * @property password {string}
     */
    private password = '';

    /**
     * Пароль пользователя
     * @property passwordNew {string}
     */
    private passwordNew = '';

    /**
     * Пароль пользователя
     * @property passwordRepeat {string}
     */
    private passwordRepeat = '';

    /**
     * Почтовый ящик пользователя
     * @property emailRegistration {string}
     */
    private emailRegistration = '';

    /**
     * Почтовый ящик пользователя
     * @property emailRecover {string}
     */
    private emailRecover = '';

    /**
     * Код восстановления пароля
     * @private
     */
    private codeRecover = '';

    /**
     * Регистрация пользователя
     * @property isRegister {boolean}
     */
    private isRegister = false;

    /**
     * Восстановление пароля пользователя
     * @property isRecoverEmailInputForm {boolean}
     */
    private isRecoverEmailInputForm = false;

    /**
     * Вход пользователя
     * @property isLogin {boolean}
     */
    private isLogin = true;

    private showPassword = false;
    private showPasswordNew = false;
    private showPasswordRepeat = false;

    /**
     * Показать форму ввода кода восстановления
     * @private
     */
    private isRecoverCodeInputForm = false;

    /**
     * Показать форму ввода нового пароля
     * @private
     */
    private isPasswordNewInputForm = false;

    /**
     * Показать форму успешного изменения пароля
     * @private
     */
    private isPasswordChangedSuccessForm = false;

    required( value: string ) {
        return !!value;
    }

    /**
     * Выход пользователя
     * @method userLogout
     */
    userLogout() {
        this.setState( DO_AUTH_LOGOUT, true );
    }

    /**
     * Вход пользователя
     * @method userLogin
     */
    userLogin() {
        this.setState( DO_AUTH_LOGIN, { login: this.username, password: this.password } );
    }

    /**
     * Перейти на форму Восстановления пароля
     * @method gotoForgotForm
     */
    gotoForgotForm() {
        this.isLogin = false;
        this.emailRecover = this.username;
        this.isRecoverCodeInputForm = false;
        this.isRecoverEmailInputForm = true;
    }

    /**
     * Перейти на форму Страницу входа
     * @method gotoLoginForm
     */
    gotoLoginForm() {
        this.isRegister = false;
        this.isRecoverEmailInputForm = false;
        this.isRecoverCodeInputForm = false;
        this.isPasswordNewInputForm = false;
        this.isPasswordChangedSuccessForm = false;
        this.isLogin = true;

        this.username = this.emailRegistration || this.emailRecover;
        this.emailRegistration = '';
        this.emailRecover = '';
        this.password = '';
        this.passwordNew = '';
        this.passwordRepeat = '';
    }

    /**
     * Создать учетную запись
     * @method createAccount
     */
    createAccount() {
        this.isLogin = false;
        this.emailRegistration = this.username;
        this.isRegister = true;
    }

    /**
     * Отправить ссылку на восстановление учетной записи
     * @async
     * @method sendEmailForRecover
     */
    async sendEmailForRecover() {
        this.setState( DO_AUTH_RECOVER, this.emailRecover );
    }

    /**
     * Отправить код восстановления учетной записи
     * @async
     * @method sendEmailForRecover
     */
    private async sendCode() {
        this.setState( DO_AUTH_RECOVERCODE, { email: this.emailRecover, code: this.codeRecover } );
    }

    /**
     * Отправить новый пароль
     * @async
     * @method sendPasswordNew
     */
    private async sendPasswordNew() {
        this.setState( DO_AUTH_NEWPASSWORD, { code: this.codeRecover, email: this.emailRecover, password: this.passwordNew, passwordrepeat: this.passwordRepeat } );
    }

    /**
     * Регистрация пользователя
     * @async
     * @method doRegister
     */
    async doRegister() {
        this.setState( DO_AUTH_REGISTER, { login: this.emailRegistration, email: this.emailRegistration, passwordnew: this.passwordNew, passwordrepeat: this.passwordRepeat } );
    }

    // TODO В далнейшем это функция должно вызиватся при старте приложения,
    //  и информация о авторизованном пользователе должно быть глобалным
    /**
     * Получить состаяние авторизации из сеанса
     * @async
     * @method isAuthorized
     */
    async isAuthorized() {
        this.setState( DO_AUTH_STATUS, true );
    }

    protected get helpPageExists(): boolean {
        return this.mapVue.getTaskManager().checkHelpPage(this.taskId);
    }

    protected get title(): string {
        const componentName = this.mapVue.getTaskManager().getTaskDescription(this.taskId).options.title + '';
        return i18n.tc(componentName);
    }

    /**
     * Обработчик клика
     * @method onClick
     */
    onClick() {
        this.mapVue.getTaskManager().toggleTaskOrAction(this.taskId, this.actionId);
    }

    /**
     * Открыть страницу справки
     * @method openHelp
     */
    openHelp() {
        this.mapVue.getTaskManager().callHelp(this.taskId);
    }

    /**
     * Проверить email
     * @async
     * @method validEmail
     */
    validEmail( email: string ) {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test( email );
    }
}
