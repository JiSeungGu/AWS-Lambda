
const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();
const pinpoint = new AWS.Pinpoint();
const { queryDDB } = require('./ddbUtils');
const { sendPinpointMessage } = require('./sendMessage');


exports.handler = event => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  for (const record of event.Records) {
    try {
    if(record.eventName=='INSERT') {
    console.log('record.eventID: %j', record.eventID);
    console.log('record.eventName: %j', record.eventName);
    console.log('DynamoDB Record: %j', record.dynamodb);
    
    //PUSH 알림 전송 할 userID추출
    let userId = record.dynamodb.NewImage.userID
    let postId = record.dynamodb.NewImage.notificationTargetPostId.S
    
    
    //Json 데이터 Value 추출
    const userIdString = userId.S;
    
    //type에 따른 PushText설정 
    let PushText = null;
    if (record.dynamodb.NewImage.type && record.dynamodb.NewImage.type.S) {
      PushText = getPushText(record.dynamodb.NewImage.type.S,record.dynamodb.NewImage);
    }    
    
    //userID로 endpoint 추출    
      queryDDB('User-femnfskddrd3hgtppkwaudtm6q-staging', 'id', userIdString)
      .then(data => {
        console.log(data);
        // 함수 호출
        // console.log('data.Items[0].devicePlatform :',data.Items[0].devicePlatform)
        // console.log('data.Items[0].devicePlatform :',data.Items[0].deviceToken)
        
        if(data.Items[0].devicePlatform !== null )
         {
            sendPinpointMessage(
              'd630dc674c2b4abca784823317097f80',
              data.Items[0].deviceToken,
              '서울숲 ',
              PushText,
              setServiceBasedOnPlatform(data.Items[0].devicePlatform),
              postId
            );
         }
        console.log('메시지 내용 :',PushText)
      })
      .catch(err => { 
        console.error("Unable to read item. Error JSON: ", JSON.stringify(err, null, 2));
      });
    
  };
    } catch (error) {
      console.error(`Error processing record ${JSON.stringify(record)}: ${error.message}`);
    }
  } 
}
function setServiceBasedOnPlatform(devicePlatform) {
    let service;
    console.log('devicePlatform',devicePlatform)
    switch (devicePlatform) {
        case 'IOS':
            service = 'APNS_SANDBOX';
            break;
        case 'ANDROID':
            service = 'GCM';
            break;
        default:
            throw new Error(`Invalid device platform: ${devicePlatform}`);
    }

    return service;
}
function getPushText(notificationType,message) {
  switch(notificationType) {
    case 'NEW_COMMENT':
      return message.message.S;
    case 'NEW_POSTLIKE':
      return '누군가 내 게시물을 좋아합니다.';
    case 'NEW_REPLY':
      return message.message.S;
    case 'NEW_COMMENTLIKE':
      return '누군가 내 댓글을 좋아합니다.';
    case 'NEW_REPLYLIKE':
      return '누군가 내 답글을 좋아합니다.';
    case 'NEW_KEYWORD':
      return message.message.S;
    default:
      return '알 수 없는 알림 유형입니다.';
  }
}