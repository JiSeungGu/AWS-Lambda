const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

exports.queryDDB = function (tableName, keyName, keyValue) {
  const params = {
    TableName: tableName,
    // ProjectionExpression을 사용하면 원하는 컬럼만 출력가능하다, 물론 생략하면 전부 출력
      // ProjectionExpression="컬럼",
      //기본 Index를 사용하므로 따로 작성하지 않음, 추가 필요시 Index 생성후 기입
    // IndexName : 'byUser',
    KeyConditionExpression: '#key = :value',
    ExpressionAttributeNames: {
      '#key': keyName,
    },
    ExpressionAttributeValues: {
      ':value': keyValue,
    },
  };

  return ddb.query(params).promise();
};

exports.putItemDDB = function (postId, notificationTriggerUserId, userID, postTitle) {
    //Notification Table Insert용 데이타
    const id = uuid.v4(); // generates a unique id
    const now = new Date();
    const createdAt = now.toISOString();
    const updatedAt = now.toISOString();
        
    const params = {
        TableName: 'Notification-xo6p7e7k7zgz7ntmvpspbwezpy-release',
        Item: {
            id,
            __typename: 'Notification',
            createdAt,
            isRead: 'false',
            message : postTitle,
            notificationTargetPostId: postId,
            notificationTriggerUserId: notificationTriggerUserId,
            type: 'NEW_KEYWORD',
            updatedAt,
            userID: userID
        }
    };

    return ddb.put(params).promise();
};