# Contribution Guide

项目为基于 [Lerna] + [Yarn Workspace] 的 Monorepo.

更多文档请查看 《[EasyOps 开发者 - Micro App](http://developers.162.d.easyops.local/micro-app/introduce.html)》

## 文件结构

项目包含两个多包工作区：

```bash
.
├── dll/*                 # <小产品>
├── packages              # <平台库>
    ├── brick-container   # 新 Console
    ├── brick-dll         # Vendors dll
    ├── brick-http        # Http 基础库
    ├── brick-kit         # 插件运行时
    ├── brick-scripts     # 用于构件开发的脚本工具
    └── sdk-scripts       # 用于 SDK 的脚本工具
```

- `dll/*`'s scope is `@dll`
- `packages/*`'s scope is `@easyops`

## Nginx Configure

Production in local (For debugging production environment):

```conf
server {
    listen 8082;
    root /PATH/TO/next-core/packages/brick-container/dist;
    expires -1;
    location / {
        try_files $uri $uri/ /index.html;
        index index.html;
        ssi on;
    }
    location /conf/ {
        root /PATH/TO/next-core/packages/brick-container/;
    }
    location /bricks/ {
        root /PATH/TO/next-core/;
    }
    location /api/ {
        proxy_pass http://brick-next.162.d.easyops.local;
    }
}
```

Production on 162:

```conf
server {
    listen 80;
    server_name brick-next.162.d.easyops.local;
    root /usr/local/easyops/brick_next/packages/brick-container/dist;
    expires -1;

    set $base_href '/';
    if ($http_x_base_href) {
        set $base_href '/next/';
    }

    location / {
        try_files $uri $uri/ /index.html;
        index index.html;
        ssi on;
    }
    location /conf/ {
        root /usr/local/easyops/brick_next/packages/brick-container;
    }
    location /bricks/ {
        root /usr/local/easyops/brick_next/;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8104;
    }
}
```

[lerna]: https://github.com/lerna/lerna
[yarn workspace]: https://yarnpkg.com/lang/en/docs/workspaces/
