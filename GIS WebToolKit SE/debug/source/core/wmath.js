GWTK.mapmath = function(map, fn) {
    this.map;
    this.mathComm;
    if (map == null) return;
    this.map = map;
    this.handler = fn;
    this.initialize();
};

GWTK.mapmath.prototype = {
    initialize: function() {
        // this.mathComm = new MapMath(this.map.options.url, this.map);
        // this.mathComm.onDataLoad = this.handler;
        // return this;
        const httpParams = GWTK.RequestServices.createHttpParams(this.map);
        this.mathComm = GWTK.RequestServices.retrieveOrCreate(httpParams, 'REST');
    },
    
    segmentLength: function(layerid, point1, point2, crs, handle, context) {
        // this.mathComm.mapdistance(layerid, point1, point2, crs, handle, context);
        this.mathComm.sideLength({ LAYER: layerid, POINT1: point1, POINT2: point2, CRS: crs, HANDLE: handle }).then((result) => {
            if (result.data) {
                this.handler(result.data, context);
            }else if (result.error) {
                his.handler(result.error, context);
            }
        })
    },
    
    enabled: function() {
        if (this.map == null) return false;
        return true;
    }
};