# RAP2-DELOS 开源社区版本 (后端 API 服务器)

因个人业务需要，需解决 [rap2-delos#388](https://github.com/thx/rap2-delos/issues/388) 的问题，该仓库在现有 `RAP2-DELOS` 上有如下改动，：

1. 接口编辑支持保存 `body params` 格式为 `raw` 及支持导出其对应的 `postman` 需要的数据格式(其他数据格式待支持...)

2. 增加 `nginx` 镜像，转发 `/app/mock` 路径：

  服务启动后，`MOCK` 数据请求地址如：http://localhost:38080/app/mock/16/test

  配置 `HOST`:
  127.0.0.1 rap.com

  此时可使用：http://rap.com/16/test 访问上面一条 `MOCK` 数据

> 尚为完善支持所有的数据格式

> 因本仓库的改动只涉及后端服务，前端界面上选中 `body params` 格式为 `raw` 后，下次编辑界面并未自动选中 `raw` 格式的问题属于前端系统 [rap2-dolores](https://github.com/thx/rap2-dolores)