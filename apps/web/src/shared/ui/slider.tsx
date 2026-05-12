"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";

type SliderProps = Omit<
  React.ComponentProps<"input">,
  "defaultValue" | "onChange" | "type" | "value"
> & {
  defaultValue?: number[];
  max?: number;
  min?: number;
  onValueChange?: (value: number[]) => void;
  orientation?: "horizontal" | "vertical";
  value?: number[];
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  orientation = "horizontal",
  disabled,
  ...props
}: SliderProps): React.JSX.Element {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;
  const percent = ((currentValue - min) / (max - min)) * 100;
  const rangeWidth = `${Number.isFinite(percent) ? percent : 0}%`;

  return (
    <div
      data-slot="slider"
      data-disabled={disabled ? "" : undefined}
      data-orientation={orientation}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
    >
      <div
        data-slot="slider-track"
        data-orientation={orientation}
        className="bg-muted pointer-events-none absolute grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
      >
        <div
          data-slot="slider-range"
          className="bg-primary absolute h-full"
          style={{ width: rangeWidth }}
        />
      </div>
      <input
        {...props}
        type="range"
        min={min}
        max={max}
        disabled={disabled}
        defaultValue={defaultValue?.[0]}
        value={value?.[0]}
        onChange={(event) =>
          onValueChange?.([event.currentTarget.valueAsNumber])
        }
        className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent disabled:pointer-events-none disabled:opacity-50 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
      />
    </div>
  );
}

export { Slider };
