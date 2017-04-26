var _        = require('lodash');
var Promise  = require('es6-promise').Promise;
var fetch    = require('isomorphic-fetch');
var unixDate = require('./unix_date');


var endPoint = 'https://track.customer.io/api';

// Set on `init` 
var siteId;
var apiKey;
var authString;

module.exports = {

  /*
  * Initialize the customerio module, getting it ready for
  * doing stuff.
  */
  init: function (id, key) {
    siteId = id;
    apiKey = key;
    authString = 'Basic ' + new Buffer(siteId + ':' + apiKey).toString('base64');
  },

  /*
  * Identify a user in Customer.io, creating/updating them.
  * This method is designed to replicate the JavaScript SDK
  * almost exactly.
  * 
  * Auto-converts Date() objects to UNIX timestamp, kinda useful huh?
  */
  identify: function (properties) {
    return new Promise(function (resolve, reject) {
      // Default to object so we delegate to the error handlers below
      // without throwing a nasty error.
      properties = properties || {};

      // Check we've got the required parameters
      var required = ['id', 'email'];
      var missing = _.filter(required, function (key) {
        if (!properties[key]) {
          return true;
        } else {
          return false;
        }
      });
      if (missing.length) {
        return reject('The following parameters are required in `identify`: ' + missing.join(', '));
      }

      // Convert dates to UNIX timestamps & format
      var data = {};
      _.each(properties, function (value, key) {
        if (_.isDate(value)) {
          data[key] = unixDate(value);
        } else {
          data[key] = value;
        }
      });

      var url = endPoint + '/v1/customers/'+data.id;

      fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (!response) {
          reject({
            message: "No response received",
            url: url,
            data: data,
            options: options
          })
        } else if (response.status !== 200) {
          reject({
            code: response.status,
            body: response.json()
          })
        } else {
          resolve();
        }
      });


    }.bind(this));
  },

  /*
  * Delete a customer
  */
  remove: function (customerId) {
    return new Promise(function (resolve, reject) {

      if (!customerId) {
        return reject("Please provide a `customerId` in the first argument of `remove`.");
      }

      var url = endPoint + '/v1/customers/'+customerId;

      fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': authString
        }
      }).then(function (response) {
        if (!response) {
          reject({
            message: "No response received",
            url: url,
            options: options
          })
        } else if (response.status !== 200) {
          reject({
            code: response.status,
            body: response.json()
          })
        } else {
          resolve();
        }
      });


    });
  },

  /*
  * Track an event with Customer.io.
  */
  track: function (customerId, eventName, properties, type) {
    return new Promise(function (resolve, reject) {

      // Default blank object
      properties = properties || {};

      // Check we've got the required parameters
      if (!customerId) {
        return reject('Please provide a `customerId` in the first argument of `track`.');
      }
      if (!eventName) {
        return reject('Please provide an `eventName` in the second argument of `track`.');
      }
      
      // Create a data object
      var data = {
        name: eventName,
        data: properties
      };

      // Add an event type if included
      if (type) {
        data.type = type;
      }

      // Convert data to UNIX timestamps & format
      _.each(data.data, function (value, key) {
        if (_.isDate(value)) {
          data.data[key] = unixDate(value);
        }
      });

      var url = endPoint + '/v1/customers/'+customerId+'/events';

      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (!response) {
          reject({
            message: "No response received",
            url: url,
            data: data,
            options: options
          })
        } else if (response.status !== 200) {
          reject({
            code: response.status,
            body: response.json()
          })
        } else {
          resolve();
        }
      });

    }.bind(this));
  }

};
