<template>
  <div style="height: 100%">
    <Toolbar
      ref="toolbar"
      v-if="editorRef"
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      mode="default"
    />

    <Editor
      style="overflow-y: hidden"
      :style="editorStyles"
      :model-value="raw"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="onCreated"
      @onChange="onChange"
    />

    <AttachmentSelectorModal
      v-model:visible="attachmentSelectorModal"
      :accepts="attachmentAccepts"
      @select="onAttachmentsSelect"
    />

    <div style="height: 20px">
      <span>字数统计：</span>
      <span>{{ wordNumber }}</span>
      <span>字</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import type {
  IDomEditor,
  IEditorConfig,
  IToolbarConfig,
  SlateNode,
} from "@wangeditor/editor";
import type {AttachmentLike} from "@halo-dev/console-shared";
import {SlateTransforms} from "@wangeditor/editor";
import {useElementSize} from "@vueuse/core";

const editorRef = shallowRef<IDomEditor | null>(null);

type InsertFnType = (url: string, alt: string, href: string) => void

const props = withDefaults(
  defineProps<{
    raw?: string;
    content: string;
  }>(),
  {
    raw: "",
    content: "",
  }
);

const emit = defineEmits<{
  (event: "update:raw", value: string): void;
  (event: "update:content", value: string): void;
  (event: "update", value: string): void;
}>();

// 字数
const wordNumber = ref(0);

/**
 * 统计html中的字数
 * @param html
 */
const getWordNumber = (html: string) => {
  let text = html.replace(/<[^>]+>/g, ""); // 去掉 HTML 标签
  text = text.replace(/[!-~]+/g, "v"); //转换半角符号
  text = text.replace(/[a-zA-Z0-9]{2,}/g, "x"); //替换单词
  text = text.replace(/\s+/g, ""); // 去掉空格
  return text.length; // 返回字符串长度
};

// 工具栏配置
const toolbar = ref();
const { height: toolbarHeight } = useElementSize(toolbar);

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    // 菜单 key
    "blockquote",

    // 分割线
    "|",

    // 菜单 key
    "bold",
    "underline",
    "italic",

    // 菜单组，包含多个菜单
    {
      key: "group-more-style", // 必填，要以 group 开头
      title: "更多样式", // 必填
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>', // 可选
      menuKeys: ["through", "code", "sup", "sub", "clearStyle"], // 下级菜单 key ，必填
    },
    "color",
    "bgColor",
    "|",
    "fontSize",
    "fontFamily",
    "lineHeight",
    "|",
    "bulletedList",
    "numberedList",
    "todo",
    {
      key: "group-justify",
      title: "对齐",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
      menuKeys: [
        "justifyLeft",
        "justifyRight",
        "justifyCenter",
        "justifyJustify",
      ],
    },
    {
      key: "group-indent",
      title: "缩进",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
      menuKeys: ["indent", "delIndent"],
    },
    "|",
    "insertLink",
    {
      key: "group-image",
      title: "图片",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
      menuKeys: ["uploadImage"],
    },
    {
      key: "group-video",
      title: "视频",
      iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M981.184 160.096C837.568 139.456 678.848 128 512 128S186.432 139.456 42.816 160.096C15.296 267.808 0 386.848 0 512s15.264 244.16 42.816 351.904C186.464 884.544 345.152 896 512 896s325.568-11.456 469.184-32.096C1008.704 756.192 1024 637.152 1024 512s-15.264-244.16-42.816-351.904zM384 704V320l320 192-320 192z"></path></svg>',
      menuKeys: ["uploadVideo"],
    },
    "insertTable",
    "codeBlock",
    "divider",
    "|",
    "undo",
    "|",
    "fullScreen",
  ],
};

// 编辑框配置
const editorConfig: Partial<IEditorConfig> = {
  MENU_CONF: {
    uploadImage: {
      customBrowseAndUpload: () => {
        attachmentAccepts.value = ["image/*"];
        attachmentSelectorModal.value = true;
      },
      base64LimitSize: 10 * 1024 * 1024
    },
    uploadVideo: {
      customBrowseAndUpload: () => {
        attachmentAccepts.value = ["video/*"];
        attachmentSelectorModal.value = true;
      },
    },
  },
};

const editorStyles = computed(() => {
  return {
    // 1px = 工具栏底部 border
    // 20px = 底部字数统计
    height: `calc(100% - ${toolbarHeight.value}px - 1px - 20px)`,
  };
});

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});

const onCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

const onChange = (editor: IDomEditor) => {
  const editorHtml = editor.getHtml();
  emit("update:raw", editorHtml);
  emit("update:content", editorHtml);
  wordNumber.value = getWordNumber(editorHtml);

  if (editorHtml !== props.raw) {
    emit("update", editorHtml);
  }
};

// 附件
const attachmentSelectorModal = ref(false);
const attachmentAccepts = ref(["image/*"]);

const onAttachmentsSelect = (attachments: AttachmentLike[]) => {
  if (!editorRef.value) return;

  const contents: SlateNode[] = attachments
    .map((attachment) => {
      if (typeof attachment === "string") {
        return {
          type: "image",
          src: attachment,
          children: [{ text: "" }],
        };
      }

      if ("url" in attachment) {
        return {
          type: "image",
          src: attachment.url,
          alt: attachment.type,
          children: [{ text: "" }],
        };
      }

      if ("spec" in attachment) {
        const { mediaType, displayName } = attachment.spec;
        const { permalink } = attachment.status || {};
        if (mediaType?.startsWith("image/")) {
          return {
            type: "image",
            src: permalink,
            alt: displayName,
            children: [{ text: "" }],
          };
        }

        if (mediaType?.startsWith("video/")) {
          return {
            type: "video",
            src: permalink,
            children: [{ text: "" }],
          };
        }

        if (mediaType?.startsWith("audio/")) {
          return {
            type: "audio",
            src: permalink,
            children: [{ text: "" }],
          };
        }

        return {
          type: "link",
          url: permalink,
          children: [
            {
              text: displayName,
            },
          ],
        };
      }
    })
    .filter(Boolean) as SlateNode[];

  SlateTransforms.insertNodes(editorRef.value, contents);
};
</script>

<style>
.w-e-textarea-video-container {
  display: flex !important;
  justify-content: center !important;
}

.w-e-full-screen-container {
  z-index: 9999;
}
</style>
