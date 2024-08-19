const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const path = require('path');
const fs = require('fs-extra');
//const db = require("../models");
//const imageModel = db.image_temp;
class APIFeatures {

	constructor(postData = null, sortData = null,) {
		this.buildQuery = {};
		this.buildQuery.include = [];
		this.postdata = postData;
		this.sortData = sortData;
		this.distinct = true
	}
	addressFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		this.buildQuery.where = where;
		return this;

	}
	productFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		this.buildQuery.where = where;
		return this;
	}
	projectFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;
		if (postdata.search != undefined && postdata.search != "") {
			where = {
				[Op.or]: [
					{

						"$customer.company$": {
							[Op.iLike]: `%${postdata.search}%`
						}
					},


				]
			};
		}



		this.buildQuery.where = where;
		return this;
	}
	userFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		this.buildQuery.where = where;
		return this;

	}


	contactFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		if (postdata.email != undefined && postdata.email != "")
			where.email = { [Op.iLike]: `%${postdata.email}%` };

		if (postdata.first_name != undefined && postdata.first_name != "")
			where.first_name = { [Op.iLike]: `%${postdata.first_name}%` };

		if (postdata.last_name != undefined && postdata.last_name != "")
			where.last_name = { [Op.iLike]: `%${postdata.last_name}%` };

		if (postdata.phone_number != undefined && postdata.phone_number != "")
			where.phone_number = { [Op.iLike]: `%${postdata.phone_number}%` };

		if (postdata.mobile_number != undefined && postdata.mobile_number != "")
			where.mobile_number = { [Op.iLike]: `%${postdata.mobile_number}%` };

		if (postdata.country_id != undefined && postdata.country_id != "")
			where.country_id = postdata.country_id;

		if (postdata.language_id != undefined && postdata.language_id != "")
			where.language_id = postdata.language_id;

		if (postdata.gender_id != undefined && postdata.gender_id != "")
			where.gender = postdata.gender_id;

		if (postdata.role_id != undefined && postdata.role_id != "")
			where.role = postdata.role_id;


		if (postdata.search != undefined && postdata.search != "") {
			where = {
				[Op.or]: [
					Sequelize.literal(`(concat("first_name", ' ', "last_name") ILIKE '%${postdata.search}%')`),

					/* 
					Sequelize.fn('concat', Sequelize.col('first_name'), ' ', Sequelize.col('last_name')), {
						[Op.iLike]:`%${postdata.search}%`
					}, 
					*/
					{
						"first_name": {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{
						"last_name": {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{
						"email": {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{
						"phone_number": {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{

						"$customer.company$": {
							[Op.iLike]: `%${postdata.search}%`
						}
					},


				]
			};
		}
		this.buildQuery.where = where;
		return this;

	}
	customerFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		if (postdata.company != undefined && postdata.company != "")
			where.company = { [Op.iLike]: `%${postdata.company}%` };

		if (postdata.contact_number != undefined && postdata.contact_number != "")
			where.contact_number = { [Op.iLike]: `%${postdata.contact_number}%` };

		if (postdata.email != undefined && postdata.email != "")
			where.email = { [Op.iLike]: `%${postdata.email}%` };

		if (postdata.website != undefined && postdata.website != "")
			where.website = { [Op.iLike]: `%${postdata.website}%` };

		if (postdata.vat_number != undefined && postdata.vat_number != "")
			where.vat_number = { [Op.iLike]: `%${postdata.vat_number}%` };

		if (postdata.country_id != undefined && postdata.country_id != "")
			where.country_id = postdata.country_id;

		if (postdata.language_id != undefined && postdata.language_id != "")
			where.language_id = postdata.language_id;


		if (postdata.entity_id != undefined && postdata.entity_id != "")
			where.entity_id = postdata.entity_id;

		if (postdata.currency_id != undefined && postdata.currency_id != "")
			where.currency_id = postdata.currency_id;

		if (postdata.bad_payment_history != undefined && postdata.bad_payment_history != "")
			where.bad_payment_history = postdata.bad_payment_history;


		if (postdata.industry_id != undefined && postdata.industry_id != "")
			where.industry = postdata.industry_id;

		if (postdata.invoice_type_id != undefined && postdata.invoice_type_id != "")
			where.invoice_type = postdata.invoice_type_id;

		if (postdata.payment_term_id != undefined && postdata.payment_term_id != "")
			where.payment_term = postdata.payment_term_id;

		if (postdata.search != undefined && postdata.search != "") {
			// where = {}
			where = {
				[Op.or]: [
					//Sequelize.literal(`(CAST("projects"."id" AS TEXT) ILIKE '%${postdata.search}%')`),
					{
						contact_number: {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{
						email: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
					{
						company: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
					{
						website: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
				]
			};
			// where.search = postdata.search;
		}




		this.buildQuery.where = where;
		return this;

	}
	vendorFilter() {
		let postdata = { ...this.postdata };
		let where = {};
		if (postdata.id != undefined && postdata.id != "")
			where.id = postdata.id;

		if (postdata.company != undefined && postdata.company != "")
			where.company = { [Op.iLike]: `%${postdata.company}%` };

		if (postdata.contact_number != undefined && postdata.contact_number != "")
			where.contact_number = { [Op.iLike]: `%${postdata.contact_number}%` };

		if (postdata.email != undefined && postdata.email != "")
			where.email = { [Op.iLike]: `%${postdata.email}%` };

		if (postdata.website != undefined && postdata.website != "")
			where.website = { [Op.iLike]: `%${postdata.website}%` };

		if (postdata.vat_number != undefined && postdata.vat_number != "")
			where.vat_number = { [Op.iLike]: `%${postdata.vat_number}%` };

		if (postdata.country_id != undefined && postdata.country_id != "")
			where.country_id = postdata.country_id;

		if (postdata.language_id != undefined && postdata.language_id != "")
			where.language_id = postdata.language_id;


		if (postdata.entity_id != undefined && postdata.entity_id != "")
			where.entity_id = postdata.entity_id;

		if (postdata.currency_id != undefined && postdata.currency_id != "")
			where.currency_id = postdata.currency_id;

		if (postdata.bad_payment_history != undefined && postdata.bad_payment_history != "")
			where.bad_payment_history = postdata.bad_payment_history;


		if (postdata.industry_id != undefined && postdata.industry_id != "")
			where.industry = postdata.industry_id;

		if (postdata.invoice_type_id != undefined && postdata.invoice_type_id != "")
			where.invoice_type = postdata.invoice_type_id;

		if (postdata.payment_term_id != undefined && postdata.payment_term_id != "")
			where.payment_term = postdata.payment_term_id;

		if (postdata.search != undefined && postdata.search != "") {
			// where = {}
			where = {
				[Op.or]: [
					//	Sequelize.literal(`(CAST("projects"."id" AS TEXT) ILIKE '%${postdata.search}%')`),
					{
						phone_number: {
							[Op.iLike]: `%${postdata.search}%`
						},
					},
					{
						email: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
					{
						company: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
					{
						website: {
							[Op.iLike]: `%${postdata.search}%`
						}
					},
				]
			};
			// where.search = postdata.search;
		}

		this.buildQuery.where = where;
		return this;

	}
	limit() {
		let sortData = { ...this.sortData };

		let offset = (sortData.page) ?? 1;
		offset--;
		let limit = (sortData.limit) ?? 10;

		this.buildQuery.offset = offset * limit;
		this.buildQuery.limit = limit;
		return this;
	}
	sort() {
		if (this.buildQuery.order != undefined && (this.buildQuery.order).length) return this;

		let sortData = { ...this.sortData };
		let sortBy = (sortData.sortBy != undefined && sortData.sortBy != "") ? sortData.sortBy : "id";
		let sortType = (sortData.sortType != undefined && (sortData.sortType == "ASC" || sortData.sortType == "DESC")) ? sortData.sortType : "DESC";

		this.buildQuery.order = [
			[sortBy, sortType],
		];
		return this;
	}
	raw() {
		this.buildQuery.raw = true;
		//	this.buildQuery.nest = true;
		return this;
	}
	attributes(param) {
	
		this.buildQuery.attributes = param;
		return this;
	}
	log() {
		
		this.buildQuery.subQuery = false;
		//this.buildQuery.distinct =true;
		//this.buildQuery.group =[`"customer"."id"`];
		return this;
	}
	include({ sort = null, joinModel = {}, alias = null, where = null, attributes = {}, joinNotRequired = null, includes = {} }) {

		if (joinNotRequired) return this;

		let sortData = { ...this.sortData };
		let sortBy = (sortData.sortBy != undefined && sortData.sortBy != "") ? sortData.sortBy : "id";
		let sortType = (sortData.sortType != undefined && (sortData.sortType == "ASC" || sortData.sortType == "DESC")) ? sortData.sortType : "DESC";

		let currentJoin = { model: joinModel };

		if (where) {
			currentJoin.where = where;
		}
		if (attributes) {
			currentJoin.attributes = attributes;
		}
		if (alias) {
			currentJoin.as = alias;
		}
		currentJoin.required = false;
		currentJoin.subQuery = false;

		if (sort) {
			let joinObj = {};
			joinObj.model = joinModel;

			if (alias) joinObj.as = alias;

			let orderby = [joinObj, sortBy, sortType] // change your column name like (id and created_at)

			this.buildQuery.order = [
				orderby
			];
		}
		if (includes.includemodel != undefined) {
			currentJoin.include = { model: includes.includemodel, attributes: includes.attributes }
			//	currentJoin.include.attributes=[includes.attributes]
		}
		this.buildQuery.include.push(currentJoin);
		return this;

	}
	static removeEmptyKey(data) {
		let relationDataCorrect = {};
		Object.keys(data).forEach(val => {
			const newVal = data[val];
			relationDataCorrect = newVal ? { ...relationDataCorrect, [val]: newVal } : relationDataCorrect;
		});
		return (relationDataCorrect);
	}
	static async copyImageToPublic(id, imageModel, foldername) {
		const image = await imageModel.findByPk(id);
		if (image) {
			const oldPath = image.url;
			const fileName = path.basename(oldPath);
			const newPath = foldername + "/" + fileName;
			await fs.copy(oldPath, "document/" + Date.now() + "_" + newPath);
			return process.env.uploadVersion + "/" + newPath;
		}
	}
	static async copyImageToPrivate(id, imageModel, foldername) {
		const image = await imageModel.findByPk(id);
		await fs.mkdir(foldername, { recursive: true })
		if (image) {
			const oldPath = image.url;
			const fileName = Date.now()+path.basename(oldPath);
			const newPath = foldername + "/" + fileName;
			await fs.copy(oldPath, newPath);
			return { url: fileName, name: image.name };
		}
	}
}
module.exports = APIFeatures