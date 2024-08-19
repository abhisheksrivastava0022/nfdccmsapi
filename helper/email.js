const nodemailer = require("nodemailer");

const createTransport = async () => {
    let transport;
    if (process.env.NODE_ENV === 'production') {
        // all emails are delivered to destination
        transport = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'real.user',
                pass: 'verysecret'
            }
        });
    } else {
        // // all emails are catched by ethereal.email
        // const account = await nodemailer.createTestAccount();
        // // create reusable transporter object using the default SMTP transport
        // transport = nodemailer.createTransport({
        //     host: account.smtp.host,
        //     port: 587,
        //     secure: false, // true for 465, false for other ports
        //     auth: {
        //         user: account.user, // generated ethereal user
        //         pass: account.pass  // generated ethereal password
        //     }
        // });

        transport = nodemailer.createTransport({
            jsonTransport: true
        })
    }
    return transport
}
let transporter
createTransport().then(t => {
    transporter = t
})

exports.sendMail = async ({ to, body, subject }) => {
    
    return await transporter.sendMail({
        from: '"Leoprinting ERP " <erp@leoprinting.com>', // sender address
        to, // list of receivers
        subject, // Subject line
        html: body, // html body
    }).then(info => {
        if (process.env.NODE_ENV !== 'production'){
            console.log(info);
            //console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        }
    });
}