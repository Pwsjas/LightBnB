const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');
const res = require('express/lib/response');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then((result) => {
      if (result.rows){
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then((result) => {
      if (result.rows){
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => {
      if (result.rows){
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`SELECT reservations.*, properties.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.title, properties.cost_per_night, properties.id
    ORDER BY start_date
    LIMIT $2;`, [guest_id, limit])
    .then((result) => {
      if (result.rows){
        console.log(result.rows)
        return result.rows;
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
    const queryParams = [];
    let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_reviews.property_id
    `;

    /*WHERE CLAUSES*/
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }
    if (options.minimum_price_per_night) {
      if (queryParams.length > 0) {
        queryParams.push(`${options.minimum_price_per_night}`);
        queryString += `AND cost_per_night >= $${queryParams.length} `
      } else {
        queryParams.push(`${options.minimum_price_per_night}`);
        queryString += `WHERE cost_per_night >= $${queryParams.length} `
      }
    }
    if (options.maximum_price_per_night) {
      if (queryParams.length > 0) {
        queryParams.push(`${options.maximum_price_per_night}`);
        queryString += `AND cost_per_night <= $${queryParams.length} `
      } else {
        queryParams.push(`${options.maximum_price_per_night}`);
        queryString += `WHERE cost_per_night <= $${queryParams.length} `
      }
    }
    if(options.minimum_rating) {
      if (queryParams.length > 0) {
        queryParams.push(`${options.minimum_rating}`);
        queryString += `AND rating >= $${queryParams.length} `
      } else {
        queryParams.push(`${options.minimum_rating}`);
        queryString += `WHERE rating >= $${queryParams.length} `
      }
    }
    if(options.owner_id) {
      if (queryParams.length > 0) {
        queryParams.push(`${options.owner_id}`);
        queryString += `AND owner_id = $${queryParams.length} `
      } else {
        queryParams.push(`${options.owner_id}`);
        queryString += `WHERE owner_id = $${queryParams.length} `
      }
    }

    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

    console.log(queryString, queryParams);
    return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;





/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($14, $1, $2, $7, $8, $6, $9, $11, $12, $13, $10, $3, $4, $5) RETURNING *;
  `;
  const queryParams = [];
  for (const key in property) {
    queryParams.push(property[key]);
  }
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      if (result.rows){
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addProperty = addProperty;
