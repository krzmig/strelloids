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
		strelloids.modules.events.add( 'onCollapseAllLists', collapseAll );
		strelloids.modules.events.add( 'onExpandAllLists', expandAll );
	}

	function update()
	{
		var collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		var lists = $$( '#board > .js-list' );
		for( var i = lists.length - 1; i >= 0; --i )
		{
			var id = lists[i].id.replace( 'list-', '' );
			var hide = strelloids.modules.settings.getForList( id, 'hidden' );
			if( collapseEmpty && hide === null )
				hide = !lists[i].querySelector( '.list-card' );
			lists[i].classList.toggle( 'list-hidden', hide );
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
		var list = $_( 'list-' + list_id );
		var old_value = strelloids.modules.settings.getForList( list_id, 'hidden' );
		var new_value = !old_value;

		var collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		if( collapseEmpty )
		{
			var is_empty = !list.querySelector( '.list-card' );
			if( old_value === null && is_empty )
				new_value = false;
			if( new_value && is_empty )
				new_value = null;
		}
		if( new_value )
			strelloids.modules.settings.setForList( list_id, 'hidden', true );
		else if( new_value === false )
			strelloids.modules.settings.setForList( list_id, 'hidden', false );
		else if( new_value === null )
			strelloids.modules.settings.resetForList( list_id, 'hidden' );

		if( DEBUG )
			$log( 'Strelloids: module toggleList - list', list_id, new_value ? 'shown in' : 'hidden' );

		$( '.pop-over' ).classList.remove('is-shown');
	}

	function collapseAll()
	{
		var lists = $$( '#board > .js-list' );
		var collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		for( var i = lists.length - 1; i >= 0; --i )
		{
			var hide = true;
			if( collapseEmpty && !lists[i].querySelector( '.list-card' ))
				hide = null

			var id = lists[i].id.replace( 'list-', '' );
			if( hide )
				strelloids.modules.settings.setForList( id, 'hidden', true );
			else
				strelloids.modules.settings.resetForList( id, 'hidden' );
		}
	}

	function expandAll()
	{
		var lists = $$( '#board > .js-list' );
		var collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		for( var i = lists.length - 1; i >= 0; --i )
		{
			var hide = null;
			if( collapseEmpty && !lists[i].querySelector( '.list-card' ))
				hide = false

			var id = lists[i].id.replace( 'list-', '' );
			if( hide === false )
				strelloids.modules.settings.setForList( id, 'hidden', false );
			else
				strelloids.modules.settings.resetForList( id, 'hidden' );
		}
	}

	init();
}