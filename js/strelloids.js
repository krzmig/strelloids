( function(){
	'use strict';

	if( window.strelloidsInited )
		return;

	window.strelloidsInited = true;

	'use strict';

	var DEBUG = false;

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
			self.modules.settings = new ModuleSettings( self );

			self.modules.coloredLists = new ModuleColoredLists( self );
			self.modules.showCardsCounter = new ModuleShowCardsCounter( self );
			self.modules.displayInMultiRows = new ModuleDisplayInMultipleRows( self );
			self.modules.displayAsTable = new ModuleDisplayAsTable( self );
			self.modules.showCardShortId = new ModuleShowCardShortId( self );
			self.modules.customTags = new ModuleCustomTags( self );
			self.modules.toggleLists = new ModuleToggleLists( self );
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
				console.debug( "strelloids loop took " + (performance.now() - t0) + " milliseconds.")
		};

		init();
	}

	/**
	 * Module to save your settings, for each board separately.
	 * @param strelloids
	 * @constructor
	 */
	function ModuleSettings( strelloids )
	{
		var self = this;
		var data = {};
		var board_id = null;

		this.update = function()
		{
			appendButton();
			appendWindow();
			loadListsIds();
		};

		this.enable = function()
		{
		};

		this.disable = function()
		{
		};

		this.isEnabled = function()
		{
			return true;
		};

		this.get = function( key, default_value )
		{
			var board_id = findBoardId();
			if( board_id && typeof data[board_id] !== 'undefined' && typeof data[board_id][key] !== 'undefined' )
				return data[board_id][key];
			else if( typeof default_value !== 'undefined' )
				return default_value;
			else
				return null;
		};

		this.set = function( key, value )
		{
			var board_id = findBoardId();
			if( typeof data[board_id] === 'undefined' )
				data[board_id] = {};

			data[board_id][key] = value;
			self.save( board_id );
		};

		this.load = function()
		{
			$log( 'Trying to load settings' );
			getApiObject().get( null, function( result ) {
				$log( 'Loaded setting: ', result );
				if( result !== undefined )
					data = result;
			});
		};

		this.save = function( board_id )
		{
			var data_to_save = {};
			data_to_save[board_id] = data[board_id];
			$log( 'Trying to save settings' );
			getApiObject().set(
				data_to_save,
				function()
				{
					$log( 'Saved data for board', board_id, ':', data[board_id] );
				}
			);
		};

		function getApiObject()
		{
			if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' && typeof browser.storage.sync !== 'undefined' )
				return browser.storage.sync;
			else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' && typeof chrome.storage.sync !== 'undefined' )
				return chrome.storage.sync;
			else if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' && typeof browser.storage.local !== 'undefined' )
				return browser.storage.local;
			else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' && typeof chrome.storage.local !== 'undefined' )
				return chrome.storage.local;
			else
				$err( 'No storage container found. Unable to save data!' );
		}

		function findBoardId()
		{
			var matches = /trello.com\/b\/([a-z0-9]+)\//i.exec( $w.location.toString() );
			var node_board_name = $( '.board-header-btn-name' );

			if( matches && matches.length )
			{
				board_id = matches[1];
				if( node_board_name )
				{
					if( !isset( data[board_id] ))
						data[board_id] = {};

					data[board_id].board_name = node_board_name.innerText;
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
				for( var i in data )
					if( data.hasOwnProperty( i ))
						if( data[i].board_name === board_name )
							return i;

				return null;
			}
		}

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
			btn.addEventListener(
				'click',
				function()
				{
					var setting_window = $_( 'strelloids-settings-window' );
					if( setting_window.style.display === 'none' )
						setting_window.style.display = '';
					else
						setting_window.style.display = 'none';

					$_( 'strelloids-colored-list-checkbox' ).checked = strelloids.modules.coloredLists.isEnabled();
					$_( 'strelloids-cards-counter-checkbox' ).checked = strelloids.modules.showCardsCounter.isEnabled();
					$_( 'strelloids-multiple-rows-checkbox' ).checked = strelloids.modules.displayInMultiRows.isEnabled();
					$_( 'strelloids-list-table-checkbox' ).checked = strelloids.modules.displayAsTable.isEnabled();

					$_( 'strelloids-custom-tags-checkbox' ).checked = strelloids.modules.customTags.isEnabled();
					$_( 'strelloids-short-id-checkbox' ).checked = strelloids.modules.showCardShortId.isEnabled();

					$_( 'strelloids-scrum-times-checkbox' ).checked = strelloids.modules.scrumTimes.isEnabled();
					$_( 'strelloids-scrum-sum-times-checkbox' ).checked = strelloids.modules.scrumSumTimes.isEnabled();
					$_( 'strelloids-scrum-sum-times-checkbox' ).disabled = !strelloids.modules.scrumTimes.isEnabled();
				}
			);
			header.insertBefore( btn, header.firstChild );
		}

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
						<button type="button" class="hide-dialog-trigger dialog-close-button unstyled-button" onclick="$(\'#strelloids-settings-window\').hide();">\
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

		this.load();
	}

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
			{
				var text = lists_titles[i].value;
				var list = closest( lists_titles[i], '.list' );

				if( text.match( /todo/i ))
					list.style.backgroundColor = '#eff5d0';
				else if( text.match( /helpdesk/i ))
					list.style.backgroundColor = '#f5d3f3';
				else if( text.match( /(sprint|stories)/i ))
					list.style.backgroundColor = '#d0dff6';
				else if( text.match( /backlog/i ))
					list.style.backgroundColor = '#c0e8ed';
				else if( text.match( /test/i ))
					list.style.backgroundColor = '#f5f5c0';
				else if( text.match( /(progress|working|doing)/i ))
					list.style.backgroundColor = '#bfe3c6';
				else if( text.match( /upgrade/i ))
					list.style.backgroundColor = '#e6ccf5';
				else if( text.match( /(done|ready)/i ))
					list.style.backgroundColor = '#d9f0bf';
				else if( text.match( /fix/i ))
					list.style.backgroundColor = '#f9c0d0';
			}
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );

			var lists = $$( '.list' );
			for( var i = lists.length - 1; i >= 0; --i )
				lists[i].style.backgroundColor = '';
		};
	}

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
			if(	self.isEnabled() )
			{
				var elems = $$('.list-header-num-cards.hide');
				for( var i = elems.length - 1; i >= 0; --i )
					elems[i].classList.remove( 'hide' );
			}
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );
			var elems = $$('.list-header-num-cards');
			for( var i = elems.length - 1; i >= 0; --i )
				elems[i].classList.add( 'hide' );
		};
	}

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
			if(	self.isEnabled() )
			{
				var elems = $$('.card-short-id.hide');
				for( var i = elems.length - 1; i >= 0; --i )
					elems[i].classList.remove( 'hide' );
			}
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );
			var elems = $$('.card-short-id');
			for( var i = elems.length - 1; i >= 0; --i )
				elems[i].classList.add( 'hide' );
		};
	}

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

		this.update = function()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;
			var tag_regex = /\[([^\]]*[a-z_ -][^\]]*)\]/ig;

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

				tag_regex.lastIndex = 0;

				var matches;
				while(( matches = tag_regex.exec( text_node.nodeValue ) ) !== null )
				{
					var tag = createNode(
						'span',
						{ 'class': [ 'card-tag' ] },
						matches[1]
					);
					tag.style.backgroundColor = determinateTagColor( matches[1] );
					cards_titles[i].insertBefore( tag, text_node );
				}

				text_node.nodeValue = text_node.nodeValue.replace( tag_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		};

		/**
		 * @returns {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );

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

		function findTextNode( element )
		{
			for( var i = 0; i < element.childNodes.length; ++i )
				if( element.childNodes[i].nodeType === Node.TEXT_NODE )
					return element.childNodes[i];

			return null;
		}

		function removeOldTags( element )
		{
			var old_tags = element.querySelectorAll( '.card-tag' );
			for( var i = old_tags.length - 1; i >= 0; --i )
				element.removeChild( old_tags[i] );
		}

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

		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );

			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-multiple-rows' ))
				return;

			board.classList.remove( 'board-multiple-rows' );
			for( var i = board.children.length - 1; i >= 0; --i )
				if( board.children[i].classList.contains( 'flex-placeholder' ))
					board.removeChild( board.children[i] );
		};
	}

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

		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.set( settingName, false );

			var board = $_( 'board' );
			if( !board || !board.classList.contains( 'board-table-view' ))
				return;

			board.classList.remove( 'board-table-view' );
		};
	}

	/**
	 * Module allow you to hide selected lists from list menu (right top corner).
	 * @param strelloids
	 * @constructor
	 */
	function ModuleToggleLists( strelloids )
	{
		function init()
		{
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
			var config = strelloids.modules.settings.get( 'hiddenLists', [] );
			var lists = $$( '#board > .js-list' );
			for( var i = lists.length - 1; i >= 0; --i )
			{
				var id = lists[i].id.replace( 'list-', '' );
				lists[i].classList.toggle( 'list-hidden', config.indexOf( id ) > -1 );
			}
		};

		this.isEnabled = function()
		{
			return true;
		};

		this.enable = function()
		{
		};

		this.disable = function()
		{
		};

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
		}

		function toggleVisibility( list_id )
		{
			var config = strelloids.modules.settings.get( 'hiddenLists', [] );
			var index = config.indexOf( list_id );
			if( index > -1 )
			{
				config.splice( index, 1 );
				strelloids.modules.settings.set( 'hiddenLists', config );
				$_( 'list-' + list_id ).classList.remove( 'list-hidden' );
			}
			else
			{
				config.push( list_id );
				strelloids.modules.settings.set( 'hiddenLists', config );
				$_( 'list-' + list_id ).classList.add( 'list-hidden' );
			}
			$( '.pop-over' ).classList.remove('is-shown');
		}

		init();
	}

	/**
	 *
	 * @param strelloids
	 * @constructor
	 */
	function ModuleScrumTimes( strelloids )
	{
		var self = this;
		var settingName = 'scrumTimes';

		this.update = function()
		{
			if(	!self.isEnabled() )
				return;

			var cards_titles = $$('.list-card-title');
			var text_node = null;
			var estimation_regex = /\(([0-9\.]*|\?)\/?([0-9\.]*?|\?)\)/i;
			var consumption_regex = /\[([0-9\.]*|\?)\/?([0-9\.]*?|\?)\]/i;

			for( var i = cards_titles.length - 1; i >= 0; --i )
			{
				text_node = findTextNode( cards_titles[i] );

				if( !text_node )
					continue;

				if( !cards_titles[i].getAttribute( 'data-original-title' ))
					cards_titles[i].setAttribute( 'data-original-title', text_node.nodeValue );

				var matches = estimation_regex.exec( text_node.nodeValue );
				var matches2 = consumption_regex.exec( text_node.nodeValue );
				if( !matches && !matches2 )
					continue;

				removeOldTags( cards_titles[i] );
				strelloids.modules.scrumSumTimes.needUpdate = true;

				if( matches )
				{
					if( matches[1] )
						cards_titles[i].insertBefore(
							createNode(
								'span',
								{ 'class': [ 'scrum-label', 'estimation', 'team1' ] },
								matches[1]
							),
							text_node
						);

					if( matches[2] )
						cards_titles[i].insertBefore(
							createNode(
								'span',
								{ 'class': [ 'scrum-label', 'estimation', 'team2' ] },
								matches[2]
							),
							text_node
						);
				}

				if( matches2 )
				{
					if( matches2[1] )
						cards_titles[i].appendChild(
							createNode(
								'span',
								{ 'class': [ 'scrum-label', 'consumption', 'team1' ] },
								matches2[1]
							)
						);

					if( matches2[2] )
						cards_titles[i].appendChild(
							createNode(
								'span',
								{ 'class': [ 'scrum-label', 'consumption', 'team2' ] },
								matches2[2]
							)
						);
				}

				text_node.nodeValue = text_node.nodeValue.replace( estimation_regex, '' ).replace( consumption_regex, '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
			}
		};

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.get( settingName, false );

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

		function removeOldTags( element )
		{
			var old_tags = element.querySelectorAll( '.scrum-label' );
			for( var i = old_tags.length - 1; i >= 0; --i )
				element.removeChild( old_tags[i] );
		}

		function findTextNode( element )
		{
			for( var i = 0; i < element.childNodes.length; ++i )
				if( element.childNodes[i].nodeType === Node.TEXT_NODE )
					return element.childNodes[i];

			return null;
		}
	}

	/**
	 *
	 * @param strelloids
	 * @constructor
	 */
	function ModuleScrumSumTimes( strelloids )
	{
		var self = this;
		var settingName = 'scrumSumTimes';
		this.needUpdate = true;

		this.update = function()
		{
			if( !self.isEnabled() || !self.needUpdate )
				return;

			var lists = $$('#board > .js-list');
			var labels, i, j, container, estimation_team1, estimation_team2, consumption_team1, consumption_team2;

			for( i = lists.length - 1; i >= 0; --i )
			{
				estimation_team1 = estimation_team2 = consumption_team1 = consumption_team2 = 0;
				container = createContainer( lists[i] );

				labels = lists[i].querySelectorAll( '.scrum-label.estimation.team1' );
				for( j = labels.length - 1; j >= 0; --j )
					estimation_team1 += isNaN( labels[j].innerText ) ? 0 : parseFloat( labels[j].innerText );

				labels = lists[i].querySelectorAll( '.scrum-label.estimation.team2' );
				for( j = labels.length - 1; j >= 0; --j )
					estimation_team2 += isNaN( labels[j].innerText ) ? 0 : parseFloat( labels[j].innerText );

				labels = lists[i].querySelectorAll( '.scrum-label.consumption.team1' );
				for( j = labels.length - 1; j >= 0; --j )
					consumption_team1 += isNaN( labels[j].innerText ) ? 0 : parseFloat( labels[j].innerText );

				labels = lists[i].querySelectorAll( '.scrum-label.consumption.team2' );
				for( j = labels.length - 1; j >= 0; --j )
					consumption_team2 += isNaN( labels[j].innerText ) ? 0 : parseFloat( labels[j].innerText );

				if( estimation_team1 )
					container.appendChild( createNode(
						'span',
						{ 'class': [ 'scrum-label', 'estimation', 'team1' ]},
						estimation_team1.toString()
					));
				if( estimation_team2 )
					container.appendChild( createNode(
						'span',
						{ 'class': [ 'scrum-label', 'estimation', 'team2' ]},
						estimation_team2.toString()
					));
				if( consumption_team1 )
					container.appendChild( createNode(
						'span',
						{ 'class': [ 'scrum-label', 'consumption', 'team1' ]},
						consumption_team1.toString()
					));
				if( consumption_team2 )
					container.appendChild( createNode(
						'span',
						{ 'class': [ 'scrum-label', 'consumption', 'team2' ]},
						consumption_team2.toString()
					));
			}
			self.needUpdate = false;
		};

		/**
		 * @return {boolean}
		 */
		this.isEnabled = function()
		{
			return strelloids.modules.settings.get( settingName );
		};

		this.enable = function()
		{
			strelloids.modules.settings.set( settingName, true );
			self.needUpdate = true;
			self.update();
		};

		this.disable = function()
		{
			strelloids.modules.settings.get( settingName, false );

			var containers = $$('.list-header .scrum-sum-container');

			for( var i = containers.length - 1; i >= 0; --i )
				containers[i].parentNode.removeChild( containers[i] );
		};

		function createContainer( node_list )
		{
			var container = node_list.querySelector( '.scrum-sum-container' );
			if( container )
			{
				while( container.lastChild )
					container.removeChild( container.lastChild );
			}
			else
			{
				container = createNode( 'div', { 'class': 'scrum-sum-container' });
				node_list.querySelector( '.list-header' ).appendChild( container );
			}
			return container;
		}
	}

		////////////////////////////////////////////////////////
	// Helper functions
	////////////////////////////////////////////////////////

	/**
	 *
	 * @param {string} type
	 * @param {object} params
	 * @param {string} text_node
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
		if( isset( text_node ))
			node.appendChild( $d.createTextNode( text_node ));

		return node;
	}

	/**
	 * @param variable
	 * @return {boolean}
	 */
	function isset( variable )
	{
		return typeof variable !== 'undefined';
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
			if( !isset( obj_params[i] ))
				obj_params[i] = default_params[i];

		if( !isset( obj_params.url ))
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

	var $w = $w || window,
		$d = document,
		$b = $d.body,
		$_ = $_ || $d.getElementById.bind( $d ),
		$ = $ || $d.querySelector.bind( $d ),
		$$ = $$ || $d.querySelectorAll.bind( $d ),
		$log = console.log,
		$wrn = console.warn,
		$err = console.error,
		$dbg = console.debug,
		$trc = console.trace,
		_ = typeof browser !== 'undefined' ? browser.i18n.getMessage.bind( browser ) : chrome.i18n.getMessage.bind( chrome );

	new Strelloids();
})();