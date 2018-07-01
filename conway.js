// ==UserScript==
// @name         GAG Conway's GoL
// @namespace    https://github.com/Oxore/GAG-Conway
// @version      0.1
// @description  Github activity graph based Conway's "Game of Life"
// @author       Oxore
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function completeField(rects) {
        let rightColumn = rects[rects.length - 1].parentElement;
        let rightColumnInitSize = rightColumn.getElementsByClassName(rects[rects.length - 1].className.baseVal).length;
        let rightColumnSize = rightColumnInitSize;
        while (rightColumnSize < 7) {
            let rect = rightColumn.getElementsByClassName(rects[rects.length - 1].className.baseVal)[rightColumnSize - 1].cloneNode();
            rect.setAttribute("y", parseInt(rect.getAttribute("y")) + 12);
            rect.setAttribute("data-count", 0);
            rect.setAttribute("fill", "#ebedf0");
            rect.addEventListener("click", cellClickHandler, false);
            rightColumn.appendChild(rect);
            rects[rects.length] = rect;
            rightColumnSize = rightColumn.getElementsByClassName(rects[rects.length - 1].className.baseVal).length;
        }
    }

    function removeAll(rects) {
        for (let i = 0; i < rects.length; i++) {
            rects[i].remove();
        }
    }

    function hideAll(rects) {
        for (let i = 0; i < rects.length; i++) {
            rects[i].style.display = "none";
        }
    }

    function showAll(rects) {
        for (let i = 0; i < rects.length; i++) {
            rects[i].style.display = "block";
        }
    }

    function duplicateAll(rects, fakesClassName) {
        let fakes = [];
        for (let i = 0; i < rects.length; i++) {
            fakes[i] = rects[i].cloneNode();
            fakes[i].className.baseVal = fakesClassName;
            rects[i].parentElement.appendChild(fakes[i]);
            fakes[i].addEventListener("click", cellClickHandler, false);
        }
        return fakes;
    }

    function copyField(destination, source) {
        for (let i = 0; i < source.length; i++) {
            destination[i].setAttribute("data-count", parseInt(source[i].getAttribute("data-count")));
            destination[i].style.fill = source[i].style.fill;
        }
    }

    function createStartButton() {
        let startButton = document.createElement("Button");
        let startButtonLabel = document.createTextNode("Play Conway's GoL");
        startButton.appendChild(startButtonLabel);
        startButton.classList.add("btn");
        startButton.id = "GAG-conway-startButton";
        return startButton;
    }

    function drawStartButton(startButton, activityGraph) {
        let startButtonDiv = document.createElement("div");
        startButtonDiv.style.clear = "left";
        startButtonDiv.appendChild(startButton);
        let footer = activityGraph.getElementsByClassName("contrib-footer clearfix mt-1 mx-3 px-3 pb-1");
        footer[0].appendChild(startButtonDiv);
    }

    function createSpeedSlider() {
        let speedSlider = document.createElement("INPUT");
        speedSlider.setAttribute("type", "range");
        speedSlider.setAttribute("min", "100");
        speedSlider.setAttribute("max", "2000");
        speedSlider.setAttribute("value", "500");
        speedSlider.oninput = function() {
            speed = parseInt(this.value);
            if (gameState == "on") {
                window.clearInterval(intervalContainer);
                intervalContainer = window.setInterval(tick, speed);
            }
        }
        speedSlider.id = "GAG-conway-speedSlider";
        return speedSlider;
    }

    function drawSpeedSlider(speedSlider, activityGraph) {
        let speedSliderDiv = document.createElement("div");
        speedSliderDiv.style.clear = "left";
        speedSlider.id = "GAG-conway-speedSlider-div";
        let speedSliderLabelDiv = document.createElement("div")
        speedSliderLabelDiv.appendChild(document.createTextNode("Speed: (Press \"Space\" to pause)"));
        speedSliderDiv.appendChild(speedSliderLabelDiv);
        speedSliderDiv.appendChild(speedSlider);
        let footer = activityGraph.getElementsByClassName("contrib-footer clearfix mt-1 mx-3 px-3 pb-1");
        footer[0].appendChild(speedSliderDiv);
        speedSliderDiv.style.display = "none";
        return speedSliderDiv;
    }

    function switchGameState() {
        if (gameState == "off") {
            fakeRects = duplicateAll(realRects, "fakeRect");
            fakeRectsTmp = duplicateAll(realRects, "fakeRectTmp");
            completeField(fakeRects);
            completeField(fakeRectsTmp);
            hideAll(realRects);
            hideAll(fakeRectsTmp);
            window.addEventListener("keydown", preventDefaultArrows, false);
            document.onkeydown = keyboardCallback;
            intervalContainer = window.setInterval(tick, speed);
            startButton.innerText = "Turn Off";
            speedSliderDiv.style.display = "";
            gameState = "on";
        } else {
            removeAll(fakeRects);
            removeAll(fakeRectsTmp);
            showAll(realRects);
            window.removeEventListener("keydown", preventDefaultArrows, false);
            document.onkeydown = 0;
            window.clearInterval(intervalContainer);
            startButton.innerText = "Play Conway's GoL";
            speedSliderDiv.style.display = "none";
            gameState = "off";
        }
    }

    function preventDefaultArrows(e) {
        if ([32].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }

    function keyboardCallback(e) {
        if (e.keyCode == 32) paused = !paused;
    }

    function cellClickHandler(e) {
        if (parseInt(e.target.getAttribute("data-count")) > 0) {
            e.target.setAttribute("data-count", 0);
            e.target.style.fill = "rgb(235, 237, 240)";
        } else {
            e.target.setAttribute("data-count", 1);
            e.target.style.fill = "rgb(35, 154, 59)";
        }
    }

    function isAlive(i) {
        if (parseInt(fakeRects[i].getAttribute("data-count")) > 0) {
            return 1;
        }
        return 0;
    }

    function die(i) {
        fakeRectsTmp[i].setAttribute("data-count", 0);
        fakeRectsTmp[i].style.fill = "rgb(235, 237, 240)";
    }

    function born(i) {
        fakeRectsTmp[i].setAttribute("data-count", 1);
        fakeRectsTmp[i].style.fill = "rgb(35, 154, 59)";
    }

    function neighbours(i) {
        let nn = 0;
        let n = [];
        n[0] = (i % 7 != 0) ? i - 1 : -1;
        n[1] = (i % 7 != 6) ? i + 1 : -1;
        n[2] = (i % 7 != 0) ? i - 7 - 1 : -1;
        n[3] = i - 7;
        n[4] = (i % 7 != 6) ? i - 7 + 1 : -1;
        n[5] = (i % 7 != 0) ? i + 7 - 1 : -1;
        n[6] = i + 7;
        n[7] = (i % 7 != 6) ? i + 7 + 1 : -1;
        for (let j = 0; j < 8; j++) {
            if (n[j] >= 0 && n[j] < fakeRects.length) {
                if (parseInt(fakeRects[n[j]].getAttribute("data-count")) > 0) {
                    nn++;
                }
            }
        }
        return nn;
    }

    function tick() {
        if (paused) return;
        copyField(fakeRectsTmp, fakeRects);
        for (let i = 0; i < fakeRects.length; i++) {
            if (isAlive(i)) {
                if (neighbours(i) < 2 || neighbours(i) > 3) {
                    die(i);
                }
            } else {
                if (neighbours(i) == 3) {
                    born(i);
                }
            }
        }
        copyField(fakeRects, fakeRectsTmp);
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
        var gameState = "off";
        var startButton = createStartButton();
        var speedSlider = createSpeedSlider();
        drawStartButton(startButton, activityGraph[0]);
        var speedSliderDiv = drawSpeedSlider(speedSlider, activityGraph[0]);
        startButton.addEventListener("click", switchGameState);
        var fakeRects, fakeRectsTmp, realRects = document.getElementsByClassName("day");
        var intervalContainer, speed = 500, paused = 0;
    }
})();
