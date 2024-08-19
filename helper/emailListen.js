
const startEmailListener = require('../utils/emailReader.js');
const db = require("../models");
const fs = require('fs');
const purchaseBillImapConfig = {
    user: process.env.EMAIL_IMAP_PURCHASE_BILL_ID,
    password: process.env.EMAIL_IMAP_PURCHASE_BILL_PASSWORD,
    host: process.env.EMAIL_IMAP_PURCHASE_BILL_SERVER,
    port: process.env.EMAIL_IMAP_PURCHASE_BILL_PORT,
    tls: process.env.EMAIL_IMAP_PURCHASE_BILL_SSL,
    tlsOptions: { rejectUnauthorized: false }
};

startEmailListener(purchaseBillImapConfig, async (email, seqno) => {
    console.log(" mail Received ");
    const email_content = {
        message_id: email.headers.get('message-id'),
        from: email.from.value[0].address,
        name: email.from.value[0].name,
        subject: email.subject,
        body: email.text,
        status: 1,
        attachments: [...email.attachments.map(attachment => {
            const filename = attachment.filename;
            fs.mkdirSync("document/attachment", { recursive: true })
            // Save the attachment content to a file
            fs.writeFileSync(`document/attachment/attachment_${seqno}_${filename}`, attachment.content);
            return `attachment_${seqno}_${filename}`
        })]
    }
    console.log(email_content)
    const email_read = await db.email_read.create(email_content);  
    await db.purchase_bill.createPurchaseBill(email_read.id);

    /** 
     * Todo: maybe inser in db
     */
})