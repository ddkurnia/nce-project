/**
 * Validator Utility
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides server-side validation functions for all major data models.
 * Each function returns { isValid: boolean, errors: { fieldName: message } }.
 *
 * @module utils/validator
 */

// ---------------------------------------------------------------------------
// Constants – Enums & Limits
// ---------------------------------------------------------------------------

const COMMODITY_TYPES = [
  'spice',
  'grain',
  'coffee',
  'tea',
  'palm-oil',
  'rubber',
  'cocoa',
  'pepper',
  'rice',
  'sugar',
  'tobacco',
  'copra',
  'cinnamon',
  'clove',
  'nutmeg',
  'other',
];

const PROPERTY_TYPES = [
  'warehouse',
  'farmland',
  'processing',
  'cold-storage',
  'drying-facility',
  'trading-office',
  'plantation',
  'other',
];

const USER_ROLES = ['admin', 'seller', 'buyer', 'exporter'];

const BUY_REQUEST_STATUSES = ['open', 'in-progress', 'closed', 'fulfilled', 'cancelled'];

const OFFER_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];

const COMMODITY_UNITS = ['kg', 'ton', 'quintal', 'gram', 'liter', 'sack', 'crate', 'bundle'];

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Create a validation result object.
 *
 * @param {boolean} isValid - Whether validation passed
 * @param {object} errors  - Field-to-error mapping
 * @returns {{ isValid: boolean, errors: object }}
 */
function result(isValid, errors = {}) {
  return { isValid, errors };
}

/**
 * Check if a value is a non-empty string after trimming.
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid positive number.
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isPositiveNumber(value) {
  const num = Number(value);
  return typeof value !== 'boolean' && !Number.isNaN(num) && num > 0;
}

/**
 * Check if a value is a valid non-negative number.
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isNonNegativeNumber(value) {
  const num = Number(value);
  return typeof value !== 'boolean' && !Number.isNaN(num) && num >= 0;
}

/**
 * Validate an email address format.
 *
 * @param {string} email - Email address to validate
 * @returns {string|null} Error message or null if valid
 */
function validateEmailFormat(email) {
  if (!isNonEmptyString(email)) {
    return 'Email is required';
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email.trim())) {
    return 'Invalid email format';
  }
  return null;
}

/**
 * Validate an Indonesian phone number format.
 *
 * @param {string} phone - Phone number to validate
 * @returns {string|null} Error message or null if valid
 */
function validatePhoneFormat(phone) {
  if (!isNonEmptyString(phone)) {
    return 'Phone number is required';
  }
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');
  const phoneRegex = /^(\+62|62|0)?8[1-9][0-9]{6,11}$/;
  if (!phoneRegex.test(cleaned)) {
    return 'Invalid Indonesian phone number format';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validate commodity creation data.
 * Required fields: name, type, price, volume, unit, location, description
 * Optional fields: images (array of URLs)
 *
 * @param {object} data - Commodity data to validate
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateCommodity(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Commodity data is required' });
  }

  // name
  if (!isNonEmptyString(data.name)) {
    errors.name = 'Commodity name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Commodity name must be at least 2 characters';
  } else if (data.name.trim().length > 200) {
    errors.name = 'Commodity name must not exceed 200 characters';
  }

  // type
  if (!isNonEmptyString(data.type)) {
    errors.type = 'Commodity type is required';
  } else if (!COMMODITY_TYPES.includes(data.type.trim().toLowerCase())) {
    errors.type = `Invalid commodity type. Must be one of: ${COMMODITY_TYPES.join(', ')}`;
  }

  // price
  if (data.price === undefined || data.price === null || data.price === '') {
    errors.price = 'Price is required';
  } else if (!isPositiveNumber(data.price)) {
    errors.price = 'Price must be a positive number';
  }

  // volume
  if (data.volume === undefined || data.volume === null || data.volume === '') {
    errors.volume = 'Volume is required';
  } else if (!isPositiveNumber(data.volume)) {
    errors.volume = 'Volume must be a positive number';
  }

  // unit
  if (!isNonEmptyString(data.unit)) {
    errors.unit = 'Unit is required';
  } else if (!COMMODITY_UNITS.includes(data.unit.trim().toLowerCase())) {
    errors.unit = `Invalid unit. Must be one of: ${COMMODITY_UNITS.join(', ')}`;
  }

  // location
  if (!isNonEmptyString(data.location)) {
    errors.location = 'Location is required';
  } else if (data.location.trim().length > 300) {
    errors.location = 'Location must not exceed 300 characters';
  }

  // description
  if (!isNonEmptyString(data.description)) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.trim().length > 5000) {
    errors.description = 'Description must not exceed 5000 characters';
  }

  // images (optional but must be an array if provided)
  if (data.images !== undefined && data.images !== null) {
    if (!Array.isArray(data.images)) {
      errors.images = 'Images must be an array';
    } else if (data.images.length > 10) {
      errors.images = 'Maximum 10 images allowed';
    } else {
      for (let i = 0; i < data.images.length; i++) {
        if (typeof data.images[i] !== 'string' || data.images[i].trim().length === 0) {
          errors.images = `Image at index ${i} must be a non-empty URL string`;
          break;
        }
      }
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

/**
 * Validate buy request creation data.
 * Required fields: commodityType, volume, targetPrice, deliveryLocation
 *
 * @param {object} data - Buy request data to validate
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateBuyRequest(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Buy request data is required' });
  }

  // commodityType
  if (!isNonEmptyString(data.commodityType)) {
    errors.commodityType = 'Commodity type is required';
  } else if (!COMMODITY_TYPES.includes(data.commodityType.trim().toLowerCase())) {
    errors.commodityType = `Invalid commodity type. Must be one of: ${COMMODITY_TYPES.join(', ')}`;
  }

  // volume
  if (data.volume === undefined || data.volume === null || data.volume === '') {
    errors.volume = 'Volume is required';
  } else if (!isPositiveNumber(data.volume)) {
    errors.volume = 'Volume must be a positive number';
  }

  // targetPrice
  if (data.targetPrice === undefined || data.targetPrice === null || data.targetPrice === '') {
    errors.targetPrice = 'Target price is required';
  } else if (!isPositiveNumber(data.targetPrice)) {
    errors.targetPrice = 'Target price must be a positive number';
  }

  // deliveryLocation
  if (!isNonEmptyString(data.deliveryLocation)) {
    errors.deliveryLocation = 'Delivery location is required';
  } else if (data.deliveryLocation.trim().length > 300) {
    errors.deliveryLocation = 'Delivery location must not exceed 300 characters';
  }

  // Optional fields – validate only if provided
  // title
  if (data.title !== undefined && data.title !== null) {
    if (!isNonEmptyString(data.title)) {
      errors.title = 'Title must be a non-empty string if provided';
    } else if (data.title.trim().length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
  }

  // description
  if (data.description !== undefined && data.description !== null) {
    if (!isNonEmptyString(data.description)) {
      errors.description = 'Description must be a non-empty string if provided';
    } else if (data.description.trim().length > 5000) {
      errors.description = 'Description must not exceed 5000 characters';
    }
  }

  // deadline
  if (data.deadline !== undefined && data.deadline !== null) {
    const deadlineDate = new Date(data.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      errors.deadline = 'Deadline must be a valid date';
    } else if (deadlineDate <= new Date()) {
      errors.deadline = 'Deadline must be a future date';
    }
  }

  // unit
  if (data.unit !== undefined && data.unit !== null) {
    if (!isNonEmptyString(data.unit)) {
      errors.unit = 'Unit must be a non-empty string if provided';
    } else if (!COMMODITY_UNITS.includes(data.unit.trim().toLowerCase())) {
      errors.unit = `Invalid unit. Must be one of: ${COMMODITY_UNITS.join(', ')}`;
    }
  }

  // status (only for updates)
  if (data.status !== undefined && data.status !== null) {
    if (!BUY_REQUEST_STATUSES.includes(data.status)) {
      errors.status = `Invalid status. Must be one of: ${BUY_REQUEST_STATUSES.join(', ')}`;
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

/**
 * Validate offer submission data.
 * Required fields: pricePerUnit, volume, deliveryTime
 *
 * @param {object} data - Offer data to validate
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateOffer(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Offer data is required' });
  }

  // pricePerUnit
  if (data.pricePerUnit === undefined || data.pricePerUnit === null || data.pricePerUnit === '') {
    errors.pricePerUnit = 'Price per unit is required';
  } else if (!isPositiveNumber(data.pricePerUnit)) {
    errors.pricePerUnit = 'Price per unit must be a positive number';
  }

  // volume
  if (data.volume === undefined || data.volume === null || data.volume === '') {
    errors.volume = 'Volume is required';
  } else if (!isPositiveNumber(data.volume)) {
    errors.volume = 'Volume must be a positive number';
  }

  // deliveryTime
  if (data.deliveryTime === undefined || data.deliveryTime === null || data.deliveryTime === '') {
    errors.deliveryTime = 'Delivery time is required';
  } else if (!isNonEmptyString(data.deliveryTime)) {
    errors.deliveryTime = 'Delivery time must be a non-empty string';
  } else if (data.deliveryTime.trim().length > 200) {
    errors.deliveryTime = 'Delivery time must not exceed 200 characters';
  }

  // Optional fields
  // message
  if (data.message !== undefined && data.message !== null) {
    if (typeof data.message !== 'string') {
      errors.message = 'Message must be a string';
    } else if (data.message.length > 2000) {
      errors.message = 'Message must not exceed 2000 characters';
    }
  }

  // deliveryDate
  if (data.deliveryDate !== undefined && data.deliveryDate !== null) {
    const deliveryDate = new Date(data.deliveryDate);
    if (Number.isNaN(deliveryDate.getTime())) {
      errors.deliveryDate = 'Delivery date must be a valid date';
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

/**
 * Validate property listing data.
 * Required fields: title, type, price, location, area, description
 *
 * @param {object} data - Property data to validate
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateProperty(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Property data is required' });
  }

  // title
  if (!isNonEmptyString(data.title)) {
    errors.title = 'Property title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Property title must be at least 3 characters';
  } else if (data.title.trim().length > 200) {
    errors.title = 'Property title must not exceed 200 characters';
  }

  // type
  if (!isNonEmptyString(data.type)) {
    errors.type = 'Property type is required';
  } else if (!PROPERTY_TYPES.includes(data.type.trim().toLowerCase())) {
    errors.type = `Invalid property type. Must be one of: ${PROPERTY_TYPES.join(', ')}`;
  }

  // price
  if (data.price === undefined || data.price === null || data.price === '') {
    errors.price = 'Price is required';
  } else if (!isNonNegativeNumber(data.price)) {
    errors.price = 'Price must be a non-negative number';
  }

  // location
  if (!isNonEmptyString(data.location)) {
    errors.location = 'Location is required';
  } else if (data.location.trim().length > 300) {
    errors.location = 'Location must not exceed 300 characters';
  }

  // area
  if (data.area === undefined || data.area === null || data.area === '') {
    errors.area = 'Area is required';
  } else if (!isPositiveNumber(data.area)) {
    errors.area = 'Area must be a positive number';
  }

  // description
  if (!isNonEmptyString(data.description)) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.trim().length > 5000) {
    errors.description = 'Description must not exceed 5000 characters';
  }

  // Optional fields
  // address
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'string') {
      errors.address = 'Address must be a string';
    } else if (data.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }
  }

  // features
  if (data.features !== undefined && data.features !== null) {
    if (!Array.isArray(data.features)) {
      errors.features = 'Features must be an array';
    } else if (data.features.length > 20) {
      errors.features = 'Maximum 20 features allowed';
    }
  }

  // images
  if (data.images !== undefined && data.images !== null) {
    if (!Array.isArray(data.images)) {
      errors.images = 'Images must be an array';
    } else if (data.images.length > 10) {
      errors.images = 'Maximum 10 images allowed';
    } else {
      for (let i = 0; i < data.images.length; i++) {
        if (typeof data.images[i] !== 'string' || data.images[i].trim().length === 0) {
          errors.images = `Image at index ${i} must be a non-empty URL string`;
          break;
        }
      }
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

/**
 * Validate user profile update data.
 * All fields are optional but at least one must be provided.
 * Allowed fields: companyName, phone, location, displayName, bio, photoURL, address, city, province
 *
 * @param {object} data - Profile update data
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateUserProfile(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Profile data is required' });
  }

  const allowedFields = ['companyName', 'phone', 'location', 'displayName', 'bio', 'photoURL', 'address', 'city', 'province'];
  const providedFields = Object.keys(data).filter((key) => data[key] !== undefined && data[key] !== null);

  if (providedFields.length === 0) {
    return result(false, { _general: 'At least one field must be provided for update' });
  }

  // Check for disallowed fields
  const invalidFields = providedFields.filter((key) => !allowedFields.includes(key));
  if (invalidFields.length > 0) {
    errors._general = `Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`;
    return result(false, errors);
  }

  // companyName
  if (data.companyName !== undefined && data.companyName !== null) {
    if (!isNonEmptyString(data.companyName)) {
      errors.companyName = 'Company name must be a non-empty string';
    } else if (data.companyName.trim().length > 200) {
      errors.companyName = 'Company name must not exceed 200 characters';
    }
  }

  // phone
  if (data.phone !== undefined && data.phone !== null) {
    const phoneError = validatePhoneFormat(data.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }
  }

  // location
  if (data.location !== undefined && data.location !== null) {
    if (!isNonEmptyString(data.location)) {
      errors.location = 'Location must be a non-empty string';
    } else if (data.location.trim().length > 300) {
      errors.location = 'Location must not exceed 300 characters';
    }
  }

  // displayName
  if (data.displayName !== undefined && data.displayName !== null) {
    if (!isNonEmptyString(data.displayName)) {
      errors.displayName = 'Display name must be a non-empty string';
    } else if (data.displayName.trim().length > 100) {
      errors.displayName = 'Display name must not exceed 100 characters';
    }
  }

  // bio
  if (data.bio !== undefined && data.bio !== null) {
    if (typeof data.bio !== 'string') {
      errors.bio = 'Bio must be a string';
    } else if (data.bio.length > 1000) {
      errors.bio = 'Bio must not exceed 1000 characters';
    }
  }

  // photoURL
  if (data.photoURL !== undefined && data.photoURL !== null) {
    if (!isNonEmptyString(data.photoURL)) {
      errors.photoURL = 'Photo URL must be a non-empty string';
    } else {
      try {
        new URL(data.photoURL);
      } catch {
        errors.photoURL = 'Photo URL must be a valid URL';
      }
    }
  }

  // address
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'string') {
      errors.address = 'Address must be a string';
    } else if (data.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }
  }

  // city
  if (data.city !== undefined && data.city !== null) {
    if (typeof data.city !== 'string') {
      errors.city = 'City must be a string';
    } else if (data.city.length > 100) {
      errors.city = 'City must not exceed 100 characters';
    }
  }

  // province
  if (data.province !== undefined && data.province !== null) {
    if (typeof data.province !== 'string') {
      errors.province = 'Province must be a string';
    } else if (data.province.length > 100) {
      errors.province = 'Province must not exceed 100 characters';
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

/**
 * Validate user registration data.
 * Required fields: email, password, companyName, phone, role
 *
 * @param {object} data - Registration data
 * @returns {{ isValid: boolean, errors: object }}
 */
export function validateRegistration(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return result(false, { _general: 'Registration data is required' });
  }

  // email
  const emailError = validateEmailFormat(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  // password
  if (!isNonEmptyString(data.password)) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (data.password.length > 128) {
    errors.password = 'Password must not exceed 128 characters';
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/[a-z]/.test(data.password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = 'Password must contain at least one digit';
  }

  // companyName
  if (!isNonEmptyString(data.companyName)) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.trim().length < 2) {
    errors.companyName = 'Company name must be at least 2 characters';
  } else if (data.companyName.trim().length > 200) {
    errors.companyName = 'Company name must not exceed 200 characters';
  }

  // phone
  const phoneError = validatePhoneFormat(data.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  // role
  if (!isNonEmptyString(data.role)) {
    errors.role = 'Role is required';
  } else if (!USER_ROLES.includes(data.role.trim().toLowerCase())) {
    errors.role = `Invalid role. Must be one of: ${USER_ROLES.join(', ')}`;
  }

  // Optional: displayName
  if (data.displayName !== undefined && data.displayName !== null) {
    if (!isNonEmptyString(data.displayName)) {
      errors.displayName = 'Display name must be a non-empty string if provided';
    } else if (data.displayName.trim().length > 100) {
      errors.displayName = 'Display name must not exceed 100 characters';
    }
  }

  return result(Object.keys(errors).length === 0, errors);
}

// ---------------------------------------------------------------------------
// Enum exports for reuse in other modules
// ---------------------------------------------------------------------------

export { COMMODITY_TYPES, PROPERTY_TYPES, USER_ROLES, BUY_REQUEST_STATUSES, OFFER_STATUSES, COMMODITY_UNITS };
