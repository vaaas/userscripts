 (function() {
"use strict"

function empty(el) { while(el.firstChild) el.removeChild(el.firstChild) }

function replace(el, tree) {
	empty(el)
	el.appendChild(tree) }

const is_gallery_page = location => new RegExp("^/s/[^/]+/[^/]+$").test(location)

const parse_page =  doc => ({
	"title": doc.querySelector("h1").innerHTML,
	"back": doc.querySelector("div.sb a").href,
	"next": doc.getElementById("next").href,
	"prev": doc.getElementById("prev").href,
	"pic": doc.getElementById("img").src })

function render_page(data) {
	const e = s => document.createElement(s)
	const body = e("body")
	body.setAttribute("style", "margin: 0; background: black; text-align: center;")
	const h1 = e("h1")
	const a = e("a")
	a.href = data.back
	a.innerHTML = data.title
	const img = e("img")
	img.setAttribute("style", "display: block; max-width: 100vw; margin: auto;")
	img.src = data.pic
	img.onclick = image_clicked(data.prev, data.next)
	body.appendChild(img)
	body.appendChild(h1)
	h1.appendChild(a)
	return body }

const image_clicked = (prev, next) => event => {
	if ((event.clientX - event.target.offsetLeft) > event.target.offsetWidth/2)
		get_page(next)
	else
		get_page(prev) }

const get = url => new Promise(res => {
	const req = new XMLHttpRequest()
	req.open("GET", url)
	req.onload = _ => res(req.responseText)
	req.send() })

async function get_page(url) {
	replace(document,
	render_page(
	parse_page(
	new DOMParser().parseFromString(
	await get(url),"text/html"))))}

function main() {
	if (!is_gallery_page(window.location.pathname)) return
	replace(document,
	render_page(
	parse_page(document)))}

if (window.readyState === "complete") main()
else window.onload = main
})()
