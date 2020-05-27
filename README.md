# RAP2-DELOS 开源社区版本 (后端 API 服务器)

#### 此仓库解决 RAP2 服务的两个问题：

1. 导出的 `postman` 接口的 `mode` 均为 `formdata` [rap2-delos#388](https://github.com/thx/rap2-delos/issues/388)

2. 前端界面上设置Conten-Type，再次编辑未自动选中，此问题属于前台系统 `rap2-dolores` [rap2-delos#665](https://github.com/thx/rap2-delos/issues/665)，修改后的前端系统 [rap2-dolores](https://github.com/treadpit/rap2-dolores)

##### 除解决以上两个问题，在此基础上有如下改动（可在docker-compose中移除）：

增加 `nginx` 镜像，接口服务情况***转发 `38080` 端口及 `/app/mock` 路径：***

  `rap2-delos` 服务启动后，原数据请求地址如：http://localhost:38080/app/mock/16/test

  此时可使用：http://localhost/16/test