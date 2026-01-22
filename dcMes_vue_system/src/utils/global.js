/*
 * @Autor Wei
 * @Date 2020-02-12 13:38:55
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2020-11-24 01:13:14
//  */
// const usl = 'https://www.jinwanlink.cn/enterprise'
const usl = 'https://www.macaojob.cn/danjianStudy'
const advertisements_URL = usl + `/images/advertisements/`
const tinymce_URL = usl + `/images/timyceimg/`
const advertisements_img = usl + `/api/v1/uploadimg`
const new_img = usl + `/api/v1/uploadfiles`


// 数据合并
export function mergeRecursive(source, target) {
  for (var p in target) {
    try {
      if (target[p].constructor === Object) {
        source[p] = mergeRecursive(source[p], target[p]);
      } else {
        source[p] = target[p];
      }
    } catch (e) {
      source[p] = target[p];
    }
  }
  return source;
}

export {
  advertisements_URL, // 广告图片
  tinymce_URL,
  advertisements_img,
  new_img,
}
