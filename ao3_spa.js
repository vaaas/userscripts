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
const find_index = f => xs => { let i = -1 ; for (const x of xs) if (f(x, ++i, xs)) return i ; return null }
const flatten = function* (xs) { for (const x of xs) yield* x }
const intersperse = a => function* (xs)
	{ let f = false
	for (const x of xs)
		{ if (f) yield a()
		else f = true
		yield x }}
const sort = f => xs => Array.from(xs).sort(f)

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
const N = o => x => new o(x)

// strings
const trim = x => x.trim()

// sort
const alphabetically = a => b => a<b ? -1 : 1

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
const EMSP = ' '

function main()
	{ G.route = Observable.of(null)
	P(qss('style')(document), each(x => x.remove()))
	P(qss('link')(document), each(x => x.remove()))
	document.title = 'AO3 SPA'
	const body = document.body
	empty(body)
	body.parentElement.appendChild(P(elem('style'), set('innerText')(STYLESHEET)))
	body.appendChild(Header())
	body.appendChild(Root(G.route)) }

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
a
	{ color: #933;
	text-decoration: underline;
	cursor: pointer;
	text-underline-offset: 0.25em }
a:hover { text-decoration: underline !important; }
hr { border: none; outline: none; color: inherit; }
hr:after
	{ content: '⁂';
	display: block;
	text-align:center;
	font-size: 2rem; }
h1,h2,h3,h4,h5,h6 { margin: 0; }
:is(h1,h2,h3,h4,h5,h6) > a { color: inherit; }
input { font-size: inherit; }
html, body { height: 100vh; }
html
	{ line-height: 1.5em;
	font-family: sans-serif;
	background-color: #eee;
	font-size: 18px;
	word-wrap: break-word; }
body { margin: 0; }
#root > section { margin: 1rem auto; }
body > header { margin-top: 1em; }
body > header input
	{ display: block;
	margin: auto; }
section.list { columns: 25em; }
section.list article
	{ background: #fff;
	padding: 1em;
	display: inline-block;
	border-radius: 0.25rem;
	max-height: 30em;
	overflow: auto;
	margin-bottom: 1em; }
section.list article :is(h1,h2,h3)
	{ font-size: 0.8rem;
	line-height: 0.8rem;
	font-weight: inherit; }
section.list article h1 { font-size: 1.5rem; line-height: 1.5em; margin-bottom: 0.5em; }
section.list article > div { margin: 1em 0; }
section.list article h2 a { text-decoration: none; }
section.list article h3 { display: flex; justify-content: space-between; }
a.freeform { color: #0097a7; }
a.fandom { color: #7b1fa2; }
a.character { color: #388e3c; }
a.relationship { color: #ffa000; }
a.required { color: #d32f2f; }
`

const Anonymous = Symbol()

const loc = x => 'https://archiveofourown.org' + x
const scroll_to_top = () => document.querySelector('#root').scroll(0,0)

function Root(route)
	{ return P(elem('section'),
		set('id')('root'),
		compute_element(route => ({ children: route === null ? [] : [route] }), route)) }

function Header()
	{ const url = x => search_url('/works/search', {'utf8': '✓', 'work_search[query]': x })
	return P(elem('header'),
		child(P(elem('input'),
			set('onchange')
			(PP(x => x.target.value,
				url,
				N(WorkList),
				K,
				G.route.map.bind(G.route))))))}

function WorkList(x)
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
			qs('.summary'),
			maybe(pluck('innerHTML')),
			nothing(K(''))),
		tags:
			{ fandoms: P(x,
				qss('.fandoms a.tag'),
				map(pluck('innerText')),
				sort(alphabetically)),
			required: P(x,
				qss('.required-tags .text'),
				map(pluck('innerText')),
				sort(alphabetically)),
			relationships: P(x,
				qss('ul.tags .relationships a.tag'),
				map(pluck('innerText')),
				sort(alphabetically)),
			characters: P(x,
				qss('ul.tags .characters a.tag'),
				map(pluck('innerText')),
				sort(alphabetically)),
			freeforms: P(x,
				qss('ul.tags .freeforms a.tag'),
				map(pluck('innerText')),
				sort(alphabetically)), },
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
			children(P(
				[ map(x => P(elem('a'), set('className')('fandom'), set('innerText')(x)))(x.tags.fandoms),
				map(x => P(elem('a'), set('className')('required'), set('innerText')(x)))(x.tags.required),
				map(x => P(elem('a'), set('className')('relationship'), set('innerText')(x)))(x.tags.relationships),
				map(x => P(elem('a'), set('className')('character'), set('innerText')(x)))(x.tags.characters),
				map(x => P(elem('a'), set('className')('freeform'), set('innerText')(x)))(x.tags.freeforms) ],
				flatten,
				intersperse(K1(telem)(EMSP)))))),
		child(P(elem('div'), set('innerHTML')(x.summary))),
		child(P(elem('h3'),
			children(P(
				[ P(elem('span'), set('innerText')(x.language)),
				x.words > 0 ? P(elem('span'), set('innerText')('Ａ '+x.words)) : null,
				x.chapters !== null ? P(elem('span'), set('innerText')('📖 '+x.chapters)) : null,
				x.comments > 0 ? P(elem('span'), set('innerText')('💬 '+x.comments)) : null,
				x.kudos > 0 ? P(elem('span'), set('innerText')('❤ '+x.kudos)) : null,
				x.bookmarks > 0 ? P(elem('span'), set('innerText')('⭐ '+x.bookmarks)) : null,
				x.hits > 0 ? P(elem('span'), set('innerText')('👁 '+x.hits)) : null ],
			filter(isnt(null)))))))

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
		set('className')('list'),
		compute_element(x => ({ children: P(x, parse_results, map(render_results)) }), results),
		tap(() => url.map(K(x))))}

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
