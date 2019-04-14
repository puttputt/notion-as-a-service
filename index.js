'use strict';

const puppeteer = require('puppeteer');
const parser = require('node-html-parser');

// const url = 'https://www.notion.so/3d5d02a0e67f4a72867c20557effc7dc';

async function parse(url) {
    let headers = [];
    let objects = [];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    const content = await page.content();
    const root = parser.parse(content);

    const notionPage = root.querySelector('#notion-app');
    const table = notionPage.firstChild.firstChild.firstChild.childNodes[1].childNodes[2].firstChild.firstChild;
    const properties = table.firstChild.firstChild;
    const body = table.childNodes[2];

    properties.childNodes.forEach(heading => {
        headers.push(heading.text);
    });

    body.childNodes.shift();

    body.childNodes.forEach(row => {
        let column = 0;
        let object = {};
        row.childNodes.forEach(cell => {
            object[headers[column]] = cell.text;

            if (cell.text === '') {
                if (cell.querySelector('polygon') != null) {
                    object[headers[column]] = true;
                } else if (cell.querySelector('path') != null) {
                    object[headers[column]] = false;
                } else if (cell.querySelector('img') != null) {
                    const src = cell.querySelector('img').attributes.src.split('&width=')[0];

                    object[headers[column]] = `https://www.notion.so${src}`;
                }
            }
            column++;
        });
        console.log(object);
        objects.push(object);
    });

    browser.close();

    return objects;
};

module.exports.parse = parse;
