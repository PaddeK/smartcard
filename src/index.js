'use strict';

const
    Iso7816Application = require('./Iso7816Application'),
    CommandApdu = require('./CommandApdu'),
    ResponseApdu = require('./ResponseApdu'),
    Devices = require('./Devices'),
    Device = require('./Device'),
    Card = require('./Card'),
    State = {
        UNAWARE: 0,
        IGNORE: 1,
        CHANGED: 2,
        UNKNOWN: 4,
        UNAVAILABLE: 8,
        EMPTY: 16,
        PRESENT: 32,
        ATRMATCH: 64,
        EXCLUSIVE: 128,
        INUSE: 256,
        MUTE: 512,
        is: (state, ...val) => !!val.reduce((p, c) => p &= (state & (c > 0 ? c : ~c)) === (c > 0 ? c : 0), 1),
        resolve: state => Object.entries(State).reduce((p, [k, v]) => p.concat(state & v ? k : []) , []).join(' | ')
    };


module.exports = {
    Iso7816Application,
    CommandApdu,
    ResponseApdu,
    Devices,
    Device,
    Card,
    State
};