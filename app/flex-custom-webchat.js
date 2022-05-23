require('dotenv').config();
const axios = require('axios')
const fs = require('fs')
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
var base64 = require('base-64');
console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const client = require('twilio')(
  'AC8a74265a424f710f6863781ce45f7352',
  process.env.TWILIO_AUTH_TOKEN
);

async function sendChatMessage(serviceSid, channelSid, chatUserName, body) {
  console.log(`In sendMessageToFlex`);
  try { 
    const res = await axios.get(body)
   
  // console.log(res.data)
  //  let objectURL = URL.createObjectURL(res.data)
  //  let myImage = new Image()
  //  myImage.src = objectURL;
   
  const params = new URLSearchParams();
 // params.append('Body', myImage); 
   params.append('Body', body);
  //  params.append('media','<svg xmlns="https://s3.ap-southeast-1.amazonaws.com/wavecell.chatapps.prod/20220517/61723/5b7d1b3b-2e76-4a2b-a5c0-ae98006596bb.jpg?X-Amz-Expires=86400&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA2PGOLLUL4EFGX637/20220517/ap-southeast-1/s3/aws4_request&X-Amz-Date=20220517T061207Z&X-Amz-SignedHeaders=host&X-Amz-Signature=cede270599a0e63517c4c7fbf3e58d7ea47cf2e3fb565c204a7f4dec531f0019" viewBox="0 0 100 100">' +
  //  '<path d="M50,3l12,36h38l-30,22l11,36l-31-21l-31,21l11-36l-30-22h38z"' +
  //  ' fill="#FF0" stroke="#FC0" stroke-width="2"/></svg>')
 // params.append('Body', res.data);
  params.append('From', chatUserName);
  return await fetch(
    `https://chat.twilio.com/v2/Services/${serviceSid}/Channels/${channelSid}/Messages`,                //${channelSid}/Messages`,
    {
      method: 'post',
      body: params,
      headers: {
        'X-Twilio-Webhook-Enabled': 'true', 
        //'content-type' : 'image/svg+xml; charset=utf-8',       
        Authorization: `Basic ${base64.encode(
          `AC8a74265a424f710f6863781ce45f7352:${process.env.TWILIO_AUTH_TOKEN}`
        )}`
      }
    }
  );
}catch (error) {
  console.log(error) }
}

async function createNewChannel(flexFlowSid, flexChatService, userViberId, chatUserName) {
  console.log('In Create New Channel')
  let channelSID;
  await client.flexApi.channel
    .create({
      flexFlowSid: flexFlowSid,
      identity: userViberId,
      chatUserFriendlyName: chatUserName,
      chatFriendlyName: chatUserName,
      target: chatUserName
    })
    .then(async (channel) => {
        console.log(`Created new channel ${channel.sid}`);
         channelSID = channel.sid
        // creating MapItem based on ChannelSId to store viber number
        await client.sync.services('ISff58ee2a69fcfb91adbbc63b5c3f0b85')
        .syncMaps('MPb47c884de86345909dad27afd6ec9ed6')
        .syncMapItems
        .create({ key: channel.sid, data: {"userViberId" : userViberId} })
        .then(sync_map_item => console.log("MapItem based on ChannelSId to store viber number",sync_map_item.key));


      //  let newMessage =  await client.chat
      //   .services(flexChatService)
      //   .channels(channel.sid)
      //   .webhooks.create({
      //     type: 'webhook',
      //     'configuration.method': 'POST',
      //     'configuration.url': `${process.env.WEBHOOK_BASE_URL}/new-message?channel=${channel.sid}`,
      //     'configuration.filters': ['onMessageSent']
      //   }

      //   );
    //  let channelupdate= await client.chat
    //     .services(flexChatService)
    //     .channels(channel.sid)
    //     .webhooks.create({
    //       type: 'webhook',
    //       'configuration.method': 'POST',
    //       'configuration.url': `${process.env.WEBHOOK_BASE_URL}/channel-update`,
    //       'configuration.filters': ['onChannelUpdated']
    //     });
    //     console.log('api call after channelupdate : ',channelupdate)
      // return await client.chat
      //   .services(flexChatService)
      //   .channels(channel.sid)
      //   .webhooks.create({
      //     type: 'webhook',
      //     'configuration.method': 'POST',
      //     'configuration.url': `${process.env.WEBHOOK_BASE_URL}/end-chat?channel=${channel.sid}&viberId=${userViberId}`,
      //     'configuration.filters': ['onMemberRemoved']
      //   });
      })
   // .then(webhook => webhook.channelSid)
    .catch(error => {
      console.log(error);
    });
   return channelSID
}

async function removeChannel(channelId) {
  return new Promise(function (resolve, reject) {
      client.flexApi.channel(channelId).remove().then(success => {
      console.log("removed channel id ", `${channelId}`);
      resolve(success);
    }).catch(err => {
      reject(err);
    })
  })
}

const channels = [];

async function resetChannel(status) {
  if (status == 'INACTIVE') {
    channels.map((channel, index) => {
      if (channel['userViberId'] == userViberId) {
        channel['flex_channel'] = false;
      }
    })
  }
}

async function sendMessageToFlex(msg, userViberId, userName, flexChannelCreated) {
  console.log(`${process.env.WEBHOOK_BASE_URL}`);
  let check = await sendChatMessage(
    process.env.FLEX_CHAT_SERVICE,
    flexChannelCreated,
    userName,
    msg
  );
  console.log('Message Sent')
}

exports.sendMessageToFlex = sendMessageToFlex;
exports.resetChannel = resetChannel;
exports.createNewChannel = createNewChannel;
exports.removeChannel = removeChannel;
