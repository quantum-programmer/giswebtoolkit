import RosreestrSearcherBase from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrSearcherBase';
import { RosreestrLoadedData } from '~/services/Search/mappers/RosreestrMapper/Types';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';

export default class RosreestrTextSearcher extends RosreestrSearcherBase {

    async search(): Promise<RosreestrLoadedData> {
        const searchResults: RosreestrLoadedData = {
            data: []
        };

        let requestForType = [
            RosreestrQueryType.CCO,
            RosreestrQueryType.LAND_LOT,
            RosreestrQueryType.LAND_QUARTER,
            RosreestrQueryType.LAND_AREA,
            RosreestrQueryType.LAND_DISTRICT,
            RosreestrQueryType.BOUNDARY,
            RosreestrQueryType.USE_RESTRICTED_ZONE,             // ЗОУИТы
            RosreestrQueryType.TERRITORIAL_AREA,                // Территориальные зоны
            RosreestrQueryType.FORESTRY,                        // Лесничества и лесопарки
            RosreestrQueryType.SPECIALLY_NATURAL_AREA,          // Особо охраняемые природные территории
            RosreestrQueryType.FREE_ECONOMIC_ZONE                // Свободные экономические зоны
        ];

        if (this.fullSearch) {
            for (let type of requestForType) {
                let result = await this.fetchDetailedData(type, this.text, this.params);
                if (result.data && result.data.length > 0 && Array.isArray(searchResults.data)) {
                    searchResults.data.push(...result.data);
                }
            }
        } else {
            for (let type of requestForType) {
                let result = await this.fetchData(type, this.text, this.params);
                if (result.data && result.data.length > 0 && Array.isArray(searchResults.data)) {
                    searchResults.data.push(...result.data);
                }
            }
        }
        return searchResults;  
    }
}
