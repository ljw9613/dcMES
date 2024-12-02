/*
 * @name: **列表
 * @content:
 * @Author: joyce
 * @Date: 2020-09-02 12:42:00
 */
const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  dict: state => state.dict.dict,
  dept: state => state.user.department,
  serve: state => state.user.serve,
  name: state => state.user.name,
  userName: state => state.user.userName,
  id: state => state.user.id,
  roles: state => state.user.roles,
  router: state => state.permission.routes,
  addRoutes: state => state.permission.addRoutes,
}
export default getters
