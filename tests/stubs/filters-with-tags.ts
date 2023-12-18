/* eslint-disable max-len */

export const EXAMPLE_DIFF_PATH_TAG = '! Diff-Path: ../patches/1/1-m-28378132-60.patch';

export const FILTER_1 = `! Title: Batch-Updatable List 1
${EXAMPLE_DIFF_PATH_TAG}
||example.com^`;

export const FILTER_2 = `! Checksum: kgX9MhsVOPoS7ksbmFj78A
! Title: AdGuard Base filter
! Description: EasyList + AdGuard English filter. This filter is necessary for quality ad blocking.
! Version: 2.3.12.82
! TimeUpdated: 2023-12-17T09:35:09+00:00
! Expires: 4 days (update frequency)
${EXAMPLE_DIFF_PATH_TAG}
! Homepage: https://github.com/AdguardTeam/AdGuardFilters
! License: https://github.com/AdguardTeam/AdguardFilters/blob/master/LICENSE
!
!-------------------------------------------------------------------------------!
!------------------ General JS API ---------------------------------------------!
!-------------------------------------------------------------------------------!
! JS API START
#%#var AG_onLoad=function(func){if(document.readyState==="complete"||document.readyState==="interactive")func();else if(document.addEventListener)document.addEventListener("DOMContentLoaded",func);else if(document.attachEvent)document.attachEvent("DOMContentLoaded",func)};
#%#var AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};
#%#var AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };
#%#var AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };
#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };
!`;

export const FILTER_3_TWO_TAGS = `${EXAMPLE_DIFF_PATH_TAG}
! Checksum: /0M54N/N9nzEPUDQtMFT0w
! Title: AdGuard Russian filter
! Description: Filter that enables ad blocking on websites in Russian language.
! Version: 2.0.86.99
! TimeUpdated: 2023-12-16T00:49:19+00:00
! Expires: 4 days (update frequency)
! Homepage: https://github.com/AdguardTeam/AdGuardFilters
! License: https://github.com/AdguardTeam/AdguardFilters/blob/master/LICENSE
!
!-------------------------------------------------------------------------------!
!------------------ General JS API ---------------------------------------------!
!-------------------------------------------------------------------------------!
! JS API START
example.com
example.com
example.com
example.com
example.com
!
! AG_removeCookie
! Examples: AG_removeCookie('/REGEX/') or AG_removeCookie('part of the cookie name')
!
example.com
!
! AG_defineProperty
! See https://github.com/AdguardTeam/deep-override
!
example.com
!
! AG_abortOnPropertyWrite(property, debug)
! Aborts execution of a script when it attempts to write the specified property.
! Based on AG_defineProperty (https://github.com/AdguardTeam/deep-override)
!
! Examples:
! AG_abortOnPropertyWrite('String.fromCharCode');
!
! @param property property or properties chain
! @param debug optional, if true - we will print warning when script is aborted.
!
example.com
!
! AG_abortOnPropertyRead(property, debug)
! Aborts execution of a script when it attempts to read the specified property.
! Based on AG_defineProperty (https://github.com/AdguardTeam/deep-override)
!
! Examples:
! AG_abortOnPropertyRead('String.fromCharCode');
!
! @param property property or properties chain
! @param debug optional, if true - we will print warning when script is aborted.
!
! Diff-Path: ../patches/1/1-m-28378333-60.patch
#%#var AG_abortOnPropertyRead=function(a,b){var c=Math.random().toString(36).substr(2,8);AG_defineProperty(a,{beforeGet:function(){b&&console.warn("AdGuard aborted property read: "+a);throw new ReferenceError(c);}});var d=window.onerror;window.onerror=function(e){if("string"===typeof e&&-1!==e.indexOf(c))return b&&console.warn("AdGuard has caught window.onerror: "+a),!0;if(d instanceof Function)return d.apply(this,arguments)}};`;
