const { initializeBuckarooClient } = require('@buckaroo/buckaroo_sdk');
const PayPerEmail = require('@buckaroo/buckaroo_sdk/dist/PaymentMethods/PayPerEmail/index').default;
const Gender = require('@buckaroo/buckaroo_sdk/dist/Constants/Gender').default;
const ResponseStatus = require('@buckaroo/buckaroo_sdk/dist/Constants/ResponseStatus').default;
const { Hmac } = require('@buckaroo/buckaroo_sdk/dist/Request/Hmac');
const { isEmpty } = require('lodash');
const { createHash } = require('crypto');

class BuckarooException extends Error {
    constructor(message, data = {}) {
        super(message);
        this.name = this.constructor.name;
        this.data = data;
    }
}

const initializePayment = (website_key) => {
    if (!process.env.BUCKAROO_SECRET_KEY) {
        throw new Error('Please set buckaroo secret key')
    }

    initializeBuckarooClient({
        websiteKey: website_key,
        secretKey: process.env.BUCKAROO_SECRET_KEY
    }, {
        mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
    })
}

exports.createPayPerEmail = async ({
    website_key,
    invoice_number,
    amount,
    currency,
    gender,
    first_name,
    last_name,
    email,
    expirationDate = null,
    paymentMethodsAllowed = "ideal,Sofortueberweisung,mastercard,visa,paypal"
}) => {

    if (!expirationDate) {
        const date = (new Date((new Date()).getTime() + 14 * 24 * 60 * 60 * 1000)); //Get date next week
        expirationDate = date.toISOString().split('T')[0] //Format date as yyyy-mm-dd
    }

    initializePayment(website_key)

    const paymentMethod = new PayPerEmail()

    /**
     * todo:
     * Write request in payment logs
     */

    const res = await paymentMethod.paymentInvitation({
        invoice: invoice_number,
        amountDebit: amount,
        currency,
        customerGender: gender === 2 ? Gender.MALE : gender === 1 ? Gender.FEMALE : Gender.UNKNOWN,
        customerFirstName: first_name,
        customerLastName: last_name,
        customerEmail: email,
        merchantSendsEmail: true,
        expirationDate: expirationDate,
        paymentMethodsAllowed,
        returnURL: `${process.env.API_SERVER_URL}general/payment/complete`, //todo: Create helper for generating urls if not already available
    })

    /**
     * todo:
     * Write response in payment logs (res.data)
     */

    if (res.getStatusCode() == ResponseStatus.BUCKAROO_STATUSCODE_WAITING_ON_CONSUMER && !res.isFailed()) {
        return {
            paymentLink: res.getServiceParameters().payLink,
            expirationDate: res.getServiceParameters().expirationDate,
            transactionKey: res.getTransactionKey(),
            data: res.data
        }
    }
    else if (res.hasError()) {
        throw new BuckarooException(`Failed with error messages.Status: ${res.getStatusCode()}`, res.getErrorMessages())
    }
    else {
        throw new BuckarooException(res.getErrorMessage())
    }
}

exports.ValidatePayment = (data) => {
    const { brq_signature: signature, ...paymentData } = data

    if (!signature || isEmpty(paymentData)) {
        return false
    }

    const signatureString = Object.keys(paymentData).sort().reduce(
        (accumulator, key) => {
            accumulator += `${key}=${paymentData[key]}`;
            return accumulator;
        },
        ''
    ) + process.env.BUCKAROO_SECRET_KEY;

    const hash = createHash('sha1').update(signatureString, 'utf8').digest('hex')

    console.log({
        hash,
        signature
    })
    return signature === hash
}

exports.BuckarooException = BuckarooException
exports.BuckarooResponseStatus = ResponseStatus