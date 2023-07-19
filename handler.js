'use strict';

const { DynamoDBClient, PutItemCommand, UpdateItemCommand , DeleteItemCommand, ScanCommand} = require("@aws-sdk/client-dynamodb"); // CommonJS import
const client = new DynamoDBClient({
  region: 'us-east-1',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000
  }
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data)
});

module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let data = JSON.parse(event.body)
  try {
    const input = {
      "Item": {
        "notesId": {
          "S": data.id
        },
        "title": {
          "S": data.title
        },
        "body": {
          "S": data.body
        }
      },
      "CondtionExpression": "attribute_not_exists",
      "TableName": NOTES_TABLE_NAME
    };
    const command = new PutItemCommand(input);
    const response = await client.send(command);
    callback(null, send(201, data))
  } catch (error) {
    callback(send(500, error.message))
  }
};

module.exports.updateNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body)
  try {
    const input = {
      "ExpressionAttributeNames": {
        "#title": "title",
        "#body": "body"
      },
      "ExpressionAttributeValues": {
        ":title": {
          "S": data.title
        },
        ":body": {
          "S": data.body
        }
      },
      "Key": {
        "notesId": {
          "S": notesId
        }
      },
      "TableName": NOTES_TABLE_NAME,
      "UpdateExpression": "SET #title = :title, #body = :body",
      "CondtionExpression": "attribute_exists(notesId)",
    };
    const command = new UpdateItemCommand(input);
    const response = await client.send(command);
    callback(null, send(200, data))
  } catch (error) {
    callback(send(500, error.message))
  }
};

module.exports.deleteNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  try {
    const input = {
      "Key": {
        "notesId": {
          "S": notesId
        },
      },
      "CondtionExpression": "attribute_exists(notesId)",
      "TableName": NOTES_TABLE_NAME
    };
    const command = new DeleteItemCommand(input);
    const response = await client.send(command);
    callback(null, send(200, notesId))
  } catch (error) {
    callback(send(500, error.message))
  }
};

module.exports.getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const input = {
      "ExpressionAttributeNames": {
        "#title": "title",
        "#body": "body"
      },
      "ProjectionExpression": "#title, #body",
      "TableName": NOTES_TABLE_NAME
    };
    const command = new ScanCommand(input);
    const response = await client.send(command);
    console.log('response: ', response)
    callback(null, send(200, response))
  } catch (error) {
    console.log('error: ', error)
    callback(send(500, error.message))
  }
  return {
    statusCode: 200,
    body: JSON.stringify("all notes are returned"),
  };
;
};
