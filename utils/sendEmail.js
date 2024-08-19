const nodemailer = require("nodemailer");
const expressHandlebars = require("express-handlebars");
const nodemailerExpressHandlebars = require("nodemailer-express-handlebars");
const appconfig = require("../config/appconfig");
const fs = require('fs');




const transport = nodemailer.createTransport({
  host: appconfig.emailQueueInfo.server_smtp_host,
  port: appconfig.emailQueueInfo.server_smtp_port,
  ...(
    (appconfig.emailQueueInfo.server_smtp_user || appconfig.emailQueueInfo.server_smtp_password) ?
      {
        auth: {
          user: appconfig.emailQueueInfo.server_smtp_user,
          pass: appconfig.emailQueueInfo.server_smtp_password
        }
      } :
      {}
  )
});

transport.use(
  "compile",
  nodemailerExpressHandlebars({
    viewEngine: {
      layoutsDir: "./views/email/", // location of handlebars templates
      defaultLayout: false, //default layout. This is necessary if you don't want to use main.handlebars
      partialsDir: "./views/email/",
    },
    viewPath: "./views/email/"
  })
);

const sendMail = (recipient, primary, subject, template, data) => {
  const other_info = JSON.parse(data.other);
//  console.log(appconfig.emailQueueInfo);

  const emailMessage = {
    from: other_info.from_to,
    to: recipient,
    subject: subject,
    template: template,
    replyTo: other_info.from_to,
    context: {
      receiver_name: data.receiver_name,
      // primary_data : data,
      base_image_url: appconfig.emailQueueInfo.base_image_url,
      client_app_url: appconfig.emailQueueInfo.server_client_app_url,
      other_info: other_info
    }
  };

  // if (data.attachment) {
  //   let attachmentPaths = [];

  //   if (typeof data.attachment === 'string') {
  //     attachmentPaths = data.attachment.split(',');
  //   } else if (Array.isArray(data.attachment)) {
  //     attachmentPaths = data.attachment;
  //   }
  //   if (attachmentPaths.length > 0) {
  //     emailMessage.attachments = attachmentPaths.map(attachment => {
  //       return { path: attachment.trim() };
  //     });
  //   }
  // }

  if (data.attachment) {
    let attachmentPaths = [];

    if (typeof data.attachment === 'string') {
      attachmentPaths = data.attachment.split(',');
    } else if (Array.isArray(data.attachment)) {
      attachmentPaths = data.attachment;
    }

    if (attachmentPaths.length > 0) {

      emailMessage.attachments = attachmentPaths
        .map(attachment => attachment.trim())
        .filter(attachment => {
          if (fs.existsSync(attachment)) {
            return true;
          } else {
            console.warn(`File not found: ${attachment}`);
            return false;
          }
        })
        .map(attachment => ({ path: attachment }));
    }
  }

  transport.sendMail(emailMessage, (error, info) => {
    if (error) {
        console.log("transport", transport);
        console.log("transport", emailMessage);
        console.log(error);
        return false;
    }
  
    console.log("Email sent:", info.response);
    
  });
};



module.exports = sendMail;