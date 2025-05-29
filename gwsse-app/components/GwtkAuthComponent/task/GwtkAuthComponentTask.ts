/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Пример задачи                               *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import GwtkAuthComponentWidget from './GwtkAuthComponentWidget.vue';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import AppWindow from '../../../AppWindow';
import GISWebServerSEService from '../../../service/GISWebServerSEService';
import { BrowserService } from '~/services/BrowserService';
import RequestServices, { ServiceType } from '~/services/RequestServices';

export const DO_AUTH_LOGIN = 'gwtkauth.login';
export const DO_AUTH_LOGOUT = 'gwtkauth.logout';
export const DO_AUTH_STATUS = 'gwtkauth.status';
export const DO_AUTH_REGISTER = 'gwtkauth.register';
export const DO_AUTH_RECOVER = 'gwtkauth.recover';
export const DO_AUTH_RECOVERCODE = 'gwtkauth.recovercode';
export const DO_AUTH_NEWPASSWORD = 'gwtkauth.recnewpassword';

type LOGIN_DATA = { login: string, password: string };
type REG_DATA = { login: string, email: string, passwordnew: string, passwordrepeat: string };
type REC_DATA = { email: string, code: string };
type REC_DATA_NEW = { email: string, code: string, password: string, passwordrepeat: string };
export type GwtkAuthComponentState = {
    [ DO_AUTH_LOGIN ]: LOGIN_DATA;
    [ DO_AUTH_LOGOUT ]: boolean;
    [ DO_AUTH_STATUS ]: boolean;
    [ DO_AUTH_REGISTER ]: REG_DATA;
    [ DO_AUTH_RECOVER ]: string;
    [ DO_AUTH_RECOVERCODE ]: REC_DATA;
    [ DO_AUTH_NEWPASSWORD ]: REC_DATA_NEW;
}
type WidgetParams = {
    setState: GwtkAuthComponentTask['setState'],
    mapView: MapWindow
}

import GwtkError from '~/utils/GwtkError';
import i18n from '@/plugins/i18n';

/**
 * Пример задачи
 * @class GwtkAuthComponentTask
 * @extends Task<GwtkAuthComponentTask
 */
export default class GwtkAuthComponentTask extends Task {

    widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    readonly params = (this.mapWindow as AppWindow).appParams;

    private readonly requestService = RequestServices.retrieveOrCreate( { url: (BrowserService.getAppURL().split('/')[BrowserService.getAppURL().split('/').length-1] == '')?BrowserService.getAppURL() + 'modules/formauth/sys/api':BrowserService.getAppURL().split('/').slice(0, BrowserService.getAppURL().split('/').length - 1).join('/') + '/modules/formauth/sys/api' }, ServiceType.AUTH );

    /**
     * @constructor GwtkAuthComponentTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);


        // регистрация Vue компонента
        const name = 'GwtkAuthComponentWidget';
        const source = GwtkAuthComponentWidget;
        this.mapWindow.registerComponent(name, source);

        const description = this.mapWindow.getTaskManager().getTaskDescription(this.id);

        this.widgetProps = {
            taskId: this.id,
            description: description,
            setState: this.setState.bind( this ),
            mapView: mapWindow
        };


        if (this.params.authType == 5) {
            // авторизация через форму
            if (!this.params.loggedInFlag) {
                // Создание Vue компонента
                this.mapWindow.createFullScreenWidget(name, this.widgetProps);
                // Помещаем в список удаления после деактивации
                this.addToPostDeactivationList(this.widgetProps);
            } else {
                // выход
                this.doLogoutRequest();
            }
        } else {
            const service = new GISWebServerSEService();
            if(this.params.authType == 3) {
                // авторизация через сервис
                var redirect_uri = service.getDefaults().url+'query.php';
                if (!this.params.loggedInFlag) {
                    var width = 664;
                    var height = 385;
                    var top = (document.body.clientHeight - height)/2;
                    var left = (document.body.clientWidth - width)/2;
                    
                    var authWin = window.open(this.map.options.url.split('/').slice(0, this.map.options.url.split('/').length - 1).join('/') + '/' + 'auth.php?act=login&redirect_uri=' + redirect_uri + '&sessupdatekey=' + this.params.sess_updatekey + '&path=' + window.location.pathname, 'authWin', 'top=' + top + ',left=' + left + ',width=' + width + ',height=' + height + ',resizable=yes,scrollbars=yes,status=yes');
                    if (!authWin) {                    
                        console.log('Enable popup windows for this site!');
                        return;
                    }
                    authWin.focus();
                } else {
                    var url = this.map.options.url.split('/').slice(0, this.map.options.url.split('/').length - 1).join('/') + '/' + 'auth.php?act=logout&redirect_uri=' + redirect_uri + '&sessupdatekey=' + this.params.sess_updatekey + '&path=' + window.location.pathname;
                    window.location.href = url;
                }
            } else {
                // остальные типы            
                if (!this.params.loggedInFlag) {
                    service.login();
                } else {
                    service.logout(this.params.authType);
                }
            }
        }
    }

    setup() {
        if (this.params.authType === 0) {
            this.mapWindow.getTaskManager().detachTask(this.id);
        }
    }

    /**
     * Выполнить запрос авторизации пользователя
     * @async
     * @method doLoginRequest
     */
    async doLoginRequest(logindata: LOGIN_DATA) {
        try {
            const requestParams = { login: logindata.login, password: logindata.password };
            const result = await this.requestService.login( requestParams );
            if ( result.data ) {
                const userData = result.data.data.userData;
                if ( userData ) {

                    window.location.reload();
                } else {
                    this.widgetProps.mapView.addSnackBarMessage( i18n.tc('auth.Invalid login or password' ) as string );
                }
            }
        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            this.widgetProps.mapView.addSnackBarMessage( message.exceptionCode + ' ' + message.exceptionText );
        }
    }

    /**
     * Выполнить запрос проверки текущего пользователя
     * @async
     * @method doLoginRequest
     */
    async doCheckStatusRequest() {
        try {
            const result = await this.requestService.fetchAuthParams();
            if ( result.data ) {
                // информация о пользователе
                const userData = result.data.data.authParams.data.userData;

                if ( userData ) {
                    //this.isLogin = false;
                    //this.isLogged = true;

                    //this.username = userData.login;
                    //this.emailRegistration = userData.email;
                }
            }
        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            this.widgetProps.mapView.addSnackBarMessage( message.exceptionCode + ' ' + message.exceptionText );
        }
    }

    /**
     * Выполнить запрос выхода пользователя
     * @async
     * @method doLogoutRequest
     */
    async doLogoutRequest() {
        try {
            const result = await this.requestService.logout();
            if ( result.data ) {
                const responseLogout = result.data.data.logout;
                if ( responseLogout ) {
                    this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.The exit is completed!' ) as string );
                    window.location.reload();//fixme:временное решение для авторизованных пользователей
                } else {
                    this.widgetProps.mapView.addSnackBarMessage( result.data.errorCode.message );
                }
            }
        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            if ( message.exceptionCode === '401' ) {
                this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.The exit is completed!' ) as string );
            } else {
                this.widgetProps.mapView.addSnackBarMessage( message.exceptionText );
            }
        }
    }

    /**
     * Регистрация пользователя
     * @async
     * @method doRegister
     */
    async doAuthRegister(regdata: REG_DATA) {
        try {
            const requestParams = {
                login: regdata.login,
                email: regdata.email,
                password: regdata.passwordnew,
                passwordRepeat: regdata.passwordrepeat
            };

            const result = await this.requestService.register( requestParams );

            if ( result.data ) {
                const registerType = result.data.data.register;
                if ( registerType ) {
                    this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.Registration was successful!' ) as string );
                    //this.username = this.emailRegistration;
                    //this.gotoLoginForm();
                } else {
                    let message = i18n.tc( 'auth.A user with this ( mailHash ) email address already exists!' ) as string;
                    const regExp = /mailHash/gi;
                    message = message.replace( regExp, regdata.email as string );
                    this.widgetProps.mapView.addSnackBarMessage( message );
                }
            }
        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            this.widgetProps.mapView.addSnackBarMessage( message.exceptionCode + ' ' + message.exceptionText );
        }
    }

    /**
     * Отправить ссылку на восстановление учетной записи
     * @async
     * @method sendEmailForRecover
     */
    async doAuthRecover(email: string) {
        try {
            const requestParams = { email: email };

            await this.requestService.changeToNewPassword( requestParams );
            this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.Confirmation code has been successfully sent to your email!' ) as string );

            //this.isRecoverEmailInputForm = false;
            //this.isRecoverCodeInputForm = true;

        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            this.widgetProps.mapView.addSnackBarMessage( message.exceptionCode + ' ' + message.exceptionText );
        }
    }

    /**
     * Отправить код восстановления учетной записи
     * @async
     * @method sendCode
     */
    private async sendCode(recdata: REC_DATA) {
        try {
            const requestParams = { email: recdata.email, code: recdata.code };
            const result = await this.requestService.checkRecoveryCode( requestParams );
            if ( result.data ) {
                const responseType = result.data.data.result;
                if ( responseType ) {
                    //this.isRecoverCodeInputForm = false;
                    //this.isPasswordNewInputForm = true;
                } else {
                    this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.Incorrect password recovery code!' ) as string );
                }
            }
        } catch {
            this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.Internal server error' ) as string );
        }
    }


    /**
     * Отправить новый пароль
     * @async
     * @method sendPasswordNew
     */
    private async sendPasswordNew(recdatanew: REC_DATA_NEW) {
        try {
            const requestParams = {
                code: recdatanew.code,
                email: recdatanew.email,
                password: recdatanew.password,
                passwordRepeat: recdatanew.passwordrepeat
            };

            const result = await this.requestService.setNewPassword( requestParams );

            if ( result.data ) {
                const responseType = result.data.data.result;

                if ( responseType ) {
                    //this.isPasswordNewInputForm = false;
                    //this.isPasswordChangedSuccessForm = true;
                    //this.codeRecover = '';
                } else {
                    this.widgetProps.mapView.addSnackBarMessage( i18n.tc( 'auth.An error occurred when changing the password!' ) as string );
                }
            }
        } catch ( error ) {
            const gwtkError = new GwtkError(error);
            const message = JSON.parse( gwtkError.message );
            this.widgetProps.mapView.addSnackBarMessage( message.exceptionCode + ' ' + message.exceptionText );

        }
    }

    setState<K extends keyof GwtkAuthComponentState>( key: K, value: GwtkAuthComponentState[K] ) {
        switch ( key ) {
            case DO_AUTH_LOGIN:
                this.doLoginRequest(value as LOGIN_DATA);
                break;
            case DO_AUTH_LOGOUT:
                this.doLogoutRequest();
                break;
            case DO_AUTH_STATUS:
                this.doCheckStatusRequest();
                break;
            case DO_AUTH_REGISTER:
                this.doAuthRegister({ login: (value as REG_DATA).login, email: (value as REG_DATA).email, passwordnew: (value as REG_DATA).passwordnew, passwordrepeat: (value as REG_DATA).passwordrepeat });
                break;
            case DO_AUTH_RECOVER:
                this.doAuthRecover( value as string );
                break;
            case DO_AUTH_RECOVERCODE:
                this.sendCode( value as REC_DATA );
                break;
        }
    }
}
