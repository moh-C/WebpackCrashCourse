var forEach = function(array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, array[i], i);
    }
};
var durationInFrames = 20;

document.addEventListener('DOMContentLoaded', function() {
    var anchors = document.querySelectorAll('a[href*="#"]:not([href="#"])');
    forEach(anchors, function(node) {
        node.addEventListener('click', function(event) {
            var id = this.href.match(/\#[\w-]+$/);
            var targetElement = document.querySelector(id);
            if (targetElement) {
                event.preventDefault();
                var amountToScroll = targetElement.getBoundingClientRect().top - window.scrollY;
                var scrollRate = amountToScroll / durationInFrames;
                scrollABit(amountToScroll, scrollRate, function() {
                    targetElement.focus();
                });
            }
        });
    });
});

function scrollABit(remainingScroll, idealScrollRate, callback) {
    if (remainingScroll > 0) {
        requestAnimationFrame(function() {
            var scrollOnThisFrame = remainingScroll > idealScrollRate ? idealScrollRate : remainingScroll;
            window.scrollBy(0, scrollOnThisFrame);
            remainingScroll -= scrollOnThisFrame;
            scrollABit(remainingScroll, idealScrollRate, callback);
        });
    } else {
        if (typeof callback === 'function')
            callback();
    }
}
var HOVER_DELAY = 100;
document.addEventListener('DOMContentLoaded', function() {
    var primaryItems = document.querySelectorAll('.js-primary-navigation-item');
    var primaryItemAnchors = document.querySelectorAll('.js-primary-navigation-item-anchor');
    var submenuItemAnchors = document.querySelectorAll('.js-primary-navigation-submenu-item-anchor');
    var submenuItemAnchorsLast = document.querySelectorAll('.js-primary-navigation-submenu-item:last-child .js-primary-navigation-submenu-item-anchor');
    var hoverDelayHandler;

    forEach(primaryItemAnchors, function(item) {
        item.addEventListener('mouseenter', function() {
            hoverDelayHandler = setTimeout(function() {
                clearTimeout(hoverDelayHandler);
                openClosestSubmenu.call(null, item);
            }, HOVER_DELAY);
        }, false);
        item.addEventListener('keydown', closeSubmenuIfShiftAndTabArePressed, false);
        item.addEventListener('focus', openClosestSubmenu.bind(null, item), false);
    });

    forEach(primaryItems, function(item) {
        item.addEventListener('mouseleave', function() {
            clearTimeout(hoverDelayHandler);
            closeSubmenu.call(null, item);
        }, false);
    });

    forEach(submenuItemAnchors, function(item) {
        item.addEventListener('focus', openClosestSubmenu.bind(null, item), false);
    });

    forEach(submenuItemAnchorsLast, function(item) {
        item.addEventListener('keydown', closeAllSubmenusIfTabIsPressed, false);
    });

    function openClosestSubmenu(element) {
        var node = element.parentNode;
        var methodToCheckIfSelectorMatches = getSelectorMatchesMethod(node);
        while (!node[methodToCheckIfSelectorMatches]('.primary-navigation__item')) {
            node = node.parentNode;
        }
        node.classList.add('primary-navigation__item--open-submenu');
    }

    function closeSubmenuIfShiftAndTabArePressed(event) {
        if (event.which === 9 && event.shiftKey)
            closeSubmenu(event.srcElement.parentNode);
    }

    function getSelectorMatchesMethod(node) {
        var methodsToCheck = ["matches", "matchesSelector", "msMatchesSelector"];
        for (var i = 0; i < methodsToCheck.length; ++i) {
            var methodName = methodsToCheck[i];
            if (node[methodName])
                return methodName;
        }
        return "matches";
    }

    function closeSubmenu(node) {
        node.classList.remove('primary-navigation__item--open-submenu');
    }

    function closeAllSubmenusIfTabIsPressed(event) {
        if (event.which === 9)
            closeAllSubmenus();
    }

    function closeAllSubmenus() {
        forEach(primaryItems, function(node) {
            closeSubmenu(node)
        });
    }
});