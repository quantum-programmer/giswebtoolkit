/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Класс параметров поиска                         *
 *                                                                  *
 *******************************************************************/

import { SourceType } from '~/services/Search/SearchManager';
import { AddressServiceType, GwtkOptions, SearchType } from '~/types/Options';

export type AddresSearchService = {
    id: AddressServiceType;
    text: string;
};

/**
 * Класс параметров поиска
 * @class SearchItemsDescription
 */
export default class SearchItemsDescription {

    readonly searchModes: { id: SearchType; text: string; }[] = [];

    readonly addressSearchServices: AddresSearchService[] = [];

    activeSearchModeId = SearchType.Map;

    activeAddressSearchServiceId = AddressServiceType.Osm;

    /**
     * @constructor SearchItemsDescription
     * @param options {GwtkOptions} Параметры карты
     */
    constructor( options: GwtkOptions ) {
        const searchOptions: GwtkOptions['search_options'] = options.search_options;

        if (searchOptions) {

            let key: keyof typeof searchOptions;
            for (key in searchOptions) {
                const searchMode = searchOptions[key];

                if (typeof searchMode !== 'string' && searchMode.visible) {
                    //TODO: так делать нельзя!!!! Но идентификтаоров нет...
                    const text = searchMode.text ||
                        (key === 'map' && 'phrases.Map search') ||
                        (key === 'address' && 'phrases.Address search') ||
                        (key === 'rosreestr' && 'phrases.Search cadastral number') || '';

                    this.searchModes.push({
                        id: key as SearchType,
                        text
                    });
                } else {
                    this.activeSearchModeId = searchMode as SearchType;
                }
            }

            if (searchOptions.address) {
                for (let i = 0; i < searchOptions.address.sources.length; i++) {
                    const source = searchOptions.address.sources[i];


                    const id = source.type||AddressServiceType.Unknown;
                    if (searchOptions.address.default === i) {
                        this.activeAddressSearchServiceId = id;
                    }

                    this.addressSearchServices.push({ id, text: source.alias });
                }
            }
        }
    }

    get sourceType() {
        let result;
        switch ( this.activeSearchModeId ) {
            case SearchType.Address:
                switch ( this.activeAddressSearchServiceId ) {
                    case AddressServiceType.Yandex:
                        result = SourceType.Yandex;
                        break;
                    case AddressServiceType.PanoramaAddressBase:
                        result = SourceType.PanoramaAddressBase;
                        break;
                    case AddressServiceType.Osm:
                        result = SourceType.Osm;
                        break;
                    case AddressServiceType.Unknown:
                        break;
                }
                break;
            case SearchType.Rosreestr:
                result = SourceType.Nspd;
                break;
            default:
                result = SourceType.GISWebServiceSE;
        }
        return result;
    }

    get activeAddressModeDescription() {
        for ( let k in this.addressSearchServices ) {
            const addressSearches = this.addressSearchServices[ k ];
            if ( this.activeAddressSearchServiceId === addressSearches.id ) {
                return addressSearches;
            }
        }
        return { id: AddressServiceType.Unknown, text: '' };
    }

    get isMapSearch() {
        return this.activeSearchModeId === SearchType.Map;
    }

    get isAddressSearch() {
        return this.activeSearchModeId === SearchType.Address;
    }
}

// const searchModeItems = [
//     {
//         id: 'map',
//         text: 'Поиск по объектам карты',
//         desc: 'Поиск выполняется по семантикам объектов карты, указанных в настройках слоя. Опция "Только видимые" ограничивает условия поиска только видимыми в текущем масштабе объектами.'
//     },
//     {
//         id: 'address',
//         text: 'Поиск по адресу',
//         desc: 'Поиск выполняется через выбранный адресный сервис. Карта позиционируется по координатам, соответствующим найденному адресу.'
//     },
//     // {
//     //     id: 'rosreestr',
//     //     text: 'Поиск по кадастровому номеру',
//     //     desc: 'Поиск выполняется на сайте Росреестра. Карта позиционируется по координатам, соответствующим найденному адресу.'
//     // }
// ];
