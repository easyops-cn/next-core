# @easyops/brick-icons

自研图标库。

## Usage

在 Storyboard 中可以如下配置菜单图标：

#### 其它图标

```json
{
  "icon": {
    "lib": "easyops",
    "icon": "firewall"
  }
}
```

#### 小产品图标

```json
{
  "icon": {
    "lib": "easyops",
    "category": "app",
    "icon": "mysql-resource"
  }
}
```

## Descriptions

`src/icons/app/*.svg` 存放小产品图标，`src/icons/*.svg` 存放其它图标。

## Development

`lerna run start --scope=@easyops/brick-dll`
`lerna run start --scope=@easyops/brick-icons`

## New Icons

只需将文件拖入 `src/icons` 目录，并重新执行开发构建即可。请注意命名规范（使用小写羊肉串）和表达准确。
