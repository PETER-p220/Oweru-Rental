/**
 * DOM mutation for i18n was removed — it conflicted with React reconciliation
 * (removeChild / insertBefore NotFoundError). Use `t()` / `tx()` / `<T>` in components instead.
 */
const I18nDomSync = () => null;

export default I18nDomSync;
