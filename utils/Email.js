
const nodemailer = require('nodemailer');


class Email {
    constructor(user, url) {
        this.to = user.email
        this.firstname = user.firstname
        this.url = url
        this.from = "<hello@gmail.com>"

    }
    async newTransport() {
        return await nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'abhisheksrivastava0022@gmail.com',
                pass: 'wruljixovncokixq'
            }
        });
    }
    async send(template, subject) {
        console.log("success")

        console.log(html);
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html
        };
        console.log("test");
        // create a transport and send email 
        const transporter = await this.newTransport();
        await transporter.sendMail(mailOptions);
    }
    async sendWelcome() {
        await this.send("templateName", "subjectName")
    }
}
//new Email("user", "url").sendWelcome();
module.exports = Email 