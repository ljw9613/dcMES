define({ "api": [
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Request User information（最主要的参数，”{get}”定义了HTTP请求是GET，API地址是”/users/:user_id”，文档中API的名称是”Request User Information”。）",
    "version": "0.1.0",
    "name": "GetUser（API名称，不影响文档。）",
    "group": "User（API分组名，文档内容中和菜单栏中同一组的API会在一同显示，方便阅读。）",
    "permission": [
      {
        "name": "admin（API的访问权限，文档中默认会API地址下面显示。没有权限要求的话，此项可以省略。）"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>Users unique ID.（API参数字段介绍，”{Number}”定义了字段类型，”user_id”是字段名称，后面则是字段描述。可以定义多个@apiParam字段。）</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "idss",
            "description": "<p>Users unique ID.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "firstname",
            "description": "<p>Firstname of the User.（显示一个API成功返回后Response响应的示例，”{json}”代表响应体是JSON类型。该参数的下行就是响应体内容，直到有空行结束。可以定义多个@apiSuccessExample，默认在文档中会以标签形式列出，标签名就是”Success-Response:”。）</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "lastname",
            "description": "<p>Lastname of the User.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "    HTTP/1.1 200 OK\n    {\n      \"firstname\": \"John\",\n      \"lastname\": \"Doe\"\n    }\n（显示一个API成功返回后Response响应的示例，”{json}”代表响应体是JSON类型。该参数的下行就是响应体内容，直到有空行结束。可以定义多个@apiSuccessExample，默认在文档中会以标签形式列出，标签名就是”Success-Response:”。）",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>The id of the User was not found.（API发生错误后的返回，”UserNotFound”是错误名称，后面则是错误描述。可以定义多个错误返回。）</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "    HTTP/1.1 404 Not Found\n    {\n      \"error\": \"UserNotFound\"\n    }\n（显示一个API错误返回后Response响应的示例，”{json}”代表响应体是JSON类型。该参数的下行就是响应体内容，直到有空行结束。可以定义多个@apiErrorExample，默认在文档中会以标签形式列出，标签名就是”Error-Response:”。）",
          "type": "json"
        }
      ]
    },
    "filename": "routes/apiDocDemo.js",
    "groupTitle": "User（API分组名，文档内容中和菜单栏中同一组的API会在一同显示，方便阅读。）"
  }
] });
