(function() {
"use strict"

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)

const parse_html = x => new DOMParser().parseFromString(x, "text/html")

const safe_pluck = k => x => x instanceof Object ? x[k] : null

function empty(x) { while(x.firstChild) x.removeChild(x.firstChild) }

const replace = el => tree =>
	{ empty(el)
	el.appendChild(tree) }

const is_gallery_page = location => new RegExp("^/s/[^/]+/[^/]+$").test(location)

const parse_page = dom =>
	({ "title": dom.querySelector("h1").innerHTML,
	"back": dom.querySelector("div.sb a").href,
	"next": dom.querySelector("#next").href,
	"prev": dom.querySelector("#prev").href,
	"pic": dom.querySelector("#img").src,
 	"full": safe_pluck("href")(dom.querySelector("#i7 > a")) })

function render_page(data)
	{ const elem = parse_html(`<body>
		<style>
			body { margin: 0; background: black; text-align: center; color: white; }
			img { display: block; width: 100vw; margin: auto; }
		</style>
		<img src="${data.pic}">
		<h1><a href="${data.back}">${data.title}</a></h1>
		<p><a href="${data.full || data.pic}">img 🔗</a></p>`)
	elem.querySelector("img").onclick = image_clicked(data.prev, data.next)
	return elem.body }

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
	const new_root = document.createElement("html")
	new_root.appendChild(render_page(parse_page(document)))
	replace(document)(new_root) }

if (document.readyState === "complete") main()
else window.onload = main
})()
