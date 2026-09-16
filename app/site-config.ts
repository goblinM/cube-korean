export const SITE_URL = new URL("https://cubekorean.top");
export const SITE_NAME = "CubeKorean";
export const SITE_DESCRIPTION = "通过看词拼写和听音默写，真正记住生活韩语。";

/** 测试 Worker 默认禁止索引；正式 Worker 可通过构建变量显式覆盖。 */
export const INDEXING_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_INDEXING
  ? process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"
  : process.env.CUBE_WORKER_NAME !== "cube-korean-dev";
