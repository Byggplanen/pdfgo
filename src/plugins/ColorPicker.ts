import L from "leaflet";

export type ColorClickCallback = (target: HTMLElement) => void;

export type ColorSelectCallback = (color: string) => void;

type ColorPickerProps = {
  map: L.Map;

  // Default color
  color: string;

  // Called when clicking the color picker button
  onClick?: ColorClickCallback;

  // Callback that is called when using the default color
  // picker, i.e., `onClick` is unset.
  onColorSelect?: ColorSelectCallback;
};

export class ColorPicker {
  static readonly CONTROL_NAME = "ColorPicker";

  private map: L.Map;

  private onClick?: ColorClickCallback;

  private onColorSelect?: ColorSelectCallback;

  constructor({ map, color, onClick, onColorSelect }: ColorPickerProps) {
    this.map = map;
    this.onClick = onClick;
    this.onColorSelect = onColorSelect;
    this.init(color);
  }

  private showDefaultColorPicker(target: HTMLElement, color: string) {
    const picker = document.createElement("input");
    picker.setAttribute("type", "color");
    picker.setAttribute("value", color);
    picker.classList.add("leaflet-color-picker");
    target.appendChild(picker);

    picker.addEventListener("click", (e) => {
      // Need to catch click event and stop the bubbling or
      // it will lead to an infinite loop
      e.stopPropagation();
    });

    picker.addEventListener("change", () => {
      this.onColorSelect?.(picker.value);
    });

    picker.addEventListener("blur", () => {
      picker.remove();
    });

    picker.focus();
    picker.click();
  }

  private init(color: string) {
    if (
      this.map.pm.Toolbar.getControlOrder().includes(ColorPicker.CONTROL_NAME)
    ) {
      return;
    }

    this.map.pm.Toolbar.createCustomControl({
      name: ColorPicker.CONTROL_NAME,
      block: "edit",
      title: "Change Shape Color",
      className: "leaflet-color-picker-button",
      toggle: false,
      // TODO: Remove when type is fixed
      // @ts-ignore
      afterClick: (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (this.onClick) {
          this.onClick(target);
          return;
        }

        this.showDefaultColorPicker(target, color);
      },
    });
  }
}

export function colorPicker(options: ColorPickerProps) {
  return new ColorPicker(options);
}
