const db = require("../../models");
const auth = require('../../helper/auth');
const CatchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const appconfig = require("../../config/appconfig");
const APIFeatures = require("../../utils/apiFeature");
const jwt = require("jsonwebtoken");
const Users = db.users;
const auth_assignment_model = db.auth_assignment;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const { permission, user_roles } = require("../../constants/user");
const role_type = {};
permission.map((roles) => {
	role_type[roles.name] = roles.type;
})
user_roles.map((roles) => {
	role_type[roles.name] = roles.type;
})



exports.logout = CatchAsync(async (req, res, next) => {

	const token = req.cookies.access_token;

	const user_session = await db.user_session.findOne({
		where: {
			token
		}
	});
	if (!user_session)
		return next(new AppError(`No session found.`, 404));
	await user_session.destroy();
	res.status(200).json({
		status: true,
		message: "Logout successfull"
	})
})
exports.role = CatchAsync(async (req, res, next) => {
	const data = await db.auth_item.findAll({
		attributes: ["id", "name", "description"],
		where: {
			type: 1
		},
		order: [["id", "DESC"]],
	});

	const output = {
		status: true,
		data: data
	};
	res.status(200).json(output);
})

exports.permission = CatchAsync(async (req, res, next) => {
	const data = await db.auth_item.findAll({
		attributes: ["id", "name", "description"],
		where: {
			type: 2
		},
		order: [["id", "DESC"]],
	});

	const output = {
		status: true,
		data: data
	};
	res.status(200).json(output);
})

exports.createRole = CatchAsync(async (req, res, next) => {
	const postData = req.body;
	const role = await db.auth_item.findOne({
		where: {
			name: postData.name
		},
	});
	if (role) {
		return next(new AppError(`Role already present`, 404));
	}
	await db.auth_item.create({
		name: postData.name,
		type: 1,
		description: postData.description,
	})
	const output = {
		status: true,
		data: "Role created successfully."
	};
	res.status(200).json(output);
})

exports.createPermision = CatchAsync(async (req, res, next) => {
	const postData = req.body;
	const role = await db.auth_item.findOne({
		where: {
			name: postData.name
		},
	});
	if (role) {
		return next(new AppError(`Role already present`, 404));
	}
	await db.auth_item.create({
		name: postData.name,
		type: 2,
		description: postData.description,
	})
	const output = {
		status: true,
		data: "Role created successfully."
	};
	res.status(200).json(output);
})


exports.updateRole = CatchAsync(async (req, res, next) => {
	const { id } = req.params;
	const postData = req.body;
	const role = await db.auth_item.findByPk(id);
	if (!role)
		return next(new AppError(`Role not found`, 404));

	await role.update({
		name: postData.name,
		description: postData.description
	})
	const output = {
		status: true,
		data: "Role updated successfully."
	};
	res.status(200).json(output);
})

exports.list = CatchAsync(async (req, res, next) => {
	const data = JSON.parse(JSON.stringify(await Users.findAll({
		attributes: [
			"id",
			"username",
			"email",
			"name",
			"type",
			"status",

		],
		include: [{
			model: auth_assignment_model,
			attributes: [["item_name", "role"]],
			as: "roles",
			where: {
				item_name: {
					[Op.ne]: "vendor"
				}
			},
			required: false
		}],
		where: {
			type: 1
		}

	})));

	data.map((user, key) => {
		if (user?.roles) {
			const userroles = [];
			user.roles.map((roles) => {
				userroles.push(roles.role);
			})
			data[key].roles = [...new Set(userroles)]
		}
	})
	//console.log(data);
	const output = {
		status: true,
		data: data
	};
	res.status(200).json(output);
})

exports.userlist = CatchAsync(async (req, res, next) => {


	res.status(200).json(output);
})

exports.vendorRole = CatchAsync(async (req, res, next) => {
	const data = await db.auth_item.findAll({
		attributes: ["id", "name", "description"],
		where: {
			type: 2
		}
	});
	const output = {
		status: true,
		data: data
	};
	res.status(200).json(output);
})

exports.updateUser = CatchAsync(async (req, res, next) => {

	var postData = req.body;
	const { id } = req.params;
	const user_roles = (postData?.user_roles) ? postData.user_roles : [];
	const User = await Users.findByPk(id);
	if (!User) return next(new AppError(`No data Found`, 404));
	const userData = (Users.setUserData(postData));
	//userData.type = 1;

	const dir = 'document/profile/';
	if (postData?.profile) {
		const imagescontent = await APIFeatures.copyImageToPrivate(postData.profile, db.image_temp, dir);
		userData.profile = imagescontent.url;
	} else {

		await User.setUserRoleAssignment(db, user_roles);
	}
	await User.update(userData);

	const output = {
		status: true,
		data: await buildQuery({ id: id }, {}),
		message: "User data updated successfully"
	}
	res.status(200).json(output);
})

exports.deactivate = CatchAsync(async (req, res, next) => {

	const { id } = req.params;

	const User = await Users.findByPk(id);
	if (!User) return next(new AppError(`No data Found`, 404));

	await User.update({ status: 2 });
	const output = {
		status: true,
		message: "User Deactivated successfully."
	}
	res.status(200).json(output);
})
exports.activate = CatchAsync(async (req, res, next) => {

	const { id } = req.params;

	const User = await Users.findByPk(id);
	if (!User) return next(new AppError(`No data Found`, 404));

	await User.update({ status: 1 });
	const output = {
		status: true,
		message: "User activated successfully."
	}
	res.status(200).json(output);
})

exports.update = CatchAsync(async (req, res, next) => {

	const postData = req.body;
	const id = req.userlogin.id; //req.params
	const user_roles = (postData?.user_roles) ? postData.user_roles : [];
	const User = await Users.findByPk(id);
	if (!User) return next(new AppError(`No data Found`, 404));
	const userData = (Users.setUserData(postData));
	//userData.type = 1;

	const dir = 'document/profile/';
	if (postData?.profile) {
		const imagescontent = await APIFeatures.copyImageToPrivate(postData.profile, db.image_temp, dir);
		userData.profile = imagescontent.url;
	} else {
		await User.setUserRoleAssignment(db, user_roles);
	}
	await User.update(userData);


	const output = {
		status: true,
		data: await buildQuery({ id: id }, {}),
		message: "User data updated successfully"
	}
	res.status(200).json(output);
})
exports.details = CatchAsync(async (req, res) => {
	const output = {};
	output['status'] = true;
	const { id } = req.params;
	let details = await buildQuery({ id: id }, {});

	output.data = details;
	res.status(200).json(output);
})


exports.delete = CatchAsync(async (req, res, next) => {
	const output = {};
	const { id } = req.params; //req.params
	output['status'] = true;


	var data = await Users.findByPk(id);

	if (!data) return next(new AppError(`No data Found`, 404));

	data.destroy();

	output['message'] = "Delete successfully.";
	res.status(200).json(output);
})
exports.changeUserPassword = CatchAsync(async (req, res, next) => {

	const { id } = req.params; //req.params
	var postData = req.body;
	var user = new Users;
	await user.changeUserPasswword(postData.change_password, id);

	eventEmitter.emit(eventContant.PASSWORD_RESET, id, Date.now());

	const output = {
		status: true,
		message: "Password change successfully.",
	};
	res.status(200).json(output);
})

exports.passwordChange = CatchAsync(async (req, res, next) => {
	const id = req.userlogin.id; //req.params
	var postData = req.body;
	var user = new Users;
	const checkvalidation = await user.changePasswword(postData.current_password, postData.change_password, id);
	//console.log(checkvalidation);
	if (checkvalidation['status'] != 200)
		return next(new AppError(checkvalidation['message'], 200))

	const output = {
		status: true,
		message: "Your password change successfully."
	}
	res.status(200).json(output);
})

exports.login = CatchAsync(async (req, res, next) => {
	let postdata = req.body;
	let user = new Users;
	user.user = postdata.username;
	user.pass = postdata.password;
	userlogin = await user.login();
	if (!userlogin)
		return next(new AppError(`Unauthorised username and password is wrong.`, 200));

	if (userlogin.type != 1)
		return next(new AppError(`Unauthorised username and password is wrong.`, 200));

	const token = jwt.sign({ username: userlogin.username }, "keydata");

	await res.cookie('access_token', token, { maxAge: 10000 * 24 * 3000 * 30, httpOnly: true, secure: (process.env['NODE_ENV'] == "prod") });
	const output = {
		status: true,
		message: "Sucessfully Login."
	}
	res.status(200).json(output);
})


exports.resetPassword = CatchAsync(async (req, res, next) => {
	let postdata = req.body;

	const users = await db.users.findOne({
		where: {
			email: postdata.email
		}
	});
	if (!users) return next(new AppError(`Account Not found`, 404));

	const token = jwt.sign({ email: postdata.email }, appconfig.get.privateKey,
		{
			expiresIn: appconfig.get.clientTokenDuration
		}
	);
	//console.log(token);
	eventEmitter.emit(eventContant.FORGET_PASSWORD, { users, token }, Date.now());

	const output = {
		status: true,
		message: "Password recovery email has been sent to your email."
	}
	res.status(200).json(output);
})

exports.verifyToken = CatchAsync(async (req, res, next) => {
	let postdata = req.body;
	let data
	data = await auth.verifyAccessToken(postdata.token);

	if (!data) return next(new AppError(`Token expired`, 404));
	const users = await db.users.findOne({
		where: {
			email: data.email
		}
	});
	if (!users) return next(new AppError(`Account Not found`, 404));

	eventEmitter.emit(eventContant.VERIFY_TOKEN, data, Date.now());

	const output = {
		status: true,
		data: {}
	}
	res.status(200).json(output);
})

exports.changePassword = CatchAsync(async (req, res, next) => {
	let postdata = req.body;
	let data
	data = await auth.verifyAccessToken(postdata.token);

	if (!data) return next(new AppError(`Token expired`, 404));
	const users = await db.users.findOne({
		where: {
			email: data.email
		}
	});
	if (!users) return next(new AppError(`Account Not found`, 404));

	const user = new Users;
	const checkvalidation = await user.passwordChange(postdata.change_password,
		users.id
	);


	if (checkvalidation['status'] != 200)
		return next(new AppError(checkvalidation['message'], 200))



	eventEmitter.emit(eventContant.CHANGE_PASSWORD, data, Date.now());

	const output = {
		status: true,
		message: "Password change successfully."
	}
	res.status(200).json(output);
})

exports.create = CatchAsync(async (req, res, next) => {
	var postData = req.body;
	password = await auth.generatePassword(postData.password);
	let userData = {
		name: postData.name,
		username: postData.username,
		email: postData.email,
		password: password,
		type: 1,
		status: 1,
	}
	// Upload profile
	const dir = 'document/profile/';
	if (postData?.profile) {
		const imagescontent = await APIFeatures.copyImageToPrivate(postData.profile, db.image_temp, dir);
		userData.profile = imagescontent.url;
	}
	const user = await Users.create(userData);
	const user_roles = (postData?.user_roles) ? postData.user_roles : [];
	await user.setUserRoleAssignment(db, user_roles);


	const user_details = await Users.findByPk(user.id);
	eventEmitter.emit(eventContant.UPDATE_HUBSPOT_DEAL_OWNER, user_details, Date.now());

	const output = {
		status: true,
		message: "User Registered Successfully",
		data: user_details
	}
	res.status(201).json(output);
})


exports.testevent = CatchAsync(async (req, res, next) => {
	console.log('Inside test controller')

	// emailEmitter.emit("TESTEVENT", {
	// 	name: 'Qasim',
	// 	age: 33
	// })
	//	new Email('qasim', 'https://google.com').sendWelcome()
	res.status(200).json({
		status: true,
		data: {
			message: "Event Called"
		}
	})
})


exports.search = CatchAsync(async (req, res, next) => {

	let { q = null } = req.query;

	const query = {
		attributes: ["id", "username"],
		raw: true
	}

	if (q && q.length > 1) {
		query.where = {
			username: { [Op.iLike]: `%${q}%` }
		}
	}
	const output = {
		status: true,
		data: await Users.findAll(query)
	};
	res.status(200).json(output);
})

exports.searchWithRole = CatchAsync(async (req, res, next) => {

	let { q = null } = req.query;
	const { role_id } = req.params;
	const query = {
		attributes: ["id", "username"],
		limit: 10,
		raw: true
	}
	query.where = {
		status: [0, 1]
	};
	if (q && q.length > 1) {
		query.where = {
			username: { [Op.iLike]: `%${q}%` }
		}
	}
	query.where.type = role_id
	const output = {
		status: true,
		data: await Users.findAll(query)
	};
	res.status(200).json(output);
})


exports.searchWithRoleAuth = CatchAsync(async (req, res, next) => {


	let { q = null, item_name } = req.query;
	let includeWhere = {};
	if (item_name) {
		includeWhere = { item_name: item_name };
	}
	const query = {
		distinct: true,
		attributes: ["id", "name"],
		include: [
			{
				attributes: ["id"],
				model: db.auth_assignment,
				where: includeWhere,
				required: true,
				//	raw: true
			}],
		//raw: true
	}

	if (q && q.length > 1) {
		query.where = {
			username: {
				[Op.iLike]: `%${q}%`,
				//[Op.or]:Sequelize.literal(`(CAST("projects"."id" AS TEXT) ILIKE '%${postdata.search}%')`),

			}
		}
	}
	const output = {
		status: true,
		data: await Users.findAll(query)
	};
	res.status(200).json(output);
})