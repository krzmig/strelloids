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
	const self = this;
	const settingName = 'displayMode';

	function init()
	{
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onBoardSwitch', boardSettingsChanged );
		strelloids.modules.events.add( 'onBoardSettingsChange', boardSettingsChanged );
	}

	function update()
	{
		const board = $_( 'board' );
		if( board && board.classList.contains( 'board-table-view' ))
		{
			$$('button[data-testid="card-front-member"]').forEach(( label ) => {
				if( !label.parentNode.parentNode.classList.contains( 'list-card-members' ))
					label.parentNode.parentNode.classList.add( 'list-card-members' );
			});
			$$('button[data-testid="compact-card-label"]').forEach(( label ) => {
				if( !label.parentNode.parentNode.classList.contains( 'list-card-labels' ))
					label.parentNode.parentNode.classList.add( 'list-card-labels' );
			});
		}
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
		const mode = self.getMode();
		if( mode === 'multi-rows' )
			enableMultiRows();
		else if( mode === 'table' )
			enableTable();
	}

	function enableMultiRows()
	{
		const board = $_( 'board' );
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
		const board = $_( 'board' );
		if( !board || !board.classList.contains( 'board-multiple-rows' ))
			return;

		board.classList.remove( 'board-multiple-rows' );
		for( let i = board.children.length - 1; i >= 0; --i )
			if( board.children[i].classList.contains( 'flex-placeholder' ))
				board.removeChild( board.children[i] );
	}

	function enableTable()
	{
		const board = $_( 'board' );
		if( board && !board.classList.contains( 'board-table-view' ))
			board.classList.add( 'board-table-view' );
	}

	function disableTable()
	{
		const board = $_( 'board' );
		if( !board || !board.classList.contains( 'board-table-view' ))
			return;

		board.classList.remove( 'board-table-view' );
	}

	init();
}