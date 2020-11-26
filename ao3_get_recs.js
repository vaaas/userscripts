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
// @version    0.1.0
// @updateURL    https://raw.githubusercontent.com/vaaas/userscripts/master/ao3_get_recs.js
// ==/UserScript==


(function() {
const P = (x, ...xs) => xs.reduce((a,b)=>b(a), x)
const PP = (...xs) => x => P(x, ...xs)
const map = f => x => x.map(f)
const $ = x => document.querySelector(x)
const $$ = q => node => Array.from(node.querySelectorAll(q))
const parse_dom = x => new DOMParser().parseFromString(x, "text/html").body
const pluck = k => x => x[k]
const add = y => x => x + y
const shuffle = xs => xs.sort(randomly)
const randomly = () => Math.random() - 0.5
const users = PP($$('ol.bookmark li.user h5 a', map(pluck('href'))))
const bookmarks = $$("ol.bookmark li.bookmark")
const child = c => x => x.appendChild(c)
const elem = x => document.createElement(x)
const listen = e => f => tap(x => x.addEventListener(e, f))
const T = a => b => b(a)
const tap = f => x => { f(x) ; return x }
const when = a => b => c => a(c) ? b(c) : c
const is = a => b => a === b
const isnt = a => b => a !== b
const maybe = when(isnt(null))
const nothing = when(is(null))
const set = k => v => tap(x => x[k] = v)
const before = a => tap(b => a.before(b))
const limit = n => when(x=>x.length>n)(set('length')(n))
const then = f => x => x.then(f)
const each = f => async (xs) => { for await (const x of xs) f(x) }
const sleep = n => new Promise(yes => setTimeout(()=>yes(true), n))
const results_element = () => P(elem('ul'), set('className')('bookmark index group'), before($('#kudos')))

const get = x => new Promise(yes =>
    { const req = new XMLHttpRequest()
    req.onload = () => sleep(1000).then(() => yes(req.responseText))
    req.open("GET", x)
    req.send() })

async function* result_generator(xs)
    { for (const x of xs)
        for (const y of P((await get(x)), parse_dom, bookmarks))
            yield y }

const give_me_recs = event => P($('dd.bookmarks a'),
    nothing(()=>alert('no bookmarks!')),
    maybe(PP(pluck('href'), get, tap(()=>event.target.innerText = 'Please wait...'),
        then(PP
            (parse_dom, users, map(add('/bookmarks')), shuffle, limit(2),
            result_generator,
            each(PP(child, T(results_element()))))),
        then(()=>event.target.remove()))))

const main = () =>
    P($('#feedback ul.actions'),
    child(P(elem('li'),
    child(P(elem('a'), set('innerText')('Get recs'), listen('click')(give_me_recs))))))

main()
})()
