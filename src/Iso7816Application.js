'use strict';

const
    EventEmitter = require('events'),
    CommandApdu = require('./CommandApdu'),
    ResponseApdu = require('./ResponseApdu'),
    ins = {
        APPEND_RECORD: 0xE2,
        ENVELOPE: 0xC2,
        ERASE_BINARY: 0x0E,
        EXTERNAL_AUTHENTICATE: 0x82,
        GET_CHALLENGE: 0x84,
        GET_DATA: 0xCA,
        GET_RESPONSE: 0xC0,
        INTERNAL_AUTHENTICATE: 0x88,
        MANAGE_CHANNEL: 0x70,
        PUT_DATA: 0xDA,
        READ_BINARY: 0xB0,
        READ_RECORD: 0xB2,
        SELECT_FILE: 0xA4,
        UPDATE_BINARY: 0xD6,
        UPDATE_RECORD: 0xDC,
        VERIFY: 0x20,
        WRITE_BINARY: 0xD0,
        WRITE_RECORD: 0xD2
    };

class Iso7816Application extends EventEmitter
{
    /**
     * @param {Card} card
     */
    constructor (card)
    {
        super();

        /**
         * @type {Card}
         * @private
         */
        this._card = card;
    }

    /**
     * @param {CommandApdu|Buffer|string|array} commandApdu
     * @return {Promise}
     */
    issueCommand (commandApdu)
    {
        return this._card.issueCommand(commandApdu).then(resp => {
            const response = new ResponseApdu(resp);

            if (response.hasMoreBytesAvailable()) {
                return this.getResponse(response.numberOfBytesAvailable()).then(res => {
                    const resp = new ResponseApdu(res);
                    return new ResponseApdu(response.getDataOnly() + resp.toString());
                });
            } else if (response.isWrongLength()) {
                commandApdu.setLe(response.correctLength());
                return this.issueCommand(commandApdu).then(res => {
                    const resp = new ResponseApdu(res);
                    return new ResponseApdu(response.getDataOnly() + resp.toString());
                });
            }

            return response;
        });
    };

    /**
     * @param {array} bytes
     * @param {number} p1
     * @param {number} p2
     * @return {Promise}
     */
    selectFile (bytes, p1, p2)
    {
        const commandApdu = new CommandApdu({
            cla: 0x00,
            ins: ins.SELECT_FILE,
            p1: p1 || 0x04,
            p2: p2 || 0x00,
            data: bytes
        });

        return this.issueCommand(commandApdu).then(response => {
            if (response.isOk()) {
                this.emit('application-selected', {application: Buffer.from(bytes).toString('hex')});
            }
            return response;
        });
    };

    /**
     * @param {number} length
     * @return {Promise}
     */
    getResponse (length)
    {
        return this.issueCommand(new CommandApdu({cla: 0x00, ins: ins.GET_RESPONSE, p1: 0x00, p2: 0x00, le: length}));
    };

    /**
     * @param {number} sfi
     * @param {number} record
     * @return {Promise}
     */
    readRecord (sfi, record)
    {
        return this.issueCommand(new CommandApdu({
            cla: 0x00,
            ins: ins.READ_RECORD,
            p1: record,
            p2: (sfi << 3) + 4,
            le: 0
        }));
    };

    /**
     * @param {number} p1
     * @param {number} p2
     * @return {Promise}
     */
    getData (p1, p2)
    {
        return this.issueCommand(new CommandApdu({cla: 0x00, ins: ins.GET_DATA, p1: p1, p2: p2, le: 0}));
    };
}

module.exports = Iso7816Application;