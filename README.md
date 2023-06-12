사용언어 :Node.js
사용기술 :Lambda, PinPoint, OpenSearch, DynamoDB, CloudWatch

AWS Lmabda - DynamoDB: Query,Scan 

ElasticSearch - 게시글 문자 추출 ElasticSearch의  detectKeyPhrases, detectEntities 기능을 사용, 한국어의 명사 추출의 정확도는 다소 높지 않음.
Opensearch - 키워드 알림을 위한 게시글 Document저장 , DynamoDB에는 LIKE기능이 없으므로 OpenSearch의 Document조회기능을 사용하였다.
PinPoint - App 특정 기능의 이벤트 트리거 Push 알림 전송
CloudWatch - 로그