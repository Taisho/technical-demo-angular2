const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
//const filesystem = require(path.resolve('filesystem'));

/**
 * IMPORTANT: In order to use this library you need to use this idiom (Look at cli/price-collector.js for an example):
  filesystem.ensureExists(filesystem.appDir, function () {
    db.initDb(filesystem.appDir, filesystem.dataDir);
  })
 */

let dbHandler;

function initDb(appDirectory, dataDirectory)
{
    const dbHandlerFile = dataDirectory+path.sep+'database.db';

    dbHandler = new sqlite3.Database(dbHandlerFile);
    module.exports.dbHandler = dbHandler;

    dbHandler.on('trace', query => {
        if(query.match(/idiom/))
            console.log(query);
    })

        dbHandler.serialize(function () {
            let queries = fs.readFileSync(dataDirectory+path.sep+"database.sql", 'utf8');
            const queryArray = queries.toString().split(');');

            queryArray.map((query, i) => {
                if(query == null || query == "" || /^\s*$/.test(query))
                    return;

                query += ');';
                dbHandler.run(query);
            })
        });

        // dbHandler.close();
}

module.exports.initDb = initDb;

/**
 *
 * @param tableName
 * @param options
 *              columns: [],
 *              orderBy: [{column, sortDirection}],
 *              limit: integer,
 *              offset: integer,
 *
 * @returns {string}
 */
module.exports.buildQueryFromOptions = function (tableName, options) {
    let query;

    if(options == null) {
        query = "SELECT * FROM "+tableName+" WHERE 1";
    }
    else if(!(options instanceof Map)) {
        throw "buildQueryFromOptions: options is not instance of Map"
    }
    else {

        query = "SELECT ";
        // if(options.get("columns") == null || options.get("columns").length == 0) {
            query += "* ";
        // }

        query += "FROM "+tableName+" ";

        if(options.get("limit") != null) {
            query += "LIMIT " + options.get("limit")
        }

        if(options.get("offset") != null) {
            query += "OFFSET " + options.get("offset")
        }

        // if(options.)

    }

    return query;
}
