import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import registerNodesPlugin from './plugins/registerNodes'

const app = createApp(App)

// 注册自定义节点插件
app.use(registerNodesPlugin)

app.mount('#app')
