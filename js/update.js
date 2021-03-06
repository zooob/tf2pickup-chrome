(function () {
    "use strict";

    var pickup = {
        updateInterval: 30,
        enableNotifications: false,
        scout: '-',
        soldier: '-',
        demoman: '-',
        medic: '-'
    };

    pickup.refresh = function () {        
        chrome.storage.sync.get({
            enableNotifications: false,
        }, function(items) {
            pickup.enableNotifications = items.enableNotifications;
        });

        var request = new XMLHttpRequest();
        request.open('GET', 'http://tf2pickup.net/ajax/pickup.json', true);
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                var data = JSON.parse(this.response);
                var numPlayers = 0;

                var sixes = data['6v6'];

                for (var key in sixes) {
                    var count = parseInt(sixes[key]);                   
                    numPlayers += count;
                };

                chrome.browserAction.setBadgeText({ text: String(numPlayers) });

                pickup.scout = String(sixes.scout || 0);
                pickup.soldier = String(sixes.soldier || 0);
                pickup.demoman = String(sixes.demoman || 0);
                pickup.medic = String(sixes.medic || 0);

                pickup.refreshView();
                pickup.notify(numPlayers);
            } else {
                console.error('Failed to download pickup.json');
                pickup.clearView();                
            }
        };

        request.onerror = function() {
            console.error('Failed to connect to server');
            pickup.clearView();
        };

        request.send();
    }

    pickup.refreshView = function() {
        var views = chrome.extension.getViews({ type: "popup" });
        for (var i = 0; i < views.length; i++) {
            views[i].document.getElementById('scout').innerHTML = pickup.scout;
            views[i].document.getElementById('soldier').innerHTML = pickup.soldier;
            views[i].document.getElementById('demoman').innerHTML = pickup.demoman;
            views[i].document.getElementById('medic').innerHTML = pickup.medic;
        }           
    }

    pickup.clearView = function() {
        chrome.browserAction.setBadgeText({ text: '-' });
        pickup.scout = '-';
        pickup.soldier = '-';
        pickup.demoman = '-';
        pickup.medic = '-';
        refreshView();       
    }

    pickup.notify = function(numPlayers) {
        if (pickup.enableNotifications === true && numPlayers > 6) {
            chrome.notifications.create('pickup', {
                type: 'basic',
                iconUrl: 'img/icon.png',
                title: 'TF2Pickup.net',
                message: 'Pickup is filling up!',           
            }, function (notificationId) {});
        } else {
            chrome.notifications.clear('pickup', function(wasCleared) {});
        }
    }

    pickup.init = function() {
        pickup.refresh();
        var interval = pickup.updateInterval;

        if (!isFinite(interval) || interval < 10) {
            interval = 30;
        }

        pickup.timer = window.setInterval(pickup.refresh, interval * 1000);
    }

    chrome.extension.onConnect.addListener(function(port) {
        pickup.refreshView();
        pickup.refresh();
    });

    pickup.init();

})();