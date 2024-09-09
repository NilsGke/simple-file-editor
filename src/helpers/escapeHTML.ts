const escapeHTML = (unsafe: string) =>
  unsafe.replace(/[&<>"'/]/g, (c) => `&#${c.charCodeAt(0)};`);

export default escapeHTML;
