# Trading post

[ui](ui/README.md) is a web app to view and edit lists by store

[chrome-extension](chrome-extension/README.md) is a Chrome extension to add needed items from Target list to Target cart

Firebase schema:

````
{
  "delivery" : {
    "target" : {
      "item": "url",
      "wet cat food" : "http://www.target.com/p/wet-cat-food/-/A-50045363"
    }
  },
  "log" : {
    "target" : {
      "item" : {
        "2017-02-18T18:45:28" : true
      },
      "dry cat food" : {
        "2017-02-18T18:45:35" : true
      }
    }
  },
  "need" : {
    "target" : {
      "item" : false,
      "coffee" : true
    }
  },
  "stores" : {
    "key" : "label",
    "target" : "Target"
  }
}
````
