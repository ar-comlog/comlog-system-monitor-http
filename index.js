function ComlogHTTPWatcher() {
	var	_self = this;

	this.satus = null; // null = start, true = off, false = on
	this.onDown = null;
	this.onUp = null;
	this.enabled = true;
	this.url = 'http://localhost/';
	this.interval = 60000; // 1 Minute
	this.timeout = 30000; // 30 sekunden
	this.debug = false;

	// Private funktionen
	var _running = false, _timer = null;
	function _downEventStarter() {
		_self.status = false;
		try {
			if (_self.onDown instanceof Array) {
				for (var i = 0; i < _self.onDown.length; i++) {
					_self.onDown[i]();
				}
			} else if (typeof _self.onDown == 'function') {
				_self.onDown();
			}
		} catch (e) {
			console.error(e);
		}
	}

	function _upEventStarter() {
		_self.status = true;
		try {
			if (_self.onUp instanceof Array) {
				for(var i = 0; i < _self.onUp.length; i++) {
					_self.onUp[i]();
				}
			} else if(typeof _self.onUp == 'function') {
				_self.onUp();
			}
		} catch (e) {
			console.error(e);
		}
	}

	function _watch() {
		try {
			if (_running) return;

			_running = true;
			var http = require('http');

			var req = http.get(_self.url, function (res) {
				if (_self.debug) console.log("HTTP Success request to " + _self.url);
				if (_self.satus === false) {
					_upEventStarter(res);
				}

				_self.satus = true;
				_running = false;
			});
			req.on('error', function (e) {
				if (_self.debug) console.log("HTTP Error request to " + _self.url);
				if (_self.satus === true) {
					_downEventStarter(e);
				}

				_self.satus = false;
				_running = false;
			});
			req.on('socket', function (socket) {
				socket.setTimeout(_self.timeout);
				socket.on('timeout', function () {
					if (_self.debug) console.log("HTTP Timeout request to " + _self.url);
					req.abort();
					/*if (_self.satus === true) {
						_downEventStarter();
					}*/

					_self.satus = false;
					_running = false;
				});
			});
		} catch (e) {
			if (_self.satus === true) {
				_downEventStarter(e);
			}

			_self.satus = false;
			_running = false;
			console.error(e);
		}
	}

	/**
	 * Einstellungen aus einem Objekt übernehmen
	 */
	this.applySettings = function(SetObj) {
		for(var prop in SetObj) {
			if (this.hasOwnProperty(prop)) {
				this[prop] = SetObj[prop];
			}
		}
	};

	/**
	 * Überwachung starten
	 */
	this.start = function() {
		this.enabled = true;
		_timer = setInterval(function() {
			if (_self.enabled) _watch();
		}, this.interval);

		_watch();
	};

	/**
	 * Überwachung stoppen
	 */
	this.stop = function() {
		this.enabled = false;
		if (_timer !== null) clearInterval(_timer);
	};
}

module.exports = new ComlogHTTPWatcher();