// ==UserScript==
// @name	sorted_ao3_freeforms
// @description	sorts ao3 work freeforms
//
// @author	Vasileios Pasialiokis <whiterocket@outlook.com>
// @namespace https://github.com/vaaas/
// @downloadURL	https://raw.githubusercontent.com/vaaas/userscripts/master/sorted_ao3_freeforms.js
//
// @license	AGPLv3 - https://www.gnu.org/licenses/agpl.html
//
// @match	https://archiveofourown.org/works*
//
// @version	0.0.3
// @updateURL	https://raw.githubusercontent.com/vaaas/userscripts/master/sorted_ao3_freeforms.js
// ==/UserScript==

(function() {
const $ = (q, node=document) => node.querySelector(q)
const $$ = (q, node=document) => Array.from(node.querySelectorAll(q))

const sort = (xs, key=identity) => xs.sort((a, b) => key(a) < key(b) ? -1 : 1)
const identity = x => x
const innertext = x => x.innerText
const remove = x => x.remove()
const add = p => c => p.appendChild(c)

const works = $$("li.work.blurb.group")
works.forEach(sort_tags)

function sort_tags(work)
	{ const freeforms = sort(
		$$("li.freeforms", work),
		innertext)
	const tags_container = $('ul.tags.commas', work)
	freeforms.forEach(remove)
	freeforms.forEach(add(tags_container)) }
})()