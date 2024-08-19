const db = require("../models");
const Sequelize = require("sequelize");
const model = db.hubspot_req;
const contact=db.contacts;
const project= db.project;
const winston = require('winston');

const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'hubspot_error.log' }),
    ],
  });


module.exports = {
    async updateContactInfo(id,hubspot_id){
        try {
            const contact_model = await contact.findByPk(id);
            await contact_model.update({'hubspot_id':hubspot_id});
          } catch (error) {
             logger.error(`Error in update contact primary id: ${id}`, { hubspot_id, error });
          }
           
    }
};

module.exports ={
  async updateproject(id,hubspot_id){
    try {
        const project = await project.findByPk(id);
        await project.update({'hubspot_id':hubspot_id});
      } catch (error) {
         logger.error(`Error in update project primary id: ${id}`, { hubspot_id, error });
      }
       
}
};