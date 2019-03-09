( function(){
	'use strict';

	if( window.strelloidsInited )
		return;

	window.strelloidsInited = true;

	var DEBUG = false;

	/**
	 * Main plugin class.
	 * @constructor
	 */
	function Strelloids()
	{
		var self = this;
		var runTimeout = null;
		var delayTimeout = null;
		self.modules = {};

		function init()
		{
			if( DEBUG )
				$log( 'Strelloids: initialized' );

			self.modules.events = new ModuleEvents( self );
			self.modules.settings = new ModuleSettings( self );

			// lists
			self.modules.toggleLists = new ModuleToggleLists( self );
			self.modules.showCardsCounter = new ModuleShowCardsCounter( self );
			self.modules.displayMode = new ModuleDisplayMode( self );
			// cards
			self.modules.showCardShortId = new ModuleShowCardShortId( self );
			self.modules.customTags = new ModuleCustomTags( self );
			self.modules.cardsSeparator = new ModuleCardsSeparator( self );
			self.modules.cardsPrioritization = new ModuleCardsPrioritization( self );
			// scrum
			self.modules.coloredLists = new ModuleColoredLists( self );
			self.modules.scrumTimes = new ModuleScrumTimes( self );
			self.modules.scrumSumTimes = new ModuleScrumSumTimes( self );
			// other
			self.modules.boardScroll = new ModuleBoardScroll( self );

			self.modules.events.add( 'onSettingsLoaded', self.run );
		}

		this.run = function()
		{
			clearTimeout( delayTimeout );
			clearTimeout( runTimeout );
			delayTimeout = setTimeout( doLoop, 100 );
			runTimeout = setTimeout(
				self.run,
				Math.max( 300, parseFloat( self.modules.settings.getGlobal( 'global.loopInterval' )) * 1000 )
			);
		};

		function doLoop(  )
		{
			if( DEBUG )
				var t0 = performance.now();

			self.modules.events.trigger( 'onUpdate' );

			if( DEBUG )
				$dbg( "Strelloids: loop took " + (performance.now() - t0) + " milliseconds.")
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Settings                                                                                              //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module to save your settings, for each board separately.
	 * @param strelloids
	 * @constructor
	 */
	function ModuleSettings( strelloids )
	{
		/** @type {ModuleSettings} */
		var self = this;
		/** @type {object} local settings object copy */
		var settings = {};
		/** @type {object} default setting, will be loaded by ajax from default_settings.json file */
		var default_settings = {};
		/** @type {string|null} */
		var board_id = null;

		function init()
		{
			initApiEvents();
			self.load();
			strelloids.modules.events.add( 'onUpdate', update );
		}

		function update()
		{
			loadListsIds();
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
			else if( typeof default_settings['board.*'][key] !== 'undefined' )
				return default_settings['board.*'][key];
			else
				return null;
		};

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
			self.save( option_key );
		};

		/**
		 * @param {string} key
		 * @return {null|boolean|number|string|array|object}
		 */
		this.getForCurrentBoard = function( key )
		{
			return self.getForBoard( findBoardId(), key );

		};

		/**
		 * @param {string} key
		 * @return {null|boolean|number|string|array|object}
		 */
		this.getGlobal = function( key )
		{
			if( typeof settings[key] !== 'undefined' )
				return settings[key];
			else if( typeof default_settings[key] !== 'undefined' )
				return default_settings[key];
			else
				return null;
		};

		/**
		 * Load settings for all boards, from browser.
		 */
		this.load = function()
		{
			if( DEBUG )
				$log( 'Strelloids: trying to load settings' );

			new Ajax({
				url: getBrowserObject().extension.getURL('default_settings.json'),
				onDone: function( response ) {
					default_settings = JSON.parse( response );
					getApiObject().get(
						null,
						function( result )
						{
							if( DEBUG )
								$log( 'Strelloids: loaded setting: ', result );

							if( result !== undefined )
								for( var i in result )
									if( result.hasOwnProperty( i ))
										settings[i] = result[i];

							strelloids.modules.events.trigger( 'onSettingsLoaded' );
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
			if( DEBUG )
				$log( 'Strelloids: trying to save settings' );
			getApiObject().set(
				data_to_save,
				function()
				{
					if( DEBUG )
						$log( 'Strelloids: saved data for key', key, ':', settings[key] );
				}
			);
		};

		function initApiEvents()
		{
			getBrowserObject().storage.onChanged.addListener(function( changes )
			{
				if( DEBUG )
					$log( 'Strelloids: storage changed event:', changes );

				var changed_settings = [];
				var changed_global = [];
				var changed_board = [];
				var changed_list = [];

				for( var i in changes )
					if( changes.hasOwnProperty( i ))
					{
						settings[i] = changes[i].newValue;

						if( /board\./.test( i ) )
							changed_board.push( i );
						else if( /list\./.test( i ) )
							changed_list.push( i );
						else
							changed_global.push( i );
						changed_settings.push( i );
					}

				if( changed_global.length )
					strelloids.modules.events.trigger( 'onGlobalSettingsChange', changed_list );
				if( changed_board.length )
					strelloids.modules.events.trigger( 'onBoardSettingsChange', changed_board );
				if( changed_list.length )
					strelloids.modules.events.trigger( 'onListSettingsChange', changed_global );

				strelloids.modules.events.trigger( 'onSettingsChange', changed_settings );

				strelloids.run();
			});
		}

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

		/**
		 * @return {string|null}
		 */
		function findBoardId()
		{
			var matches = /trello.com\/b\/([a-z0-9]+)\//i.exec( $w.location.toString() );
			var node_board_name = $( '.board-header-btn-name' );

			if( matches && matches.length )
			{
				board_id = matches[1];
				if( node_board_name )
				{
					var option_key = 'board.'+board_id;
					if( typeof settings[option_key] === 'undefined' )
						settings[option_key] = {};

					settings[option_key].board_name = node_board_name.innerText;
				}
				return matches[1];
			}
			else if( board_id )
			{
				return board_id;
			}
			else
			{
				if( !node_board_name )
					return null;

				var board_name = node_board_name.innerText;
				for( var i in settings )
				{
					if( !settings.hasOwnProperty( i ))
						continue;
					if( i.substr( 0, 6 ) !== 'board.' )
						continue;
					if( settings[i].board_name === board_name )
						return i.substr( 6 );
				}

				return null;
			}
		}

		/**
		 * Loading list ids and signed them to html nodes, because by default trello don't give any possibility
		 * to recognize single list, other than by the title.
		 */
		function loadListsIds()
		{
			var board_id = findBoardId();
			if( !$( '#board > .js-list:not([id])' ) || !board_id )
				return;

			if( DEBUG )
				$log( 'Strelloids: trying to load boards ids from api' );

			new Ajax({
				url: 'https://trello.com/1/Boards/' + board_id + '?lists=open&list_fields=name,closed,idBoard,pos',
				onDone: function( raw_response )
				{
					if( DEBUG )
						$log( 'Strelloids: loaded boards ids from api' );

					var response = JSON.parse( raw_response );
					if( typeof response.lists === 'undefined' )
						return $err( 'Can\'t receive lists from API' );

					var lists_containers = $$( '#board > .js-list' );
					if( response.lists.length !== lists_containers.length )
						return $err( 'List on page and from API didn\'t match, response:', response );

					for( var i = 0; i < response.lists.length; ++i )
						lists_containers[i].setAttribute( 'id', 'list-' + response.lists[i].id );

					strelloids.run();
				}
			});
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - For local events                                                                                      //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module will trigger local script events for automation modules logic.
	 * @param strelloids
	 * @constructor
	 */
	function ModuleEvents( strelloids )
	{
		var events_list = {
			onUpdate: [],
			onSettingsLoaded: [],
			onSettingsChange: [],
			onGlobalSettingsChange: [],
			onBoardSettingsChange: [],
			onListSettingsChange: []
		};

		/**
		 * @param {string} event
		 * @param {function} callback
		 */
		this.add = function( event, callback )
		{
			if( typeof events_list[event] === 'undefined' )
				$err( 'Strelloids: Unknown event: ', event );
			if( typeof callback !== 'function' )
				$err( 'Strelloids: Wrong callback type' );

			events_list[event].push( callback );
		};

		/**
		 * @param {string} event
		 * @param {function} callback
		 */
		this.remove = function( event, callback )
		{
			if( typeof events_list[event] === 'undefined' )
				$err( 'Strelloids: Unknown event: ', event );

			for( var i = events_list[event].length - 1; i >= 0; --i )
				if( events_list[event][i] === callback )
					events_list = events_list.splice( i, 1 );
		};

		/**
		 * @param {string} event
		 */
		this.trigger = function( event )
		{
			if( typeof events_list[event] === 'undefined' )
				$err( 'Strelloids: Unknown event: ', event );

			var args = Array.prototype.slice.call( arguments, 1 );

			for( var i = events_list[event].length - 1; i >= 0; --i )
				events_list[event][i].apply( null, args );
		};
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Colored lists for scrum                                                                               //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module will set list background color depending on their title and containing keywords.
	 * @param strelloids
	 * @constructor
	 */
	function ModuleColoredLists( strelloids )
	{
		var self = this;
		var settingName = 'coloredLists';
		var wasEnabled = null;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if( !self.isEnabled() )
				return;

			var lists_titles = $$( 'textarea.list-header-name' );
			for( var i = lists_titles.length - 1; i >= 0; --i )
				setListColor(
					closest( lists_titles[i], '.list' ),
					lists_titles[i].value
				);
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var lists = $$( '.list' );
			for( var i = lists.length - 1; i >= 0; --i )
				lists[i].style.backgroundColor = '';
		}

		/**
		 * @param {HTMLElement} list
		 * @param {string} title
		 */
		function setListColor( list, title )
		{
			if( title.match( /todo/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.toDo' );
			else if( title.match( /helpdesk/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.helpdesk' );
			else if( title.match( /(sprint|stories)/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.sprint' );
			else if( title.match( /backlog/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.backlog' );
			else if( title.match( /test/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.test' );
			else if( title.match( /(progress|working|doing)/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.doing' );
			else if( title.match( /upgrade/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.upgrade' );
			else if( title.match( /(done|ready)/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.done' );
			else if( title.match( /fix/i ))
				list.style.backgroundColor = strelloids.modules.settings.getGlobal( 'module.coloredLists.color.fix' );
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Show cards counter                                                                                    //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module shows counter of cards below list title.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleShowCardsCounter( strelloids )
	{
		var self = this;
		var settingName = 'showCardsCounter';
		var wasEnabled = null;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var counters = $$('.list-header-num-cards.hide');
			for( var i = counters.length - 1; i >= 0; --i )
				counters[i].classList.remove( 'hide' );
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var counters = $$('.list-header-num-cards');
			for( var i = counters.length - 1; i >= 0; --i )
				counters[i].classList.add( 'hide' );
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Show card short ID                                                                                    //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module shows on lists short card ID, which you can normally find inside card, after click Share button.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleShowCardShortId( strelloids )
	{
		var self = this;
		var settingName = 'showCardShortId';
		var wasEnabled = null;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var ids = $$('.card-short-id.hide');
			for( var i = ids.length - 1; i >= 0; --i )
				ids[i].classList.remove( 'hide' );
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var ids = $$('.card-short-id');
			for( var i = ids.length - 1; i >= 0; --i )
				ids[i].classList.add( 'hide' );
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Custom tags                                                                                           //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module will replace tags inside cards titles with colored labels.
	 * Tags must be inside square brackets and must contains at least one letter, space, underscore or dash.
	 * Tags colors is depends on content inside brackets, and not case.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleCustomTags( strelloids )
	{
		var self = this;
		var settingName = 'customTags';
		var wasEnabled = null;
		var tag_regex = /\[([^\]]*[a-z_ -][^\]]*)\]/ig;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );

				if( !text_node )
					continue;

				if( !cards_titles[i].getAttribute( 'data-original-title' ))
					cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

				if( !tag_regex.test( text_node.nodeValue ))
					continue;

				removeOldTags( cards_titles[i] );
				appendNewTags( cards_titles[i], text_node );

				text_node.nodeValue = text_node.nodeValue.replace( tag_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var cards_titles = $$('.list-card-title');
			var text_node = null;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );

				if( !text_node )
					continue;

				removeOldTags( cards_titles[i] );

				if( cards_titles[i].getAttribute( 'data-original-title' ))
					text_node.nodeValue = cards_titles[i].getAttribute( 'data-original-title' );

			}
		}

		/**
		 * @param {HTMLElement} element
		 */
		function removeOldTags( element )
		{
			var old_tags = element.querySelectorAll( '.card-tag' );
			for( var i = old_tags.length - 1; i >= 0; --i )
				element.removeChild( old_tags[i] );
		}

		/**
		 * @param {HTMLElement} card_title
		 * @param {HTMLElement} title
		 */
		function appendNewTags( card_title, title )
		{
			tag_regex.lastIndex = 0;

			var matches;
			while(( matches = tag_regex.exec( title.nodeValue ) ) !== null )
			{
				var tag = createNode(
					'span',
					{ 'class': [ 'card-tag' ] },
					matches[1]
				);
				tag.style.backgroundColor = determinateTagColor( matches[1] );
				card_title.insertBefore( tag, title );
			}
		}

		/**
		 * @param {string} tag
		 * @return {string}
		 */
		function determinateTagColor( tag )
		{
			var chars = tag.split('').map( function( a ){ return a.charCodeAt( 0 ) });
			var i, h;

			for(i = 0, h = 0x1e7244ca; i < tag.length; i++)
				h = Math.imul( h ^ tag.charCodeAt(i), 1852095058 );
			h = (( h ^ h >>> 16 ) >>> 0 ) % 360;

			var s = 0;
			for( i = chars.length - 1; i >= 0; i = i - 2 )
				s += chars[i]* i;
			s = h % 20;

			var l = 0;
			for( i = chars.length - 2; i >= 0; i = i - 2 )
				l += chars[i] * i;
			l = h % 30;

			return 'hsl(' + h + ',' + ( 65 + s ) + '%,' + ( 55 + l ) + '%)';
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Display mode                                                                                          //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module toggles view mode, between:
	 * 		default - default trello view
	 * 		multiple rows - you scroll page vertically instead of horizontally
	 * 		table
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleDisplayMode( strelloids )
	{
		var self = this;
		var settingName = 'displayMode';
		var lastMode = null;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			var mode = self.getMode();
			if( mode === 'multi-rows' )
				enableMultiRows();
			else if( mode === 'table' )
				enableTable();
		}

		/**
		 * @return {string}
		 */
		this.getMode = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var mode = self.getMode();

			if( mode !== lastMode )
			{
				if( DEBUG )
					$log( 'Strelloids: view mode changed from: ' + lastMode + '; to: ' + mode );

				if( lastMode === 'table' )
					disableTable();
				else if( lastMode === 'multi-rows' )
					disableMultiRows();
			}
			lastMode = mode;
		}

		function enableMultiRows()
		{
			var board = $_( 'board' );
			if( !board || board.classList.contains( 'board-multiple-rows' ) )
				return;

			board.classList.add( 'board-multiple-rows' );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' } ) );
		}

		function disableMultiRows()
		{
			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-multiple-rows' ))
				return;

			board.classList.remove( 'board-multiple-rows' );
			for( var i = board.children.length - 1; i >= 0; --i )
				if( board.children[i].classList.contains( 'flex-placeholder' ))
					board.removeChild( board.children[i] );
		}

		function enableTable()
		{
			var board = $_( 'board' );
			if( board && !board.classList.contains( 'board-table-view' ))
				board.classList.add( 'board-table-view' );
		}

		function disableTable()
		{
			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-table-view' ))
				return;

			board.classList.remove( 'board-table-view' );
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Toggle lists visibility                                                                               //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module allow you to hide selected lists from list menu (right top corner).
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleToggleLists( strelloids )
	{
		function init()
		{
			if( DEBUG )
				$log( 'Strelloids: module toggleLists initialized' );

			$d.addEventListener(
				'click',
				function( e )
				{
					if( !e.target.classList.contains( 'list-visibility-switcher' ))
						return true;

					var list = closest( e.target, '.js-list' );
					var list_id = list.id.replace( 'list-', '' );

					toggleVisibility( list_id );
				},
				true
			);
			strelloids.modules.events.add( 'onUpdate', update );
		}

		function update()
		{
			var lists = $$( '#board > .js-list' );
			for( var i = lists.length - 1; i >= 0; --i )
			{
				var id = lists[i].id.replace( 'list-', '' );
				lists[i].classList.toggle(
					'list-hidden',
					strelloids.modules.settings.getForList( id, 'hidden' )
				);
			}
			appendToggleOption();
		}

		function appendToggleOption()
		{
			var headers = $$('.list-header');
			for( var i = headers.length - 1; i >= 0; --i )
				if( !headers[i].querySelector( '.list-visibility-switcher' ))
					headers[i].insertBefore(
						createNode( 'span', { 'class': 'list-visibility-switcher' }),
						headers[i].firstChild
					);
		}

		/**
		 * @param {string} list_id
		 */
		function toggleVisibility( list_id )
		{
			if( strelloids.modules.settings.getForList( list_id, 'hidden' ))
			{
				if( DEBUG )
					$log( 'Strelloids: module toggleList - list', list_id, 'shown in' );

				strelloids.modules.settings.setForList( list_id, 'hidden', false );
				$_( 'list-' + list_id ).classList.remove( 'list-hidden' );
			}
			else
			{
				if( DEBUG )
					$log( 'Strelloids: module toggleList - list', list_id, 'hidden' );

				strelloids.modules.settings.setForList( list_id, 'hidden', true );
				$_( 'list-' + list_id ).classList.add( 'list-hidden' );
			}
			$( '.pop-over' ).classList.remove('is-shown');
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Scrum times                                                                                           //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module to show estimation and consumption points for cards.
	 * Estimation points should be inside round brackets, consumption in square ones.
	 * It's possible to use fractions, with dot as separator.
	 * Question mark can be used eg. for big tasks which should be split.
	 * It's possible to enter times for two teams, to do that values should be separated by `/`.
	 * Teams will get different colors for the times.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleScrumTimes( strelloids )
	{
		var self = this;
		var settingName = 'scrumTimes';
		var wasEnabled = null;
		var estimation_regex = /\(([0-9\.]*|\?)\/?([0-9\.]*?|\?)\)/i;
		var consumption_regex = /\[([0-9\.]*|\?)\/?([0-9\.]*?|\?)\]/i;
		var last_cards_amount = 0;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');

			if( last_cards_amount !== cards_titles.length )
				strelloids.modules.scrumSumTimes.needUpdate = true;

			last_cards_amount = cards_titles.length;
			var text_node = null, container = null;
			var matches, matches2;

			var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
			var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
			var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
			var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );

			for( var i = last_cards_amount - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );
				if( !text_node )
					continue;

				if( !cards_titles[i].getAttribute( 'data-original-title' ))
					cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

				matches = estimation_regex.exec( text_node.nodeValue );
				matches2 = consumption_regex.exec( text_node.nodeValue );
				if( !matches && !matches2 )
					continue;

				container = createContainer( cards_titles[i] );
				strelloids.modules.scrumSumTimes.needUpdate = true;

				if( matches && matches[1] && showEstimation && showTeam1 )
					container.appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'estimation', 'team1' ] },
							matches[1]
						)
					);

				if( matches && matches[2] && showEstimation && showTeam2 )
					container.appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'estimation', 'team2' ] },
							matches[2]
						)
					);

				if( matches2 && matches2[1] && showConsumption && showTeam1 )
					container.appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'consumption', 'team1' ] },
							matches2[1]
						)
					);

				if( matches2 && matches2[2] && showConsumption && showTeam2 )
					container.appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'consumption', 'team2' ] },
							matches2[2]
						)
					);

				text_node.nodeValue = text_node.nodeValue.replace( estimation_regex, '' ).replace( consumption_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		}

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function globalSettingsChanged()
		{
			$b.style.setProperty(
				'--strelloids-scrum-times-bg-team1',
				strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.bgTeam1' )
			);
			$b.style.setProperty(
				'--strelloids-scrum-times-font-team1',
				strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.fontTeam1' )
			);
			$b.style.setProperty(
				'--strelloids-scrum-times-bg-team2',
				strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.bgTeam2' )
			);
			$b.style.setProperty(
				'--strelloids-scrum-times-font-team2',
				strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.fontTeam2' )
			);
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var cards_titles = $$('.list-card-title');
			var text_node = null;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );
				if( !text_node )
					continue;

				removeOldTags( cards_titles[i] );

				if( cards_titles[i].getAttribute( 'data-original-title' ))
					text_node.nodeValue = cards_titles[i].getAttribute( 'data-original-title' );

			}
		}

		/**
		 * @param {HTMLElement} card_title
		 */
		function removeOldTags( card_title )
		{
			var old_tags = card_title.parentNode.querySelectorAll( '.scrum-label' );
			for( var i = old_tags.length - 1; i >= 0; --i )
				old_tags[i].parentNode.removeChild( old_tags[i] );
		}

		/**
		 * @param {HTMLElement} card_title
		 * @return {HTMLElement}
		 */
		function createContainer( card_title )
		{
			var container = card_title.parentNode.querySelector( '.scrum-points-container' );
			if( container )
			{
				removeOldTags( card_title );
			}
			else
			{
				container = createNode( 'div', { 'class': 'scrum-points-container' });
				card_title.parentNode.appendChild( container );
			}
			return container;
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Scrum sum times                                                                                       //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module that will sum times from ModuleScrumTimes and show them for each list.
	 * ModuleScrumTimes is required to be enabled.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleScrumSumTimes( strelloids )
	{
		var self = this;
		var settingName = 'scrumSumTimes';
		var wasEnabled = null;
		/** @type {boolean} value determine if times should be recalculated, it's for optimization/ */
		this.needUpdate = true;

		function init(  )
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if( !self.isEnabled() || !self.needUpdate )
				return;

			var lists = $$('#board > .js-list');
			var container;

			var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
			var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
			var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
			var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );

			for( var i = lists.length - 1; i >= 0; --i )
			{
				container = createContainer( lists[i] );

				if( showEstimation && showTeam1 )
					sumTimes( lists[i], container, 'estimation', 'team1' );
				if( showEstimation && showTeam2 )
					sumTimes( lists[i], container, 'estimation', 'team2' );
				if( showConsumption && showTeam1 )
					sumTimes( lists[i], container, 'consumption', 'team1' );
				if( showConsumption && showTeam2 )
					sumTimes( lists[i], container, 'consumption', 'team2' );
			}
			self.needUpdate = false;
		}

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.scrumTimes.isEnabled() && strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged(  )
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			self.needUpdate = true;
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var containers = $$('.list-header .scrum-sum-container');

			for( var i = containers.length - 1; i >= 0; --i )
				containers[i].parentNode.removeChild( containers[i] );
		}

		/**
		 * @param {HTMLElement} list
		 * @return {HTMLElement}
		 */
		function createContainer( list )
		{
			var container = list.querySelector( '.scrum-sum-container' );
			if( container )
			{
				while( container.lastChild )
					container.removeChild( container.lastChild );
			}
			else
			{
				container = createNode( 'div', { 'class': 'scrum-sum-container' });
				list.querySelector( '.list-header' ).appendChild( container );
			}
			return container;
		}

		/**
		 * @param {HTMLElement} list
		 * @param {HTMLElement} labels_container
		 * @param {string} mode - estimation or consumption
		 * @param {string} team - team1 or team2
		 */
		function sumTimes( list, labels_container, mode, team )
		{
			var sum = 0;
			var labels = list.querySelectorAll( '.scrum-label.' + mode + '.' + team );
			for( var i = labels.length - 1; i >= 0; --i )
				sum += isNaN( labels[i].innerText ) ? 0 : parseFloat( labels[i].innerText );

			if( sum > 0 )
				labels_container.appendChild(
					createNode(
						'span',
						{ 'class': [ 'scrum-label', mode, team ]},
						( Math.round( sum * 100 ) / 100 ).toString()
					)
				);
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Cards Separator                                                                                       //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module will change cards, which titles are started by `---` or `===` into styled separator.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleCardsSeparator( strelloids )
	{
		var self = this;
		var settingName = 'cardsSeparator';
		var wasEnabled = null;
		var separator_regex = /^[=-]{3,}/;
		var separator_regex_end = /[=-]{3,}$/;

		function init(  )
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );

				if( !text_node )
					continue;

				if( !cards_titles[i].getAttribute( 'data-original-title' ))
					cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

				if( !separator_regex.test( text_node.nodeValue ))
					continue;

				var card = closest( cards_titles[i], '.list-card' );
				card.classList.add( 'card-separator' );

				text_node.nodeValue = text_node.nodeValue.replace( separator_regex, '' ).replace( separator_regex_end, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var cards = $$('.card-separator');
			var text_node = null;

			for( var i = cards.length - 1; i >= 0; --i )
			{
				var card_title = cards[i].querySelector('.list-card-title');
				text_node = findTextNode( card_title );

				cards[i].classList.remove( 'card-separator' );

				if( text_node && card_title.getAttribute( 'data-original-title' ))
					text_node.nodeValue = card_title.getAttribute( 'data-original-title' );
			}
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Board scroll                                                                                          //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module will allow you to scroll board horizontally (in default view mode), without holding shift key.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleBoardScroll( strelloids )
	{
		var scroll_started_on_board = false;

		function init()
		{
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
		}

		function globalSettingsChanged()
		{
			if( strelloids.modules.settings.getGlobal( 'global.enableBoardScroll' ))
			{
				$w.addEventListener('wheel', doScroll );
				$w.addEventListener( 'mousemove', clearStartNode );
			}
			else
			{
				$w.removeEventListener('wheel', doScroll );
				$w.removeEventListener( 'mousemove', clearStartNode );
			}
		}

		function doScroll( e )
		{
			if( strelloids.modules.settings.getForCurrentBoard( 'displayMode' ) !== 'default' )
				return;

			if( e.shiftKey )
				return;

			var target = e.target;

			while( target.parentNode )
			{
				if( scroll_started_on_board || target.id === 'board' )
				{
					e.preventDefault();
					var board = $_('board');
					board.scrollLeft = board.scrollLeft + Math.max( Math.min( e.deltaY * 16, 50 ), -50 );
					scroll_started_on_board = true;
					return;
				}
				else if( target.classList.contains( 'list' ))
				{
					scroll_started_on_board = false;
					return;
				}
				target = target.parentNode;
			}
		}

		function clearStartNode()
		{
			scroll_started_on_board = false;
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Prioritization of cards                                                                               //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module display colored border of cards, based on keywords in card title like: !1 !2 !3 !4 or !5, where !1 is the
	 * highest.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleCardsPrioritization( strelloids )
	{
		var self = this;
		var settingName = 'cardsPrioritization';
		var wasEnabled = null;
		var tag_regex = /(^|\s)!([1-5])($|\s)/i;

		function init(  )
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );

				if( !text_node )
					continue;

				if( !cards_titles[i].getAttribute( 'data-original-title' ))
					cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

				var matches;
				if(( matches = tag_regex.exec( text_node.nodeValue )) === null )
					continue;

				setPriority( cards_titles[i], parseInt( matches[2] ));

				text_node.nodeValue = text_node.nodeValue.replace( tag_regex, ' ' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged()
		{
			var isEnabled = self.isEnabled();
			if( !isEnabled && wasEnabled )
				disable();
			else if( isEnabled && !wasEnabled )
				enable();

			wasEnabled = isEnabled;

			return isEnabled;
		}

		function enable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );
		}

		function disable()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			var cards = $$('.list-card.priority-set');
			var text_node = null;

			for( var i = cards.length - 1; i >= 0; --i )
			{
				var card_title = cards[i].querySelector( '.list-card-title' );
				text_node = findTextNode( card_title );

				if( !text_node )
					continue;

				clearPriority( cards[i] );

				if( card_title.getAttribute( 'data-original-title' ))
					text_node.nodeValue = card_title.getAttribute( 'data-original-title' );

			}
		}

		function globalSettingsChanged()
		{
			$b.style.setProperty(
				'--strelloids-card-priority-critical',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.critical' )
			);
			$b.style.setProperty(
				'--strelloids-card-priority-high',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.high' )
			);
			$b.style.setProperty(
				'--strelloids-card-priority-medium',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.medium' )
			);
			$b.style.setProperty(
				'--strelloids-card-priority-low',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.low' )
			);
			$b.style.setProperty(
				'--strelloids-card-priority-lowest',
				strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.lowest' )
			);
		}

		/**
		 * @param {HTMLElement} card
		 */
		function clearPriority( card )
		{
			card.classList.remove( 'priority-set', 'priority-critical', 'priority-high', 'priority-medium', 'priority-low', 'priority-lowest' );
		}

		/**
		 * @param {HTMLElement} card_title
		 * @param {int} priority
		 */
		function setPriority( card_title, priority )
		{
			var card = closest( card_title, '.list-card' );
			card.classList.add( 'priority-set' );

			if( priority === 1 )
				card.classList.add( 'priority-critical' );
			else if( priority === 2 )
				card.classList.add( 'priority-high' );
			else if( priority === 3 )
				card.classList.add( 'priority-medium' );
			else if( priority === 4 )
				card.classList.add( 'priority-low' );
			else if( priority === 5 )
				card.classList.add( 'priority-lowest' );
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Helper functions                                                                                               //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create HTML node
	 * @param {string} type
	 * @param {object} [params]
	 * @param {string} [text_node]
	 * @returns {HTMLElement}
	 */
	function createNode( type, params, text_node )
	{
		var node = $d.createElement( type );
		for( var i in params )
		{
			if( !params.hasOwnProperty( i ))
				continue;

			if( ['id','name','type','value','min','max','src'].indexOf( i ) >= 0 )
				node[i] = params[i];
			else if( i === 'class' && isstr( params[i] ))
				node.className = params[i];
			else if( i === 'class' && isobj( params[i] ))
			{
				for( var j in params[i] )
					if( params[i].hasOwnProperty( j ))
						node.classList.add( params[i][j] );
			}
			else
				node.setAttribute( i, params[i] );
		}
		if( typeof text_node !== 'undefined' )
			node.appendChild( $d.createTextNode( text_node ));

		return node;
	}

	/**
	 * @param variable
	 * @return {boolean}
	 */
	function isstr( variable )
	{
		return typeof variable === 'string';
	}

	/**
	 * @param variable
	 * @return {boolean}
	 */
	function isobj( variable )
	{
		return typeof variable === 'object';
	}

	/**
	 * @param variable
	 * @return {boolean}
	 */
	function isfunc( variable )
	{
		return typeof variable === 'function';
	}

	/**
	 * Finding closest parent, matching to given selector
	 * @param {HTMLElement} node
	 * @param {string} selector
	 * @return {null|HTMLElement}
	 */
	function closest( node, selector )
	{
		var parent = node;

		while( parent && !parent.matches( selector ))
			parent = parent.parentNode;

		return parent;
	}

	/**
	 * @param {HTMLElement} element
	 * @return {null|HTMLElement}
	 */
	function findTextNode( element )
	{
		for( var i = 0; i < element.childNodes.length; ++i )
			if( element.childNodes[i].nodeType === Node.TEXT_NODE )
				return element.childNodes[i];

		return null;
	}

	/**
	 * @param {Object} obj_params
	 * @param {string} obj_params.url
	 * @param {string} [obj_params.method]
	 * @param {Object} [obj_params.data]
	 * @param {function} [obj_params.onError]
	 * @param {function} [obj_params.onLoad]
	 * @param {function} [obj_params.onProgress]
	 * @param {function} [obj_params.onDone]
	 * @param {boolean} [obj_params.async]
	 * @param {Array} [obj_params.headers]
	 * @param {string} [obj_params.contentType]
	 * @param {boolean} [obj_params.disableCache]
	 */
	function Ajax( obj_params )
	{
		var default_params = {
			method: 'GET',
			async: true,
			disableCache: false,
			contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
			data: {}
		};

		for( var i in default_params )
			if( typeof obj_params[i] === 'undefined' )
				obj_params[i] = default_params[i];

		if( typeof obj_params.url === 'undefined' )
			return $err('No url given');

		var http_request = new XMLHttpRequest();
		if( !http_request )
			return alert( 'Your browser don\'t support ajax request, please upgrade your browser or choose another.' );

		http_request.overrideMimeType('text/plain');

		var ret = [];
		for( i in obj_params.data )
		{
			if( !obj_params.data.hasOwnProperty( i ))
				continue;
			if( isobj( obj_params.data[i] ))
				obj_params.data[i] = JSON.stringify( obj_params.data[i] );
			ret.push( encodeURIComponent( i ) + "=" + encodeURIComponent( obj_params.data[i] ));
		}

		http_request.open(
			obj_params.method.toUpperCase(),
			obj_params.url+( ret.length ? '?'+ret.join("&") : '' ),
			obj_params.async
		);

		if( obj_params.disableCache )
			http_request.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
		if( obj_params.contentType )
			http_request.setRequestHeader( 'Content-type', obj_params.contentType );
		if( obj_params.responseType )
			http_request.responseType = obj_params.responseType;

		if( isfunc( obj_params.onProgress ))
			http_request.onprogress = obj_params.onProgress;
		if( isfunc( obj_params.onError ))
			http_request.onerror = obj_params.onError;
		if( isfunc( obj_params.onDone ))
			http_request.onloadend = function()
			{
				if( http_request.readyState === 4)
				{
					if( http_request.status === 0 || ( http_request.status >= 200 && http_request.status < 400 ))
						obj_params.onDone(
							!obj_params.responseType || obj_params.responseType === 'document' ? http_request.responseText : http_request.response );
					else if( isfunc( obj_params.onError ))
						obj_params.onError( http_request );
				}
			};
		if( isfunc( obj_params.onLoad ))
			http_request.onloadstart = obj_params.onLoad;

		http_request.send();
	}

	/**
	 * Translations
	 * @param {string} message_key
	 * @return {string}
	 * @private
	 */
	function _( message_key )
	{
		var browser = getBrowserObject();
		if( typeof browser.i18n !== 'undefined' && typeof browser.i18n.getMessage === 'function' )
			return browser.i18n.getMessage( message_key );
		else
			return '';
	}

	/**
	 * Return `browser` object, depending on current browser
	 * @return {object}
	 */
	function getBrowserObject()
	{
		if( typeof browser !== 'undefined' )
			return browser;
		else if( typeof chrome !== 'undefined' )
			return chrome;
		else if( typeof msBrowser !== 'undefined' )
			return msBrowser;
	}

	var $w = window,
		$d = document,
		$b = $d.body,
		$_ = $d.getElementById.bind( $d ),
		$ = $d.querySelector.bind( $d ),
		$$ = $d.querySelectorAll.bind( $d ),
		$log = console.log,
		$wrn = console.warn,
		$err = console.error,
		$dbg = console.debug,
		$trc = console.trace;

	new Strelloids();
})();