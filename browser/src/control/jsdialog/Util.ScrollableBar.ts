/* -*- js-indent-level: 8 -*- */
/*
 * Copyright the Collabora Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * JSDialog.ScrollableBar - helper for creating toolbars with scrolling left/right
 */

/* global JSDialog $ */

declare var JSDialog: any;

function createScrollButtons(parent: Element, scrollable: Element) {
	L.DomUtil.addClass(scrollable, 'ui-scroll-wrapper');

	const left = L.DomUtil.create('div', 'ui-scroll-left', parent);
	const right = L.DomUtil.create('div', 'ui-scroll-right', parent);

	JSDialog.AddOnClick(left, () => {
		const scroll = $(scrollable).scrollLeft() - 300;
		$(scrollable).animate({ scrollLeft: scroll }, 300);
		setTimeout(function () {
			JSDialog.RefreshScrollables();
		}, 350);
	});

	JSDialog.AddOnClick(right, () => {
		const scroll = $(scrollable).scrollLeft() + 300;
		$(scrollable).animate({ scrollLeft: scroll }, 300);
		setTimeout(function () {
			JSDialog.RefreshScrollables();
		}, 350);
	});
}

function showArrow(arrow: HTMLElement, show: boolean) {
	if (show) arrow.style.setProperty('display', 'block');
	else arrow.style.setProperty('display', 'none');
}

function setupResizeHandler(container: Element, scrollable: Element) {
	const left = container.querySelector('.ui-scroll-left') as HTMLElement;
	const right = container.querySelector('.ui-scroll-right') as HTMLElement;
	const handler = function () {
		const rootContainer = scrollable.querySelector('div');
		if (!rootContainer) return;

		if (rootContainer.scrollWidth > window.innerWidth) {
			// we have overflowed content
			const direction = this._RTL ? -1 : 1;
			if (direction * scrollable.scrollLeft > 0) {
				if (this._RTL) showArrow(right, true);
				else showArrow(left, true);
			} else if (this._RTL) showArrow(right, false);
			else showArrow(left, false);

			if (
				direction * scrollable.scrollLeft <
				rootContainer.scrollWidth - window.innerWidth - 1
			) {
				if (this._RTL) showArrow(left, true);
				else showArrow(right, true);
			} else if (this._RTL) showArrow(left, false);
			else showArrow(right, false);
		} else {
			showArrow(left, false);
			showArrow(right, false);
		}
	}.bind(this);

	window.addEventListener('resize', handler);

	// No longer need to listen for scroll events, as we've made the toolbar
	// unscrollable. You'd need to use the arrow buttons instead.
	// // window.addEventListener('scroll', handler);

	// This will watch to see if a tabpanel is being shown / hidden, as that would
	// indicate the user has switched menu tabs.
	// So we'll recalculate whether or not we need the scroll arrows.
	const tabPanelUnhiddenObserver = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			// We're just going to assume any changes to classes means we are
			// toggling the 'hidden' class, and hence switching tabs.
			if (
				mutation.type === 'attributes' &&
				mutation.attributeName === 'class'
			) {
				handler();
			}
		}
	});

	// At the time this function is called, the tab panels have not been created
	// yet, so we need to watch for them to be created.
	const tabPanelsAddedObserver = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach((node) => {
					if (
						node instanceof HTMLElement &&
						node.matches('.ui-content.notebookbar')
					) {
						// New tab panel added
						// Now watch for it to be hidden / shown
						tabPanelUnhiddenObserver.observe(node, {
							attributes: true, // Observe attribute changes
							attributeFilter: ['class'], // Only watch for class attribute changes
						});
					}
				});
			}
		}
	});
	tabPanelsAddedObserver.observe(container, {
		childList: true,
		subtree: true,
	});
}

JSDialog.MakeScrollable = function (parent: Element, scrollable: Element) {
	L.DomUtil.addClass(scrollable, 'ui-scrollable-content');
	createScrollButtons(parent, scrollable);
	setupResizeHandler(parent, scrollable);
};

JSDialog.RefreshScrollables = function () {
	window.dispatchEvent(new Event('resize'));
};
