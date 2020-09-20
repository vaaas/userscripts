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

function main()
	{ empty(document.firstElementChild)

	P(document.firstElementChild,
	classify(E),
	E.child(P(new E('head'),
		E.child(P(new E('title'),
			E.text('AO3 SPA'))))),
	E.child(P(new E('body'),
		E.child(new Works())))) }

// COMBINATORS
const CRT = f => a => b => f(b, a)
const just = a => () => a
const IF = (a, b) => x => { if (a(x)) b(x) }
const C = a => b => c => a(c)(b)

// FUNCTIONS
function P (x, ...fs)
	{ for (let i = 0; i < fs.length; i++)
		x = fs[i](x)
	return x }

function PP (...fs)
	{ return function (x)
		{ for (let i = 0; i < fs.length; i++)
			x = fs[i](x)
		return x }}

function empty (x)
	{ while (x.firstChild) x.firstChild.remove()
	return x }

const map = f => x => x.map(f)
const mapped = x => f => x.map(f)
const filter = f => x => x.map(f)
const is = a => b => a === b
const target = x => x.target
const value = x => x.value
const keycode = x => x.keyCode
const log = x => console.log(x)
const sendValue = x => PP(target, value, just, C(Observable.map)(x))
const classify = c => x => new c(x)

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

	Observable.notify = x =>
		{ for (let f of x.watchers) f(x.x)
		return x }

	Observable.watch = f => x =>
		{ x.watchers.add(f)
		return x }

	Observable.unwatch = f => x =>
		{ x.watchers.delete(f)
		return x }

function E(x)
	{ this.element = typeof x == 'string' ? document.createElement(x) : x
	this._children = []
	this.parent = null
	this.observes = new Map() }

	E.child = x => e =>
		{ e._children.push(x)
		x.parent = e
		e.element.appendChild(x.element)
		return e }

	E.children = xs => e =>
		{ e.children.forEach(E.remove)
		xs.forEach(C(E.child)(e))
		return e }

	E.remove = e => 
		{ if (!e.parent) return e
		const i = e.parent.findIndex(is(e))
		e.parent._children.splice(i, 1)
		e.element.remove()
		e.observes.forEach((v, k) => unwatch(k)(v)) }

	E.text = x => e =>
	  	{ e.element.innerText = x
		return e }

	E.href = x => e =>
		{ e.element.href = x
		return e }

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
		{ f = CRT(f)(e)
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
		E.enter(sendValue(results)))),
	E.child(P(new E('div'),
		E.add_class('results'),
		E.on
			//((x, p) => P(x, map(classify(SearchResult)), C(children)(p)))
			(log)
			(results)))) }

main()
})()
