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

const G = {}
const Anonymous = Symbol()

const style = `
html
	{ background: #eee;
	font-size: 18px; }

a
	{ color: #b22;
	text-underline-offset: 0.25em;
	text-decoration-style: dotted; }

a:hover { text-decoration-style: solid; }

.work
	{ max-width: 40rem;
	padding: 0.5rem;
	margin: 0.5rem auto;
	background: #fff;
	border: 1px solid #ddd;
	border-radius: 4px; }

.work > h1 { text-align: center; }

.work > .summary
	{ max-width: 20rem;
	margin: auto;
	color: #444;
	padding-bottom: 1rem;
	border-bottom: 1px solid #aaa; }

.results
	{ display: flex;
	flex-wrap: wrap;
	justify-content: center; }

.works article
	{ background: #fff;
	border: 1px solid #ddd;
	border-bottom: 1px solid #ccc;
	border-radius: 4px;
	padding: 0.5rem;
	margin: 0.5rem;
	width: 20rem;
	height: 20rem;
	overflow-y: auto; }

.works article:hover {
	border-color: transparent;
	box-shadow: 0 0 0 2px #f24; }

.tags a
	{ display: inline-block;
	margin-right: 0.5em; }

h1
	{ margin: 0;
	margin-bottom: 1rem; }

@media (max-width: 50rem)
	{ .works article
		{ width: auto;
		height: auto; }
`

function main()
	{ G.route = new Observable(null)
	empty(document)
	document.appendChild(
		E.of('html')
		.child(E.of('head')
			.child(E.of('title').text('AO3 SPA'))
			.child(E.of('style').text(style)))
		.child(E.of('body')
			.child(E.of('div').add_class('router')
				.on(G.route, me => x => me.clear().child(x))))
		.element)
	G.route.map(N(Works)) }

const tap = f => x => { f(x) ; return x }
const ftap = f => x => { f(x) ; return false }
const K = a => () => a
const A = (x, ...fs) => fs.reduce((a,b)=>b(a), x)
const AA = (...fs) => x => fs.reduce((a,b)=>b(a), x)
const T = a => b => b(a)
const map = f => x => x.map(f)
const target = x => x.target
const value = x => x.value
const N = c => x => new c(x)
const join = s => xs => xs.join(s)
const serialise_params = AA(Object.entries, map(map(encodeURIComponent)), map(join('=')), join('&'))
const then = f => p => p.then(f)
const add = a => b => a+b
const parseHTML = x => new DOMParser().parseFromString(x, 'text/html')
const qs = x => e => e.querySelector(x)
const qss = x => e => Array.from(e.querySelectorAll(x))
const inner_text = x => x.innerText
const inner_html = x => x.innerHTML
const href = x => x.href
const remove = x => x.remove()
const empty = tap(x => { while(x.firstChild) x.firstChild.remove() })
const maybe = f => x => x === null ? x : f(x)
const nothing = f => x => x !== null ? x : f(x)
const pluck = k => x => x[k]
const trim = x => x.trim()

const get = x => new Promise(yes =>
	{ const req = new XMLHttpRequest()
	req.onload = () => yes(req.responseText)
	req.open('GET', x)
	req.send() })

const search = x => AA(serialise_params, add('?'), add(x), get)
const search_works = AA(x => ({'utf8': '✓', 'work_search[query]': x}), search('/works/search'))

class Observable
	{ constructor(x)
		{ this.x = x
		this.watchers = new Set() }
	static of (x) { return new Observable(x) }
	map(f)
		{ this.x = f(this.x)
		this.notify()
		return this }
	get() { return this.x }
	each(f) {
		this.watchers.forEach(f)
		return this }
	notify() { return this.each(T(this.x)) }
	watch(f)
		{ this.watchers.add(f)
		return this }
	unwatch(f)
		{ this.watchers.delete(f)
		return this }}

class E
	{ constructor(x)
		{ this.element = document.createElement(x)
		this.watches = new Map()
		this._children = new Set()
		this.watchers = new Map() }
	static of (x) { return new E(x) }
	child(x)
		{ x.parent = this
		this._children.add(x)
		this.element.appendChild(x.element)
		return this }
	children(xs)
		{ this.clear()
		xs.forEach(x => this.child(x))
		return this }
	clear() { return this.each(remove) }
	remove()
		{ this.clear()
		if (this.parent)
			this.parent._children.delete(this)
		this.element.remove()
		this.watches.forEach((f, o) => o.unwatch(f))
		return this }
	on(o, f)
		{ const g = f(this)
		o.watch(g)
		if (this.watches.has(o))
			this.watches.get(o).push(g)
		else
			this.watches.set(o, [g])
		return this }
	value(x)
		{ this.element.value = x
		return this }
	focus(f)
		{ this.element.onfocus = f
		return this }
	unfocus(f)
		{ this.element.addEventListener('focusout', f)
		return this }
	style(x)
		{ this.element.style = x
		return this }
	input(f)
		{ this.element.oninput = f
		return this }
	keydown(f)
		{ this.element.onkeydown = f
		return this }
	enter(f)
		{ return this.keydown(x => x.keyCode === 13 ? f(x) : true) }
	href(x)
		{ this.element.href = x
		return this }
	text(x)
		{ this.element.innerText = x
		return this }
	html(x)
		{ this.element.innerHTML = x
		return this }
	click(f)
		{ this.element.onclick = f
		return this }
	each(f)
		{ for (const x of this._children.values())
			f(x)
		return this }
	add_class(x)
		{ this.element.classList.add(x)
		return this }
	bind(o)
		{ this.element.value = o.get()
		this.element.onchange = () => o.map(K(this.element.value))
		this.on(o, me => x =>
			{ if (me.element.value === x) return
			me.element.value = x })
		return this }
	emit(event)
		{ return x =>
			{ if (this.watchers.has(event))
				this.watchers.get(event).forEach(T(x))
			return this }}
	listen(event, f)
		{ if (!this.watchers.has(event))
			this.watchers.set(event, [])
		this.watchers.get(event).push(f)
		return this }}

class Tag extends E
	{ constructor(x)
		{ super('a')
		this.text(x).href(`/tags/${encodeURIComponent(x)}/works`) }}

class SearchResult extends E
	{ constructor(x)
		{ super('article')
		.child(E.of('h1')
			.child(E.of('a')
				.text(x.title)
				.href(x.href)
				.click(SearchResult.title_clicked)))
		.child(E.of('p').html(x.summary))
		.child(E.of('div')
			.add_class('tags')
			.children(
				x.tags.map(x =>
					new Tag(x)
					.click(ftap(this.emit('tag')))))) }

	static title_clicked(x)
		{ get(x.target.href).then(AA(
			parseHTML,
			N(Work),
			K,
			map,
			T(G.route)))
		return false }}

class Work extends E
	{ constructor(x)
		{ super('div').add_class('work')
		const work = Work.parse_work(x)
		this.child(E.of('h1').text(work.title))
		.child(E.of('aside').add_class('summary').html(work.summary))
		.child(E.of('main').html(work.content)) }

	static parse_work(x)
		{ return {
			title: A(x,
				qs('#workskin h2.title'),
				maybe(AA(inner_text, trim)),
				nothing(K(''))),
			summary: A(x,
				qs('#workskin div.summary blockquote.userstuff'),
				maybe(inner_html),
				nothing(K(''))),
			author: A(x,
				qs('#workskin div.preface h3.byline a[rel="author"]'),
				maybe(AA(inner_text, trim)),
				nothing(K(Anonymous))),
			content: A(x,
				qs('#workskin #chapters div.userstuff'),
				maybe(AA(inner_html)),
				nothing(K(Anonymous))), }}}

class Works extends E
	{ constructor(x)
		{ super('div')
		const results = new Observable(null)
		const text = new Observable(null)

		const onenter = AA(
			target,
			value,
			search_works,
			then(AA
				(parseHTML,
				qss('li.work'),
				map(Works.parse_work),
				K,
				map,
				T(results))))

		const tag_clicked = ftap(AA(
			target,
			tap(AA(inner_text, K, map, T(text))),
			href, get, then(AA
				(parseHTML,
				qss('li.work'),
				map(Works.parse_work),
				K,
				map,
				T(results)))))

		this.add_class('works')
		.child(E.of('input').enter(onenter).bind(text))
		.child(E.of('main').add_class('results')
			.on(results, me => xs => me.children(
				xs.map(x =>
					new SearchResult(x)
					.listen('tag', tag_clicked)))))

		results.map(K(x instanceof Array ? x : [])) }

	static parse_work(x)
		{ return {
			href: A(x,
				qs('h4.heading a'),
				maybe(href),
				nothing(K(''))),
			title: A(x,
				qs('h4.heading a'),
				maybe(inner_text),
				nothing(K(''))),
			author: A(x,
				qs('h4.heading a[rel="author"]'),
				maybe(inner_text),
				nothing(K(Anonymous))),
			summary: A(x,
				qs('.summary'),
				maybe(inner_html),
				nothing(K(''))),
			tags: A(x,
				qss('ul.tags a.tag'),
				map(inner_text)),
			date: A(x,
				qs('.datetime'),
				maybe(inner_text),
				nothing(K(''))), }}}

main()
})()
