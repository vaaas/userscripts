 (function() {
"use strict"

const E = s => document.createElement(s)

function empty(el) { while(el.firstChild) el.removeChild(el.firstChild) }

function replace(el, tree) {
	empty(el)
	el.appendChild(tree) }

const is_gallery_page = location => new RegExp("^/s/[^/]+/[^/]+$").test(location)

const parse_page = dom => ({
	"title": dom.querySelector("h1").innerHTML,
	"back": dom.querySelector("div.sb a").href,
	"next": dom.querySelector("#next").href,
	"prev": dom.querySelector("#prev").href,
	"pic": dom.querySelector("#img").src })

function render_page(data) {
	const body = E("body")
	body.setAttribute("style", "margin: 0; background: black; text-align: center;")
	const h1 = E("h1")
	const a = E("a")
	a.href = data.back
	a.innerHTML = data.title
	const img = E("img")
	img.setAttribute("style", "display: block; max-width: 100vw; margin: auto;")
	img.src = data.pic
	img.onclick = image_clicked(data.prev, data.next)
	body.appendChild(img)
	body.appendChild(h1)
	h1.appendChild(a)
	return body }

const go_fullscreen = el => el.requestFullscreen()

const image_clicked = (prev, next) => event => {
	if (event.clientY < window.innerHeight / 5 && !document.fullscreenElement)
		go_fullscreen(document.firstChild)
	else if ((event.clientX - event.target.offsetLeft) > event.target.offsetWidth/2)
		get_page(next)
	else
		get_page(prev) }

const get = url => new Promise(res => {
	const req = new XMLHttpRequest()
	req.open("GET", url)
	req.onload = _ => res(req.responseText)
	req.send() })

async function get_page(url) {
	replace(document.firstChild,
	render_page(
	parse_page(
	new DOMParser().parseFromString(
	await get(url),"text/html"))))}

function main() {
	if (!is_gallery_page(window.location.pathname)) return
	const new_root = E("html")
	new_root.appendChild(render_page(parse_page(document)))
	replace(document, new_root)}

if (window.readyState === "complete") main()
else window.onload = main
})()
