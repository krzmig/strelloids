function Settings( load_callback )
{
	/** @type {Settings} */
	var self = this;
	/** @type {object} local settings object copy */
	var settings = {};
	/** @type {object} default setting, will be loaded by ajax from default_settings.json file */
	var default_settings = {};
	/** @type {string|null} */
	var board_id = null;

	function init()
	{
		findBoardId();
		self.load();
		initApiEvents();
	}

	/**
	 * @param {string} list_id
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForList = function( list_id, key )
	{
		var option_key = 'list.'+list_id;
		if( typeof settings[option_key] !== 'undefined' && typeof settings[option_key][key] !== 'undefined' )
			return settings[option_key][key];
		else if( typeof default_settings['list.*'][key] !== 'undefined' )
			return default_settings['list.*'][key];
		else
			return null;
	};

	/**
	 * @param {string} list_id
	 * @param {string} key
	 * @param {null|boolean|number|string|array|object} value
	 */
	this.setForList = function( list_id, key, value )
	{
		var option_key = 'list.'+list_id;
		if( typeof settings[option_key] === 'undefined' )
			settings[option_key] = {};

		settings[option_key][key] = value;
		self.saveLocal( option_key );
	};

	/**
	 * @param {string} list_id
	 * @param {string} key
	 */
	this.resetForList = function( list_id, key)
	{
		var option_key = 'list.'+list_id;
		if( typeof settings[option_key] === 'undefined' )
			return;

		delete settings[option_key][key];
		if( typeof settings[option_key] === 'object' && Object.keys( settings[option_key] ).length === 0 )
			self.getLocalApiObject().remove( option_key );
		else
			self.saveLocal( option_key );
	};

	/**
	 * @param {string} board_id
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForBoard = function( board_id, key )
	{
		var option_key = 'board.'+board_id;

		if( board_id && typeof settings[option_key] !== 'undefined' && typeof settings[option_key][key] !== 'undefined' )
			return settings[option_key][key];
		else if( typeof settings['board.*'] !== 'undefined' && typeof settings['board.*'][key] !== 'undefined' )
			return settings['board.*'][key];
		else if( typeof default_settings['board.*'][key] !== 'undefined' )
			return default_settings['board.*'][key];
		else
			return null;
	};

	/**
	 * @param {string} board_id
	 * @param {string} key
	 * @param {null|boolean|number|string|array|object} value
	 */
	this.setForBoard = function( board_id, key, value )
	{
		var option_key = 'board.'+board_id;
		if( typeof settings[option_key] === 'undefined' )
			settings[option_key] = {};

		settings[option_key][key] = value;
		self.saveSync( option_key );
	};

	/**
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForCurrentBoard = function( key )
	{
		return self.getForBoard( board_id, key );

	};

	/**
	 * @param {string} key
	 * @param {null|boolean|number|string|array|object} value
	 */
	this.setForCurrentBoard = function( key, value )
	{
		self.setForBoard( board_id, key, value );
	};

	/**
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getGlobal = function( key )
	{
		var keys = /(.+)\[([^\]]+)\]$/.exec( key );
		if( keys )
		{
			key = keys[1];
			var sub_key = keys[2];

			if( typeof settings[key] !== 'undefined' && typeof settings[key][sub_key] !== 'undefined' )
				return settings[key][sub_key];
			else if( typeof default_settings[key] !== 'undefined' && typeof default_settings[key][sub_key] !== 'undefined' )
				return default_settings[key][sub_key];
			else
				return null;
		}
		else if( typeof settings[key] !== 'undefined' )
			return settings[key];
		else if( typeof default_settings[key] !== 'undefined' )
			return default_settings[key];
		else
			return null;
	};

	this.setGlobal = function( key, value )
	{
		var keys = /(.+)\[([^\]]+)\]$/.exec( key );
		if( keys )
		{
			key = keys[1];
			var sub_key = keys[2];

			if( typeof settings[key] === 'undefined' )
				settings[key] = {};

			settings[key][sub_key] = value;
		}
		else
			settings[key] = value;

		self.saveSync( key );
	};

	/**
	 * @param {string} key
	 */
	this.resetGlobal = function( key )
	{
		if( settings.hasOwnProperty( key ))
		{
			delete settings[key];
			self.getSyncApiObject().remove( key );
		}
	};

	/**
	 * Load settings for all boards, from browser.
	 */
	this.load = function()
	{
		new Ajax({
			url: getBrowserObject().extension.getURL('default_settings.json'),
			onDone: function( response ) {
				default_settings = JSON.parse( response );

				loadLocalStorage();
			}
		});

		function loadLocalStorage()
		{
			self.getLocalApiObject().get(
				null,
				function( result )
				{
					if( result !== undefined )
						for( var i in result )
							if( result.hasOwnProperty( i ))
								settings[i] = result[i];

					if( self.getSyncApiObject() !== self.getLocalApiObject() )
						loadSyncStorage();
					else if( typeof load_callback === 'function' )
						load_callback();
				}
			);
		}

		function loadSyncStorage()
		{
			self.getSyncApiObject().get(
				null,
				function( result )
				{
					if( result !== undefined )
						for( var i in result )
							if( result.hasOwnProperty( i ))
								settings[i] = result[i];

					if( typeof load_callback === 'function' )
						load_callback();
				}
			);
		}
	};

	/**
	 * @param {string} key
	 */
	this.saveSync = function( key )
	{
		var data_to_save = {};
		data_to_save[key] = settings[key];

		self.getSyncApiObject().set( data_to_save );
	};

	/**
	 * @param {string} key
	 */
	this.saveLocal = function( key )
	{
		var data_to_save = {};
		data_to_save[key] = settings[key];

		self.getLocalApiObject().set( data_to_save );
	};

	/**
	 * Getting browser synchronize storage object to save/load settings and share it between connected browsers.
	 * @return {null|chrome.storage.SyncStorageArea|chrome.storage.LocalStorageArea}
	 */
	this.getSyncApiObject = function()
	{
		var browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.sync !== 'undefined' )
				return browser.storage.sync;
			else
				return self.getLocalApiObject();

		$err( 'No storage container found. Unable to save data!' );
	};

	/**
	 * Getting browser local storage object to save/load only on this browser.
	 * @return {null|chrome.storage.LocalStorageArea}
	 */
	this.getLocalApiObject = function()
	{
		var browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.local !== 'undefined' )
				return browser.storage.local;

		$err( 'No storage container found. Unable to save data!' );
	};

	function findBoardId()
	{
		if( typeof getBrowserObject().tabs === 'undefined' )
			return;

		getBrowserObject().tabs.query(
			{ active: true, currentWindow: true },
			function( tabs )
			{
				var matches = /trello.com\/b\/([a-z0-9]+)\//i.exec( tabs[0].url );

				if( matches && matches.length )
					board_id = matches[1];
				else
					board_id = null;
			}
		);
	}

	function initApiEvents()
	{
		getBrowserObject().runtime.onMessage.addListener(function( message )
		{
			if( typeof message.event === 'undefined' || typeof message.event.code === 'undefined' )
				return;

			if( message.event.code === 'onSettingChanged' )
				settings[message.event.key] = message.event.newValue;
		});
	}

	this.getAllSettings = function()
	{
		return settings;
	}

	this.getAllDefaultSettings = function()
	{
		return default_settings;
	}

	this.removeAllSettings = function()
	{
		self.getSyncApiObject().clear();
		self.getLocalApiObject().clear();
		settings = {};
	}

	init();
}