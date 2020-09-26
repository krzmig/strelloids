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
		strelloids.modules.events.add( 'onBoardSwitch', boardSettingsChanged );
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