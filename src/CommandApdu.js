'use strict';

class CommandApdu
{
    /**
     * @typedef ApduObject
     * @type {Object}
     * @property {number} le
     * @param {ApduObject} apdu
     */
    constructor (apdu)
    {
        const {cla, ins, p1, p2, data, le, bytes} = apdu;

        /**
         * @type {number[]}
         * @private
         */
        this._bytes = bytes || [cla, ins, p1, p2].concat(data ? [data.length].concat(data) : [], le || 0);
    }

    /**
     * @returns {string}
     */
    toString ()
    {
        return this.toBuffer().toString('hex');
    }

    /**
     * @returns {number[]}
     */
    toByteArray ()
    {
        return this._bytes;
    }

    /**
     * @returns {Buffer}
     */
    toBuffer ()
    {
        return Buffer.from(this._bytes);
    }

    /**
     * @param {number|string} le
     */
    setLe (le)
    {
        this._bytes = this._bytes.slice(0, -1).concat(~~le);
    }
}

module.exports = CommandApdu;
