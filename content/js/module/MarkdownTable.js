/**
 * Module allow to create tables in markdown style.
 * @param {Strelloids} strelloids
 * @constructor
 */
function ModuleMarkdownTable( strelloids )
{
	let self = this;
	const settingName = 'global.enableMarkdownTables';

	function init()
	{
		strelloids.modules.events.add( 'onCardEditOpened', cardEditOpened );
		strelloids.modules.events.add( 'onCardCommentChanged', cardEditOpened );
		strelloids.modules.events.add( 'onCardDescriptionChanged', cardEditOpened )
		$w.addEventListener( 'click', () => {
			if( self.isEnabled() )
				cardEditOpened();
		}, true );
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
		let table_regex = /^.*?\|.*?\n[\s:\|]*?---+[\s:]*?\|[\s:\|-]*?\n.*?\|/;

		$$( '.card-detail-window .markeddown p' ).forEach(( marked_down ) => {
			if( marked_down.childNodes.length < 5 )
				return;

			if( !marked_down.innerText.match( table_regex ))
				return;

			marked_down.parentNode.replaceChild(
				generateTableNode( marked_down.innerHTML ),
				marked_down
			);
		});
	}

	function generateTableNode( markdown )
	{
		let i;
		let table = createNode( 'table' );
		let thead = createNode( 'thead' );
		table.appendChild( thead );
		let tbody = createNode( 'tbody' );
		table.appendChild( tbody );
		let tr, th, td;

		markdown = markdown.replace( /\s+/, ' ' );
		let rows = markdown.split( '<br>' );
		let cells;
		let cols = [], align;

		cells = getCellsFromRowMarkdown( rows[1] );
		for( i = 0; i < cells.length; ++i )
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
			for( let j = 0; j < cols.length; ++j )
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
		let cells = row.split( '|' );
		for( let i = cells.length - 1; i >= 0; --i )
		{
			cells[i] = cells[i].replace( /^\s+/, '' );
			cells[i] = cells[i].replace( /\s+$/, '' );
		}
		return cells;
	}

	init();
}