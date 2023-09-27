import type { PluginLocation } from "@next-core/brick-types";

export function setLoginStateCookie(location: PluginLocation): void {
  // 独立打包应用 登录时间超时后还是由前端控制跳转，后台无法处理设置登录前的 path 和 query 的 cookie 值
  // 此这场景下前端做下处理

  const { search, pathname } = location;

  const pathValue = pathname ? window.btoa(encodeURIComponent(pathname)) : "";

  const searchValue = search ? window.btoa(encodeURIComponent(search)) : "";

  document.cookie = `SALOGINPATH=${pathValue}; path=/`;
  document.cookie = `SALOGINQUERY=${searchValue}; path=/`;
}
