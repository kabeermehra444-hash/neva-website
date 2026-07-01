"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import "@/lib/console-capture";
import "@/utils/screenshot-capture";

function getSelector(el) {
  if (el.id) return "#" + el.id;
  const tag = el.tagName.toLowerCase();
  if (tag === "body" || tag === "html") return tag;
  const parent = el.parentElement;
  if (!parent) return tag;
  const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
  const index = siblings.indexOf(el);
  const nth = siblings.length > 1 ? ":nth-child(" + (index + 1) + ")" : "";
  return getSelector(parent) + " > " + tag + nth;
}

function getElementInfo(el) {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent || "").trim().slice(0, 120);
  const className = el.getAttribute("class") || "";
  const id = el.getAttribute("id") || "";
  const src = el.getAttribute("src") || "";
  const href = el.getAttribute("href") || "";
  const selector = getSelector(el);
  const rect = el.getBoundingClientRect();
  return { tag, text, className, id, src, href, selector, rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } };
}

let inspectorActive = false;
let hoveredEl = null;

function addHighlight(el) {
  removeHighlight();
  hoveredEl = el;
  el.dataset.appgenOutline = el.style.outline;
  el.dataset.appgenOutlineOffset = el.style.outlineOffset;
  el.dataset.appgenCursor = el.style.cursor;
  el.style.outline = "2px solid #3550FF";
  el.style.outlineOffset = "2px";
  el.style.cursor = "pointer";
}

function removeHighlight() {
  if (!hoveredEl) return;
  hoveredEl.style.outline = hoveredEl.dataset.appgenOutline || "";
  hoveredEl.style.outlineOffset = hoveredEl.dataset.appgenOutlineOffset || "";
  hoveredEl.style.cursor = hoveredEl.dataset.appgenCursor || "";
  delete hoveredEl.dataset.appgenOutline;
  delete hoveredEl.dataset.appgenOutlineOffset;
  delete hoveredEl.dataset.appgenCursor;
  hoveredEl = null;
}

export function AppGenProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "appgen:routeChanged", path: pathname }, "*");
  }, [pathname]);

  useEffect(() => {
    if (window.parent === window) return;
    function onMouseMove(e) {
      if (!inspectorActive) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === document.body || el === document.documentElement) { removeHighlight(); return; }
      if (el !== hoveredEl) addHighlight(el);
    }
    function onClick(e) {
      if (!inspectorActive) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.parent.postMessage({ type: "appgen:elementSelected", element: getElementInfo(el), route: pathnameRef.current }, "*");
      removeHighlight();
      inspectorActive = false;
    }
    function handleMsg(e) {
      if (e.data?.type === "appgen:inspectorOn") inspectorActive = true;
      if (e.data?.type === "appgen:inspectorOff") { inspectorActive = false; removeHighlight(); }
      if (e.data?.type === "appgen:navigate" && typeof e.data.path === "string") router.push(e.data.path);
    }
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("message", handleMsg);
    return () => {
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("message", handleMsg);
      removeHighlight();
      inspectorActive = false;
    };
  }, [router]);

  useEffect(() => {
    const hideErrorOverlay = () => {
      const selectors = [
        'nextjs-portal',
        '[data-nextjs-dialog]',
        '[data-nextjs-dialog-overlay]',
        '[data-nextjs-toast]',
        '#__next-build-indicator',
        '[data-nextjs-scroll]',
      ];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.display = 'none';
        });
      });
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent?.includes('Issue')) {
          btn.style.display = 'none';
          btn.parentElement && (btn.parentElement.style.display = 'none');
        }
      });
    };

    hideErrorOverlay();
    const interval = setInterval(hideErrorOverlay, 1000);
    const observer = new MutationObserver(hideErrorOverlay);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => { clearInterval(interval); observer.disconnect(); };
  }, []);

  return <>{children}</>;
}
