import {VueMapWindow} from '../src';
import {AppParamsResponse} from './service/GISWebServerSEService/Types';

export type CommonAppWindow = VueMapWindow & { appParams: CommonAppParams; };


export type CommonAppParams = AppParamsResponse['appParams'] & { keyFlag: boolean; counters: string; sess_updatekey: string; hideAuth?: true; };
