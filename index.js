const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();
const { sendPinpointMessage } = require('./sendMessage');
// const { queryDDB } = require('./ddbUtils');
const { queryDDB, putItemDDB } = require('./ddbUtils');
// const { Client } = require('@elastic/elasticsearch')
const { Client } = require('@opensearch-project/opensearch');

// Elasticsearch 클라이언트 생성
// 현재 노드 동작 안함 .
const node = 'https://search-keywordsearch-ulbkpha4fhlhyaov6tr2c6ccku.ap-southeast-1.es.amazonaws.com'; // domain host 
const esClient = new Client({ node : node,
    auth : {
        username : 'ID',
        password : 'PASSWORD'
    }
});


exports.handler = async (event) => {
   console.log(`EVENT: ${JSON.stringify(event)}`);

   for (const record of event.Records) {

    if(record.eventName === "INSERT") {
        let userIds = new Set(); // Set 생성
    
        const notificationTriggerUserId = record.dynamodb.NewImage.userID.S
        
        let postTitle = record.dynamodb.NewImage.title.S
        const postId = record.dynamodb.NewImage.id.S
        
        const params = {
            LanguageCode: 'ko',
            Text : postTitle
        };
        const dynamoData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        console.log('dynamoData :',dynamoData)
        

        try {
            let response = await comprehend.detectKeyPhrases(params).promise();
            let ComprehendType = 'KeyPhrases'
            if (response.KeyPhrases.length === 0) {
                console.log('response.KeyPhrases.length가 0이므로 detectEntities를 호출합니다.')
                response = await comprehend.detectEntities(params).promise();
                 ComprehendType = 'Entities'
                if (response.Entities.length ===0 ) {
                    console.log('response.Entities.length가 0이므로 종료합니다. ')
                    break;
                }
            }
            console.log(response);
            // const textList = response.KeyPhrases.map(phrase => phrase.Text).join(', ');
            let textList = '';
            textList = getTextList(response,ComprehendType)
    
            console.log('textList :',textList);
            
            let items = textList.split(',');
            console.log('items.length : ',items.length)
            for(let i = 0; i < items.length; i++){
            console.log(items[i].trim()); //trim() 함수는 문자열 앞뒤의 공백을 제거합니다.
            
            const result = await esClient.search({
              index: 'opensearchtestindex',
              _source : ['userId'],
              body: {
                query: {
                  wildcard: {
                    keyword: `*${items[i]}*`
                  }
                }
              }
            });
            console.log(result.body.hits.hits);
             for (const hit of result.body.hits.hits) {
                let userId = hit._source.userId;
                   if (!userIds.has(userId)) { // Set에 userId가 없을 경우에만 처리
                    userIds.add(userId); // Set에 userId 추가
                //  await queryDDB('테이블 명 ', 'id', 유저 아이디 )
                //   .then(async data => {
                    // console.log(data);
                    // 함수 호출
                    
                    // if(data.Items[0].devicePlatform !== null )
                    //  {
                        // await sendPinpointMessage(
                        //   'd630dc674c2b4abca784823317097f80',
                        //   data.Items[0].deviceToken,
                        //   '알림 title ',
                        //   '알림 내용 : '+items[i],
                        //   setServiceBasedOnPlatform(data.Items[0].devicePlatform),
                        //   postId.toString()
                        // );
                    await putItemDDB(postId, notificationTriggerUserId,hit._source.userId,postTitle);
                    console.log('PutItemDDB UserId : ',hit._source.userId)
                   }
                    //  }
                //   })
                   
             }
            }
            
        
            
        } catch (err) {
            console.error(err);
            const message = `Error processing text: ${err.message}`;
            console.error(message);
            throw new Error(message);
        }
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