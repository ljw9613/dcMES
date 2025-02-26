import Vue from "vue";
import store from "@/store";
import DataDict from "@/utils/dict";
import { getData } from "@/api/system/data/data";

function searchDictByKey(dict, key) {
  if (key == null && key === "") {
    return null;
  }
  try {
    for (let i = 0; i < dict.length; i++) {
      if (dict[i].key === key) {
        return dict[i].value;
      }
    }
  } catch (e) {
    return null;
  }
}

function install() {
  Vue.use(DataDict, {
    metas: {
      "*": {
        labelField: "dictLabel",
        valueField: "dictValue",
        request(dictMeta) {
          const forceRefresh = dictMeta.refresh || false;
          const storeDict = searchDictByKey(store.getters.dict, dictMeta.type);
          
          if (storeDict && !forceRefresh) {
            return new Promise(resolve => {
              resolve(storeDict);
            });
          } else {
            return new Promise((resolve, reject) => {
              getData("dictData", {
                query: { dictType: dictMeta.type },
                sort: { dictSort: 1 }
              })
                .then(res => {
                  store.dispatch("dict/setDict", {
                    key: dictMeta.type,
                    value: res.data
                  });
                  resolve(res.data);
                })
                .catch(error => {
                  reject(error);
                });
            });
          }
        }
      }
    }
  });
}

function refreshDict(type) {
  return new Promise((resolve, reject) => {
    getData("dictData", {
      query: { dictType: type },
      sort: { dictSort: 1 }
    })
      .then(res => {
        store.dispatch("dict/setDict", {
          key: type,
          value: res.data
        });
        resolve(res.data);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export default {
  install,
  refreshDict
};
