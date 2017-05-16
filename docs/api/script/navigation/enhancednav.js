(function()
{
   'use strict';
   /* eslint-disable */

   // Add jQuery sliding animation for accordion menu.
   var accordionMenu = $('.nav-accordion-menu');
   if( accordionMenu.length > 0 )
   {
      accordionMenu.each(function()
      {
         var accordion = $(this);

         // Detect change in the input[type="checkbox"] value
         accordion.on('change', 'input[type="checkbox"]', function()
         {
            var checkbox = $(this);
            ( checkbox.prop('checked') ) ? checkbox.siblings('ul').attr('style', 'display:none;').slideDown(200) :
             checkbox.siblings('ul').attr('style', 'display:block;').slideUp(200);
         });
      });
   }

   /**
    * Deserializes navigation accordion state from session storage.
    */
   function deserializeNavState()
   {
      var navID = $('.navigation .nav-accordion-menu').data('nav-id');

      if (sessionStorage)
      {
         var checkboxMap = sessionStorage.getItem(navID + '-accordion-state');

         // If there is no data in session storage then create an empty map.
         if (checkboxMap == null) { checkboxMap = '{}'; }

         checkboxMap = JSON.parse(checkboxMap);

         $('.navigation .nav-accordion-menu').find('input[type="checkbox"]').each(function()
         {
            var checkboxValue = checkboxMap[$(this).attr('name')];
            if (typeof checkboxValue === 'boolean') { $(this).prop('checked', checkboxValue); }
         });
      }

      // Set navigation menu visible
      $('.navigation .nav-accordion-menu').removeClass('hidden');

      // Set navigation menu scroll bar from session state.
      if (sessionStorage)
      {
         var navScrollTop = sessionStorage.getItem(navID + '-scrolltop');
         if (typeof navScrollTop === 'string') { $('.navigation').prop('scrollTop', navScrollTop); }
      }
   }

   /**
    * Hides the nav context menu if visible. If an event is supplied it is checked against any existing context menu
    * and is ignored if the context menu is within the parent hierarchy.
    *
    * @param {object|undefined}  event - Optional event
    */
   function hideNavContextMenu(event)
   {
      var contextMenuButton = $('#context-menu');
      var popupmenu = $('#contextpopup .mdl-menu__container');

      // If an event is defined then make sure it isn't targeting the context menu.
      if (event)
      {
         // Picked element is not the menu
         if (!$(event.target).parents('#contextpopup').length > 0)
         {
            // Hide menu if currently visible
            if (popupmenu.hasClass('is-visible')) { contextMenuButton.click(); }
         }
      }
      else // No event defined so always close context menu and remove node highlighting.
      {
         // Hide menu if currently visible
         if (popupmenu.hasClass('is-visible')) { contextMenuButton.click(); }
      }
   }

   /**
    * Shows the nav context menu
    *
    * @param {object}   event - jQuery mouse event
    */
   function onNavContextClick(event)
   {
      // Hides any existing nav context menu.
      hideNavContextMenu(event);

      var target = $(this);

      var packageLink = target.data('package-link');
      var packageType = target.data('package-type') || '...';

      // Create proper name for package type.
      switch (packageType)
      {
         case 'npm':
            packageType = 'NPM';
            break;
      }

      var packageVersion = target.data('package-version');

      var scmLink = target.data('scm-link');
      var scmType = target.data('scm-type') || '...';

      // Create proper name for SCM type.
      switch (scmType)
      {
         case 'github':
            scmType = 'Github';
            break;
      }

      var popupmenu = $('#contextpopup .mdl-menu__container');

      // Populate data for the context menu.
      popupmenu.find('li').each(function(index)
      {
         var liTarget = $(this);

         switch (index)
         {
            case 0:
               if (scmLink)
               {
                  liTarget.text('Open on ' + scmType);
                  liTarget.data('link', scmLink);
                  liTarget.removeClass('hidden');

                  // Add divider if there are additional non-hidden items
                  if (packageLink || packageVersion) { liTarget.addClass('mdl-menu__item--full-bleed-divider'); }
                  else { liTarget.removeClass('mdl-menu__item--full-bleed-divider'); }
               }
               else
               {
                  liTarget.addClass('hidden');
               }
               break;

            case 1:
               if (packageLink)
               {
                  liTarget.text('Open on ' + packageType);
                  liTarget.data('link', packageLink);
                  liTarget.removeClass('hidden');

                  // Add divider if there are additional non-hidden items
                  if (packageVersion) { liTarget.addClass('mdl-menu__item--full-bleed-divider'); }
                  else { liTarget.removeClass('mdl-menu__item--full-bleed-divider'); }
               }
               else
               {
                  liTarget.addClass('hidden');
               }
               break;

            case 2:
               if (packageVersion)
               {
                  liTarget.text('Version: ' + packageVersion);
                  liTarget.removeClass('hidden');
               }
               else
               {
                  liTarget.addClass('hidden');
               }
               break;
         }
      });

      // Wrapping in a 100ms timeout allows MDL to draw animation when showing a context menu after one has been hidden.
      setTimeout(function()
      {
         // For MDL a programmatic click of the hidden context menu.
         var contextMenuButton = $("#context-menu");
         contextMenuButton.click();

         // Necessary to defer reposition of the context menu.
         setTimeout(function()
         {
            popupmenu.parent().css({ position: 'relative' });
            popupmenu.css({ left: event.pageX, top: event.pageY - $('header').outerHeight(), position:'absolute' });
         }, 0);
      }, 100);
   }

   /**
    * Handles clicks on the nav context menu invoking any active actions.
    */
   function onNavContextMenuClick()
   {
      // When a context menu is selected remove node highlighting.
      hideNavContextMenu();

      switch ($(this).data('action'))
      {
         case 'openLink':
            var link = $(this).data('link');

            if (typeof link === 'string')
            {
               window.open(link, '_blank', 'location=yes,menubar=yes,scrollbars=yes,status=yes');
            }
            break;
      }
   }

   /**
    * Serializes to session storage the navigation menu accordion state.
    */
   function serializeNavState()
   {
      var checkboxMap = {};

      $('.navigation .nav-accordion-menu').find('input[type="checkbox"]').each(function()
      {
         checkboxMap[$(this).attr('name')] = $(this).is(':checked');
      });

      var navID = $('.navigation .nav-accordion-menu').data('nav-id');

      if (sessionStorage) { sessionStorage.setItem(navID + '-accordion-state', JSON.stringify(checkboxMap))}
   }

   /**
    * Serializes to session storage the navigation menu scroll state.
    */
   function serializeScrollState()
   {
      if (sessionStorage)
      {
         var navID = $('.navigation .nav-accordion-menu').data('nav-id');
         sessionStorage.setItem(navID + '-scrolltop', $('.navigation').prop('scrollTop'));
      }
   }

   // Stores navigation scroll position in session storage.
   $('.navigation .nav-accordion-menu li a').on('click', serializeScrollState);

   // Stores navigation accordion state changes in session storage.
   $('.navigation :checkbox').change(serializeNavState);

   // Handle context menu clicked
   $('#contextpopup li[data-action]').on('click', onNavContextMenuClick);

   // Prevent default browser context menu from being triggered.
   $('.nav-accordion-menu').bind('contextmenu', function(event) { event.preventDefault(); });
   $('#contextpopup').bind('contextmenu', function(event) { event.preventDefault(); });

   // Properly handle closing context menu when document mouse down clicked
   // This works when a context click occurs because the new context menu is shown with a small timeout.
   $(document).bind('mousedown', hideNavContextMenu);
   $(window).bind('resize', hideNavContextMenu);

   $('[data-package-link], [data-scm-link]').bind('contextmenu', onNavContextClick);

   // Potentially deserialize accordion state on document load.
   $(document).ready(deserializeNavState);
})();