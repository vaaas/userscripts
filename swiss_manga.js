(function() {
"use strict"
const stylesheet = `html { background: black; }
body { padding: 0; margin: 0; }
img { width: 100vw; height: 100vh; object-fit: contain; display: block; }
.hide { display: none; }`

const $$ = x => Array.from(document.querySelectorAll(x))
const next_url = () => document.querySelector("img.btnNext").parentElement.href
const right = (ev, el) => (ev.clientX - el.offsetLeft) > el.offsetWidth/2 ? true : false
const next_page = x => window.location.href = x

function next(x)
	{ x.classList.add("hide")
	x.nextElementSibling.classList.remove("hide") }

function previous(x)
	{ x.classList.add("hide")
	x.previousElementSibling.classList.remove("hide") }

function main()
	{ const button = document.createElement("button")
	button.innerText = "GO FULLSCREEN"
	button.onclick = doit
	document.querySelector("#headnav").insertAdjacentElement("afterend", button) }

function doit()
	{ const newbody = document.createElement("div")
	const url = next_url()
	$$("#divImage img").forEach(x =>
			{ x.setAttribute("style", stylesheet)
			x.classList.add("hide")
			x.onclick = e => right(e, x) ? next(x) : previous(x)
			newbody.appendChild(x) })
	newbody.firstChild.classList.remove("hide")
	newbody.firstChild.onclick = e => right(e, e.target) ? next(e.target) : false
	newbody.lastChild.onclick = e => right(e, e.target) ? next_page(url) : previous(e.target)
	document.write(`<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>${stylesheet}</style>
	</head>
	<body></body></html>`)
	document.body.appendChild(newbody)
	document.body.requestFullscreen() }

main()
})()
