// ==UserScript==
// @id             iitc-plugin-highlight-portals-supply-base@cantzler
// @name           IITC plugin: highlight portals supply base
// @category       Highlighter
// @version        0.0.2.20160303.000002
// @namespace      https://github.com/cantzler
// @updateURL      https://github.com/cantzler/iitc-user-plugins/raw/master/portal-highlighter-supply-base.user.js
// @downloadURL    https://github.com/cantzler/iitc-user-plugins/raw/master/portal-highlighter-supply-base.user.js
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
// Kindly stolen and modified from src: https://github.com/fl0o0l/iitc/raw/master/portal-highlighter-supply-base.user.js

function wrapper(plugin_info) {
  // ensure plugin framework is there, even if iitc is not yet loaded
  if (typeof window.plugin !== 'function') window.plugin = function() {};

  //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
  //(leaving them in place might break the 'About IITC' page or break update checks)
  plugin_info.buildName = 'local';
  plugin_info.dateTimeVersion = '20160303.000001';
  plugin_info.pluginId = 'portal-highlighter-supply-base';
  //END PLUGIN AUTHORS NOTE

  // PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.portalHighlighterPortalsSupplyBase = function() {};

  window.plugin.portalHighlighterPortalsSupplyBase.highlighter = function(marker) {
    // the highlighter recieves the marker, but this doesn't work when we're going based on the portalDetailLoaded hook so we need a sub that just takes portal data
    window.plugin.portalHighlighterPortalsSupplyBase.colorPortal(marker.portal)
  };

  window.plugin.portalHighlighterPortalsSupplyBase.colorPortal = function(portal) {
    // shorten some common vars
    var guid = portal.options.guid;
    var p_opt = portal.options;
    var p_dat = portal.options.data;
    // variables per portal
    var myBorderColor;
    var myBorderOpacity;
    var myFillColor;
    var myFillOpacity;
    var myBorderRadius;
    var myBorderWeight;
    var myBorderDash;

    // First make sure we want to check this portal (is a valid portal and captured)
    // TODO: currently this filters to ENL-only, but it can be interesting for RES. Consider making it a separate highlight mode.
    if (guid && portal.options.team !== undefined && p_opt.team == TEAM_ENL && p_dat.resCount !== undefined && p_dat.resCount >= 1) {
      var detail = portalDetail.get(guid);
      // if we have details
      if (detail) {
        // and the portal has mods, run the coloring
        if (detail.mods.length !== 0) {
          // Initialization
          var shieldScore = 0.01;
          var mhScore = 0.01;
          var hsScore = 0.01;
          var itoScore = 0.10;
          var tmpValue = 0;
          var modCount = 0;
          //MOD Tabulation
          $.each(detail.mods, function(ind, mod) {
            if (mod && mod !== undefined && mod !== null && mod.name !== undefined && mod.rarity !== undefined) {
              switch (mod.rarity) {
                case 'VERY_RARE':
                  tmpValue = 0.5;
                  modCount += 1;
                  break;
                case 'RARE':
                  tmpValue = 0.25;
                  modCount += 1;
                  break;
                case 'COMMON':
                  tmpValue = 0.1;
                  modCount += 1;
                  break;
                default:
                  tmpValue = 0;
              }
              switch (mod.name) {
                case 'AXA Shield':
                  shieldScore += 0.3; //0.5;
                  break;
                case 'Portal Shield':
                  shieldScore += (tmpValue / 2); // shield score needs knocked down to account for AXA
                  break;
                case 'Heat Sink':
                  hsScore += tmpValue;
                  break;
                case 'Multi-hack':
                  mhScore += tmpValue;
                  break;
                case 'Ito En Transmuter (-)':
                  itoScore += tmpValue;
                  break;
                case 'Ito En Transmuter (+)':
                  itoScore += (tmpValue / 2); // yaknow, its a ploose
                  break;
              }
            }
          });
          // Shield Score to Border
          // examples:  1 AXA = 0.5   (red)
          //            2 VRS = 0.5   (red)
          //            4 RS  = 0.5   (red)
          //     1 VRS + 1 RS = 0.375 (orange)
          //            3 RS  = 0.375 (orange)
          //            2 RS  = 0.25  (yellow)
          if (shieldScore > 0.5) {
            myBorderColor = '#ff0000';
            myBorderOpacity = Math.min(shieldScore, 1);
            //console.log('WARNING "' + data.portal.options.data.title + '"');
          } else if (shieldScore >= 0.25) {
            myBorderColor = '#ff8c00';
            myBorderOpacity = Math.min(shieldScore * 2, 1);
            //console.log('NOTE "' + data.portal.options.data.title + '"');
          } else if (shieldScore >= 0.01) {
            myBorderColor = '#ffff00';
            myBorderOpacity = Math.min(shieldScore * 4, 1);
            //console.log('NOTE "' + data.portal.options.data.title + '"');
          } else {
            myBorderColor = '#000000';
            myBorderOpacity = 0.3;
          }

          // Multi-hack Score to Fill Color
          // examples:  1 VRMH = 0.5  (red)
          //            2 RMH  = 0.5  (red)
          //     1 RMH + 2 CMH = 0.35 (orange)
          //            1 RMH  = 0.25 (orange)
          //            2 CMH  = 0.2  (yellow)
          //            1 CMH  = 0.1  (yellow)
          mhScore += itoScore; // it just gives extra stuff, like a free... hack... err a multi... hack?
          if (mhScore > 0.5) {
            myFillColor = '#ff0000';
            //console.log('WARNING "' + data.portal.options.data.title + '"');
          } else if (mhScore >= 0.25) {
            myFillColor = '#ff8c00';
            //console.log('NOTE "' + data.portal.options.data.title + '"');
          } else if (mhScore >= 0.1) {
            myFillColor = '#ffff00';
            //console.log('NOTE "' + data.portal.options.data.title + '"');
          } else {
            myFillColor = '#ffffff';
          }
          // Heat Sink Score to Fill Opacity
          // see MH table for color, then add 0.5
          myFillOpacity = Math.min(0.5 + hsScore, 1);

          // Gear Payout to Border
          // examples:  1 ITO+ = 0.5   (red)
          //   1 ITO- + 1 VRMH = 1.0   (red)
          //   2 ITO- + 1 VRMH = 1.5   (red)
          //            4 RMH  = 1.0   (red)
          //            4 CMH  = 0.4   (red)
          var gear_payout = Math.floor(2*(hsScore + mhScore + itoScore));
          myBorderRadius = 10 + 4*gear_payout;
          myBorderWeight = 5;// + 2*gear_payout;

          if (modCount == 4) {
              myBorderDash = "10,0";
          } else if (modCount == 3) {
              myBorderDash = "7,5";
          } else if (modCount == 2) {
              myBorderDash = "5,7";
          } else {
              myBorderDash = "2,10";
          }
        }
      } else {
        // otherwise request the details
        portalDetail.request(guid);
        return;
      }
    } else { // If this portal is RES or uncaptured don't color it
      myFillColor = '#ffffff';
      myFillOpacity = 0.0;
      myBorderColor = '#ffffff';
      myBorderOpacity = 0.0;
    }

    if (guid) {
      portal.setStyle({
        fillColor: myFillColor,
        fillOpacity: myFillOpacity,
        color: myBorderColor,
        opacity: myBorderOpacity,
        weight: myBorderWeight,
        dashArray: myBorderDash,
        radius: myBorderRadius,
      });
    }
  }
  var setup = function() {
    window.addPortalHighlighter('Supply Base', window.plugin.portalHighlighterPortalsSupplyBase.highlighter);
  }

  // add a portalDetailLoaded hook to refresh the portal
  addHook('portalDetailLoaded', function(data) {
    if (window._current_highlighter == "Supply Base") {
      // this is hacky, but I think it will work. Call the "regular" function (which takes portal data) using the GUID from the hook.
      // this will request the details from the cache and if not found it will re-request the details from IITC
      // TODO: how do we avoid an infiniate loop of detail requests?
      window.plugin.portalHighlighterPortalsSupplyBase.colorPortal(portals[data.guid])
    }
  });

  // PLUGIN END //////////////////////////////////////////////////////////

  setup.info = plugin_info; //add the script info data to the function as a property
  if (!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  // if IITC has already booted, immediately run the 'setup' function
  if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = {
  version: GM_info.script.version,
  name: GM_info.script.name,
  description: GM_info.script.description
};
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
