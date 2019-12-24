'use strict';

const statusCodes = {
    '^9000$': 'Normal processing',
    '^61(.{2})$': 'Normal processing, (sw2 indicates the number of response bytes still available)',
    '^62(.{2})$': 'Warning processing',
    '^6200$': 'no info',
    '^6281$': 'Part of return data may be corrupted',
    '^6282$': 'end of file/record reached before reading le bytes',
    '^6283$': 'ret data may contain structural info',
    '^6284$': 'selected file is invalidated',
    '^6285$': 'file control info not in required format',
    '^6286$': 'unsuccessful writing',
    '^63(.{2})$': 'Warning processing',
    '^6300$': 'no info',
    '^6381$': 'last write filled up file',
    '^6382$': 'execution successful after retry',
    '^64(.{2})$': 'Execution error',
    '^65(.{2})$': 'Execution error',
    '^6500$': 'no info',
    '^6581$': 'memory failure',
    '^66(.{2})$': 'Reserved for future use',
    '^6700$': 'Wrong length',
    '^68(.{2})$': 'Checking error: functions in CLA not supported (see sw2)',
    '^6800$': 'no info',
    '^6881$': 'logical channel not supported',
    '^6882$': 'secure messaging not supported',
    '^69(.{2})$': 'Checking error: command not allowed (see sw2)',
    '^6a(.{2})$': 'Checking error: wrong parameters (p1 or p2)  (see sw2)',
    '^6b(.{2})$': 'Checking error: wrong parameters',
    '^6c(.{2})$': 'Checking error: wrong length (sw2 indicates correct length for le)',
    '^6d(.{2})$': 'Checking error: wrong ins',
    '^6e(.{2})$': 'Checking error: class not supported',
    '^6f(.{2})$': 'Checking error: no precise diagnosis',
    // ...
    '.*': 'Unknown'
};

class ResponseApdu
{
    /**
     * @param {Buffer|string} buffer
     */
    constructor (buffer)
    {
        /**
         * @type {Buffer}
         * @private
         */
        this._buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, 'hex');
        /**
         * @type {string}
         * @private
         */
        this._data = typeof buffer === 'string' ? buffer : buffer.toString('hex');
    }

    /**
     * @returns {string}
     */
    meaning ()
    {
        const statusCode = this.getStatusCode();
        return Object.entries(statusCodes).find(([code]) => statusCode.match(code))[1];
    }

    /**
     * @return {string}
     */
    getDataOnly ()
    {
        return this._data.substr(0, this._data.length - 4);
    }

    /**
     * @returns {string}
     */
    getStatusCode ()
    {
        return this._data.substr(-4);
    }

    /**
     * @returns {boolean}
     */
    isOk ()
    {
        return this.getStatusCode() === '9000';
    }

    /**
     * @returns {Buffer}
     */
    buffer ()
    {
        return this._buffer;
    }

    /**
     * @returns {boolean}
     */
    hasMoreBytesAvailable ()
    {
        return this._data.substr(-4, 2) === '61';
    }

    /**
     * @returns {number}
     */
    numberOfBytesAvailable ()
    {
        return parseInt(this._data.substr(-2, 2), 16);
    }

    /**
     * @returns {boolean}
     */
    isWrongLength ()
    {
        return this._data.substr(-4, 2) === '6c';
    }

    /**
     * @returns {number}
     */
    correctLength ()
    {
        return this.numberOfBytesAvailable();
    }

    /**
     * @returns {string}
     */
    toString ()
    {
        return this._data;
    }
}

module.exports = ResponseApdu;
