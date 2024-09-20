const axios = require("axios");

exports.getBase64Image = async (img) => {
    try {
        const image = await axios.get(img, { responseType: 'arraybuffer' });
        const returnedB64 = Buffer.from(image.data).toString('base64');
        return returnedB64;
    }
    catch (error) {
        /**
         * Todo: Return default image
         */
        return Buffer.from("").toString('base64');
    }
}
exports.convertToERPcurrency = (val, currency) => {
    return (Math.round(val * currency * 1000)) / 1000; // 1.323 * 
}

exports.convertFromERPcurrency = (val, currency) => {
    return (Math.round(val * 1000 / currency)) / 1000;
}
exports.CombinCompareData = (data1, data2) => {
    let year1data = {};
    let year2data = {};
    data1.map((value) => {
        year1data[value.dataValues.month] = value.dataValues.sum
    })
    data2.map((value) => {
        year2data[value.dataValues.month] = value.dataValues.sum
    })

    const builddata = []
    for (let month = 1; month <= 12; month++) {
        // builddata[month] = {};
        builddata.push({
            month,
            data1: year1data?.[month] ?? 0,
            data2: year2data?.[month] ?? 0,

        });

    }
    return builddata;
}
exports.CombinCompareDataCount = (data1, data2) => {
    let year1data = {};
    let year2data = {};
    data1.map((value) => {
        year1data[value.dataValues.month] = value.dataValues.count
    })
    data2.map((value) => {
        year2data[value.dataValues.month] = value.dataValues.count
    })

    const builddata = []
    for (let month = 1; month <= 12; month++) {
        //  builddata[month] = {};
        builddata.push({
            month,
            data1: year1data?.[month] ?? 0,
            data2: year2data?.[month] ?? 0,

        });
    }
    return builddata;
}

