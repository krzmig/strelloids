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

				let list = e.target.closest( 'li[data-list-id]' );
				toggleVisibility( list.dataset.listId );
			},
			true
		);
		strelloids.modules.events.add( 'onUpdate', update );
		strelloids.modules.events.add( 'onCollapseAllLists', collapseAll );
		strelloids.modules.events.add( 'onExpandAllLists', expandAll );
	}

	function update()
	{
		let collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		$$( '#board > li' ).forEach(( list ) => {
			let hide = strelloids.modules.settings.getForList( list.dataset.listId, 'hidden' );
			if( collapseEmpty && hide === null )
				hide = !list.querySelector( '[data-card-id]' );
			list.classList.toggle( 'list-hidden', hide );
		});
		appendToggleOption();
	}

	function appendToggleOption()
	{
		$$('[data-testid="list-header"]').forEach(( header ) => {
			if( !header.querySelector( '.list-visibility-switcher' ))
				header.insertBefore(
					createNode( 'span', { class: 'list-visibility-switcher' }),
					header.firstChild
				);
		});
	}

	/**
	 * @param {string} list_id
	 */
	function toggleVisibility( list_id )
	{
		let list = $( '[data-list-id="' + list_id + '"]' );
		let old_value = strelloids.modules.settings.getForList( list_id, 'hidden' );
		let new_value = !old_value;

		if( strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' ))
		{
			let is_empty = !list.querySelector( '[data-testid="list-card"]' );
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
		let collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		$$( '#board > li' ).forEach(( list ) => {
			let hide = true;
			if( collapseEmpty && !list.querySelector( '[data-card-id]' ))
				hide = null

			if( hide )
				strelloids.modules.settings.setForList( list.dataset.listId, 'hidden', true );
			else
				strelloids.modules.settings.resetForList( list.dataset.listId, 'hidden' );
		})
	}

	function expandAll()
	{
		let collapseEmpty = strelloids.modules.settings.getGlobal( 'module.listsCollapsing.collapseEmptyLists' );
		$$( '#board > li' ).forEach(( list ) => {
			let hide = null;
			if( collapseEmpty && !list.querySelector( '[data-card-id]' ))
				hide = false

			if( hide === false )
				strelloids.modules.settings.setForList( list.dataset.listId, 'hidden', false );
			else
				strelloids.modules.settings.resetForList( list.dataset.listId, 'hidden' );
		});
	}

	init();
}