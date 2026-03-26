---
name: yiliao
description: 前端开发规范
---

# 组件库

本项目使用`shadcn-vue`组件库,安装组件的方法为:`pnpm dlx shadcn-vue@latest add xxx`
你可以使用`shadcn-vue`这个mcp来查看组件的用法
引入组件的格式如下:

```vue
import { Card, CardAction, ... } from '@/components/ui/card'
```

# 代码规范

你不可以写`style`标签,也就是你不能写`css`,最好是一点`css`或者`tailwind`都不写,直接使用`shadcn-vue`组件库,必要的时候使用
`tailwindcss`来调整样式,以此来保证代码整洁,不会出现样式的重叠
