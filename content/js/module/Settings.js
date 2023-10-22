/**
 * Module to save your settings, for each board separately.
 * @param strelloids
 * @constructor
 */
function ModuleSettings( strelloids )
{
	/**
	 * @type {Settings}
	 */
	let settings;

	/**
	 * @type {string|null}
	 */
	let board_id = null;

	/**
	 * @type {string}
	 */
	let last_board_name;

	/**
	 * @type {{}}
	 */
	let boards_map = {};

	function init()
	{
		settings = new Settings( function()
		{
			strelloids.modules.events.trigger( 'onSettingsLoaded' );
		});
		initApiEvents();
		loadBoardsIds();
		strelloids.modules.events.add( 'onUpdate', update );
	}

	function update()
	{
		let board_name = $( 'input[data-testid="board-name-input"]' );
		if( board_name && last_board_name !== board_name.value )
		{
			strelloids.modules.events.trigger( 'onBoardSwitch' );
			last_board_name = board_name.value;
		}
	}

	/**
	 * @param {string} board_id
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForBoard = function( board_id, key )
	{
		return settings.getForBoard( board_id, key );
	};

	/**
	 * @param {string} list_id
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForList = function( list_id, key )
	{
		return settings.getForList( list_id, key );
	};

	/**
	 * @param {string} list_id
	 * @param {string} key
	 * @param {null|boolean|number|string|array|object} value
	 */
	this.setForList = function( list_id, key, value )
	{
		settings.setForList( list_id, key, value );
	};

	/**
	 * @param {string} list_id
	 * @param {string} key
	 */
	this.resetForList = function( list_id, key)
	{
		settings.resetForList( list_id, key );
	};

	/**
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getForCurrentBoard = function( key )
	{
		return settings.getForBoard( findBoardId(), key );
	};

	/**
	 * @param {string} key
	 * @return {null|boolean|number|string|array|object}
	 */
	this.getGlobal = function( key )
	{
		return settings.getGlobal( key );
	};

	function initApiEvents()
	{
		getBrowserObject().runtime.onMessage.addListener( function( message )
		{
			if( typeof message.event === 'undefined' || typeof message.event.code === 'undefined' )
				return;
			if( message.event.code !== 'onSettingChanged' )
				return;

			if( /^board\./.test( message.event.key ) )
			{
				if( new RegExp( '^board\.'+findBoardId() ).test( message.event.key ))
					strelloids.modules.events.trigger(
						'onBoardSettingsChange',
						message.event.key,
						message.event.newValue,
						message.event.oldValue
					);
			}
			else if( /^list\./.test( message.event.key ) )
				strelloids.modules.events.trigger(
					'onListSettingsChange',
					message.event.key,
					message.event.newValue,
					message.event.oldValue
				);
			else
				strelloids.modules.events.trigger(
					'onGlobalSettingsChange',
					message.event.key,
					message.event.newValue,
					message.event.oldValue
				);

			strelloids.run();
		});
	}

	/**
	 * @return {string|null}
	 */
	function findBoardId()
	{
		let matches = /trello.com\/b\/([a-z0-9]+)\//i.exec( $w.location.toString() );
		let node_board_name = $( 'input[data-testid="board-name-input"]' );

		if( matches && matches.length )
		{
			board_id = matches[1];
			if( node_board_name )
				boards_map[board_id] = node_board_name.value;

			return matches[1];
		}

		if( board_id )
			return board_id;

		if( node_board_name )
			for( let i in boards_map )
				if( boards_map.hasOwnProperty( i ) && boards_map[i] === node_board_name.value )
					return i;

		return null;
	}

	async function loadBoardsIds()
	{
		let json = await fetch( 'https://trello.com/1/members/me?fields=id&boards=all&board_fields=name%2CshortLink' );
		if( DEBUG )
			$log( 'Strelloids: loaded boards ids from api' );
		let response = await json.json();
		
		if( typeof response.boards === 'undefined' )
			return $err( 'Can\'t receive lists from API' );

		for( let i = response.boards.length - 1; i >= 0; --i )
			boards_map[response.boards[i]['shortLink']] = response.boards[i].name;

		strelloids.run();
	}

	init();
}