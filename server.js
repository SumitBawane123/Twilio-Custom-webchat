const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const PictureMessage = require('viber-bot').Message.Picture;
const ngrok = require('./app/get_public_url');
const flex = require('./app/flex-custom-webchat');
const http = require('http');
const sdk = require('api')('@connect/v1#1jzpkl10a04et');
require('dotenv').config({ path: './.env' });
console.log("In server", process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.FLEX_FLOW_SID, process.env.FLEX_CHAT_SERVICE)

const getTwilioclient = require('twilio')(
    'AC8a74265a424f710f6863781ce45f7352',
    process.env.TWILIO_AUTH_TOKEN
);



var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

//https://chatbotslife.com/build-viber-bot-with-nodejs-a21487e5b65

// const bot = new ViberBot({
// 	authToken: '4d4d95871f27dc4b-d3ac11d52f948ea2-7af6fc5137ac58ec',
// 	name: "TwilioTest",
// 	avatar: "https://dl-media.viber.com/1/share/2/long/vibes/icon/image/0x0/b95f/821be113f3e0537b8af3f9b27aa420d3fa5cb66c6250d875c0480598d90db95f.jpg" // It is recommended to be 720x720, and no more than 100kb.
// });
// Twilio Socket


//Twilio Socket
// bot.on(BotEvents.CONVERSATION_STARTED, (response) => {

//     const roomname = response.userProfile.id;
//     const username = response.userProfile.name;
//     const profile_pic = response.userProfile.avatar;
//     const country_origin = response.userProfile.country;
//     const language_origin = response.userProfile.language;

//     //Do something with user data
//     console.log('hello message received');
// })

const clients = [];
async function createChannel(userViberId, userResponse) {
    let client;
    try {
        await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
            .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
            .syncMapItems
            .list()
            .then(syncMapItems => syncMapItems.forEach(s => {
                clients.push(s.key)
            }
            )).catch(err => {
                console.log('Error while fetch keys ', err)
            });
    } catch (error) {
        console.log('Error :', error)
    }


    console.log('clients', clients)
    if (clients.includes(userViberId)) {
        console.log("Client Found In sync map")
        await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
            .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
            .syncMapItems(userViberId)
            .fetch()
            .then(sync_map_item => {
                console.log(sync_map_item.key)
                client = sync_map_item.data
            });

    }
    // clients.map((v_data, index) => {
    //     if (v_data['userViberId'] == userViberId) {
    //         client = v_data
    //     }
    // })
    console.log('client:- ', client)

    if (!client) {
        console.log("create new client");
        let flexChannelCreated = await flex.createNewChannel(
            process.env.FLEX_FLOW_SID,
            process.env.FLEX_CHAT_SERVICE,
            userViberId,
            'viber:' + userViberId
        );
        console.log('flexChannelCreated', flexChannelCreated)
        client = {};
        client['userViberId'] = userViberId;
        client['flex_channel'] = flexChannelCreated;
        client['user_bot'] = userResponse;


        await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
            .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
            .syncMapItems
            .create({ key: userViberId, data: client })
            .then(sync_map_item => console.log(sync_map_item.key));
    }
    return client;
}

// Perfect! Now here's the key part:
app.post('/home', (request, response) => {
    createChannel(request.body.payload.user.channelUserId, request.body).then(client => {
        console.log('client::::::-', client)
        // Echo's back the message to the client. Your bot logic should sit here.
        console.log('hello message received Ted');
        console.log("Request", request.body.payload.content)
        if (request.body.payload.type == 'Text') {
            flex.sendMessageToFlex(request.body.payload.content.text, request.body.payload.user.channelUserId, request.body.payload.user.channelUserId, client['flex_channel']);
        }
        else if (request.body.payload.type == 'Image') {           
            flex.sendMessageToFlex(request.body.payload.content.url, request.body.payload.user.channelUserId, request.body.payload.user.channelUserId, client['flex_channel']);
        }
    }).catch(err => {
        console.log(err);
    });
});

// Perfect! Now here's the key part:
// bot.on(BotEvents.MESSAGE_SENT, (message, userProfile) => {
// 	// Echo's back the message to the client. Your bot logic should sit here.
// 	console.log('hello', userProfile);
//     console.log('Message sent', message);

// });

var port = process.env.PORT || 4040;        // set our port

async function getNumber(channelSid) {
    let number;
    await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
        .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
        .syncMapItems(channelSid)
        .fetch()
        .then(sync_map_item => {
            console.log(sync_map_item.key)
            number = sync_map_item.data.userViberId
        });
    return number
}

app.post('/new-message', function (request, response) {


    //     console.log("###########################################################################################")
    //     console.log('new-msg, req body',request.body,request.query.from)
    //    // console.log("request",request)
    //     console.log("###########################################################################################")

    const obj = JSON.parse(JSON.stringify(request.body));
    console.log('onj', obj)
    if (obj.EventType == 'onMessageSent') {
        getNumber(obj.ChannelSid).then(toNumber => {
            console.log('toNUmber', toNumber)

            if (obj.Source == 'API' && obj.From.startsWith('CH')) {

                sdk.auth('JYUu7lbnGj63YEpPTiwhC7jADgP0bsTjxtAhdfsM');
                sdk.server('https://chatapps.8x8.com');
                sdk['Send-Message']({
                    user: { msisdn: '+' + toNumber },
                    content: {
                        sms: { encoding: 'AUTO' },
                        text: obj.Body
                    },
                    channels: [{ channel: 'Viber' }],
                    type: 'Text'
                }, { subAccountId: 'flyPAL_ViberChat' })
                    .then(res => console.log(res))
                    .catch(err => console.error(err));
            }

            if (obj.Source === 'SDK' ) {
                console.log('To send msg from twilio to viber')
                sdk.auth('JYUu7lbnGj63YEpPTiwhC7jADgP0bsTjxtAhdfsM');
                sdk.server('https://chatapps.8x8.com');
                sdk['Send-Message']({
                    user: { msisdn: '+' + toNumber },
                    content: {
                        sms: { encoding: 'AUTO' },
                        text: obj.Body
                    },
                    channels: [{ channel: 'Viber' }],
                    type: 'Text'
                }, { subAccountId: 'flyPAL_ViberChat' })
                    .then(res => console.log(res))
                    .catch(err => console.error(err));
            }
        })
    }

    if (obj.EventType == 'onMemberRemoved') {
        console.log('End chat API called by trillio', request.query.viberId);
        removeClient(obj.ChannelSid);
    }
    response.sendStatus(200);

});
app.post('/end-chat', bodyParser.json(), function (request, response) {
    removeClient(request);
    response.sendStatus(200);
});

// async function removeClient(request) {
// try {    
// let deleteSyncItem = await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
//     .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
//     .syncMapItems(request.query.viberId)
//     .remove();

//     console.log('***** deleteSyncItem -- viberId',deleteSyncItem);     
// } catch (error) {
//     console.log('***** deleteSyncItem: Error',error);
// }

// let deleteSyncItem1 = await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
//     .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
//     .syncMapItems(request.query.channel)
//     .remove();

//     console.log('***** deleteSyncItem -- channel',deleteSyncItem1);  

// let removeChannel = await flex.removeChannel(request.query.channel);
// console.log('removeChannel',removeChannel);       
// }

async function removeClient(channelSid) {

    getNumber(channelSid).then(async (Number) => {

        try {
            let deleteSyncItem = await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
                .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
                .syncMapItems(Number)
                .remove();

            console.log('***** deleteSyncItem -- viberId', deleteSyncItem);
        } catch (error) {
            console.log('***** deleteSyncItem: Error', error);
        }

        let deleteSyncItem1 = await getTwilioclient.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
            .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
            .syncMapItems(channelSid)
            .remove();

        console.log('***** deleteSyncItem -- channel', deleteSyncItem1);

        let removeChannel = await flex.removeChannel(channelSid);
        console.log('removeChannel', removeChannel);
    })
}

// app.use("/viber/webhook", bot.middleware());

let server = http.createServer(app);
// var io = require('socket.io')(server);
// io.on('connection', function(socket) {
//     console.log('Socket connected');
// });
//
//server.listen(port, (req) => console.log('Listening port is ',req.url));
//


ngrok.getPublicUrl().then(publicUrl => {
    console.log('Set the new webhook to"', publicUrl);
    process.env.WEBHOOK_BASE_URL = publicUrl;
    server.listen(port, () => {
        // let webhook = publicUrl+"/viber/webhook";
        // bot.setWebhook(webhook).then(data => { 
        //     console.log('Magic happens on port ' + port);
        // }).catch(err => {
        //     console.log('Error ', err);
        // });
        console.log('Magic happens on port ' + port);
    });
}).catch(error => {
    console.log('Can not connect to ngrok server. Is it running?');
    console.error(error);
});
