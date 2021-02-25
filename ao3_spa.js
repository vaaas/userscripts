// ==UserScript==
// @name	ao3_spa
// @version	0.0.1
// @description	turns ao3 into a single page application
// @author	Vasileios Pasialiokis <whiterocket@outlook.com>
// @match	https://archiveofourown.org/spa
// @license	AGPLv3 - https://www.gnu.org/licenses/agpl.html
// @namespace	https://github.com/vaaas/
// @downloadURL	https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_spa.js
// @updateURL	https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_spa.js
// ==/UserScript==

(function() {
'use strict'

// prelude
// loops
const map = f => function* (xs) { let i = 0 ; for (const x of xs) yield f(x, i++, xs) }
const filter = f => function* (xs) { let i = 0 ; for (const x of xs) yield f(x, i++, xs) }
const reduce = f => i => xs => { let a = i ; for (const x of xs) a = f(a)(x) ; return a }
const each = f => tap(xs => { let i = 0 ; for (const x of xs) f(x, i++, xs) })

// application, composition, combinators
const B = a => b => c => a(b(c))
const B1 = a => b => c => d => a(b(c)(d))
const T = a => b => b(a) // thrush
const P = (x, ...fs) => reduce(T)(x)(fs) // pipe
const PP = (...fs) => x => P(x, ...fs) // piped composition
const just = a => () => a

// check
const not = a => !a
const is = a => b => a === b
const isnt = B1(not)(is)

// conditionals
const when = cond => then => x => cond(x) ? then(x) : x
const maybe = when(isnt(null))
const nothing = when(is(null))

// taps
const tap = f => x => { f(x) ; return x }
const always = v => f => x => { f(x) ; return v }
const falsify = always(false)

const set = k => v => tap(o => o[k] = v)
const pluck = k => x => x[k]

// promises
const then = f => x => x.then(f)

// fetch, url
const text = x => x.text()
const search_url = (x, q) => P(new URL(loc(x)), set('search')(new URLSearchParams(q).toString()))
const search = (x, q) => fetch(search_url(x,q))

// dom
const parse_html = x => new DOMParser().parseFromString(x, 'text/html')
const empty = tap(x => { while(x.firstChild) x.firstChild.remove() })
const elem = x => document.createElement(x)
const child = c => tap(x => x.appendChild(c))
const qs = q => (d=document) => d.querySelector(q)
const qss = q => (d=document) => d.querySelectorAll(q)

const log = tap(console.log)

const G = {}

function main()
	{ G.route = Observable.of(null)
	P(qss('style')(document), each(x => x.remove()))
	P(qss('link')(document), each(x => x.remove()))
	document.title = 'AO3 SPA'
	const body = document.body
	empty(body)
	body.parentElement.appendChild(P(elem('style'), set('innerText')(STYLESHEET)))
	body.appendChild(Nav())
	body.appendChild(Root(G.route))
	G.route.map(just(WorkSearch())) }

function Observable(x)
	{ this.x = x
	this.watchers = new Set() }
	Observable.of = function(x)
		{ return new Observable(x) }
	Observable.prototype.map = function(f)
		{ this.x = f(this.x)
		return this.notify() }
	Observable.prototype.get = function() { return this.x }
	Observable.prototype.notify = function()
		{ for (const f of this.watchers) f(this.x)
		return this }
	Observable.prototype.watch = function(f)
		{ this.watchers.add(f)
		return this }
	Observable.prototype.unwatch = function(f)
		{ this.watchers.delete(f)
		return this }

function multi_watch(f, ...xs)
	{ const cb = () => f(...xs.map(x => x.get()))
	for (const x of xs) x.watch(cb) }

const compute_element = (f, ...xs) => tap(e => multi_watch((...xs) =>
	{ const o = f(...xs)
	for (const [k, v] of Object.entries(o))
		{ switch (k)
			{ case 'class':
				e.className = v
				break
			case 'children':
				empty(e)
				for (const c of v) e.appendChild(c)
				break
			case 'text':
				e.innerText = v
				break
			case 'html':
				e.innerHTML = v
				break }}},
	...xs))

// business logic
const STYLESHEET = `
a { color: #933; }
p { margin: 0; margin-bottom: 1em; }
html, body, #root { height: 100vh; }
html
	{ line-height: 1.5em;
	background: #eee;
	font-size: 18px; }
body { margin: 0; }
#root
	{ margin-left: 3.5rem;
	overflow: auto; }
nav
	{ position: absolute;
	background: #933;
	width: 3rem;
	font-size: 1.5em;
	padding-top: 0.25rem;
	text-align: center;
	top: 0; left: 0; bottom: 0;
	box-shadow: 5px 0px 10px rgba(0,0,0,0.3); }
nav > div
	{ width: 3rem;
	line-height: 3rem; }
nav > div:hover
	{ background: rgba(255,255,255,0.5);
	cursor: pointer; }
input,
#results article,
section.work
	{ box-shadow: 0px 3px 5px rgba(0,0,0,0.2);
	border-radius: 0.25rem;
	background-color: #f8f8f8;
	transition: box-shadow ease 0.5s, background-color ease 0.5s; }
input:hover,
input:focus,
#results article:hover
	{ box-shadow: 0px 7px 20px rgba(0,0,0,0.4);
	background-color: #fff; }
input
	{ outline: none;
	border: none;
	font-size: 1rem;
	padding: 0.5rem; }
section.search input
	{ width: 20em;
	display: block;
	margin: auto;
	margin-top: 1rem; }
input:focus { outline: none; }
#results
	{ display: flex;
	flex-wrap: wrap;
	justify-content: center }
#results article
	{ width: 20em;
	height: 30ex;
	overflow: auto;
	margin: 1em;
	padding: 1em; }
#results article h1 { margin: 0; }
section.work
	{ max-width: 40em;
	background-color: #fff;
	padding: 2rem;
	margin: auto; }
`

const Anonymous = Symbol()

const loc = x => 'https://archiveofourown.org' + x

function Root(route)
	{ return P(elem('section'),
		set('id')('root'),
		compute_element(route => ({ children: route === null ? [] : [route] }), route)) }

function Nav()
	{ return P(elem('nav'),
		child(P(elem('div'),
			set('innerText')('🔍'),
			set('onclick')(() => G.route.map(just(WorkSearch())))))) }

function WorkSearch()
	{ const results = new Observable(null)
	const url = new Observable(null)

	const parse_work = x =>
		({ href: P(x,
			qs('h4.heading a'),
			maybe(pluck('href')),
			nothing(just(''))),
		title: P(x,
			qs('h4.heading a'),
			maybe(pluck('innerText')),
			nothing(just(''))),
		author: P(x,
			qs('h4.heading a[rel="author"]'),
			maybe(pluck('innerText')),
			nothing(just(Anonymous))),
		summary: P(x,
			qs('.summary'),
			maybe(pluck('innerHTML')),
			nothing(just(''))),
		tags: P(x,
			qss('ul.tags a.tag'),
			map(pluck('innerHTML')),
			Array.from),
		date: P(x,
			qs('.datetime'),
			maybe(pluck('innerText')),
			nothing(just(''))), })

	const parse_results = PP(qss('li.work'), map(parse_work), Array.from)

	const get_results = x => url.map(just(search_url('/works/search', {'utf8': '✓', 'work_search[query]': x.target.value })))

	const render_results = x => P(elem('article'),
		child(P(elem('h1'),
			child(P(elem('a'),
				set('href')(x.href),
				set('onclick')(falsify(() => G.route.map(just(WorkDisplay(x.href))))),
				set('innerText')(x.title))))),
		child(P(elem('p'), set('innerHTML')(x.summary))))

	url.watch(PP(fetch,
		then(text),
		then(PP(
			parse_html,
			parse_results,
			map(render_results),
			Array.from,
			just,
			results.map.bind(results)))))

	return P(elem('section'),
		set('className')('search'),
		child(P(elem('input'),
			set('onchange')(get_results))),
		child(P(elem('div'),
			set('id')('results'),
			compute_element(x => ({ children: x }), results)))) }

function WorkDisplay(x=null)
	{ const url = new Observable(null)
	const results = new Observable(null)

	const parse_work = x => ({
		body: P(x,
			qs('#workskin #chapters .userstuff'),
			maybe(pluck('innerHTML')),
			nothing(just('<em>Work intentionally left blank.</em>'))),
		summary: P(x,
			qs('#workskin .summary blockquote.userstuff'),
			maybe(pluck('innerHTML')),
			nothing(just('<em>Summary intentionally left blank.</em>'))),
	})

	const render_work = x => [
		P(elem('header'),
			child(P(elem('blockquote'),
				set('className')('summary'),
				set('innerHTML')(x.summary)))),
		P(elem('main'), set('innerHTML')(x.body)),
	]

	url.watch(PP(fetch,
		then(text),
		then(PP(
			parse_html,
			parse_work,
			render_work,
			just,
			results.map.bind(results)))))

	url.map(just(x))

	return P(elem('section'),
		set('className')('work'),
		compute_element(x => ({ children: x }), results)) }

main()
})()
