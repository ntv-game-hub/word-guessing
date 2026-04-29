import { tidyCode } from "./wordGuessing";

export function getQueryCode() {
  return tidyCode(new URLSearchParams(window.location.search).get("code") || "");
}
