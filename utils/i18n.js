const i18next = require('i18next');
const { emailData } = require("../config/emaildata.js");
i18next.init({
    lng: 'en', // Set the default language
    resources: {
        en: { translation: emailData.en },
        fr: { translation: emailData.fr },
        it: { translation: emailData.it },
        nl: { translation: emailData.nl },
        es: { translation: emailData.es },
        de: { translation: emailData.de }
    },
});

const getTrans = (languageCode = 'en', key) => {
    const t = i18next.getFixedT(languageCode);
    return t(key);
};

module.exports = getTrans;


