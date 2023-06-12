const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();
const { sendPinpointMessage } = require('./sendMessage');
// const { queryDDB } = require('./ddbUtils');
const { queryDDB, putItemDDB, scanDDB } = require('./ddbUtils');
// const { Client } = require('@elastic/elasticsearch')
const { Client } = require('@opensearch-project/opensearch');

// Elasticsearch 클라이언트 생성
// const node = 'https://search-keywordsearch-ulbkpha4fhlhyaov6tr2c6ccku.ap-southeast-1.es.amazonaws.com'; // domain host 


exports.handler = async (event) => {
   console.log(`EVENT: ${JSON.stringify(event)}`);

   for (const record of event.Records) {

    if(record.eventName === "INSERT") {
        let userIds = new Set(); // Set 생성
     
        const notificationTriggerUserId = record.dynamodb.NewImage.userID.S
        
        let postTitle = record.dynamodb.NewImage.title.S
        let postContent = record.dynamodb.NewImage.content.S
        const postId = record.dynamodb.NewImage.id.S
        await scanDDB().then(async data => {
            console.log('Scan Data ');
            for (const item of data.Items) {
                const {keyword} = item;
                const userIdList= item.userID.split(',');
                // const userIdList = keyword.split(',');
                for(const userId of userIdList) {
                //   console.log(userId); // 각 userid를 출력합니다.
                  if (!userIds.has(userId)) { // Set에 userId가 없을 경우에만 처리
                    userIds.add(userId); // Set에 userId 추가
                    if(postTitle.trim().includes(keyword)) {
                      console.log(`Title "${postTitle}" includes keyword "${keyword}"`);
                    //   const {userID} = item;
                      await putItemDDB(postId, notificationTriggerUserId,userId,postTitle);
                    }else if (postContent.trim().includes(keyword)) {
                          console.log(`Content "${postContent}" includes keyword "${keyword}"`);
                        //   const {userID} = item;
                        await putItemDDB(postId, notificationTriggerUserId,userId,postTitle);
                        }
                    }
                }
          }
        }
         )
         
    }else { 
        console.log("EVENT_NAME 형식이 INSERT가 아니므로 종료합니다.")
        break;   
    }
   }
   console.log("****** AWS 키워드 알림 기능 종료 ******")
   
}
function getTextList(response,ComprehendType) {
    let textList = '';
    if (ComprehendType === 'KeyPhrases') {
    response.KeyPhrases.forEach((phrase, index) => {
        textList += phrase.Text;
        if (index !== response.KeyPhrases.length - 1) {
            textList += ',';
          }
    });
    } else {
       response.Entities.forEach((phrase, index) => {
        textList += phrase.Text;
    if (index !== response.KeyPhrases.length - 1) {
        textList += ',';
      }
    }); 
    }
    return textList
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