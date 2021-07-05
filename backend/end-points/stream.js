const db = require('../database');
const { HourlyPrice } = require('../model/HourlyPrice');

module.exports.serve = function(request, connection) {
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        //tradeApi.stop(intervalH);
    });

    connection.on('message', function(message) {
        console.log('incoming message: ', message);
        if (message.type === 'utf8') {
            // appRequest - for application request. That's the most original variable name i could thing of at the moment.
            //      This is the high level (application) request that's comming from the frontend and contained withing the 
            //      Websocket-level request object.
            let appRequest = JSON.parse(message.utf8Data);
            //console.log('Received Message: ' + message.utf8Data);
            switch(appRequest.command) {
                case "get-historical-price-data":
                    getHistoricalPriceData(request, connection, appRequest);
            }
            
        }
        //else if (message.type === 'binary') {
            //console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            //connection.sendBytes(message.binaryData);
        //}
    });
}

function getHistoricalPriceData(request, connection, appRequest) {

    let marketId = appRequest.data.marketId;
    let daysAgo = appRequest.data.daysAgo;
    HourlyPrice.fetchLastDaysData(marketId, daysAgo, (err, result) => {
        if(err != null)
            result = {error: err};
        else {
            result = {
                response: 'response-historical-price-data',
                data: result
            };
            result = JSON.stringify(result);
        }

        console.log("getHistoricalPriceData: ", result);
        connection.sendUTF(result);
    });
}