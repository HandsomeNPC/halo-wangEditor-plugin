<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 770px; overflow-y: hidden;"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
    />
    <VModal
      @close="visible = false"
      :title="'上传图片'"
      :visible="visible"
      :width="650"
    >
      <FormKit
        id="link-form"
        v-model="formState"
        name="link-form"
        type="form"
      >
        <FormKit
          type="attachment"
          name="imgUrl"
          label="图片url"
        ></FormKit>
      </FormKit>

      <template #footer>
        <VSpace>
          <VButton
            type="secondary"
            @click="handleSubmit"
          >
            提交
          </VButton>
        </VSpace>
      </template>
    </VModal>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import {Toast, VButton, VModal, VSpace} from "@halo-dev/components";
import $http from '@/utils/request'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import {onBeforeUnmount, ref, shallowRef, onMounted, watch, reactive} from 'vue'
import {Editor, Toolbar} from '@wangeditor/editor-for-vue'
// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
const visible = ref(false)
const formState = reactive({
  imgUrl: ''
})

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    emit("close");
  }
};
//模式:默认
const mode = 'default';
// 内容 HTML
const valueHtml = ref('');
// 模拟 ajax 异步获取内容
onMounted(() => {
  if (location.href.includes('?')) {
    getHeadContent()
  }
})
const getHeadContent = () => {
  const name = getQueryVariable(location.href, 'name')
  $http.get(`/apis/api.console.halo.run/v1alpha1/posts/${name}/head-content`).then((res) => {
    valueHtml.value = res.data.raw
  }).catch((err) => {
    console.log(err);
  })
}
//工具栏配置
const toolbarConfig = {}
//编辑框配置
const editorConfig: any = {
  MENU_CONF: {}
}
let insertTemp: any;
let isSubmit: boolean = false;
editorConfig.MENU_CONF['uploadImage'] = {
  customBrowseAndUpload(insertFn: any) {   // TS 语法
    visible.value = true
    insertTemp = insertFn
    if (isSubmit) {
      insertFn(formState.imgUrl);
      formState.imgUrl = '';
    }
  }
}

const handleSubmit = () => {
  isSubmit = true;
  editorConfig.MENU_CONF['uploadImage'].customBrowseAndUpload(insertTemp);
  isSubmit = false;
  visible.value = false;
}
// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
const getQueryVariable = (url: string, variable: string) => {
  var str = url.split('?');
  var query = str[1];
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}
const handleCreated = (editor: any) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}
const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
  (event: "update:visible", value: boolean): void;
  (event: "close"): void;
}>();

watch(
  () => valueHtml.value,
  () => {
    emit("update:raw", valueHtml.value);
    emit("update:content", valueHtml.value);
  }
);

</script>   
