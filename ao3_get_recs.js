// ==UserScript==
// @name	ao3-get-recs
// @description	generate recommendations from an AO3 work based on the bookmarks of that work's bookmarkers
//
// @author	Vasileios Pasialiokis <whiterocket@outlook.com>
// @namespace https://github.com/vaaas/
// @downloadURL	TODO
//
// @license	AGPLv3 - https://www.gnu.org/licenses/agpl.html
//
// @match	https://archiveofourown.org/works/*
// @match	http://insecure.archiveofourown.org/*
//
// @version	0.0.1
// @updateURL	TODO
// ==/UserScript==


(function() {
const $$ = (q, node=document) => Array.from(node.querySelectorAll(q))
const parse_dom = x => new DOMParser().parseFromString(x, "text/html").body
const add = y => x => x + y
const shuffle = xs => xs.sort(randomly)
const randomly = () => Math.random() - 0.5
const href = x => x.href
const map = fn => xs => xs.map(fn)
const sort = fn => xs => xs.sort(fn)
const flatten = xs => xs.flat()
const rcall = (a, b) => b(a)
const pipe = (...fns) => x => fns.reduce(rcall, x)
const foreach = fn => xs => xs.forEach(fn)

const limit = n => x =>
	{ if (x.length > n) x.length = n
	return x }

const get = x => new Promise((yes, no) =>
	{ const req = new XMLHttpRequest()
	req.onload = () => yes(req.responseText)
	req.open("GET", x)
	req.send() })

const get_users = x => $$("ol.bookmark li.user h5 a", x).map(href)

const get_bookmarks = x => $$("ol.bookmark li.bookmark", x)

const append_child = p => x => p.appendChild(x)

function give_me_recs(event)
	{ event.target.innerText = "Please wait..."
	const node = document.querySelector("dd.bookmarks a")
	if (node === null) return alert("no bookmarks!")

	const results = parse_dom("<ul class='bookmark index group'></ul>").firstChild
	document.querySelector("#kudos").insertAdjacentElement("beforebegin", results) ;

	get(node.href)
	.then(pipe
		(parse_dom,
		get_users,
		map(add("/bookmarks")),
		sort(randomly),
		limit(10),
		map(get),
		xs => Promise.all(xs)))
	.then(pipe
		(map(pipe(parse_dom, get_bookmarks)),
		flatten,
		sort(randomly),
		foreach(x => results.appendChild(x))))
	.then(() => event.target.innerText = "Done reccing!") }

function main()
	{ const node = document.querySelector("#feedback ul.actions")
	const child = parse_dom("<li><a>Give me recs!</a></li>").firstChild
	child.querySelector("a").onclick = give_me_recs
	node.appendChild(child) }

main()
})()
