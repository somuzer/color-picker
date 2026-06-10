import { defineCustomElement } from 'vue'
import ColorPickerComponent from './ColorPicker.ce.vue'

export const ColorPickerElement = defineCustomElement(ColorPickerComponent)
const registeredConstructors = new Map()

export function registerColorPicker(tagName = 'somuzer-color-picker') {
  if (!customElements.get(tagName)) {
    const ElementCtor = tagName === 'somuzer-color-picker'
      ? ColorPickerElement
      : class extends ColorPickerElement {}
    customElements.define(tagName, ElementCtor)
    registeredConstructors.set(tagName, ElementCtor)
  }
  return registeredConstructors.get(tagName) || customElements.get(tagName)
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  registerColorPicker()
}
