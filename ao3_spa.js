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

// fetch
const text = x => x.text()
const search = (x, q) => P(new URL(loc(x)), set('search')(new URLSearchParams(q).toString()), fetch)

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
	{ G.root = document.body
	empty(G.root)
	G.route = Observable.of(null)
	compute_element(route => ({ children: route === null ? [] : [route] }), G.route)(G.root)
	document.body.parentElement.appendChild(P(elem('style'), set('innerText')(STYLESHEET)))
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
input
	{ width: 20em;
	display: block;
	margin: auto; }
#results
	{ display: flex;
	flex-wrap: wrap;
	justify-content: center }
#results article
	{ width: 30em;
	height: 30ex;
	overflow: auto;
	margin: 1em;
	padding: 1em;
	border: 1px solid gray; }
`

const Anonymous = Symbol()

const loc = x => 'https://archiveofourown.org' + x

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

const render_results = x => P(elem('article'),
	child(P(elem('h1'), set('innerText')(x.title))),
	child(P(elem('p'), set('innerHTML')(x.summary))))

function WorkSearch()
	{ const results = new Observable(null)

	const get_results = x =>
		search('/works/search', {'utf8': '✓', 'work_search[query]': x.target.value })
		.then(text)
		.then(PP(
			parse_html,
			parse_results,
			map(render_results),
			Array.from,
			just,
			results.map.bind(results)))

	return P(elem('div'),
		child(P(elem('input'),
			set('onchange')(get_results))),
		child(P(elem('div'),
			set('id')('results'),
			compute_element(x => ({ children: x }), results)))) }

main()
})()
