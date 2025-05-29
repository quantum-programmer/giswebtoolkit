import RosreestrSearcherBase from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrSearcherBase';
import { RosreestrLoadedData } from '~/services/Search/mappers/RosreestrMapper/Types';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';

export default class RosreestrCadnumberSearcher extends RosreestrSearcherBase {

    async search(): Promise<RosreestrLoadedData> {
        const rosreestrMinType = +this.params.typeRosreestrObject;
        const type = rosreestrMinType > 0 ? rosreestrMinType : this.getQueryType(this.text);
        let typeArray: RosreestrQueryType[];
        switch (type) {
            case RosreestrQueryType.LAND_LOT:
            case RosreestrQueryType.CCO:
                typeArray = [RosreestrQueryType.CCO, RosreestrQueryType.LAND_LOT];//5
                break;
            case RosreestrQueryType.LAND_QUARTER:
                typeArray = [RosreestrQueryType.LAND_QUARTER];//2
                break;
            case RosreestrQueryType.LAND_AREA:
                typeArray = [RosreestrQueryType.LAND_AREA];//3
                break;
            case RosreestrQueryType.LAND_DISTRICT:
                typeArray = [RosreestrQueryType.LAND_DISTRICT];//4
                break;
            case RosreestrQueryType.BOUNDARY:
                typeArray = [
                    RosreestrQueryType.BOUNDARY,
                    RosreestrQueryType.USE_RESTRICTED_ZONE,             // ЗОУИТы
                    RosreestrQueryType.TERRITORIAL_AREA,                // Территориальные зоны
                    RosreestrQueryType.FORESTRY,                        // Лесничества и лесопарки
                    RosreestrQueryType.SPECIALLY_NATURAL_AREA,          // Особо охраняемые природные территории
                    RosreestrQueryType.FREE_ECONOMIC_ZONE               // Свободные экономические зоны
                ];
                break;
            default:
                typeArray = [RosreestrQueryType.CCO];//5
        }
        if (this.fullSearch) {
            for (const type of typeArray) {
                const result = await this.fetchDetailedData(type, this.text, this.params);
                if (result.data && result.data.length > 0) {
                    return result;
                }
            }
        } else {
            for (const type of typeArray) {
                const result = await this.fetchData(type, this.text, this.params);
                if (result.data && result.data.length > 0) {
                    return result;
                }
            }
        }

        return { data: [] };
    }

    protected getQueryType(cadNumber: string): RosreestrQueryType {
        const zone = cadNumber.split('-');
        if (zone.length > 1) {
            return RosreestrQueryType.BOUNDARY;
        }
        const sections = cadNumber.split(':');
        switch (sections.length) {
            case 4:
                return RosreestrQueryType.CCO;//5
            case 3:
                return RosreestrQueryType.LAND_QUARTER;//2
            case 2:
                return RosreestrQueryType.LAND_AREA;//3
            case 1:
                return RosreestrQueryType.LAND_DISTRICT;//4
            default:
                return RosreestrQueryType.CCO;//5
        }
    }

}
