// ==UserScript==
// @name	ao3-get-recs
// @description	generate recommendations from an AO3 work based on the bookmarks of that work's bookmarkers
//
// @author	Vasileios Pasialiokis <whiterocket@outlook.com>
// @namespace https://github.com/vaaas/
// @downloadURL	https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_get_recs.js
//
// @license	AGPLv3 - https://www.gnu.org/licenses/agpl.html
//
// @match	https://archiveofourown.org/works/*
// @match	http://insecure.archiveofourown.org/*
//
// @version	0.2.0
// @updateURL	https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_get_recs.js
// ==/UserScript==

(function() {
'use strict'
const $ = x => document.querySelector(x),
$$ = (q, n=document) => Array.from(n.querySelectorAll(q)),
parse_dom = x => new DOMParser().parseFromString(x, 'text/html').body,
sleep = n => new Promise(yes => setTimeout(()=>yes(true), n)),
get = x => fetch(x).then(async (x) => { await sleep(1000) ; return x.text() }),
elem = x => document.createElement(x)

async function give_me_recs(event) {
	const x = $('dd.bookmarks a')
	if (!x) alert('no bookmarks!')
	event.target.innerText = 'Please wait...'
	const results = elem('ul')
	results.className = 'bookmark index group'
	$('#kudos').before(results)
	await get(x.href)
		.then(parse_dom)
		.then(x => $$('ol.bookmark li.user h5 a', x).map(x => x.href + '/bookmarks'))
		.then(x => x.sort(() => Math.random() - 0.5))
		.then(x => { x.length = x.length > 2 ? 2 : x.length ; return x })
		.then(x => x.map(x => get(x).then(parse_dom).then(x => $$('ol.bookmark li.bookmark', x))))
		.then(async (x) => x.forEach(async (x) => (await x).forEach(x => results.appendChild(x))))
		.then(() => event.target.remove())
}

function main() {
	const x = $('#feedback ul.actions'),
	li = elem('li'),
	a = elem('a')
	a.innerText = 'Get recs'
	a.onclick = give_me_recs
	li.appendChild(a)
	x.appendChild(li)
}

main()
})()
