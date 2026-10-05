const Company = require("../models/companyModel");

async function getDocumentCompany(userId) {
  const company = await Company.findOne({ userId });
  const requiredFields = [
    company?.companyName,
    company?.siret,
    company?.email,
    company?.address,
    company?.city
  ];

  return requiredFields.every(value => String(value || "").trim()) ? company : null;
}

module.exports = { getDocumentCompany };
