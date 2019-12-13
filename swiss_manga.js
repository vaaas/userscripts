window.addEventListener("load", (function() {
"use strict"
const stylesheet = `html { background: black; }
body { padding: 0; margin: 0; }
img { width: 100vw; height: 100vh; object-fit: contain; display: block; }
.hide { display: none; }`

const $$ = x => Array.from(document.querySelectorAll(x))
const right = (ev, el) => ev.clientX - el.offsetLeft > el.offsetWidth/2
const top = x => x.clientY < window.innerHeight / 5
const next_page = x => window.location.href = x
const next_url = document.querySelector("img.btnNext").parentElement.href

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

function image_clicked(e)
	{ if (top(e) && !document.fullscreenElement)
		document.firstChild.requestFullscreen()
	else if (right(e, e.target))
		{ if (e.target.nextElementSibling) next(x)
		else next_page(next_url) }
	else
		if (e.target.previousElementSibling) previous(x) }

function doit()
	{ const newbody = document.createElement("div")
	const url = next_url()
	$$("#divImage img").forEach(x =>
			{ x.setAttribute("style", stylesheet)
			x.classList.add("hide")
			x.onclick = image_clicked
			newbody.appendChild(x) })
	newbody.firstChild.classList.remove("hide")
	document.write(`<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>${stylesheet}</style>
	</head>
	<body></body></html>`)
	document.body.appendChild(newbody)
	document.body.requestFullscreen() }

main()
}), { once: true })
