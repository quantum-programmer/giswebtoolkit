import { ContentTreeNode } from '~/utils/MapTreeJSON';

export type LayerTreeItems = LayerTreeItem[];
export type LayerTreeListItems = LayerTreeItemBase[];

export type LayerTreeItemBase = {
    visible?: boolean;
    opacity?: number;
    exportTypes?: string[];
} & ContentTreeNode

export type LayerTreeItem = LayerTreeItemBase & {
    nodes?: LayerTreeItems;
}

export type ProgressParameters = {
    visible: boolean;
    indeterminate?: boolean;
    percent?: number;
};
