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
// taps
const tap = f => x => { f(x) ; return x }
const always = v => f => x => { f(x) ; return v }
const falsify = always(false)

// loops
const map = f => function* (xs) { let i = 0 ; for (const x of xs) yield f(x, i++, xs) }
const filter = f => function* (xs) { let i = 0 ; for (const x of xs) if (f(x, i++, xs)) yield x }
const reduce = f => i => xs => { let a = i ; for (const x of xs) a = f(a)(x) ; return a }
const each = f => tap(xs => { let i = 0 ; for (const x of xs) f(x, i++, xs) })
const intersperse = a => function* (xs)
	{ let f = false
	for (const x of xs)
		{ if (f) yield a()
		else f = true
		yield x }}
const extend = a => function* (b) { yield* b ; yield* a }
const append = a => function* (b) { yield* b ; yield a }
const find_index = f => xs => { let i = -1 ; for (const x of xs) if (f(x, ++i, xs)) return i ; return null }

// application, composition, combinators
const B = a => b => c => a(b(c))
const B1 = a => b => c => d => a(b(c)(d))
const C = a => b => c => a(c)(b)
const T = a => b => b(a) // thrush
const P = (x, ...fs) => reduce(T)(x)(fs) // pipe
const PP = (...fs) => x => P(x, ...fs) // piped composition
const K = a => () => a
const K1 = a => b => () => a(b)

// checks
const not = a => !a
const is = a => b => a === b
const isnt = B1(not)(is)

// conditionals
const when = cond => then => x => cond(x) ? then(x) : x
const maybe = when(isnt(null))
const nothing = when(is(null))

// objects
const set = k => v => tap(o => o[k] = v)
const pluck = k => x => x[k]
const form_data = x =>
	{ const data = new FormData()
	for (const [k, v] of Object.entries(x))
		data.append(k, v)
	return data }

// strings
const trim = x => x.trim()

// promises
const then = f => x => x.then(f)

// fetch, url
const text = x => x.text()
const search_url = (x, q) => P(new URL(loc(x)), set('search')(new URLSearchParams(q).toString()))

// dom
const parse_html = x => new DOMParser().parseFromString(x, 'text/html')
const empty = tap(x => { while(x.firstChild) x.firstChild.remove() })
const elem = x => document.createElement(x)
const telem = x => document.createTextNode(x)
const child = c => tap(x => x.appendChild(c))
const children = cs => tap(x => { for (const c of cs) x.appendChild(c) })
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
	G.route.map(K(WorkSearch())) }

class Observable
	{ constructor(x=null)
		{ this.x = x
		this.watchers = new Set() }
	static of(x)
		{ return new Observable(x) }
	map(f)
		{ this.x = f(this.x)
		return this.notify() }
	get() { return this.x }
	notify()
		{ for (const f of this.watchers) f(this.x)
		return this }
	watch(f)
		{ this.watchers.add(f)
		return this }
	unwatch(f)
		{ this.watchers.delete(f)
		return this }}

class Computed extends Observable
	{ constructor(f, ...xs)
		{ super()
		multi_watch((...xs) => this.x = f(...xs), ...xs) }}

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
p:first-of-type { margin-top: 0; }
p:last-of-type { margin-bottom: 0; }
a { color: #933; text-decoration: underline; cursor: pointer; text-underline-offset: 0.25em }
hr { border: none; outline: none; color: inherit; }
hr:after { content: '⁂'; display: block; text-align:center; font-size: 2rem; }
:is(h1,h2,h3,h4,h5,h6) > a { color: inherit; }
html, body, #root { height: 100vh; }
html
	{ line-height: 1.5em;
	font-family: sans-serif;
	background-color: #eee;
	font-size: 18px;
	word-wrap: break-word; }
body { margin: 0; }
#root { margin-left: 3.5rem; overflow: auto; }
#root > section { margin: 1rem auto; }
body > nav
	{ position: absolute;
	background-color: #933;
	width: 3rem;
	font-size: 1.5em;
	padding-top: 0.25rem;
	text-align: center;
	top: 0; left: 0; bottom: 0;
	box-shadow: 5px 0px 10px rgba(0,0,0,0.3); }
body > nav > div { width: 3rem; line-height: 3rem; }
body > nav > div:hover { background-color: rgba(255,255,255,0.5); cursor: pointer; }
input,
section.search article,
section.work > *
	{ box-shadow: 0px 3px 5px rgba(0,0,0,0.2);
	border-radius: 0.25rem;
	overflow: hidden;
	transition: box-shadow ease 0.5s, background-color ease 0.5s; }
input, section.search article { background-color: #f8f8f8; }
input:hover,
input:focus,
section.search article:hover
	{ box-shadow: 0px 7px 20px rgba(0,0,0,0.4);
	background-color: #fff; }
input
	{ outline: none;
	border: none;
	font-size: 1rem;
	padding: 0.5rem; }
section.search input
	{ width: 21em;
	display: block;
	margin: auto; }
input:focus { outline: none; }
section.search section
	{ display: flex;
	flex-wrap: wrap;
	justify-content: center }
section.search article
	{ width: 22em;
	height: 22em;
	overflow: auto;
	margin: 1em; }
section.search article > * { padding: 0.5rem; }
:is(section.search article, section.work header) :is(h1,h2,h3,h4)
	{ margin: 0; font-weight: inherit; }
section.search article h1 { background-color: #933; font-size: inherit; }
section.search article h2 { background-color: #b55; }
section.search article h3 { font-weight: bold; }
:is(section.search article, section.work header) :is(h1,h2)
	{ color: #fff; }
section.search article h3, section.search article h4:nth-of-type(2) { color: #933; }
section.search article :is(h2,h3,h4) { font-size: 80%; }
section.search article h4 span { display: inline-block; margin-right: 1em; }
section.work { max-width: 40em; }
section.work > *+* { margin-top: 1em; }
section.work > * { background-color: #fff }
section.work header > * { padding: 1rem }
section.work header > :is(h1,h2,h3) { padding: 0.5rem 1rem }
section.work main { padding: 1rem; }
section.work header :is(h1,h2) { text-align: center; font-weight: inherit; }
section.work header h1 { font-size: 150%; background-color: #933; }
section.work header h2 { font-size: inherit; background-color: #b55; }
section.work header:nth-of-type(2) h1:hover { text-decoration: underline; text-decoration-offset: 0.25em; cursor: pointer; }
.hidden { display: none; }
.bold { font-weight: bold; }
section.work nav a { display: block; }
section.work nav { columns: 15em; }
`

const Anonymous = Symbol()

const loc = x => 'https://archiveofourown.org' + x
const scroll_to_top = () => document.querySelector('#root').scroll(0,0)

function Root(route)
	{ return P(elem('section'),
		set('id')('root'),
		compute_element(route => ({ children: route === null ? [] : [route] }), route)) }

function Nav()
	{ return P(elem('nav'),
		child(P(elem('div'),
			set('innerText')('🔍'),
			set('onclick')(() => G.route.map(K(WorkSearch())))))) }

function WorkSearch()
	{ const results = new Observable(null)
	const url = new Observable(null)

	const parse_work = x =>
		({ href: P(x,
			qs('h4.heading a'),
			maybe(pluck('href')),
			nothing(K(''))),
		title: P(x,
			qs('h4.heading a'),
			maybe(pluck('innerText')),
			nothing(K(''))),
		author: P(x,
			qs('h4.heading a[rel="author"]'),
			maybe(pluck('innerText')),
			nothing(K(Anonymous))),
		summary: P(x,
			qs('.summary p'),
			maybe(pluck('innerHTML')),
			nothing(K(''))),
		required_tags: P(x,
			qss('.required-tags .text'),
			map(pluck('innerText'))),
		tags: P(x,
			qss('ul.tags :is(.relationships, .characters, .freeforms) a.tag'),
			map(pluck('innerText'))),
		fandoms: P(x,
			qss('.fandoms a.tag'),
			map(pluck('innerText'))),
		words: P(x, qs('dd.words'), maybe(PP(pluck('innerText'), parseFloat)), nothing(K(0))),
		language: P(x, qs('dd.language'), maybe(pluck('innerText')), nothing(K('English'))),
		chapters: P(x, qs('dd.chapters'), maybe(pluck('innerText'))),
		comments: P(x, qs('dd.comments'), maybe(PP(pluck('innerText'), parseFloat)), nothing(K(0))),
		kudos: P(x, qs('dd.kudos'), maybe(PP(pluck('innerText'), parseFloat)), nothing(K(0))),
		bookmarks: P(x, qs('dd.bookmarks'), maybe(PP(pluck('innerText'), parseFloat)), nothing(K(0))),
		hits: P(x, qs('dd.hits'), maybe(PP(pluck('innerText'), parseFloat)), nothing(K(0))),
		date: P(x,
			qs('.datetime'),
			maybe(pluck('innerText')),
			nothing(K(''))), })

	const parse_results = PP(qss('li.work'), map(parse_work))

	const parse_pagination = x => ({
		next: P(x, qs('a[rel="next"]'), maybe(pluck('href'))),
		prev: P(x, qs('a[rel="prev"]'), maybe(pluck('href'))),
	})

	const get_results = x => url.map(K(search_url('/works/search', {'utf8': '✓', 'work_search[query]': x.target.value })))

	const render_results = x => P(elem('article'),
		child(P(elem('h1'),
			child(P(elem('a'),
				set('href')(x.href),
				set('onclick')(falsify(() => G.route.map(K(WorkDisplay(x.href))))),
				set('innerText')(x.title))),
			child(telem(' by ')),
			child(P(elem('a'),
				set('innerText')(x.author === Anonymous ? 'Anonymous' : x.author))))),
		child(P(elem('h2'),
			children(P(x.fandoms,
				map(x => P(elem('a'), set('innerText')(x))),
				intersperse(K1(telem)(', ')))))),
		child(P(elem('h3'),
			children(P(x.required_tags,
				map(x => P(elem('a'), set('innerText')(x))),
				intersperse(K1(telem)(', ')))))),
		child(P(elem('div'), set('innerHTML')(x.summary))),
		child(P(elem('h4'),
			children(P(
				[ P(elem('span'), set('innerText')(x.language)),
				x.words > 0 ? P(elem('span'), set('innerText')('Ａ '+x.words)) : null,
				x.chapters !== null ? P(elem('span'), set('innerText')('📖 '+x.chapters)) : null,
				x.comments > 0 ? P(elem('span'), set('innerText')('💬 '+x.comments)) : null,
				x.kudos > 0 ? P(elem('span'), set('innerText')('❤ '+x.kudos)) : null,
				x.bookmarks > 0 ? P(elem('span'), set('innerText')('⭐ '+x.bookmarks)) : null,
				x.hits > 0 ? P(elem('span'), set('innerText')('👁 '+x.hits)) : null ],
			filter(isnt(null)),
			intersperse(() => telem(' ')))))),
		child(P(elem('h4'),
			children(P(x.tags,
				map(x => P(elem('a'), set('innerText')(x))),
				intersperse(() => telem(', ')))))))

	const render_pagination = x => [
		x.prev ?
			P(elem('a'),
				set('innerText')('Back'),
				set('onclick')(falsify(() => url.map(K(x.prev)))),
			) : null,
		x.next ?
			P(elem('a'),
				set('innerText')('Next'),
				set('onclick')(falsify(() => url.map(K(x.next)))),
			) : null,
	].filter(isnt(null))

	url.watch(PP(fetch,
		then(text),
		then(PP(
			parse_html,
			K,
			results.map.bind(results),
			scroll_to_top))))

	return P(elem('section'),
		set('className')('search'),
		child(P(elem('input'),
			set('onchange')(get_results))),
		child(P(elem('section'),
			compute_element(x => ({ children: P(x, parse_results, map(render_results)) }), results))),
		child(P(elem('nav'),
			compute_element(x => ({ children: P(x, parse_pagination, render_pagination) }), results)))) }

function WorkDisplay(x=null)
	{ const url = new Observable(null)
	const results = new Observable(null)
	const chapters = new Observable(false)
	const work_id = new Computed(x => x.match(/works\/([0-9]+)/)[1], url)

	const parse_work = x => ({
		title: P(x, qs('.title.heading'), pluck('innerText'), trim),
		summary: P(x, qs('.preface .summary blockquote'), maybe(pluck('innerHTML'))),
		author: P(x, qs('a[rel="author"]'), pluck('innerText'), trim),
		body: P(x, qs('#chapters .userstuff'), tap(PP(qs('h3#work'), maybe(x=>x.remove()))), pluck('innerHTML')),
		chapters: P(x, qss('#chapter_index option'), map(x => [ x.innerText, x.value ]), Array.from),
		current_index: P(x, qss('#chapter_index option'), find_index(x => x.selected === true)),
	})

	const render_work = x => [
		P(elem('header'),
			child(P(elem('h1'), set('innerText')(x.title))),
			child(P(elem('h2'), set('innerText')(x.author))),
			tap(e => { if (x.summary !== null)
				P(e, child(P(elem('div'), set('innerHTML')(x.summary))))})),
		x.chapters.length > 0 ?
			P(elem('header'),
				child(P(elem('h1'),
					set('onclick')(() => chapters.map(not)),
					child(telem(x.chapters[x.current_index][0])))),
				child(P(elem('nav'),
					set('className')(chapters.get() ? '' : 'hidden'),
					compute_element(x => ({ class: x ? '' : 'hidden' }), chapters),
					children(P(x.chapters,
						map((c,i) => P(elem('a'),
							set('className')(i === x.current_index ? 'bold' : ''),
							set('onclick')(falsify(() => url.map(K(loc(`/works/${work_id.get()}/chapters/${c[1]}`))))),
							set('innerText')(c[0])))))))
			) : null,
		P(elem('main'), set('innerHTML')(x.body)),
		x.chapters.length > 0 && x.current_index + 1 < x.chapters.length ?
			P(elem('footer'),
				child(P(elem('a'),
					set('onclick')(falsify(() => url.map(K(loc(`/works/${work_id.get()}/chapters/${x.chapters[x.current_index+1][1]}`))))),
					set('innerText')('Next')))
			): null
	].filter(isnt(null))

	url.watch(PP(fetch,
		then(text),
		then(PP(
			parse_html,
			parse_work,
			render_work,
			K,
			results.map.bind(results),
			scroll_to_top))))

	url.map(K(x))

	return P(elem('section'),
		set('className')('work'),
		compute_element(x => ({ children: x }), results)) }

main()
})()
