import GwtkMapLayerFactory from './GwtkMapLayerFactory';
import GwtkMapLayerItem from './GwtkMapLayerItem';
import { ContentTreeNode, TreeNodeType } from '~/utils/MapTreeJSON';
import { Visibility } from '~/types/Types';


export default class GwtkGroupLayerItem extends GwtkMapLayerItem {

    get layerName(): string {
        const nameList = [this._contentTreeItem.text];
        if ( this.skipEmptyNodes ) {
            this.updateFullName( nameList, this._contentTreeItem );
        }

        return nameList.join( '>' );
    }

    get childLayerItems(): GwtkMapLayerItem[] {

        const childLayerItems: GwtkMapLayerItem[] = [];

        this.updateChildren( this._contentTreeItem, childLayerItems );

        return childLayerItems;
    }

    private updateFullName( name: string[], currentNode: ContentTreeNode ) {
        if ( currentNode.nodes ) {
            if ( currentNode.nodes.length === 1 ) {
                const childNode = currentNode.nodes[ 0 ];
                if ( childNode.nodeType === TreeNodeType.Group ) {
                    name.push( childNode.text );
                    this.updateFullName( name, childNode );
                }
            }
        }
    }

    private updateChildren( currentNode: ContentTreeNode, childLayerItems: GwtkMapLayerItem[] ) {
        if ( currentNode.nodes ) {
            if ( this.skipEmptyNodes && currentNode.nodes.length === 1 && currentNode.nodes[ 0 ].nodeType === TreeNodeType.Group ) {
                this.updateChildren( currentNode.nodes[ 0 ], childLayerItems );
            } else {
                for ( let i = 0; i < currentNode.nodes.length; i++ ) {
                    const newMapLayerItem = GwtkMapLayerFactory.createMapLayerItem( this.map, currentNode.nodes[ i ], this );
                    childLayerItems.push( newMapLayerItem );
                }
            }
        }
    }

    get isEditable(): boolean {
        let result = false;

        const childLayerItems = this.childLayerItems;
        for ( let i = 0; i < childLayerItems.length; i++ ) {
            result = childLayerItems[ i ].isEditable;
            if ( result ) {
                break;
            }
        }

        return result;
    }

    get isTooltipMap(): boolean {
        let result = false;

        const childLayerItems = this.childLayerItems;
        for ( let i = 0; i < childLayerItems.length; i++ ) {
            result = childLayerItems[ i ].isTooltipMap;
            if ( result ) {
                break;
            }
        }

        return result;
    }
    get isAdditionalSld(): boolean {
        let result = false;

        const childLayerItems = this.childLayerItems;
        for (let i = 0; i < childLayerItems.length; i++) {
            result = childLayerItems[i].isAdditionalSld;
            if (result) {
                break;
            }
        }
        return result;
    }
    get isVirtualFolderChild(): boolean {
        let result = false;

        let parent = this.parentItem;
        while ( parent !== null ) {
            if ( parent.isVirtualFolder ) {
                result = true;
                break;
            }
            parent = parent.parentItem;
        }
        return result;

    }

    get visibility(): Visibility {
        let isVisible: Visibility = 'hidden';

        const nodes = this._contentTreeItem.nodes;
        if ( nodes ) {
            isVisible = this.getNodesVisibility( nodes ) || 'hidden';
        }

        return isVisible;
    }

    private getNodesVisibility( nodes: ContentTreeNode[] ): Visibility | undefined {
        let isHalfVisible: Visibility | undefined = undefined;

        let flag;
        for ( let i = 0; i < nodes.length; i++ ) {
            const currentNode = nodes[ i ];
            if ( currentNode.nodeType !== TreeNodeType.VirtualFolder ) {
                if ( currentNode.nodes && currentNode.nodes.length > 0 ) {
                    const innerVisibility = this.getNodesVisibility( currentNode.nodes );
                    if ( innerVisibility === 'visible' ) {
                        if ( flag === undefined ) {
                            flag = true;
                            isHalfVisible = 'visible';
                        } else if ( !flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    } else if ( innerVisibility === 'hidden' ) {
                        if ( flag === undefined ) {
                            flag = false;
                            isHalfVisible = 'hidden';
                        } else if ( flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    } else if ( innerVisibility === 'half-visible' ) {
                        isHalfVisible = 'half-visible';
                        break;
                    }
                } else {
                    const layer = this.map.tiles.getLayerByxId(currentNode.id) || this.map.getVectorLayerByxId(currentNode.id);
                    if ( layer && layer.visible ) {
                        if ( flag === undefined ) {
                            flag = true;
                            isHalfVisible = 'visible';
                        } else if ( !flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    } else {
                        if ( flag === undefined ) {
                            flag = false;
                            isHalfVisible = 'hidden';
                        } else if ( flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    }
                }
            } else {
                const virtualFolder = this.map.tiles.getVirtualFolderByxId( currentNode.id );
                if ( virtualFolder ) {
                    const folderVisibility = virtualFolder.getVisibility();
                    if ( folderVisibility === 'half-visible' ) {
                        isHalfVisible = 'half-visible';
                        break;
                    }

                    if ( folderVisibility === 'visible' ) {
                        if ( flag === undefined ) {
                            flag = true;
                            isHalfVisible = 'visible';
                        } else if ( !flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    } else {
                        if ( flag === undefined ) {
                            flag = false;
                            isHalfVisible = 'hidden';
                        } else if ( flag ) {
                            isHalfVisible = 'half-visible';
                            break;
                        }
                    }
                }
            }
        }

        return isHalfVisible;
    }


    set visible( value: boolean ) {
        const nodes = this._contentTreeItem.nodes;
        if ( nodes ) {
            this.setNodesVisibility( nodes, value );
            this.map._writeCookie();
            this.map.tiles.wmsUpdate();
        }

    }

    private setNodesVisibility( nodes: ContentTreeNode[], value: boolean ) {
        for ( let i = 0; i < nodes.length; i++ ) {
            const currentNode = nodes[ i ];
            if ( currentNode.nodeType !== TreeNodeType.VirtualFolder ) {
                if ( currentNode.nodes && currentNode.nodes.length > 0 ) {
                    this.setNodesVisibility( currentNode.nodes, value );
                } else {
                    const layer = this.map.tiles.getLayerByxId( currentNode.id );
                    if ( layer ) {
                        layer.setVisibility( value );
                    }
                }
            }
        }
    }

}
