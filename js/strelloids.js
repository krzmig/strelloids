( function(){
	'use strict';

	if( window.strelloidsInited )
		return;

	window.strelloidsInited = true;

	var DEBUG = true;

	/**
	 * Main plugin class.
	 * @constructor
	 */
	function Strelloids()
	{
		var self = this;
		var runTimeout = null;
		self.modules = {};

		function init()
		{
			if( DEBUG )
				$log( 'Strelloids: initialized' );

			self.modules.settings = new ModuleSettings( self );

			// lists
			self.modules.toggleLists = new ModuleToggleLists( self );
			self.modules.showCardsCounter = new ModuleShowCardsCounter( self );
			self.modules.displayInMultiRows = new ModuleDisplayInMultipleRows( self );
			self.modules.displayAsTable = new ModuleDisplayAsTable( self );
			// cards
			self.modules.showCardShortId = new ModuleShowCardShortId( self );
			self.modules.customTags = new ModuleCustomTags( self );
			// scrum
			self.modules.coloredLists = new ModuleColoredLists( self );
			self.modules.scrumTimes = new ModuleScrumTimes( self );
			self.modules.scrumSumTimes = new ModuleScrumSumTimes( self );

			self.run();
		}

		this.run = function()
		{
			if( DEBUG )
				var t0 = performance.now();

			clearTimeout( runTimeout );

			for( var i in self.modules )
				if( self.modules.hasOwnProperty( i ))
					self.modules[i].update();

			runTimeout = setTimeout( self.run, 3000 );
			if( DEBUG )
				$dbg( "Strelloids: loop took " + (performance.now() - t0) + " milliseconds.")
		};

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
		/** @type {object} local settings object copy, for each board */
		var data = {
			list: {},
			board: {}
		};
		/** @type {string|null} */
		var board_id = null;

		function init()
		{
			self.load();
		}

		this.update = function()
		{
			appendButton();
			appendWindow();
			loadListsIds();
		};

		/**
		 * @param {string} board_id
		 * @param {string} key
		 * @param {null|boolean|number|string|array|object} [default_value] this value will be returned if option is not set
		 * @return {null|boolean|number|string|array|object}
		 */
		this.getForBoard = function( board_id, key, default_value )
		{
			if( board_id && typeof data.board[board_id] !== 'undefined' && typeof data.board[board_id][key] !== 'undefined' )
				return data.board[board_id][key];
			else if( typeof default_value !== 'undefined' )
				return default_value;
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
			if( typeof data.board[board_id] === 'undefined' )
				data.board[board_id] = {};

			data.board[board_id][key] = value;
			self.save( 'board' );
		};

		/**
		 * @param {string} list_id
		 * @param {string} key
		 * @param {null|boolean|number|string|array|object} [default_value] this value will be returned if option is not set
		 * @return {null|boolean|number|string|array|object}
		 */
		this.getForList = function( list_id, key, default_value )
		{
			if( typeof data.list[list_id] !== 'undefined' && typeof data.list[list_id][key] !== 'undefined' )
				return data.list[list_id][key];
			else if( typeof default_value !== 'undefined' )
				return default_value;
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
			if( typeof data.list[list_id] === 'undefined' )
				data.list[list_id] = {};

			data.list[list_id][key] = value;
			self.save( 'list' );
		};

		/**
		 * @param {string} key
		 * @param {null|boolean|number|string|array|object} [default_value] this value will be returned if option is not set
		 * @return {null|boolean|number|string|array|object}
		 */
		this.getForCurrentBoard = function( key, default_value )
		{
			return self.getForBoard( findBoardId(), key, default_value );

		};

		/**
		 * @param {string} key
		 * @param {null|boolean|number|string|array|object} value
		 */
		this.setForCurrentBoard = function( key, value )
		{
			self.setForBoard( findBoardId(), key, value );
		};

		/**
		 * Load settings for all boards, from browser.
		 */
		this.load = function()
		{
			if( DEBUG )
				$log( 'Strelloids: trying to load settings' );

			getApiObject().get(
				null,
				function( result )
				{
					if( DEBUG )
						$log( 'Strelloids: loaded setting: ', result );

					if( result === undefined )
						return;

					var need_save = false;
					for( var i in result )
					{
						if( !result.hasOwnProperty( i ))
							continue;

						if( i !== 'list' && i !== 'board' )
						{
							data.board[i] = result[i];
							getApiObject().remove( i );
							need_save = true;
						}
						else
							data[i] = result[i];
					}

					if( need_save )
						self.save( 'board' );
				}
			);
		};

		/**
		 * @param {string} key
		 */
		this.save = function( key )
		{
			var data_to_save = {};
			data_to_save[key] = data[key];
			if( DEBUG )
				$log( 'Strelloids: trying to save settings' );
			getApiObject().set(
				data_to_save,
				function()
				{
					if( DEBUG )
						$log( 'Strelloids: saved data for key', key, ':', data[key] );
				}
			);
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
					if( typeof data.board[board_id] === 'undefined' )
						data.board[board_id] = {};

					data.board[board_id].board_name = node_board_name.innerText;
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
				for( var i in data.board )
					if( data.board.hasOwnProperty( i ))
						if( data.board[i].board_name === board_name )
							return i;

				return null;
			}
		}

		/**
		 * Append to site button which will open setting window.
		 */
		function appendButton()
		{
			if( $_( 'strelloids-settings-btn' ) )
				return;

			var header = $( '.header-user' );
			if( !header )
				return;

			var btn = createNode(
				'a',
				{
					'class': 'header-btn',
					id: 'strelloids-settings-btn'
				}
			);
			btn.appendChild( createNode( 'span', { 'class': [ 'header-btn-icon', 'icon-lg', 'icon-gear', 'light' ]} ));
			btn.appendChild( $d.createTextNode( 'Strelloids' ));
			btn.addEventListener( 'click', openWindow );
			header.insertBefore( btn, header.firstChild );
		}

		/**
		 * Open or hide settings window.
		 */
		function openWindow()
		{
			var setting_window = $_( 'strelloids-settings-window' );
			if( setting_window.style.display === 'none' )
				setting_window.style.display = '';
			else
				setting_window.style.display = 'none';

			// lists
			$_( 'strelloids-cards-counter-checkbox' ).checked = strelloids.modules.showCardsCounter.isEnabled();
			$_( 'strelloids-multiple-rows-checkbox' ).checked = strelloids.modules.displayInMultiRows.isEnabled();
			$_( 'strelloids-list-table-checkbox' ).checked = strelloids.modules.displayAsTable.isEnabled();
			// cards
			$_( 'strelloids-custom-tags-checkbox' ).checked = strelloids.modules.customTags.isEnabled();
			$_( 'strelloids-short-id-checkbox' ).checked = strelloids.modules.showCardShortId.isEnabled();
			// scrum
			$_( 'strelloids-colored-list-checkbox' ).checked = strelloids.modules.coloredLists.isEnabled();
			$_( 'strelloids-scrum-times-checkbox' ).checked = strelloids.modules.scrumTimes.isEnabled();
			$_( 'strelloids-scrum-sum-times-checkbox' ).checked = strelloids.modules.scrumSumTimes.isEnabled();
			$_( 'strelloids-scrum-sum-times-checkbox' ).disabled = !strelloids.modules.scrumTimes.isEnabled();
		}

		/**
		 * Append settings window to page content.
		 */
		function appendWindow()
		{
			if( $_( 'strelloids-settings-window' ))
				return;

			$b.insertAdjacentHTML(
				'beforeend',
				'<div id="strelloids-settings-window" style="display: none">\
					<div class="notifications-title">\
						<span>\
							<span>' + _( 'settings_title' ) + '</span>\
						</span>\
						<button type="button" class="hide-dialog-trigger dialog-close-button unstyled-button" onclick="document.getElementById(\'strelloids-settings-window\').style.display=\'none\'">\
							<span class="icon-sm icon-close"></span>\
						</button>\
					</div>\
					<div class="notification-list-holder">\
						<h4>\
							' + _( 'settings_sectionTitle_Lists' ) + '\
						</h4>\
						<label>\
							<input type="checkbox" id="strelloids-cards-counter-checkbox"> ' + _( 'settings_lists_enableModule_showCardsCounter' ) + '\
						</label>\
						<label>\
							<input type="checkbox" id="strelloids-multiple-rows-checkbox"> ' + _( 'settings_lists_enableModule_displayInMultiRows' ) + '\
						</label>\
						<label>\
							<input type="checkbox" id="strelloids-list-table-checkbox"> ' + _( 'settings_lists_enableModule_displayAsTable' ) + '\
						</label>\
						<h4>\
							' + _( 'settings_sectionTitle_Cards' ) + '\
						</h4>\
						<label>\
							<input type="checkbox" id="strelloids-short-id-checkbox"> ' + _( 'settings_lists_enableModule_showCardShortId' ) + '\
						</label>\
						<label>\
							<input type="checkbox" id="strelloids-custom-tags-checkbox"> ' + _( 'settings_lists_enableModule_customTags' ) + '\
						</label>\
						<h4>\
							' + _( 'settings_sectionTitle_Scrum' ) + '\
						</h4>\
						<label>\
							<input type="checkbox" id="strelloids-colored-list-checkbox"> ' + _( 'settings_lists_enableModule_coloredLists' ) + '\
						</label>\
						<label>\
							<input type="checkbox" id="strelloids-scrum-times-checkbox"> ' + _( 'settings_lists_enableModule_scrumTime' ) + '\
						</label>\
						<label style="margin-left: 24px">\
							<input type="checkbox" id="strelloids-scrum-sum-times-checkbox"> ' + _( 'settings_lists_enableModule_scrumSumTime' ) + '\
						</label>\
					</div>\
				</div>'
			);

			// lists
			$_( 'strelloids-cards-counter-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.showCardsCounter.enable();
					else
						strelloids.modules.showCardsCounter.disable();
				}
			);
			$_( 'strelloids-multiple-rows-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
					{
						if( strelloids.modules.displayAsTable.isEnabled() )
						{
							strelloids.modules.displayAsTable.disable();
							$_( 'strelloids-list-table-checkbox').checked = false;
						}
						strelloids.modules.displayInMultiRows.enable();
					}
					else
						strelloids.modules.displayInMultiRows.disable();
				}
			);
			$_( 'strelloids-list-table-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
					{
						if( strelloids.modules.displayInMultiRows.isEnabled() )
						{
							strelloids.modules.displayInMultiRows.disable();
							$_( 'strelloids-multiple-rows-checkbox').checked = false;
						}
						strelloids.modules.displayAsTable.enable();
					}
					else
						strelloids.modules.displayAsTable.disable();
				}
			);
			// cards
			$_( 'strelloids-short-id-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.showCardShortId.enable();
					else
						strelloids.modules.showCardShortId.disable();
				}
			);
			$_( 'strelloids-custom-tags-checkbox' ).addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.customTags.enable();
					else
						strelloids.modules.customTags.disable();
				}
			);
			// scrum
			$_( 'strelloids-colored-list-checkbox' ).addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.coloredLists.enable();
					else
						strelloids.modules.coloredLists.disable();
				}
			);
			$_( 'strelloids-scrum-times-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.scrumTimes.enable();
					else
					{
						strelloids.modules.scrumTimes.disable();
						strelloids.modules.scrumSumTimes.disable();
					}
					$_( 'strelloids-scrum-sum-times-checkbox').disabled = !this.checked;
				}
			);
			$_( 'strelloids-scrum-sum-times-checkbox').addEventListener(
				'change',
				function()
				{
					if( this.checked )
						strelloids.modules.scrumSumTimes.enable();
					else
						strelloids.modules.scrumSumTimes.disable();
				}
			);
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

			new Ajax({
				url: 'https://trello.com/1/Boards/' + board_id + '?lists=open&list_fields=name,closed,idBoard,pos',
				onDone: function( raw_response )
				{
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

		this.update = function()
		{
			if( !self.isEnabled() )
				return;

			var lists_titles = $$( 'textarea.list-header-name' );
			for( var i = lists_titles.length - 1; i >= 0; --i )
				setListColor(
					closest( lists_titles[i], '.list' ),
					lists_titles[i].value
				);
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

			var lists = $$( '.list' );
			for( var i = lists.length - 1; i >= 0; --i )
				lists[i].style.backgroundColor = '';
		};

		/**
		 * @param {HTMLElement} list
		 * @param {string} title
		 */
		function setListColor( list, title )
		{
			if( title.match( /todo/i ))
				list.style.backgroundColor = '#eff5d0';
			else if( title.match( /helpdesk/i ))
				list.style.backgroundColor = '#f5d3f3';
			else if( title.match( /(sprint|stories)/i ))
				list.style.backgroundColor = '#d0dff6';
			else if( title.match( /backlog/i ))
				list.style.backgroundColor = '#c0e8ed';
			else if( title.match( /test/i ))
				list.style.backgroundColor = '#f5f5c0';
			else if( title.match( /(progress|working|doing)/i ))
				list.style.backgroundColor = '#bfe3c6';
			else if( title.match( /upgrade/i ))
				list.style.backgroundColor = '#e6ccf5';
			else if( title.match( /(done|ready)/i ))
				list.style.backgroundColor = '#d9f0bf';
			else if( title.match( /fix/i ))
				list.style.backgroundColor = '#f9c0d0';
		}
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
		var settingName = 'cardsCounter';

		this.update = function()
		{
			if(	!self.isEnabled() )
				return;

			var counters = $$('.list-header-num-cards.hide');
			for( var i = counters.length - 1; i >= 0; --i )
				counters[i].classList.remove( 'hide' );
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );
			var counters = $$('.list-header-num-cards');
			for( var i = counters.length - 1; i >= 0; --i )
				counters[i].classList.add( 'hide' );
		};
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
		var settingName = 'shortId';

		this.update = function()
		{
			if(	!self.isEnabled() )
				return;

			var ids = $$('.card-short-id.hide');
			for( var i = ids.length - 1; i >= 0; --i )
				ids[i].classList.remove( 'hide' );
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

			var ids = $$('.card-short-id');
			for( var i = ids.length - 1; i >= 0; --i )
				ids[i].classList.add( 'hide' );
		};
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

		this.update = function()
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
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

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
		};

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
			var tmp, sum, i, j;

			var h = 0;
			for( i = chars.length - 1; i >= 0; --i )
			{
				tmp = chars[i].toString();
				sum = tmp.charAt( 0 );
				for( j = tmp.length - 1; j > 0; --j )
					if( tmp.charAt( j ) !== '0' )
						sum *= parseInt( tmp.charAt( j ) );
				h += sum;
			}
			h = h % 360;

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
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Display list in multiple rows                                                                         //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module shows lists in multiple rows, so you scroll page vertically instead of horizontally.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleDisplayInMultipleRows( strelloids )
	{
		var self = this;
		var settingName = 'displayInMultiRows';

		this.update = function()
		{
			if( !self.isEnabled() )
				return;

			var board = $_( 'board' );
			if( !board || board.classList.contains( 'board-multiple-rows' ))
				return;

			board.classList.add( 'board-multiple-rows' );
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
			board.appendChild( createNode( 'div', { 'class': 'flex-placeholder' }));
		};

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-multiple-rows' ))
				return;

			board.classList.remove( 'board-multiple-rows' );
			for( var i = board.children.length - 1; i >= 0; --i )
				if( board.children[i].classList.contains( 'flex-placeholder' ))
					board.removeChild( board.children[i] );
		};
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Module - Display list as table                                                                                 //
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * Module shows lists as table, in whole page width.
	 * @param {Strelloids} strelloids
	 * @constructor
	 */
	function ModuleDisplayAsTable( strelloids )
	{
		var self = this;
		var settingName = 'displayAsTable';

		this.update = function()
		{
			if( !self.isEnabled() )
				return;

			var board = $_( 'board' );
			if( board && !board.classList.contains( 'board-table-view' ))
				board.classList.add( 'board-table-view' );
		};

		/**
 		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-table-view' ))
				return;

			board.classList.remove( 'board-table-view' );
		};
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
					if( !e.target.classList.contains( 'list-header-extras-menu' ))
						return true;

					var list = closest( e.target, '.js-list' );
					var list_id = list.id.replace( 'list-', '' );

					setTimeout(
						function()
						{
							appendToggleOption( list_id, 0 );
						},
						100
					);
				},
				true
			);
		}

		this.update = function()
		{
			var config = strelloids.modules.settings.getForCurrentBoard( 'hiddenLists', [] );
			var lists = $$( '#board > .js-list' );
			for( var i = lists.length - 1; i >= 0; --i )
			{
				var id = lists[i].id.replace( 'list-', '' );
				lists[i].classList.toggle( 'list-hidden', config.indexOf( id ) > -1 );
			}
		};

		/**
		 * @param {string} list_id
		 * @param {int} counter
		 * @return {boolean|number}
		 */
		function appendToggleOption( list_id, counter )
		{
			var list = $('.pop-over .pop-over-list:last-child');
			if( !list && counter >= 10 )
				return false;
			else if( !list )
				return setTimeout(
					function()
					{
						appendToggleOption( ++counter );
					},
					100
				);

			var li = list.querySelector( '.toggle-list' );
			if( li )
				li.parentNode.removeChild( li );

			li = createNode( 'li', { 'class': 'toggle-list' });
			li.appendChild( createNode( 'a', { href: '#' }, _( 'module_toggleLists_showHideList' )));
			li.addEventListener( 'click', function(){ toggleVisibility( list_id ); } );
			list.appendChild( li );
			return true;
		}

		/**
		 * @param {string} list_id
		 */
		function toggleVisibility( list_id )
		{
			var config = strelloids.modules.settings.getForCurrentBoard( 'hiddenLists', [] );
			var index = config.indexOf( list_id );
			if( index > -1 )
			{
				if( DEBUG )
					$log( 'Strelloids: module toggleList - list', list_id, 'shown in' );

				config.splice( index, 1 );
				$_( 'list-' + list_id ).classList.remove( 'list-hidden' );
			}
			else
			{
				if( DEBUG )
					$log( 'Strelloids: module toggleList - list', list_id, 'hidden' );

				config.push( list_id );
				$_( 'list-' + list_id ).classList.add( 'list-hidden' );
			}
			strelloids.modules.settings.setForCurrentBoard( 'hiddenLists', config );
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
		var estimation_regex = /\(([0-9\.]*|\?)\/?([0-9\.]*?|\?)\)/i;
		var consumption_regex = /\[([0-9\.]*|\?)\/?([0-9\.]*?|\?)\]/i;

		this.update = function()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;
			var matches, matches2;

			for( var i = cards_titles.length - 1; i >= 0; --i )
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

				removeOldTags( cards_titles[i] );
				strelloids.modules.scrumSumTimes.needUpdate = true;

				if( matches && matches[1] )
					cards_titles[i].insertBefore(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'estimation', 'team1' ] },
							matches[1]
						),
						text_node
					);

				if( matches && matches[2] )
					cards_titles[i].insertBefore(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'estimation', 'team2' ] },
							matches[2]
						),
						text_node
					);

				if( matches2 && matches2[1] )
					cards_titles[i].appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'consumption', 'team1' ] },
							matches2[1]
						)
					);

				if( matches2 && matches2[2] )
					cards_titles[i].appendChild(
						createNode(
							'span',
							{ 'class': [ 'scrum-label', 'consumption', 'team2' ] },
							matches2[2]
						)
					);

				text_node.nodeValue = text_node.nodeValue.replace( estimation_regex, '' ).replace( consumption_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		};

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

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
		};

		/**
		 * @param {HTMLElement} element
		 */
		function removeOldTags( element )
		{
			var old_tags = element.querySelectorAll( '.scrum-label' );
			for( var i = old_tags.length - 1; i >= 0; --i )
				element.removeChild( old_tags[i] );
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

		this.update = function()
		{
			if( !self.isEnabled() || !self.needUpdate )
				return;

			var lists = $$('#board > .js-list');
			var container;

			for( var i = lists.length - 1; i >= 0; --i )
			{
				container = createContainer( lists[i] );

				sumTimes( lists[i], container, 'estimation', 'team1' );
				sumTimes( lists[i], container, 'estimation', 'team2' );
				sumTimes( lists[i], container, 'consumption', 'team1' );
				sumTimes( lists[i], container, 'consumption', 'team2' );
			}
			self.needUpdate = false;
		};

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.getForCurrentBoard( settingName, false );
		};

		this.enable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' enabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, true );
			self.needUpdate = true;
			self.update();
		};

		this.disable = function()
		{
			if( DEBUG )
				$log( 'Strelloids: module ' + settingName + ' disabled' );

			strelloids.modules.settings.setForCurrentBoard( settingName, false );

			var containers = $$('.list-header .scrum-sum-container');

			for( var i = containers.length - 1; i >= 0; --i )
				containers[i].parentNode.removeChild( containers[i] );
		};

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