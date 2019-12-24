'use strict';

const
    EventEmitter = require('events'),
    pcsclite = require('@paddek/pcsclite'),
    Device = require('./Device');

class Devices extends EventEmitter
{
    /**
     * @typedef Options
     * @type {Object}
     * @property {number} shareMode
     * @property {number} disposition
     * @property {boolean} autoConnect
     * @property {boolean} autoDisconnect
     * @property {function} isCardInserted
     * @property {function} isCardRemoved
     */
    /**
     * @param {Options} options
     */
    constructor (options = {})
    {
        super();

        /**
         * @type {pcsclite}
         * @private
         */
        this._pcsc = pcsclite();
        /**
         * @type {object}
         * @private
         */
        this._devices = {};

        this._pcsc.on('error', error => {
            this.emit('error', {error});
        }).on('reader', reader => {
            const device = new Device(reader, options);

            this._devices[reader.name] = device;

            this.emit('device-activated', {device, devices: this.listDevices()});

            reader.on('error', error => {
                this.emit('error', {reader, error});
            }).on('end', () => {
                delete this._devices[reader.name];
                this.emit('device-deactivated', {device, devices: this.listDevices()});
            });
        });
    }

    close ()
    {
        this._pcsc.close();
    }

    /**
     * @returns {Device[]}
     */
    listDevices ()
    {
        return Object.values(this._devices);
    };

    /**
     * @param {string} name
     * @returns {Device|undefined}
     */
    lookup (name)
    {
        return this._devices[name];
    };

    /**
     * @returns {string}
     */
    toString ()
    {
        return `Devices('${this.listDevices()}')`;
    }
}

module.exports = Devices;

