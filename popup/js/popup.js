document.body.addEventListener(
	'change',
	function( e )
	{
		if( e.target.getAttribute( 'data-toggle' ) === 'set' )
			settings.setForCurrentBoard( e.target.getAttribute( 'data-target' ), e.target.value );
		else if( e.target.getAttribute( 'data-toggle' ) === 'toggle' )
			settings.setForCurrentBoard( e.target.getAttribute( 'data-target' ), e.target.checked );

		updateDependence();
	}
);

function updateDependence(  )
{
	var inputs = $$( '[data-required]' );
	for( var i = inputs.length - 1; i >= 0; --i )
	{
		var required = inputs[i].getAttribute( 'data-required' );
		var parent_input = $('[data-toggle="toggle"][data-target="'+required+'"]');
		inputs[i].disabled = !( parent_input && parent_input.checked );
	}
}

$('#options-page-link').addEventListener( 'click', function() {
	getBrowserObject().runtime.openOptionsPage();
	window.close();
});

var settings = new Settings( function()
{
	var inputs = $$( '[data-toggle=set]' );
	for( var i = inputs.length - 1; i >= 0; --i )
		inputs[i].value = settings.getForCurrentBoard( inputs[i].getAttribute( 'data-target' ));

	inputs = $$( '[data-toggle=toggle]' );
	for( i = inputs.length - 1; i >= 0; --i )
		inputs[i].checked = settings.getForCurrentBoard( inputs[i].getAttribute( 'data-target' ));

	updateDependence();
});

var tab_links = $$( '[data-toggle="tab"]');
for( var i = tab_links.length - 1; i >= 0; --i )
{
	tab_links[i].addEventListener(
		'click',
		function()
		{
			var target = this.getAttribute('data-target' );
			var tabs = $$( '.tab' );
			for( var i = tabs.length - 1; i >= 0; --i )
				tabs[i].classList.toggle( 'hidden', tabs[i].id !== target );
		}
	)
}

var message_links = $$( '[data-toggle="message"]');
for( i = message_links.length - 1; i >= 0; --i )
{
	message_links[i].addEventListener(
		'click',
		function()
		{
			var target = this.getAttribute('data-target' );
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
								code: target
							}
						}
					);
					window.close();
				}
			);
		}
	)
}