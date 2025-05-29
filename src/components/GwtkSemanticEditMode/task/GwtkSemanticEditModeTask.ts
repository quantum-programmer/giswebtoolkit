import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';

export default class GwtkSemanticEditModeTask extends Task {

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
    }

    setup() {
        super.setup();
        this.map.setStrictEditorMode(true);
    }

    protected destroy(): void {
        super.destroy();
        window.setTimeout(() => this.map.setStrictEditorMode(false), 3);
    }
}
