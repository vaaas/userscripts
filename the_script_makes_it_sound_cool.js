(function() {
"use strict"

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)

const parse_html = x => new DOMParser.parseFromString(x, "text/html")

function E(tag)
	{ this.element = document.createElement(tag) }

E.prototype.attribute = function(k) { return function(x)
	{ this.element.setAttribute(k, x)
	return this }}

E.prototype.value = function(k) { return function (x)
	{ this.element[k] = x
	return this }}

E.prototype.style = E.attribute("style")

E.prototype.href = E.attribute("href")

E.prototype.src = E.attribute("src")

E.prototype.onclick = E.value("onclick")

E.prototype.innerHTML = E.value("innerHTML")

E.prototype.child = function(x)
	{ this.element.appendChild(x)
	return this }

function empty(el) { while(el.firstChild) el.removeChild(el.firstChild) }

const replace = el => tree =>
	{ empty(el)
	el.appendChild(tree) }

const is_gallery_page = location => new RegExp("^/s/[^/]+/[^/]+$").test(location)

const parse_page = dom =>
	({ "title": dom.querySelector("h1").innerHTML,
	"back": dom.querySelector("div.sb a").href,
	"next": dom.querySelector("#next").href,
	"prev": dom.querySelector("#prev").href,
	"pic": dom.querySelector("#img").src })

function render_page(data)
	{ return E("body")
	.style("margin: 0; background: black; text-align: center;")
	.child(E("h1")
		.child(E("a").href(data.back).innerHTML(data.title)))
	.child("img")
		.style("display: block; width: 100vw; margin: auto;")
		.src(data.pic)
		.onclick(image_clicked(data.prev, data.next))
	.element }

const go_fullscreen = el => el.requestFullscreen()

const image_clicked = (prev, next) => event =>
	{ if (event.clientY < window.innerHeight / 5 && !document.fullscreenElement)
		go_fullscreen(document.firstChild)
	else if ((event.clientX - event.target.offsetLeft) > event.target.offsetWidth/2)
		get_page(next)
	else
		get_page(prev) }

const get = url => new Promise(yes =>
	{ const req = new XMLHttpRequest()
	req.open("GET", url)
	req.onload = () => yes(req.responseText)
	req.send()})

const get_page = x => get(x).then(pipe
	(parse_html,
	parse_page,
	render_page,
	replace(document.firstChild)))

function main() {
	if (!is_gallery_page(window.location.pathname)) return
	replace(document)(E("html").child(render_page(parse_page(document))).element) }

if (window.readyState === "complete") main()
else window.onload = main
})()
