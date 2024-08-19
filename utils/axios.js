const axios = require("axios");
exports.getVendorPrice = async (jsonData) => {
    if (!process.env.CMS_AUTH_ID) {
        console.log("CMS AUTH ID not fount");
        return false;
    }
    if (!process.env.CMS_AUTH_PASSWORD) {
        console.log("CMS AUTH PASSWORD not fount");
        return false;
    }
    if (!process.env.CMS_STAGING_ID) {
        console.log("CMS STAGING ID not fount")
        return false;
    }
    if (!process.env.CMS_STAGING_PASSWORD) {
        console.log("CMS stage PASSWORD not fount");
        return false;
    }
    if (!process.env.CMS_URL) {
        console.log("CMS AUTH URL not fount");
        return false;
    }

    const CMS_AUTH_ID = process.env.CMS_AUTH_ID;
    const CMS_AUTH_PASSWORD = process.env.CMS_AUTH_PASSWORD;
    const CMS_STAGING_ID = process.env.CMS_STAGING_ID
    const CMS_STAGING_PASSWORD = process.env.CMS_STAGING_PASSWORD
    const cmsrequest = process.env.CMS_URL
    // const cmsrequest = (process.env?.CMS_URL) ? process.env.CMS_URL : 'https://leoprinting.nl/api/middleware?a=get_prices_by_specs'
    const base64Credentials = Buffer.from(`${CMS_AUTH_ID}:${CMS_AUTH_PASSWORD}`).toString('base64');
    const authToken = Buffer.from(`${CMS_STAGING_ID}:${CMS_STAGING_PASSWORD}`).toString('base64');
    const axiosConfig = {
        method: 'post',
        url: cmsrequest,
        data: jsonData,
        headers: {
            'Authorization': `Basic ${base64Credentials}`, // Set Basic Auth header with a different key
            'TOKEN': `Bearer ${authToken}`, // Set Bearer token header with a different key
            'Content-Type': 'application/json', // Set the content type to JSON
        },
    };
    const response = await axios(axiosConfig);
    return response
}

