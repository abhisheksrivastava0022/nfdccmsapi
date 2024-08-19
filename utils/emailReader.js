const Imap = require('imap');
const { simpleParser } = require('mailparser');

let lastProcessedEmailUid = -1

const processEmail = (msg) => {
    return new Promise((resolve, reject) => {
        let emailText = '';

        msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
                emailText += chunk.toString('utf8');
            })
        })

        msg.once('attributes', async (attrs) => {
            // You can access email attributes here, e.g., subject, from, date, etc.
        })

        msg.once('end', () => {
            // Parse the email content using a library like 'mailparser'
            simpleParser(emailText, async (err, email) => {
                if (err) {
                    console.error('Error parsing email:', err);
                    reject(err); // Reject the promise if there's an error
                    return;
                }

                // Add your email processing logic here
                resolve(email);
            })
        })
    })
};

async function fetchNewEmail(message) {
    return new Promise((resolve, reject) => {
        message.on('message', async (msg) => {
            try {
                const email = await processEmail(msg)
                resolve(email)
            }
            catch (error) {
                reject(error)
            }
        })

        message.once('end', () => {
            // All emails have been processed
            //imapConnection.end(); // Close the connection gracefully
            console.log('message ended gracfully')
        })

        message.once('error', (err) => {
            reject(err)
        })
    })
}


async function startEmailListener(config, onEmailRecieve) {
    const imapConnection = new Imap(config);

    imapConnection.once('ready', () => {
        imapConnection.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('Error opening mailbox:', err);
                return;
            }

            console.log('opened mailbox', box.name)
            console.log('box.uidnext', box.uidnext)
            lastProcessedEmailUid = box.uidnext

            imapConnection.on('mail', async (number) => {
                console.log('Mail(s) recieved ', number)
                const fetch = imapConnection.seq.fetch((lastProcessedEmailUid) + ':*', {
                    bodies: [''],
                    struct: true,
                })

                fetch.on('message', async (msg, seqno) => {
                    const email = await processEmail(msg)
                    onEmailRecieve(email, seqno)
                })

                fetch.once('end', () => {
                    // Update lastProcessedEmailUid with the latest UID
                    lastProcessedEmailUid++;
                    console.log('updating last process uid : ', lastProcessedEmailUid)

                    // All emails in the current batch have been processed
                })
            })

        })
    })

    imapConnection.once('error', (err) => {
        console.error('IMAP connection error:', err);
    })

    imapConnection.once('end', () => {
        console.log('IMAP connection ended');
    })

    imapConnection.connect();

}

module.exports = startEmailListener;