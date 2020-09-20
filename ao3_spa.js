// ==UserScript==
// @name         ao3_spa
// @version      0.0.1
// @description  turns ao3 into a single page application
// @author       Vasileios Pasialiokis <whiterocket@outlook.com>
// @match        https://archiveofourown.org/spa
// @license      AGPLv3 - https://www.gnu.org/licenses/agpl.html
// @namespace    https://github.com/vaaas/
// @downloadURL  https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_spa.js
// @updateURL    https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_spa.js
// ==/UserScript==

(function() {
'use strict'

const style = `
html { background: #eeeeee; }

a
	{ color: #b71c1c;
	text-underline-offset: 0.25em;
	text-decoration-style: dotted; }

a:hover { text-decoration-style: solid; }

.results
	{ display: flex;
	flex-wrap: wrap;
	justify-content: center; }

.works article
	{ background: #fafafa;
	border: 1px solid #e0e0e0;
	border-bottom: 1px solid #bdbdbd;
	border-radius: 4px;
	padding: 0.5rem;
	margin: 0.5rem;
	width: 20rem;
	height: 20rem;
	overflow-y: auto; }

.works article:hover {
	border-color: transparent;
	box-shadow: 0 0 0 2px #ff1744 }

.tags a
	{ display: inline-block;
	margin-right: 0.25em; }

h1
	{ margin: 0;
	margin-bottom: 1rem; }

@media (max-width: 50rem)
	{ .works article
		{ width: auto;
		height: auto; }
`

function main()
	{ empty(document.firstElementChild)

	P(document.firstElementChild,
	N(E),
	E.child(P(new E('head'),
		E.child(P(new E('title'),
			E.text('AO3 SPA'))),
		E.child(P(new E('style'),
			 E.text(style))))),
	E.child(P(new E('body'),
		E.child(new Works())))) }

// COMBINATORS
const just = a => () => a
const IF = (a, b) => x => { if (a(x)) b(x) }
const A = a => b => a(b)
const B = a => b => a(b(c))
const C = a => b => c => a(c)(b)
const T = a => b => b(a)
const T2 = a => b => c => c(b(a))

// FUNCTIONS
function P (x, ...fs)
	{ for (const f of fs) x = f(x)
	return x }

function PP (...fs)
	{ return function (x)
		{ for (const f of fs) x = f(x)
		return x }}

function empty (x)
	{ while (x.firstChild) x.firstChild.remove()
	return x }
	
function parse_work(x)
	{ const o = {}
	let e
	e = qs('h4.heading a')(x)
	o.href = e.href
	o.title = e.innerText
	e = qs('h4.heading a[rel="author"]')(x)
	o.author = e.innerText
	e = qs('.summary')(x)
	o.summary = e ? e.innerHTML : ''
	e = qss('ul.tags a.tag')(x)
	o.tags = e.map(innertext)
	e = qs('.datetime')(x)
	o.date = e.innerText
	return o }

const map = f => x => x.map(f)
const mapped = x => f => x.map(f)
const filter = f => x => x.map(f)
const is = a => b => a === b
const target = x => x.target
const value = x => x.value
const keycode = x => x.keyCode
const log = x => console.log(x)
const send_value = x => PP(target, value, just, Observable.mapped(x))
const N = c => x => new c(x)
const join = s => xs => xs.join(s)
const serialise_params = PP(Object.entries, map(map(encodeURIComponent)), map(join('=')), join('&'))
const then = f => p => p.then(f)
const prefix = a => b => a+b
const suffix = a => b => b+a
const parseHTML = x => new DOMParser().parseFromString(x, 'text/html')
const qs = x => e => e.querySelector(x)
const qss = x => e => Array.from(e.querySelectorAll(x))
const innertext = x => x.innerText

const get = x => new Promise(yes =>
	{ const req = new XMLHttpRequest()
	req.onload = () => yes(req.responseText)
	req.open('GET', x)
	req.send() })

const search = a => PP(serialise_params, prefix('?'), prefix(a), get)
const search_works = PP(x => ({'utf8': '✓', 'work_search[query]': x}), search('/works/search'))

// CLASSES
function Functor (x) { this.x = x }
	Functor.map = f => x =>
		{ x.x = f(x.x)
		return x }

	Functor.get = x => x.x

function Observable (x)
	{ Functor.call(this, x)
	this.watchers = new Set() }

	Observable.map = f => x =>
		{ x.x	= f(x.x)
		return Observable.notify(x) }
	
	Observable.mapped = x => f =>
		{ x.x	= f(x.x)
		return Observable.notify(x) }

	Observable.notify = x =>
		{ for (let f of x.watchers) f(x.x)
		return x }

	Observable.watch = f => x =>
		{ x.watchers.add(f)
		return x }

	Observable.unwatch = f => x =>
		{ x.watchers.delete(f)
		return x }

function E (x)
	{ this.element = typeof x == 'string' ? document.createElement(x) : x
	this._children = new Set()
	this.parent = null
	this.observes = new Map() }

	E.child = x => e =>
		{ e._children.add(x)
		x.parent = e
		e.element.appendChild(x.element)
		return e }

	E.children = xs => e =>
		{ e._children.forEach(E.remove)
		xs.forEach(C(E.child)(e))
		return e }

	E.remove = e => 
		{ if (!e.parent) return e
		e.parent._children.delete(e)
		e.element.remove()
		e.observes.forEach((v, k) => unwatch(k)(v)) }

	E.text = x => e =>
	  	{ e.element.appendChild(document.createTextNode(x))
		return e }
	
	E.html = x => e =>
		{ e.element.innerHTML = x
		return e }

	E.href = x => e =>
		{ e.element.href = x
		return E.click(just(false))(e) }

	E.type = x => e =>
		{ e.element.type = x
		return e }

	E.add_class = x => e =>
		{ e.element.classList.add(x)
		return e }

	E.remove_class = x => e =>
		{ e.element.classList.remove(x)
		return e }

	E.click = f => e =>
		{ e.element.onclick = f
		return e }

	E.enter = f => e =>
		{ e.element.onkeydown = IF(PP(keycode, is(13)), f)
		return e }

	E.on = f => o => e =>
		{ f = C(f)(e)
		if (e.observes.has(o))
			e.observes.get(o).push(f)
		else e.observes.set(o, [f])
		Observable.watch(f)(o)
		return e }

// COMPONENTS
function Works()
	{ E.call(this, 'div')
	const results = new Observable([])
	P(this,
	E.add_class('works'),
	E.child(P(new E('input'),
		E.type('text'),
		E.enter(PP
			(target,
			value,
			search_works,
			then(PP
				(parseHTML,
				qss('li.work'),
				map(parse_work),
				just,
				Observable.mapped(results))))))),
	E.child(P(new E('main'),
		E.add_class('results'),
		E.on
			(PP(map(N(SearchResult)), E.children))
			(results)))) }

function SearchResult(x)
	{ E.call(this, 'article')
	P(this,
	E.child(P(new E('h1'),
		E.child(P(new E('a'),
			E.text(x.title),
			E.href(x.href))))),
	E.child(P(new E('p'),
		E.html(x.summary))),
	E.child(P(new E('div'),
		E.add_class('tags'),
		E.children(x.tags.map(N(Tag)))))) }

function Tag(x)
	{ E.call(this, 'a')
	P(this,
	E.text(x),
	E.href(`/tags/${encodeURIComponent(x)}/works`)) }

main()
})()
