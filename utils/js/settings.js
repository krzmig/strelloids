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
	}

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
		self.save( option_key );
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

		self.save( key );
	};

	/**
	 * @param {string} key
	 */
	this.resetGlobal = function( key )
	{
		delete settings[key];
		getApiObject().remove( key );
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

				getApiObject().get(
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
		});
	};

	/**
	 * @param {string} key
	 */
	this.save = function( key )
	{
		var data_to_save = {};
		data_to_save[key] = settings[key];

		getApiObject().set( data_to_save );
	};

	/**
	 * Getting browser storage object to save/load settings.
	 * If synchronize object is exists, will be return, if not local will be returned.
	 * @return {*}
	 */
	function getApiObject()
	{
		var browser = getBrowserObject();
		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
			if( typeof browser.storage.sync !== 'undefined' )
				return browser.storage.sync;
			else if( typeof browser.storage.local !== 'undefined' )
				return browser.storage.local;

		$err( 'No storage container found. Unable to save data!' );
	}

	function findBoardId()
	{
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

	init();
}