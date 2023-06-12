const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-1' });

const pinpoint = new AWS.Pinpoint();

async function sendPinpointMessage(
  applicationId,
  deviceToken,
  title,
  message,
  deviceservice,
  postId,
  action = 'URL',
  url = 'https://www.example.com',
  priority = 'normal',
  ttl = 30,
  silent = false
) {
  const recipient = {
    token: deviceToken,
    service: deviceservice, // 이 부분은 실제 디바이스 플랫폼에 따라 'GCM', 'APNS' 등으로 변경해야 합니다.
  };

  function createMessageRequest() {
    const { token, service } = recipient;

    let MessageConfiguration;
    
    if (service === 'GCM') {
        MessageConfiguration = {
            GCMMessage: {
                Action: action,
                Body: message,
                Priority: priority,
                SilentPush: silent,
                Title: title,
                TimeToLive: ttl,
                Url: postId,
            },
        };
    } else if (service === 'APNS_SANDBOX') {
        MessageConfiguration = {
            APNSMessage: {
                Action: action,
                Body: message,
                Priority: priority,
                SilentPush: silent,
                Title: title,
                TimeToLive: ttl,
                Url: postId,
            },
        };
    } else if (service === 'BAIDU') {
        MessageConfiguration = {
            BaiduMessage: {
                Action: action,
                Body: message,
                Priority: priority,
                SilentPush: silent,
                Title: title,
                TimeToLive: ttl,
                Url: postId,
            },
        };
    } else if (service === 'ADM') {
        MessageConfiguration = {
            ADMMessage: {
                Action: action,
                Body: message,
                Priority: priority,
                SilentPush: silent,
                Title: title,
                Url: postId,
            },
        };
    } else {
        throw new Error(`Invalid service: ${service}`);
    }
    const messageRequest = {
      Addresses: {
        [token]: {
          ChannelType: service,
        },
      },
      MessageConfiguration: MessageConfiguration
    };

    return messageRequest;
  }

  function showOutput(data) {
    const deliveryStatus =
      data.MessageResponse.Result[recipient.token].DeliveryStatus;

    const status =
      deliveryStatus === 'SUCCESSFUL'
        ? 'Message sent! Response information: '
        : "The message wasn't sent. Response information: ";

    console.log(status);
    console.dir(data, { depth: null });
  }

  const messageRequest = createMessageRequest();

  const params = {
    ApplicationId: applicationId,
    MessageRequest: messageRequest,
  };

  try {
    const data = await pinpoint.sendMessages(params).promise();
    showOutput(data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { sendPinpointMessage };