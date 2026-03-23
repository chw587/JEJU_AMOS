class JidExpireManager {

    intervalSec = 30;
    expTargets = [];

    static MAP_LAYER = 1;
    static CUSTOM = 9;

    constructor() {
        setInterval( this.process.bind(this), this.intervalSec*1000 );
    }

    addExpTarget(info) {
        this.expTargets.push(info);
    }

    process() {
        this.expTargets.forEach( target => {
            if ( target.type==JidExpireManager.MAP_LAYER ) {
                this.processMapLayer(target);
            } else if ( target.type==JidExpireManager.CUSTOM ) {
                this.processCustom(target);
            }
        });
    }

    processMapLayer(target) {
        MAP.eachLayer( (l) => {
            if ( l.options.id!==target.mapId ) {
                return;
            }
            if ( l.options.dt ) {
                const limitDt = fn_getServerMoment().add( target.isUtc?-9:0, "h").add(target.delayAllowMin*-1, "m");
                if ( moment(l.options.dt, "YYYYMMDDHHmmss").isBefore(limitDt) ) {
                    MAP.removeLayer(l);
                }
            }
        });        
    }

    processCustom(target) {
        target.processor();
    }
}

const jidExpireManager = new JidExpireManager();
