/**
 * Module allow to create tables in markdown style.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleMarkdownTable( strelloids )
{
	var self = this;
	var settingName = 'global.enableMarkdownTables';

	function init()
	{
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
		strelloids.modules.events.add( 'onCardCommentChanged', cardEditOpened );
		strelloids.modules.events.add( 'onCardDescriptionChanged', cardEditOpened );
	}

	/**
	 * @returns {boolean}
	 */
	this.isEnabled = function()
	{
		return strelloids.modules.settings.getGlobal( settingName );
	};

	function cardEditOpened()
	{
		if( !self.isEnabled() )
			return;

		parseMarkdown();
		// because first time not working after editing, probably trello needs time to update preview from textarea
		setTimeout( parseMarkdown, 1000 );
		setTimeout( parseMarkdown, 2000 );
	}

	function parseMarkdown()
	{
		var table_regex = /^.*?\|.*?\n[\s:\|]*?---+[\s:]*?\|[\s:\|-]*?\n.*?\|/;

		var marked_down = $$( '.card-detail-window .markeddown p' );

		for( var i = marked_down.length - 1; i >= 0; --i )
		{
			if( marked_down[i].childNodes.length < 5 )
				continue;

			if( !marked_down[i].innerText.match( table_regex ))
				continue;

			var table = generateTableNode( marked_down[i].innerHTML );
			marked_down[i].parentNode.replaceChild( table, marked_down[i] );
		}
	}

	function generateTableNode( markdown )
	{
		var table = createNode( 'table' );
		var thead = createNode( 'thead' );
		table.appendChild( thead );
		var tbody = createNode( 'tbody' );
		table.appendChild( tbody );
		var tr, th, td;

		markdown = markdown.replace( /\s+/, ' ' );
		var rows = markdown.split( '<br>' );
		var cells;
		var cols = [], align;

		cells = getCellsFromRowMarkdown( rows[1] );
		for( var i = 0; i < cells.length; ++i )
		{
			align = 'left';
			if( cells[i].slice(-1) === ':' )
			{
				align = 'right';
				if( cells[i].charAt( 0 ) === ':' )
					align = 'center';
			}
			cols.push( align );
		}

		cells = getCellsFromRowMarkdown( rows[0] );
		tr = createNode( 'tr' );
		thead.appendChild( tr );
		for( i = 0; i < cols.length; ++i )
		{
			th = createNode( 'th' );
			if( typeof cells[i] !== 'undefined' )
				th.insertAdjacentHTML('beforeend', cells[i] );
			tr.appendChild( th );
		}

		for( i = 2; i < rows.length; ++i )
		{
			tr = createNode( 'tr' );
			tbody.appendChild( tr );

			cells = getCellsFromRowMarkdown( rows[i] );
			for( var j = 0; j < cols.length; ++j )
			{
				td = createNode( 'td' );
				td.style.textAlign = cols[j];
				if( typeof cells[j] !== 'undefined' )
					td.insertAdjacentHTML('beforeend', cells[j] );
				tr.appendChild( td );
			}
		}

		return table;
	}

	function getCellsFromRowMarkdown( row )
	{
		row = row.replace( /^\s?\|?\s?/, '' );
		row = row.replace( /\s?\|?\s?$/, '' );
		var cells = row.split( '|' );
		for( var i = cells.length - 1; i >= 0; --i )
		{
			cells[i] = cells[i].replace( /^\s+/, '' );
			cells[i] = cells[i].replace( /\s+$/, '' );
		}
		return cells;
	}

	init();
}