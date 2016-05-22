### *css3-mediaqueries.js* - CSS Helper and CSS3 Media Queries Enabler

***Author:*** [Wouter van der Graaf](https://github.com/woutervandergraaf)

***License:*** MIT

***Website:*** <http://code.google.com/p/css3-mediaqueries-js/>

***Browser support:*** IE 5+, Firefox 1+ and Safari 2.

Firefox 3.5+, Opera 7+, Safari 3+ and Chrome already offer native support.

#### W3C Media Queries spec: <http://www.w3.org/TR/css3-mediaqueries/>

###### Usage:
just include the script in your pages.

(And you should combine and compress with other scripts and include it just before &lt;/body&gt; for better page speed - but you already knew that).

Write your media queries like you would for browsers with native support. The script will parse your CSS and apply the styles for positive media query tests realtime (also when you resize).

>Note: Doesn't work on `@import`'ed stylesheets (which you shouldn't use anyway for performance reasons). Also won't listen to the media attribute of the &lt;link&gt; and &lt;style&gt; elements.

####Note: this fork has patches/fixes that are not available in the original Google Code repo
