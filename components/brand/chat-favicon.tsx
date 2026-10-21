"use client";

import { useEffect } from "react";

export function ChatFavicon() {
  useEffect(() => {
    const iconLinks = document.querySelectorAll<HTMLLinkElement>(
      "link[rel~='icon'], link[rel='shortcut icon']"
    );

    const previousHrefs: { el: HTMLLinkElement; href: string }[] = [];
    iconLinks.forEach((link) => {
      previousHrefs.push({ el: link, href: link.href });
      if (link.type === "image/svg+xml") {
        link.href = "/favicon-chat.svg";
      } else if (link.getAttribute("sizes") === "32x32") {
        link.href = "/favicon-chat-32x32.png";
      } else if (link.getAttribute("sizes") === "16x16") {
        link.href = "/favicon-chat-16x16.png";
      } else {
        link.href = "/favicon-chat.svg";
      }
    });

    const appleTouch = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    const prevApple = appleTouch?.href;
    if (appleTouch) {
      appleTouch.href = "/closeai-icon-white.png";
    }

    return () => {
      previousHrefs.forEach(({ el, href }) => {
        el.href = href;
      });
      if (appleTouch && prevApple) {
        appleTouch.href = prevApple;
      }
    };
  }, []);

  return null;
}
