const axios = require('axios');
var db = require("../models");
const winston = require('winston');
//const {updateContactInfo,updateproject} = require("./handleApiReq");
const appconfig = require("../config/appconfig");
const API_KEY = appconfig.apiQueueInfo.api_key;
//const TWINFIELD_ACCESS_TOKEN = "88c11d5eabf093d2bcd30602395836d6";//appconfig.apiQueueInfo.twinfield_api_token;
const TWINFIELD_API_URL = appconfig.apiQueueInfo.twinfield_cluster_base_url;
const HUBSPOT_API_URL = appconfig.apiQueueInfo.hubspot_api_url;
const xml2js = require('xml2js');
const querystring = require('querystring');
const dotenv = require('dotenv');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const xmlbuilder = require('xmlbuilder');
const Queue = require("bull");
const { RedisConfig, redisConfiguration } = require("../config/redisConfig");
const hubspotQueue = new Queue("hubspotQueue", redisConfiguration);
require('dotenv').config();



// Load environment variables from .env file
//

// create a Winston logger instance
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'hubspot_error.log' }),
  ],
});


const apiRequest = async (method, url, data, api_name = null, primary_id = null, type = 0, hubspot_id = 0) => {

  let api_url = `${HUBSPOT_API_URL}${url}`;
  let header = {};
  if (type == 0) {
    header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    };

    api_url = `${HUBSPOT_API_URL}${url}`;

  } else if (type == 1) {
    header = {
      'Content-Type': 'text/xml;charset=UTF-8',
      //'Authorization' : `Bearer ${TWINFIELD_ACCESS_TOKEN}`,
    };
    api_url = `${TWINFIELD_API_URL}${url}`;
  } else {
    //const config = {
    header = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': appconfig.apiQueueInfo.twinfield_api_basic_token,
    };
    api_url = url;
    // };
  }

  const config = {
    method,
    url: api_url,
    headers: header,
  };
  if (data && type == 0) {
    config.data = JSON.parse(data);
  } else if (data && type == 1) {
    //console.log(process.env.TWINFIELD_ACCESS_TOKEN);
    const parsedXml = data;
    // const newAccessToken = process.env.TWINFIELD_ACCESS_TOKEN;
    // const updatedXmlString = parsedXml.replace(
    //   /<twin:AccessToken>.*<\/twin:AccessToken>/,
    //   `<twin:AccessToken>${newAccessToken}</twin:AccessToken>`
    // );

    //config.data = updatedXmlString;
    config.data = parsedXml;
  } else {
    config.data = querystring.stringify(data);
  }



  try {
    //console.log(config);return;
    const response = await axios(config);
    console.log(api_name);
    if (type == 0 || type == 3) {
      if (typeof api_name !== "undefined" && api_name && api_name == "contact") {
        if (response.data.vid) {
          const contact_model = await db.contacts.findByPk(primary_id);
          await contact_model.update({ 'hubspot_id': response.data.vid });
        }
        return response.data;
      } else if (typeof api_name !== "undefined" && api_name && api_name == "deal") {
        const createdDeal = response.data;
        const dealId = createdDeal.dealId;
        if (dealId) {
          const project = await db.projects.findByPk(primary_id);
          await project.update({ 'hubspot_id': dealId });
        }
        return response.data;
        //  await updateproject(primary_id,dealId);
      } else if(typeof api_name !== "undefined" && api_name && api_name == "add_product") {
        const createdProduct = response.data;
        let productId = createdProduct.objectId;
       
        if (productId) {
          const product = await db.product.findByPk(primary_id);
          let currentDate = new Date();
          let futureDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
          let formattedFutureDate = futureDate.toISOString().slice(0, 19).replace("T", " ");
          
          await product.update({ 'hubspot_id': productId,'is_product_sync': formattedFutureDate });
        }
        return response.data;

      }else if(typeof api_name !== "undefined" && api_name && api_name == "addItem"){
        // const productItems = response.data;
        // const Item_id = productItems.objectId;
        // if (productId) {
        //   const item = await db.project_item.findByPk(primary_id);
        //   await item.update({ 'hubspot_id': Item_id });
        // }
        return response.data;

      }else if(typeof api_name !== "undefined" && api_name && api_name == "update_product") {
        
        const product = await db.product.findByPk(primary_id);
        let currentDate = new Date();
        let futureDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
        let formattedFutureDate = futureDate.toISOString().slice(0, 19).replace("T", " ");
        await product.update({'is_product_sync': formattedFutureDate });
      }else{
        return response.data;
      }

    } else {

      if (api_name == 'twinfield_customer' || api_name == 'twinfield_vendor') {
        const parser = new xml2js.Parser();
        const parsedData = await parser.parseStringPromise(response.data);
        const soapEnvelop = parsedData['soap:Envelope'];
        const soapBody = soapEnvelop['soap:Body'];
        const processXmlStringResponse = soapBody[0].ProcessXmlStringResponse;
        const processXmlStringResult = processXmlStringResponse[0].ProcessXmlStringResult[0];
        const parser_inner = new xml2js.Parser({ explicitArray: false });
        const innerParsedData = await parser_inner.parseStringPromise(processXmlStringResult);
        //console.log(innerParsedData.dimension.code);
        if (innerParsedData.dimension.code) {
          if (api_name == 'twinfield_customer') {
            const company = await db.customer.findByPk(primary_id);
            await company.update({ 'twinfield_id': innerParsedData.dimension.code });
          } else {
            const vendor = await db.vendor.findByPk(primary_id);
            await vendor.update({ 'twinfield_id': innerParsedData.dimension.code });
          }
        }

      }else if(api_name =="twinfield_purchase_bill" ){
          const purchase_bill = await db.purchase_bill.findByPk(primary_id);
          await purchase_bill.update({ 'twinfield_id': innerParsedData.transaction.header.number});
      } else if(api_name =="twinfield_send_invoice" || api_name =="twinfield_send_credit_notes" || api_name=="twinfield_send_elure"){
          const purchase_bill = await db.invoice.findByPk(primary_id);
          await purchase_bill.update({ 'twinfield_id': innerParsedData.transaction.header.number});
      }else{
        return parsedData;
      }

    }
  } catch (error) {
   

    if (type == 0) {

      if (typeof api_name !== "undefined" && api_name && api_name == "contact") {

        if (error.response.data.identityProfile.vid) {
          // logger.error(`Error ${method.toUpperCase()} ${url}`, { data, error });
          if (error.response.data.identityProfile.vid) {
            const contact_model = await db.contacts.findByPk(primary_id);
            await contact_model.update({ 'hubspot_id': error.response.data.identityProfile.vid });
          }
          // await updateContactInfo(primary_id,error.response.data.identityProfile.vid);
        } else {
          logger.error(`Error ${method.toUpperCase()} ${url}`, { data, error });
        }
      } else {
        // console.log(data);
        logger.error(`Error ${method.toUpperCase()} ${url}`, { data, error });
      }
    } else if (type == 1) {
     
      if (error.response.status == 401) {
        await refreshToken();
      } else {
        console.log("ERRRO: to do for counter");
      }
    } else {
      logger.error(`Error ${method.toUpperCase()} ${url}`, { data, error });
    }
    // logger.error(`Error ${method.toUpperCase()} ${url}`, { data, error });
    // throw error;
  }
};

// Update the REFRESH_TOKEN in your .env file
async function updateRefreshToken(newRefreshToken) {
  process.env.TWINFIELD_ACCESS_TOKEN = newRefreshToken;
  const envFilePath = '.env'; // Update with your .env file path
  const envContent = Object.keys(process.env)
    .map((key) => `${key}=${process.env[key]}`)
    .join('\n');
  await fs.writeFileSync(envFilePath, envContent, 'utf8');
}

async function refreshToken() {
  const requestData = {
    grant_type: 'refresh_token',
    refresh_token: appconfig.apiQueueInfo.twinfield_api_refresh_token,
  };
  const url = appconfig.apiQueueInfo.twinfield_refresh_token_url;
  const data = await apiRequest('post', url, requestData, 'token', 0, 3);
  if (data) {
    await updateRefreshToken(data.access_token);
    console.log(data.access_token);
    return data.access_token;
  }
}


module.exports = {
  async get(url, type = 0) {
    return apiRequest('get', url, type);
  },

  async post(url, data, api_name, primary_id, type = 0, hubspot_id = 0) {
    return apiRequest('post', url, data, api_name, primary_id, type, hubspot_id);
  },

  async put(url, data, api_name, primary_id, type = 0, hubspot_id = 0) {
    return apiRequest('put',url, data, api_name, primary_id, type, hubspot_id);
  },

  async patch(url, data, type = 0) {
    return apiRequest('patch', url, data, type);
  },

  async del(url, type = 0) {
    return apiRequest('delete', url, type);
  },

  async accessToken() {
    //await updateRefreshToken("27761e352ad6b9b36b3cd1ff84afd56d");
    return process.env.TWINFIELD_ACCESS_TOKEN
  },

  async newToken() {
    //await updateRefreshToken("27761e352ad6b9b36b3cd1ff84afd56d");
    return await refreshToken();
  },


};
