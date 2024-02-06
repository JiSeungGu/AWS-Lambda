const AWS = require('aws-sdk');
const { Client, Connection } = require('@opensearch-project/opensearch');
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const aws4 = require("aws4");
const host = 'https://search-keywordsearch-ulbkpha4fhlhyaov6tr2c6ccku.ap-southeast-1.es.amazonaws.com'; 

const createAwsConnector = (credentials, region) => {
  class AmazonConnection extends Connection {
      buildRequestObject(params) {
    const request = super.buildRequestObject(params);
    request.service = 'es';
    request.region = 'ap-southeast-1';
    request.headers = request.headers || {};
    request.headers['host'] = request.hostname;
      return aws4.sign(request, credentials);
      }
  }
  return {
      Connection: AmazonConnection
  };
};
const getClient = async () => {
  const credentials = await defaultProvider()();
  return new Client({
      ...createAwsConnector(credentials, 'ap-southeast-1'),
      node: host,
  });
}

module.exports = getClient;