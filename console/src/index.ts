import {definePlugin} from "@halo-dev/console-shared";
import {markRaw} from "vue";
import WangEditor from "./components/wangEditor.vue";

export default definePlugin({
  extensionPoints: {
    "editor:create": () => {
      return [
        {
          name: "wangEditor",
          displayName: "WangEditor",
          component: markRaw(WangEditor),
          rawType: "html",
        },
      ];
    },
  },
});
