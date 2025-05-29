import BaseService from '~/services/RequestServices/common/BaseService';
import {AxiosRequestConfig} from 'axios';
import RequestService, {HttpParams} from '~/services/RequestServices/common/RequestService';
import {
    ProjectDescriptionParams,
    ProjectDescriptionResponse,
    DBServiceResponse,
    SemanticTreeNodeResponse,
    SemanticTreeNodeIdentifier,
    AddFilesRequestParams,
    AddFilesResponse,
    GetFilesRequestParams,
    GetFilesResponse,
    GetImageRequestParams,
    UpdateFilesRequestParams,
    UpdateFilesResponse,
    DeleteFilesRequestParams,
    DeleteFilesResponse,
    SortFilesRequestParams,
    SortFilesResponse,
    SemanticTreeNode,
    ResponseResultItemType,
    ResponseType,
    ResponseResultType,
    BookmarksUpdate,
    BookmarkValue,
    BookmarkSearch,
    ProjectBookmarksRequest,
    AppParamsResponse,
    FetchExportReportInitialsResponse,
    ExportReportBodyForMakeReport,
    AddingUserMap,
    DeletingUserMap
} from './Types';
import {FeatureGeometry} from '~/utils/GeoJSON';
import {SimpleJson} from '~/types/CommonTypes';
import {ComponentData, JSONData, ProjectSettings, UserSettings, ViewSettings} from '~/utils/WorkspaceManager';
import {ExportReportConstructorOptionsExtended} from '../../components/GwtkExportReport/task/Types';
import {ServiceResponse} from '~/services/Utils/Types';


/**
 * Класс выполнения запросов к GISWebServerSE
 * @class GISWebServerSEService
 * @extends BaseService
 */
export default class GISWebServerSEService extends BaseService {

    protected readonly defaultUrl: string;
    protected readonly queryUrl: string;
    protected readonly adminQueryUrl: string;
    protected readonly agrolandsRpcUrl: string;

    constructor(httpParams?: AxiosRequestConfig) {

        // const url = 'https://gwserver.gisserver.info:83/GISWebServerSE/';
        // const url = 'http://192.168.1.150/GISWebServerSE/';
        //const url = 'http://192.168.0.13:8083/';
        //const url = window.location.href.replace(/[^/]*$/, '');
        super({
            url: httpParams?.url || window.location.href.replace(/[^/]*$/, ''),
            ...httpParams,
            responseType: 'json',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...httpParams?.headers
            }
        });
        this.defaultUrl = this.getDefaults().url;
        this.queryUrl = this.defaultUrl + 'query.php';
        this.adminQueryUrl = this.defaultUrl + 'admin/query.php';
        this.agrolandsRpcUrl = this.defaultUrl + 'agrolands-rpc/';
    }

    get adminPanelLink() {
        return this.defaultUrl + 'admin/admin.php';
    }

    /**
     * Получение параметров для запроса
     * @method getHttpLocalParams
     * @param {AxiosRequestConfig} localParams
     * @protected
     */
    protected getHttpLocalParams(localParams: AxiosRequestConfig): HttpParams {
        return {
            ...this.getDefaults(),
            url: this.queryUrl,
            headers: {
                ...this.getDefaults().headers,
                ...localParams?.headers
            },
            ...localParams
        };
    }

    /**
     * Получение описания проекта
     * @method getProjectDescription
     * @param {ProjectDescriptionParams} options Параметры запроса
     * @param {AxiosRequestConfig} httpParams HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getProjectDescription(options: ProjectDescriptionParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return RequestService.getRequest<ProjectDescriptionResponse>(httpLocalParams, {...options});
    }

    /**
     * Получение параметров приложения
     * @method getAppParams
     * @param {AxiosRequestConfig} httpParams HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getAppParams(httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return RequestService.getRequest<AppParamsResponse>(httpLocalParams, {cmd: 'appparams'});
    }

    /**
     * Получение параметров токена
     * @param {param: string;} options Дополнительные query-параметры запроса
     * @param {AxiosRequestConfig} httpParams HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    getTokenParams(options: { param: string; }, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.adminQueryUrl,
            ...httpParams,
            headers: {
                'Content-Type': 'application/text'
            }
        });
        return RequestService.postRequest<string>(httpLocalParams, {cmd: 'get-tokenparams', ...options});
    }

    /**
     * Получение наличия лицензии
     * @param {AxiosRequestConfig} httpParams HTTP-параметры запроса
     * @return {Promise} Объект запроса
     */
    checkLicense(httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.adminQueryUrl,
            ...httpParams,
            headers: {
                'Content-Type': 'application/text'
            }
        });
        return RequestService.getRequest<string>(httpLocalParams, {cmd: 'checklicense'});
    }

    systemCheck(options = {}, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}system/check/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return RequestService.getRequest<DBServiceResponse<{}>>(httpLocalParams, {});
    }

    getRecordAttributesTemplateFromDB(options: { table: string; }, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}fetch/attributes/template/for/${options.table}/`,
            ...httpParams
        });
        return RequestService.postRequest<DBServiceResponse<SemanticTreeNodeResponse>>(httpLocalParams, {});
    }

    addRecordFromDB(options: { table: string; attributes: SemanticTreeNode[]; geometry: FeatureGeometry; }, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        data.append('json', JSON.stringify({
            attributes: options.attributes,
            geometry: options.geometry
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}add/record/for/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<DBServiceResponse<SemanticTreeNodeIdentifier>>(httpLocalParams, {});
    }

    updateMapObjectDataFromDB(options: { table: string; recordId: number; attributes: SemanticTreeNode[]; geometry: FeatureGeometry; }, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        data.append('json', JSON.stringify({
            identification: {
                id: options.recordId
            },
            attributes: options.attributes,
            geometry: options.geometry
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}update/record/for/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<DBServiceResponse<SemanticTreeNodeIdentifier>>(httpLocalParams, {});
    }

    deleteMapObjectDataFromDB(options: { table: string; recordId: number; }, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        data.append('json', JSON.stringify({
            identification: {
                id: options.recordId
            }
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}delete/record/for/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<DBServiceResponse<undefined>>(httpLocalParams, {});
    }

    getRecordAttributesFromDB(options: { table: string; recordId: number; }, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        data.append('json', JSON.stringify({
            identification: {
                id: options.recordId
            }
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}fetch/record/for/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<DBServiceResponse<SemanticTreeNodeResponse>>(httpLocalParams, {});
    }

    addMapObjectFileListFromDB(options: AddFilesRequestParams, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        options.formData.files.forEach(file => data.append('files[]', file));
        data.append('json', JSON.stringify({
            description: options.formData.descriptions
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}add/files/for/${options.recordId}/in/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<AddFilesResponse>(httpLocalParams, {});
    }

    updateMapObjectFileListFromDB(options: UpdateFilesRequestParams, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        options.formData.files.forEach(file => data.append('files[]', file));
        data.append('json', JSON.stringify({
            filesId: options.formData.filesId,
            description: options.formData.descriptions
        }));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}update/files/for/${options.recordId}/in/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<UpdateFilesResponse>(httpLocalParams, {});
    }

    deleteMapObjectFileListFromDB(options: DeleteFilesRequestParams, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        data.append('json', JSON.stringify({filesId: options.formData.filesId}));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}delete/files/for/${options.recordId}/in/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<DeleteFilesResponse>(httpLocalParams, {});
    }

    sortMapObjectFileListFromDB(options: SortFilesRequestParams, httpParams?: AxiosRequestConfig) {
        const data = new FormData();
        options.formData.filesId.forEach(fileId => data.append('fileId[]', '' + fileId));

        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}sort/files/for/${options.recordId}/in/${options.table}/`,
            ...httpParams,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        });
        return RequestService.postRequest<SortFilesResponse>(httpLocalParams, {});
    }

    getMapObjectFileListFromDB(options: GetFilesRequestParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}fetch/files/for/${options.recordId}/in/${options.table}/`,
            ...httpParams
        });
        return RequestService.postRequest<GetFilesResponse>(httpLocalParams, {});
    }

    getImageFromDB(options: GetImageRequestParams, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: `${this.agrolandsRpcUrl}image/${options.id}/`,
            responseType: 'blob',
            ...httpParams
        });
        return RequestService.getRequest<Blob>(httpLocalParams, {});
    }

    createImageFromDBPreviewUrl(options: GetImageRequestParams) {
        return `${this.agrolandsRpcUrl}image/${options.id}/preview/`;
    }

    async loadModule(path: string) {
        if (path.indexOf('/') === 0) {
            path = path.slice(1);
        }

        return window.loadUserComponent(this.defaultUrl + path);
    }

    async loadModuleCss(path: string) {
        if (path.indexOf('/') === 0) {
            path = path.slice(1);
        }

        const link = document.createElement('link');
        link.href = this.defaultUrl + path;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    login() {
        // const search = GISWebServerSEService.getUrlParams(window.location.search.substr(1), 'act');
        // const redirectUrl = encodeURIComponent(window.location.protocol + '//' + window.location.host + window.location.pathname + search);
        window.location.href = `${this.queryUrl}?act=login`;
    }

    logout(authtype: number) {
        if (authtype == 1) {
            // PAM
            let xhr = new XMLHttpRequest();
            let url = this.defaultUrl;
            xhr.open('POST', url, true, 'ANONYMOUS', '');
            xhr.onload = function() {
                window.location.href = url;
            };
            xhr.send();
        } else {
            window.location.href = `${this.queryUrl}?act=logout`;
        }
    }

    // /**
    //  * Удалить параметр из строки параметров URL
    //  * @private
    //  * @method getUrlParams
    //  * @param  {string} s - строка параметров
    //  * @param  {string} p - параметр
    //  *
    //  * @returns {string} преобразованная строка параметров
    //  */
    // private static getUrlParams(s: string, p: string) {
    //     let search = s;
    //     if (search !== '') {
    //         const searches = search.split('&');
    //         for (let i = 0; i < searches.length; i++) {
    //             const items = searches[i].split('=');
    //             if (items[0] == p) {
    //                 searches.splice(i, 1);
    //             }
    //         }
    //         search = '';
    //         if (searches.length > 0) {
    //             search += '?' + searches.join('&');
    //         }
    //     }
    //     return search;
    // }

    /**
     * Получить данные обо всех компонентах из БД
     * Для авторизованного пользователя
     * @method getAuthUserAllComponentData
     * @param projectId {String} - Идентификатор проекта
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    async getAuthUserAllComponentData(projectId: string, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'getallcomponentdata'});

        const componentDataList: ComponentData = {};
        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data !== 'string' && data?.result) {
                const responseResult = data.result as ResponseResultItemType[];
                responseResult.forEach((item) => {
                    componentDataList[item.key] = item.value;
                });
                return componentDataList;
            }
        } else {
            throw result.data?.errorCode.message;
        }
    }

    async getProjectViewSettings<T extends ResponseResultType['result']>(projectId: string, keyValue: string, httpParams?: AxiosRequestConfig): Promise<T | undefined> {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId,
                keyValue
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'getprojectviewsettings'});

        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data !== 'string' && data?.result) {
                return data.result as T;
            }
        } else {
            //console.log(result.data?.errorCode.message);
        }
    }

    async setProjectViewSettings(projectId: string, keyValue: string, data: JSONData | ProjectSettings | UserSettings | ViewSettings, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId,
                keyValue,
                data
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'setprojectviewsettings'});

        if (!result.data || !result.data.errorCode || result.data.errorCode.code != '0') {
            throw result.data?.errorCode.message;
        }
    }

    async clearProjectViewSettings(projectId: string, keyValue: string, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId,
                keyValue
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'clearprojectviewsettings'});

        if (!result.data || !result.data.errorCode || result.data.errorCode.code != '0') {
            throw result.data?.errorCode.message;
        }
    }

    async getUserDataActiveProject(httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'getuserdataactiveproject'});

        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data !== 'string' && data?.result) {
                return data.result as {number: number};
            }
        } else {
            throw result.data?.errorCode.message;
        }
    }

    async setUserDataActiveProject( data:{ number: number } , httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                data
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'setuserdataactiveproject'});

        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data == 'string') {
                return data;
            }
        } else {
            console.log(result.data?.errorCode.message);
        }
    }

    async clearUserDataActiveProject(httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'clearuserdataactiveproject'});

        if (!result.data || !result.data.errorCode || result.data.errorCode.code != '0') {
            throw result.data?.errorCode.message;
        }
    }

    async getUserDataDefaultUserSettings<T extends ResponseResultType['result']>(httpParams?: AxiosRequestConfig): Promise<T | undefined> {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'getuserdatadefaultusersettings'});

        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data !== 'string' && data?.result) {
                return data.result as T;
            }
        } else {
            //console.log(result.data?.errorCode.message);
        }
    }

    async setUserDataDefaultUserSettings(data: UserSettings, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                data
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'setuserdatadefaultusersettings'});

        if (!result.data || !result.data.errorCode || result.data.errorCode.code != '0') {
            throw result.data?.errorCode.message;
        }
    }

    async getComponentData(projectId: string, taskId: string, httpParams?: AxiosRequestConfig): Promise<SimpleJson<any> | undefined> {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId,
                taskId
            }
        });
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, {cmd: 'getcomponentdata'});

        if (result.data?.data) {
            const data = result.data.data;
            if (typeof data !== 'string' && data?.result) {
                return data.result as SimpleJson<any>;
            }
        } else {
            console.log(result.data?.errorCode.message);
        }
    }

    async setComponentData(projectId: string, taskId: string, data?: SimpleJson<any>, httpParams?: AxiosRequestConfig): Promise<void> {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                projectId,
                taskId,
                data
            }
        });
        const requestGetQuery = data !== undefined ? {'cmd': 'setcomponentdata'} : {'cmd': 'deletecomponentdata'};
        const result = await RequestService.postRequest<ResponseType>(httpLocalParams, requestGetQuery);

        if (!result.data || !result.data.errorCode || result.data.errorCode.code != '0') {
            throw result.data?.errorCode.message;
        }
    }

    /**
     * Получить список закладок
     * @method getBookmarksList
     * @param searchList {BookmarkSearch}
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    getBookmarksList(searchList: BookmarkSearch, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                select: {
                    search: searchList,
                    fields: ['id', 'guid', 'title', 'original_project_id', 'create_time', 'is_public']
                }
            }
        });
        return RequestService.postRequest<ProjectBookmarksRequest>(httpLocalParams, {cmd: 'get_bookmarks'});
    }

    /**
     * Получить первую закладку из выборки
     * @method findFirstBookmark
     * @param selectFirst {BookmarkValue[]}
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    findFirstBookmark(selectFirst: BookmarkValue[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                selectFirst
            }
        });
        return RequestService.postRequest<ProjectBookmarksRequest>(httpLocalParams, {cmd: 'find_firs'});
    }

    /**
     * Добавить новую закладку
     * @method addNewBookMark
     * @param sendValues {BookmarkValue[]}
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    addNewBookMark(sendValues: BookmarkValue[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                add: sendValues
            }
        });
        return RequestService.postRequest<ProjectBookmarksRequest>(httpLocalParams, {cmd: 'add_bookmark'});
    }

    /**
     * Обновить значения параметра закладки
     * @method updateBookmark
     * @param updateValues {BookmarksUpdate}
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    updateBookmark(updateValues: BookmarksUpdate, httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                update: updateValues
            }
        });
        return RequestService.postRequest<ProjectBookmarksRequest>(httpLocalParams, {cmd: 'update_bookmark'});
    }

    /**
     * Удалить закладку
     * @method deleteBookmark
     * @param deleteValues {BookmarkValue}
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     */
    deleteBookmark(deleteValues: BookmarkValue[], httpParams?: AxiosRequestConfig) {
        const httpLocalParams = this.getHttpLocalParams({
            url: this.queryUrl,
            ...httpParams,
            data: {
                delete: deleteValues
            }
        });
        return RequestService.postRequest<ProjectBookmarksRequest>(httpLocalParams, {cmd: 'delete_bookmark'});
    }

    /**
     * Получить допустимые настройки для компонента Экспорт отчетов
     * @method fetchExportReportInitials
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    fetchExportReportInitials(httpParams?: AxiosRequestConfig): Promise<ServiceResponse<FetchExportReportInitialsResponse>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams
        });
        return RequestService.postRequest<FetchExportReportInitialsResponse>(httpLocalParams, {cmd: 'fetchExportReportInitials'});
    }

    /**
     * Сформировать отчет по заданным параметрам
     * @method makeReport
     * @param requestQuery {ExportReportBodyForMakeReport} Параметры отчета
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    makeReport(requestQuery: ExportReportBodyForMakeReport, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<Blob>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            data: requestQuery,
            responseType: 'blob',
            timeout: 1200000,
        });
        return RequestService.postRequest<Blob>(httpLocalParams, {cmd: 'makeReport'});
    }

    /**
     * Получить логотип для компонента Экспорт отчёта.
     * @method fetchExportReportLogotype
     * @param {string} url
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    fetchExportReportLogotype(url: string, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<Blob>> {
        const httpLocalParams = this.getHttpLocalParams({
            url,
            ...httpParams,
            responseType: 'blob'
        });
        return RequestService.postRequest<Blob>(httpLocalParams, {});
    }

    /**
     * Добавить шаблон для компонента Экспорт отчёта.
     * @method addExportReportTemplate
     * @param {ExportReportConstructorOptionsExtended} constructorOptions
     * @param {number} isPublic
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    addExportReportTemplate(constructorOptions: ExportReportConstructorOptionsExtended, isPublic: number, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<DBServiceResponse<boolean>>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            data: {
                constructorOptions,
                isPublic
            }
        });
        return RequestService.postRequest<DBServiceResponse<boolean>>(httpLocalParams, {cmd: 'addReportTemplate'});
    }

    /**
     * Удалить шаблон для компонента Экспорт отчёта.
     * @method deleteExportReportTemplate
     * @param {number} templateIndex
     * @param {number} isPublic
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    deleteExportReportTemplate(templateIndex: number, isPublic: number, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<DBServiceResponse<boolean>>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            data: {
                templateIndex: templateIndex,
                isPublic: isPublic
            }
        });
        return RequestService.postRequest<DBServiceResponse<boolean>>(httpLocalParams, {cmd: 'deleteReportTemplate'});
    }

    /**
     * Добавить пользовательскую карту.
     * @method addUserMap
     * @param {AddingUserMap} requestQuery
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    addUserMap(requestQuery: AddingUserMap, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<DBServiceResponse<string | false>>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            data: requestQuery,
        });
        return RequestService.postRequest<DBServiceResponse<string | false>>(httpLocalParams, {cmd: 'addUserMap'});
    }

    /**
     * Удалить пользовательскую карту.
     * @method deleteUserMap
     * @param {DeletingUserMap} requestQuery
     * @param [httpParams] {AxiosRequestConfig} HTTP-параметры запроса
     * @return {Promise}
     */
    deleteUserMap(requestQuery: DeletingUserMap, httpParams?: AxiosRequestConfig): Promise<ServiceResponse<DBServiceResponse<boolean>>> {
        const httpLocalParams = this.getHttpLocalParams({
            ...httpParams,
            data: requestQuery,
        });
        return RequestService.postRequest<DBServiceResponse<boolean>>(httpLocalParams, {cmd: 'deleteUserMap'});
    }

}
