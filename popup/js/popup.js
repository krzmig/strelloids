lang.setDomain( 'popup' );
lang.htmlTranslation();

document.body.addEventListener( 'change', ( e ) => {
	if( e.target.dataset.toggle === 'set' )
		settings.setForCurrentBoard( e.target.dataset.target, e.target.value );
	else if( e.target.dataset.toggle === 'toggle' )
		settings.setForCurrentBoard( e.target.dataset.target, e.target.checked );

	updateDependence();
});

function updateDependence(  )
{
	$$( '[data-required]' ).forEach(( input ) => {
		let parent_input = $('[data-toggle="toggle"][data-target="' + input.dataset.required + '"]');
		input.disabled = !( parent_input && parent_input.checked );
	});
}

$('#options-page-link').addEventListener( 'click', () => {
	getBrowserObject().runtime.openOptionsPage();
	window.close();
});

let settings = new Settings( () => {
	$$( '[data-toggle=set]' ).forEach(( input ) => {
		input.value = settings.getForCurrentBoard( input.dataset.target );
	});
	$$( '[data-toggle=toggle]' ).forEach(( input ) => {
		input.checked = settings.getForCurrentBoard( input.dataset.target );
	});
	updateDependence();
});

$$( '[data-toggle="tab"]').forEach(( link ) => {
	link.addEventListener( 'click', () => {
		$$( '.tab' ).forEach(( tab ) => {
			tab.classList.toggle( 'hidden', tab.id !== link.dataset.target );
		});
	});
});

$$( '[data-toggle="message"]').forEach(( link ) => {
	link.addEventListener( 'click', () => {
		getBrowserObject().tabs.query(
			{
				currentWindow: true,
				active: true
			},
			function( tabs )
			{
				getBrowserObject().tabs.sendMessage(
					tabs[0].id,
					{
						event: {
							code: link.dataset.target
						}
					}
				);
				window.close();
			}
		);
	});
});