require('dotenv').config();
const nano = require('nano');

const couchdbUrl = process.env.COUCHDB_URL || 'http://127.0.0.1:5984';
const couchdbUser = process.env.COUCHDB_USER || 'admin';
const couchdbPassword = process.env.COUCHDB_PASSWORD || 'password';

// Create CouchDB connection - force IPv4
const couch = nano(`http://${couchdbUser}:${couchdbPassword}@127.0.0.1:5984`);

// Database names
const DB_NAMES = {
  users: process.env.DB_USERS || 'users',
  events: process.env.DB_EVENTS || 'events',
  participants: process.env.DB_PARTICIPANTS || 'participants'
};

// Initialize databases
const initDatabases = async () => {
  try {
    for (const [key, dbName] of Object.entries(DB_NAMES)) {
      try {
        await couch.db.get(dbName);
        console.log(`Database '${dbName}' already exists`);
      } catch (error) {
        if (error.statusCode === 404) {
          await couch.db.create(dbName);
          console.log(`Database '${dbName}' created successfully`);
          
          // Create design documents with views
          if (key === 'participants') {
            const db = couch.use(dbName);
            await db.insert({
              _id: '_design/queries',
              views: {
                by_event: {
                  map: function(doc) {
                    if (doc.eventId) {
                      emit(doc.eventId, doc);
                    }
                  }.toString()
                },
                by_user: {
                  map: function(doc) {
                    if (doc.userId) {
                      emit(doc.userId, doc);
                    }
                  }.toString()
                }
              }
            });
            console.log(`Views created for '${dbName}'`);
          }
          
          if (key === 'events') {
            const db = couch.use(dbName);
            await db.insert({
              _id: '_design/queries',
              views: {
                by_creator: {
                  map: function(doc) {
                    if (doc.creatorId) {
                      emit(doc.creatorId, doc);
                    }
                  }.toString()
                },
                by_date: {
                  map: function(doc) {
                    if (doc.date) {
                      emit(doc.date, doc);
                    }
                  }.toString()
                }
              }
            });
            console.log(`Views created for '${dbName}'`);
          }
          
          if (key === 'users') {
            const db = couch.use(dbName);
            await db.insert({
              _id: '_design/queries',
              views: {
                by_email: {
                  map: function(doc) {
                    if (doc.email) {
                      emit(doc.email, doc);
                    }
                  }.toString()
                }
              }
            });
            console.log(`Views created for '${dbName}'`);
          }
        } else {
          throw error;
        }
      }
    }
    console.log('All databases initialized successfully');
  } catch (error) {
    console.error('Error initializing databases:', error);
    throw error;
  }
};

// Get database instance
const getDB = (dbName) => {
  return couch.use(DB_NAMES[dbName]);
};

module.exports = {
  couch,
  DB_NAMES,
  initDatabases,
  getDB
};
