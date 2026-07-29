## Web component tests

These tests cover the framework-neutral semantic adapter. Browser embedding is
registered lazily with `defineOpenAvatarElement()` so SSR and Node consumers can
import the package without a DOM.
