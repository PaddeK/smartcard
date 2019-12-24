'use strict';

const
    CardReader = require('@paddek/pcsclite').CardReader,
    EventEmitter = require('events'),
    Card = require('./Card');

class Device extends EventEmitter
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
     * @param {CardReader} reader
     * @param {Options} options
     */
    constructor(reader, options)
    {
        super();

        /**
         * @type {CardReader}
         * @private
         */
        this._reader = reader;
        /**
         * @type {string}
         * @private
         */
        this._name = reader.name;
        /**
         * @type {Card}
         * @private
         */
        this._card = null;
        /**
         * @typedef Status
         * @type {Object}
         * @property {number} state
         * @property {Buffer} atr
         */
        /**
         * @type {Status}
         * @private
         */
        this._status = null;

        options = options || {};

        const
            shareMode = options.shareMode || reader.SCARD_SHARE_SHARED,
            disposition = options.disposition || reader.SCARD_LEAVE_CARD,
            autoConnect = options.autoConnect || true,
            autoDisconnect = options.autoDisconnect || true,
            isCardInserted = options.isCardInserted || this._defaultIsCardInserted,
            isCardRemoved = options.isCardRemoved || this._defaultIsCardRemoved;

        reader.on('status', status => {
            this._status = status;

            const changes = reader.state ^ status.state;

            if (changes) {
                this.emit('status', status);

                if (isCardRemoved(changes, reader, status)) {
                    this.emit('card-left', status);

                    autoDisconnect && this._cardRemoved(reader, options);
                } else if (isCardInserted(changes, reader, status)) {
                    this.emit('card-detected', status);

                    autoConnect && this._cardInserted(reader, status, options);
                }
            }
        });
    }

    /**
     * @param {CardReader} reader
     * @param {Status} status
     * @param {Options} options
     * @private
     */
    _cardInserted (reader, status, options)
    {
        this.connect({share_mode: options.shareMode}).then(event => {
            this.emit('card-inserted', event);
        }).catch(this.emit.bind(this, 'error'));
    }

    /**
     * @param {CardReader} reader
     * @param {Options} options
     * @private
     */
    _cardRemoved (reader, options)
    {
        const card = this.getCard();

        this.disconnect(options.disposition).then(event => {
            this.emit('card-removed', event);
        }).catch(this.emit.bind(this, 'error'));
    }

    /**
     * @param {number} changes
     * @param {CardReader} reader
     * @param {Status} status
     * @returns {boolean}
     * @private
     */
    _defaultIsCardRemoved (changes, reader, status)
    {
        return !!(changes & reader.SCARD_STATE_EMPTY) && !!(status.state & reader.SCARD_STATE_EMPTY);
    };

    /**
     * @param {number} changes
     * @param {CardReader} reader
     * @param {Status} status
     * @returns {boolean}
     * @private
     */
    _defaultIsCardInserted (changes, reader, status)
    {
        return !!(changes & reader.SCARD_STATE_PRESENT) && !!(status.state & reader.SCARD_STATE_PRESENT);
    }

    /**
     * @param {Buffer} data
     * @param {number} resLen
     * @param {number} protocol
     * @returns {Promise}
     */
    transmit (data, resLen, protocol)
    {
        return new Promise((ok, nok) => this._reader.transmit(data, resLen, protocol, (e, r) => e ? nok(e) : ok(r)));
    }

    /**
     * @typedef ConnectOptions
     * @type {Object}
     * @property {number} share_mode
     * @property {number} protocol
     * @param {ConnectOptions} options
     * @returns {Promise}
     */
    connect (options = {})
    {
        return new Promise((ok, nok) => {
            const callback = (error, protocol) => {
                if (error) {
                    return nok(error);
                }
                this.setCard(new Card(this, this.getStatus().atr, protocol));
                ok({device: this, protocol, card: this.getCard()});
            };

            this._reader.connect(options, callback);
        });
    }

    /**
     * @param {number} disposition
     * @return {Promise}
     */
    disconnect (disposition = undefined)
    {
        return new Promise((ok, nok) => {
            const
                card = this.getCard(),
                callback = error => {
                    if (error) {
                        return nok(error);
                    }
                    this.setCard(null);
                    ok({name: this._name, card});
                };

            this._reader.disconnect(disposition, callback);
        });
    }

    /**
     * @return {Status}
     */
    getStatus ()
    {
        return this._status;
    }

    /**
     * @param {Card|null} card
     */
    setCard (card)
    {
        this._card = card instanceof Card ? card : null;
    }

    /**
     * @return {Card|null}
     */
    getCard ()
    {
        return this._card;
    }

    /**
     * @returns {CardReader.name|string}
     */
    getName ()
    {
        return this._name;
    }

    /**
     * @returns {string}
     */
    toString ()
    {
        return `Device(name:'${this.getName()}')`;
    }
}

module.exports = Device;
