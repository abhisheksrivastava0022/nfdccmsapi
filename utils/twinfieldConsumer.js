const db = require("../models");
const Sequelize = require("sequelize");

const appconfig = require("../config/appconfig");
const Queue = require("bull");
const { RedisConfig, redisConfiguration } = require("../config/redisConfig");
const hubspotQueue = new Queue("hubspotQueue", redisConfiguration);
const model = db.hubspot_req;
const customer_model = db.customer;
const contact_model = db.contact;
const Users = db.users;
const elure = db.euler;
const language_model = db.language;
const { get, put, post, patch, del, accessToken, newToken } = require("./apiRequest");
const category = require("../models/category");
const xml2js = require('xml2js');
const xmlbuilder = require('xmlbuilder');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Op } = Sequelize;

const twinfield_entity_identifier = {
  '3100335363': { 'id': '121808', 'invoice_group': '1', 'tf_office': '3100335363', 'tf_debtor_ledger': '13000', 'tf_creditor_ledger': '16000', 'tf_sales_code': 'VRK', 'tf_purchase_code': 'INK', 'vat_number': 'NL820760018B01' },
  '0004': { 'id': '102750', 'invoice_group': '4', 'tf_office': '0004', 'tf_debtor_ledger': '1200', 'tf_creditor_ledger': '3300', 'tf_sales_code': 'VRK', 'tf_purchase_code': 'INK', 'vat_number': 'DE815307014' },
  '0007': { 'id': '100600', 'invoice_group': '7', 'tf_office': '0007', 'tf_debtor_ledger': '400000', 'tf_creditor_ledger': '440000', 'tf_sales_code': 'VRK', 'tf_purchase_code': 'INK', 'vat_number': 'BE0808948524' },
  '0010': { 'id': '102060', 'invoice_group': '10', 'tf_office': '0010', 'tf_debtor_ledger': '13000', 'tf_creditor_ledger': '16000', 'tf_sales_code': 'VRK', 'tf_purchase_code': 'INK', 'vat_number': 'GB122524060' },
  'NLA002674': { 'id': '121808', 'invoice_group': '1', 'tf_office': 'NLA002674', 'tf_debtor_ledger': '1300', 'tf_creditor_ledger': '1600', 'tf_sales_code': 'VRK', 'tf_purchase_code': 'INK', 'vat_number': 'NL820760018B01' },
};

class twinfieldConsumer {
  async createHubspotQueueEvent(twinfield_data) {
    if (twinfield_data) {
      let last_id = twinfield_data.id;
      console.log(last_id);
      await hubspotQueue.add({ id: last_id });
    }
  }
  gender() {
    return { 1: "Female", 2: "Male", 3: "Other" };
  }

  // create company(Debtor) in twinfield
  async createCompany(data) {
    const cdata = await customer_model.findByPk(data.id);
    //console.log(cdata);return;

    const customer_info = await customer_model.findOne({
      attributes: ['company', "email", 'website', 'contact_country_code', 'contact_number', 'vat_number', 'primary_address_id', 'twinfield_id'],
      where: {
        id: cdata.id,
      },
      include: [{
        attributes: ['vat_number', 'tf_office', 'twinfield_identifier'],
        model: db.entity,
      },
      {
        attributes: ['name', 'code'],
        model: db.country,
      },
      ],
    });
    const primary_address = await db.address.findByPk(customer_info.primary_address_id);
    //const token = await accessToken();
    const token = await newToken();



    let street = '';
    let zipcode = '';
    let city = '';
    if (primary_address) {
      street = (primary_address.street_number ?? '') + " " + primary_address.street;
      zipcode = primary_address.zipcode ?? '';
      city = primary_address.city ?? '';
    }
    const country_code = "NL";//customer_info.country.code;
    const teliphone_code = customer_info.contact_country_code ?? '';
    const teliphone_number = teliphone_code + customer_info.contact_number;
    const twinfield_identifier = customer_info.twinfield_id ?? '';
    const vat_number = '';//customer_info.vat_number ?? '';
    const office_value = "NLA002674"; //customer_info.entity.tf_office
    const codeElement = (twinfield_identifier) ? `<code>${twinfield_identifier}</code>` : '';
    //  const codeElement = '';

    //const office= 
    const soapEnvelope = xmlbuilder.create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', token).up()
      .ele('twin:CompanyCode', `${office_value}`).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<dimension>
            <office>${office_value}</office>
            ${codeElement} 
            <type>DEB</type>
            <name>${customer_info.company}</name> 
            <website>${customer_info.website ?? ''}</website> 
            <addresses>
              <address>
                <field1></field1>
                <field2>${street}</field2> 
                <postcode>${zipcode}</postcode> 
                <city>${city}</city>
                <country>${country_code}</country> 
                <field4>${vat_number}</field4> 
                <telephone>${teliphone_number}</telephone> 
                <email>${customer_info.email}</email>
              </address>
            </addresses>
          </dimension>`)
      .end({ pretty: true });

    const soapXmlString = soapEnvelope.toString({ pretty: true });

    console.log(soapXmlString);
    return false;

    const method = "post";
    const target_url = "/webservices/processxml.asmx?wsdl";
    const source_url = "twinfield_customer";
    const status = 0;
    const resp = '{}';
    const primary_id = cdata.id;
    const hubspotobj = model.setHubspotData(
      method,
      target_url,
      source_url,
      status,
      soapXmlString,
      resp,
      primary_id,
      1
    );

    const hubspot_data = await model.create(hubspotobj);
    this.createHubspotQueueEvent(hubspot_data);

  }

  // create supplier (creditor)
  async createVendor(data) {
    const cdata = await db.vendor.findByPk(data.id);
    const vendor_info = await db.vendor.findOne({
      attributes: ['company', "email", 'website', 'mobile_country_code', 'mobile_number', 'vat_number', 'primary_address_id', 'twinfield_id'],
      where: {
        id: cdata.id,
      },
      include: [{
        attributes: ['vat_number', 'tf_office', 'twinfield_identifier'],
        model: db.entity,
      },
      {
        attributes: ['name', 'code'],
        model: db.country,
      },
      ],
    });



    const primary_address = await db.address.findByPk(vendor_info.primary_address_id);
    //const token = await refreshToken();
    const token = await newToken();
    let street = '';
    let zipcode = '';
    let city = '';
    if (primary_address) {
      street = (primary_address.street_number ?? '') + " " + primary_address.street;
      zipcode = primary_address.zipcode ?? '';
      city = primary_address.city ?? '';
    }
    const country_code = "NL";//customer_info.country.code;
    const teliphone_code = vendor_info.mobile_country_code ?? '';
    const teliphone_number = teliphone_code + vendor_info.mobile_number;
    const twinfield_identifier = vendor_info.twinfield_id ?? '';
    const vat_number = '';//customer_info.vat_number ?? '';
    const office_value = "NLA002674"; //customer_info.entity.tf_office
    const codeElement = (twinfield_identifier) ? `<code>${twinfield_identifier}</code>` : '';
    //const codeElement = '';


    //const office= 
    const soapEnvelope = xmlbuilder.create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', token).up()
      .ele('twin:CompanyCode', `${office_value}`).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<dimension>
                  <office>${office_value}</office>
                  ${codeElement} 
                  <type>CRD</type>
                  <name>${vendor_info.company}</name> 
                  <website>${vendor_info.website ?? ''}</website> 
                  <addresses>
                    <address>
                      <field1></field1>
                      <field2>${street}</field2> 
                      <postcode>${zipcode}</postcode> 
                      <city>${city}</city>
                      <country>${country_code}</country> 
                      <field4>${vat_number}</field4> 
                      <telephone>${teliphone_number}</telephone> 
                      <email>${vendor_info.email}</email>
                    </address>
                    </addresses>
                    </dimension>`)
      .end({ pretty: true });
    const soapXmlString = soapEnvelope.toString({ pretty: true });

    const method = "post";
    const target_url = "/webservices/processxml.asmx?wsdl";
    const source_url = "twinfield_vendor";
    const status = 0;
    const resp = '{}';
    const primary_id = cdata.id;
    const hubspotobj = model.setHubspotData(
      method,
      target_url,
      source_url,
      status,
      soapXmlString,
      resp,
      primary_id,
      1
    );

    const hubspot_data = await model.create(hubspotobj);
    this.createHubspotQueueEvent(hubspot_data);

  }


  // // send Elur invoice to twinfield
  //   async sendElure(data) {
  //     // const token = await accessToken();
  //     const token = await newToken();
  //     const elure = await db.elure.findOne({
  //       where: {
  //         id: 1,
  //       },
  //     });

  //     const invoice = await db.invoice.findOne({
  //       where: {
  //         id: elure.invoice_id,
  //       },
  //       include: [{
  //         attributes: ['vat_number', 'tf_office', 'twinfield_identifier', 'country_id'],
  //         model: db.entity,
  //       },
  //       ],
  //     });

  //     const is_credit_nota = true;
  //     const country_info = await db.country.findByPk(invoice.entity.country_id);
  //     const entity_other_info = twinfield_entity_identifier[invoice.entity.tf_office];
  //     const creditor_sales_code = entity_other_info.tf_sales_code;
  //     const CompanyCode = "NLA002674";
  //     const currency_code = "EUR";
  //     const invoice_date = invoice.invoice_date;
  //     const expiry_date = invoice.expiry_date;
  //     const payload_info = {
  //       AccessToken: token,
  //       CompanyCode: CompanyCode,
  //       record: {
  //         creditor_entity: {
  //           tf_office: CompanyCode,
  //           tf_sales_code: creditor_sales_code,
  //         },
  //         currency: {
  //           code: currency_code,
  //         },
  //         invoice_date: this.changeDateFormate(invoice_date, 0),
  //         invoice_period: this.changeDateFormate(invoice_date, 1),
  //         expiry_date: this.changeDateFormate(expiry_date, 0),
  //         invoice_number: invoice.invoice_number,
  //         invoice_dim: {},
  //         invoice_lines: [],
  //       },
  //     };

  //     // this one for if is_credit_nota = false
  //     payload_info.record.invoice_dim = {
  //       dim1: 1300,//entity_other_info.tf_debtor_ledger,
  //       dim2: 1020,//invoice.entity.twinfield_identifier,
  //       value: elure.amount_received,
  //       debitcredit: is_credit_nota ? 'debit' : 'credit',
  //     };

  //     //for (const invoice_line_data of invoice_inlines_data) {
  //     //   console.log(invoice_line_data.general_ledger_id);return;
  //     // const general_ledger = await db.general_ledger.findByPk(invoice_line_data.general_ledger_id);
  //     //  const vat_type_info = await db.vat_type.findByPk(invoice_line_data.visible_vat);
  //     const lineItem = {
  //       dim1: 2011,//general_ledger.ledger_text,
  //       value: elure.amount_received,
  //       debitcredit: 'debit',
  //       //  vatvalue: invoice_line_data.total_vat ?? 0,
  //       description: "Elure payment",
  //       // vatcode: vat_type_info.btw_code,
  //       // performancetype: 'goods',
  //       // performancecountry: country_info.code,
  //       // performancevatnumber: invoice.entity.vat_number,

  //     };
  //     payload_info.record.invoice_lines.push(lineItem);
  //     //}
  //     // console.log(payload_info.record.invoice_lines);return;
  //     const soapEnvelope = await this.generateTransactionXMLForElure(payload_info);
  //     const soapXmlString = soapEnvelope.toString({ pretty: true });

  //     const method = "post";
  //     const target_url = "/webservices/processxml.asmx?wsdl";
  //     const source_url = "twinfield_send_elure";
  //     const status = 0;
  //     const resp = '{}';
  //     const primary_id = invoice.id;
  //     const hubspotobj = model.setHubspotData(
  //       method,
  //       target_url,
  //       source_url,
  //       status,
  //       soapXmlString,
  //       resp,
  //       primary_id,
  //       1
  //     );

  //     const hubspot_data = await model.create(hubspotobj);
  //     this.createHubspotQueueEvent(hubspot_data);


  //   }


  // send invoice and credit notes to twinfield
  async sendInvoice(data) {

    const invoice = await db.invoice.findOne({
      where: {
        id: data.id,
      },
      include: [
        { model: db.invoice_lines, required: false },
        { model: db.currency },
        { model: db.entity },
      ]
    });

    let credit_note = 0;
    if (invoice.credit_note == 'null' || invoice.credit_note == 0) {
      credit_note = 0;
    } else {
      credit_note = 1;
    }


    const customer = await db.customer.findByPk(invoice.customer_id);

    const CompanyCode = "NLA002674";//invoice.entity.tf_office
    const country_info = await db.country.findByPk(invoice.entity.country_id);
    const entity_other_info = twinfield_entity_identifier[CompanyCode];
    //console.log(entity_other_info); return;
    const creditor_sales_code = entity_other_info.tf_sales_code;
    const twinfield_invoice_group = entity_other_info.invoice_group;
    const currency_code = invoice.currency.code;
    const invoice_date = invoice.invoice_date;
    const expiry_date = invoice.expiry_date;
    const payload_info = {
      AccessToken: token,
      CompanyCode: CompanyCode,
      record: {
        creditor_entity: {
          tf_office: CompanyCode,
          tf_sales_code: creditor_sales_code,
        },
        currency: {
          code: currency_code,
        },
        invoice_date: this.changeDateFormate(invoice_date, 0),
        invoice_period: this.changeDateFormate(invoice_date, 1),
        expiry_date: this.changeDateFormate(expiry_date, 0),
        invoice_number: invoice.invoice_number,
        invoice_dim: {},
        invoice_lines: [],
      },
    };
    // const invoice_inlines_data = await db.invoice_lines.findAll({
    //   where: {
    //     invoice_id: invoice.id
    //   }
    // });

    const invoice_inlines_data = invoice.invoice_lines;
    // this one for if is_credit_nota = false
    let amount_inc_vat = 0;
    if (currency_code == "EUR") {
      amount_inc_vat = invoice.total_amount;
    } else {
      amount_inc_vat = invoice.total_amount_converted[currency_code];
    }

    payload_info.record.invoice_dim = {
      dim1: entity_other_info.tf_debtor_ledger,//1300,
      dim2: customer.twinfield_id,//invoice.entity.twinfield_identifier,
      value: Math.abs(amount_inc_vat),
      debitcredit: (credit_note == 0) ? 'debit' : 'credit',
    };
    for (const invoice_line_data of invoice_inlines_data) {
      //   console.log(invoice_line_data.general_ledger_id);return;
      const general_ledger = await db.general_ledger.findByPk(invoice_line_data.general_ledger_id);
      let ledger_text = '';
      if (twinfield_invoice_group == 1 || twinfield_invoice_group == 10) {
        ledger_text = general_ledger.ledger_text;
      } else if (twinfield_invoice_group == 4) {
        ledger_text = general_ledger.ledger_text_de;
      } else if (twinfield_invoice_group == 7) {
        ledger_text = general_ledger.ledger_text_be;
      } else {
        ledger_text = general_ledger.ledger_text;
      }

      const vat_type_info = await db.vat_type.findByPk(invoice_line_data.visible_vat);
      const total_price_with_exc_vat = Math.abs(invoice_line_data.total_price_excl_vat);
      const total_price_with_inc_vat = Math.abs(invoice_line_data.total_price_incl_vat);
      // Check if both values are less than 0
      let vat_value = 0;
      if (total_price_with_exc_vat < 1 && total_price_with_inc_vat < 1) {
        // Set VAT to 0 if both values are less than 0
        vat_value = 0;
      } else {
        // Calculate the VAT amount
        vat_value = Math.max(0, total_price_with_inc_vat - total_price_with_exc_vat);
      }

      const lineItem = {
        dim1: (CompanyCode == 'NLA002674') ? 2011 : ledger_text,
        value: total_price_with_exc_vat,
        debitcredit: (credit_note == 0) ? 'credit' : 'debit',
        vatvalue: vat_value ?? 0,
        description: invoice_line_data.description,
        vatcode: (CompanyCode == 'NLA002674') ? "VH" : vat_type_info.btw_code,//vat_type_info.btw_code,
        performancetype: 'goods',
        performancecountry: country_info.code,
        performancevatnumber: invoice.entity.vat_number,
      };
      payload_info.record.invoice_lines.push(lineItem);
    }
    // console.log(payload_info.record.invoice_lines);return;
    const soapEnvelope = await this.generateTransactionXML(payload_info);
    const soapXmlString = soapEnvelope.toString({ pretty: true });
    const method = "post";
    const target_url = "/webservices/processxml.asmx?wsdl";
    const source_url = "twinfield_send_invoice";
    const status = 0;
    const resp = '{}';
    const primary_id = invoice.id;
    const hubspotobj = model.setHubspotData(
      method,
      target_url,
      source_url,
      status,
      soapXmlString,
      resp,
      primary_id,
      1
    );
    const hubspot_data = await model.create(hubspotobj);
    this.createHubspotQueueEvent(hubspot_data);
    // payload_info.record.invoice_lines.push(lineItem);
  }




  // send invoice and credit notes to twinfield
  async sendElureInvoice(data) {

    const invoice = await db.invoice.findOne({
      where: {
        id: data.id,
      },
      include: [
        { model: db.invoice_lines, required: false },
        { model: db.currency },
        { model: db.entity },
      ]
    });

    let credit_note = 1;
    // if(invoice.credit_note=='null' ||  invoice.credit_note==0){
    //   credit_note=0;
    // }else{
    //   credit_note=1;
    // }


    const customer = await db.customer.findByPk(invoice.customer_id);

    const CompanyCode = "3100335371";//invoice.entity.tf_office
    const country_info = await db.country.findByPk(invoice.entity.country_id);
    const entity_other_info = twinfield_entity_identifier[CompanyCode];
    //console.log(entity_other_info); return;
    const creditor_sales_code = "INK";
    const twinfield_invoice_group = entity_other_info.invoice_group;
    const currency_code = "EUR";
    const invoice_date = invoice.invoice_date;
    const expiry_date = invoice.expiry_date;
    const payload_info = {
      AccessToken: token,
      CompanyCode: CompanyCode,
      record: {
        creditor_entity: {
          tf_office: CompanyCode,
          tf_sales_code: creditor_sales_code,
        },
        currency: {
          code: currency_code,
        },
        invoice_date: this.changeDateFormate(invoice_date, 0),
        invoice_period: this.changeDateFormate(invoice_date, 1),
        expiry_date: this.changeDateFormate(expiry_date, 0),
        invoice_number: invoice.invoice_number,
        invoice_dim: {},
        invoice_lines: [],
      },
    };
    // const invoice_inlines_data = await db.invoice_lines.findAll({
    //   where: {
    //     invoice_id: invoice.id
    //   }
    // });

    const invoice_inlines_data = invoice.invoice_lines;
    let amount_inc_vat = 0;
    if (currency_code == "EUR") {
      amount_inc_vat = invoice.total_amount;
    } else {
      amount_inc_vat = invoice.total_amount_converted[currency_code];
    }

    // this one for if is_credit_nota = false
    payload_info.record.invoice_dim = {
      dim1: "16000",//1300,
      dim2: "2000",//invoice.entity.twinfield_identifier,
      value: amount_inc_vat,
      debitcredit: (credit_note == 0) ? 'debit' : 'credit',
    };
    for (const invoice_line_data of invoice_inlines_data) {
      //   console.log(invoice_line_data.general_ledger_id);return;
      const general_ledger = await db.general_ledger.findByPk(invoice_line_data.general_ledger_id);
      let ledger_text = '';
      if (twinfield_invoice_group == 1 || twinfield_invoice_group == 10) {
        ledger_text = general_ledger.ledger_text;
      } else if (twinfield_invoice_group == 4) {
        ledger_text = general_ledger.ledger_text_de;
      } else if (twinfield_invoice_group == 7) {
        ledger_text = general_ledger.ledger_text_be;
      } else {
        ledger_text = general_ledger.ledger_text;
      }

      const vat_type_info = await db.vat_type.findByPk(invoice_line_data.visible_vat);
      const total_price_with_exc_vat = invoice_line_data.total_price_excl_vat;
      const total_price_with_inc_vat = invoice_line_data.total_price_incl_vat;
      // Check if both values are less than 0
      let vat_value = 0;
      if (total_price_with_exc_vat < 1 && total_price_with_inc_vat < 1) {
        // Set VAT to 0 if both values are less than 0
        vat_value = 0;
      } else {
        // Calculate the VAT amount
        vat_value = Math.max(0, total_price_with_inc_vat - total_price_with_exc_vat);
      }

      const lineItem = {
        dim1: (CompanyCode == 'NLA002674') ? 2011 : ledger_text,
        value: total_price_with_exc_vat ?? 0,
        debitcredit: (credit_note == 0) ? 'credit' : 'debit',
        vatvalue: vat_value ?? 0,
        description: invoice_line_data.description,
        vatcode: (CompanyCode == 'NLA002674') ? "VH" : vat_type_info.btw_code,//vat_type_info.btw_code,
        performancetype: 'goods',
        performancecountry: country_info.code,
        performancevatnumber: invoice.entity.vat_number,
      };
      payload_info.record.invoice_lines.push(lineItem);
    }
    // console.log(payload_info.record.invoice_lines);return;
    const soapEnvelope = await this.generateTransactionXML(payload_info);
    const soapXmlString = soapEnvelope.toString({ pretty: true });
    const method = "post";
    const target_url = "/webservices/processxml.asmx?wsdl";
    const source_url = "twinfield_send_invoice";
    const status = 0;
    const resp = '{}';
    const primary_id = invoice.id;
    const hubspotobj = model.setHubspotData(
      method,
      target_url,
      source_url,
      status,
      soapXmlString,
      resp,
      primary_id,
      1
    );
    const hubspot_data = await model.create(hubspotobj);
    this.createHubspotQueueEvent(hubspot_data);
    // payload_info.record.invoice_lines.push(lineItem);
  }












  // async sendCreditNotes(data) {
  //   // console.log("keshav"); return;
  //   // const token = await accessToken();
  //   const invoice = await db.invoice.findOne({
  //     where: {
  //       id: data.id,
  //     },
  //     include: [
  //       { model: db.invoice_lines, required: false },
  //       { model: db.currency },
  //       { model: db.entity },
  //     ]
  //   });

  //   const CompanyCode = "NLA002674";//invoice.entity.tf_office
  //   const country_info = await db.country.findByPk(invoice.entity.country_id);
  //   const entity_other_info = twinfield_entity_identifier[CompanyCode];
  //   //console.log(entity_other_info); re turn;

  //   const creditor_sales_code = entity_other_info.tf_sales_code;
  //   const twinfield_invoice_group=   entity_other_info.invoice_group; 
  //   const currency_code = invoice.currency.code;
  //   const invoice_date = invoice.invoice_date;
  //   const expiry_date = invoice.expiry_date;


  //   const payload_info = {
  //     AccessToken: token,
  //     CompanyCode: CompanyCode,
  //     record: {
  //       creditor_entity: {
  //         tf_office: CompanyCode,
  //         tf_sales_code: creditor_sales_code,
  //       },
  //       currency: {
  //         code: currency_code,
  //       },
  //       invoice_date: this.changeDateFormate(invoice_date, 0),
  //       invoice_period: this.changeDateFormate(invoice_date, 1),
  //       expiry_date: this.changeDateFormate(expiry_date, 0),
  //       invoice_number: invoice.invoice_number,
  //       invoice_dim: {},
  //       invoice_lines: [],
  //     },
  //   };
  //  const invoice_inlines_data = invoice.invoice_lines;
  //   // this one for if is_credit_nota = false
  //   payload_info.record.invoice_dim = {
  //     dim1: 1300,//entity_other_info.tf_debtor_ledger,
  //     dim2: 1020,//invoice.entity.twinfield_identifier,
  //     value: invoice.total_amount,
  //     debitcredit: 'credit',
  //   };
  //   for (const invoice_line_data of invoice_inlines_data) {
  //     //   console.log(invoice_line_data.general_ledger_id);return;
  //     const general_ledger = await db.general_ledger.findByPk(invoice_line_data.general_ledger_id);
  //     let ledger_text= '';
  //     if(twinfield_invoice_group==1 || twinfield_invoice_group==10){
  //       ledger_text = general_ledger.ledger_text;
  //     }else if(twinfield_invoice_group==4){
  //       ledger_text = general_ledger.ledger_text_de;
  //     }else if(twinfield_invoice_group==7){
  //       ledger_text = general_ledger.ledger_text_be;
  //     }else{
  //       ledger_text = general_ledger.ledger_text;
  //     }
  //    const vat_type_info = await db.vat_type.findByPk(invoice_line_data.visible_vat);
  //     const lineItem = {
  //       dim1: (CompanyCode=='NLA002674')?2011:ledger_text,
  //       value: invoice_line_data.total_price_excl_vat,
  //       debitcredit: 'debit',
  //       vatvalue: invoice_line_data.total_vat ?? 0,
  //       description: invoice_line_data.description,
  //       vatcode:  (CompanyCode=='NLA002674')?"VH":vat_type_info.btw_code,//vat_type_info.btw_code,
  //       performancetype: 'goods',
  //       performancecountry: country_info.code,
  //       performancevatnumber: invoice.entity.vat_number,
  //     };
  //     payload_info.record.invoice_lines.push(lineItem);
  //   }
  //   // console.log(payload_info.record.invoice_lines);return;
  //   const soapEnvelope = await this.generateTransactionXML(payload_info);
  //   const soapXmlString = soapEnvelope.toString({ pretty: true });
  //   const method = "post";
  //   const target_url = "/webservices/processxml.asmx?wsdl";
  //   const source_url = "twinfield_send_credit_notes";
  //   const status = 0;
  //   const resp = '{}';
  //   const primary_id = invoice.id;
  //   const hubspotobj = model.setHubspotData(
  //     method,
  //     target_url,
  //     source_url,
  //     status,
  //     soapXmlString,
  //     resp,
  //     primary_id,
  //     1
  //   );
  //   const hubspot_data = await model.create(hubspotobj);
  //   this.createHubspotQueueEvent(hubspot_data);
  //   // payload_info.record.invoice_lines.push(lineItem);
  // }

  async sendTransactionToTwinfield(data) {
    //  const token = await accessToken();
    const token = await newToken();

    let type = 0;
    //1-> bukaro 2-> twinfield payment 3-> manual payment 4-> website payment
    if (data.type == 1 || data.type == 4) {
      type = 1;
    } else {
      type = 2;
    }

    const invoice = await db.invoice.findOne({
      where: {
        id: data.invoice_id,
      },
      include: [{
        attributes: ['vat_number', 'tf_office', 'twinfield_identifier', 'country_id'],
        model: db.entity,

      },
      { model: db.currency }
      ],
    });
    const customer = await db.customer.findByPk(invoice.customer_id);
    const entity_other_info = twinfield_entity_identifier[invoice.entity.tf_office];
    //console.log(entity_other_info); return;
    //const creditor_sales_code = entity_other_info.tf_sales_code;

    const invoice_payment = await db.invoice_payment.findByPk(data.id);
    let twinfield_number = '';
    // if (invoice_payment.twinfield_id !== null && invoice_payment.twinfield_id !== undefined && invoice_payment.twinfield_id !== 0 && invoice_payment.twinfield_id !== '') {
    //   twinfield_number = `<number>${invoice_payment.twinfield_id}</number>`;
    // }
    const CompanyCode = "NLA002674";//invoice.entity.tf_office
    const currency_code = invoice.currency.code;
    const payload_info = {
      AccessToken: token,
      CompanyCode: CompanyCode,
      record: {
        creditor_entity: {
          tf_office: CompanyCode,
          tf_sales_code: "MEMO",
        },
        currency: {
          code: currency_code,
        },
        twinfield_number: twinfield_number,
        invoice_number: invoice.invoice_number,
        invoice_date: this.changeDateFormate(invoice.invoice_date, 0),
        invoice_dim: {},
        invoice_lines: [],
      },
    };


    // this one for if is_credit_nota = false
    payload_info.record.invoice_dim = {
      dim1: (type == 1) ? '2011' : '1010',//entity_other_info.tf_debtor_ledger,
      // dim2: 1020,//invoice.entity.twinfield_identifier,
      value: invoice_payment.amount,
      debitcredit: 'debit',
    };
    // const general_ledger = await db.general_ledger.findByPk(invoice_line_data.general_ledger_id);
    // const vat_type_info = await db.vat_type.findByPk(invoice_line_data.visible_vat);
    const lineItem = {
      dim1: entity_other_info.tf_debtor_ledger,//1300,
      dim2: customer.twinfield_id,//invoice.entity.twinfield_identifier,
      value: invoice_payment.amount,
      invoice_number: invoice.invoice_number,
      debitcredit: 'credit',
      // vatvalue: invoice_line_data.total_vat ?? 0,
      description: "Manual Payments",
    };
    payload_info.record.invoice_lines.push(lineItem);
    // console.log(payload_info.record.invoice_lines);return;
    let soapEnvelope;
    if ((type == 1)) {
      soapEnvelope = await this.generateManualTransactionXML(payload_info);
    } else {
      soapEnvelope = await this.generateBankTransactionXML(payload_info);
    }

    const soapXmlString = soapEnvelope.toString({ pretty: true });


    const axiosConfig = {
      headers: {
        'Content-Type': 'text/xml',
      },
    };


    try {
      const response = await axios.post(appconfig.apiQueueInfo.twinfield_cluster_base_url + '/webservices/processxml.asmx?wsdl', soapXmlString, axiosConfig);
      const parser = new xml2js.Parser();
      const parsedData = await parser.parseStringPromise(response.data);
      const soapEnvelope = parsedData['soap:Envelope'];
      const soapBody = soapEnvelope['soap:Body'];
      const processXmlStringResponse = soapBody[0].ProcessXmlStringResponse;
      const processXmlStringResult = processXmlStringResponse[0].ProcessXmlStringResult[0];
      const parserInner = new xml2js.Parser({ explicitArray: false });
      const innerParsedData = await parserInner.parseStringPromise(processXmlStringResult);
      const invoiceNumber = innerParsedData.transaction.header.number;
      const invoice_paym = await db.invoice_payment.findByPk(data.id);
      console.log(invoiceNumber);
      await invoice_paym.update({ twinfield_id: invoiceNumber });
    } catch (error) {
      console.error(error);
      //return null;
    }

  }

  // pay purchase bills
  async payPurchaseBills(sepa_payement_id) {
    const purchase_bills = await db.purchase_bill.findAll({
      where: {
        sepa_payement_id: sepa_payement_id,
      },
    });


    for (const purchase_bill of purchase_bills) {
      this.sendPurchaseBill(purchase_bill, 1);
    }

  }

  async sendPurchaseBill(data, is_paid = 0) {

    //let is_credit_nota = true; true for paid or false for unpaid

    // const token = await accessToken();
    const token = await newToken();
    const purchase_bill = await db.purchase_bill.findOne({
      where: {
        id: data.id,
      },
      include: [{
        attributes: ['vat_number', 'tf_office', 'twinfield_identifier', 'country_id'],
        model: db.entity,
      },
      ],
    });

    let twinfield_number = '';
    //let is_paid = 0;
    // if (purchase_bill.twinfield_id !== null && purchase_bill.twinfield_id !== undefined && purchase_bill.twinfield_id !== 0 && purchase_bill.twinfield_id !== '') {
    //   twinfield_number = `<number>${invoice_payment.twinfield_id}</number>`;
    //   is_paid = 1;
    // }
    const CompanyCode = "NLA002674";//purchase_bill.entity.tf_office
    const country_info = await db.country.findByPk(purchase_bill.entity.country_id);
    const entity_other_info = twinfield_entity_identifier[CompanyCode];
    //console.log(entity_other_info); return;
    const twinfield_invoice_group = entity_other_info.invoice_group;
    //const creditor_sales_code = entity_other_info.tf_sales_code;
    //const CompanyCode = "NLA002674";
    const currency_code = "EUR";
    const purchase_date = purchase_bill.invoice_date;
    const purchase_expiry_date = purchase_bill.due_date;
    const payload_info = {
      AccessToken: token,
      CompanyCode: CompanyCode,
      record: {
        creditor_entity: {
          tf_office: CompanyCode,
          tf_sales_code: "INK",//creditor_sales_code,
        },
        currency: {
          code: currency_code,
        },
        twinfield_number: twinfield_number,
        invoice_date: this.changeDateFormate(purchase_date, 0),
        invoice_period: this.changeDateFormate(purchase_date, 1),
        expiry_date: this.changeDateFormate(purchase_expiry_date, 0),
        invoice_number: purchase_bill.invoice_number,
        invoice_dim: {},
        invoice_lines: [],
      },
    };
    const purchase_inlines_data = await db.purchase_bill_line.findAll({
      where: {
        purchase_bill_id: purchase_bill.id
      }
    });

    let amount_inc_vat = 0;
    if (currency_code == "EUR") {
      amount_inc_vat = purchase_bill.total_price_incl_vat;
    } else {
      amount_inc_vat = purchase_bill.total_price_incl_vat_converted[currency_code];
    }
    // this one for if is_credit_nota = false
    const vendor = await db.vendor.findByPk(purchase_bill.vendor_id);
    payload_info.record.invoice_dim = {
      dim1: entity_other_info.tf_debtor_ledger,
      dim2: vendor.twinfield_id,//invoice.entity.twinfield_identifier,
      value: amount_inc_vat ?? '0',
      debitcredit: (is_paid == 0) ? 'debit' : 'credit',
    };

    for (const purchase_inline_data of purchase_inlines_data) {
      //   console.log(invoice_line_data.general_ledger_id);return;
      const general_ledger = await db.general_ledger.findByPk(purchase_inline_data.general_ledger_id);
      const vat_type_info = await db.vat_type.findByPk(purchase_inline_data.vat_type_id);

      let ledger_text = '';
      if (twinfield_invoice_group == 1 || twinfield_invoice_group == 10) {
        ledger_text = general_ledger.ledger_text;
      } else if (twinfield_invoice_group == 4) {
        ledger_text = general_ledger.ledger_text_de;
      } else if (twinfield_invoice_group == 7) {
        ledger_text = general_ledger.ledger_text_be;
      } else {
        ledger_text = general_ledger.ledger_text;
      }


      const total_price_with_exc_vat = purchase_inline_data.price_excl_vat;
      const total_price_with_inc_vat = purchase_inline_data.total_price_incl_vat;
      // Check if both values are less than 0
      let vat_value = 0;
      if (total_price_with_exc_vat < 1 && total_price_with_inc_vat < 1) {
        // Set VAT to 0 if both values are less than 0
        vat_value = 0;
      } else {
        // Calculate the VAT amount
        vat_value = Math.max(0, total_price_with_inc_vat - total_price_with_exc_vat);
      }


      const lineItem = {
        dim1: ledger_text,// 2011,//general_ledger.ledger_text,
        value: total_price_with_exc_vat,
        debitcredit: (is_paid == 0) ? 'credit' : 'debit',
        vatvalue: vat_value ?? 0,
        description: purchase_inline_data.item_text ?? '',
        vatcode: vat_type_info.btw_code,
        performancetype: 'goods',
        performancecountry: country_info.code,
        performancevatnumber: purchase_bill.entity.vat_number,
      };
      payload_info.record.invoice_lines.push(lineItem);
    }


    const soapEnvelope = await this.generatePurchaseTransactionXML(payload_info);





    const soapXmlString = soapEnvelope.toString({ pretty: true });
    const method = "post";
    const target_url = "/webservices/processxml.asmx?wsdl";
    let source_url = '';
    if (is_paid == 0) {
      source_url = "twinfield_purchase_bill";
    } else {
      source_url = "twinfield_purchase_bill";
    }
    const status = 0;
    const resp = '{}';
    const primary_id = invoice.id;
    const hubspotobj = model.setHubspotData(
      method,
      target_url,
      source_url,
      status,
      soapXmlString,
      resp,
      primary_id,
      1
    );

    const hubspot_data = await model.create(hubspotobj);
    this.createHubspotQueueEvent(hubspot_data);
    // payload_info.record.invoice_lines.push(lineItem);

  }




  async generateManualTransactionXML(data) {
    const soapEnvelope = await xmlbuilder
      .create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', data.AccessToken).up()
      .ele('twin:CompanyCode', data.CompanyCode).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<transaction  destiny="temporary" raisewarning="false">
          <header>
            <office>${data.record.creditor_entity.tf_office}</office>
            <code>MEMO</code>
            <currency>${data.record.currency.code}</currency>
            <date>${data.record.invoice_date}</date>
             ${data.record.twinfield_number}
          </header>
          ${`<lines>
            <line id="1" type="detail">
              <dim1>${data.record.invoice_dim.dim1}</dim1>
              <value>${data.record.invoice_dim.value}</value>
                <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
            </line>
            ${data.record.invoice_lines
          .map((invoice_line, index) => {
            return `<line id="${index + 2}" type="detail">
                <dim1>${invoice_line.dim1}</dim1>
                <dim2>${invoice_line.dim2}</dim2>
                <value>${invoice_line.value}</value>
                <invoicenumber>${invoice_line.invoice_number}</invoicenumber>
                <debitcredit>${invoice_line.debitcredit}</debitcredit> 
                <description>${invoice_line.description}</description>
              </line>`;
          })
          .join('')}
          </lines>`
        }
        </transaction>`)
      .end({ pretty: true });
    return soapEnvelope;

  }


  async generateBankTransactionXML(data) {
    const soapEnvelope = await xmlbuilder
      .create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', data.AccessToken).up()
      .ele('twin:CompanyCode', data.CompanyCode).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<transaction  destiny="temporary" raisewarning="false">
          <header>
            <office>${data.record.creditor_entity.tf_office}</office>
            <code>BNK</code>
            <currency>${data.record.currency.code}</currency>
            <date>${data.record.invoice_date}</date>
            ${data.record.twinfield_number}
          </header>
          ${`<lines>
            <line id="1" type="total">
              <dim1>${data.record.invoice_dim.dim1}</dim1>
              <value>${data.record.invoice_dim.value}</value>
                <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
            </line>
            ${data.record.invoice_lines
          .map((invoice_line, index) => {
            return `<line id="${index + 2}" type="detail">
                <dim1>${invoice_line.dim1}</dim1>
                <dim2>${invoice_line.dim2}</dim2>
                <value>${invoice_line.value}</value>
                <invoicenumber>${invoice_line.invoice_number}</invoicenumber>
                <debitcredit>${invoice_line.debitcredit}</debitcredit> 
                <description>${invoice_line.description}</description>
              </line>`;
          })
          .join('')}
          </lines>`
        }
        </transaction>`)
      .end({ pretty: true });

    return soapEnvelope;

  }


  // async generateTransactionXMLForElure(data) {
  //   // Create the XML structure

  //   const soapEnvelope = await xmlbuilder
  //     .create('soapenv:Envelope', { encoding: 'utf-8' })
  //     .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
  //     .att('xmlns:twin', 'http://www.twinfield.com/')
  //     .ele('soapenv:Header')
  //     .ele('twin:Header')
  //     .ele('twin:AccessToken', data.AccessToken).up()
  //     .ele('twin:CompanyCode', data.CompanyCode).up().up().up()
  //     .ele('soapenv:Body')
  //     .ele('twin:ProcessXmlString')
  //     .ele('twin:xmlRequest')
  //     .dat(`<transaction autobalancevat="true" destiny="final" raisewarning="false">
  //       <header>
  //         <office>${data.record.creditor_entity.tf_office}</office>
  //         <code>${data.record.creditor_entity.tf_sales_code}</code>
  //         <currency>${data.record.currency.code}</currency>
  //         <invoicenumber>${data.record.invoice_number}</invoicenumber>
  //       </header>
  //       ${`<lines>
  //         <line id="1" type="total">
  //           <dim1>${data.record.invoice_dim.dim1}</dim1>
  //           <dim2>${data.record.invoice_dim.dim2}</dim2>
  //            <value>${data.record.invoice_dim.value}</value>
  //             <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
  //           <description />
  //         </line>
  //         ${data.record.invoice_lines
  //         .map((invoice_line, index) => {
  //           return `<line id="${index + 2}" type="detail">
  //             <dim1>${invoice_line.dim1}</dim1>
  //             <value>${invoice_line.value}</value>
  //               <debitcredit>${invoice_line.debitcredit}</debitcredit>
  //             <description>${invoice_line.description
  //               .replace('&', 'en')
  //               .replace('®', '')
  //               .substring(0, 40)}</description>
  //           </line>`;
  //         })
  //         .join('')}
  //       </lines>`
  //       }
  //     </transaction>`)
  //     .end({ pretty: true });

  //   // const xmlString = soapEnvelope.toString();
  //   return soapEnvelope;
  // }


  async generateTransactionXML(data) {
    // Create the XML structure

    const soapEnvelope = await xmlbuilder
      .create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', data.AccessToken).up()
      .ele('twin:CompanyCode', data.CompanyCode).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<transaction autobalancevat="true" destiny="final" raisewarning="false">
              <header>
                <office>${data.record.creditor_entity.tf_office}</office>
                <code>${data.record.creditor_entity.tf_sales_code}</code>
                <currency>${data.record.currency.code}</currency>
                <period>${data.record.invoice_period}</period>
                <date>${data.record.invoice_date.replace(/-/g, '')}</date>
                <duedate>${data.record.expiry_date.replace(/-/g, '')}</duedate>
                <invoicenumber>${data.record.invoice_number}</invoicenumber>
              </header>
              ${`<lines>
                <line id="1" type="total">
                  <dim1>${data.record.invoice_dim.dim1}</dim1>
                  <dim2>${data.record.invoice_dim.dim2
        }</dim2>
                   <value>${data.record.invoice_dim.value}</value>
                    <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
                  <description />
                </line>
                ${data.record.invoice_lines
          .map((invoice_line, index) => {
            return `<line id="${index + 2}" type="detail">
                    <dim1>${invoice_line.dim1}</dim1>
                    <value>${invoice_line.value}</value>
                      <debitcredit>${invoice_line.debitcredit}</debitcredit>
                      <vatvalue>${invoice_line.vatvalue}</vatvalue>
                    <description>${invoice_line?.description?.replace('&', 'en')?.replace('®', '')?.substring(0, 40)}</description>
                    <vatcode>${invoice_line.vatcode}</vatcode>
                    ${invoice_line.vatcode == 'VEU'
                ? `<performancetype>${invoice_line.performancetype}</performancetype>
                    <performancecountry>${invoice_line.performancecountry
                }</performancecountry>
                    <performancevatnumber>${invoice_line.performancevatnumber
                }</performancevatnumber>`
                : ''
              }
                  </line>`;
          })
          .join('')}
              </lines>`
        }
            </transaction>`)
      .end({ pretty: true });

    // const xmlString = soapEnvelope.toString();
    return soapEnvelope;

  }

  async generatePurchaseTransactionXML(data) {
    // Create the XML structure

    const soapEnvelope = await xmlbuilder
      .create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', data.AccessToken).up()
      .ele('twin:CompanyCode', data.CompanyCode).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<transaction autobalancevat="true" destiny="final" raisewarning="false">
              <header>
                <office>${data.record.creditor_entity.tf_office}</office>
                <code>${data.record.creditor_entity.tf_sales_code}</code>
                <currency>${data.record.currency.code}</currency>
                <period>${data.record.invoice_period}</period>
                <date>${data.record.invoice_date.replace(/-/g, '')}</date>
                <duedate>${data.record.expiry_date.replace(/-/g, '')}</duedate>
                <invoicenumber>${data.record.invoice_number}</invoicenumber>
                ${data.record.twinfield_number}
              </header>
              ${`<lines>
                <line id="1" type="total">
                  <dim1>${data.record.invoice_dim.dim1}</dim1>
                  <dim2>${data.record.invoice_dim.dim2
        }</dim2>
                   <value>${data.record.invoice_dim.value}</value>
                    <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
                  <description />
                </line>
                ${data.record.invoice_lines
          .map((invoice_line, index) => {
            return `<line id="${index + 2}" type="detail">
                    <dim1>${invoice_line.dim1}</dim1>
                    <value>${invoice_line.value}</value>
                      <debitcredit>${invoice_line.debitcredit}</debitcredit>
                      <vatvalue>${invoice_line.vatvalue}</vatvalue>
                    <description>${invoice_line?.description?.replace('&', 'en')?.replace('®', '')?.substring(0, 40)}</description>
                    <vatcode>${invoice_line.vatcode}</vatcode>
                    ${invoice_line.vatcode == 'IEU'
                ? `<performancetype>${invoice_line.performancetype}</performancetype>
                    <performancecountry>${invoice_line.performancecountry
                }</performancecountry>
                    <performancevatnumber>${invoice_line.performancevatnumber
                }</performancevatnumber>`
                : ''
              }
                  </line>`;
          })
          .join('')}
              </lines>`
        }
            </transaction>`)
      .end({ pretty: true });

    // const xmlString = soapEnvelope.toString();
    return soapEnvelope;

  }

  async generateTransactionXMLForElure(data) {
    // Create the XML structure

    const soapEnvelope = await xmlbuilder
      .create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', '5df233eecdbe649c1c663ed7b7b8d766').up()
      .ele('twin:CompanyCode', 'NLA002674').up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`<transaction autobalancevat="true" destiny="final" raisewarning="false">
            <header>
              <office>${data.record.creditor_entity.tf_office}</office>
              <code>${data.record.creditor_entity.tf_sales_code}</code>
              <currency>${data.record.currency.code}</currency>
              <period>${data.record.invoice_date}</period>
              <date>${data.record.invoice_date.replace(/-/g, '')}</date>
              <duedate>${data.record.expiry_date.replace(/-/g, '')}</duedate>
              <invoicenumber>${data.record.invoice_number}</invoicenumber>
            </header>
            ${`<lines>
              <line id="1" type="total">
                <dim1>${data.record.invoice_dim.dim1}</dim1>
                <dim2>${data.record.invoice_dim.dim2}</dim2>
                 <value>${data.record.invoice_dim.value}</value>
                  <debitcredit>${data.record.invoice_dim.debitcredit}</debitcredit> 
                <description />
              </line>
              ${data.record.invoice_lines
          .map((invoice_line, index) => {
            return `<line id="${index + 2}" type="detail">
                  <dim1>${invoice_line.dim1}</dim1>
                  <value>${invoice_line.value}</value>
                    <debitcredit>${invoice_line.debitcredit}</debitcredit>
                    <vatvalue>${invoice_line.vatvalue}</vatvalue>
                  <description>${invoice_line.description
                .replace('&', 'en')
                .replace('®', '')
                .substring(0, 40)}</description>
                  ${invoice_line.vatcode ? `<vatcode>${invoice_line.vatcode}</vatcode>` : ''}
                </line>`;
          })
          .join('')}
            </lines>`
        }
          </transaction>`)
      .end({ pretty: true });

    // const xmlString = soapEnvelope.toString();
    return soapEnvelope;
  }

  // get all transaction information

  async getAllTransaction() {
    const all_transction = db.transaction_last_info.findAll();
    for (const trans of all_transction) {
      this.getALLInvoicePaymentInformation(trans);
    }
  }

  async getALLInvoicePaymentInformation(data) {

    const token = await newToken();
    const first_transaction = parseInt(data.transaction_id);
    const last_transaction = first_transaction + 1000;
    const twinfield_office = data.twinfield_office;

    let exect_last_transaction = "";
    const soapEnvelope = await xmlbuilder.create('soapenv:Envelope', { encoding: 'utf-8' })
      .att('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
      .att('xmlns:twin', 'http://www.twinfield.com/')
      .ele('soapenv:Header')
      .ele('twin:Header')
      .ele('twin:AccessToken', token).up()
      .ele('twin:CompanyCode', twinfield_office).up().up().up()
      .ele('soapenv:Body')
      .ele('twin:ProcessXmlString')
      .ele('twin:xmlRequest')
      .dat(`
          <columns code="100">
            <column id="1">
              <field>fin.trs.head.number</field>
              <label>Boekst.nr.</label>
              <visible>true</visible>
              <ask>true</ask>
              <operator>between</operator>
              <from>${first_transaction}</from>
              <to>${last_transaction}</to>
              <finderparam></finderparam>
            </column>
            <column id="2">
              <field>fin.trs.head.status</field>
              <label>Status</label>
              <visible>false</visible>
              <ask>true</ask>
              <operator>equal</operator>
              <from>final</from>
              <to></to>
              <finderparam></finderparam>
            </column>
            <column id="3">
            <field>fin.trs.line.dim2</field>
            <label>Debiteur</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>between</operator>
            <from></from>
            <to></to>
            <finderparam>dimtype=DEB</finderparam>
          </column>
          <column id="4">
            <field>fin.trs.line.dim2name</field>
            <label>Naam</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="5">
            <field>fin.trs.line.invnumber</field>
            <label>Factuurnr.</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="6">
            <field>fin.trs.line.valuesigned</field>
            <label>Bedrag</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="7">
            <field>fin.trs.line.openvaluesigned</field>
            <label>Openstaand bedrag</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="8">
            <field>fin.trs.line.matchstatus</field>
            <label>Betaalstatus</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="9">
            <field>fin.trs.line.matchdate</field>
            <label>Betaaldatum</label>
            <visible>true</visible>
            <ask>false</ask>
            <operator>none</operator>
            <from></from>
            <to></to>
            <finderparam></finderparam>
          </column>
          <column id="10">
            <field>fin.trs.head.office</field>
            <label>Administratie</label>
            <visible>true</visible>
            <ask>true</ask>
            <operator>equal</operator>
            <from>NLA002674</from>
            <to></to>
            <finderparam></finderparam>
          </column>
            <column id="11">
              <field>fin.trs.head.code</field>
              <label>Code</label>
              <visible>true</visible>
              <ask>true</ask>
              <operator>equal</operator>
              <from></from>
              <to></to>
              <finderparam></finderparam>
            </column>
          </columns>
        `)
      .end({ pretty: true });
    const soapXmlString = soapEnvelope.toString({ pretty: true });


    const axiosConfig = {
      headers: {
        'Content-Type': 'text/xml',
      },
    };
    // Make the Axios POST request
    let invoice_data = await axios.post(appconfig.apiQueueInfo.twinfield_cluster_base_url + '/webservices/processxml.asmx?wsdl', soapXmlString, axiosConfig)
      .then(response => {
        // Handle the response
        const parser = new xml2js.Parser();
        return parser.parseStringPromise(response.data);
      })
      .then(parsedData => {
        const soapEnvelope = parsedData['soap:Envelope'];
        const soapBody = soapEnvelope['soap:Body'];
        const processXmlStringResponse = soapBody[0].ProcessXmlStringResponse;
        const processXmlStringResult = processXmlStringResponse[0].ProcessXmlStringResult[0];
        const parser_inner = new xml2js.Parser({ explicitArray: false });
        return parser_inner.parseStringPromise(processXmlStringResult);
      })
      .then(innerParsedData => {
        const browseResult = innerParsedData.browse;
        const resultInfo = browseResult['$'];
        const columnHeaders = browseResult.th.td; // Assuming td contains column headers
        const rowData = browseResult.tr;
        const invoiceData = {};
        for (const row of rowData) {
          const invNumber = row.td[3]._;
          if (!invoiceData[invNumber]) {
            invoiceData[invNumber] = [];
          }
          const invoiceDetails = {
            "number": row.td[0]._,
            "dim2": row.td[1]._,
            "dim2name": row.td[2]._,
            "invnumber": row.td[3]._,
            "valuesigned": row.td[4]._,
            "openvaluesigned": row.td[5]._,
            "matchstatus": row.td[6]._,
            "matchdate": row.td[7]._,
            "office": row.td[8]._,
            "code": row.td[9]._
          };
          invoiceData[invNumber].push(invoiceDetails);
        }
        return invoiceData;
      })
      .catch(error => {
        // Handle the error
        return false;
      });
    if (invoice_data) {

      for (const invoiceNumber in invoice_data) {
        if (invoiceNumber && invoiceNumber !== 'undefined') {
          const is_info = await db.invoice.findOne({
            where: {
              twinfield_id: invoiceNumber
            },
          });
          if (is_info) {
            const transactions = invoice_data[invoiceNumber];
            const invoicePayments = [];
            for (const transaction of transactions) {
              exect_last_transaction = transaction.number;
              if (is_info.twinfield_id !== transaction.number) {
                const is_check_invoice_payment = await db.invoice_payment.findOne({
                  where: {
                    twinfield_id: transaction.number
                  },
                });
                if (!is_check_invoice_payment) {
                  // console.log(`Transaction Number: ${transaction.number}`);
                  // console.log(`Valuesigned: ${transaction.valuesigned}`);
                  const payment = {
                    invoice_id: invoice.invoiceId,
                    project_id: invoice.amount,
                    payment_link_id: invoice.paymentDate,
                    amount: valuesigned,
                    status: 1,
                    type: 4,
                    twinfield_id: transaction.number
                  };
                  invoicePayments.push(payment);
                }
              }
            }
            if (invoicePayments.length > 0) {
              const t = await db.sequelize.transaction();

              try {
                await db.invoice_payment.bulkCreate(invoicePayments, { transaction: t });
                await t.commit();

                const last_trans = await db.transaction_last_info.findByPk(data.id);
                last_trans.update({ 'transaction_id': exect_last_transaction })

              } catch (error) {
                await t.rollback();
                console.error('Transaction failed:', error);
              }
            }

          }

        }

      }

    }

  }





  //change date formate
  changeDateFormate(givenDate, type = 0) {
    const originalDate = new Date(givenDate);
    const year = originalDate.getFullYear();
    const month = String(originalDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(originalDate.getDate()).padStart(2, '0');
    if (type == 1) {
      return `${year}/${month}`;
    } else {
      return `${year}${month}${day}`;
    }
  }

}


const twinfieldConsumerObj = new twinfieldConsumer();
module.exports = twinfieldConsumerObj;
