// ==UserScript==
// @name	swiss-manga
// @description	adds a nicer fullscreen interface for reading manga
//
// @author	Vasileios Pasialiokis <whiterocket@outlook.com>
// @namespace https://github.com/vaaas/
// @downloadURL	https://raw.githubusercontent.com/vaaas/userscripts/master/swiss_manga.js
//
// @license	AGPLv3 - https://www.gnu.org/licenses/agpl.html
//
// @match	https://kissmanga.com/Manga/*
//
// @version	0.0.2
// @updateURL	https://raw.githubusercontent.com/vaaas/userscripts/master/swiss_manga.js
// ==/UserScript==

let run = false
if (run === false) nice_fullscreen_button()
function nice_fullscreen_button()
	{ "use strict"
	const stylesheet = `html { background: black; }
	body { padding: 0; margin: 0; }
	img { width: 100vw; height: 100vh; object-fit: contain; display: block; }
	.hide { display: none; }`

	const $$ = x => Array.from(document.querySelectorAll(x))
	const right = (ev, el) => ev.clientX - el.offsetLeft > el.offsetWidth/2
	const top = x => x.clientY < window.innerHeight / 5
	const next_page = x => window.location.href = x
	const hide = x => x.classList.add("hide")
	const show = x => x.classList.remove("hide")

	let next_url = document.querySelector("img.btnnext")
	next_url = next_url === null ? window.location.href : next_url.parentElement.href

	function next(x)
		{ hide(x)
		show(x.nextElementSibling) }

	function previous(x)
		{ hide(x)
		show(x.previousElementSibling) }

	function main()
		{ const button = document.createElement("button")
		button.innerText = "GO FULLSCREEN"
		button.onclick = doit
		document.querySelector("#headnav").insertAdjacentElement("afterend", button) }

	function image_clicked(e)
		{ if (top(e) && !document.fullscreenElement)
			document.firstChild.requestFullscreen()
		else if (right(e, e.target))
			{ if (e.target.nextElementSibling) next(e.target)
			else next_page(next_url) }
		else
			if (e.target.previousElementSibling) previous(e.target) }

	function doit()
		{ const newbody = document.createElement("div")
		$$("#divImage img").forEach(x =>
			{ x.setAttribute("style", stylesheet)
			hide(x)
			x.onclick = image_clicked
			newbody.appendChild(x) })
		show(newbody.firstChild)
		document.write(`<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>${stylesheet}</style>
		</head>
		<body></body></html>`)
		document.body.appendChild(newbody)
		document.body.requestFullscreen() }

	run = true
	main() }
