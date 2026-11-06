import Organization from '../models/Organization.js';

/**
 * Checks an organization for possible duplicate or suspicious listing information.
 * Returns an array of warning flags for administrative manual review.
 * @param {Object} orgData - Submitted organization data
 * @param {string|ObjectId} currentOrgId - Optional current organization ID to exclude self
 * @returns {Promise<string[]>} List of warning flag messages
 */
export const detectDuplicateFlags = async (orgData, currentOrgId = null) => {
  const flags = [];

  const queryBase = currentOrgId ? { _id: { $ne: currentOrgId } } : {};

  // 1. Check duplicate registration number
  if (orgData.registrationNumber && orgData.registrationNumber.trim()) {
    const regNum = orgData.registrationNumber.trim().toUpperCase();
    const existingWithReg = await Organization.findOne({
      ...queryBase,
      registrationNumber: { $regex: new RegExp(`^${regNum}$`, 'i') }
    });
    if (existingWithReg) {
      flags.push(
        `Possible duplicate registration number detected. Matches '${existingWithReg.name}' (Reg: ${existingWithReg.registrationNumber}).`
      );
    }
  }

  // 2. Check duplicate contact phone
  if (orgData.phone && orgData.phone.trim()) {
    const cleanPhone = orgData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 7) {
      const existingWithPhone = await Organization.findOne({
        ...queryBase,
        phone: { $regex: cleanPhone }
      });
      if (existingWithPhone) {
        flags.push(
          `Contact number is also associated with another organization: '${existingWithPhone.name}'.`
        );
      }
    }
  }

  // 3. Check duplicate email
  if (orgData.email && orgData.email.trim()) {
    const cleanEmail = orgData.email.trim().toLowerCase();
    const existingWithEmail = await Organization.findOne({
      ...queryBase,
      email: cleanEmail
    });
    if (existingWithEmail) {
      flags.push(
        `Organization email is also associated with another organization: '${existingWithEmail.name}'.`
      );
    }
  }

  // 4. Check very similar organization name
  if (orgData.name && orgData.name.trim()) {
    const cleanName = orgData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const allOtherOrgs = await Organization.find(queryBase).select('name');
    for (const other of allOtherOrgs) {
      const otherClean = other.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanName === otherClean || (cleanName.length > 5 && (cleanName.includes(otherClean) || otherClean.includes(cleanName)))) {
        flags.push(
          `Organization name closely resembles existing organization '${other.name}'.`
        );
        break;
      }
    }
  }

  // 5. Check same address
  if (orgData.address && orgData.address.trim() && orgData.city && orgData.city.trim()) {
    const cleanAddress = orgData.address.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCity = orgData.city.trim().toLowerCase();
    const sameCityOrgs = await Organization.find({
      ...queryBase,
      city: { $regex: new RegExp(`^${cleanCity}$`, 'i') }
    }).select('name address');

    for (const other of sameCityOrgs) {
      const otherAddr = other.address.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanAddress.length > 8 && (cleanAddress === otherAddr || cleanAddress.includes(otherAddr) || otherAddr.includes(cleanAddress))) {
        flags.push(
          `Physical address closely matches another organization in ${orgData.city}: '${other.name}'.`
        );
        break;
      }
    }
  }

  // 6. Check missing required information
  if (!orgData.documents || orgData.documents.length === 0) {
    flags.push('No supporting verification documents uploaded yet.');
  }

  return flags;
};
