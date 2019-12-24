'use strict';

const
    EventEmitter = require('events'),
    ResponseApdu = require('./ResponseApdu'),
    CommandApdu = require("./CommandApdu");

class Card extends EventEmitter
{
    /**
     * @param {Device} device
     * @param {Buffer} atr
     * @param {number} protocol
     */
    constructor (device, atr, protocol)
    {
        super();

        /**
         * @type {Device}
         * @private
         */
        this._device = device;
        /**
         * @type {number}
         * @private
         */
        this._protocol = protocol;
        /**
         * @type {string}
         * @private
         */
        this._atr = atr.toString('hex');
    }

    /**
     * @returns {string}
     */
    getAtr ()
    {
        return this._atr;
    }

    /**
     * @returns {string}
     */
    toString ()
    {
        return `Card(atr:'${this.getAtr()}')`;
    }

    /**
     * @param {CommandApdu|Buffer|string|array} apdu
     * @returns {Promise}
     */
    issueCommand (apdu)
    {
        return new Promise((ok, nok) => {
            let buffer;

            if (Array.isArray(apdu)) {
                buffer = Buffer.from(apdu);
            } else if (typeof apdu === 'string') {
                buffer = Buffer.from(apdu, 'hex');
            } else if (Buffer.isBuffer(apdu)) {
                buffer = apdu;
            } else if (apdu instanceof CommandApdu) {
                buffer = apdu.toBuffer();
            } else {
                throw new TypeError('Apdu must be of type CommandApdu, Buffer, string or array');
            }

            const command = new CommandApdu({bytes: Uint8Array.from(buffer)});

            this.emit('command-issued', {card: this, command});

            this._device.transmit(buffer, 0x102, this._protocol).then(response => {
                response = new ResponseApdu(response);
                this.emit('response-received', {card: this, command, response});
                ok(response.buffer());
            }).catch(nok);
        });
    };
}

module.exports = Card;
