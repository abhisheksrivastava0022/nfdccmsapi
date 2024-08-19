const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');

class Pdf {

    static async create(viewHtml, data, folder, name) {

        try {

            await fs.mkdir(folder, { recursive: true })
            const html = await ejs.renderFile(viewHtml, data);

            const browser = await puppeteer.launch(
                {
                    headless: true,
                    executablePath: '/usr/bin/chromium-browser',
                    args: ['--disable-setuid-sandbox', '--no-sandbox']
                }
            );
            const page = await browser.newPage()
            page.setDefaultNavigationTimeout(0);

            await page.setContent(html)
            const headerTemplate = `<span style="font-size: 30px; width: 200px; height: 200px; background-color: black; color: white; margin: 20px;">Header</span>`;

            await page.pdf({
                path:folder+name,
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: `
                <div style="font-size: 10px;">&nbsp;</div>
                `,
                footerTemplate: `
                <div style="font-size: 10px; ">&nbsp;</div>
                `,
                margin: {
                    top: '40px',
                    bottom: '40px',
                    left: '0', // Set left margin to 0
                    right: '0' // Set right margin to 0
                }

            })

            await browser.close()
            return 1;
            // process.exit()

        } catch (e) {
            console.log(e)
            return 0;
        }
        return folder + name;
    }
    static async launch(viewHtml, data, folder, name) {
        try {
            console.log("launch")
            await fs.mkdir(folder, { recursive: true })
            const html = await ejs.renderFile(viewHtml, data);

            const browser = await puppeteer.launch(
                {
                    headless: true,
                    executablePath: '/usr/bin/chromium-browser',
                    args: ['--disable-setuid-sandbox', '--no-sandbox']
                }
            );
            const page = await browser.newPage()
            page.setDefaultNavigationTimeout(0);



            await page.setContent(html)
            const headerTemplate = `
            <span style="font-size: 30px; width: 200px; height: 200px; background-color: black; color: white; margin: 20px;">Header</span>`;


            const pdfbuffer = await page.pdf({
               
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: `
                <div style="font-size: 10px;">&nbsp;</div>
                `,
                footerTemplate: `
                <div style="font-size: 10px; ">&nbsp;</div>
                `,
                margin: {
                    top: '40px',
                    bottom: '40px',
                    left: '0', // Set left margin to 0
                    right: '0' // Set right margin to 0
                }
              
            })

            await browser.close()
            return pdfbuffer
            // process.exit()

        } catch (e) {
            console.log(e)
        }
        //  return folder + name;
    }
}

module.exports = Pdf