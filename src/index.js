import {isProbablyReaderable, Readability} from "@mozilla/readability";
import "core-js";
import "regenerator-runtime/runtime";

async function getUrl(url, data = {}) {
    // Default options are marked with *
    const response = await fetch("https://young-lake-26ed.blackenvelope.workers.dev/", {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'url': url
            //'Content-Type': 'text/html'
            //'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        //body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.text();
}

function parse_query_string(query) {
    const vars = query.split("&");
    const query_string = {};
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split("=");
        const key = decodeURIComponent(pair[0]);
        const value = decodeURIComponent(pair[1]);
        // If first entry with this name
        if (typeof query_string[key] === "undefined") {
            query_string[key] = decodeURIComponent(value);
            // } else if (typeof query_string[key] === "string") {
            //     // If second entry with this name
            //     query_string[key] = [query_string[key], decodeURIComponent(value)];
            // } else {
            //     // If third or later entry with this name
            //     query_string[key].push(decodeURIComponent(value));
        }
    }
    return query_string;
}

const input = document.getElementById("url");

function createDocumentFromHtml(text) {
    const newDoc = document.implementation.createHTMLDocument();
    const el = newDoc.createElement('html');
    el.innerHTML = text;
    try {
        newDoc.body.appendChild(el);
    } catch (e) {
        console.log(e);
    }
    return newDoc;
}

function setupReaderableStatus(newDoc, statusElement) {
    if (isProbablyReaderable) {
        const probablyReaderable = isProbablyReaderable(newDoc);
        if (probablyReaderable) {
            statusElement.classList.add("hidden");
            statusElement.innerHTML = "";
        } else {
            statusElement.innerHTML = "⚠&nbsp;Web site is probably not suitable for Reader Mode"
            statusElement.classList.add("error");
            statusElement.classList.remove("hidden");
        }
    } else {
        console.error("isProbablyReaderable was not defined");
    }
}

// title: article title;
function setupDocTitle(docTitle) {
    const title = document.getElementById("title")
    if (title) {
        title.innerHTML = docTitle;
    }
    return docTitle;
}

// byline: author metadata;
function setupByline(parsed) {
    let bylineStr = (parsed.byline || "").trim();
    const byline = document.getElementById("byline")
    if (byline) {
        byline.innerHTML = bylineStr;
    }
    return bylineStr
}

function setupReadableContent(htmlContent) {
    const contentElement = document.getElementById("readable")
    if (contentElement) {
        contentElement.innerHTML = htmlContent;
    }
    return contentElement;
}

// excerpt: article description, or short excerpt from the content;
function setupSummary(parsed) {
    const summary = (parsed.excerpt || "").trim()
    const summaryElement = document.getElementById("summary");
    if (summaryElement) {
        if (summary) {
            summaryElement.innerHTML = summary
            summaryElement.classList.remove("hidden");
        } else {
            summaryElement.classList.add("hidden");
            summaryElement.innerHTML = ""
        }
    }
    return summary;
}

function handleUrlChanged(str) {
    getUrl(str)
        .then(function (text) {
            const newDoc = createDocumentFromHtml(text);

            const statusElement = document.getElementById("status");
            setupReaderableStatus(newDoc, statusElement);

            const parsed = new Readability(newDoc).parse();
            //console.log(parsed);
            const docTitle = setupDocTitle((parsed.title || "").trim());
            setupByline(parsed);

            // content: HTML string of processed article content;
            // textContent: text content of the article, with all the HTML tags removed;
            const contentElement = setupReadableContent(parsed.content || "");
            setupSummary(parsed);
            // length: length of an article, in characters;
            // dir: content direction;

            // siteName: name of the site. NRC
            const siteName = (contentElement.excerpt || "").trim()
            document.title = (siteName ? siteName + " — " : "") + docTitle
            if (history) {
                history.pushState({
                    "url": str
                }, docTitle, "?url=" + encodeURI(str))
                return parsed
            }
        })
        .catch(e => console.error("Error: " + e))
}

if (input) {
    input.addEventListener("change",
        function (e) {
            const str = (e.target.value || "").trim()
            if (str && str.length > 3) {
                handleUrlChanged(str);
            }
        });

    const query = window.location.search.substring(1);
    const urlFromQueryString = parse_query_string(query)["url"];
    if (urlFromQueryString) {
        const s = urlFromQueryString.trim();
        input.value = s
        if (s && s.length > 5) {
            handleUrlChanged(s);
        }
    }
}