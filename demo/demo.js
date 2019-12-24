'use strict';

const
    api = require('../src/index'),
    Devices = api.Devices,
    State = api.State,
    devices = new Devices({
        isCardInserted: (c, {state: r}, {state: s}) => {
            return State.is(c, State.INUSE) && State.is(s, State.PRESENT) && State.is(r, State.INUSE, State.PRESENT);
        },
        isCardRemoved: (c, {state: r}, {state: s}) => {
            return State.is(c, State.EMPTY, State.PRESENT) && State.is(s, State.EMPTY) && State.is(r, State.PRESENT);
        }
    });

devices.on('device-activated', ({device, devices}) => {
    console.log(`Device '${device.getName()}' activated, devices: [${devices.toString()}]`);

    device.on('card-detected', event => console.log('card-detected', event.atr)).
        on('card-left', event => console.log('card-left', event.atr)).
        on('card-inserted', event => console.log('card-inserted', event.card.getAtr())).
        on('card-removed', event => console.log('card-removed', event.card.getAtr())).
        on('error', console.error.bind(null, 'error'));

});

devices.on('device-deactivated', ({device, devices}) => {
    console.log(`Device '${device.getName()}' deactivated, devices: [${devices.toString()}]`);
});