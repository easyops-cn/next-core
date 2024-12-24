interface MessageField {
  sender: string;
  type: string;
  [key: string]: any;
}

let initialize: boolean;
let origin: string;
let cachedUrl: string;

const LOCAL_HOST = /^https?:\/\/localhost(?:$|:)/;

export function start(_origin: string): void {
  if (
    location.origin !== _origin &&
    !LOCAL_HOST.test(location.origin) &&
    !LOCAL_HOST.test(_origin)
  ) {
    // 禁止除 localhost 之外的跨域消息
    return;
  }

  initialize = true;
  origin = _origin;

  if (cachedUrl) {
    sendMessage({
      sender: "next-core",
      type: "url-change",
      url: cachedUrl,
    });
  }
}

export function sendMessage(data: MessageField): void {
  window.parent.postMessage(data, origin);
}

export function sendUrlChange(data: Partial<MessageField>): void {
  if (window.self !== window.parent && data?.url !== cachedUrl) {
    cachedUrl = data.url;
    if (initialize) {
      sendMessage({
        sender: "next-core",
        type: "url-change",
        url: data.url,
      });
    }
  }
}
