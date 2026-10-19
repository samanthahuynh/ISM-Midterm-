import { forwardRef, useState } from "react";

/**
 * Element with hover/focus style overrides. The UI template expresses hover
 * states inline (style-hover / style-focus); this keeps that design intact.
 */
export const H = forwardRef(function H({ as: Tag = "div", style, hover, focusStyle, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }, ref) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = !rest.disabled;
  return (
    <Tag
      ref={ref}
      style={{ ...style, ...(active && hovered ? hover : null), ...(focused ? focusStyle : null) }}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
});
