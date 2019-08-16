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
			// card editing
			self.modules.tabKeyInTextarea = new ModuleTabKeyInTextarea( self );
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

				for( var i in changes )
					if( changes.hasOwnProperty( i ))
					{
						settings[i] = changes[i].newValue;

						if( /^board\./.test( i ) )
						{
							if( new RegExp( '^board\.'+findBoardId() ).test( i ))
								strelloids.modules.events.trigger( 'onBoardSettingsChange', i, settings[i], changes[i].oldValue );
						}
						else if( /^list\./.test( i ) )
							strelloids.modules.events.trigger( 'onListSettingsChange', i, settings[i], changes[i].oldValue );
						else
							strelloids.modules.events.trigger( 'onGlobalSettingsChange', i, settings[i], changes[i].oldValue );
					}

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

	/**
	 * Module will trigger local script events for automation modules logic.
	 * @param strelloids
	 * @constructor
	 */
	function ModuleEvents( strelloids )
	{
		var self = this;
		var events_list = {
			onUpdate: [],
			onSettingsLoaded: [],
			onGlobalSettingsChange: [],
			onBoardSettingsChange: [],
			onListSettingsChange: [],
			onListTitleChanged: [],
			onCardEditOpened: [],
			onCardTitleChanged: [],
			onCardDescriptionKeyDown: [],
			onCardCommentKeyDown: [],
			onCardDescriptionKeyUp: [],
			onCardCommentKeyUp: []
		};

		function init()
		{
			getBrowserObject().runtime.onMessage.addListener( function( message )
			{
				if( typeof message.event === 'undefined' || typeof message.event.code === 'undefined' )
					return;

				if( typeof events_list[message.event.code] !== 'undefined' )
					self.trigger( message.event.code );
			});
			$d.addEventListener( 'change', function( e )
			{
				if( e.target.classList.contains( 'mod-card-back-title' ))
					self.trigger( 'onCardTitleChanged', e );
				else if( e.target.classList.contains( 'list-header-name' ))
					self.trigger( 'onListTitleChanged', e );
			});
			$d.addEventListener( 'keydown', function( e )
			{
				if( e.target.classList.contains( 'card-description' ))
					self.trigger( 'onCardDescriptionKeyDown', e );
				else if( e.target.classList.contains( 'comment-box-input' ))
					self.trigger( 'onCardDescriptionKeyDown', e );
			}, true );
			$d.addEventListener( 'keyup', function( e )
			{
				if( e.target.classList.contains( 'card-description' ))
					self.trigger( 'onCardDescriptionKeyUp', e );
				else if( e.target.classList.contains( 'comment-box-input' ))
					self.trigger( 'onCardDescriptionKeyUp', e );
			} );
		}

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

		init();
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
		var schemeSettingName = 'module.coloredLists.scheme';

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
			strelloids.modules.events.add( 'onListTitleChanged', listTitleChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChange );
		}

		function update()
		{
			if( !self.isEnabled() )
				return;

			var lists_titles = $$( 'textarea.list-header-name' );
			for( var i = lists_titles.length - 1; i >= 0; --i )
				if( lists_titles[i].value !== lists_titles[i].getAttribute( 'data-cache-title' ))
					setListColor(
						closest( lists_titles[i], '.list' ),
						lists_titles[i]
					);
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
		}

		function globalSettingsChange( key )
		{
			if( key === schemeSettingName )
			{
				var lists_titles = $$( 'textarea.list-header-name' );
				for( var i = lists_titles.length - 1; i >= 0; --i )
					lists_titles[i].removeAttribute( 'data-cache-title' );

				update();
			}
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
		 * @param {HTMLElement} title
		 */
		function setListColor( list, title )
		{
			var scheme = strelloids.modules.settings.getGlobal( schemeSettingName );
			var regex;

			list.style.backgroundColor = '';

			for( var i = 0, l = scheme.length; i < l; ++i )
			{
				regex = new RegExp( scheme[i].pattern, 'i' );
				if( regex.test( title.value ))
					list.style.backgroundColor = scheme[i].color;
			}

			title.setAttribute( 'data-cache-title', title.value );
		}

		function listTitleChanged( e )
		{
			var list = closest( e.target, '.list' );
			setListColor( list, e.target );
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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
		var tag_regex = /\[([^\]]*[a-z_ -][^\]]*)\]/ig;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
			strelloids.modules.events.add( 'onCardEditOpened', UI.init );
			strelloids.modules.events.add( 'onCardTitleChanged', UI.cardTitleChanged );
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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

		var UI = {
			init: function()
			{
				if(	!self.isEnabled() )
					return;

				var ui_container = $('.card-detail-data');
				if( $( '.custom-tags-ui' ) || !ui_container)
					return;

				var title = $('textarea.mod-card-back-title');
				var container = createNode( 'div', { 'class': ['card-detail-item', 'custom-tags-ui'] } );
				container.appendChild(createNode(
					'h3',
					{ 'class': 'card-detail-item-header' },
					' ' + _( 'card_edit_customTags' )
				));
				var add_btn = createNode( 'a', { 'class': [ 'card-detail-item-add-button', 'dark-hover' ] });
				add_btn.appendChild( createNode( 'span', { 'class': [ 'icon-sm', 'icon-add' ]}));
				add_btn.addEventListener( 'click', UI.appendNewInput );
				container.appendChild( add_btn );
				UI.appendInputs( container, title.value );
				ui_container.prepend( container );
			},
			/**
			 * @param {HTMLElement} container
			 * @param {string} title
			 */
			appendInputs: function( container, title )
			{
				tag_regex.lastIndex = 0;

				var matches;
				while(( matches = tag_regex.exec( title ) ) !== null )
					UI.appendInput( container, matches[1] );
			},

			appendInput: function( container, content )
			{
				var tag = createNode(
					'input',
					{ name: 'custom-tag-input', 'data-value': content, value: content }
				);
				tag.style.backgroundColor = determinateTagColor( content );
				tag.style.width = ( 0.6 * content.length ) + 'em';
				tag.addEventListener( 'input', UI.inputUpdated, true );
				tag.addEventListener( 'change', UI.inputChanged, true );
				tag.addEventListener( 'blur', UI.inputBlur, true );
				container.insertBefore( tag, container.lastChild );
				return tag;
			},

			appendNewInput: function()
			{
				var tag = UI.appendInput( $('.custom-tags-ui'), '' );
				setTimeout( function(){ tag.focus() }, 100 );
			},

			inputUpdated: function()
			{
				this.style.width = ( 0.6 * this.value.length ) + 'em';
				this.style.backgroundColor = determinateTagColor( this.value );
			},

			inputChanged: function()
			{
				var title = $('textarea.mod-card-back-title');
				var old_tag = this.getAttribute( 'data-value' );
				title.focus();
				if( old_tag )
					title.value = title.value.replace(
						'[' + old_tag + ']',
						this.value ? '[' + this.value + ']' : ''
					);
				else if( this.value )
					title.value = '[' + this.value + ']' + title.value;

				this.setAttribute( 'data-value', this.value );

				title.blur();
			},

			inputBlur: function(  )
			{
				if( !this.value )
					this.remove();
			},

			cardTitleChanged: function( e )
			{
				var container = $('.custom-tags-ui');
				for( var i = container.children.length - 1; i >= 0; --i )
					if( container.children[i].tagName === 'INPUT' )
						container.children[i].remove();

				UI.appendInputs( container, e.target.value );
			}
		};

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

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
		}

		function update()
		{
		}

		/**
		 * @return {string}
		 */
		this.getMode = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName );
		};

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
			{
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

				if( old_board_settings[settingName] === 'table' )
					disableTable();
				else if( old_board_settings[settingName] === 'multi-rows' )
					disableMultiRows();
			}
			var mode = self.getMode();
			if( mode === 'multi-rows' )
				enableMultiRows();
			else if( mode === 'table' )
				enableTable();
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
		var estimation_regex = /\((\?|\d+\.\d+|\d+|)(?:\/(\?|\d+\.\d+|\d+))?\)/i;
		var consumption_regex = /\[(\?|\d+\.\d+|\d+|)(?:\/(\?|\d+\.\d+|\d+))?\]/i;
		var last_cards_amount = 0;

		function init()
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
			strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
			{
				if( old_board_settings['scrumTimes.show.estimation'] !== new_board_settings['scrumTimes.show.estimation'] ||
					old_board_settings['scrumTimes.show.consumption'] !== new_board_settings['scrumTimes.show.consumption'] ||
					old_board_settings['scrumTimes.show.team1'] !== new_board_settings['scrumTimes.show.team1'] ||
					old_board_settings['scrumTimes.show.team2'] !== new_board_settings['scrumTimes.show.team2'] )
					disable();

				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;
			}

			if( self.isEnabled() )
				enable();
			else
				disable();
		}

		function globalSettingsChanged( key )
		{
			var settings = [ 'bgTeam1Estimation', 'fontTeam1Estimation', 'bgTeam1Consumption', 'fontTeam1Consumption',
				'bgTeam2Estimation', 'fontTeam2Estimation', 'bgTeam2Consumption', 'fontTeam2Consumption' ];
			var css = [ 'bg-team1-estimation', 'font-team1-estimation', 'bg-team1-consumption', 'font-team1-consumption',
				'bg-team2-estimation', 'font-team2-estimation', 'bg-team2-consumption', 'font-team2-consumption' ];

			for( var i in settings )
				if( !key || key === 'module.scrumTimes.color.'+settings[i] )
					$b.style.setProperty(
						'--strelloids-scrum-times-'+css[i],
						strelloids.modules.settings.getGlobal( 'module.scrumTimes.color.'+settings[i] )
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

		function cardEditOpened()
		{
			if(	!self.isEnabled() )
				return;

			var showEstimation = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.estimation' );
			var showConsumption = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.consumption' );
			var showTeam1 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team1' );
			var showTeam2 = strelloids.modules.settings.getForCurrentBoard( 'scrumTimes.show.team2' );
			var sequence = strelloids.modules.settings.getGlobal( 'module.scrumTimes.storyPointsSequence' );

			var ui_container = $('.card-detail-data');
			var container, i, title;

			if( $( '.scrum-buttons' ) || !ui_container)
				return;

			if( showConsumption && ( showTeam1 || showTeam2 ))
			{
				container = createNode( 'div', { 'class': ['card-detail-item', 'scrum-buttons'] } );
				title = createNode(
					'h3',
					{ 'class': 'card-detail-item-header' },
					' ' + _( 'card_edit_consumption' )
				);
				title.prepend( createNode( 'i', { 'class': 'strelloids-icon-fire' }));
				container.appendChild( title );

				if( showTeam1 )
					appendSequenceButtons( 'team1', 'consumption' );
				container.appendChild( createNode( 'div' ) );

				if( showTeam2 )
					appendSequenceButtons( 'team2', 'consumption' );

				ui_container.prepend( container );
			}
			if( showEstimation && ( showTeam1 || showTeam2 ))
			{
				container = createNode( 'div', { 'class': ['card-detail-item', 'scrum-buttons'] } );
				title = createNode(
					'h3',
					{ 'class': 'card-detail-item-header' },
					' ' + _( 'card_edit_estimation' )
				);
				title.prepend( createNode( 'i', { 'class': 'strelloids-icon-light-bulb' }));
				container.appendChild( title );

				if( showTeam1 )
					appendSequenceButtons( 'team1', 'estimation' );
				container.appendChild( createNode( 'div' ) );

				if( showTeam2 )
					appendSequenceButtons( 'team2', 'estimation' );
				ui_container.prepend( container );
			}

			function appendSequenceButtons( team, mode )
			{
				var btn;
				container.classList.add( 'show-'+team );
				for( i = 0; i < sequence.length; ++i )
				{
					btn = createNode(
						'button',
						{ 'class': ['scrum-button', team, mode], value: sequence[i] },
						sequence[i]
					);
					btn.addEventListener( 'click', buttonClicked );
					container.appendChild( btn );
				}
			}

			function buttonClicked()
			{
				var matches, new_tag = '';
				var team = this.classList.contains( 'team1' ) ? 'team1' : 'team2';
				var mode = this.classList.contains( 'estimation' ) ? 'estimation' : 'consumption';
				var title = $('textarea.mod-card-back-title');

				title.focus();

				matches = title.value.match( mode === 'estimation' ? estimation_regex : consumption_regex );
				new_tag += mode === 'estimation' ? '(' : '[';
				if( !matches )
					matches = [ '', '', '' ];

				new_tag += team === 'team1' ? this.value : matches[1];
				new_tag += team === 'team2' ? '/' + this.value : ( matches[2] ? '/' + matches[2] : '' );
				new_tag += mode === 'estimation' ? ')' : ']';
				if( matches[0] )
					title.value = title.value.replace( matches[0], new_tag );
				else
					title.value += ' ' + new_tag;

				title.blur();
			}
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings  )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] && old_board_settings['scrumTimes'] === new_board_settings['scrumTimes'] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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
		var settingName = 'global.enableBoardScroll';

		function init()
		{
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
		}

		function globalSettingsChanged( key )
		{
			if( !key || key === settingName )
			{
				if( strelloids.modules.settings.getGlobal( settingName ) )
				{
					$w.addEventListener( 'wheel', doScroll );
					$w.addEventListener( 'mousemove', clearStartNode );
				}
				else
				{
					$w.removeEventListener( 'wheel', doScroll );
					$w.removeEventListener( 'mousemove', clearStartNode );
				}
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
		var tag_regex = /(^|\s)!([1-5])($|\s)/i;

		function init(  )
		{
			strelloids.modules.events.add( 'onUpdate', update );
			strelloids.modules.events.add( 'onSettingsLoaded', globalSettingsChanged );
			strelloids.modules.events.add( 'onSettingsLoaded', boardSettingsChanged );
			strelloids.modules.events.add( 'onGlobalSettingsChange', globalSettingsChanged );
			strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
			strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
			strelloids.modules.events.add( 'onCardTitleChanged', updatePriorityUI );
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

		function boardSettingsChanged( key, new_board_settings, old_board_settings )
		{
			if( old_board_settings && new_board_settings )
				if( old_board_settings[settingName] === new_board_settings[settingName] )
					return;

			if( self.isEnabled() )
				enable();
			else
				disable();
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

		function globalSettingsChanged( key )
		{
			if( !key || key === 'module.cardsPrioritization.color.critical' )
				$b.style.setProperty(
					'--strelloids-card-priority-critical',
					strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.critical' )
				);
			if( !key || key === 'module.cardsPrioritization.color.high' )
				$b.style.setProperty(
					'--strelloids-card-priority-high',
					strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.high' )
				);
			if( !key || key === 'module.cardsPrioritization.color.medium' )
				$b.style.setProperty(
					'--strelloids-card-priority-medium',
					strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.medium' )
				);
			if( !key || key === 'module.cardsPrioritization.color.low' )
				$b.style.setProperty(
					'--strelloids-card-priority-low',
					strelloids.modules.settings.getGlobal( 'module.cardsPrioritization.color.low' )
				);
			if( !key || key === 'module.cardsPrioritization.color.lowest' )
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
			clearPriority( card );
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

		function cardEditOpened()
		{
			if(	!self.isEnabled() )
				return;

			var ui_container = $('.card-detail-data');

			if( !$_( 'cards-prioritization-select' ) && ui_container)
			{
				var select = createNode( 'select', { id: 'cards-prioritization-select' } );
				select.appendChild( createNode( 'option', { value: '' }, '---' ) );
				select.appendChild( createNode( 'option', { value: '1' }, _( 'module_cardsPrioritization_critical' ) ) );
				select.appendChild( createNode( 'option', { value: '2' }, _( 'module_cardsPrioritization_high' ) ) );
				select.appendChild( createNode( 'option', { value: '3' }, _( 'module_cardsPrioritization_medium' ) ) );
				select.appendChild( createNode( 'option', { value: '4' }, _( 'module_cardsPrioritization_low' ) ) );
				select.appendChild( createNode( 'option', { value: '5' }, _( 'module_cardsPrioritization_lowest' ) ) );
				select.addEventListener( 'change', priorityChangedFromUI );
				var container = createNode( 'div', { 'class': 'card-detail-item' } );
				container.appendChild( createNode( 'h3', { 'class': 'card-detail-item-header' }, _('card_edit_priority') ));
				container.appendChild( select );
				ui_container.prepend( container );
			}
			updatePriorityUI();
		}

		function priorityChangedFromUI()
		{
			var title = $('.mod-card-back-title');
			title.focus();
			if( this.value )
			{
				var matches = title.value.match( tag_regex );
				if( matches )
					title.value = title.value.replace( matches[0], matches[1]+'!' + this.value + matches[3] );
				else
					title.value += ' ' + '!' + this.value;
			}
			else
			{
				var url_matches = window.location.toString().match( /(\/c\/[^\/]+\/)/ );
				if( url_matches )
				{
					var card_in_list = $( '.list-card[href*="' + url_matches[1] + '"]' );
					if( card_in_list )
						clearPriority( card_in_list );
				}
				title.value = title.value.replace( tag_regex, ' ' );
			}
			title.blur();
		}

		function updatePriorityUI()
		{
			var title = $('.mod-card-back-title');
			var matches = tag_regex.exec( title.value );
			if( matches === null )
				$_('cards-prioritization-select').value = '';
			else
				$_('cards-prioritization-select').value = matches[2];
		}

		init();
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Tab key in card description textarea                                                                  //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module allow to use tab key inside card description textarea and comment textarea.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleTabKeyInTextarea( strelloids )
	{
		var self = this;
		var settingName = 'global.enableTabKeyInTextarea';

		function init()
		{
			strelloids.modules.events.add( 'onCardDescriptionKeyDown', keyDown );
			strelloids.modules.events.add( 'onCardCommentKeyDown', keyDown );
			strelloids.modules.events.add( 'onCardDescriptionKeyUp', keyUp );
			strelloids.modules.events.add( 'onCardCommentKeyUp', keyUp );
		}

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getGlobal( settingName );
		};

		function keyDown( e )
		{
			if( !self.isEnabled() )
				return;

			if( e.key === 'Tab' )
			{
				var textarea = e.target;
				var text = textarea.value;
				var start_position = textarea.selectionStart;
				var end_position = textarea.selectionEnd;

				if( start_position === end_position )
				{
					e.preventDefault();

					if( !e.shiftKey )
					{
						var before_text = text.substr( 0, start_position );
						var after_text = text.substr( start_position );

						textarea.value = before_text + "\t" + after_text;
						textarea.selectionStart = textarea.selectionEnd = start_position + 1;
					}
				}
				else
				{
					e.preventDefault();

					if( text[start_position] === "\n" )
						++start_position;
					while( start_position > 0 && text[start_position-1] !== "\n" )
						--start_position;

					if( text[end_position-1] === "\n" )
						--end_position;
					while( end_position < text.length && text[end_position] !== "\n" )
						++end_position;

					var indent_text = e.shiftKey ?
						text.substring( start_position, end_position ).replace( /^\t/mg, '' ) :
						"\t" + text.substring( start_position, end_position ).replace( /\n/g, "\n\t" );

					textarea.value = text.substr( 0, start_position ) + indent_text + text.substr( end_position );
					textarea.selectionStart = start_position;
					textarea.selectionEnd = start_position + indent_text.length;
				}
			}
		}

		function keyUp( e )
		{
			if( !self.isEnabled() )
				return;

			if( e.key === 'Enter' )
			{
				var textarea = e.target;
				var start_position = textarea.selectionStart;
				var end_position = textarea.selectionEnd;

				if( start_position === end_position )
				{
					var text = textarea.value;
					var before_text = text.substr( 0, start_position );
					var after_text = text.substr( start_position );

					var last_line_indent = /(?:^|\n)(\t+).*?\n$/.exec( before_text );

					if( last_line_indent )
					{
						textarea.value = before_text + last_line_indent[1] + after_text;
						textarea.selectionStart = textarea.selectionEnd = Math.min(textarea.value.length, start_position + last_line_indent[1].length );
					}
				}
			}
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