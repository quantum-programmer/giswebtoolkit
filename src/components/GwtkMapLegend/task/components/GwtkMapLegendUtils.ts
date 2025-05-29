/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Класс работы с составом легенды                     *
 *                                                                  *
 *******************************************************************/

import { GwtkMapLegendItem } from '../components/LegendItems';
import { TreeItem } from '../components/LegendItems/Types';

export default class GwtkMapLegendUtils {

    static getChildrenOfType<K extends (GwtkMapLegendItem | TreeItem)>(treeItem: K): K[] {
        let children;
        if (treeItem instanceof GwtkMapLegendItem) {
            children = treeItem.childLegendItems;
        } else {
            children = (treeItem as TreeItem).children;
        }
        return children as K[];
    }

    static getItemVisibilityIcon<K extends (GwtkMapLegendItem | TreeItem)>(treeItem: K): string {
        let result = '';
        let resultChildMul: boolean = true;
        let resultChildSum: boolean = false;

        const children = this.getChildrenOfType(treeItem);

        if (children && children.length) {

            let resultChild: string[] = [];

            for (let i = 0; i < children.length; i++) {
                const child = children[i];

                if (this.getChildrenOfType(child).length) {
                    resultChild.push(this.getItemVisibilityIcon(child));
                } else {
                    resultChildMul &&= child.visible;
                    resultChildSum ||= child.visible;
                }
            }

            if (!resultChild.length) {

                if (resultChildSum && resultChildMul) {
                    result = 'visibility-on';
                } else if (!resultChildSum && !resultChildMul) {
                    result = 'visibility-off';
                } else {
                    result = 'half-visibility';
                }
            } else {

                const isHalf = resultChild.some((item) => item === 'visibility-off' || item === 'half-visibility');
                const isOff = resultChild.every((item) => item === 'visibility-off');

                result = 'visibility-on';
                if (isHalf) {
                    result = 'half-visibility';
                }
                if (isOff) {
                    result = 'visibility-off';
                }

            }

            return result;
        }

        return treeItem.visible ? 'visibility-on' : 'visibility-off';
    }

    static getTreeItemChildren<K extends (GwtkMapLegendItem | TreeItem)>(treeItem: K): K[] {
        if (treeItem instanceof GwtkMapLegendItem) {
            return this.getItemArray(treeItem) as K[];
        } else {
            return this.getTreeItemArray(treeItem) as K[];
        }
    }

    private static getItemArray(treeItem: GwtkMapLegendItem): GwtkMapLegendItem[] {
        const result = [];
        if (treeItem.childLegendItems.length) {
            for (let i = 0; i < treeItem.childLegendItems.length; i++) {
                const child = treeItem.childLegendItems[i];
                if (child.childLegendItems.length) {
                    result.push(...this.getItemArray(child));
                } else {
                    result.push(child);
                }
            }
        }
        return result;
    }

    private static getTreeItemArray(treeItem: TreeItem): TreeItem[] {
        const result = [];
        if (treeItem.children.length) {
            for (let i = 0; i < treeItem.children.length; i++) {
                const child = treeItem.children[i];
                if (child.children.length) {
                    result.push(...this.getTreeItemArray(child));
                } else {
                    result.push(child);
                }
            }
        }
        return result;
    }

}
